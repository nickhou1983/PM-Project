# Task 模板（单个开发任务 md 文件）

## 文件路径

```text
projects/prd-{项目名}/tasks/{module_en_slug}/{MOD}-{NNN}-{short-slug}.md
```

- `{MOD}`：模块前缀，3-6 个大写字母（如 `AUTH`、`LIB`、`GEN`、`COMMON`）
- `{NNN}`：模块内三位序号（`001`、`002`...）
- `{short-slug}`：简短英文 slug（`login-page`、`user-schema`）

## Frontmatter

```yaml
---
id: {MOD}-{NNN}                       # 全局唯一标识，如 AUTH-001
title: {简洁中文标题}                 # 如：实现用户登录入口页面
module: {module_en_slug}              # 如：user-auth
priority: P0                          # P0 | P1 | P2
status: todo                          # todo | in-progress | blocked | done
estimate: 3 SP                        # 1 / 2 / 3 / 5 SP；> 5 必须再拆
task_type: ui                         # ui | api | db | infra | integration | e2e | docs

depends_on: []                        # 必须先完成的 task id 列表，如 [AUTH-002, COMMON-003]
blocks: []                            # 该任务完成后会解锁的 task id 列表
parallelizable_with: []               # 同一 Wave 内可并行的 task（参考用，非强制）

sources:
  main_prd: ../prd-{项目名}.md
  main_architecture: ../architecture-{项目名}.md
  module_prd: ../modules/prd-{module_en_slug}.md
  module_architecture: ../architecture-{项目名}-{module_en_slug}.md
  hifi_wireframes:
    - ../hifi-wireframes/{module_en_slug}-{page}.html

source_gaps: []                       # 缺失的 source 项；空数组表示完整
                                      # 例：["module_architecture missing", "no hifi for detail page"]

completed_at:                         # ISO8601，完成时填写
completed_by:                         # 完成者标识，完成时填写
---
```

## Body 模板

```markdown
## 任务目标

{1-2 句话说明这个任务交付什么、解决什么问题。聚焦"做什么"，不写"怎么做"。}

## 需求来源

- **主 PRD**：[prd-{项目名}.md](../prd-{项目名}.md) §{相关章节}
- **模块 PRD**：[prd-{module_en_slug}.md](../modules/prd-{module_en_slug}.md) §{相关章节}
- **关联用户故事**：US-XXX / US-YYY
- **关联功能点**：{功能点名称}（优先级：P0）

## 架构来源

- **主架构**：[architecture-{项目名}.md](../architecture-{项目名}.md) §{相关章节}
- **模块架构**：[architecture-{项目名}-{module_en_slug}.md](../architecture-{项目名}-{module_en_slug}.md) §{相关章节}
- **数据模型**：{相关表/字段}
- **API 端点**：{相关端点}
- **前端组件**：{相关页面/组件}

## 高保真原型来源

> 仅 UI 类 task 需要填写。非 UI task 可写"N/A（非 UI 类任务）"。

- [{页面名}](../hifi-wireframes/{module_en_slug}-{page}.html)

## 实现范围

- {要做的事 1}
- {要做的事 2}
- {要做的事 3}

## 不在范围

- {明确不做的事 1}
- {明确不做的事 2}

> 列出"不在范围"是为了避免任务边界蔓延（scope creep）。

## 技术方案要点

{基于模块架构的关键实现要点，3-7 条。包括：}

1. {数据流 / 状态管理方案}
2. {关键依赖库 / 中间件}
3. {错误处理 / 边界条件}
4. {性能 / 安全注意点}

## 涉及文件建议

> 仅作开工提示，实际可调整。

- 新建：`{path/to/new-file.ts}`
- 修改：`{path/to/existing-file.ts}`

## 依赖关系

- **前置依赖**：{depends_on 中每个 task 的简述与原因}
- **被依赖**：{blocks 中每个 task 的简述}

## 验收标准

> 来自模块 PRD §3.2，按测试类型分类。完成时逐项打勾。

- [ ] `[UI]` {UI 验收点}
- [ ] `[API]` {API 验收点}
- [ ] `[Unit]` {单元测试覆盖点}
- [ ] `[Integration]` {集成测试点}

## 测试要求

- **单元测试**：{覆盖目标，如关键纯函数、状态机分支}
- **集成测试**：{覆盖目标，如 API ↔ DB、前后端联调}
- **E2E 测试**：{是否需要、覆盖哪些用户路径}
- **可访问性**：{若 UI task，是否需要 WCAG 检查}

## 完成记录

> 任务完成时由开发者或 agent 填写。

- 完成时间：
- 完成者：
- PR / Commit：
- 关键决策记录：
- 偏离计划项：
- 下游待跟进：
```

## 字段约定速查

| 字段 | 必填 | 说明 |
|---|---|---|
| `id` | ✅ | 全局唯一，模块前缀 + 序号 |
| `module` | ✅ | 与目录名 `module_en_slug` 一致 |
| `priority` | ✅ | 来自 PRD 功能点优先级 |
| `status` | ✅ | 初始 `todo`，由执行流程更新 |
| `estimate` | ✅ | 故事点；> 5 SP 必须再拆 |
| `task_type` | ✅ | 决定 hi-fi 是否必填 |
| `depends_on` | ✅ | 空数组也要写 `[]` |
| `sources.main_prd` | ✅ | 整体需求追溯 |
| `sources.main_architecture` | ✅ | 整体技术追溯 |
| `sources.module_prd` | 模块化项目 ✅ | 模块需求追溯 |
| `sources.module_architecture` | 存在则 ✅ | 模块技术追溯 |
| `sources.hifi_wireframes` | UI task ✅ | 设计追溯 |
| `source_gaps` | ✅ | 显式记录缺失，空数组即完整 |
