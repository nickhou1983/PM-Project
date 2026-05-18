# 本地 Issue 文件模板

本文件定义本地存储模式下生成的 Markdown Issue 文件格式。每个文件包含 YAML frontmatter 元数据和正文两部分。

## Epic 文件模板

文件名格式：`epic-{NN}-{module_en_slug}.md`

```markdown
---
id: "epic-{NN}"
type: epic
title: "[{项目名}] {模块中文名} ({module_en_slug}) — 功能需求"
project: "{项目名}"
module: "{module_en_slug}"
priority: "{P0|P1|P2}"
labels:
  - enhancement
  - epic
  - "project:{项目名}"
  - "priority:{P0|P1|P2}"
  - "module:{module_en_slug}"
milestone: "{里程碑名称}"
assignee: ""
story_points: {总 SP}
children:
  - "task-{NN}"
  - "task-{NN}"
dependencies:
  - "{依赖模块 slug}"
status: "open"
created_at: "{YYYY-MM-DDTHH:mm:ssZ}"
prd_version: "{PRD 版本号}"
---

{以下内容按 issue-template.md 模板生成，与 GitHub 模式的 Issue Body 一致}
```

## Task 文件模板

文件名格式：`task-{NN}-{feature_slug}.md`

```markdown
---
id: "task-{NN}"
type: task
title: "[{项目名}] {功能点名称}"
project: "{项目名}"
module: "{module_en_slug}"
priority: "{P0|P1|P2}"
labels:
  - enhancement
  - task
  - "project:{项目名}"
  - "priority:{P0|P1|P2}"
  - "module:{module_en_slug}"
parent: "epic-{NN}"
story_points: {SP}
acceptance_criteria:
  - "{验收条件 1}"
  - "{验收条件 2}"
status: "open"
created_at: "{YYYY-MM-DDTHH:mm:ssZ}"
prd_version: "{PRD 版本号}"
---

{以下内容按 sub-issue-template.md 模板生成，与 GitHub 模式的子 Issue Body 一致}
```

## 索引文件模板

文件名：`_index.md`

```markdown
# {项目名} — Issue 索引

> 自动生成于 {YYYY-MM-DD}，基于 PRD v{版本号}
> 存储模式：本地 | 项目目录：projects/prd-{project}/issues/

## 概览

| 指标 | 值 |
| ---- | -- |
| 模块（Epic）数 | {M} |
| 任务（Task）数 | {N} |
| 总故事点 | {T} SP |
| 最高优先级 | {最高优先级} |
| PRD 版本 | v{版本号} |

## 模块依赖图

```mermaid
graph LR
  {module_a} --> {module_b}
  {module_c} --> {module_a}
```

## Issue 清单

| 编号 | 标题 | 类型 | 优先级 | 模块 | SP | 父 Issue | 状态 |
| ---- | ---- | ---- | ------ | ---- | -- | -------- | ---- |
| epic-01 | [{项目名}] {模块名} — 功能需求 | Epic | P0 | {module} | {sp} | — | open |
| task-02 | [{项目名}] {功能点名} | Task | P0 | {module} | {sp} | epic-01 | open |

## 文件列表

- [_index.md](./_index.md) — 本文件
- [epic-01-{module}.md](./epic-01-{module}.md) — {模块名}
- [task-02-{feature}.md](./task-02-{feature}.md) — {功能点名}
```

## 编号规则

1. Epic 和 Task 使用统一编号序列（不分开计数）
2. 编号从 `01` 开始，两位数零填充
3. Epic 在前，其下属 Task 紧跟其后
4. 示例排列：`epic-01`, `task-02`, `task-03`, `epic-04`, `task-05`...

## 文件名 Slug 规则

- 使用小写英文 + 连字符（kebab-case）
- 仅保留字母、数字、连字符
- 从模块英文名或功能点英文名派生
- 示例：`user-system`、`prompt-generation`、`video-export`
