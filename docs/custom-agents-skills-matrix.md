# Custom Agents 与 Skills 能力矩阵

本文档说明当前仓库中**实际支持**的 Custom Agent 与 Skill，并统一调用命名、目录归属和推荐使用方式。

## 命名约定

为避免文件名、展示名和运行时标识不一致带来的歧义，统一采用以下约定：

- **Agent 运行时 ID**：以 `.codex/agents/*.toml` 中的 `name` 字段为准
- **Agent 文档文件**：以 `.github/agents/*.agent.md` 作为说明与 Copilot 配置载体
- **Skill 名称**：以 `.github/skills/*/SKILL.md` 的 frontmatter `name` 为准
- **Skill 路径**：统一使用 `.agents/skills/<skill-name>/` 作为仓库内引用路径；实际内容来自 `.github/skills/`

## Agents

| 运行时 ID | `.codex` 文件 | `.github` 文件 | 职责定位 | 推荐触发场景 |
| --- | --- | --- | --- | --- |
| `pm_assistant` | `.codex/agents/pm-assistant.toml` | `.github/agents/PM-assistant.agent.md` | 立项前验证与价值评估 | 灵感分析、竞品分析、飞书查重、商业快评 |
| `requirement_analyst` | `.codex/agents/requirement-analyst.toml` | `.github/agents/requirement-analyst.agent.md` | 轻量需求验证 | 快速判断需求是否值得推进 |
| `planning` | `.codex/agents/planning.toml` | `.github/agents/planning.agent.md` | 上下文研究与路由建议 | 执行前分析、复杂任务梳理 |
| `new_employee_mentor` | `.codex/agents/new-employee-mentor.toml` | `.github/agents/new-employee-mentor.agent.md` | 统一入口路由器 | 不确定该用哪个 Agent/Skill 时 |
| `designer` | `.codex/agents/designer.toml` | `.github/agents/designer.agent.md` | 高保真原型设计 | 从 PRD / wireframe 升级高保真原型 |
| `architect` | `.codex/agents/architect.toml` | `.github/agents/architect.agent.md` | 架构设计 | 从 PRD 产出技术架构文档 |
| `gate_review` | `.codex/agents/gate-review.toml` | `.github/agents/gate-review.agent.md` | Stage-Gate 审核 | PRD 评审、架构评审、上线评审 |
| `code_debug` | `.codex/agents/code-debug.toml` | `.github/agents/code-debug.agent.md` | 故障诊断 | 报错分析、未知异常排查 |
| `code_docs` | `.codex/agents/code-docs.toml` | `.github/agents/code-docs.agent.md` | 文档生成 | 注释、README、API 文档、设计说明 |
| `code_review` | `.codex/agents/code-review.toml` | `.github/agents/code-review.agent.md` | 代码审查 | PR 审查、回归风险识别、安全检查 |
| `pr_review_submit` | `.codex/agents/pr-review-submit.toml` | `.github/agents/pr-review-submit.agent.md` | PR Review 发布 | 将审查结果写回 GitHub PR |
| `code_testing` | `.codex/agents/code-testing.toml` | `.github/agents/code-testing.agent.md` | 通用测试执行 | 单元测试、集成测试、覆盖率分析 |
| `ui_testing` | `.codex/agents/ui-testing.toml` | `.github/agents/ui-testing.agent.md` | 深度 UI 自动化测试 | Playwright、视觉回归、a11y、POM |
| `post_launch_review` | `.codex/agents/post-launch-review.toml` | `.github/agents/post-launch-review.agent.md` | 上线复盘 | 指标回顾、反馈归因、迭代建议 |

## Skills

| Skill | 路径 | 核心职责 | 常见上游 / 下游 |
| --- | --- | --- | --- |
| `requirement-doc` | `.agents/skills/requirement-doc/` | 生成 PRD 与低保真 wireframe | 上游：`pm_assistant` / `requirement_analyst`；下游：`gate_review` |
| `prototype-design` | `.agents/skills/prototype-design/` | 生成高保真原型 | 上游：`requirement-doc`；下游：`architect` |
| `architect` | `.agents/skills/architect/` | 生成架构文档 | 上游：PRD；下游：`requirement-to-issues` |
| `requirement-to-issues` | `.agents/skills/requirement-to-issues/` | 将 PRD 拆分为 GitHub Issues | 上游：`requirement-doc` / `architect` |
| `github-publish` | `.agents/skills/github-publish/` | 提交、分支、PR、合并 | 文档、代码、原型的发布闭环 |
| `feishu-docs` | `.agents/skills/feishu-docs/` | 飞书文档查询与写入 | 文档同步、知识库检索 |
| `modao-prototype` | `.agents/skills/modao-prototype/` | 墨刀原型导入 | 原型展示与评审 |
| `coding-standards` | `.agents/skills/coding-standards/` | 编码规范基线 | 编写代码、代码审查 |
| `code-standards-check` | `.agents/skills/code-standards-check/` | 代码规范审计 | 批量合规检查 |
| `code-review` | `.agents/skills/code-review/` | 审查方法与模板 | `code_review` Agent 的规范基线 |
| `security-audit` | `.agents/skills/security-audit/` | OWASP 安全审查 | 安全专项检查 |
| `microservices` | `.agents/skills/microservices/` | 微服务设计与部署规范 | 架构设计、部署方案详设 |
| `playwright-testing` | `.agents/skills/playwright-testing/` | Playwright 测试规范 | `code_testing` / `ui_testing` 的规范基线 |

## 推荐调用顺序

### 产品工作流

1. `pm_assistant` 或 `requirement_analyst`
2. `requirement-doc`
3. `gate_review`（Gate 1）
4. `designer` 或 `prototype-design`
5. `architect`
6. `gate_review`（Gate 2）
7. `requirement-to-issues`

### 开发工作流

1. `planning` 或 `new_employee_mentor`
2. `code_testing` / `ui_testing`
3. `code_review`
4. `pr_review_submit`
5. `github-publish`

### 运营闭环

1. `gate_review`（Gate 3）
2. `github-publish`
3. `post_launch_review`

## 当前统一规则

- 默认架构文档输出路径：`docs/prd-{项目名}/architecture-{项目名}.md`
- 仓库内 Skill 引用路径：统一写作 `.agents/skills/...`
- `plans/` 为运行时 Planning 中间产物目录
- 不再将不存在的 `Conductor` 视为当前支持能力
