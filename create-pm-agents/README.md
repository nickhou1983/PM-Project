# create-pm-agents

一条命令向你的业务仓库注入 PM Agent/Skill 工作流体系。

## 快速使用

```bash
npx github:nickhou1983/PM-Project/create-pm-agents
```

或 clone 后本地使用：

```bash
cd create-pm-agents
npm install
npm link

# 在你的业务仓库中
cd /path/to/your-project
create-pm-agents
```

## 选项

| 参数 | 说明 |
|------|------|
| `--yes` / `-y` | 跳过交互，使用默认全选 |
| `--dry-run` | 仅预览将生成的文件列表，不写入 |

## 交互式配置

运行后会依次询问：

1. **项目名称** — 默认当前目录名
2. **Agent 模块** — 多选，按分组（核心 PM / 设计 / 开发）
3. **MCP 服务** — GitHub / Playwright / 飞书 / 墨刀 / Tavily
4. **技术栈偏好** — 前端 / 后端 / 全栈（影响 Skill 子集）
5. **平台选择** — Copilot / Codex / 双平台

## 生成产物

```
your-project/
├── .github/
│   ├── agents/*.agent.md       # Copilot Agent 定义
│   ├── skills/<name>/SKILL.md  # Skill 主定义 + references/
│   ├── instructions/           # 按需加载指令
│   └── copilot-instructions.md # 项目级 Copilot 指令
├── .codex/
│   ├── agents/*.toml           # Codex Agent 定义
│   ├── rules/                  # Codex 规则
│   └── config.toml             # MCP + Agent 注册
├── .agents/skills/             # → .github/skills/ 软链接
├── docs/                       # 流程规范文档
├── scripts/workflow-manifest.js
├── projects/                   # 项目产物目录（空）
├── plans/                      # 运行时规划输出（空）
└── AGENTS.md                   # Codex 项目指令
```

## 模板同步

当上游 PM-Project 的 Agent/Skill 更新后，运行同步脚本更新模板：

```bash
cd create-pm-agents
node scripts/sync-templates.js
```

## Agent → Skill 依赖关系

选中 Agent 会自动包含其依赖的 Skill：

| Agent | 自动包含 |
|-------|---------|
| pm_assistant | requirement-doc, requirement-to-issues |
| architect | architect-doc |
| designer | prototype-design, prototype-publish, premium-frontend-ui |
| gate_review | gate-review, doc-lint, doc-quality-judge |
| tdd_developer | tdd-coder |
| code_testing | playwright-testing |
| code_review | code-review, security-audit |
| pr_review_submit | github-publish |
| pm_workflow_evaluator | workflow-dashboard |

## License

MIT
