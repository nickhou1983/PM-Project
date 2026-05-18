# AGENTS.md — Codex 项目级指令

本仓库是面向 GitHub Copilot 与 OpenAI Codex 的自定义 Agent / Skill 知识库，用于沉淀从需求分析到上线复盘的协作工作流；不承载业务应用代码。

## 目录约定

| 路径 | 用途 |
| --- | --- |
| `.github/agents/*.agent.md` | GitHub Copilot 侧 Agent 主定义 |
| `.codex/agents/*.toml` | Codex 自定义 Agent 定义 |
| `.codex/config.toml` | Codex 项目级配置与 MCP 注册 |
| `.codex/rules/*.md` | Codex 运行时补充规则，按需读取 |
| `.github/skills/<name>/SKILL.md` | Skill 主定义与引用模板 |
| `.agents/skills/<name>` | 指向 `.github/skills/<name>` 的兼容软链接镜像 |
| `projects/prd-{name}/` | PRD、wireframe、架构文档、manifest 等项目产物 |
| `docs/` | 流程规范与方法论文档 |
| `plans/` | 运行时 Planning 输出 |

## 运行时约定

- 使用中文输出；必要时保留英文技术术语。
- `.github/agents/*.agent.md` 与 `.github/skills/*` 是业务语义主定义源，不在 `.codex/agents/*.toml` 中复制维护第二套完整 prompt。
- Codex 技能发现入口是 `.agents/skills/`。本仓库通过软链接把它映射到 `.github/skills/`，不要单独改动镜像内容。
- 当任务涉及 `workflow-manifest.json` 的校验或写入时，先读取 `.codex/rules/workflow-manifest.md`。
- 其余通用仓库协作规则见 `.codex/rules/general.md`。

## 工作流总览

```text
pm_assistant → requirement-doc → gate_review Gate 1 → designer + architect
  → gate_review Gate 2 → requirement-to-issues → gate_review Gate 2.5
  → tdd_developer / code_testing / code_review → gate_review Gate 3
  → github-publish → post_launch_review
```

所有阶段通过 `projects/prd-{name}/workflow-manifest.json` 做跨阶段契约，规范见 `docs/workflow-manifest-spec.md`。

## Agent 索引

| Agent | 职责 |
| --- | --- |
| `pm_assistant` | 需求分析、查重、竞品检索、立项前价值评估 |
| `architect` | 根据 PRD 输出技术架构方案与 ADR |
| `designer` | 从 PRD / wireframe 生成高保真原型 |
| `gate_review` | Gate 1 / 2 / 2.5 / 3 评审与 Go/No-Go 决策 |
| `planning` | 开发前上下文研究与实施规划 |
| `tdd_developer` | 基于 Issue / 架构文档执行 TDD 开发 |
| `code_testing` | 多层测试策略、测试补齐与覆盖分析 |
| `code_review` | MUST / SHOULD / NIT 三级代码审查 |
| `pr_review_submit` | 将审查结论写入 GitHub PR Review |
| `pm_workflow_evaluator` | 横向评估整条 PM 工作流健康度 |
| `post_launch_review` | 上线复盘、数据分析与迭代建议 |

## Skill 索引

| Skill | 用途 |
| --- | --- |
| `requirement-doc` | 生成主 PRD、Module PRD 与低保真 wireframe |
| `requirement-to-issues` | 将 PRD 拆分为 Epic / Task（支持 GitHub 远程创建或本地 Markdown 存储） |
| `architect-doc` | 技术架构模板、ADR 与模块级架构设计 |
| `prototype-design` | 从低保真升级高保真原型 |
| `prototype-publish` | 发布原型到墨刀 / Figma |
| `premium-frontend-ui` | 沉浸式高端 UI 设计规范 |
| `playwright-testing` | UI / E2E 自动化测试 |
| `code-review` | 代码审查方法论与输出模板 |
| `security-audit` | OWASP Top 10 安全审查 |
| `tdd-coder` | TDD 工作流与编码约束 |
| `microservices` | 微服务设计与治理规范 |
| `github-publish` | 提交、推送、PR 与发布流程 |
| `feishu-docs` | 飞书文档检索、同步与 MCP 接入 |
| `gate-review` | Gate 检查清单与评审辅助材料 |
| `doc-lint` | PRD / 架构文档结构化 Lint 与 RTM 生成 |
| `doc-quality-judge` | LLM-as-Judge 文档语义质量评估 |
| `workflow-dashboard` | 流程指标看板与结果汇总 |

## 维护约束

- 不编造数据，所有评估结论必须来自实际检索或真实产物。
- 不在未明确需要时修改 `.github/agents/`、`.github/skills/` 的主定义。
- 提交信息优先使用 Conventional Commits：`feat:` / `fix:` / `docs:` / `refactor:` / `chore:`。
