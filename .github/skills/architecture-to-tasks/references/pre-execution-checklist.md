# Pre-Execution Checklist — 执行单个 task 前的依赖与 Source 检查流程

> **用途**：用户要求开始执行某个 task（如「开始 AUTH-001」）时必须运行的强制检查流程。
>
> **核心硬规则**：任一 `depends_on` 未 `done` → **立即停止 → 告知用户 → 等待决定**，绝不静默继续。

## 触发条件

用户表达任一意图：

- 「开始 / 开做 / 执行 / 实现 {task ID}」
- 「按 task 开发 {task ID}」
- 「现在做 {task ID}」
- 通过 `tdd_developer` 等下游 agent 接收到 task ID 作为输入

## 检查流程

### Step 1：定位与解析

```text
1.1 在 projects/prd-{项目名}/tasks/**/{ID}-*.md 定位文件
    ❌ 文件不存在 → 报错并停止："找不到 task {ID}，请检查 ID 或先生成 task 文件"
1.2 解析 frontmatter
    ❌ YAML 解析失败 → 报错并停止，输出错误位置
1.3 提取关键字段：id / title / status / depends_on / task_type / sources / source_gaps
```

### Step 2：跑 9 项检查

按顺序执行，任一**硬性失败**项必须立即停止；**警告**项需提示用户但可继续。

| # | 检查项 | 失败级别 | 不通过的处理 |
|---|---|---|---|
| 1 | task 文件存在且 frontmatter 可解析 | 🛑 硬停 | 报错并停止 |
| 2 | task 当前 `status != done` | 🛑 硬停 | 提示「该 task 已完成（{completed_at}）」并停止 |
| 3 | 所有 `depends_on` 的 task 文件都能找到 | 🛑 硬停 | 列出找不到的 ID 并停止 |
| 4 | **所有 `depends_on` 的 status == `done`** | 🛑 硬停 | **按 Step 3 输出格式提示并停止** |
| 5 | `sources.main_prd` 文件存在 | ⚠️ 警告 | 提示但可继续 |
| 6 | `sources.main_architecture` 文件存在 | ⚠️ 警告 | 提示但可继续 |
| 7 | `sources.module_prd` / `module_architecture` 文件存在（若声明） | ⚠️ 警告 | 提示但可继续 |
| 8 | UI 类 task 的 `sources.hifi_wireframes` 至少含 1 个存在的文件 | 🛑 硬停 | **停止并提示补设计**（建议触发 `designer` agent） |
| 9 | `source_gaps` 为空 | ⚠️ 警告 | 列出 gap 并询问「是否在缺料情况下继续？」 |

> 第 4 项和第 8 项是本 Skill 最关键的两条硬规则。

### Step 3：依赖未满足时的标准输出

```text
⚠️ 无法开始 {ID} {title}：依赖未满足

未完成依赖：
- ❌ {DEP-ID-1} {title}（status: {todo|in-progress|blocked}） → tasks/{module}/{file}
- ❌ {DEP-ID-2} {title}（status: {...}） → tasks/{module}/{file}

已完成依赖：
- ✅ {DEP-ID-3} {title}（done）
- ✅ ...

📍 建议下一步：
1. 优先执行可立即启动的依赖：{自身 depends_on 也已满足的 DEP-ID 列表}
2. 完成后再回到 {ID}

是否切换到 {建议的下一个 DEP-ID} 开始执行？(y/n/选其它 ID)
```

**禁止行为**：

- ❌ 不得在用户未明确确认的情况下跳过未完成依赖
- ❌ 不得自动开始执行依赖（因为依赖本身可能也有未满足的依赖；让用户走完整的依赖检查流程）
- ❌ 不得仅以「警告」形式继续推进实现

### Step 4：UI Task 的 Hi-Fi 缺失输出

```text
⚠️ 无法开始 {ID} {title}：UI 类 task 缺少高保真原型

预期挂载：sources.hifi_wireframes（至少 1 个存在的 html 文件）
当前状态：
- 声明的文件：{列出 sources.hifi_wireframes 中每一项及是否存在}
- source_gaps：{列出 source_gaps 中与 hifi 相关的项}

📍 建议下一步：
1. 运行 `designer` agent 为该模块补充高保真原型
2. 或在 task md 中明确说明为何不需要 hi-fi（并修正 task_type）
3. 补充后重新执行检查
```

### Step 5：检查全部通过

```text
1. 将 task status 从 todo 更新为 in-progress
2. 同步刷新：
   - tasks/README.md 的 Ready / In Progress 段
   - tasks/task-dependency-map.md 的 Ready Queue 段
3. 输出 task 实现摘要给后续开发流程：
   - 任务目标（来自 ## 任务目标）
   - 实现范围（来自 ## 实现范围）
   - 涉及文件建议（来自 ## 涉及文件建议）
   - 验收标准（来自 ## 验收标准）
4. 如果用户的下游意图是 TDD 开发，建议交接给 tdd_developer agent，并把 task 文件路径作为输入
```

### Step 6：task 完成后的收尾

```text
6.1 用户确认完成后：
    - status: in-progress → done
    - 填充 completed_at（ISO8601）、completed_by
    - 在 ## 完成记录 中追加：PR/Commit、关键决策、偏离计划项、下游待跟进
6.2 重新计算并刷新两个索引文件：
    - tasks/README.md：Done 段、Source 覆盖矩阵、统计
    - tasks/task-dependency-map.md：Ready Queue、Mermaid 节点 done 样式
6.3 输出新解锁的 task 列表：
    "完成 {ID} 后解锁了以下 task，可立即开工："
    - {newly ready ID 1} ...
```

## 完整示例：依赖未满足

输入：用户说「开始执行 AUTH-005」

输出：

```text
⚠️ 无法开始 AUTH-005 用户登出接口：依赖未满足

未完成依赖：
- ❌ AUTH-002 用户表结构（status: todo） → tasks/user-auth/AUTH-002-user-schema.md
- ❌ COMMON-003 鉴权中间件（status: in-progress） → tasks/common/COMMON-003-auth-middleware.md

已完成依赖：
- ✅ AUTH-001 用户登录入口（done）

📍 建议下一步：
1. 优先执行可立即启动的依赖：AUTH-002（其 depends_on 为空）
2. COMMON-003 已在进行中，确认是否需要先完成
3. 完成上述依赖后再回到 AUTH-005

是否切换到 AUTH-002 开始执行？(y/n/选其它 ID)
```

## 完整示例：检查通过

输入：用户说「开始执行 AUTH-002」

输出：

```text
✅ AUTH-002 用户表结构 — Pre-Execution Checklist 全部通过

依赖检查：无前置依赖
Source 检查：
- ✅ 主 PRD：projects/prd-ai-video-creator/prd-ai-video-creator.md
- ✅ 主架构：projects/prd-ai-video-creator/architecture-ai-video-creator.md
- ✅ 模块 PRD：modules/prd-user-auth.md
- ✅ 模块架构：architecture-ai-video-creator-user-auth.md
- N/A Hi-Fi 原型（非 UI 类任务）

状态更新：todo → in-progress

📋 实现摘要：
- 任务目标：建立 users 表与基础索引
- 实现范围：3 项（详见 task md ## 实现范围）
- 涉及文件建议：db/migrations/202604xx_create_users.sql
- 验收标准：4 项 [Unit/Integration]

下一步建议：交接给 tdd_developer agent 进行 TDD 开发，输入 = tasks/user-auth/AUTH-002-user-schema.md
```
