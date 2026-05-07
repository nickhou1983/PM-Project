# tasks/README.md 模板

> 该文件由 `architecture-to-tasks` Skill 自动生成与刷新。手工修改可能在下次执行时被覆盖。

## 模板

```markdown
# {项目名} — 开发任务清单

- 项目目录：`projects/prd-{项目名}/`
- 总 task 数：{N}
- 模块数：{M}
- 最后更新：{ISO8601 时间}
- 配套导航：[task-dependency-map.md](./task-dependency-map.md)

> ⚠️ **执行规则**：
> 1. 不需要按编号顺序执行。先看下方 ✅ Ready 列表或 [task-dependency-map.md](./task-dependency-map.md) 的 Wave 批次。
> 2. 开始执行任一 task 前，**必须**做依赖前置检查（见 Skill 的 pre-execution-checklist）。
> 3. 依赖未满足 → 停下并告知，不得跳过。

## ✅ 当前可执行（Ready）

> 计算规则：`status == todo` 且所有 `depends_on` 已 `done`

| ID | 标题 | 模块 | 类型 | 优先级 | 估算 | 文件 |
|----|------|------|------|--------|------|------|
| AUTH-002 | 用户表结构 | user-auth | db | P0 | 2 SP | [文件](./user-auth/AUTH-002-user-schema.md) |
| COMMON-001 | 项目脚手架 | common | infra | P0 | 3 SP | [文件](./common/COMMON-001-scaffold.md) |

## 🔄 进行中（In Progress）

| ID | 标题 | 模块 | 开始时间 | 文件 |
|----|------|------|----------|------|
| — | — | — | — | — |

## 🔒 被阻塞（Blocked）

| ID | 标题 | 模块 | 阻塞原因 | 文件 |
|----|------|------|----------|------|
| AUTH-003 | 登录 API | user-auth | 等待 AUTH-002 | [文件](./user-auth/AUTH-003-login-api.md) |

## ✔️ 已完成（Done）

| ID | 标题 | 模块 | 完成时间 | 文件 |
|----|------|------|----------|------|
| — | — | — | — | — |

## 📊 Source 覆盖矩阵

> ✅ 已挂载  ⚠️ 缺失  N/A 不适用

| Task | Module | Type | Main PRD | Main Arch | Module PRD | Module Arch | Hi-Fi |
|------|--------|------|----------|-----------|------------|-------------|-------|
| AUTH-001 | user-auth | ui | ✅ | ✅ | ✅ | ✅ | ✅ |
| AUTH-002 | user-auth | db | ✅ | ✅ | ✅ | ✅ | N/A |
| AUTH-003 | user-auth | api | ✅ | ✅ | ✅ | ✅ | N/A |
| LIB-001 | video-library | ui | ✅ | ✅ | ✅ | ✅ | ⚠️ Missing |
| LIB-002 | video-library | api | ✅ | ✅ | ✅ | ⚠️ Missing | N/A |

### Source 缺失清单

> 任何 ⚠️ 项需在开始执行前补齐或在 task `source_gaps` 中显式确认。

- LIB-001：缺少高保真原型（建议补 `hifi-wireframes/video-library-detail.html`）
- LIB-002：缺少模块架构（建议运行 `architect` agent 补充）

## 📁 模块索引

| 模块 | Task 数 | P0 / P1 / P2 | 模块 PRD | 模块架构 |
|------|---------|--------------|----------|----------|
| user-auth | 5 | 3 / 2 / 0 | [PRD](../modules/prd-user-auth.md) | [Arch](../architecture-{项目名}-user-auth.md) |
| video-library | 6 | 4 / 1 / 1 | [PRD](../modules/prd-video-library.md) | ⚠️ 缺失 |
| common | 2 | 2 / 0 / 0 | N/A（基础设施） | N/A |

## 📈 统计

- 类型分布：UI {x} / API {y} / DB {z} / Infra {w} / Integration {v} / E2E {u}
- 优先级分布：P0 {a} / P1 {b} / P2 {c}
- 总估算：{N} SP
- 完成度：{done} / {total} （{百分比}%）
```

## 字段说明

| 段落 | 数据来源 | 刷新时机 |
|---|---|---|
| Ready / In Progress / Blocked / Done | 所有 task 的 `status` + `depends_on` | 每次 task 状态变更 |
| Source 覆盖矩阵 | 所有 task 的 `sources` + `source_gaps` | 生成时 + 补齐 source 后 |
| 模块索引 | 模块 PRD / 模块架构文件存在性 | 生成时 |
| 统计 | 全量聚合 | 每次状态变更 |
