---
name: feishu-docs
description: "通过飞书远程 MCP 服务查询和操作飞书云文档。支持搜索文档、读取文档内容、创建/更新文档、查看知识库目录、获取评论等。触发条件：(1) 查询飞书文档，(2) 搜索飞书云文档内容，(3) 读取飞书文档/知识库，(4) 创建或更新飞书文档，(5) 同步飞书文档内容到本地，(6) 查看飞书文档评论。"
---

# 飞书文档查询 Skill（远程 MCP 方案）

通过飞书远程 MCP 服务（`https://mcp.feishu.cn/mcp`）与飞书云文档交互。

## 前置配置

### 环境变量

使用前必须设置认证凭证（二选一）：

```bash
# 方式 1: 用户身份（推荐，可搜索文档）
export FEISHU_MCP_UAT="u-xxxxxxxxxxxxxxxxxxxxxxxx"

# 方式 2: 应用身份（服务端调用）
export FEISHU_MCP_TAT="t-xxxxxxxxxxxxxxxxxxxxxxxx"
```

获取方式：
- **UAT**：在飞书开放平台创建自建应用 → 申请权限 → 通过 OAuth 或 API 调试台获取 `user_access_token`
- **TAT**：创建自建应用 → 使用 App ID + App Secret 调用 `/open-apis/auth/v3/tenant_access_token/internal` 获取

### 一键获取 UAT（OAuth 认证脚本）

本 Skill 提供了 `feishu-oauth.sh` 脚本，完整实现 OAuth 2.0 授权码流程：

**前置条件：**
1. 在 [飞书开放平台](https://open.feishu.cn/app) 创建自建应用
2. 在应用的「安全设置」中添加重定向 URL：`http://localhost:8080/callback`
3. 在「权限管理」中申请下方表格中的 API 权限
4. 设置环境变量：

```bash
export FEISHU_APP_ID="cli_xxxxxxxx"       # 应用 App ID
export FEISHU_APP_SECRET="xxxxxxxx"       # 应用 App Secret
```

**执行认证：**

```bash
~/.claude/skills/feishu-docs/scripts/feishu-oauth.sh
```

脚本会自动：
1. 启动本地 HTTP 服务器（默认端口 8080）接收 OAuth 回调
2. 打开浏览器跳转到飞书授权页面
3. 用户点击「授权」后，接收授权码 `code`（有效期 5 分钟，仅可使用一次）
4. 用 `code` + `client_id` + `client_secret` 调用 `POST https://open.feishu.cn/open-apis/authen/v2/oauth/token` 换取 `user_access_token`
5. 输出 token 并保存到 `~/.feishu_mcp_token`

**自定义选项：**

```bash
# 自定义端口
~/.claude/skills/feishu-docs/scripts/feishu-oauth.sh --port 9090

# 自定义权限范围
~/.claude/skills/feishu-docs/scripts/feishu-oauth.sh --scope "offline_access docx:document:readonly"
```

**认证成功后设置环境变量：**

```bash
export FEISHU_MCP_UAT=$(cat ~/.feishu_mcp_token)
```

### 所需权限

在飞书开放平台为自建应用申请以下权限：

| 权限 | Scope | 用途 |
|------|-------|------|
| 搜索云文档 | `search:docs:read` | search-doc |
| 查看新版文档 | `docx:document:readonly` | fetch-doc |
| 管理新版文档 | `docx:document` | create-doc, update-doc |
| 查看知识库 | `wiki:wiki:readonly` | list-docs, fetch-doc |
| 获取文档评论 | `docs:document.comment:read` | get-comments |
| 添加文档评论 | `docs:document.comment:create` | add-comments |
| 搜索用户 | `contact:user:search` | search-user |
| 获取通讯录信息 | `contact:contact.base:readonly` | get-user |
| 下载文档附件 | `docs:document.media:download` | fetch-file |

## 辅助脚本

本 Skill 提供两种脚本调用飞书远程 MCP：

### Shell 脚本

```bash
SCRIPT="$HOME/.claude/skills/feishu-docs/scripts/feishu-mcp.sh"
```

### Python 脚本（推荐）

> ✅ **推荐用于创建/更新文档**：Python 的 `json.dumps()` 能可靠处理 Markdown 中的换行、引号、反引号等特殊字符，避免 Shell JSON 转义问题。

```bash
PY_SCRIPT="$HOME/.claude/skills/feishu-docs/scripts/feishu-mcp.py"
```

**基本用法：**

```bash
# 初始化连接
python3 "$PY_SCRIPT" initialize

# 列出可用工具
python3 "$PY_SCRIPT" tools/list

# 调用工具（直接传 JSON 参数）
python3 "$PY_SCRIPT" tools/call search-doc '{"query": "编码规范"}'

# 从文件读取内容创建文档（自动处理 JSON 转义）
python3 "$PY_SCRIPT" tools/call create-doc --content-file docs/prd.md '{"title": "PRD 文档"}'

# 长文档批量上传（自动分批：create → overwrite → append）
python3 "$PY_SCRIPT" tools/call create-doc --batch-file docs/long-doc.md --title "长文档标题"

# 指定知识空间节点
python3 "$PY_SCRIPT" tools/call create-doc --batch-file docs/prd.md --title "PRD" --wiki-node "节点token"

# 调试模式（显示请求/响应详情）
FEISHU_MCP_DEBUG=1 python3 "$PY_SCRIPT" tools/call fetch-doc '{"doc_id": "xxxxxx"}'
```

**`--content-file` vs `--batch-file`：**

| 参数 | 说明 | 适用场景 |
|------|------|---------|
| `--content-file` | 读取文件内容作为 `markdown` 参数，单次请求发送 | 短文档（<4000 字符） |
| `--batch-file` | 自动按 `## ` 章节分割，分批创建+写入 | 长文档（>4000 字符） |

## 工作流程

### 步骤 1: 确认认证状态

在执行任何操作前，先检查环境变量是否已设置：

```bash
# 检查认证
if [[ -n "${FEISHU_MCP_UAT:-}" ]] || [[ -n "${FEISHU_MCP_TAT:-}" ]]; then
  echo "✅ 认证已配置"
else
  echo "❌ 请先设置 FEISHU_MCP_UAT 或 FEISHU_MCP_TAT"
fi
```

如果未设置，提示用户设置环境变量后再继续。

### 步骤 2: 初始化连接

```bash
"$SCRIPT" initialize
```

确认返回 `protocolVersion` 和 `serverInfo` 即表示连接成功。若连接失败，根据`一键获取 UAT`流程完成认证后再试。

### 步骤 3: 执行文档操作

根据用户需求选择对应工具。

## 支持的操作

### 🔍 搜索文档

搜索飞书云文档（仅支持 UAT）：

```bash
"$SCRIPT" tools/call search-doc '{"query": "搜索关键词"}'
```

适用场景：
- 查找包含特定关键词的文档
- 回顾特定成员的工作产出
- 为报告撰写收集内部资料

### 📖 读取文档内容

根据文档 ID 或链接获取完整内容（支持分段读取超长文档）：

```bash
"$SCRIPT" tools/call fetch-doc '{"doc_id": "xxxxxx"}'
```

也支持传入文档 URL（自动解析）：

```bash
"$SCRIPT" tools/call fetch-doc '{"doc_id": "https://xxx.feishu.cn/docx/xxxxxx"}'
```

适用场景：
- 让 AI 阅读文档并进行总结/翻译/问答
- 跨文档信息整合
- 将飞书文档内容同步到本地

### 📝 创建文档

在"我的文档库"或指定知识空间下创建新文档。

> ⚠️ **参数说明**：内容参数名为 `markdown`（不是 `content`）；位置参数为 `wiki_node` / `wiki_space` / `folder_token` 三选一（互斥）。

#### 方式 1: 短内容 — 直接传参

适用于简短内容（无复杂格式、无换行）：

```bash
"$SCRIPT" tools/call create-doc '{"title": "文档标题", "markdown": "简短的纯文本内容"}'
```

在知识空间下创建：

```bash
"$SCRIPT" tools/call create-doc '{"title": "PRD 文档", "markdown": "内容", "wiki_node": "知识空间节点 token"}'
```

#### 方式 2: Python 脚本上传本地文件（推荐）

对于包含换行、引号等特殊字符的长 Markdown 文件，使用 Python 构造 JSON 并通过 curl 管道发送：

```bash
export FEISHU_MCP_UAT=$(cat ~/.feishu_mcp_token)
python3 -c "
import json, sys
content = open('docs/prd.md').read()
body = json.dumps({
    'jsonrpc': '2.0', 'id': 1,
    'method': 'tools/call',
    'params': {
        'name': 'create-doc',
        'arguments': {'title': 'PRD 文档', 'markdown': content}
    }
})
sys.stdout.write(body)
" | curl -sS -X POST 'https://mcp.feishu.cn/mcp' \\
  -H 'Content-Type: application/json' \\
  -H \"X-Lark-MCP-UAT: \${FEISHU_MCP_UAT}\" \\
  -H 'X-Lark-MCP-Allowed-Tools: create-doc,update-doc' \\
  -d @-
```

> ⚠️ **长文档最佳实践**：对于超过 4000 字符的文档，推荐先用 `create-doc` 只传 `title`（不传 `markdown`）创建空文档，然后用 `update-doc` 的 `overwrite` + `append` 模式分批写入内容。详见下方「长文档分批写入」。

适用场景：
- 将本地 Markdown 文件同步到飞书
- 将 AI 对话结果沉淀为飞书文档
- 自动生成会议纪要、技术文档、PRD
- 批量创建模板文档

### ✏️ 更新文档

> ⚠️ **参数说明**：文档 ID 参数名为 `doc_id`（不是 `docID`）；内容参数名为 `markdown`（不是 `content`）；`mode` 参数**必填**。

**支持的 mode 值**：

| mode | 说明 |
|------|------|
| `overwrite` | 覆盖文档全部内容 |
| `append` | 在文档末尾追加内容 |
| `replace_range` | 替换指定范围的内容 |
| `replace_all` | 替换所有匹配内容 |
| `insert_after` | 在指定位置后插入 |
| `delete_range` | 删除指定范围 |

#### 覆盖写入

```bash
"$SCRIPT" tools/call update-doc '{"doc_id": "文档ID", "markdown": "新内容", "mode": "overwrite"}'
```

#### 追加写入

```bash
"$SCRIPT" tools/call update-doc '{"doc_id": "文档ID", "markdown": "追加内容", "mode": "append"}'
```

#### 长文档分批写入

对于超长文档（>4000 字符），推荐以下流程：

1. **创建空文档**：`create-doc` 只传 `title`
2. **第一批内容**：`update-doc` mode=`overwrite` 写入前半部分
3. **后续内容**：`update-doc` mode=`append` 逐批追加

```python
# 示例：Python 分批上传
import json, subprocess, os

uat = open(os.path.expanduser('~/.feishu_mcp_token')).read().strip()
content = open('docs/long-doc.md').read()

# 按 ## 章节分割，每批 ~4000 字符
chunks = split_by_sections(content, max_chars=4000)

for i, chunk in enumerate(chunks):
    mode = 'overwrite' if i == 0 else 'append'
    call_mcp('update-doc', {'doc_id': DOC_ID, 'markdown': chunk, 'mode': mode})
```

适用场景：
- 长文本续写（分批追加突破单次输出限制）
- 内容修正与润色
- 结构化插入（在特定章节后追加内容）

### 📂 列出知识库文档

获取指定知识空间节点下的文档列表：

```bash
"$SCRIPT" tools/call list-docs '{"wiki_token": "知识空间节点token"}'
```

适用场景：
- 浏览项目文件夹下的文档
- 在批量处理前获取文档清单

### 💬 查看评论

获取文档中的全文评论和划词评论：

```bash
"$SCRIPT" tools/call get-comments '{"doc_id": "文档ID"}'
```

支持筛选评论类型：`all`（默认）、`whole`（全文评论）、`segment`（划词评论）：

```bash
"$SCRIPT" tools/call get-comments '{"doc_id": "文档ID", "comment_type": "segment"}'
```

### 💬 添加评论

在文档中添加全文评论（使用 `elements` 富文本数组，非简单 `content` 字符串）：

```bash
"$SCRIPT" tools/call add-comments '{"doc_id": "文档ID", "elements": [{"type": "text", "text": "评论内容"}]}'
```

支持 @用户 和超链接（需先用 `search-user` 获取 `open_id`）：

```bash
"$SCRIPT" tools/call add-comments '{"doc_id": "文档ID", "elements": [{"type": "text", "text": "请查看 "}, {"type": "mention", "open_id": "ou_xxx"}, {"type": "link", "url": "https://example.com"}]}'
```

### 👤 搜索用户

根据关键词搜索企业内用户（仅 UAT）：

```bash
"$SCRIPT" tools/call search-user '{"query": "姓名或邮箱"}'
```

### 📎 获取文件

获取文档中嵌入的图片或附件（≤5MB）：

```bash
"$SCRIPT" tools/call fetch-file '{"resource_token": "文件token"}'
```

获取画板内容：

```bash
"$SCRIPT" tools/call fetch-file '{"resource_token": "画板token", "type": "whiteboard"}'
```

## 输出处理

### 文档内容提取

当用户要求读取文档时，执行以下流程：

1. 调用 `fetch-doc` 获取原始内容
2. 从 JSON 响应中提取 `result.content[0].text` 字段
3. 解析文档结构，以清晰格式展示给用户
4. 如果文档过长，提示用户是否需要分段阅读

### 搜索结果展示

当搜索文档时：

1. 调用 `search-doc` 获取结果
2. 以表格形式展示：文档标题、链接、创建者、更新时间
3. 询问用户是否要查看某个具体文档的内容

### 错误处理

| 错误码 | 含义 | 处理方式 |
|--------|------|---------|
| -32011 | 缺少凭证 | 提示用户设置 `FEISHU_MCP_UAT` 或 `FEISHU_MCP_TAT` |
| -32003 | Token 过期 | 提示用户重新获取 Token |
| -32601 | 工具不存在 | 检查工具名称拼写 |
| -32030 | 频率限制 | 等待后重试 |
| -32603 | 服务端错误 | 重试，持续失败则报告 |
| -32700 | 无效 JSON | 检查请求体 JSON 格式，长文本建议用 Python 构造 |
| VALIDATION:1002 | 参数校验失败 | 检查必填参数（如 `mode`、`markdown`）是否遗漏 |

## 参数速查表

> ⚠️ 以下参数名经实际 API 验证，与部分旧文档可能不同。

| 工具 | 关键参数 | 说明 |
|------|---------|------|
| `create-doc` | `title`, `markdown`, `wiki_node`/`wiki_space`/`folder_token` | 内容用 `markdown`（非 `content`），位置参数三选一互斥 |
| `update-doc` | `doc_id`, `markdown`, `mode` | `mode` **必填**（overwrite/append/replace_range 等） |
| `fetch-doc` | `doc_id`, `limit`, `offset` | `doc_id` 支持文档 ID 或 URL 自动解析 |
| `get-comments` | `doc_id`, `comment_type`, `page_size` | `comment_type`: all/whole/segment |
| `add-comments` | `doc_id`, `elements` | `elements` 为富文本数组（type: text/mention/link） |
| `fetch-file` | `resource_token`, `type` | `type`: media(默认)/whiteboard |
| `search-doc` | `query` | 仅 UAT 可用 |
| `search-user` | `query` | 仅 UAT 可用 |

## 注意事项

- `search-doc` **仅支持 UAT**（用户身份），TAT 无法搜索
- TAT 调用文档操作时，需要确保应用已获得目标文档的授权
- 文档内容中暂不支持多维表格、电子表格、OKR 等嵌入内容
- `fetch-file` 文件大小限制 5MB
- MCP 工具的入参/出参格式可能灵活调整，不要硬编码依赖其结构
- **创建/更新文档时，内容含换行、引号、反引号等特殊字符，务必使用 Python 构造 JSON 后通过 curl 管道发送**，不要将长 Markdown 直接拼入 Shell 参数
- **长文档（>4000 字符）务必分批写入**：先 `create-doc` 建空文档，再 `update-doc` overwrite + append 分批写入
- `update-doc` 的 `mode` 参数是**必填**的，遗漏会返回 VALIDATION:1002 错误
- 超长文档（超过飞书单次输入上限）使用两步法：`create-doc`（标题 + 前半部分） → `update-doc`（续写剩余）

## 快速开始示例

### Shell 脚本

```bash
# 1. 设置认证
export FEISHU_MCP_UAT="u-your-token-here"

# 2. 初始化连接
~/.claude/skills/feishu-docs/scripts/feishu-mcp.sh initialize

# 3. 搜索文档
~/.claude/skills/feishu-docs/scripts/feishu-mcp.sh tools/call search-doc '{"query": "编码规范"}'

# 4. 读取文档
~/.claude/skills/feishu-docs/scripts/feishu-mcp.sh tools/call fetch-doc '{"doc_id": "xxxxxx"}'
```

### Python 脚本（推荐用于文档创建/更新）

```bash
# 1. 设置认证
export FEISHU_MCP_UAT="u-your-token-here"

# 2. 初始化连接
python3 ~/.claude/skills/feishu-docs/scripts/feishu-mcp.py initialize

# 3. 搜索文档
python3 ~/.claude/skills/feishu-docs/scripts/feishu-mcp.py tools/call search-doc '{"query": "编码规范"}'

# 4. 上传本地 Markdown 文件
python3 ~/.claude/skills/feishu-docs/scripts/feishu-mcp.py tools/call create-doc --content-file docs/prd.md '{"title": "PRD 文档"}'

# 5. 长文档批量上传（自动分批）
python3 ~/.claude/skills/feishu-docs/scripts/feishu-mcp.py tools/call create-doc --batch-file docs/long-doc.md --title "长文档"
```
