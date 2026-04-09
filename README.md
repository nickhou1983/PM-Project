# PM-Project

面向 GitHub Copilot 的自定义 Agent 与 Skill 仓库，用于把需求分析、架构设计、代码审查、测试、文档、发布等工作流沉淀为可复用的协作能力。

## 仓库用途

这个仓库当前主要包含两类内容：

- **Custom Agents**：负责需求验证、架构设计、评审决策、原型设计、复盘等角色化协作。
- **Skills**：负责沉淀特定领域的方法论、模板、参考文档和执行流程。

运行时目录约定：

- `.codex/agents/`：Codex/App 当前实际使用的 Agent 运行时定义。
- `.github/agents/`：面向 GitHub Copilot 和说明文档的 Agent 定义。
- `.github/skills/`：Skill 主目录；`.agents/skills/` 为兼容软链接。
- `plans/`：运行时 Planning 结果与路由中间产物目录。

适合的使用场景：

- 为团队建立统一的 Copilot 协作工作流。
- 复用需求分析、PRD、架构设计、代码审查、测试与发布规范。
- 在 VS Code 中通过自定义 Agent 和 Skill 提高复杂任务的执行一致性。

## 目录结构

```text
.
├── .agents/
│   └── skills -> ../.github/skills
├── .codex/
│   └── agents/
├── .github/
│   ├── agents/
│   │   ├── architect.agent.md
│   │   ├── designer.agent.md
│   │   ├── gate_review.agent.md
│   │   ├── pm_assistant.agent.md
│   │   ├── post_launch_review.agent.md
│   │   ├── pr_review_submit.agent.md
│   │   └── plans/
│   └── skills/
│       ├── architect/
│       ├── feishu-docs/
│       ├── github-publish/
│       ├── microservices/
│       ├── modao-prototype/
│       ├── playwright-testing/
│       ├── prototype-design/
│       ├── requirement-doc/
│       └── requirement-to-issues/
├── docs/
│   └── ai-era-metrics-framework.md
├── Hands-on/
│   └── hands-on-guide.md
├── Presentations/                  ← 演示文稿（.gitignore 忽略）
├── scripts/                       ← PPT 生成脚本（pptxgenjs）
├── plans/
│   └── README.md
├── AGENTS.md
├── CONTRIBUTING.md
├── custom-agents-skills-matrix.md
├── pm-assistant-downstream-workflow.md
├── pm-assistant-workflow-one-page.md
└── README.md
```

## 核心能力

### Agents

| Agent | 作用 |
| --- | --- |
| pm_assistant | 需求分析与立项前验证（含飞书查重、竞品分析、商业快评） |
| architect | 根据 PRD 设计技术架构方案（支持模块级架构设计） |
| designer | 基于 PRD 和低保真 wireframe 生成高保真原型 |
| gate_review | Stage-Gate 评审门，在 PRD/架构/上线前执行 Go/No-Go 决策 |
| post_launch_review | 上线复盘，收集埋点数据和用户反馈，输出迭代建议 |
| pr_review_submit | 将审查结果写入 GitHub PR Review |
| tdd_developer | 基于 GitHub Issue + 架构文档，通过 TDD 流程（Red-Green-Refactor）实现代码 |

> 完整 Agent 角色索引（含 Codex 运行时定义的 14 个 Agent）见 [AGENTS.md](AGENTS.md)。

### Skills

| Skill | 作用 |
| --- | --- |
| requirement-doc | 生成模块化 PRD（主 PRD + Module PRD）与低保真 wireframe |
| requirement-to-issues | 将 PRD 按模块拆分为 GitHub Issues（Epic + Task） |
| architect | 架构设计模板和 ADR（支持模块级架构设计） |
| prototype-design | 从低保真升级高保真原型 |
| github-publish | 管理提交、推送、PR 与发布流程 |
| feishu-docs | 对接飞书文档查询与同步（MCP） |
| modao-prototype | 生成并导入墨刀原型（MCP） |
| microservices | 微服务设计、治理与部署规范 |
| playwright-testing | Playwright UI/E2E 测试规范 |

## 使用方式

### 1. 克隆仓库

```bash
git clone https://github.com/nickhou1983/PM-Project.git
cd PM-Project
npm install  # 安装 PPT 生成等脚本依赖
```

### 2. 在 VS Code 中使用

如果你使用支持自定义 Agent / Skill 的 GitHub Copilot 工作流，可以直接复用这个仓库中的内容：

- `.github/agents/` 下放置各类角色化 Agent 定义。
- `.github/skills/` 下放置领域 Skill、参考模板与脚本。
- `plans/` 下保留运行时 Planning 输出；`.github/agents/plans/` 保留历史设计过程文档。

建议把这个仓库作为团队知识库维护，而不是把临时业务代码直接混入其中。

### 3. 推荐协作流程

```text
pm_assistant (立项验证)
  → requirement-doc (生成主 PRD + Module PRD + wireframe)
    → gate_review Gate 1 (PRD 评审)
      → designer (高保真原型)
        → architect (主架构 + 模块级架构)
          → gate_review Gate 2 (架构评审)
            → requirement-to-issues (按模块拆分 Issues)
              → 开发 → code_review → gate_review Gate 3 (上线评审)
                → github-publish → post_launch_review (复盘)
```

### 4. 生成演示文稿

```bash
node scripts/generate-ppt.js           # PM-Project 介绍
node scripts/generate-pm-assistant-ppt.js  # PM Assistant Agent 说明
node scripts/generate-skills-ppt.js     # Skills 能力总览
# 更多脚本见 scripts/ 目录
```

## 项目文档

- [AGENTS.md](AGENTS.md)：Codex 项目级指令与完整 Agent/Skill 索引。
- [CONTRIBUTING.md](CONTRIBUTING.md)：贡献方式、提交规范与新增 Agent/Skill 的约定。
- [docs/pm-assistant-downstream-workflow.md](docs/pm-assistant-downstream-workflow.md)：`pm_assistant` 下游工作流分析报告。
- [Hands-on/hands-on-guide.md](Hands-on/hands-on-guide.md)：动手实践指南。
- [docs/ai-era-metrics-framework.md](docs/ai-era-metrics-framework.md)：AI 时代指标框架。
- [LICENSE](LICENSE)：MIT License。

## 维护建议

- Agent 负责角色分工与路由，不要把长篇参考材料塞进单个 Agent 文件。
- Skill 负责方法、模板和操作步骤，尽量把可复用知识放进 references。
- 运行时规划文档建议统一沉淀到 plans/；历史设计过程保留在 .github/agents/plans。
- 提交信息建议使用 Conventional Commits，便于后续自动化处理。

## 许可证

本仓库使用 MIT License，详见 [LICENSE](LICENSE)。
