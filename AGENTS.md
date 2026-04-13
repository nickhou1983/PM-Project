# PM-Project — Codex 项目指令

> 本文件为 Codex CLI/App 提供项目级工作协议和指令。全局级指令放在 `~/.codex/AGENTS.md`。

## 项目概述

本仓库是一个 **GitHub Copilot / Codex 定制化仓库**，包含自定义 Agent、Skill 和产品开发工作流模板。不是传统应用代码仓库。

## 工作语言

- 所有报告、文档、评审输出使用 **中文**
- Agent 和 Skill 的 description 使用中文
- 代码注释和变量命名使用英文

## 文档路径约定

- 主 PRD 文档：`docs/prd-{项目名}/prd-{项目名}.md`
- 模块 PRD 文档：`docs/prd-{项目名}/modules/prd-{module_en_slug}.md`
- 模块导航索引：`docs/prd-{项目名}/modules/README.md`
- 架构文档（主）：`docs/prd-{项目名}/architecture-{项目名}.md`
- 架构文档（模块级）：`docs/prd-{项目名}/architecture-{项目名}-{module_en_slug}.md`
- 低保真原型：`docs/prd-{项目名}/wireframes/*.html`（以 `{module_en_slug}-` 为前缀命名）
- 高保真原型：`docs/prd-{项目名}/hifi-wireframes/*.html`
- 分析报告：`docs/prd-{项目名}/analysis-report*.md`

> **模块命名规范**：`module_en_slug` 使用小写英文单词、以 `-` 连接（如 `task-management`、`time-management`）。中文名称用于显示，英文 slug 用于文件名和标识。

## Agent 角色索引

以下 Agent 定义在 `.codex/agents/` 目录下，可通过自然语言或手动 spawn：

| Agent | 职责 | sandbox_mode |
|-------|------|-------------|
| `pm_assistant` | 需求分析与立项前验证（含飞书查重、竞品分析、商业快评） | read-only |
| `architect` | 根据 PRD 设计技术架构方案 | workspace-write |
| `code_debug` | 代码错误诊断（飞书知识库 + 代码搜索） | workspace-write |
| `code_docs` | 代码文档生成（注释/README/API 文档、可同步飞书） | workspace-write |
| `code_review` | 代码审查（MUST/SHOULD/NIT 分级） | read-only |
| `code_testing` | 代码测试（单元/集成/UI/E2E） | workspace-write |
| `designer` | 高保真原型设计（基于 PRD + wireframe） | workspace-write |
| `gate_review` | Stage-Gate 评审门（PRD/架构/上线三个 Gate） | read-only |
| `new_employee_mentor` | 新员工导师（路由分发器，分析意图后路由到合适的 Agent） | workspace-write |
| `pm_workflow_evaluator` | 工作流健康度评估（跨阶段流程扫描、量化仪表板、瓶颈识别） | workspace-write |
| `planning` | 任务规划与上下文研究（只研究不执行） | read-only |
| `post_launch_review` | 上线复盘与迭代决策 | read-only |
| `pr_review_submit` | 将审查结果写入 GitHub PR Review | read-only |
| `requirement_analyst` | 需求灵感验证（简化版 PM assistant） | read-only |
| `tdd_developer` | TDD 开发（基于 Issue + 架构文档，Red-Green-Refactor） | workspace-write |
| `ui_testing` | UI 自动化测试（Playwright MCP） | workspace-write |

## Skill 索引

Skill 存放在 `.agents/skills/`（指向 `.github/skills/` 的符号链接）。可用 `$skill-name` 显式调用。

| Skill | 用途 |
|-------|------|
| `architect` | 架构设计模板和 ADR（支持模块级架构设计） |
| `code-review` | 代码审查规范 |
| `code-standards-check` | 代码规范审计 |
| `coding-standards` | 编码规范集 |
| `feishu-docs` | 飞书文档查询/操作 (MCP) |
| `github-publish` | GitHub 发布工作流 |
| `microservices` | 微服务架构/部署规范 |
| `prototype-publish` | 原型平台发布（支持墨刀 MCP 和 Figma MCP 双路径） |
| `playwright-testing` | Playwright 测试规范 |
| `prototype-design` | 高保真原型设计 |
| `requirement-doc` | PRD 生成（支持模块化：主 PRD + Module PRD） |
| `requirement-to-issues` | PRD 转 GitHub Issues（Epic 模块 + Task 功能点） |
| `security-audit` | OWASP Top 10 安全审查 |
| `tdd-coder` | TDD 编码方法论（Red-Green-Refactor） |

## Designer Agent 与原型设计 Skills

### 角色定位

`designer` Agent 处于产品经理（PM）之后、架构师之前，负责将低保真 wireframe 升级为高保真 Hi-Fi 原型：

```
requirement-doc (PM)  → 低保真 wireframe + PRD
        ↓
designer              → 高保真 Hi-Fi 原型（hifi-wireframes/）
        ↓
architect             → 技术架构方案
```

### 约束

- 不修改 PRD 的业务需求内容，只聚焦视觉设计
- 不使用 Figma/Sketch 等外部设计工具，所有原型均为 HTML + CSS 实现
- 必须保留低保真 wireframe 中的信息架构和功能布局
- 所有页面必须使用同一套主题变量（统一设计语言）

### prototype-design Skill — 高保真原型生成

`prototype-design` Skill 定义两种生成方式：

| 方式 | 触发词 | 特点 | 适用场景 |
|------|--------|------|----------|
| **方式 A（默认）** | 无特殊要求 | 直接写 HTML，遵循 `hifi-guide.md` 三套主题系统 | 严格品牌一致性、精确视觉控制 |
| **方式 B（可选）** | "用 gen_html 生成"、"快速生成" | 调用 `modao-proto-mcp` MCP `gen_html` 工具 | 快速原型验证、不要求主题精确 |

**三套预设主题**（方式 A 适用）：

| 主题 | 适用产品类型 |
|------|-------------|
| 科技蓝 (Tech Blue) | 工具/效率/SaaS/AI/开发 |
| 自然绿 (Nature Green) | 健康/环保/社区/生活/宠物/运动 |
| 渐变紫 (Gradient Purple) | 创意/娱乐/内容/社交 |

输出目录：`docs/prd-{项目名}/hifi-wireframes/`，命名规则与低保真 wireframe 保持一致。

### prototype-publish Skill (modao-prototype) — 原型平台发布

`prototype-publish` Skill（即 `modao-prototype` Skill）负责将 HTML 原型发布到外部平台供评审协作，支持双路径：

#### 路径 A：墨刀（推荐，当前可直接使用）

调用 `modao-proto-mcp` MCP 的三个工具：

| 工具 | 用途 |
|------|------|
| `gen_description` | 将简短需求扩写为结构化设计说明（可选） |
| `gen_html` | 根据设计说明生成 HTML 原型 |
| `import_html` | 将 HTML 原型导入墨刀平台 |

> 墨刀 MCP 已在 VS Code 用户级 `mcp.json` 中配置，Token 已注入，**可直接使用**。

#### 路径 B：Figma（需额外配置）

调用官方 `figma` MCP 的 `generate_figma_design` 工具，将本地 HTML 渲染结果转为 Figma frames。

**当前状态与前置条件**：

| 条件 | 状态 | 说明 |
|------|------|------|
| Figma MCP 已配置 | ✅ | `mcp.json` 中已配置 `https://mcp.figma.com/mcp` |
| Personal Access Token | ❌ **缺失** | 需在 `mcp.json` 的 `headers` 中配置 `X-Figma-Token` |
| 本地 server 公网可达 | ❌ **需处理** | `generate_figma_design` 由 Figma 云端执行，无法访问 `localhost` |

**配置 Figma Token（激活 Figma 路径必须）**：

```json
"figma": {
    "url": "https://mcp.figma.com/mcp",
    "type": "http",
    "headers": {
        "X-Figma-Token": "YOUR_PERSONAL_ACCESS_TOKEN"
    }
}
```

**解决 localhost 问题**（二选一）：
- 使用 `ngrok` / `localtunnel` 将 `localhost:3001` 暴露为公网 URL
- 将 wireframe HTML 先部署到 GitHub Pages

> **注意**：`generate_figma_design` 将 HTML 视觉布局转为 Figma layers，CSS 动效和 JS 交互不保留。Prototype 跳转链接需在 Figma 内手动设置。

### 快速命令参考

| 命令 | 触发的 Agent/Skill |
|------|------------------|
| "将 wireframe 升级为高保真" | `designer` → `prototype-design` |
| "用科技蓝主题生成高保真" | `designer` → `prototype-design`（方式 A + 指定主题） |
| "导入墨刀" | `prototype-publish`（路径 A） |
| "发布原型到 Figma" | `prototype-publish`（路径 B，需先配置 Token） |

## MCP 服务依赖

以下 MCP 服务需要在 `.codex/config.toml`（Codex）或 VS Code 用户级 `mcp.json` 中配置：

| MCP 服务 | 配置位置 | 状态 | 用途 |
|---------|---------|------|------|
| **飞书 (Feishu)** | `.codex/config.toml` | 需配置 Token | 文档查重、知识库检索、文档同步 |
| **墨刀 (Modao)** | `mcp.json` | ✅ 已配置 | 原型生成与导入（`gen_html` + `import_html`） |
| **Figma** | `mcp.json` | ⚠️ 缺 Token | 高保真原型导出到 Figma frames |
| **Playwright** | `mcp.json` | ✅ 已配置 | 浏览器自动化 UI 测试 |
| **GitHub** | `.codex/config.toml` | 需配置 Token | PR 管理、Issue 操作、代码搜索 |

## 工作流约定

### 产品开发全流程

```
pm_assistant (立项验证)
  → requirement-doc (生成主 PRD + Module PRD + wireframe)
    → gate_review Gate 1 (PRD 评审：主 PRD + 所有 Module PRD)
      → designer (高保真原型)
        → architect (主架构设计 + 模块级架构设计)
          → gate_review Gate 2 (架构评审)
            → requirement-to-issues (按模块拆分：Module Epic + Task Issues)
              → 开发阶段
                → code_review (审查)
                  → gate_review Gate 3 (上线评审)
                    → post_launch_review (复盘)
```

### 模块化 PRD 输出结构

```
docs/prd-{项目名}/
├── prd-{项目名}.md              ← 主 PRD（§4 为模块导航层）
├── analysis-report-{项目名}.md  ← 需求分析报告（附录 A）
├── architecture-{项目名}.md     ← 主架构文档
├── architecture-{项目名}-{module_en_slug}.md  ← 模块级架构文档
├── modules/
│   ├── README.md                ← 模块导航索引
│   ├── prd-{module-1}.md        ← 模块1 PRD
│   ├── prd-{module-2}.md        ← 模块2 PRD
│   └── ...
├── wireframes/
│   ├── index.html               ← 原型导航（按模块分组）
│   ├── {module-1}-page.html     ← 模块1 原型页面
│   └── ...
└── hifi-wireframes/             ← 高保真原型（由 designer 生成）
```

### PR 规范

- 分支命名：`feature/{描述}`、`fix/{描述}`、`docs/{描述}`
- Commit message：`类型(范围): 描述` （如 `feat(agent): add codex CLI adaptation`）
- PR 必须通过 code_review Agent 审查

## 安全要求

- 不要在仓库中提交 token、密钥、密码
- 飞书认证 token 通过环境变量注入（`FEISHU_MCP_UAT`、`FEISHU_MCP_TAT`）
- 墨刀 token 通过环境变量注入（`MODAO_TOKEN`）
