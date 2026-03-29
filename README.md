# PM-Project

面向 GitHub Copilot 的自定义 Agent 与 Skill 仓库，用于把需求分析、架构设计、代码审查、测试、文档、发布等工作流沉淀为可复用的协作能力。

## 仓库用途

这个仓库当前主要包含两类内容：

- Custom Agents：负责路由、规划、评审、调试、测试、设计等角色化协作。
- Skills：负责沉淀特定领域的方法论、模板、参考文档和执行流程。

适合的使用场景：

- 为团队建立统一的 Copilot 协作工作流。
- 复用需求分析、PRD、架构设计、代码审查、测试与发布规范。
- 在 VS Code 中通过自定义 Agent 和 Skill 提高复杂任务的执行一致性。

## 目录结构

```text
.
├── .github/
│   ├── agents/
│   │   ├── PM-assistant.agent.md
│   │   ├── architect.agent.md
│   │   ├── code-debug.agent.md
│   │   ├── code-docs.agent.md
│   │   ├── code-review.agent.md
│   │   ├── code-testing.agent.md
│   │   ├── designer.agent.md
│   │   ├── new-employee-mentor.agent.md
│   │   ├── planning.agent.md
│   │   ├── pr-review-submit.agent.md
│   │   ├── requirement-analyst.agent.md
│   │   ├── ui-testing.agent.md
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
└── README.md
```

## 核心能力

### Agents

| Agent | 作用 |
| --- | --- |
| planning | 做上下文研究、意图识别和路由建议 |
| new-employee-mentor | 作为统一入口，把任务分配给合适的 Agent 或 Skill |
| architect | 基于需求产出技术架构方案 |
| code-review | 做代码评审、安全检查和质量评估 |
| code-debug | 处理报错排查与修复建议 |
| code-testing | 负责单元、集成、UI 和 E2E 测试 |
| code-docs | 生成 README、注释、API 文档和设计说明 |
| designer | 把 PRD 或线框升级为高保真原型 |
| ui-testing | 使用 Playwright 做浏览器自动化验证 |
| PM-assistant / requirement-analyst | 做需求分析、竞品调研和立项前验证 |
| pr-review-submit | 将审查意见写回 GitHub PR |

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
- .github/agents/plans 下保留任务规划和阶段性输出。

建议把这个仓库作为团队知识库维护，而不是把临时业务代码直接混入其中。

### 3. 推荐协作流程

1. 先用 planning 或 new-employee-mentor 做任务识别和路由。
2. 再按场景调用 architect、code-review、code-testing、code-docs 等专用 Agent。
3. 需要规范或模板时，读取对应 Skill 的 SKILL.md 与 references。
4. 需要发布到 GitHub 时，走 github-publish 流程。

## 项目文档

- [CONTRIBUTING.md](CONTRIBUTING.md)：贡献方式、提交规范与新增 Agent/Skill 的约定。
- [LICENSE](LICENSE)：当前仓库许可证。

## 适合继续补充的内容

- 增加更完整的仓库级使用示例。
- 为常用 Agent 增加调用案例与输入模板。
- 补充 LICENSE、CONTRIBUTING 和变更记录。
- 为 scripts 增加统一的依赖说明。

## 维护建议

- Agent 负责角色分工与路由，不要把长篇参考材料塞进单个 Agent 文件。
- Skill 负责方法、模板和操作步骤，尽量把可复用知识放进 references。
- 规划文档建议统一沉淀到 .github/agents/plans，方便追踪演进过程。
- 提交信息建议使用 Conventional Commits，便于后续自动化处理。

## 许可证

本仓库使用 MIT License，详见 [LICENSE](LICENSE)。

