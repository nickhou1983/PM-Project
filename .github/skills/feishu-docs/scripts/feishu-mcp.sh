#!/bin/bash
# 飞书远程 MCP 调用脚本
# 用法:
#   feishu-mcp.sh <method> [tool_name] [arguments_json | -]
#   feishu-mcp.sh tools/call <tool_name> --content-file <file> [extra_args_json]
#
# 参数传入方式 (tools/call):
#   1. 直接传参:  feishu-mcp.sh tools/call create-doc '{"title":"标题"}'
#   2. stdin 管道: echo '{"title":"标题","markdown":"..."}' | feishu-mcp.sh tools/call create-doc -
#   3. 文件读取:   feishu-mcp.sh tools/call create-doc --content-file doc.md '{"title":"标题"}'
#      自动将文件内容 JSON 转义后注入 markdown 字段
#
# 环境变量 (至少设置一个):
#   FEISHU_MCP_UAT  - User Access Token (用户身份)
#   FEISHU_MCP_TAT  - Tenant Access Token (应用身份)
#
# 环境变量 (可选):
#   FEISHU_MCP_TOOLS - 允许的工具列表, 逗号分隔 (默认: 全部文档工具)
#
# 示例:
#   feishu-mcp.sh initialize
#   feishu-mcp.sh tools/list
#   feishu-mcp.sh tools/call fetch-doc '{"doc_id":"https://xxx.feishu.cn/docx/xxx"}'
#   feishu-mcp.sh tools/call search-doc '{"query":"项目规范"}'
#   echo '{"title":"PRD","markdown":"# 标题\n正文"}' | feishu-mcp.sh tools/call create-doc -
#   feishu-mcp.sh tools/call create-doc --content-file docs/prd.md '{"title":"PRD文档"}'

set -euo pipefail

MCP_ENDPOINT="https://mcp.feishu.cn/mcp"

# 默认工具列表: 云文档 + 通用工具
DEFAULT_TOOLS="search-doc,fetch-doc,create-doc,update-doc,list-docs,get-comments,add-comments,search-user,get-user,fetch-file"
ALLOWED_TOOLS="${FEISHU_MCP_TOOLS:-$DEFAULT_TOOLS}"

# 构建认证头
AUTH_HEADER=""
if [[ -n "${FEISHU_MCP_UAT:-}" ]]; then
  AUTH_HEADER="X-Lark-MCP-UAT: ${FEISHU_MCP_UAT}"
elif [[ -n "${FEISHU_MCP_TAT:-}" ]]; then
  AUTH_HEADER="X-Lark-MCP-TAT: ${FEISHU_MCP_TAT}"
else
  echo "错误: 请设置环境变量 FEISHU_MCP_UAT 或 FEISHU_MCP_TAT" >&2
  echo "  export FEISHU_MCP_UAT='u-xxxxxxxx'  # 用户身份" >&2
  echo "  export FEISHU_MCP_TAT='t-xxxxxxxx'  # 应用身份" >&2
  exit 1
fi

METHOD="${1:?用法: feishu-mcp.sh <initialize|tools/list|tools/call> [tool_name] [arguments_json | -]}"
TOOL_NAME="${2:-}"

# ── 解析 arguments（支持三种输入方式）──────────────────────────
CONTENT_FILE=""
EXTRA_ARGS=""

# 检查是否使用 --content-file 模式
if [[ "${3:-}" == "--content-file" ]]; then
  CONTENT_FILE="${4:?错误: --content-file 需要指定文件路径}"
  EXTRA_ARGS="${5:-\{\}}"
  if [[ ! -f "$CONTENT_FILE" ]]; then
    echo "错误: 文件不存在: $CONTENT_FILE" >&2
    exit 1
  fi
elif [[ "${3:-}" == "-" ]]; then
  # stdin 管道模式: 从 stdin 读取完整 arguments JSON
  ARGUMENTS=$(cat)
elif [[ -z "${3:-}" ]] && [[ ! -t 0 ]]; then
  # 无 $3 且 stdin 非 tty: 自动从管道读取
  ARGUMENTS=$(cat)
else
  # 直接传参模式（向后兼容）
  ARGUMENTS="${3:-\{\}}"
fi

# --content-file 模式: 读取文件并安全注入 markdown 字段
if [[ -n "$CONTENT_FILE" ]]; then
  ESCAPED_CONTENT=$(python3 -c "
import json, sys
with open(sys.argv[1], 'r', encoding='utf-8') as f:
    print(json.dumps(f.read()))
" "$CONTENT_FILE")
  # 将 markdown 字段合并到 extra_args JSON 中
  ARGUMENTS=$(python3 -c "
import json, sys
extra = json.loads(sys.argv[1])
extra['markdown'] = json.loads(sys.argv[2])
print(json.dumps(extra))
" "$EXTRA_ARGS" "$ESCAPED_CONTENT")
fi

# 构建 JSON-RPC 请求体
REQUEST_ID=$((RANDOM % 10000 + 1))

case "$METHOD" in
  initialize)
    BODY=$(cat <<EOF
{"jsonrpc":"2.0","id":${REQUEST_ID},"method":"initialize"}
EOF
)
    ;;
  tools/list)
    BODY=$(cat <<EOF
{"jsonrpc":"2.0","id":${REQUEST_ID},"method":"tools/list"}
EOF
)
    ;;
  tools/call)
    if [[ -z "$TOOL_NAME" ]]; then
      echo "错误: tools/call 需要指定工具名称" >&2
      echo "  feishu-mcp.sh tools/call <tool_name> '<arguments_json>'" >&2
      exit 1
    fi
    # 使用 python3 构建完整的 JSON-RPC body，避免 shell 转义问题
    BODY=$(python3 -c "
import json, sys
body = {
    'jsonrpc': '2.0',
    'id': int(sys.argv[1]),
    'method': 'tools/call',
    'params': {
        'name': sys.argv[2],
        'arguments': json.loads(sys.argv[3])
    }
}
print(json.dumps(body, ensure_ascii=False))
" "$REQUEST_ID" "$TOOL_NAME" "$ARGUMENTS")
    ;;
  *)
    echo "错误: 未知方法 '$METHOD'" >&2
    echo "支持的方法: initialize, tools/list, tools/call" >&2
    exit 1
    ;;
esac

# 发送请求
RESPONSE=$(curl -sS -w "\n%{http_code}" \
  -X POST "$MCP_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -H "X-Lark-MCP-Allowed-Tools: ${ALLOWED_TOOLS}" \
  -d "$BODY")

# 分离响应体和状态码
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

# 检查 HTTP 状态码
if [[ "$HTTP_CODE" -ge 400 ]]; then
  echo "HTTP 错误 ${HTTP_CODE}:" >&2
  echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY" >&2
  exit 1
fi

# 格式化输出
echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
