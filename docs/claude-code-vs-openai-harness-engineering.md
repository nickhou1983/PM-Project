# Claude Code vs OpenAI：Harness Engineering 理解对比分析

> 生成日期：2026-05-07  
> 基于：Claude Code Docs (code.claude.com) + OpenAI Agents SDK Docs (developers.openai.com)

---

## 1. 术语定位

| 维度 | OpenAI (Agents SDK) | Claude Code (Anthropic) |
|------|---------------------|------------------------|
| **是否显式使用 "Harness" 术语** | ✅ 显式定义 — 文档明确区分 "harness"（控制平面）与 "compute"（执行平面） | ❌ 不使用此术语 — 等价概念散布在 hooks/permissions/skills/subagents 中 |
| **核心隐喻** | 工业控制系统：harness 是工厂的 PLC，sandbox 是车间 | 开发者的结对伙伴：你描述目标，Claude 自主完成 |
| **产品形态** | SDK + 平台 API（开发者自建 harness） | 一体化 CLI / IDE Agent（harness 内建） |

---

## 2. 架构哲学对比

### OpenAI：**Harness ↔ Compute 显式分离**

```
┌─────────────────────────────────┐
│         HARNESS (控制平面)        │
│  agent loop · model calls       │
│  tool routing · handoffs        │
│  approvals · tracing · recovery │
│  run state · guardrails         │
└────────────┬────────────────────┘
             │  boundary
┌────────────▼────────────────────┐
│       COMPUTE / SANDBOX         │
│  filesystem · shell · packages  │
│  ports · mounts · snapshots     │
│  provider isolation             │
└─────────────────────────────────┘
```

**设计原则**：
- Harness 运行在可信基础设施，持有 auth、billing、audit、human review
- Sandbox 仅聚焦 model-directed 的文件和命令执行
- Provider 可替换：Unix-local / Docker / E2B / Vercel / Modal / Cloudflare…
- 状态三分：RunState（harness 侧）、Session State（sandbox 连接态）、Snapshot（workspace 内容）

### Claude Code：**Agent 即环境（Embedded Harness）**

```
┌─────────────────────────────────────────────┐
│            CLAUDE CODE SESSION               │
│  ┌────────────────────────────────────────┐  │
│  │  Implicit Harness Layer               │  │
│  │  CLAUDE.md · permissions · hooks      │  │
│  │  auto-mode classifier · checkpoints   │  │
│  │  context compaction · session resume   │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │  Execution Layer                       │  │
│  │  file read/write · terminal commands  │  │
│  │  MCP servers · skills · subagents     │  │
│  │  agent teams (experimental)           │  │
│  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

**设计原则**：
- Harness 不外露给开发者——Claude 自身就是 harness + compute 的统一体
- 安全边界通过 permissions、sandbox mode、hooks 实现
- 状态管理通过 checkpoints + session resume 实现
- 扩展通过 skills / subagents / plugins / MCP 实现

---

## 3. 六大 Harness 能力维度对比

### 3.1 编排与路由 (Orchestration)

| 能力 | OpenAI | Claude Code |
|------|--------|-------------|
| 多 Agent 委派 | `handoff()` — 所有权转移给专家 Agent | Agent Teams — lead 分配任务给 teammates |
| Agent 作为工具 | `agent.asTool()` — manager 保持控制 | Subagents — 独立 context，结果汇报回主会话 |
| 任务分解 | 开发者自行设计 workflow graph | 共享 Task List + 自动 claim + 依赖管理 |
| 并行度 | SDK 层编排多 Agent 并行 run | Agent Teams（3-5 teammates）或 worktree 多会话 |
| 编排模式 | 声明式 SDK API（Handoffs / Tools / Guardrails） | 自然语言指令式（"Create an agent team to…"） |

**分析**：OpenAI 提供显式的编程式编排原语（handoff、asTool），适合构建确定性 workflow；Claude Code 更接近「用自然语言描述团队结构」，编排由 AI 自行管理，灵活但确定性较弱。

---

### 3.2 执行隔离 (Sandbox / Compute Isolation)

| 能力 | OpenAI | Claude Code |
|------|--------|-------------|
| 隔离机制 | SandboxAgent + 多 Provider（Docker/E2B/Vercel/Modal…） | `/sandbox` 命令启用 OS 级隔离（实验性） |
| Workspace 契约 | `Manifest` 对象（声明 files/repos/mounts/env） | CLAUDE.md + 项目目录即 workspace |
| 文件系统挂载 | S3 / GCS / R2 / Azure Blob / Box 等 Mount | 直接访问本地文件系统 |
| 端口暴露 | Sandbox 内服务可暴露端口供外部预览 | 不涉及（开发者自行管理） |
| 状态恢复 | serialize / deserialize session state + snapshot | Checkpoint + session resume (`--continue`, `--resume`) |
| Provider 生态 | 8+ provider（Blaxel/Cloudflare/Daytona/Docker/E2B/Modal/Runloop/Vercel） | 无 provider 概念，绑定本地 OS |

**分析**：OpenAI 将 sandbox 做成一等公民，支持多 provider 可替换的容器化隔离，适合生产级别的 Agent 工作负载。Claude Code 默认直接访问本地文件系统（零隔离），隔离能力处于实验阶段。

---

### 3.3 治理与审批 (Governance / Guardrails)

| 能力 | OpenAI | Claude Code |
|------|--------|-------------|
| 输入护栏 | `inputGuardrails` — 独立 Agent 做前置校验 | CLAUDE.md 指令 + permissions 配置 |
| 输出护栏 | `outputGuardrails` — 生成后校验/脱敏 | Hooks（PostToolExecution）检查输出 |
| 工具级护栏 | `needsApproval: true` 工具级暂停 | Permission allowlist + auto-mode classifier |
| Human-in-the-loop | `interruptions` → approve/reject → resume | 默认逐步确认；auto mode 由 classifier 代审 |
| 审批状态化 | RunState 可序列化存储，延迟审批后恢复 | 交互式实时审批（无异步存储审批流） |
| Plan 审批 | 无内建，需开发者自行实现 | `Require plan approval` — teammate 须 lead 批准后执行 |

**分析**：OpenAI 的 guardrails 是类型化、可组合的 SDK 原语，适合企业级合规流水线。Claude Code 的治理更「嵌入式」——通过 hooks、permissions、auto-mode classifier 实现，适合个人/小团队快速迭代。

---

### 3.4 可观测性 (Observability / Tracing)

| 能力 | OpenAI | Claude Code |
|------|--------|-------------|
| 结构化 Tracing | ✅ 内建，默认开启（model calls / tool calls / handoffs / guardrails） | ❌ 无结构化 trace 系统 |
| Trace 仪表盘 | ✅ platform.openai.com/traces 可视化 | ❌ 无（依赖终端日志 + session history） |
| 自定义 Span | `withTrace()` 包裹自定义 workflow | 无等价物 |
| Evals 集成 | Trace → Agent Evals → Graders 闭环 | 无内建 eval 系统 |
| 调试方式 | Traces + streaming 输出 | `/rewind` 检查点回溯 + `--verbose` 日志 |
| 度量输出 | API 级 usage metrics + trace analytics | Context window 使用率（手动观察） |

**分析**：OpenAI 在可观测性上远超 Claude Code。其 Tracing → Evals → Graders 形成完整的 Agent 质量闭环，适合需要 SRE 级监控的生产系统。Claude Code 的可观测性基本依赖开发者主观感知。

---

### 3.5 记忆与状态持久化 (Memory / State)

| 能力 | OpenAI | Claude Code |
|------|--------|-------------|
| 工作空间记忆 | Sandbox Memory（memory_summary.md / MEMORY.md / rollout summaries） | CLAUDE.md + auto-memory（用户纠正自动记录） |
| 会话记忆 | SDK Session（message history 持久化） | `--continue` / `--resume` 本地会话保存 |
| 跨 Run 学习 | memory capability — 从历史 run 中提炼教训 | CLAUDE.md 手动维护 + memory 自动追加 |
| 快照 | Snapshot（workspace 内容序列化，跨 provider 可移植） | Checkpoint（git-like，包含代码 + 对话状态） |
| 多 Agent 记忆隔离 | 每个 Agent 可有独立 memory layout | Subagents 无共享记忆；Teams 通过 mailbox 通信 |

**分析**：OpenAI 将 memory 工程化为分层系统（raw → consolidated → summary），支持多 Agent 隔离和 S3 级持久化。Claude Code 的记忆更轻量——自动学习 + CLAUDE.md 人工维护，但缺乏结构化的跨 session 知识蒸馏。

---

### 3.6 扩展与集成 (Extensibility)

| 能力 | OpenAI | Claude Code |
|------|--------|-------------|
| 工具系统 | Function calling + hosted tools + MCP + Skills + Shell + Computer Use + Tool Search | MCP + Skills + Hooks + CLI tools + Plugins |
| 技能复用 | `skills()` capability — git repo / local bundle 按需加载 | `.claude/skills/` SKILL.md 文件，自动或 /skill 调用 |
| CI/CD 集成 | Webhooks + Background mode + API 驱动 | `claude -p` 非交互模式 + GitHub Actions 集成 |
| 多模态 | Vision + Audio + Video + Image Gen + Computer Use | 图片粘贴/拖放 + Chrome 扩展（视觉验证） |
| 社区生态 | MCP 生态 + provider marketplace | Plugins marketplace（`/plugin`）+ MCP 生态 |

---

## 4. 核心理念差异总结

| 维度 | OpenAI Agents SDK | Claude Code |
|------|-------------------|-------------|
| **定位** | Agent 工程平台 SDK（你来搭 harness） | Agent 开发者工具（harness 已为你搭好） |
| **目标用户** | 平台工程师 / 应用开发者 | 个人开发者 / 小团队 |
| **Harness 暴露度** | 完全暴露 — 开发者控制每一层 | 完全封装 — 开发者只需描述意图 |
| **确定性 vs 灵活性** | 偏确定性（类型安全 SDK、显式 workflow graph） | 偏灵活性（自然语言编排、AI 自主决策） |
| **生产就绪度** | 更高（tracing / guardrails / provider isolation / evals） | 更快启动（零配置上手、一句话编排） |
| **控制粒度** | API 级别（每个 tool call 可中断审批） | 会话级别（全局 permission mode） |
| **Sandbox 哲学** | Harness 与 Compute 必须分离 | Agent 默认信任开发者环境 |
| **可观测性** | 平台级（Trace Dashboard + Evals + Graders） | 开发者级（terminal output + checkpoints） |

---

## 5. 对 PM-Project 的启示

基于 PM-Project 已有的 Agent 设计（角色专用化 / 阶段门控 / workflow-manifest 跨阶段契约 / pm_workflow_evaluator 度量闭环），与两大平台的理念匹配度：

| PM-Project 特征 | 与 OpenAI 的对应 | 与 Claude Code 的对应 |
|-----------------|-----------------|---------------------|
| gate_review Agent（Go/No-Go 门禁） | ≈ Guardrails + Human-in-the-loop approvals | ≈ Hooks（TaskCompleted + TeammateIdle） |
| workflow-manifest.json（跨阶段契约） | ≈ Manifest + RunState + Sandbox session state | ≈ CLAUDE.md + Skills（无直接等价物） |
| pm_workflow_evaluator（7 维度评分） | ≈ Tracing + Evals + Graders pipeline | 无直接等价物（需自建） |
| 角色专用化 Agent（pm/architect/designer） | ≈ Agent definitions + Handoffs 编排 | ≈ Subagents / Agent Teams |
| requirement-to-issues（PRD→GitHub Issues） | ≈ Function tools + MCP 集成 | ≈ Skills + `gh` CLI 工具 |

### 建议

1. **如果追求可观测性和生产级治理**：PM-Project 的 gate_review / manifest 模式与 OpenAI 的 Guardrails + Tracing + Evals 理念高度吻合，可考虑将 manifest check 映射为 OpenAI 式的 tool-level guardrail
2. **如果追求开发速度和灵活编排**：当前基于 Claude Code 的 Agent/Skill 架构已是最佳实践——自然语言驱动、convention over configuration
3. **缺口补齐方向**：无论选择哪个平台，PM-Project 均需补充结构化 tracing（当前仅有 gate-results JSON），建议引入度量仪表盘 + 执行轨迹记录

---

## 6. 一句话结论

> **OpenAI 把 Harness 定义为开发者必须显式构建的控制平面基础设施（SDK-first）；Claude Code 把 Harness 内化为 Agent 自身的行为约束和环境感知能力（product-first）。两者解决同一个问题——"如何安全、可控地编排 AI Agent 执行工程任务"——但从完全不同的抽象层次切入。**
