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
              → 开发阶段 (代码实现)
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
├── modao-prototype [Skill]         ← 原型导入墨刀（评审展示）
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
  - `docs/prd-{项目名}/prd-{项目名}.md`（主 PRD，§4 为模块导航层）
  - `docs/prd-{项目名}/modules/prd-{module_en_slug}.md`（模块 PRD）
  - `docs/prd-{项目名}/modules/README.md`（模块导航索引）
  - `docs/prd-{项目名}/wireframes/*.html`（低保真原型）

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
| **gate_review** | Agent | 执行 PRD 评审，逐项检查 19 条清单（5 个维度），输出 Go/No-Go 决策 |

**评审清单**（权重分布）：

| 维度 | 权重 | 检查项数 | 核心关注 |
|------|------|---------|---------|
| 需求完整性 | 30% | 5 项 | PRD 10 章节、用户故事、P0/P1/P2 优先级 |
| 商业合理性 | 25% | 4 项 | 立项验证报告、竞品分析≥3 个、差异化优势 |
| 可行性 | 25% | 4 项 | 里程碑节点、风险应对、MVP 收敛性 |
| 原型质量 | 15% | 3 项 | P0 页面覆盖、跳转完整、核心路径可走通 |
| 版本管理 | 5% | 3 项 | 版本号一致性、状态字段、变更记录 |

**决策输出**：Go（进入设计阶段）/ Conditional Go（条件通过）/ No-Go（打回修改）

---

### 阶段 3：高保真原型设计

| 角色 | 类型 | 职责 |
|------|------|------|
| **designer** | Agent | 协调原型升级流程，加载 prototype-design Skill 执行 |
| **prototype-design** | Skill | 将低保真 wireframe 升级为高保真 Hi-Fi HTML 原型 |
| **modao-prototype** | Skill | （可选）将原型导入墨刀平台用于团队评审 |

**输入 → 输出**：

- 输入：PRD + 低保真 wireframes（来自 requirement-doc）
- 输出：`docs/prd-{项目名}/hifi-wireframes/*.html`

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

**架构文档 10 章节**：设计概述 → 技术栈选型 → 系统架构 → 数据模型 → API 设计 → 部署方案 → 非功能需求 → 安全设计 → 测试策略 → 附录

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

### 阶段 7：开发 → 审查 → 发布

| 角色 | 类型 | 职责 |
|------|------|------|
| **code_review** | Agent (Codex) | MUST/SHOULD/NIT 三级代码审查 |
| **code_testing** | Agent (Codex) | 测试策略编排（单元/集成/API/UI/E2E 多层测试），驱动 playwright-testing Skill |
| **ui_testing** | Agent (Codex) | Playwright UI/E2E 自动化测试（4 类：组件/E2E/视觉回归/无障碍） |
| **gate_review** | Agent | Gate 3 上线评审（测试报告 + PR 列表 → Go/No-Go） |
| **github-publish** | Skill | 完整发布流程：分支创建 → 代码提交 → PR 生成 → 审查 → 合并 |
| **pr_review_submit** | Agent | 将 code_review 结果写入 GitHub PR（行级评论 + APPROVE/REQUEST_CHANGES） |

**协作关系**：

```text
开发完成 → code_review (审查) → pr_review_submit (写入 PR)
        → ui_testing (UI 测试)
        → gate_review Gate 3 (上线评审)
          → github-publish (合并 PR)
```

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

**输出**：`docs/prd-{项目名}/analysis-report-eval-{YYYYMMDD}.md`

**与 gate_review 的区别**：gate_review 评单次产物质量（单阶段），pm_workflow_evaluator 评跨阶段流程健康度和一致性。

---

## 3. Agent 与 Skill 完整索引

### Agent 索引（9 个）

| Agent | 阶段 | 运行时 | 权限 | 核心职责 |
|-------|------|--------|------|---------|
| pm_assistant | 0-立项 | GitHub + Codex | read-only | 需求验证、飞书查重、竞品分析、商业/UI/技术快评 |
| requirement_analyst | 0-立项（轻量） | Codex | read-only | pm_assistant 简化版，4 步快速验证 |
| designer | 3-设计 | GitHub + Codex | workspace-write | 协调 prototype-design Skill，升级高保真原型 |
| architect | 4-架构 | GitHub + Codex | workspace-write | 技术架构设计，支持模块化架构 |
| gate_review | 2/5/7-评审 | GitHub + Codex | read-only | Gate 1/2/3 评审，Go/No-Go 决策 |
| code_testing | 7-测试 | Codex | workspace-write | 测试策略编排（单元/集成/API/UI/E2E 多层） |
| post_launch_review | 8-复盘 | GitHub + Codex | read-only | 上线数据分析、迭代建议 |
| pm_workflow_evaluator | 9-健康度 | GitHub + Codex | workspace-write | 跨阶段流程扫描、7 维度量化评分、瓶颈识别 |
| pr_review_submit | 7-发布 | GitHub | read-only | 将审查结果写入 GitHub PR Review |

### Skill 索引（9 个）

| Skill | 阶段 | 核心能力 | MCP 依赖 |
|-------|------|---------|----------|
| feishu-docs | 贯穿 | 飞书文档搜索/读取/创建/同步 | 飞书 MCP |
| requirement-doc | 1-需求 | 模块化 PRD 生成 + 低保真 wireframe | 无 |
| prototype-design | 3-设计 | 高保真 HTML 原型生成 | modao MCP（可选） |
| modao-prototype | 3-设计 | 原型导入墨刀平台 | 墨刀 MCP |
| architect | 4-架构 | 架构文档模板 + ADR | 无 |
| microservices | 4-架构 | 微服务设计/部署规范 | 无 |
| requirement-to-issues | 6-拆分 | PRD → GitHub Issues（Epic + Task） | GitHub MCP |
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
| 墨刀 MCP | modao-prototype, prototype-design | 原型生成与导入 | Token (MODAO_TOKEN) |
| GitHub MCP | requirement-to-issues, github-publish, pr_review_submit | Issue 管理、PR 操作、代码搜索 | GitHub Token |
| Playwright MCP | ui_testing | 浏览器自动化 UI 测试 | 本地运行 |

---

## 6. 关键设计原则总结

| 原则 | 说明 |
|------|------|
| **模块化优先** | ≥3 个功能模块时自动启用模块化 PRD + 模块级架构，下游 Skill 优先消费模块级文档 |
| **版本追踪** | 文档头精确记录关联上游版本号，变更记录含来源标识，确保 PRD ↔ 架构 ↔ Issue 版本一致 |
| **Stage-Gate 质量关卡** | 3 个评审门（PRD/架构/上线），每门有量化检查清单和权重评分，High Risk 项一票否决 |
| **角色分离** | Agent 负责决策和协调，Skill 负责方法论和执行模板，Agent 不做 Skill 的事 |
| **迭代闭环** | post_launch_review 复盘 → pm_assistant 迭代分析 → 增量更新，形成 Build-Measure-Learn 循环 |
| **渐进细化** | pm_assistant 只做快评（UI 复杂度/技术可行性），正式设计交由 designer 和 architect |
| **流程健康度** | pm_workflow_evaluator 在复盘后跨阶段扫描全流程产物，与 gate_review 互补：前者评流程健康度，后者评单次产物质量 |
