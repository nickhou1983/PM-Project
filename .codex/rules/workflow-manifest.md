# Workflow Manifest 规则

适用场景：创建、校验或更新 `projects/prd-{project}/workflow-manifest.json`。

## 核心规则

1. 进入任何阶段前，先校验上游阶段是否就绪。
2. 阶段主要产物落盘后，再写入 manifest 对应字段。
3. 只更新当前阶段字段，不覆盖其他阶段已有信息。
4. manifest 更新本身不自动触发 git commit。

## 标准命令

```bash
# 校验上游阶段
node scripts/workflow-manifest.js check <project> <stage>

# 写入当前阶段
echo '{"doc":"projects/prd-foo/prd-foo.md","version":"v1.0.0"}' \
  | node scripts/workflow-manifest.js set <project> <stage>
```

## 上游依赖矩阵

| 当前阶段 | 必须存在 | Gate 必须非 No-Go |
| --- | --- | --- |
| `intake` | — | — |
| `prd` | `intake` | — |
| `gate1` | `prd` | — |
| `design` / `architecture` | `prd` | `gate1` |
| `gate2` | `architecture` | `gate1` |
| `issues` | `architecture` | `gate2` |
| `gate2_5` | `issues` | — |
| `development` | `issues` | `gate2` + (`gate2_5` 或 merged) |
| `gate3` | `development` | — |
| `post_launch` | `gate3` | `gate3` |

## 阶段与负责 Agent / Skill

| 阶段 | 负责方 |
| --- | --- |
| `intake` | `pm_assistant` |
| `prd` | `requirement-doc` |
| `gate1` / `gate2` / `gate2_5` / `gate3` | `gate_review` |
| `design` | `designer` |
| `architecture` | `architect` |
| `issues` | `requirement-to-issues` |
| `development` | `tdd_developer` / `github-publish` |
| `post_launch` | `post_launch_review` |

## 注意事项

- JSON 使用 2 空格缩进。
- 首次引入 v2 工作流的旧项目，需要先补齐 manifest 再继续流转。
- 详细规范见 `docs/workflow-manifest-spec.md`。
