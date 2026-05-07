---
name: architecture-to-tasks
description: "将 PRD 与架构设计转化为本地可执行的开发任务文件（Markdown）。基于主 PRD、主架构、模块 PRD、模块架构以及高保真原型，按模块拆分生成 task md 文件，输出到 projects/prd-{项目名}/tasks/ 目录，并自动生成跨模块依赖图与 Ready Queue。每个 task 在执行前必须做依赖前置检查。触发条件：(1) PRD/架构 转 task，(2) 生成开发任务清单/todo task，(3) 拆分本地任务文件，(4) 生成 tasks 文件夹，(5) 基于架构设计创建待办，(6) 任务依赖图/开发顺序规划，(7) 准备开始按 task 逐个开发前。"
---

# 架构与 PRD 转开发任务（本地 Markdown）

将 `requirement-doc` 生成的 PRD 与 `architect` 生成的架构文档，结合 `designer` 输出的高保真原型，拆分为**本地 Markdown 开发任务文件**，供后续逐个 task 开发使用。

> 本 Skill 与 `requirement-to-issues` 互补：后者输出 GitHub Issues，本 Skill 输出本地 task md 文件，更适合离线、按依赖顺序、单机迭代的开发节奏。

## 核心原则

1. **可追溯性**：每个 task 必须可追溯到主 PRD、主架构、模块 PRD、模块架构；UI 类 task 必须追溯到对应高保真原型文件。
2. **依赖驱动顺序**：编号 = 身份证，依赖 = 路线图。**不需要按编号顺序执行**，按依赖图和 Ready Queue 执行。
3. **依赖前置检查（硬规则）**：执行任一 task 前必须检查其 `depends_on`，**任一依赖未完成 → 立即停止 → 告知用户 → 等待决定**，绝不静默继续。
4. **生成 + 执行双阶段**：本 Skill 既负责**生成** task 文件，也负责在用户启动某个 task 开发时执行**前置检查**。

## 参考文件

| 文件 | 内容 | 何时加载 |
| ---- | ---- | -------- |
| [task-template.md](references/task-template.md) | 单个 task md 文件的标准模板 | 步骤 6 生成 task 内容时 |
| [tasks-readme-template.md](references/tasks-readme-template.md) | `tasks/README.md` 模板（Ready / Blocked / Done + 覆盖矩阵） | 步骤 7 生成索引时 |
| [task-dependency-map-template.md](references/task-dependency-map-template.md) | `tasks/task-dependency-map.md` 模板（Mermaid + Wave 批次 + 关键路径） | 步骤 7 生成依赖图时 |
| [pre-execution-checklist.md](references/pre-execution-checklist.md) | 执行单个 task 前的依赖与 source 检查流程 | 用户要求开始执行某个 task 时 |

## 输出目录约定

```text
projects/prd-{项目名}/tasks/
├── README.md                          # 状态快照（Ready / Blocked / Done + 覆盖矩阵）
├── task-dependency-map.md             # 全局开发顺序导航（Mermaid + Wave + 关键路径）
└── {module_en_slug}/
    ├── {MOD}-001-{short-slug}.md
    ├── {MOD}-002-{short-slug}.md
    └── ...
```

**编号规则**：模块前缀 + 模块内序号（如 `AUTH-001`、`LIB-002`），全局唯一，但**不代表执行顺序**。

## 工作流总览

本 Skill 有两条工作流，根据用户意图分流：

```text
意图 A：生成 task 文件          → 走「生成工作流」（步骤 1-7）
意图 B：开始执行某个 task       → 走「执行前检查工作流」（步骤 E1-E5）
```

---

## 生成工作流（A）

### 步骤 1：定位项目与产物

1. 询问或推断目标项目目录：`projects/prd-{项目名}/`
2. 读取并校验以下文件存在性：
   - 主 PRD：`prd-{项目名}.md`（**必需**）
   - 主架构：`architecture-{项目名}.md`（**必需**）
   - 模块 PRD 目录：`modules/prd-*.md`（模块化项目必需）
   - 模块架构：`architecture-{项目名}-{module_en_slug}.md`（按模块逐个检测）
   - 低保真原型：`wireframes/*.html`
   - 高保真原型：`hifi-wireframes/*.html`
3. 任一**必需**产物缺失 → 停止并提示用户先生成。
4. 记录每个文件的相对路径与版本号（从文档头解析）。

### 步骤 2：解析模块清单

1. 从主 PRD §4.1 模块导航表提取所有模块的 `module_en_slug` 与中文名。
2. 对每个模块检查是否存在 `modules/prd-{module_en_slug}.md` 与 `architecture-{项目名}-{module_en_slug}.md`，记录 source 完整性。
3. 输出模块清单（用于步骤 3 的任务拆分）。

### 步骤 3：从 PRD + 架构拆分工程任务

为每个模块生成一组 task。拆分粒度参考下表：

| 维度 | 拆分依据 | 典型 task 类型 |
|---|---|---|
| 数据 | 模块架构「数据模型」章节每张表 / 实体 | DB / Schema |
| 后端 | 模块架构「API 端点」表每个端点或一组紧耦合端点 | API |
| 前端 | 模块架构「前端组件」表每个页面 / 关键组件 | UI |
| 集成 | 模块架构提到的第三方服务或跨模块调用 | Integration |
| 基础设施 | 主架构提到的脚手架、CI、部署、共用中间件 | Infra（可放 `common/`） |
| 测试 | PRD §3.2 验收标准中需要专门补强的端到端场景 | E2E |

**单 task 粒度建议**：1-3 SP / 半天到 2 天可完成 / 单一职责（一个 API、一个页面、一张表的迁移等）。超过 5 SP 必须再拆。

### 步骤 4：判定每个 task 是否为 UI 类型

满足任一条件即标记 `task_type: ui`：

- 涉及页面、路由、组件、表单、列表、详情、弹窗、导航
- 模块架构「前端组件」中引用了该任务范围
- PRD/模块 PRD 描述包含「页面」「入口」「展示」「上传」「预览」「配置」等前端行为
- 任务标题或描述中包含 `UI` / `frontend` / `component` / `page` / `view` / `wireframe` / `hifi`

非 UI 类型按主导工作分类为：`api` / `db` / `infra` / `integration` / `e2e` / `docs`。

### 步骤 5：为每个 task 绑定 Source

每个 task 的 `sources` 字段按以下规则填充：

| Source 类型 | 是否必填 | 来源 |
|---|---|---|
| `main_prd` | 必填 | `../prd-{项目名}.md` |
| `main_architecture` | 必填 | `../architecture-{项目名}.md` |
| `module_prd` | 模块化项目必填 | `../modules/prd-{module_en_slug}.md` |
| `module_architecture` | 存在则必填 | `../architecture-{项目名}-{module_en_slug}.md` |
| `hifi_wireframes` | **UI 类 task 必填** | `../hifi-wireframes/*.html` |

**Hi-Fi 匹配规则**：

1. 优先按 `{module_en_slug}-` 前缀匹配（如 `user-auth-entry.html`）
2. 一个 UI task 可挂多个 hi-fi 文件（如列表页 + 详情页）
3. UI task 找不到匹配 hi-fi → **不能省略**，写入 `source_gaps` 并在终端给出警告

### 步骤 6：建立依赖关系并生成 task 文件

1. **依赖推导规则**（按优先级从上到下）：
   - UI task `depends_on` 同模块对应的 API task
   - API task `depends_on` 同模块对应的 DB / Schema task
   - 任何业务模块的首批 task `depends_on` 基础设施 task（如脚手架、鉴权中间件）
   - 跨模块依赖来自 PRD §4.1 模块导航表的「依赖模块」字段或主架构中的服务调用关系
2. 按 [task-template.md](references/task-template.md) 渲染每个 task md 文件，写入 `projects/prd-{项目名}/tasks/{module_en_slug}/{MOD}-{NNN}-{slug}.md`。
3. `status` 初始值统一为 `todo`。
4. 同步填充 `blocks` 字段（被哪些 task 依赖），便于反向追溯。

### 步骤 7：生成索引文件

1. 按 [task-dependency-map-template.md](references/task-dependency-map-template.md) 生成 `tasks/task-dependency-map.md`：
   - Mermaid 跨模块依赖图（P0 绿、P1 黄、P2 灰）
   - 推荐执行批次（Wave 1 / 2 / 3 ...，按拓扑排序自动分批）
   - 当前 Ready Queue
   - 关键路径
2. 按 [tasks-readme-template.md](references/tasks-readme-template.md) 生成 `tasks/README.md`：
   - Ready / Blocked / Done 三栏快照
   - Source 覆盖矩阵（每个 task × 5 类 source）
3. 在终端输出生成摘要：task 总数、各模块数量、UI/API/DB 占比、source 缺失项、Ready Queue。

---

## 执行前检查工作流（B）

> **触发**：用户说「开始执行 AUTH-001」「开做 LIB-002」「按 task 开发 XXX」。

### 步骤 E1：定位与解析目标 task

1. 在 `projects/prd-{项目名}/tasks/**/{ID}-*.md` 中定位目标 task 文件。
2. 解析 frontmatter（id / status / depends_on / sources / task_type 等）。
3. 文件不存在或解析失败 → 停止报错。

### 步骤 E2：跑 Pre-Execution Checklist（核心规则）

加载 [pre-execution-checklist.md](references/pre-execution-checklist.md) 并逐项检查：

| # | 检查项 | 不通过的处理 |
|---|---|---|
| 1 | task 文件存在且 frontmatter 可解析 | 报错并停止 |
| 2 | task 当前 `status != done` | 已完成则提示并停止 |
| 3 | 所有 `depends_on` 的 task 文件都能找到 | 找不到则报错并停止 |
| 4 | **所有 `depends_on` 的 status == `done`** | 任一未完成 → **停止并告知**（核心硬规则） |
| 5 | `sources.main_prd` / `main_architecture` 文件存在 | 缺失则警告 |
| 6 | `sources.module_prd` / `module_architecture` 文件存在（若声明） | 缺失则警告 |
| 7 | UI 类 task 的 `sources.hifi_wireframes` 至少含 1 个存在的文件 | 缺失则**停止并提示补设计** |
| 8 | `source_gaps` 为空 | 不为空则提示用户确认是否在缺料情况下继续 |
| 9 | 该 task 出现在 `task-dependency-map.md` 的 Ready Queue 中 | 不在则提示先看依赖图 |

### 步骤 E3：依赖未满足时的输出格式

```text
⚠️ 无法开始 {ID} {标题}：依赖未满足

未完成依赖：
- ❌ {DEP-ID} {标题}（status: {todo|in-progress}） → tasks/{module}/{DEP-ID}-{slug}.md
- ❌ ...

已完成依赖：
- ✅ {DEP-ID} {标题}（done）

建议下一步：先执行 {可启动的依赖列表}，再回到 {ID}。
是否切换到 {建议的下一个 ID} 开始执行？
```

**未经用户明确确认，不得跳过未完成依赖直接进入实现阶段。**

### 步骤 E4：检查全部通过

1. 将目标 task 的 `status` 从 `todo` 更新为 `in-progress`。
2. 同步刷新 `tasks/README.md` 与 `tasks/task-dependency-map.md` 的 Ready Queue 段（仅状态相关段，不重画 Mermaid）。
3. 输出 task 的实现要点摘要（任务目标 / 实现范围 / 涉及文件建议 / 验收标准），交给后续开发流程。

### 步骤 E5：task 完成后

1. 用户确认完成后，将 `status` 改为 `done`，填充 `completed_at`、`completed_by`。
2. 重新计算并刷新两个索引文件的 Ready Queue。
3. 输出新解锁的 task 列表（即 `blocks` 中状态从被阻塞变为 ready 的 task）。

---

## 与其他 Skill / Agent 的协作

| 上游产物 | 来源 | 必需性 |
|---|---|---|
| 主 PRD + 模块 PRD | `requirement-doc` Skill | 必需 |
| 主架构 + 模块架构 | `architect` Skill / Agent | 必需 |
| 高保真原型 | `prototype-design` Skill / `designer` Agent | UI task 必需 |

| 下游消费 | 说明 |
|---|---|
| `tdd_developer` Agent | 拿单个 task md 文件作为输入开始 TDD 开发 |
| `code_review` / `code_testing` Agent | 拿 task 的「验收标准」「测试要求」作为审查输入 |
| `requirement-to-issues` Skill | 可选，将 task md 同步发布为 GitHub Issue |

## 常见错误与防护

- ❌ **按编号顺序执行**：编号只是 ID，不是顺序。永远以 Ready Queue 为准。
- ❌ **静默跳过未完成依赖**：硬规则 4 禁止此行为。
- ❌ **UI task 不挂 Hi-Fi**：必须挂；找不到就写入 `source_gaps` 并停下来提醒补设计，而不是装作没事。
- ❌ **task 粒度过粗（>5 SP）**：必须再拆，否则后续 TDD/审查无法定位失败点。
- ❌ **跨模块开发时丢失全局视角**：每次开工前先看 `task-dependency-map.md`，再看具体 task。

## 一句话心智

> 编号是身份证，依赖是路线图，Ready Queue 是工单池；开工前先做依赖前置检查，依赖未满足就停下来告知。
