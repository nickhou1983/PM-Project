---
name: requirement-to-issues
description: "将 PRD 需求文档拆分为 GitHub Issues。解析 requirement-doc 生成的 PRD 文档中的功能需求章节，按模块拆分并批量创建 GitHub Issues。触发条件：(1) PRD 转 Issue/拆分到 Issue，(2) 需求文档生成 GitHub Issues，(3) 按模块创建 Issue，(4) 功能需求写入 Issue，(5) 从 PRD 批量创建任务，(6) 需求拆解到 GitHub。"
---

# 需求文档转 GitHub Issues

解析 `requirement-doc` Skill 生成的 PRD 文档，提取功能需求按**模块→功能点**两级拆分，创建模块级 Issue（Epic）和功能点级子 Issue（Task），并关联架构文档和里程碑。

> **模块化 PRD 支持**：当 PRD 采用模块化结构（`modules/` 目录下存在独立的 Module PRD），优先从 Module PRD 读取功能详情、用户故事和验收标准，取代从主 PRD §4.2 解析。模块作为 Epic，功能点作为 Task Issue。
>
> **模块级架构优先原则**：当存在 `architecture-{项目名}-{module_en_slug}.md` 时，该模块的 Epic 和 Task Issue 的技术参考必须优先使用模块级架构文档中的数据模型、API 与前端组件信息；主架构文档和前后端/数据库子文档仅作为回退来源。

## 参考文件

按需加载 `references/` 目录下的模板文件：

| 文件 | 内容 | 何时加载 |
| ---- | ---- | -------- |
| [issue-template.md](references/issue-template.md) | 模块级 Issue 标题和 Body 的标准模板 | 步骤 5 生成模块 Issue 内容时 |
| [sub-issue-template.md](references/sub-issue-template.md) | 功能点级子 Issue 标题和 Body 的标准模板 | 步骤 5 生成子 Issue 内容时 |

## MCP 工具映射

本 Skill 使用以下 MCP 工具与 GitHub 交互：

| 操作 | MCP 工具 | 说明 |
| ---- | -------- | ---- |
| 获取当前用户 | `mcp_github_get_me` | 确认认证身份 |
| 创建 Issue | `mcp_github_issue_write` | 创建 GitHub Issue |
| 创建子 Issue | `mcp_github_sub_issue_write` | 将功能点 Issue 关联为模块 Issue 的子 Issue |
| 搜索 Issue | `mcp_github_search_issues` | 检查是否已存在同名 Issue，避免重复 |
| 读取 Issue | `mcp_github_issue_read` | 读取已有 Issue 信息 |
| 获取仓库 Issue 类型 | `mcp_github_list_issue_types` | 获取仓库支持的 Issue 类型 |

> 也可使用 `mcp_github2_*` 前缀的等效工具。

## 工作流

### 工作流总览

```text
1. 定位 PRD → 2. 解析功能需求 → 3. 关联上下文（含架构文档） → 4. 解析里程碑与依赖 → 5. 生成 Issue 内容（模块+子 Issue） → 6. 创建到 GitHub
```

### 步骤 1：定位 PRD 文档

确定 PRD 文档来源并获取完整内容：

**来源 A：本地文件**
- 用户提供文件路径（如 `docs/prd-<项目名>/prd-<项目名>.md`），直接读取文件内容

**来源 B：对话上下文**
- 用户在对话中直接粘贴或引用了 PRD 内容

**来源 C：飞书文档**
- 使用 `feishu-docs` Skill 从飞书读取 PRD 文档

> **确认**：获取到 PRD 内容后，验证文档包含第 4 章「功能需求」章节（必须有 4.1 功能概览 / 模块导航表）。如缺失则提示用户提供完整的 PRD。
>
> **版本记录**：从 PRD 文档头提取精确版本号（如 `v1.0.0`），同时检查同目录下架构文档的版本号。这两个版本号将填入 Issue Body 的「版本来源」字段，确保后续可追溯 Issue 基于哪个版本的文档创建。
>
> **模块化 PRD 检测**：检查 PRD 同目录下是否存在 `modules/` 子目录，且其中包含 `prd-*.md` 文件：
> - 若**存在**：进入「模块化读取模式」，在步骤 2 中从 Module PRD 文件读取功能详情
> - 若**不存在**：沿用「单文件读取模式」，从主 PRD §4.2 读取功能详情
>
> **模块级架构检测**（模块化模式下执行）：
> - 检查是否存在主架构文档 `architecture-{项目名}.md`
> - 对每个模块检查是否存在 `architecture-{项目名}-{module_en_slug}.md`
> - 若存在，则记录对应版本号并在步骤 3 中作为该模块的首要技术来源
> - 若不存在，则在预览阶段明确标记该模块使用主架构或子文档回退，提醒用户技术参考不完整

### 步骤 2：解析功能需求

从 PRD 提取结构化功能数据。根据步骤 1 的检测结果，选择读取模式：

#### 模块化读取模式（优先）

当 `modules/` 目录存在时：

1. **解析主 PRD §4.1 模块导航表**，提取每个模块的：
   - `module_en_slug`：英文标识
   - `module_zh_name`：中文名称
   - 功能点数量、最高优先级
   - Module PRD 文件路径

2. **遍历读取每个 Module PRD**，从每个 `modules/prd-{module_en_slug}.md` 中提取：
   - §2.1 功能概览表：功能点名称、描述、优先级、RICE 评分
   - §2.2 功能详细描述：输入/输出/处理逻辑/异常场景
   - §3.1 用户故事：编号、故事、验收标准、优先级
   - §3.2 验收标准汇总：按测试类型分类
   - §1.3 相关模块：模块间依赖关系

3. **按模块聚合**：每个 Module PRD 对应一个 Epic，其下的功能点对应 Task Issue

#### 单文件读取模式（向后兼容）

当 `modules/` 目录不存在时，沿用原有逻辑：

1. **解析 4.1 功能概览表**，提取每行的字段：
   - `模块`：功能所属模块名称
   - `功能点`：功能名称
   - `描述`：功能简述
   - `优先级`：P0 / P1 / P2
   - `状态`：当前状态

2. **按模块聚合**，将功能点按模块名分组。示例：

   ```text
   AI 对话核心 → [自由对话(P0), 场景对话(P0), 难度自适应(P0)]
   实时反馈   → [发音评估(P0), 语法纠错(P0), 对话报告(P1)]
   学习系统   → [水平评估(P0), 学习进度(P1), 模拟考试(P1), 历史回放(P2)]
   ```

#### 通用后处理（两种模式共用）

3. **确定模块最高优先级**：取模块内所有功能点中最高的优先级作为该模块 Issue 的优先级标签。

4. **初始故事点估算**：基于功能描述和架构复杂度，为每个功能点给出初始故事点（Story Points）估算：
   - **1 SP**：简单 CRUD、静态页面、配置变更
   - **2 SP**：标准功能开发，涉及 1-2 个模块交互
   - **3 SP**：中等复杂度，涉及多模块协作或第三方集成
   - **5 SP**：高复杂度，涉及算法实现、复杂状态管理或新技术引入
   - **8 SP**：非常高复杂度，建议拆分为更小的子任务
   - **13 SP**：极高复杂度，必须拆分后再估算

   > 故事点为初始估算，供 Sprint Planning 参考。团队应在实际规划时通过 Planning Poker 或讨论调整。在 Issue Body 中标注 `Estimate: {X} SP`。

### 步骤 3：关联上下文（模块级架构优先）

为每个模块补充关联信息：

1. **关联用户故事**（PRD 第 3 章）
   - 将用户故事的验收标准与功能点做关键词匹配
   - 将匹配到的用户故事归入对应模块的 Issue（一个用户故事可以关联多个模块）

2. **关联功能详细描述**（PRD 第 4.2 节）
   - 根据功能点名称和「所属模块」字段，提取每个功能点的详细描述（输入、处理逻辑、输出、异常场景）

3. **关联技术参考**（PRD 第 7 章）
   - 提取与该模块功能相关的技术选型、架构信息或 API 接口定义

4. **关联架构文档**（如存在）
   - 检测 PRD 同目录下是否存在架构文档（主文档路径：`docs/prd-<项目名>/architecture.md` 或 `docs/prd-<项目名>/architecture-<项目名>.md`）
   - 同时检测是否存在子文档（分文档模式）：
     - `docs/prd-<项目名>/frontend-architecture-<项目名>.md`（前端架构详设）
     - `docs/prd-<项目名>/backend-services-<项目名>.md`（后端服务详设）
     - `docs/prd-<项目名>/database-design-<项目名>.md`（数据库设计）
   - **检测模块级架构文档**（模块化 PRD 模式）：
     - `docs/prd-<项目名>/architecture-<项目名>-{module_en_slug}.md`（模块级架构设计）
       - 若存在模块级架构文档，**必须优先**使用该文档中的数据模型、API 端点、前端组件信息
       - 若模块级架构文档不存在，则按回退链继续提取，并在预览中标记“缺模块级架构”
   - 若存在，提取与当前模块相关的：
     - **数据模型**：该模块涉及的数据库表和字段（优先顺序：模块级架构文档 > `database-design-*.md` > 主架构文档第 4 章）
     - **API 端点**：该模块对应的 API 路径和方法（优先顺序：模块级架构文档 > `backend-services-*.md` > 主架构文档第 5 章）
     - **前端组件**：该模块涉及的页面路由和组件结构（优先顺序：模块级架构文档 > `frontend-architecture-*.md` > 主架构文档第 3.4 节）
     - **技术栈**：该模块的核心技术选型（架构文档第 2 章）
    - 将提取的架构信息填入 Issue 的「技术参考」部分，替代仅引用 PRD 第 7 章
    - 对每个模块记录技术来源链路：`模块级架构 > 主架构子文档 > 主架构总纲 > PRD 第 7 章`，用于预览和质量检查

### 步骤 4：解析里程碑与依赖

1. **提取里程碑**（PRD 第 8 章）
   - 解析里程碑排期表，提取每个阶段的名称和时间范围
   - 根据模块的优先级和功能点内容，将模块映射到对应里程碑：
     - P0 功能点所在模块 → 映射到最早的开发阶段（如 MVP Sprint 1）
     - P1 功能点所在模块 → 映射到第二阶段（如 Sprint 2）
     - P2 功能点所在模块 → 映射到后续迭代阶段
   - 在 Issue Body 中标注对应的里程碑名称和目标日期

2. **分析模块间依赖**
   - 根据功能描述和技术架构分析模块间的前置依赖关系，例如：
     - 视频生成模块依赖 Prompt 生成模块（需要 prompt 输出才能生成视频）
     - 视频管理模块依赖视频生成模块（需要有视频才能管理）
     - 所有功能模块依赖用户系统模块（需要认证）
   - 在 Issue Body 中标注前置依赖模块

### 步骤 5：生成 Issue 内容

#### 5a. 生成模块级 Issue（Epic）

1. 加载 [issue-template.md](references/issue-template.md) 模板
2. 为每个模块生成一个 Issue，填充模板中的各项内容：

**标题**：`[{项目名}] {模块中文名} ({module_en_slug}) — 功能需求`

**Body**：按模板结构填写：
- **模块概述**：模块名称（中英文标识）、功能点数量、最高优先级、模块职责描述
- **Module PRD 链接**（模块化模式）：指向 `modules/prd-{module_en_slug}.md` 的链接
- **模块级架构文档链接**（如存在）：指向 `architecture-{项目名}-{module_en_slug}.md` 的链接；若缺失则显式标记为 `N/A（回退到主架构）`
- **功能点清单**：该模块下所有功能点的表格（功能点、描述、优先级）
- **里程碑**：对应的开发阶段和目标日期（来自步骤 4）
- **前置依赖**：该模块依赖的其他模块（来自步骤 4，含 `module_en_slug` 标识）
- **关联用户故事**：匹配到的用户故事表格（编号、故事、验收标准、优先级）
- **技术参考**：优先来自模块级架构文档的数据模型、API 端点、前端组件信息（来自步骤 3）
- **验收标准汇总**：从用户故事和功能描述中提取所有验收条件，按测试类型分类标注

**Labels**：
- `enhancement`（固定）
- `epic`（模块级标识）
- `project:{项目名}`（如 `project:VideoPrompt`）
- `priority:{最高优先级}`（如 `priority:P0`）
- `module:{module_en_slug}`（如 `module:task-management`，使用英文 slug）

**Assignee**（可选）：
- 若用户提供了模块→负责人映射表，设置 `assignee` 字段
- 若未提供，不设置 assignee，留待后续分配

#### 5b. 生成功能点级子 Issue（Task）

1. 加载 [sub-issue-template.md](references/sub-issue-template.md) 模板
2. 为每个功能点生成一个子 Issue：

**标题**：`[{项目名}] {功能点名称}`

**Body**：按子 Issue 模板结构填写：
- **功能描述**：功能点的详细描述
- **所属模块**：关联的模块名称
- **输入/输出**：输入数据和预期输出
- **处理逻辑**：核心业务逻辑要点
- **异常场景**：边界情况和异常处理
- **技术参考**：优先引用该模块的模块级架构文档中的 API、数据模型和组件信息；缺失时回退到主架构
- **验收标准**：该功能点的验收条件，按测试类型标注：
  - `[UI]` — 需要 UI/E2E 测试验证
  - `[API]` — 需要 API 测试验证
  - `[Unit]` — 需要单元测试验证
  - `[Integration]` — 需要集成测试验证
- **故事点估算**：`Estimate: {X} SP`（基于步骤 2 的初始估算）

**Labels**：
- `enhancement`
- `task`（功能点级标识）
- `project:{项目名}`
- `priority:{功能点优先级}`
- `module:{module_en_slug}`（使用英文 slug，与 Epic 保持一致）

3. 生成完成后，将所有 Issue 以摘要形式展示给用户确认：

   ```text
   即将创建 {M} 个模块 Issue + {N} 个子 Issue（总计 {T} SP）：

   模块 1: [{项目名}] {模块1} — 功能需求 (P0, {X}个功能点, {Y} SP)
     ├── [{项目名}] {功能点1} (P0, {Z} SP)
     ├── [{项目名}] {功能点2} (P0, {Z} SP)
     └── [{项目名}] {功能点3} (P1, {Z} SP)

   模块 2: [{项目名}] {模块2} — 功能需求 (P1, {Y}个功能点, {Y} SP)
     ├── [{项目名}] {功能点4} (P1, {Z} SP)
     └── [{项目名}] {功能点5} (P1, {Z} SP)
   ...

    技术参考来源：{模块级架构优先/部分模块回退到主架构}
   Assignee 映射：{已配置/未配置}
   里程碑：{已关联/未关联}
   总估算：{T} Story Points
   ```

> **必须等待用户确认后再执行步骤 6**。用户可以要求调整某个 Issue 的内容、排除某些模块、或提供 Assignee 映射。

### 步骤 6：创建到 GitHub

1. 调用 `mcp_github_get_me` 确认当前用户身份
2. 确认目标仓库的 `owner` 和 `repo`（从对话上下文或用户指定获取）
3. 调用 `mcp_github_search_issues` 搜索是否已存在同名 Issue，避免重复创建
4. **先创建模块级 Issue**，逐个调用 `mcp_github_issue_write`：

   ```text
   mcp_github_issue_write:
     owner: <repo-owner>
     repo: <repo-name>
     title: "[{项目名}] {模块中文名} ({module_en_slug}) — 功能需求"
     body: <按模板生成的 Issue body>
     labels: ["enhancement", "epic", "project:{项目名}", "priority:P0", "module:{module_en_slug}"]
     assignee: <负责人（可选）>
   ```

5. **再创建功能点级子 Issue**，先调用 `mcp_github_issue_write` 创建 Issue，再调用 `mcp_github_sub_issue_write` 将其关联为模块 Issue 的子 Issue：

   ```text
   # 先创建功能点 Issue
   mcp_github_issue_write:
     owner: <repo-owner>
     repo: <repo-name>
     title: "[{项目名}] {功能点名称}"
     body: <按子 Issue 模板生成的 body>
     labels: ["enhancement", "task", "project:{项目名}", "priority:P0", "module:{module_en_slug}"]

   # 再关联为子 Issue
   mcp_github_sub_issue_write:
     owner: <repo-owner>
     repo: <repo-name>
     issue_number: <模块 Issue 编号>
     sub_issue_id: <功能点 Issue ID>
   ```

6. 创建完成后输出结果摘要：

   | # | Issue 标题 | 编号 | 类型 | 优先级 | 父 Issue | SP | 状态 |
   | - | ---------- | ---- | ---- | ------ | -------- | -- | ---- |
   | 1 | [VideoPrompt] Prompt 生成 — 功能需求 | #12 | Epic | P0 | — | 13 | ✅ 已创建 |
   | 2 | [VideoPrompt] 智能 Prompt 生成 | #13 | Task | P0 | #12 | 5 | ✅ 已创建 |
   | 3 | [VideoPrompt] 视觉风格选择 | #14 | Task | P0 | #12 | 3 | ✅ 已创建 |
   | 4 | [VideoPrompt] 视频参数配置 | #15 | Task | P0 | #12 | 5 | ✅ 已创建 |

## 快速命令

### 一键拆分并创建

当用户说"把 PRD 拆成 Issue"或"需求写入 GitHub Issue"时，按顺序执行步骤 1-6。

### 仅预览不创建

当用户说"预览 Issue"或"看看会生成哪些 Issue"时，执行步骤 1-5，展示预览但不执行步骤 6。

### 指定模块创建

当用户说"只创建 P0 模块的 Issue"时，在步骤 2 中按优先级过滤模块后继续后续步骤。

### 仅模块级（不拆子 Issue）

当用户说"只创建模块 Issue"或"不要子 Issue"时，仅执行步骤 5a 生成模块级 Issue，跳过步骤 5b。

### 指定 Assignee

当用户提供模块→负责人映射时（如"Prompt 生成给张三，视频生成给李四"），在步骤 5 中填入 assignee 字段。

## 质量检查清单

生成 Issue 前，逐项自检：

- [ ] PRD 第 4.1 功能概览表 / 模块导航表已完整解析，无遗漏模块
- [ ] 每个模块的功能点数量与 PRD（或 Module PRD）一致
- [ ] 功能点的优先级标注正确（P0/P1/P2）
- [ ] 关联的用户故事与模块功能相关（非强行匹配）
- [ ] 功能详细描述包含输入、处理逻辑、输出、异常场景（如 PRD 中有）
- [ ] 若存在架构文档（含模块级架构文档），技术参考部分引用了架构文档的数据模型、API 和组件信息
- [ ] 里程碑映射合理（P0→早期 Sprint，P1→后续 Sprint，P2→迭代阶段）
- [ ] 模块间前置依赖关系标注正确
- [ ] Issue 标题符合 `[{项目名}] {模块中文名} ({module_en_slug}) — 功能需求` 格式（模块级）或 `[{项目名}] {功能点名称}` 格式（子 Issue）
- [ ] Labels 包含 `enhancement`、类型标签（`epic`/`task`）、`module:{module_en_slug}`（英文 slug）和正确的优先级标签
- [ ] 验收标准按测试类型标注（`[UI]`/`[API]`/`[Unit]`/`[Integration]`）
- [ ] 每个子 Issue 包含故事点估算（`Estimate: {X} SP`），且数值合理（1/2/3/5/8/13）
- [ ] 模块级 Issue 包含子 Issue 故事点汇总
- [ ] 子 Issue 已正确关联到父模块 Issue
- [ ] 已检查是否存在同名 Issue，避免重复创建
- [ ] 所有 Issue 经用户确认后才执行创建

**模块化 PRD 额外检查项**：
- [ ] 模块化读取模式已正确检测 `modules/` 目录
- [ ] 每个 Module PRD 的功能详情已完整提取（§2.1 + §2.2）
- [ ] Module PRD 中的用户故事编号（`US-{module_en_slug}-NNN`）已正确关联到对应的 Epic
- [ ] Epic Issue Body 中包含 Module PRD 链接（`modules/prd-{module_en_slug}.md`）
- [ ] 若存在模块级架构文档，Epic Issue Body 中包含其链接（`architecture-{项目名}-{module_en_slug}.md`）
- [ ] 若存在模块级架构文档，Epic 和 Task 的技术参考均优先引用模块级架构而非主架构回退项
- [ ] 若某个模块缺少模块级架构文档，预览中已明确标记回退来源和影响范围
