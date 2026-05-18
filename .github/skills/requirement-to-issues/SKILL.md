---
name: requirement-to-issues
description: "将 PRD 需求文档拆分为 Issues（支持 GitHub 远程创建或本地 Markdown 存储）。解析 requirement-doc 生成的 PRD 文档中的功能需求章节，按模块拆分并批量创建 Issues。触发条件：(1) PRD 转 Issue/拆分到 Issue，(2) 需求文档生成 Issues，(3) 按模块创建 Issue，(4) 功能需求写入 Issue，(5) 从 PRD 批量创建任务，(6) 需求拆解到 GitHub，(7) 本地存储 Issue，(8) 生成本地 Issue 文件。"
---

# 需求文档转 GitHub Issues

解析 `requirement-doc` Skill 生成的 PRD 文档，提取功能需求按**模块→功能点**两级拆分，创建模块级 Issue（Epic）和功能点级子 Issue（Task），并关联架构文档和里程碑。

**存储模式**：支持两种 Issue 存储方式，用户在步骤 1.0 中选择：
- **GitHub 模式**（默认）：通过 GitHub MCP 工具远程创建 Issues
- **本地模式**：将 Issues 以 Markdown 文件形式存储在项目目录的 `issues/` 子目录下
- **混合模式**：同时创建 GitHub Issues 并在本地保存副本

> **模块化 PRD 支持**：当 PRD 采用模块化结构（`modules/` 目录下存在独立的 Module PRD），优先从 Module PRD 读取功能详情、用户故事和验收标准，取代从主 PRD §4.2 解析。模块作为 Epic，功能点作为 Task Issue。
>
> **模块级架构优先原则**：当存在 `architecture-{项目名}-{module_en_slug}.md` 时，该模块的 Epic 和 Task Issue 的技术参考必须优先使用模块级架构文档中的数据模型、API 与前端组件信息；主架构文档和前后端/数据库子文档仅作为回退来源。

## 参考文件

按需加载 `references/` 目录下的模板文件：

| 文件 | 内容 | 何时加载 |
| ---- | ---- | -------- |
| [issue-template.md](references/issue-template.md) | 模块级 Issue 标题和 Body 的标准模板 | 步骤 5 生成模块 Issue 内容时 |
| [sub-issue-template.md](references/sub-issue-template.md) | 功能点级子 Issue 标题和 Body 的标准模板 | 步骤 5 生成子 Issue 内容时 |
| [local-issue-template.md](references/local-issue-template.md) | 本地 Markdown Issue 文件模板（含 YAML frontmatter） | 本地模式步骤 6-L 生成本地文件时 |

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
1. 定位 PRD → 2. 解析功能需求 → 3. 关联上下文（含架构文档） → 4. 解析里程碑与依赖 → 5. 生成 Issue 内容（模块+子 Issue） → 6. 创建到 GitHub / 6-L. 本地存储
```

### 步骤 1：定位 PRD 文档

确定 PRD 文档来源并获取完整内容：

#### 1.0 确认存储模式与目标仓库

> **在任何 Issue 创建之前，必须先确定存储模式和 Issue 的目标位置。**

**1. 选择存储模式**：

询问用户 Issue 的存储方式：

| 模式 | 说明 | 适用场景 |
| ---- | ---- | -------- |
| **GitHub**（默认） | 通过 MCP 工具创建到 GitHub 仓库 | 团队协作、已有 GitHub 项目、需要跟踪和分配 |
| **本地** | 生成 Markdown 文件存储在项目目录 | 离线工作、无 GitHub 访问、Codex 沙箱环境、本地优先工作流 |
| **混合** | 同时创建 GitHub Issue 并本地保存副本 | 需要本地备份、或需要离线查阅 |

> **自动推断**：如果用户未明确指定，按以下规则默认：
> - 当前环境可以访问 GitHub MCP 工具 → 默认 **GitHub 模式**
> - 当前环境无 GitHub MCP 工具（如 Codex 沙箱） → 自动回退到 **本地模式**
> - 用户说“本地存储”“保存到本地”“生成本地文件” → **本地模式**
> - 用户说“同时本地和 GitHub” → **混合模式**

**2. 确认目标位置**：

**GitHub 模式 / 混合模式时**：

确定 Issue 的目标仓库：
1. **询问用户**：Issue 要创建到哪个 GitHub 仓库？
   - 默认：当前工作区仓库（如 `nickhou1983/PM-Project`）
   - 可选：用户指定的代码仓库（如 `nickhou1983/my-app`）
2. **记录目标仓库**：将 `target_owner` 和 `target_repo` 保存，供步骤 5 和步骤 6 使用
3. **判断跨仓库模式**：若目标仓库 ≠ 当前工作区仓库，启用跨仓库模式：
   - Issue Body 中的文档链接将使用 GitHub 绝对 URL（而非相对路径）
   - 预览阶段标注“跨仓库模式：文档在 `{source_owner}/{source_repo}`，Issue 创建到 `{target_owner}/{target_repo}`”

**本地模式时**：

确定本地存储路径：
- 默认路径：`projects/prd-{project}/issues/`
- 用户可自定义路径

**来源 A：本地文件**
- 用户提供文件路径（如 `projects/prd-<项目名>/prd-<项目名>.md`），直接读取文件内容

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

   **故事点估算推导依据**（每个功能点的估算必须附带推导过程）：

   在 Issue Body 的「故事点估算」区域，除标注 `Estimate: {X} SP` 外，必须附带以下推导表格：

   ```markdown
   **Estimate: {X} SP**

   | 复杂度因子 | 评估 | 说明 |
   |-----------|------|------|
   | API 端点数 | {N} 个 | {列出涉及的 API} |
   | 数据模型变更 | 是/否 | {涉及哪些表/字段} |
   | 前端页面/组件数 | {N} 个 | {核心页面列表} |
   | 第三方集成 | 是/否 | {集成对象和方式} |
   | 算法/业务逻辑复杂度 | 低/中/高 | {复杂度来源} |
   | 类似功能参考 | 有/无 | {项目内类似功能及其实际耗时} |
   ```

   > **推导规则**：
   > - API 端点 ≤ 1 且无第三方集成 → 基础分 1-2 SP
   > - API 端点 2-3 且涉及数据模型变更 → 基础分 3 SP
   > - 涉及第三方集成或算法逻辑 → 基础分 5 SP
   > - 涉及新技术引入或多个高复杂因子 → 基础分 8 SP
   > - 推导过程不对用户展示为复杂表格，而是以简洁的 1-2 行说明嵌入 Issue Body

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
   - 检测 PRD 同目录下是否存在架构文档（主文档路径：`projects/prd-<项目名>/architecture.md` 或 `projects/prd-<项目名>/architecture-<项目名>.md`）
   - 同时检测是否存在子文档（分文档模式）：
     - `projects/prd-<项目名>/frontend-architecture-<项目名>.md`（前端架构详设）
     - `projects/prd-<项目名>/backend-services-<项目名>.md`（后端服务详设）
     - `projects/prd-<项目名>/database-design-<项目名>.md`（数据库设计）
   - **检测模块级架构文档**（模块化 PRD 模式）：
     - `projects/prd-<项目名>/architecture-<项目名>-{module_en_slug}.md`（模块级架构设计）
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

3. **生成模块依赖图**

   基于步骤 4.2 的依赖分析，生成 Mermaid 格式的模块依赖图，明确各模块的前置/并行关系和建议开发顺序：

   ```mermaid
   graph TD
     A[用户系统<br/>user-system<br/>P0 | Sprint 1] --> B[Prompt 生成<br/>prompt-gen<br/>P0 | Sprint 1]
     A --> C[视频管理<br/>video-mgmt<br/>P1 | Sprint 2]
     B --> D[视频生成<br/>video-gen<br/>P0 | Sprint 1]
     D --> C
     style A fill:#e8f5e9
     style B fill:#e8f5e9
     style D fill:#e8f5e9
     style C fill:#fff9c4
   ```

   **依赖图输出规则**：
   - 每个节点标注：模块中文名、`module_en_slug`、最高优先级、所属里程碑
   - 箭头方向表示「被依赖 → 依赖方」（A→B 表示 B 依赖 A）
   - P0 模块用绿色标注（`fill:#e8f5e9`），P1 用黄色（`fill:#fff9c4`），P2 用灰色（`fill:#f5f5f5`）
   - 无入边的模块可最先开发，标注为「可并行启动」
   - 在预览摘要中展示依赖图，帮助用户理解开发顺序
   - 将依赖图嵌入第一个创建的 Epic Issue 的 Body 顶部（作为项目总览）

### 步骤 5：生成 Issue 内容

#### 5a. 生成模块级 Issue（Epic）

1. 加载 [issue-template.md](references/issue-template.md) 模板
2. 为每个模块生成一个 Issue，填充模板中的各项内容：

**标题**：`[{项目名}] {模块中文名} ({module_en_slug}) — 功能需求`

**Body**：按模板结构填写：
- **模块概述**：模块名称（中英文标识）、功能点数量、最高优先级、模块职责描述
- **Module PRD 链接**（模块化模式）：指向 `modules/prd-{module_en_slug}.md` 的链接
- **模块级架构文档链接**（如存在）：指向 `architecture-{项目名}-{module_en_slug}.md` 的链接；若缺失则显式标记为 `N/A（回退到主架构）`

> **跨仓库模式下的文档链接**：当 Issue 目标仓库与文档所在仓库不同时，所有文档链接必须使用 GitHub 绝对 URL 格式：
> - Module PRD：`https://github.com/{source_owner}/{source_repo}/blob/main/projects/prd-{项目名}/modules/prd-{module_en_slug}.md`
> - 模块级架构：`https://github.com/{source_owner}/{source_repo}/blob/main/projects/prd-{项目名}/architecture-{项目名}-{module_en_slug}.md`
> - 主架构：`https://github.com/{source_owner}/{source_repo}/blob/main/projects/prd-{项目名}/architecture-{项目名}.md`
> - 主 PRD：`https://github.com/{source_owner}/{source_repo}/blob/main/projects/prd-{项目名}/prd-{项目名}.md`
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
- **技术参考**：优先引用该模块的模块级架构文档中的 API、数据模型和组件信息；缺失时回退到主架构（跨仓库模式下使用 GitHub 绝对 URL，规则同 Epic 文档链接）
- **验收标准**：该功能点的验收条件，按测试类型标注：
  - `[UI]` — 需要 UI/E2E 测试验证
  - `[API]` — 需要 API 测试验证
  - `[Unit]` — 需要单元测试验证
  - `[Integration]` — 需要集成测试验证
- **测试骨架（AC → Test Skeleton）**：每条 P0 验收标准必须附带可执行的测试骨架，便于 tdd_developer 直接进入 Red 阶段
- **故事点估算**：`Estimate: {X} SP`（基于步骤 2 的初始估算）

#### 5b.1 AC → 测试骨架生成规则（P1-6）

为每个 P0 Task Issue 在 Body 末尾追加 **「测试骨架」** 段落，将每条 AC 转换为可执行的测试雏形（Given/When/Then 或 Pytest/Jest 函数签名），由 `tdd_developer` 直接复制到代码库进入 Red 阶段。

**生成规则**：

| 测试类型 | 骨架格式 | 输出位置建议 |
|---------|---------|------------|
| `[Unit]` | 目标语言对应的测试函数签名（pytest / jest / junit）+ Given/When/Then 注释 | `tests/unit/{module}/test_{feature}.py` |
| `[API]` | 接口契约 stub：HTTP 方法 + path + 请求/响应/状态码 | `tests/api/{module}/test_{endpoint}.py` |
| `[Integration]` | 模块间调用 stub + 期望副作用 | `tests/integration/{module}/test_{flow}.py` |
| `[UI]` | Gherkin 风格 Feature/Scenario，或 Playwright 测试函数签名 | `tests/e2e/{module}/{feature}.spec.ts` |

**Body 中的测试骨架示例**（pytest）：

````markdown
### 测试骨架

> 以下骨架供 `tdd_developer` 进入 Red 阶段使用，请保留文件路径建议。

```python
# tests/unit/prompt_optimizer/test_template_apply.py
import pytest

class TestTemplateApply:
    def test_ac1_应用模板后返回带占位符替换的字符串(self):
        # Given: 一个含 {{topic}} 占位符的模板与 topic="AI"
        # When:  调用 apply_template(template, {"topic": "AI"})
        # Then:  返回字符串包含 "AI" 且不含 "{{topic}}"
        pytest.fail("Red: not implemented")

    def test_ac2_缺失变量时抛出_TemplateVariableError(self):
        # Given: 模板含 {{topic}}，但变量字典为空
        # When:  调用 apply_template(template, {})
        # Then:  抛出 TemplateVariableError 且消息包含变量名
        pytest.fail("Red: not implemented")
```
````

**强制约束**：
- 每条 P0 AC 至少对应 1 条测试骨架；P1 推荐生成
- 测试骨架必须使用 `pytest.fail / expect.fail / xit` 等标记保持 Red 状态，不得伪造通过
- 工作目录中已存在该测试文件时，仅在 Issue Body 中追加「待补充测试函数」清单，不覆盖既有代码
- Gate 2.5 / Gate 2 合并模式新增检查项：「P0 Task 是否含测试骨架」缺失即 ⚠️

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

**Issue 创建完成后写入 manifest**：

```bash
echo '{
  "skill": "requirement-to-issues",
  "epic_count": {M},
  "task_count": {N},
  "test_skeletons_generated": true,
  "target_repo": "{owner/repo}"
}' | node scripts/workflow-manifest.js set {项目} issues
```

### 步骤 5.5：manifest 上游校验（v2 必做）

执行：

```bash
node scripts/workflow-manifest.js check {项目} issues
```

要求 `gate2` 已通过（或 `gate2.merged_with_gate2_5=true`）；不通过则停止并报错。规范见 [`docs/workflow-manifest-spec.md`](../../../docs/workflow-manifest-spec.md)。

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

> **分支控制**：步骤 6 仅在「GitHub 模式」或「混合模式」时执行。

### 步骤 6-L：本地存储 Issues

> **分支控制**：步骤 6-L 仅在「本地模式」或「混合模式」时执行。

将步骤 5 生成的 Issue 内容以 Markdown 文件形式存储到本地项目目录。

#### 6-L.1 创建目录结构

```text
projects/prd-{project}/issues/
├── _index.md                          ← Issue 索引（总览 + 依赖图）
├── epic-{NN}-{module_en_slug}.md     ← 模块级 Epic
├── task-{NN}-{feature_slug}.md       ← 功能点级 Task
└── ...
```

- `{NN}` 为两位数自增编号（从 `01` 开始）
- Epic 编号在前，其下属 Task 紧随其后（如 `epic-01-user-system.md`、`task-02-user-register.md`、`task-03-user-login.md`）

#### 6-L.2 生成 Issue 文件

1. 加载 [local-issue-template.md](references/local-issue-template.md) 模板
2. 每个 Issue 生成一个独立的 Markdown 文件，含 YAML frontmatter 元数据：

**Epic 文件格式**（`epic-{NN}-{module_en_slug}.md`）：

```markdown
---
id: "epic-{NN}"
type: epic
title: "[{项目名}] {模块中文名} ({module_en_slug}) — 功能需求"
project: "{项目名}"
module: "{module_en_slug}"
priority: "P0"
labels: ["enhancement", "epic", "project:{项目名}", "priority:P0", "module:{module_en_slug}"]
milestone: "{里程碑名称}"
assignee: ""
story_points: {总 SP}
children: ["task-{NN}", "task-{NN}", ...]
dependencies: ["{依赖模块 slug}"]
status: "open"
created_at: "{ISO 日期}"
---

{按 issue-template.md 模板生成的 Issue Body 内容}
```

**Task 文件格式**（`task-{NN}-{feature_slug}.md`）：

```markdown
---
id: "task-{NN}"
type: task
title: "[{项目名}] {功能点名称}"
project: "{项目名}"
module: "{module_en_slug}"
priority: "P0"
labels: ["enhancement", "task", "project:{项目名}", "priority:P0", "module:{module_en_slug}"]
parent: "epic-{NN}"
story_points: {SP}
status: "open"
created_at: "{ISO 日期}"
---

{按 sub-issue-template.md 模板生成的 Issue Body 内容}
```

#### 6-L.3 生成索引文件

创建 `_index.md` 作为所有 Issue 的总览：

```markdown
# {项目名} — Issue 索引

> 自动生成于 {日期}，基于 PRD v{版本号}

## 概览

- 模块数：{M}
- 任务数：{N}
- 总故事点：{T} SP
- 存储模式：本地

## 模块依赖图

{Mermaid 依赖图}

## Issue 清单

| 编号 | 标题 | 类型 | 优先级 | 模块 | SP | 父 Issue | 状态 |
| ---- | ---- | ---- | ------ | ---- | -- | -------- | ---- |
| epic-01 | [{项目名}] 用户系统 (user-system) — 功能需求 | Epic | P0 | user-system | 13 | — | open |
| task-02 | [{项目名}] 用户注册 | Task | P0 | user-system | 3 | epic-01 | open |
| ... | ... | ... | ... | ... | ... | ... | ... |
```

#### 6-L.4 输出结果摘要

```text
✅ 本地 Issue 创建完成

目录：projects/prd-{project}/issues/
文件数：{M + N + 1} 个（{M} Epic + {N} Task + 1 索引）
总故事点：{T} SP

已生成文件：
  issues/_index.md
  issues/epic-01-user-system.md
  issues/task-02-user-register.md
  issues/task-03-user-login.md
  ...
```

#### 6-L.5 manifest 写入

本地模式的 manifest 写入与 GitHub 模式一致，但 `target_repo` 标记为 `local`：

```bash
echo '{
  "skill": "requirement-to-issues",
  "epic_count": {M},
  "task_count": {N},
  "test_skeletons_generated": true,
  "target_repo": "local",
  "local_path": "projects/prd-{project}/issues/"
}' | node scripts/workflow-manifest.js set {项目} issues
```

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

### 本地存储 Issue

当用户说"本地存储 Issue""保存到本地""生成本地 Issue 文件""不创建 GitHub Issue"时，在步骤 1.0 中选择「本地模式」，跳过步骤 6，仅执行步骤 6-L。

### 混合模式

当用户说"同时本地和 GitHub""本地备份一份"时，在步骤 1.0 中选择「混合模式」，同时执行步骤 6 和步骤 6-L。

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
