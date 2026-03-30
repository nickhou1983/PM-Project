# PM-Project

面向 GitHub Copilot 的自定义 Agent 与 Skill 仓库，用于把需求分析、架构设计、代码审查、测试、文档、发布等工作流沉淀为可复用的协作能力。

## 仓库用途

这个仓库当前主要包含两类内容：

- Custom Agents：负责路由、规划、评审、调试、测试、设计等角色化协作。
- Skills：负责沉淀特定领域的方法论、模板、参考文档和执行流程。

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
│   │   ├── pm_assistant.agent.md
│   │   ├── architect.agent.md
│   │   ├── code_debug.agent.md
│   │   ├── code_docs.agent.md
│   │   ├── code_review.agent.md
│   │   ├── code_testing.agent.md
│   │   ├── designer.agent.md
│   │   ├── new_employee_mentor.agent.md
│   │   ├── planning.agent.md
│   │   ├── pr_review_submit.agent.md
│   │   ├── requirement_analyst.agent.md
│   │   ├── ui_testing.agent.md
│   │   └── plans/
│   └── skills/
│       ├── architect/
│       ├── code-review/
│       ├── code-standards-check/
│       ├── coding-standards/
│       ├── feishu-docs/
│       ├── github-publish/
│       ├── microservices/
│       ├── modao-prototype/
│       ├── playwright-testing/
│       ├── prototype-design/
│       ├── requirement-doc/
│       ├── requirement-to-issues/
│       └── security-audit/
├── docs/
│   └── custom-agents-skills-matrix.md
├── plans/
│   └── README.md
└── README.md
```

## 核心能力

### Agents

| Agent | 作用 |
| --- | --- |
| planning | 做上下文研究、意图识别和路由建议 |
| new_employee_mentor | 作为统一入口，把任务分配给合适的 Agent 或 Skill |
| architect | 基于需求产出技术架构方案 |
| code_review | 做代码评审、安全检查和质量评估 |
| code_debug | 处理报错排查与修复建议 |
| code_testing | 负责单元、集成、UI 和 E2E 测试 |
| code_docs | 生成 README、注释、API 文档和设计说明 |
| designer | 把 PRD 或线框升级为高保真原型 |
| gate_review | Stage-Gate 评审门，在 PRD/架构/上线前执行 Go/No-Go 决策 |
| post_launch_review | 上线复盘，收集埋点数据和用户反馈，输出迭代建议 |
| ui_testing | 使用 Playwright 做浏览器自动化验证 |
| pm_assistant / requirement_analyst | 做需求分析、竞品调研、商业模型验证和立项前验证 |
| pr_review_submit | 将审查意见写回 GitHub PR |

### Skills

| Skill | 作用 |
| --- | --- |
| coding-standards | 统一编码规范与最佳实践 |
| code-review | 标准化代码审查流程 |
| code-standards-check | 做规范合规性扫描与报告 |
| requirement-doc | 生成 PRD 与线框说明 |
| requirement-to-issues | 将需求拆分为 GitHub Issues |
| github-publish | 管理提交、推送、PR 与发布流程 |
| microservices | 微服务设计、治理与部署 |
| feishu-docs | 对接飞书文档查询与同步 |
| modao-prototype | 生成并导入墨刀原型 |
| prototype-design | 从低保真升级高保真原型 |
| playwright-testing | 沉淀 Playwright UI 测试规范 |
| security-audit | 基于 OWASP 做安全审查 |
| architect | 提供系统设计模板与架构方法 |

## 使用方式

### 1. 克隆仓库

```bash
git clone https://github.com/nickhou1983/PM-Project.git
cd PM-Project
```

### 2. 在 VS Code 中使用

如果你使用支持自定义 Agent / Skill 的 GitHub Copilot 工作流，可以直接复用这个仓库中的内容：

- .github/agents 下放置各类角色化 Agent 定义。
- .github/skills 下放置领域 Skill、参考模板与脚本。
- plans 下保留运行时 Planning 输出；.github/agents/plans 保留历史设计过程文档。

建议把这个仓库作为团队知识库维护，而不是把临时业务代码直接混入其中。

### 3. 推荐协作流程

1. 先用 planning 或 new_employee_mentor 做任务识别和路由。
2. 需求阶段：pm_assistant → requirement-doc → gate_review（PRD 评审）。
3. 设计阶段：designer → architect → gate_review（架构评审）。
4. 开发阶段：requirement-to-issues → code_testing → code_review。
5. 发布阶段：gate_review（上线评审）→ github-publish → post_launch_review（复盘）。
6. 需要规范或模板时，读取对应 Skill 的 SKILL.md 与 references。

## 项目文档

- [CONTRIBUTING.md](CONTRIBUTING.md)：贡献方式、提交规范与新增 Agent/Skill 的约定。
- [docs/custom-agents-skills-matrix.md](docs/custom-agents-skills-matrix.md)：当前支持的 Custom Agent / Skill 能力矩阵。
- [docs/pm-assistant-downstream-workflow.md](docs/pm-assistant-downstream-workflow.md)：`pm_assistant` 到下游 Agent / Skill 的工作流说明。
- [LICENSE](LICENSE)：当前仓库许可证。

## 适合继续补充的内容

- 增加更完整的仓库级使用示例。
- 为常用 Agent 增加调用案例与输入模板。
- 补充 LICENSE、CONTRIBUTING 和变更记录。
- 为 scripts 增加统一的依赖说明。

## 维护建议

- Agent 负责角色分工与路由，不要把长篇参考材料塞进单个 Agent 文件。
- Skill 负责方法、模板和操作步骤，尽量把可复用知识放进 references。
- 运行时规划文档建议统一沉淀到 plans/；历史设计过程保留在 .github/agents/plans。
- 提交信息建议使用 Conventional Commits，便于后续自动化处理。

## 许可证

本仓库使用 MIT License，详见 [LICENSE](LICENSE)。
