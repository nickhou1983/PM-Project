# workflow-manifest.json 规范（v1.0）

> 跨阶段数据契约。所有 pm_assistant 下游工作流的 Agent / Skill 在产出主要文档时，必须按本规范追加写入对应阶段条目；下游 Agent 启动前必须先校验上游条目存在且 Gate 通过。

详细背景见 [`pm-assistant-downstream-workflow.md` §7.2](pm-assistant-downstream-workflow.md)。

---

## 1. 文件位置

```text
projects/prd-{项目英文名}/workflow-manifest.json
```

- 一个项目一个 manifest，跨多次迭代复用
- 不存在时，**首个写入方**（通常是 pm_assistant）必须创建
- 文件由人工或 Agent 编辑，禁止自动 git commit；提交策略由项目自定

## 2. JSON Schema（v1.0）

```json
{
  "project": "string (项目英文 slug)",
  "manifest_version": "1.0",
  "current_stage": "intake | prd | gate1 | design | architecture | gate2 | issues | gate2_5 | development | gate3 | post_launch",
  "updated_at": "ISO 8601",
  "stages": {
    "intake":        { "agent": "pm_assistant", "report": "string (path)", "trigger_source": "product_inspiration | user_feedback | competitor_chase | compliance | tech_debt | data_driven", "completed_at": "YYYY-MM-DD", "iteration_mode": "new | iterative", "baseline_prd_version": "string?" },
    "prd":           { "skill": "requirement-doc", "doc": "string (path)", "version": "string (semver)", "module_count": "int", "modular": "bool", "module_signals_hit": "int" },
    "gate1":         { "decision": "Go | Conditional Go | No-Go", "mode": "Lite | Standard | Strict", "score": "float", "report": "string (path to gate-results json)", "attempt": "int", "warnings_open": "int" },
    "design":        { "agent": "designer", "doc": "string (path to hifi-wireframes/)", "checkpoint_with_arch": "string? (path to design-arch-sync-{date}.md)" },
    "architecture":  { "agent": "architect", "doc": "string (path)", "version": "string", "linked_prd": "string", "module_arch_count": "int" },
    "gate2":         { "decision": "...", "mode": "...", "score": "float", "report": "string", "attempt": "int", "warnings_open": "int", "merged_with_gate2_5": "bool" },
    "issues":        { "skill": "requirement-to-issues", "epic_count": "int", "task_count": "int", "test_skeletons_generated": "bool", "target_repo": "owner/repo" },
    "gate2_5":       { "decision": "...", "mode": "...", "score": "float", "report": "string", "merged_into_gate2": "bool" },
    "development":   { "pr_links": ["string"], "open_defect_reports": "int", "linked_issue_count": "int" },
    "gate3":         { "decision": "...", "mode": "...", "score": "float", "report": "string", "attempt": "int" },
    "post_launch":   { "agent": "post_launch_review", "report": "string (path)", "review_round": "int" }
  },
  "feedback_log": [
    { "from_stage": "string", "to_stage": "string", "file": "string (path)", "blocking": "bool", "opened_at": "YYYY-MM-DD", "closed_at": "YYYY-MM-DD?" }
  ],
  "ai_runs_index": "string? (路径前缀，默认为 runs/)"
}
```

未涉及的阶段字段保持 `null` 或省略。

## 3. 标准接入步骤（每个 Skill / Agent 通用）

> **写入流程**：以下 5 步必须在阶段「主要产物落盘后、向用户输出收尾摘要前」执行。

1. **定位项目目录**：从产物路径推导 `project_dir = projects/prd-{项目英文名}`。
2. **读取 manifest**：若 `workflow-manifest.json` 不存在则初始化骨架（仅设置 `project` / `manifest_version` / `stages={}`）。
3. **校验上游**（强制）：根据下表校验上游阶段已存在且 Gate 通过；缺失 → 拒绝继续并向用户报错。
4. **写入本阶段条目**：仅更新本阶段相关字段，不要覆盖其它阶段；同步更新 `current_stage` 与 `updated_at`。
5. **回写文件**：使用 2 空格缩进的 JSON 序列化，确保稳定 diff。

### 上游校验矩阵

| 当前阶段 | 必须存在 | 必须 Gate 通过 |
|---------|---------|---------------|
| intake | — | — |
| prd | `intake` | — |
| gate1 | `prd` | — |
| design | `prd` | `gate1.decision != No-Go` |
| architecture | `prd` | `gate1.decision != No-Go` |
| gate2 | `architecture` | `gate1.decision != No-Go` |
| issues | `architecture` | `gate2.decision != No-Go`（若 `gate2.merged_with_gate2_5=true` 则 issues 由本 Gate 一并校验） |
| gate2_5 | `issues` | — |
| development | `issues` | `gate2.decision != No-Go` 且（`gate2.merged_with_gate2_5=true` 或 `gate2_5.decision != No-Go`） |
| gate3 | `development` | — |
| post_launch | `gate3` | `gate3.decision != No-Go` |

### Defect Report 联动

下游 Agent 若产出 `Upstream Defect Report`，必须同时向 `feedback_log[]` 追加一项；上游修复后由上游 Agent 将 `closed_at` 写入。

### AI 运行时埋点联动

每个 Agent / Skill 收尾时，如同时写入 `runs/{date}-{actor}.json`，无需再修改 manifest（pm_workflow_evaluator 自动按目录扫描）。

## 4. 推荐工具

仓库提供脚本 `scripts/workflow-manifest.js`：

```bash
# 初始化 / 读取
node scripts/workflow-manifest.js init <project>
node scripts/workflow-manifest.js show  <project>

# 写入阶段条目（JSON 通过 stdin 传入）
echo '{"version":"v1.0.0","doc":"projects/prd-foo/prd-foo.md","module_count":4}' \
  | node scripts/workflow-manifest.js set <project> prd

# 校验上游
node scripts/workflow-manifest.js check <project> architecture
```

Agent / Skill 可直接调用该脚本，避免每个 Skill 内嵌 JSON 操作逻辑。

## 5. 兼容与迁移

- 已有项目首次接触 v2 流程时，由当前阶段 Agent 立即创建 manifest 并按当前已有产物**回填历史阶段**字段。
- 字段缺失不视为破坏性变更；新增字段以追加为主，移除字段需提升 `manifest_version`。
