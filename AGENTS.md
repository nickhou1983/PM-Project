# PM-Project — Codex 项目指令

> 本文件为 Codex CLI/App 提供项目级工作协议和指令。全局级指令放在 `~/.codex/AGENTS.md`。

## 项目概述

本仓库是一个 **GitHub Copilot / Codex 定制化仓库**，包含自定义 Agent、Skill 和产品开发工作流模板。不是传统应用代码仓库。

## 工作语言

- 所有报告、文档、评审输出使用 **中文**
- Agent 和 Skill 的 description 使用中文
- 代码注释和变量命名使用英文

## 文档路径约定

- PRD 文档：`docs/prd-{项目名}/prd-{项目名}.md`
- 架构文档：`docs/prd-{项目名}/architecture-{项目名}.md`（或 `docs/architecture-{项目名}.md`）
- 低保真原型：`docs/prd-{项目名}/wireframes/*.html`
- 高保真原型：`docs/prd-{项目名}/hifi-wireframes/*.html`
- 分析报告：`docs/prd-{项目名}/analysis-report*.md`

## Agent 角色索引

以下 Agent 定义在 `.codex/agents/` 目录下，可通过自然语言或手动 spawn：

| Agent | 职责 | sandbox_mode |
|-------|------|-------------|
| `pm_assistant` | 需求分析与立项前验证（含飞书查重、竞品分析、商业快评） | read-only |
| `architect` | 根据 PRD 设计技术架构方案 | workspace-write |
| `code_debug` | 代码错误诊断（飞书知识库 + 代码搜索） | workspace-write |
| `code_docs` | 代码文档生成（注释/README/API 文档、可同步飞书） | workspace-write |
| `code_review` | 代码审查（MUST/SHOULD/NIT 分级） | read-only |
| `code_testing` | 代码测试（单元/集成/UI/E2E） | workspace-write |
| `designer` | 高保真原型设计（基于 PRD + wireframe） | workspace-write |
| `gate_review` | Stage-Gate 评审门（PRD/架构/上线三个 Gate） | read-only |
| `new_employee_mentor` | 新员工导师（路由分发器，分析意图后路由到合适的 Agent） | workspace-write |
| `planning` | 任务规划与上下文研究（只研究不执行） | read-only |
| `post_launch_review` | 上线复盘与迭代决策 | read-only |
| `pr_review_submit` | 将审查结果写入 GitHub PR Review | read-only |
| `requirement_analyst` | 需求灵感验证（简化版 PM assistant） | read-only |
| `ui_testing` | UI 自动化测试（Playwright MCP） | workspace-write |

## Skill 索引

Skill 存放在 `.agents/skills/`（指向 `.github/skills/` 的符号链接）。可用 `$skill-name` 显式调用。

| Skill | 用途 |
|-------|------|
| `architect` | 架构设计模板和 ADR |
| `code-review` | 代码审查规范 |
| `code-standards-check` | 代码规范审计 |
| `coding-standards` | 编码规范集 |
| `feishu-docs` | 飞书文档查询/操作 (MCP) |
| `github-publish` | GitHub 发布工作流 |
| `microservices` | 微服务架构/部署规范 |
| `modao-prototype` | 墨刀原型导入 (MCP) |
| `playwright-testing` | Playwright 测试规范 |
| `prototype-design` | 高保真原型设计 |
| `requirement-doc` | PRD 生成 |
| `requirement-to-issues` | PRD 转 GitHub Issues |
| `security-audit` | OWASP Top 10 安全审查 |

## MCP 服务依赖

以下 MCP 服务需要在 `.codex/config.toml` 中配置：

- **飞书 (Feishu)** — 文档查重、知识库检索、文档同步
- **墨刀 (Modao)** — 原型生成与导入
- **Playwright** — 浏览器自动化 UI 测试
- **GitHub** — PR 管理、Issue 操作、代码搜索

## 工作流约定

### 产品开发全流程

```
PM-assistant (立项验证)
  → requirement-doc (生成 PRD + wireframe)
    → gate-review Gate 1 (PRD 评审)
      → Designer (高保真原型)
        → Architect (架构设计)
          → gate-review Gate 2 (架构评审)
            → requirement-to-issues (拆分 Issue)
              → 开发阶段
                → code-review (审查)
                  → gate-review Gate 3 (上线评审)
                    → post-launch-review (复盘)
```

### PR 规范

- 分支命名：`feature/{描述}`、`fix/{描述}`、`docs/{描述}`
- Commit message：`类型(范围): 描述` （如 `feat(agent): add codex CLI adaptation`）
- PR 必须通过 code-review Agent 审查

## 安全要求

- 不要在仓库中提交 token、密钥、密码
- 飞书认证 token 通过环境变量注入（`FEISHU_MCP_UAT`、`FEISHU_MCP_TAT`）
- 墨刀 token 通过环境变量注入（`MODAO_TOKEN`）
