# Project Guidelines

## 仓库定位

本仓库是面向 GitHub Copilot 的自定义 Agent 与 Skill 知识库，用于沉淀需求分析到上线复盘的完整工作流。不包含业务应用代码。

## 目录结构

| 路径 | 用途 |
|------|------|
| `.github/agents/*.agent.md` | Agent 定义（角色、职责、路由） |
| `.github/skills/<name>/SKILL.md` | Skill 定义（工作流、模板、工具映射） |
| `.github/skills/<name>/references/` | Skill 引用的模板和参考文档 |
| `.github/instructions/` | 按需加载的 Copilot 指令文件 |
| `.agents/skills/` | `.github/skills/` 的硬链接镜像，勿单独修改 |
| `projects/prd-{name}/` | 项目产物目录（PRD、wireframe、架构文档、manifest） |
| `docs/` | 流程规范和框架文档 |
| `scripts/` | PPT 生成等辅助脚本（pptxgenjs） |
| `plans/` | 运行时 Planning 输出 |

## 协作流程

```
pm_assistant → requirement-doc → gate1 → designer + architect → gate2
  → requirement-to-issues → gate2.5 → development → gate3 → post_launch_review
```

所有阶段通过 `projects/prd-{name}/workflow-manifest.json` 做跨阶段契约，详见 `docs/workflow-manifest-spec.md`。

## 编写约定

### Agent 文件

- 明确说明职责、边界和触发场景
- 不要把大段参考材料塞进 Agent 文件，引用 Skill 或 references
- 文件名格式：`<role>.agent.md`

### Skill 文件

- `SKILL.md` 聚焦工作流步骤、触发条件和工具映射
- 可复用模板放 `references/`，辅助脚本放 `scripts/`, 资源文件放 `assets/`
- 文件夹命名格式：`<name>/SKILL.md`
- 每个 Skill 一个关注点，不要混合不相关的领域

### 文档风格

- 使用中文撰写，技术术语可保留英文
- 优先结构化 Markdown：表格、列表、代码块
- 文件命名和目录结构保持稳定，避免频繁改名

## 构建与脚本

```bash
npm install                          # 安装依赖（pptxgenjs 等）
node scripts/generate-ppt.js        # 生成 PM-Project 介绍 PPT
node scripts/workflow-manifest.js   # 操作 workflow-manifest.json
```

## 提交规范

使用 Conventional Commits：`feat:` / `fix:` / `docs:` / `refactor:` / `chore:`

## 关键参考

- 下游工作流规范：`docs/pm-assistant-downstream-workflow.md`
- Manifest 规范：`docs/workflow-manifest-spec.md`
- 指标框架：`docs/ai-era-metrics-framework.md`
- 贡献指南：`CONTRIBUTING.md`
