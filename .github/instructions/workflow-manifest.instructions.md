---
description: "Use when creating, modifying, or integrating workflow-manifest.json; writing or editing Agent/Skill files that need manifest integration; checking upstream stage dependencies; adding feedback_log entries; or debugging manifest check failures. Keywords: manifest, stage, upstream, gate, pipeline, workflow contract."
applyTo: "**/workflow-manifest.json"
---

# Workflow Manifest 约定

本项目通过 `projects/prd-{project}/workflow-manifest.json` 实现跨阶段数据契约。所有 Agent / Skill 必须遵守以下规则。

## 核心规则

1. **先校验再执行**：进入任何阶段前，必须用 `node scripts/workflow-manifest.js check <project> <stage>` 校验上游就绪；校验失败则拒绝继续并报错。
2. **产物落盘后写入**：在阶段主要产物写入磁盘后、向用户输出收尾摘要前，调用 `set` 写入本阶段条目。
3. **只写自己的阶段**：`set` 时仅更新本阶段字段，不要覆盖其它阶段数据。
4. **禁止自动提交**：manifest 文件由人工决定何时 git commit，Agent 不得自动 commit。

## 上游校验矩阵（速查）

| 当前阶段 | 必须存在 | Gate 必须非 No-Go |
|---------|---------|------------------|
| intake | — | — |
| prd | intake | — |
| gate1 | prd | — |
| design / architecture | prd | gate1 |
| gate2 | architecture | gate1 |
| issues | architecture | gate2 |
| gate2_5 | issues | — |
| development | issues | gate2 + (gate2_5 或 merged) |
| gate3 | development | — |
| post_launch | gate3 | gate3 |

## 标准接入模板

在 Agent / Skill 文件中嵌入以下步骤（通常作为收尾步骤）：

```bash
# 1. 校验上游
node scripts/workflow-manifest.js check <project> <stage>

# 2. 写入本阶段（JSON 通过 stdin）
echo '{"doc":"projects/prd-foo/prd-foo.md","version":"v1.0.0"}' \
  | node scripts/workflow-manifest.js set <project> <stage>
```

## 阶段与负责方速查

| 阶段 | 负责 Agent/Skill | 关键字段 |
|------|-----------------|---------|
| intake | pm_assistant | report, trigger_source |
| prd | requirement-doc | doc, version, module_count |
| gate1 / gate2 / gate2_5 / gate3 | gate_review | decision, mode, score, report |
| design | designer | doc, checkpoint_with_arch |
| architecture | architect | doc, version, module_arch_count |
| issues | requirement-to-issues | epic_count, task_count, target_repo |
| development | github-publish | pr_links, open_defect_reports |
| post_launch | post_launch_review | report, review_round |

## Defect Report 联动

下游发现上游产物缺陷时：
- 在 `projects/prd-{project}/feedback/` 生成 defect report 文件
- 同时向 manifest 的 `feedback_log[]` 追加条目（含 from_stage / to_stage / file / blocking）
- 上游修复后由上游 Agent 填写 `closed_at`

## 注意事项

- 合法阶段值：`intake | prd | gate1 | design | architecture | gate2 | issues | gate2_5 | development | gate3 | post_launch`
- JSON 序列化使用 2 空格缩进
- 首次接触 v2 流程的旧项目，由当前 Agent 创建 manifest 并回填历史阶段
- 完整规范参见 `docs/workflow-manifest-spec.md`
