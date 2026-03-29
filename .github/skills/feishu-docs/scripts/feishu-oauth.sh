#!/bin/bash
# 飞书 OAuth 认证脚本 — 获取 user_access_token
#
# 完整流程：
#   1. 启动本地 HTTP 服务器接收回调
#   2. 打开浏览器让用户授权
#   3. 接收授权码 code
#   4. 用 code 换取 user_access_token
#   5. 输出 token 并提示用户设置环境变量
#
# 环境变量（必须）：
#   FEISHU_APP_ID     - 飞书自建应用 App ID
#   FEISHU_APP_SECRET - 飞书自建应用 App Secret
#
# 用法：
#   ./feishu-oauth.sh
#   ./feishu-oauth.sh --port 9090              # 自定义回调端口
#   ./feishu-oauth.sh --scope "docx:document:readonly wiki:wiki:readonly"
#
# 前置条件：
#   1. 在飞书开放平台创建自建应用
#   2. 在「安全设置」中添加重定向 URL: http://localhost:8080/callback
#   3. 在「权限管理」中申请所需 API 权限

set -euo pipefail

# ─── 参数解析 ───
PORT=8080
# 飞书远程 MCP 所需的文档相关权限
DEFAULT_SCOPE="offline_access search:docs:read docx:document:readonly docx:document wiki:wiki:readonly docs:document.comment:read docs:document.comment:create contact:user:search contact:contact.base:readonly"
SCOPE="${DEFAULT_SCOPE}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port) PORT="$2"; shift 2 ;;
    --scope) SCOPE="$2"; shift 2 ;;
    --help|-h)
      echo "用法: feishu-oauth.sh [--port PORT] [--scope SCOPES]"
      echo ""
      echo "选项:"
      echo "  --port PORT    本地回调服务器端口 (默认: 8080)"
      echo "  --scope SCOPES 请求的权限范围，空格分隔"
      echo ""
      echo "环境变量:"
      echo "  FEISHU_APP_ID     飞书应用 App ID (必须)"
      echo "  FEISHU_APP_SECRET 飞书应用 App Secret (必须)"
      exit 0
      ;;
    *) echo "未知参数: $1"; exit 1 ;;
  esac
done

# ─── 检查环境变量 ───
APP_ID="${FEISHU_APP_ID:?请设置环境变量 FEISHU_APP_ID（飞书应用 App ID）}"
APP_SECRET="${FEISHU_APP_SECRET:?请设置环境变量 FEISHU_APP_SECRET（飞书应用 App Secret）}"

REDIRECT_URI="http://localhost:${PORT}/callback"
REDIRECT_URI_ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${REDIRECT_URI}', safe=''))")

# ─── 生成 state 防 CSRF ───
STATE=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

# ─── 构造授权 URL ───
SCOPE_ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${SCOPE}', safe=''))")
AUTH_URL="https://accounts.feishu.cn/open-apis/authen/v1/authorize?client_id=${APP_ID}&response_type=code&redirect_uri=${REDIRECT_URI_ENCODED}&scope=${SCOPE_ENCODED}&state=${STATE}"

echo "════════════════════════════════════════════════════"
echo "  飞书 OAuth 授权流程"
echo "════════════════════════════════════════════════════"
echo ""
echo "📋 应用 ID:     ${APP_ID}"
echo "🔗 回调地址:    ${REDIRECT_URI}"
echo "🔑 请求权限:    ${SCOPE}"
echo ""
echo "⚠️  请确保已在飞书开放平台「安全设置」中添加重定向 URL:"
echo "   ${REDIRECT_URI}"
echo ""

# ─── 创建临时回调服务器（Python） ───
CALLBACK_SCRIPT=$(mktemp /tmp/feishu_oauth_XXXXXX.py)
trap "rm -f ${CALLBACK_SCRIPT}" EXIT

cat > "${CALLBACK_SCRIPT}" << 'PYEOF'
import http.server
import urllib.parse
import sys
import json

PORT = int(sys.argv[1])
EXPECTED_STATE = sys.argv[2]

class OAuthHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path != "/callback":
            self.send_response(404)
            self.end_headers()
            return

        params = urllib.parse.parse_qs(parsed.query)

        # 检查是否授权被拒绝
        if "error" in params:
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write("❌ 授权被拒绝".encode("utf-8"))
            print(f"\n❌ 用户拒绝授权: {params.get('error', ['unknown'])[0]}", file=sys.stderr)
            # Write empty result to signal failure
            print(json.dumps({"error": params.get("error", ["unknown"])[0]}))
            sys.stdout.flush()
            raise SystemExit(1)

        code = params.get("code", [None])[0]
        state = params.get("state", [None])[0]

        if not code:
            self.send_response(400)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write("❌ 未收到授权码".encode("utf-8"))
            raise SystemExit(1)

        # 验证 state 防止 CSRF
        if state != EXPECTED_STATE:
            self.send_response(400)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write("❌ state 不匹配，可能存在安全风险".encode("utf-8"))
            print(f"\n❌ state 不匹配: expected={EXPECTED_STATE}, got={state}", file=sys.stderr)
            raise SystemExit(1)

        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write("✅ 授权成功！请返回终端查看结果。可以关闭此窗口。".encode("utf-8"))

        # 输出 code 到 stdout（供父进程读取）
        print(json.dumps({"code": code}))
        sys.stdout.flush()
        raise SystemExit(0)

    def log_message(self, format, *args):
        pass  # 静默日志

server = http.server.HTTPServer(("localhost", PORT), OAuthHandler)
print(f"listening", file=sys.stderr)
server.handle_request()
PYEOF

# ─── 启动回调服务器（后台） ───
echo "🚀 启动本地回调服务器 (端口 ${PORT})..."

# 使用管道捕获 Python 脚本的 stdout 输出（即 code）
RESULT_FILE=$(mktemp /tmp/feishu_result_XXXXXX.json)
trap "rm -f ${CALLBACK_SCRIPT} ${RESULT_FILE}" EXIT

python3 "${CALLBACK_SCRIPT}" "${PORT}" "${STATE}" > "${RESULT_FILE}" 2>/dev/null &
SERVER_PID=$!

# 等待服务器启动
sleep 1

# 检查服务器是否还在运行
if ! kill -0 ${SERVER_PID} 2>/dev/null; then
  echo "❌ 回调服务器启动失败，端口 ${PORT} 可能被占用" >&2
  exit 1
fi

# ─── 打开浏览器 ───
echo "🌐 打开浏览器进行授权..."
echo ""
echo "   如果浏览器未自动打开，请手动访问以下链接："
echo "   ${AUTH_URL}"
echo ""

if [[ "$(uname)" == "Darwin" ]]; then
  open "${AUTH_URL}" 2>/dev/null || true
elif command -v xdg-open &>/dev/null; then
  xdg-open "${AUTH_URL}" 2>/dev/null || true
fi

echo "⏳ 等待用户授权..."

# 等待回调服务器完成
wait ${SERVER_PID} 2>/dev/null || true

# ─── 读取授权码 ───
if [[ ! -s "${RESULT_FILE}" ]]; then
  echo "❌ 未收到授权回调" >&2
  exit 1
fi

CODE=$(python3 -c "import json; d=json.load(open('${RESULT_FILE}')); print(d.get('code',''))")
if [[ -z "$CODE" ]]; then
  echo "❌ 获取授权码失败" >&2
  cat "${RESULT_FILE}" >&2
  exit 1
fi

echo ""
echo "✅ 收到授权码: ${CODE:0:20}..."

# ─── 第 2 步：用授权码换取 user_access_token ───
echo ""
echo "🔄 正在换取 user_access_token..."

TOKEN_RESPONSE=$(curl -sS -X POST "https://open.feishu.cn/open-apis/authen/v2/oauth/token" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "{
    \"grant_type\": \"authorization_code\",
    \"client_id\": \"${APP_ID}\",
    \"client_secret\": \"${APP_SECRET}\",
    \"code\": \"${CODE}\",
    \"redirect_uri\": \"${REDIRECT_URI}\"
  }")

# 解析响应
ERROR_CODE=$(echo "${TOKEN_RESPONSE}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('code', d.get('error','')))" 2>/dev/null || echo "parse_error")

if [[ "$ERROR_CODE" != "0" ]]; then
  echo "❌ 获取 token 失败:" >&2
  echo "${TOKEN_RESPONSE}" | python3 -m json.tool 2>/dev/null || echo "${TOKEN_RESPONSE}" >&2
  exit 1
fi

# 提取 token 信息
ACCESS_TOKEN=$(echo "${TOKEN_RESPONSE}" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
EXPIRES_IN=$(echo "${TOKEN_RESPONSE}" | python3 -c "import sys,json; print(json.load(sys.stdin)['expires_in'])")
TOKEN_SCOPE=$(echo "${TOKEN_RESPONSE}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('scope',''))")
REFRESH_TOKEN=$(echo "${TOKEN_RESPONSE}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('refresh_token',''))" 2>/dev/null || echo "")

echo ""
echo "════════════════════════════════════════════════════"
echo "  ✅ 认证成功！"
echo "════════════════════════════════════════════════════"
echo ""
echo "📋 Token 信息:"
echo "   有效期:   ${EXPIRES_IN} 秒"
echo "   权限:     ${TOKEN_SCOPE}"
if [[ -n "$REFRESH_TOKEN" ]]; then
  echo "   Refresh:  ${REFRESH_TOKEN:0:20}..."
fi
echo ""
echo "🔧 请运行以下命令设置环境变量:"
echo ""
echo "   export FEISHU_MCP_UAT=\"${ACCESS_TOKEN}\""
echo ""
echo "   或添加到 ~/.zshrc / ~/.bashrc 中持久化。"
echo ""

# 可选：保存到文件
TOKEN_FILE="$HOME/.feishu_mcp_token"
echo "${ACCESS_TOKEN}" > "${TOKEN_FILE}"
chmod 600 "${TOKEN_FILE}"
echo "💾 Token 已保存到 ${TOKEN_FILE}（权限 600）"
echo "   可通过以下方式加载:"
echo "   export FEISHU_MCP_UAT=\$(cat ${TOKEN_FILE})"
