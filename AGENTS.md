# AGENTS.md — Codex 项目级指令

> 本文件是 OpenAI Codex 的全局工作协议，启动时自动加载。等效于 GitHub Copilot 的 `.github/copilot-instructions.md`。

---

## 仓库定位

本仓库是面向 GitHub Copilot / Codex 的自定义 Agent 与 Skill 知识库，用于沉淀需求分析到上线复盘的完整工作流。不包含业务应用代码。

## 目录结构

| 路径 | 用途 |
|------|------|
| `.github/agents/*.agent.md` | GitHub Copilot Agent 定义（角色、职责、路由） |
| `.codex/agents/*.toml` | Codex Agent 运行时定义 |
| `.codex/config.toml` | Codex 项目级配置（MCP 服务器等） |
| `.codex/rules/` | Codex 运行时规则（按需加载） |
| `.github/skills/<name>/SKILL.md` | Skill 定义（工作流、模板、工具映射） |
| `.github/skills/<name>/references/` | Skill 引用的模板和参考文档 |
| `.github/instructions/` | 按需加载的指令文件 |
| `projects/prd-{name}/` | 项目产物目录（PRD、wireframe、架构文档、manifest） |
| `docs/` | 流程规范和框架文档 |
| `scripts/` | 辅助脚本（pptxgenjs、workflow-manifest） |
| `plans/` | 运行时 Planning 输出 |

## 协作流程

```
pm_assistant → requirement-doc → gate1 → designer + architect → gate2
  → requirement-to-issues → gate2.5 → development → gate3 → post_launch_review
```

所有阶段通过 `projects/prd-{name}/workflow-manifest.json` 做跨阶段契约，详见 `docs/workflow-manifest-spec.md`。

---

## Agent 索引

| Agent | 职责 | 触发场景 |
|-------|------|----------|
| `pm_assistant` | 需求分析与立项前验证（飞书查重、竞品分析、UI/技术快评） | 新灵感/需求验证、竞品分析、需求查重 |
| `architect` | 根据 PRD 设计技术架构方案 | 架构设计、技术选型、从 PRD 推导架构 |
| `designer` | 基于 PRD + wireframe 生成高保真原型 | 高保真原型、将低保真转高保真 |
| `gate_review` | Stage-Gate 评审门（Gate 1/2/2.5/3） | 需求评审、架构评审、上线前检查 |
| `code_review` | 代码审查（MUST/SHOULD/NIT 三级） | PR Review、代码走查、代码质量审查 |
| `code_testing` | 测试编排（单元/集成/API/UI/E2E） | 代码测试、测试策略、覆盖分析 |
| `planning` | 任务规划与上下文研究（只研究不执行） | 任务规划、依赖分析、技术调研 |
| `pm_workflow_evaluator` | 工作流健康度评估 | 流程复盘、跨阶段一致性评估 |
| `post_launch_review` | 上线复盘与迭代决策 | 数据分析、迭代决策、功能效果评估 |
| `pr_review_submit` | 将审查结果写入 GitHub PR Review | 审查完成后提交 Review |
| `tdd_developer` | 基于 Issue 通过 TDD 流程实现代码 | TDD 开发、Red-Green-Refactor |

---

## Skill 索引

Skill 文件位于 `.github/skills/<name>/SKILL.md`，使用前请读取对应文件获取完整工作流。

| Skill | 用途 | 触发条件 |
|-------|------|----------|
| `requirement-doc` | 生成 PRD 与低保真 wireframe | 生成需求文档、将灵感转化为需求 |
| `requirement-to-issues` | 将 PRD 拆分为 GitHub Issues | PRD 转 Issue、按模块创建任务 |
| `architect-doc` | 技术架构设计模板与 ADR | 设计技术架构、系统设计 |
| `prototype-design` | 从低保真升级高保真原型 | 高保真原型设计、视觉设计 |
| `prototype-publish` | 发布原型到墨刀/Figma 平台 | 导入墨刀、导入 Figma |
| `code-review` | 代码审查规范与评论模板 | 代码审查、PR Review |
| `security-audit` | OWASP Top 10 安全审查 | 安全审查、漏洞扫描 |
| `tdd-coder` | TDD 编码方法论 | 测试驱动开发、先写测试 |
| `microservices` | 微服务设计与部署规范 | 微服务架构、容器化部署 |
| `github-publish` | GitHub 提交/PR/发布工作流 | 提交代码、创建 PR |
| `feishu-docs` | 飞书文档查询与同步 | 查询飞书文档、同步内容 |
| `playwright-testing` | UI/E2E 自动化测试 | UI 测试、Playwright |
| `premium-frontend-ui` | 沉浸式高端前端 UI | 高端 Landing Page、Awwwards 风格 |
| `doc-lint` | 文档质量 Lint 检查 | PRD Lint、生成 RTM |
| `doc-quality-judge` | LLM-as-Judge 文档评估 | 文档质量评估、语义审查 |
| `gate-review` | Gate Review 检查清单 | Gate 评审检查项 |
| `workflow-dashboard` | 工作流度量仪表盘 | 生成 dashboard、评审进度 |

---

## Skill 加载方式

当任务匹配某个 Skill 的触发条件时：
1. 读取 `.github/skills/<skill-name>/SKILL.md` 获取完整工作流
2. 按 SKILL.md 中定义的步骤顺序执行
3. 需要模板时，读取 `.github/skills/<skill-name>/references/` 下的对应文件

---

## 编写约定

- 使用中文撰写，技术术语可保留英文
- 优先结构化 Markdown：表格、列表、代码块
- 文件命名和目录结构保持稳定
- 提交使用 Conventional Commits：`feat:` / `fix:` / `docs:` / `refactor:` / `chore:`

## 关键约束

- 所有 Agent 必须按工作流顺序执行，不跳步
- 不编造数据，所有分析结论必须来自实际检索
- 在阶段切换前执行 manifest 校验（`node scripts/workflow-manifest.js check`）
- 产物写入后更新 manifest（`node scripts/workflow-manifest.js set`）
- 使用中文输出

## 构建与脚本

```bash
npm install                                    # 安装依赖
node scripts/workflow-manifest.js check <project> <stage>  # 校验上游就绪
node scripts/workflow-manifest.js set <project> <stage>     # 写入阶段产物
```
