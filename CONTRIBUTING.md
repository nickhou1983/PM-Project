# Contributing

## 目标

这个仓库主要维护 GitHub Copilot 自定义 Agents、Skills 以及相关参考文档。提交内容应优先提升以下能力：

- 任务路由与协作流程清晰可复用。
- 领域知识能够沉淀为可维护的 Skill。
- 模板、参考文档和脚本具备明确边界，不混入无关内容。

## 贡献范围

欢迎提交以下类型的改动：

- 新增或改进 Agent 定义。
- 新增或完善 Skill、references、scripts。
- 改善 README、使用示例、流程文档。
- 修复链接、结构、说明不一致等仓库质量问题。

不建议直接在这个仓库里混入临时业务代码、一次性实验文件或与 Copilot 协作无关的产物。

## 推荐流程

1. 先在 issue、文档或草稿里明确目标与影响范围。
2. 小改动直接提交；较大改动建议先补规划文档。
3. 涉及 Agent 路由、Skill 结构或 references 组织方式时，优先保证一致性。
4. 提交前检查 Markdown 可读性、链接有效性和目录结构是否清晰。

## 目录约定

- `.github/agents/`：角色化 Agent 定义。
- `.github/agents/plans/`：规划文档、阶段性说明、过程留痕。
- `.github/skills/<skill-name>/`：Skill 主定义。
- `.github/skills/<skill-name>/references/`：模板、清单、知识沉淀。
- `.github/skills/<skill-name>/scripts/`：辅助脚本。

## 提交规范

建议使用 Conventional Commits：

```text
feat: add new planning agent workflow
fix: correct broken skill references
docs: improve repository setup guide
refactor: simplify routing instructions
chore: clean up repository metadata
```

## Agent 与 Skill 编写建议

### Agent

- 描述要明确说明职责、边界和典型触发场景。
- 避免把过多背景知识直接塞进 Agent 文件。
- 如果 Agent 负责路由，应优先说明如何选择下游 Skill 或 Agent。

### Skill

- `SKILL.md` 聚焦工作流、触发条件和工具映射。
- 可复用模板尽量放入 `references/`。
- 需要脚本时，在 `scripts/` 中补充最小可用实现和说明。

## 文档要求

- 优先使用简洁、结构化的 Markdown。
- 文件命名与目录组织保持稳定，避免频繁改名。
- 对外可见文档尽量说明用途、输入、输出和限制。

## 合并前检查

- 确认新增文件路径合理。
- 确认 README 或相关文档已同步更新。
- 确认没有误提交本地缓存、环境文件或编辑器状态。
- 确认提交信息能准确表达改动目的。

## 许可证

提交到本仓库的内容默认遵循 [LICENSE](LICENSE) 中的 MIT License。
