---
name: coding-standards
description: "全栈编码规范和代码审查指南。涵盖命名、结构、错误处理、Git 规范等通用规范，以及 TypeScript/React/Next.js/Vue 前端规范和 Node.js/Python/Go 后端规范。支持通过飞书 MCP 从飞书文档同步更新编码规范。触发条件：(1) 编写代码时需要遵循编码规范，(2) 代码审查/Code Review，(3) 新项目初始化需要确定编码标准，(4) 需要同步/更新来自飞书的团队编码规范，(5) 讨论代码质量、代码风格、最佳实践时。"
---

# 编码规范 Skill

全栈编码规范集，支持从飞书文档动态同步团队规范。

## 规范体系

规范文件按领域组织在 `references/` 目录下，按需加载：

| 文件 | 内容 | 何时加载 |
|------|------|----------|
| [general.md](references/general.md) | 命名、结构、注释、Git 规范 | 所有编码和审查任务 |
| [frontend.md](references/frontend.md) | TS/React/Next.js/Vue 规范 | 前端相关任务 |
| [backend.md](references/backend.md) | Node.js/Python/Go 后端规范 | 后端相关任务 |
| [code-review-checklist.md](references/code-review-checklist.md) | 代码审查清单 | Code Review 时 |

## 工作流

### 编码辅助

1. 判断任务涉及的领域（前端/后端/全栈）
2. 加载 `references/general.md`（始终）
3. 按需加载对应领域的规范文件
4. 在生成或修改代码时遵循已加载的规范
5. 如有违反规范之处，在回复中指出并给出修正

### 代码审查

1. 加载 `references/code-review-checklist.md`
2. 加载 `references/general.md` 和相关领域规范
3. 按清单中的 🔴🟡🟢 三级审查维度逐项检查
4. 使用清单中的评论模板格式化审查意见

### 从飞书同步编码规范

当需要从飞书文档更新编码规范时：

**方式一：通过飞书 MCP 直接读取**

若已配置飞书 MCP Server，直接使用 MCP 工具读取文档：

```text
1. 调用飞书 MCP 的文档读取工具（如 mcp_feishu_read_document）
   - 传入飞书文档 ID 或 URL
   - 获取 Markdown 格式的文档内容
2. 将内容写入对应的 references/ 文件
3. 更新 sync_state.json 记录同步时间
```

**方式二：通过同步脚本**

运行 `scripts/sync_from_feishu.py`：

```bash
# 初始化同步配置（首次使用）
python3 scripts/sync_from_feishu.py --init-config

# 编辑 sync_state.json，填入飞书文档 ID

# 同步单个文档
python3 scripts/sync_from_feishu.py --doc-id <飞书文档ID> --output general.md

# 批量同步
python3 scripts/sync_from_feishu.py --config sync_state.json
```

脚本会生成 MCP 调用指令，由 Claude 执行实际的飞书 API 调用。

### 飞书 MCP 配置指引

在 MCP 配置中添加飞书 MCP Server（以 Claude Desktop 为例）：

```json
{
  "mcpServers": {
    "feishu": {
      "command": "npx",
      "args": ["-y", "@anthropic/feishu-mcp-server"],
      "env": {
        "FEISHU_APP_ID": "<你的飞书应用 App ID>",
        "FEISHU_APP_SECRET": "<你的飞书应用 App Secret>"
      }
    }
  }
}
```

飞书应用所需权限：

- `docx:document:readonly`（文档读取）
- `wiki:wiki:readonly`（知识库读取，如规范存放在知识库中）

## 快速参考

### 核心规则速查

- **函数**：≤50 行，≤4 参数，单一职责，提前返回
- **组件**：≤200 行，Props 用 interface + JSDoc
- **命名**：camelCase 变量/函数，PascalCase 类/组件，UPPER_SNAKE_CASE 常量
- **错误**：自定义错误类型，边界层统一处理，禁止吞错误
- **类型**：禁止 `any`，strict 模式，类型守卫替代类型断言
- **提交**：Conventional Commits 格式（`feat`/`fix`/`refactor`...）
- **安全**：参数化查询，输入校验，敏感信息脱敏，环境变量存密钥
