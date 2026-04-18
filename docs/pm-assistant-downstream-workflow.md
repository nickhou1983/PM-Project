# PM-Assistant 下游工作流分析报告

> 分析时间：2026-04-13
> 分析范围：pm_assistant Agent 及其下游全链路 Agent / Skill 协作关系

## 1. 工作流全景总览

`pm_assistant` 是整个产品开发流程的 **入口 Agent**，定位为"立项前过滤器"。从它出发，工作流经过 **9 个 Agent** 和 **9 个 Skill** 的协作，覆盖从灵感验证到上线复盘、工作流健康评估的完整生命周期。

### 核心链路

```text
pm_assistant (立项验证)
  → requirement-doc [Skill] (生成主 PRD + Module PRD + wireframe)
    → gate_review [Agent] Gate 1 (PRD 评审)
      → designer [Agent] + prototype-design [Skill] (高保真原型)
        → architect [Agent] + architect [Skill] (主架构 + 模块级架构)
          → gate_review [Agent] Gate 2 (架构评审)
            → requirement-to-issues [Skill] (按模块拆分 GitHub Issues)
              → gate_review [Agent] Gate 2.5 (Issues 质量评审)
                → planning [Agent] (任务规划与上下文研究)
                  → tdd_developer [Agent] + tdd-coder [Skill] (TDD 编码)
                    → code_review [Agent] (代码审查)
                    → code_testing [Agent] (测试策略执行)
                      → gate_review [Agent] Gate 3 (上线评审)
                        → github-publish [Skill] (提交 PR + 合并)
                          → pr_review_submit [Agent] (写入 PR Review)
                            → post_launch_review [Agent] (上线复盘)
                              → pm_workflow_evaluator [Agent] (工作流健康度评估)
```

### 辅助支线

```text
├── requirement_analyst [Agent]     ← pm_assistant 的轻量替代，快速验证
├── new_employee_mentor [Agent]     ← 新员工路由分发器，分析意图后路由到合适 Agent
├── feishu-docs [Skill]             ← 贯穿全流程（查重、同步、知识库）
├── prototype-publish [Skill]       ← 原型发布到墨刀/Figma（评审展示）
├── ui_testing [Agent]              ← 上线前 UI/E2E 自动化测试
└── microservices [Skill]           ← 微服务场景下的架构/部署规范
```

---

## 2. 各阶段详细分析

### 阶段 0：立项验证（入口）

| 角色 | 类型 | 职责 |
|------|------|------|
| **pm_assistant** | Agent | 主入口。执行 6 步工作流：飞书 OAuth → 本地 PRD 迭代检测 → 需求拆解 → 飞书查重 → 竞品检索 → 商业快评 + UI/技术可落地性联合快评。输出价值评估报告，决定是否进入 PRD 阶段 |
| **requirement_analyst** | Agent (Codex) | 轻量替代。仅 4 步（需求理解 → 飞书查重 → 竞品检索 → 价值评估），不含商业快评和可落地性评估。适用于快速验证场景 |
| **feishu-docs** | Skill | 提供飞书文档搜索能力（`search-doc`），支持 pm_assistant 步骤 2 的内部查重 |

**关键设计决策**：

- pm_assistant 支持两种模式：🆕 全新立项 / 🔄 迭代分析（自动检测 `docs/` 下已有 PRD）
- 迭代模式下会提取基线 PRD 版本号，后续 requirement-doc 据此做增量更新
- 输出结论分为：✅ 建议推进 / ⚠️ 建议缩范围 / ⚠️ 需调研 / ❌ 不建议推进

---

### 阶段 1：需求文档化

| 角色 | 类型 | 职责 |
|------|------|------|
| **requirement-doc** | Skill | 将 pm_assistant 的分析报告转化为结构化 PRD。支持模块化输出（主 PRD + Module PRD），同时生成低保真 HTML wireframe |

**输入 → 输出**：

- 输入：pm_assistant 价值评估报告、用户补充描述
- 输出：
  - `projects/prd-{项目名}/prd-{项目名}.md`（主 PRD，§4 为模块导航层）
  - `projects/prd-{项目名}/modules/prd-{module_en_slug}.md`（模块 PRD）
  - `projects/prd-{项目名}/modules/README.md`（模块导航索引）
  - `projects/prd-{项目名}/wireframes/*.html`（低保真原型）

**关键机制**：

- 模块化触发条件：≥3 个功能模块或用户明确要求
- 模块命名规范：`module_en_slug`（小写英文 + 连字符）
- 版本管理：支持 Patch/Minor/Major 语义化版本
- 迭代模式下执行变更影响分析 + 下游产物同步检查
- 质量自检清单 26+ 条（通用 19 + 模块化 7）

---

### 阶段 2：PRD 评审（Gate 1）

| 角色 | 类型 | 职责 |
|------|------|------|
| **gate_review** | Agent | 执行 PRD 评审，逐项检查 27 条核心清单（5 + 1 个维度 A–E + 模块 PRD 逐项检查 F），输出 Go/No-Go 决策 |

**评审清单**（权重分布）：

| 维度 | 权重 | 检查项数 | 核心关注 |
|------|------|---------|------|
| A. 需求完整性 | 30% | 10 项 | PRD 11 章节、用户故事、P0/P1/P2 优先级、NFR 量化与验证方法、§5.1 UAT 策略、用户画像数据来源、Module PRD 文件存在性、RICE 评分、§6.2 异常场景 |
| B. 商业合理性 | 25% | 5 项 | 立项验证报告、竞品分析≥3 个、差异化优势、数据支撑痛点、商业模式 |
| C. 可行性 | 25% | 6 项 | 里程碑节点、风险应对、MVP 收敛性、关键技术依赖已验证、外部依赖 SLA、团队资源匹配 |
| D. 原型质量 | 15% | 3 项 | P0 页面覆盖、跳转完整、核心路径可走通 |
| E. 版本管理 | 5% | 3 项 | 文档头与变更记录版本一致、状态字段合法、迭代版本含变更内容 |
| F. 模块 PRD 质量 | 附加 | F1–F8 逐模块 | 模块职责边界、优先级与主 PRD 一致、P0 有验收标准 AC、测试案例（≥3 条）、交互流程/状态机、外部依赖与 fallback 策略、版本同步（P0 模块缺项 → ❌） |

**决策输出与回退路径**：

| 决策 | 启动条件 | 后续动作 |
|------|---------|----------|
| 🟢 **Go** | 无 ❌ 且 无 ⚠️ | 进入阶段 3（高保真设计） |
| 🟡 **Conditional Go** | 无 ❌，但有 ⚠️ | 责任方限期修复缺陷项，评审方确认后关闭，无需重走完整评审 |
| 🔴 **No-Go** | 有 ≥ 1 个 ❌ | 返回 `requirement-doc` Skill 修订 PRD → 重新触发 Gate 1 |

---

### 阶段 3：高保真原型设计

| 角色 | 类型 | 职责 |
|------|------|------|
| **designer** | Agent | 协调原型升级流程，加载 prototype-design Skill 执行 |
| **prototype-design** | Skill | 将低保真 wireframe 升级为高保真 Hi-Fi HTML 原型 |
| **prototype-publish** | Skill | （可选）将原型发布到墨刀或 Figma，用于团队评审 |

**输入 → 输出**：

- 输入：PRD + 低保真 wireframes（来自 requirement-doc）
- 输出：`projects/prd-{项目名}/hifi-wireframes/*.html`

**设计规范**：

- 3 个预设主题：科技蓝 / 自然绿 / 优雅紫
- 技术实现：纯 HTML + CSS（Google Fonts + Lucide Icons + 内联 CSS）
- 两种生成方式：方式 A（默认/精确，手写代码）/ 方式 B（快速，用 modao MCP `gen_html`）
- 页面间通过相对链接跳转

---

### 阶段 4：技术架构设计

| 角色 | 类型 | 职责 |
|------|------|------|
| **architect** | Agent | 基于 PRD 设计技术架构方案，支持模块化架构 |
| **architect** | Skill | 提供架构模板（主模板 + 模块级模板 + ADR 模板） |
| **microservices** | Skill | 微服务场景下的设计、治理与部署规范 |

**输入 → 输出**：

- 输入：PRD（含版本号）、Module PRD（如有）、低保真/高保真 wireframe
- 输出：
  - `architecture-{项目名}.md`（主架构，10 个章节）
  - `architecture-{项目名}-{module_en_slug}.md`（模块级架构，仅模块化模式）

**架构文档 12 个章节（§§0–§§12）**：文档头信息（§§0）→ 设计概述 → 技术栈选型 → 系统架构 → 数据模型 → API 设计 → 部署方案 → 测试架构 → 非功能需求 → 安全设计 → 成本与风险 → 上线计划 → 附录（§§12）

**关键设计决策**：

- 架构风格选择：单体 / 微服务 / Serverless / 混合
- 模块化架构优先原则：有模块级架构时，下游优先消费模块级文档
- 原型图反哺架构：分析 wireframe 推导前端路由、组件结构、状态管理方案
- 每个技术决策附 ADR（Architecture Decision Record）

---

### 阶段 5：架构评审（Gate 2）

| 角色 | 类型 | 职责 |
|------|------|------|
| **gate_review** | Agent | 执行架构评审，检查文档完整性、模块化覆盖、需求追溯、安全设计等 |

**模块化评审规则**：

- 若 PRD 为模块化结构，Gate 2 必须同时评审主架构文档和所有模块级架构文档
- 缺少任一模块级架构文档，默认至少判定为 ⚠️
- 缺失模块覆盖 P0 功能时判定为 ❌

**决策输出与回退路径**：

| 决策 | 启动条件 | 后续动作 |
|------|---------|----------|
| 🟢 **Go** | 无 ❌ 且 无 ⚠️ | 进入阶段 6（任务拆分） |
| 🟡 **Conditional Go** | 无 ❌，但有 ⚠️ | architect 限期补全缺失章节，无需重新评审 |
| 🔴 **No-Go** | 有 ≥ 1 个 ❌ | 返回 `architect` Agent 修订架构文档 → 重新触发 Gate 2 |

---

### 阶段 6：任务拆分

| 角色 | 类型 | 职责 |
|------|------|------|
| **requirement-to-issues** | Skill | 将 PRD 按模块拆分为 GitHub Issues（两级结构：Module Epic + Task Issues） |

**拆分策略**：

| 层级 | Issue 类型 | 来源 | 标签 |
|------|-----------|------|------|
| 模块层 | Epic Issue | Module PRD | `module:{module_en_slug}` |
| 功能层 | Task Issue（Epic 子任务） | PRD §4 功能需求 | 优先级 + 模块标签 |

**关键机制**：

- Story Points 估算体系（1/2/3/5/8/13），超 13 需拆分
- 验收标准按测试类型标注：`[UI]` / `[API]` / `[Unit]` / `[Integration]`
- 模块级架构优先原则：Task 的技术参考优先引用模块级架构文档
- 版本来源追踪：每个 Issue 记录来源 PRD 版本号

---

### 阶段 6.5：Issues 质量评审（Gate 2.5）

| 角色 | 类型 | 职责 |
|------|------|------|
| **gate_review** | Agent | 执行 Issues 质量评审，确保 GitHub Issues 与 PRD/架构可追溯，开发启动前最后一道关卡 |

**触发时机**：`requirement-to-issues` Skill 执行完成后、开发工作正式启动前

**评审清单**（4 个维度，16 条检查项）：

| 维度 | 权重 | 检查项数 | 核心关注 |
|------|------|---------|------|
| A. 需求覆盖完整性 | 30% | 4 项 | P0 Issue 无遗漏、P1 Issue 已说明、功能点数偏差≤20%、模块 Epic 完整 |
| B. 可追溯性 | 25% | 4 项 | Epic 引 PRD 章节、Task 关联 Epic、Task 引用架构章节、标签体系（epic/task+priority+module）完整 |
| C. Issue 质量 | 30% | 5 项 | SP 估算含推导表格、SP≥8 有拆分说明、SP=13 已完成拆分、P0 有验收标准、阻塞依赖已标注 |
| D. 排期与版本 | 15% | 3 项 | P0 分配 Milestone、P0 分配 Assignee、PRD 版本与 Issue 引用版本一致 |

**决策输出与回退路径**：

| 决策 | 启动条件 | 后续动作 |
|------|---------|----------|
| 🟢 **Go** | 无 ❌ 且 无 ⚠️ | 批准开发启动 → planning + tdd_developer |
| 🟡 **Conditional Go** | 无 ❌，但有 ⚠️ | Issue 创建者限期补充缺失信息，无需重走完整评审 |
| 🔴 **No-Go** | 有 ≥ 1 个 ❌ | 返回 `requirement-to-issues` Skill 补充/修正 Issues → 重新触发 Gate 2.5 |

---

### 阶段 7：开发 → 审查 → 发布

| 角色 | 类型 | 职责 |
|------|------|------|
| **planning** | Agent | 开发前任务规划：读取 Issue + 架构文档 → 分析依赖关系 → 输出可执行实施计划（只研究不执行） |
| **tdd_developer** | Agent | TDD 编码执行：基于 Issue + 架构文档，通过 Red → Green → Refactor 循环实现代码，消费 planning 产出的上下文 |
| **tdd-coder** | Skill | TDD 方法论规范（Red-Green-Refactor、Stub/Mock 策略、多语言测试框架选型） |
| **code_review** | Agent | MUST/SHOULD/NIT 三级代码审查 |
| **code_testing** | Agent | 测试策略编排（单元/集成/API/UI/E2E 多层测试），驱动 playwright-testing Skill |
| **ui_testing** | Agent | Playwright UI/E2E 自动化测试（4 类：组件/E2E/视觉回归/无障碍） |
| **gate_review** | Agent | Gate 3 上线评审（测试报告 + PR 列表 → Go/No-Go） |
| **github-publish** | Skill | 完整发布流程：分支创建 → 代码提交 → PR 生成 → 审查 → 合并 |
| **pr_review_submit** | Agent | 将 code_review 结果写入 GitHub PR（行级评论 + APPROVE/REQUEST_CHANGES） |

**协作关系**：

```text
Issues 确认 → planning (任务规划)
              ↓
         tdd_developer (Red → Green → Refactor)
              ↓
开发完成 → code_review (审查) → pr_review_submit (写入 PR)
        → code_testing / ui_testing (测试)
        → gate_review Gate 3 (上线评审)
          → github-publish (合并 PR)
```

**Gate 3 决策输出与回退路径**：

| 决策 | 启动条件 | 后续动作 |
|------|---------|----------|
| 🟢 **Go** | 无 ❌ 且 无 ⚠️ | 执行 `github-publish` 合并 PR → 上线 |
| 🟡 **Conditional Go** | 无 ❌，但有 ⚠️ | 责任方限期修复，评审方确认后操作，无需重走完整评审 |
| 🔴 **No-Go** | 有 ≥ 1 个 ❌ | 根据阻断原因回退：代码问题 → `tdd_developer`；测试不足 → `code_testing` / `ui_testing`；文档缺失 → `code_docs`；全部修复后重新触发 Gate 3 |

---

### 阶段 8：上线复盘

| 角色 | 类型 | 职责 |
|------|------|------|
| **post_launch_review** | Agent | 收集 4 维度数据（业务指标/技术指标/用户反馈/异常事故），输出复盘报告与迭代建议 |

**复盘维度**：

- 业务指标：DAU、功能使用率、转化漏斗、留存率 → 对比 PRD 目标值
- 技术指标：API P95 延迟、错误率、可用性 SLA → 对比 PRD 非功能需求
- 用户反馈：客服工单、应用商店评价、NPS → 聚类分析
- 迭代建议：每条标注优先级（P0/P1/P2）+ 预期影响 + 验证方式

**闭环机制**：复盘结论可回流至 pm_assistant，形成 Build-Measure-Learn 循环。

---

### 阶段 9：工作流健康度评估（可选，复盘后触发）

| 角色 | 类型 | 职责 |
|------|------|------|
| **pm_workflow_evaluator** | Agent | 跨阶段扫描 pm_assistant 下游全流程产物，从 7 个维度输出量化仪表板，识别瓶颈并写入分析报告 |

**7 维度评分体系**：

| 维度 | 权重 | 评估内容 |
|------|------|----------|
| 工作流完整性 | 20% | 各阶段产物是否存在且格式合规 |
| 跨阶段可追溯性 | 25% | PRD ↔ 架构 ↔ Issue ↔ PR 版本链完整度 |
| 产物版本一致性 | 15% | 各产物版本号是否对齐 |
| Gate 决策执行力 | 15% | Gate 评审结论是否被忠实执行 |
| 需求质量信号 | 10% | 需求变更率、变更原因分析 |
| AI 协作效率 | 10% | AI Agent 使用覆盖率、Acceptance Rate 等 |
| 迭代健康度 | 5% | 复盘建议转化率、闭环完整性 |

**输出**：`projects/prd-{项目名}/analysis-report-eval-{YYYYMMDD}.md`

**与 gate_review 的区别**：gate_review 评单次产物质量（单阶段），pm_workflow_evaluator 评跨阶段流程健康度和一致性。

---

## 3. Agent 与 Skill 完整索引

### Agent 索引（11 个核心 Agent）

| Agent | 阶段 | 运行时 | 权限 | 核心职责 |
|-------|------|--------|------|------|
| pm_assistant | 0-立项 | GitHub + Codex | read-only | 需求验证、飞书查重、竞品分析、商业/UI/技术快评 |
| requirement_analyst | 0-立项（轻量） | Codex | read-only | pm_assistant 简化版，4 步快速验证 |
| designer | 3-设计 | GitHub + Codex | workspace-write | 协调 prototype-design Skill，升级高保真原型 |
| architect | 4-架构 | GitHub + Codex | workspace-write | 技术架构设计，支持模块化架构 |
| gate_review | 2/5/6.5/7-评审 | GitHub + Codex | read-only | Gate 1/2/2.5/3 评审，Go/No-Go 决策 |
| planning | 6.5后-开发前 | GitHub + Codex | read-only | 任务规划与上下文研究，为 tdd_developer 提供实施计划 |
| tdd_developer | 7-开发 | GitHub + Codex | workspace-write | TDD 编码执行，Red-Green-Refactor 循环，消费 Issue + 架构文档 |
| code_review | 7-审查 | GitHub + Codex | read-only | MUST/SHOULD/NIT 三级代码审查 |
| code_testing | 7-测试 | GitHub + Codex | workspace-write | 测试策略编排（单元/集成/API/UI/E2E 多层） |
| post_launch_review | 8-复盘 | GitHub + Codex | read-only | 上线数据分析、迭代建议 |
| pm_workflow_evaluator | 9-健康度 | GitHub + Codex | workspace-write | 跨阶段流程扫描、7 维度量化评分、瓶颈识别 |
| pr_review_submit | 7-发布 | GitHub | read-only | 将审查结果写入 GitHub PR Review |

### Skill 索引（10 个）

| Skill | 阶段 | 核心能力 | MCP 依赖 |
|-------|------|---------|----------|
| feishu-docs | 贯穿 | 飞书文档搜索/读取/创建/同步 | 飞书 MCP |
| requirement-doc | 1-需求 | 模块化 PRD 生成 + 低保真 wireframe | 无 |
| prototype-design | 3-设计 | 高保真 HTML 原型生成 | modao MCP（可选） |
| prototype-publish | 3-设计 | 原型发布到墨刀或 Figma | 墨刀 MCP / Figma MCP |
| architect | 4-架构 | 架构文档模板 + ADR | 无 |
| microservices | 4-架构 | 微服务设计/部署规范 | 无 |
| requirement-to-issues | 6-拆分 | PRD → GitHub Issues（Epic + Task） | GitHub MCP |
| tdd-coder | 7-开发 | TDD 方法论（Red-Green-Refactor）、测试框架选型 | 无 |
| github-publish | 7-发布 | 分支/PR/合并完整流程 | GitHub MCP |
| playwright-testing | 7-测试 | UI/E2E 测试规范 | Playwright MCP |

---

## 4. 数据流与版本追踪

### 文档版本链

```text
pm_assistant 分析报告
  → PRD v1.0.0 (requirement-doc)
    → architecture v1.0.0 (architect, 关联 PRD v1.0.0)
      → GitHub Issues (requirement-to-issues, 来源 PRD v1.0.0)
```

### 迭代回路

```text
post_launch_review 复盘报告
  → pm_assistant 迭代分析（检测基线 PRD v1.0.0）
    → requirement-doc 迭代更新 → PRD v1.1.0
      → architect 架构迭代 → architecture v1.1.0
        → 增量 Issues
```

### 模块化数据流

```text
主 PRD (§4 导航层)
  ├── Module PRD: prd-{module-1}.md
  │     → architecture-{项目名}-{module-1}.md (模块级架构)
  │       → Epic Issue #1 + Task Issues (module:module-1 标签)
  ├── Module PRD: prd-{module-2}.md
  │     → architecture-{项目名}-{module-2}.md
  │       → Epic Issue #2 + Task Issues (module:module-2 标签)
  └── ...
```

---

## 5. MCP 服务依赖关系

| MCP 服务 | 消费方 | 用途 | 认证方式 |
|---------|--------|------|---------|
| 飞书 MCP | feishu-docs, pm_assistant | 文档查重、知识库检索、文档同步 | OAuth 2.0 (FEISHU_MCP_UAT) |
| 墨刀 MCP | prototype-publish, prototype-design | 原型生成与导入 | Token (MODAO_TOKEN) |
| GitHub MCP | requirement-to-issues, github-publish, pr_review_submit | Issue 管理、PR 操作、代码搜索 | GitHub Token |
| Playwright MCP | ui_testing | 浏览器自动化 UI 测试 | 本地运行 |

---

## 6. 关键设计原则总结

| 原则 | 说明 |
|------|------|
| **模块化优先** | ≥3 个功能模块或满足多维触发条件（见 §7.5）时自动启用模块化 PRD + 模块级架构，下游 Skill 优先消费模块级文档 |
| **版本追踪** | 文档头精确记录关联上游版本号，变更记录含来源标识，确保 PRD ↔ 架构 ↔ Issue 版本一致 |
| **Stage-Gate 质量关卡** | 4 个评审门（Gate 1 / Gate 2 含 Issues 就绪 / Gate 2.5 兼容 / Gate 3），支持轻/重双模式（见 §7.1），每门有量化检查清单和权重评分，High Risk 项一票否决 |
| **角色分离** | Agent 负责决策和协调，Skill 负责方法论和执行模板，Agent 不做 Skill 的事 |
| **迭代闭环** | post_launch_review 复盘 → pm_assistant 迭代分析 → 增量更新，形成 Build-Measure-Learn 循环 |
| **渐进细化** | pm_assistant 只做快评（UI 复杂度/技术可行性），正式设计交由 designer 和 architect |
| **流程健康度** | pm_workflow_evaluator 在复盘后跨阶段扫描全流程产物，与 gate_review 互补：前者评流程健康度，后者评单次产物质量 |
| **形式化数据契约** | 各阶段产物通过 `workflow-manifest.json` 显式声明上游版本与 Gate 结果，下游 Agent 启动前强制校验（见 §7.2） |
| **早期失败回流** | 下游 Agent 发现上游缺陷时输出标准化 `Upstream Defect Report`，自动归档并参与流程健康度评分（见 §7.3） |
| **设计-架构并行** | designer 与 architect 在 Gate 1 通过后并行启动，Gate 2 前完成 checkpoint 对齐（见 §7.4） |
| **AI 协作可观测** | 每次 Agent/Skill 运行写入 `runs/*.json` 埋点，由 pm_workflow_evaluator 聚合驱动 Dim6 评分（见 §7.6） |

---

## 7. 流程改进规范（v2 增量）

> 本章是对原始线性流程的**正交补充**，不改变现有阶段顺序，但加强了跨阶段的契约、回路与可度量性。各 Agent/Skill 在落地时需逐项接入。

### 7.1 Gate 评审强度模式

| 模式 | 适用条件 | 决策方式 | 评审项范围 |
|------|---------|---------|-----------|
| 🪶 **Lite** | 模块数 ≤ 2 / 团队 ≤ 1 人 / 内部工具 / Patch 迭代 | 仅检查标 ⭐ 的最小必检集，全部通过即 Go；任意 ❌ 即 No-Go | Gate 1: 5 项；Gate 2: 6 项；Gate 3: 5 项 |
| 🛡️ **Standard**（默认） | 模块 3–5 / 团队 2–5 人 / 面向外部用户 | 加权评分，Go / Conditional Go / No-Go | 完整清单 |
| 🏛️ **Strict** | 模块 ≥ 6 / 涉及合规或支付 / 关键基础设施 | Standard + 强制 ⚠️ 24h 内闭环 + 全员评审签名 | 完整清单 |

模式判定优先级：**用户显式指定 > 项目 `workflow.config.yaml` > 自动判定**。每次 Gate 报告需在 JSON `mode` 字段记录所选模式。

### 7.2 工作流数据契约：`workflow-manifest.json`

每个项目目录下维护 **`projects/prd-{项目}/workflow-manifest.json`**，作为跨阶段的「真理源」。各 Agent/Skill 在产出主要文档时必须**追加写入对应阶段条目**；下游 Agent 启动前必须**校验上游条目存在且 Gate 通过**，否则拒绝启动并提示用户。

```json
{
  "project": "ai-assistant",
  "current_stage": "architecture",
  "manifest_version": "1.0",
  "stages": {
    "intake":        { "agent": "pm_assistant",        "report": "analysis-report-...", "trigger_source": "user_feedback", "completed_at": "2026-04-10" },
    "prd":           { "skill": "requirement-doc",     "doc": "prd-ai-assistant.md",   "version": "v1.1.0", "module_count": 4 },
    "gate1":         { "decision": "Go", "mode": "Standard", "score": 0.86, "report": "gate-results/gate1-2026-04-12.json" },
    "design":        { "agent": "designer",            "doc": "hifi-wireframes/", "checkpoint_with_arch": "design-arch-sync-2026-04-13.md" },
    "architecture":  { "agent": "architect",           "doc": "architecture-ai-assistant.md", "version": "v1.1.0", "linked_prd": "v1.1.0" },
    "gate2":         { "decision": "Conditional Go", "mode": "Standard", "score": 0.78, "warnings_open": 2 },
    "issues":        { "skill": "requirement-to-issues", "epic_count": 4, "task_count": 23, "test_skeletons_generated": true },
    "gate2_5":       { "decision": "Go", "mode": "Standard", "merged_into_gate2": false },
    "development":   { "pr_links": [], "open_defect_reports": 0 },
    "gate3":         { "decision": null },
    "post_launch":   { "report": null }
  }
}
```

**强制约束**：
- 任一阶段 manifest 字段缺失 → 下游 Agent 启动时报错并指引人工补录
- Gate 决策必须在进入下一阶段前更新到 manifest（由 gate_review 自动写入）
- `linked_prd` / `version` 字段不一致 → 视为 Gate 阻断项
- pm_workflow_evaluator 优先读取 manifest 而非扫描文件，提高评估速度与一致性

### 7.3 反向反馈回路：`Upstream Defect Report`

下游阶段（架构、开发、测试）若发现上游产物缺陷（PRD 信息不全、架构未覆盖某场景等），不得自行编造修补，而需输出一份 **缺陷报告** 并回流：

**输出位置**：`projects/prd-{项目}/feedback/{from_stage}-to-{to_stage}-{YYYYMMDD}.md`

**模板字段**：
- 来源阶段 / 目标阶段
- 缺陷类型：`missing_requirement` / `ambiguous_spec` / `architecture_gap` / `infeasible` / `data_mismatch`
- 影响范围：受影响的产物路径、Issue 编号、模块
- 复现/证据：相关引用（Issue/PR/测试日志）
- 建议修订点：上游应如何修改
- 阻塞等级：阻塞 / 可绕过 / 仅记录

**处理规则**：
- 阻塞类缺陷 → 上游 Agent 必须修订并升版本号；新一轮 Gate 必须包含「缺陷已闭环」检查
- pm_workflow_evaluator Dim2/Dim5 从 `feedback/` 自动统计「缺陷数 / 闭环时长」，纳入流程健康度

### 7.4 设计-架构并行 Checkpoint

阶段 3 与阶段 4 改为并行：

```text
Gate 1 Go
  ├── designer  (生成 hifi-wireframes)
  └── architect (生成 architecture + 模块级架构)
       ↓
   设计-架构对齐 checkpoint（Gate 2 前）
       ↓
   Gate 2（含 Issues 就绪）
```

**Checkpoint 输出物**：`projects/prd-{项目}/design-arch-sync-{YYYYMMDD}.md`

强制对齐项：
1. 前端路由表（designer 出页面 → architect 出路由配置）
2. 状态管理方案（全局/本地状态划分）
3. API 形态（请求/响应/错误码与设计稿空/错误状态一一对应）
4. 关键交互的实现路径（如实时协作、权限可见性）
5. 双方签名（在 manifest `design.checkpoint_with_arch` 字段引用此文件）

### 7.5 模块化判定多维评估

替代「机械的 ≥3 模块」单一阈值，改为综合判定：

| 信号 | 推荐启用模块化 |
|------|---------------|
| 功能模块数 ≥ 3 | ✅ |
| UI 复杂度评分 ≥ 13（来自 pm_assistant 5.1） | ✅ |
| 团队规模 ≥ 3 人或多团队协作 | ✅ |
| 计划迭代周期 ≥ 2 个 Sprint | ✅ |

**至少 2 个信号命中**才启用模块化。命中 1 个或全部未命中 → 单文件 PRD 即可。判定依据需写入 PRD §1.1 项目背景的「文档结构决策」段落。

### 7.6 AI 协作运行时埋点

每次 Agent/Skill 关键执行结束写入：

**路径**：`projects/prd-{项目}/runs/{YYYY-MM-DD}-{agent_or_skill}.json`

**最小字段**：
```json
{
  "actor": "architect",
  "kind": "agent",
  "stage": "architecture",
  "started_at": "2026-04-13T10:00:00Z",
  "duration_seconds": 320,
  "outputs": ["projects/prd-xxx/architecture-xxx.md"],
  "human_edits_after": 12,         // 人工修订行数（git diff 统计）
  "gate_followup": "gate2",
  "gate_decision": "Go"
}
```

**用途**：
- pm_workflow_evaluator Dim6（AI 协作效率）从这些 JSON 直接聚合，替代人工填报
- 可生成「Acceptance Rate / 平均修订行数 / 阶段平均耗时」趋势图
- 提供给管理层仪表盘（与 `docs/ai-era-metrics-framework.md` 对齐）

### 7.7 触发源识别（pm_assistant 入口）

pm_assistant 在步骤 0.6 增加 **触发源类型识别**，并据此选择精简流程：

| 触发源 | 流程精简建议 |
|--------|-------------|
| 产品灵感（默认） | 全流程 |
| 用户反馈 / 客诉 | 跳过竞品分析（步骤 3）减半，强化痛点验证 |
| 竞品反追 | 强化步骤 3，强制 ≥5 个竞品 |
| 合规/安全驱动 | 跳过商业快评（步骤 4），强化 NFR 与上线评审 |
| 技术债务 | 跳过用户研究门，重点输出技术 ROI 分析 |
| 数据驱动迭代 | 自动进入迭代模式，强制提供基线数据快照 |

触发源记录到 PRD §1.1 与 manifest `intake.trigger_source` 字段，供 Gate 1 「触发源 ↔ 关键指标对齐」检查项使用。

### 7.8 用户研究门（可选）

当 pm_assistant 输出满足以下条件时，**建议**插入轻量级用户研究门：
- 用户画像标记为 ⚠️ 假设性
- 商业模型评分 ≥ 4（高价值灵感）
- 触发源 ≠ 合规/技术债务

研究门要求至少完成以下一项：
- 5 人以上用户访谈摘要
- 问卷样本 ≥ 30，包含痛点排序
- 竞品评论文本聚类（≥50 条）

研究产物归档到 `projects/prd-{项目}/user-research/`，并在 PRD §2 引用；未完成研究门时进入 Gate 1，§2 自动打 ⚠️ 风险标记，Gate 1 的「用户画像数据来源」项硬判 ⚠️。

---

## 8. 改进路线图（落地参考）

| 优先级 | 改进项 | 涉及文件 | 状态 |
|--------|--------|---------|------|
| P0 | Gate 双模式 + Gate 2/2.5 合并 | `.github/agents/gate_review.agent.md` | ✅ 已落地（见 §7.1） |
| P0 | workflow-manifest.json 数据契约 | 各 Skill / Agent + 本文档 §7.2 + [`workflow-manifest-spec.md`](workflow-manifest-spec.md) | ✅ 规范 + `scripts/workflow-manifest.js` + 8 个 Agent/Skill 已接入 |
| P0 | Upstream Defect Report 标准 | 本文档 §7.3 + 下游 Agent | ✅ 模板已发布 |
| P1 | 用户研究门 | `pm_assistant.agent.md` + 本文档 §7.8 | ✅ 触发条件已规范 |
| P1 | designer/architect 并行 checkpoint | 本文档 §7.4 + Gate 2 检查项 3a | ✅ 流程图与硬检查已加入 |
| P1 | AC → 测试骨架 | `requirement-to-issues/SKILL.md` | ✅ 模板已加入 |
| P2 | AI 协作运行时埋点 | 各 Agent/Skill 收尾步骤 + 本文档 §7.6 | ✅ Schema 已发布 |
| P2 | 模块化阈值多维判定 | `requirement-doc/SKILL.md` + 本文档 §7.5 | ✅ 多维表已发布 |
| P2 | Gate 1 指标可观测性硬检查 | `gate_review.agent.md` Gate 1 项 4 | ✅ 五元组要求已加入 |
| P2 | 触发源识别 | `pm_assistant.agent.md` 步骤 0.6 + 本文档 §7.7 | ✅ 类型表已发布 |
