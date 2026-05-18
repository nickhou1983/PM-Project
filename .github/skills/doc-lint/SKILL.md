---
name: "doc-lint"
description: "文档质量 Lint 检查 Skill。对 PRD、架构文档进行结构化 Lint 检查，自动生成需求追溯矩阵（RTM），追踪 Gate Warning 闭环。触发条件：(1) PRD Lint/文档检查，(2) 架构文档 Lint，(3) 生成 RTM/需求追溯矩阵，(4) Warning 追踪/扫描，(5) 文档质量检查，(6) Gate 预检，(7) doc-lint。"
---

# 文档质量 Lint 检查

对 PRD 和架构文档进行自动化结构 Lint，生成需求追溯矩阵（RTM），追踪 Warning 闭环。与 `gate_review` Agent 互补：本 Skill 提供前置自动化检查，减少人工 Gate 评审负担。

## 工具清单

| 脚本 | 路径 | 功能 |
|------|------|------|
| `prd-lint.js` | `.github/skills/doc-lint/scripts/prd-lint.js` | PRD + Module PRD 结构 Lint（R01-R09 + MR01-MR08） |
| `arch-lint.js` | `.github/skills/doc-lint/scripts/arch-lint.js` | 架构文档结构 Lint（AR01-AR09 + MAR01-MAR02） |
| `generate-rtm.js` | `.github/skills/doc-lint/scripts/generate-rtm.js` | 需求追溯矩阵自动生成 |
| `warning-tracker.js` | `.github/skills/doc-lint/scripts/warning-tracker.js` | Warning 扫描 / 解决 / 状态查询 |

## 用法

### 1. PRD Lint

```bash
node .github/skills/doc-lint/scripts/prd-lint.js <project>
```

检查规则：

| 规则 | 描述 | Gate 映射 |
|------|------|----------|
| R01 | §1-§11 章节全部存在 | Gate1#1 |
| R02 | §4 功能表有优先级列 | Gate1#3 |
| R03 | §5 NFR 有目标值列 | Gate1#4 |
| R04 | 文档头版本 = §11 最新条目 | Gate1#25 |
| R05 | 状态字段为有效值 | Gate1#26 |
| R06 | §3 用户故事有验收标准 | Gate1#2 |
| R07 | §4 RICE 列非空 | Gate1#9 |
| R08 | 模块导航引用文件存在 | Gate1#8 |
| R09 | 模糊词密度 < 2% | 新增 |
| MR01-MR08 | Module PRD §1-§7 内容检查 | Gate1#F1-F8 |

### 2. 架构 Lint

```bash
node .github/skills/doc-lint/scripts/arch-lint.js <project>
```

检查规则：

| 规则 | 描述 | Gate 映射 |
|------|------|----------|
| AR01 | §0-§12 章节全部存在 | Gate2#1 |
| AR02 | §2 技术选型有选型理由 | Gate2#2 |
| AR03 | §1.5 需求追溯矩阵覆盖 P0 | Gate2#12 |
| AR04 | §3 系统架构图 Mermaid 存在 | Gate2#3 |
| AR05 | §4 ER 图 Mermaid 存在 | Gate2#4 |
| AR06 | 关联 PRD 含精确版本号 | Gate2#30 |
| AR07 | 版本号与 §12 变更记录一致 | Gate2#32 |
| AR08 | 模块级架构文件全部存在 | Gate2#9 |
| AR09 | §0 索引表引用完整 | Gate2#10 |

### 3. 需求追溯矩阵 (RTM)

```bash
node .github/skills/doc-lint/scripts/generate-rtm.js <project>
```

自动从 PRD §4 功能表、架构 §1.5 追溯矩阵、本地 Issue 数据聚合生成 RTM。输出覆盖状态：full / no-arch / no-issue / prd-only。

### 4. Warning 追踪

```bash
# 扫描所有 gate-results JSON，提取 warn/fail 项
node .github/skills/doc-lint/scripts/warning-tracker.js scan <project>

# 标记某个 warning 为已解决
node .github/skills/doc-lint/scripts/warning-tracker.js resolve <project> <warning-id> [note]

# 查看当前状态摘要
node .github/skills/doc-lint/scripts/warning-tracker.js status <project>
```

## 输出格式

所有工具输出 **JSON + Markdown 双格式**，写入 `projects/prd-{PROJECT}/gate-results/`：

| 工具 | JSON | Markdown |
|------|------|----------|
| prd-lint | `prd-lint-{date}.json` | `prd-lint-{date}.md` |
| arch-lint | `arch-lint-{date}.json` | `arch-lint-{date}.md` |
| generate-rtm | `rtm-{date}.json` | `rtm-{date}.md` |
| warning-tracker | `warnings-tracker.json` | `warnings-status-{date}.md` |

## 工作流集成

### Gate Review 前置

在调用 `gate_review` Agent 前，先运行 doc-lint 做预检：

```bash
# Gate 1 (PRD) 前
node .github/skills/doc-lint/scripts/prd-lint.js <project>

# Gate 2 (架构) 前
node .github/skills/doc-lint/scripts/arch-lint.js <project>
node .github/skills/doc-lint/scripts/generate-rtm.js <project>
```

如果 lint 发现 `fail` 级别问题，建议先修复再提交 Gate Review。

### pm_workflow_evaluator 维度支撑

- **Dim1 工作流完整性**：RTM 覆盖率
- **Dim2 跨阶段可追溯性**：RTM full 占比
- **Dim3 产物版本一致性**：R04 / AR07 检查结果
- **Dim5 需求质量信号**：R09 模糊词密度

## 退出码

| 码 | 含义 |
|----|------|
| 0 | 全部通过（仅 pass + warn） |
| 1 | 存在 fail 级别问题 |
| 2 | 参数错误 |
