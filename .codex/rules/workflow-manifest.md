# Workflow Manifest 规则

> 适用场景：创建/修改 workflow-manifest.json，或执行阶段切换时。

## 核心规则

1. **先校验再执行**：进入任何阶段前，必须用 `node scripts/workflow-manifest.js check <project> <stage>` 校验上游就绪；校验失败则拒绝继续并报错。
2. **产物落盘后写入**：在阶段主要产物写入磁盘后、向用户输出收尾摘要前，调用 `set` 写入本阶段条目。
3. **只写自己的阶段**：`set` 时仅更新本阶段字段，不要覆盖其它阶段数据。
4. **禁止自动提交**：manifest 文件由人工决定何时 git commit，Agent 不得自动 commit。

## 上游校验矩阵

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

## 标准命令

```bash
# 校验上游
node scripts/workflow-manifest.js check <project> <stage>

# 写入本阶段
echo '{"doc":"projects/prd-foo/prd-foo.md","version":"v1.0.0"}' \
  | node scripts/workflow-manifest.js set <project> <stage>
```

## 阶段与负责 Agent

| 阶段 | 负责 Agent/Skill |
|------|-----------------|
| intake | pm_assistant |
| prd | requirement-doc |
| gate1 / gate2 / gate2_5 / gate3 | gate_review |
| design | designer |
| architecture | architect |
| issues | requirement-to-issues |
| development | github-publish |
| post_launch | post_launch_review |

## 合法阶段值

`intake` | `prd` | `gate1` | `design` | `architecture` | `gate2` | `issues` | `gate2_5` | `development` | `gate3` | `post_launch`

## 注意事项

- JSON 序列化使用 2 空格缩进
- 首次接触 v2 流程的旧项目，由当前 Agent 创建 manifest 并回填历史阶段
- 完整规范参见 `docs/workflow-manifest-spec.md`
