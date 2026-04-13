---
name: prototype-publish
description: "原型平台发布 Skill。将 HTML 原型发布到墨刀（Modao）或 Figma 平台，用于产品评审和团队协作。支持从 PRD、wireframe 或直接描述生成原型并发布。触发条件：(1) 导入墨刀，(2) 导入 Figma，(3) 发布原型，(4) 原型平台导出，(5) modao，(6) figma，(7) 生成设计说明。"
---

# 原型平台发布 Skill

将产品 HTML 原型发布到 **墨刀**（Modao）或 **Figma** 平台，用于产品评审和团队协作展示。

- **墨刀路径**：通过 `modao-proto-mcp` MCP 的 `gen_html` + `import_html` 工具生成并导入
- **Figma 路径**：通过官方 Figma MCP Server 的 `generate_figma_design` 工具，将本地 HTML 页面转换为可编辑的 Figma frames

## 前置依赖

### 墨刀（Modao）

- VS Code 用户级 MCP 配置中需已配置 `modao-proto-mcp`（`@modao-mcp/modao-proto-mcp`）
- 墨刀访问令牌已配置（建议通过环境变量注入，避免明文存储在配置文件中）

> **安全提醒**：不要把 `--token=${MODAO_TOKEN}` 直接写进 Codex MCP 的 `args` 里依赖参数插值。在当前 Codex App/RMCP 环境下，这种写法可能导致 token 没有实际传入子进程。更稳妥的方式是通过 shell 启动命令在运行时展开环境变量，例如：`command = "sh"`，`args = ["-lc", "exec npx -y @modao-mcp/modao-proto-mcp --token \"$MODAO_TOKEN\" --url https://modao.cc"]`。

### Figma

- VS Code 用户级 MCP 配置中需已配置官方 `figma-mcp-server`（`figma-developer-mcp`）
- Figma Personal Access Token 已配置，需 **File content Write** 权限（通过环境变量 `FIGMA_ACCESS_TOKEN` 注入）
- 目标 Figma 文件 URL 已提前创建
- 本地需能运行 HTTP server（`npx serve` 或项目内置 dev server）

> **安全提醒**：Figma Token 通过环境变量 `FIGMA_ACCESS_TOKEN` 注入，不要明文写入配置文件。

## 参考文件

| 文件 | 内容 | 何时加载 |
|------|------|----------|
| [modao-workflow-guide.md](references/modao-workflow-guide.md) | 墨刀 MCP 工具调用示例、Figma 导入操作步骤、页面分组策略、输出物管理建议 | 首次使用或需要工具调用示例时加载 |

## 外部 Skill 协作

| Skill | 路径 | 协作关系 |
|-------|------|----------|
| `requirement-doc` | `.agents/skills/requirement-doc/` | 可从其生成的低保真 wireframes 作为输入，或从 PRD 功能需求章节提取页面列表 |
| `prototype-design` | `.agents/skills/prototype-design/` | 可从其生成的 hifi-wireframes 作为输入，发布高保真原型到平台 |

## 工作流

### 步骤 1：确定输入与页面范围

明确原型生成的输入来源和页面范围：

**来源 A：从 PRD 提取**
- 读取 PRD 的「功能需求」和「交互设计」章节
- 提取 P0 核心页面列表
- 按功能链路分组（建议每组 3-5 个页面）

**来源 B：从已有 wireframes 转换**
- 读取 `docs/prd-{项目名}/wireframes/` 下的 HTML 文件
- 选择需要导入墨刀的页面子集

**来源 C：直接描述**
- 用户直接描述页面需求（文字或参考图片）

**分组策略**（建议按功能链路分组，每组 3-5 页）：

| 组别 | 典型页面 |
|------|----------|
| 用户访问链路 | 首页、搜索、详情 |
| 内容生产链路 | 发布、编辑、草稿 |
| 账户链路 | 登录、注册、个人主页、设置 |

### 步骤 2：生成设计说明（可选）

如果输入是简短需求而非详细页面描述，先扩写为结构化设计说明：

1. 调用墨刀 MCP 的 `gen_description` 工具
2. 输入：页面需求文本（或参考图片）
3. 输出：结构化的页面设计说明（包含页面目标、模块布局、交互描述）

> **何时跳过**：如果已有详细的 PRD 交互设计描述或完整的 wireframe HTML，可直接进入步骤 3。

### 步骤 3：生成 HTML 原型

根据设计说明或需求描述生成 HTML 原型：

1. 调用墨刀 MCP 的 `gen_html` 工具
2. 输入：步骤 2 的设计说明，或直接的页面需求描述
3. 输出：HTML 原型代码（及用于导入的 key）
4. 按分组逐组生成，每组完成后再进入下一组

### 步骤 4：选择目标平台并导入

根据团队协作需求选择目标平台：

| 平台 | 适合场景 | 优势 |
|------|---------|------|
| **墨刀** | 快速评审、无 Figma 账号团队 | 生成快、无需本地 server |
| **Figma** | 有 Figma 设计系统的团队、需要设计师深度协作 | 可编辑 frames、标注、Code Connect 一体化 |

#### 路径 A：导入墨刀

1. 调用墨刀 MCP 的 `import_html` 工具
2. 如果步骤 3 返回了 key，优先使用 key 导入
3. 否则传入完整的 HTML 内容导入
4. 导入成功后记录墨刀中的页面位置

#### 路径 B：导入 Figma

1. **启动本地 HTTP server**（`generate_figma_design` 需要 URL，不支持 `file://`）
   - 低保真原型：`npx serve docs/prd-{项目名}/wireframes -p 3001`
   - 高保真原型：`npx serve docs/prd-{项目名}/hifi-wireframes -p 3001`
2. **调用 Figma MCP 的 `generate_figma_design` 工具**：
   - 输入：`http://localhost:3001/{page}.html` + 目标 Figma 文件 URL
   - 输出：Figma canvas 上生成可编辑的 frame
3. 逐页执行，按功能链路推入对应 Figma Page
4. 所有页面完成后**关闭本地 server**
5. **Figma 内手动补充**（可选）：整理 frames 分组 → 设置 Prototype 跳转链接

> **注意**：`generate_figma_design` 将 HTML 渲染结果转为 Figma layers，CSS 动效和 JS 交互不保留，仅保留视觉布局。Prototype 跳转需在 Figma 内手动设置。

### 步骤 5：输出汇总

完成所有页面导入后，汇总输出：

```markdown
## 🎨 原型平台发布结果

**目标平台**：墨刀 / Figma（填写实际使用平台）

| 页面 | 状态 | 平台链接/位置 |
|------|------|---------------|
| {页面1} | ✅/❌ | {墨刀个人空间 / Figma 文件+Page位置} |
| {页面2} | ✅/❌ | {链接} |

**后续建议**：在平台中进一步调整布局和交互细节，确认后将评审结论同步回 PRD
```

## 使用定位

- **平台是展示层**：墨刀/Figma 用于评审、协作、快速查看
- **仓库 wireframes 是源**：版本管理、diff、自动化测试的基线仍在仓库中
- 如果在平台中做了修改，需要手动将变更同步回仓库 wireframes

## 质量检查清单

- [ ] P0 核心页面已全部导入
- [ ] 每个页面在目标平台可正常查看
- [ ] 导入结果已汇总输出（含平台链接或位置说明）
- [ ] （Figma 路径）本地 HTTP server 已关闭
- [ ] （Figma 路径）目标 Figma 文件已按功能模块分 Page 整理
