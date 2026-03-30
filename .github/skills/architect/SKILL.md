---
name: architect
description: "技术架构设计 Skill。根据产品需求文档（PRD）设计完整的技术架构方案，输出结构化的架构设计文档。覆盖技术栈选型、系统架构、数据模型、API 设计、部署方案、非功能需求、安全设计等。触发条件：(1) 设计技术架构，(2) 从 PRD 推导技术方案，(3) 系统设计/技术选型，(4) 数据库设计，(5) API 设计，(6) 部署架构设计。"
---

# 技术架构设计 Skill

根据 PRD 或产品需求描述，生成结构化的技术架构设计文档。

## 参考文件

按需加载 `references/` 目录下的模板文件：

| 文件 | 内容 | 何时加载 |
|------|------|----------|
| [architecture-template.md](references/architecture-template.md) | 架构文档标准模板（10 个章节 + 文档索引） | 所有架构设计任务 |
| [adr-template.md](references/adr-template.md) | 架构决策记录（ADR）模板 | 记录关键技术选型决策时 |
| [frontend-architecture-template.md](references/frontend-architecture-template.md) | 前端架构详设子文档模板 | 分文档模式时加载 |
| [backend-services-template.md](references/backend-services-template.md) | 后端服务详设子文档模板 | 分文档模式时加载 |
| [database-design-template.md](references/database-design-template.md) | 数据库设计子文档模板 | 分文档模式时加载 |

## 外部 Skill 依赖

架构设计过程中可能需要加载以下 Skill 的参考资料：

| Skill | 路径 | 何时加载 |
|-------|------|----------|
| `microservices` | `.claude/skills/microservices/` | 当架构选择微服务风格时，加载 `references/development.md` 获取服务拆分和通信规范 |
| `feishu-docs` | `.claude/skills/feishu-docs/` | 用户要求将架构文档同步到飞书时 |
| `github-publish` | `.claude/skills/github-publish/` | 用户要求提交架构文档到 GitHub 时 |
| `requirement-to-issues` | `.claude/skills/requirement-to-issues/` | 用户要求将架构模块拆分为 GitHub Issues 时 |

## 工作流

### 架构设计（主流程）

1. **加载模板** — 读取 `references/architecture-template.md`
2. **判断文档模式** — 根据以下条件判断使用单文档模式还是分文档模式：
   - **分文档模式触发条件**（满足任一）：用户明确说"拆分文档"、"分文档"、"前端架构文档"、"后端服务文档"、"数据库设计文档"；或项目规模为中大型（功能模块 ≥5 个 或 API 端点 ≥15 个）
   - **单文档模式**：默认模式，所有内容写入主架构文档
   - 若为分文档模式，额外加载 `references/frontend-architecture-template.md`、`references/backend-services-template.md`、`references/database-design-template.md`
3. **解读 PRD** — 提取业务目标、用户画像、功能需求（P0/P1/P2）、非功能需求、技术约束；同时搜索 `docs/` 目录下已有的 `architecture-*.md`，如存在则作为迭代基线参考。**必须记录 PRD 文档头的精确版本号**（如 `v1.0.0`），用于填充架构文档的「关联 PRD」字段
3. **分析原型图**（如存在） — 在 PRD 同级目录查找 `wireframes/` 和 `hifi-wireframes/`，按类型区分分析深度：
   - **低保真 wireframes/**：提取页面清单、导航结构、信息架构、基础交互流程
   - **高保真 hifi-wireframes/**：在低保真基础上额外提取设计系统（CSS 变量/主题色/组件库）、交互动效（动画/过渡）、响应式断点、数据展示需求（图表/数据表格/搜索筛选）
   - 输出前端复杂度评级（低/中/高）和核心交互模式清单
4. **评估架构风格** — 根据业务规模选择单体 / 微服务 / Serverless / 混合架构
5. **技术栈选型** — 前端（结合原型图分析）、后端、数据库、缓存、消息队列、搜索、AI/ML、DevOps，每项附选型理由
6. **设计核心架构** — 系统架构图（Mermaid）、前端架构（路由/状态管理/组件结构，基于原型图推导）、模块职责、服务划分
7. **数据模型设计** — ER 图（Mermaid）、关键表结构、索引策略
8. **API 设计** — RESTful 接口列表、认证鉴权方案、限流策略
9. **部署架构** — 部署拓扑图（Mermaid）、环境规划、CI/CD、容器编排
10. **非功能与安全** — 性能方案、高可用、监控告警、安全设计（OWASP）
11. **输出文档** — 写入 `docs/prd-{项目名}/architecture-{项目名}.md`
    - 文档头「关联 PRD」字段必须包含精确版本号（如 `prd-videoprompt-ai.md v1.0.0`）
    - 若目标路径已存在架构文档（迭代更新模式）：
      - 读取现有文档头版本号，根据变更范围递增（Patch: 措辞/格式、Minor: 新增模块/API/调整部署、Major: 架构风格变更/核心技术栈替换）
      - 在 §11 变更记录表格顶部追加新行（版本、日期、作者、变更类型、变更摘要）
      - 更新文档头的版本号、最后更新日期、状态设为「草稿」
    - **分文档模式额外输出**：
      - `docs/prd-{项目名}/frontend-architecture-{项目名}.md`
      - `docs/prd-{项目名}/backend-services-{项目名}.md`
      - `docs/prd-{项目名}/database-design-{项目名}.md`
    - 主文档 §0 文档索引自动填充各子文档的实际路径

### 后续操作

架构文档生成后，可触发后续流程：

- **提交 GitHub**: 加载 `github-publish` Skill
- **同步飞书**: 加载 `feishu-docs` Skill
- **拆分 Issues**: 加载 `requirement-to-issues` Skill
- **部署详设**: 加载 `microservices` Skill 的 `references/deployment.md`

## 快速参考

### 架构风格选择矩阵

| 评估维度 | 权重 | 单体架构 | 微服务架构 | Serverless | 混合架构 |
| -------- | ---- | -------- | ---------- | ---------- | -------- |
| 团队规模 | 20% | ≤5人 ✅ | >10人 ✅ | 不限 | 5-15人 ✅ |
| 交付时间 | 15% | 快 ✅ | 慢 | 中 | 中 |
| 弹性需求 | 15% | 低 | 中 | 高 ✅ | 中 |
| 运维复杂度 | 15% | 低 ✅ | 高 | 中 | 中 |
| 独立部署 | 15% | 不支持 | 支持 ✅ | 支持 ✅ | 部分支持 |
| 技术异构性 | 10% | 不支持 | 支持 ✅ | 支持 | 部分支持 |
| 成本（初期） | 10% | 低 ✅ | 高 | 按用量 | 中 |

**快速判断**：MVP/小团队→单体 | 多团队/独立部署→微服务 | 事件驱动/高弹性→Serverless | 渐进演进→混合

### 文档质量检查清单

**必检项（所有项目必须通过）**：

- [ ] 10 个章节全部填写
- [ ] 每个技术选型都有选型理由
- [ ] 架构图使用 Mermaid 且语法正确
- [ ] 非功能需求有可量化指标，且附 PRD 到技术方案的推导逻辑
- [ ] 安全设计覆盖 OWASP Top 10 核心项
- [ ] 需求追溯矩阵（§1.5）覆盖所有 P0/P1 功能需求
- [ ] 与 PRD 需求无矛盾
- [ ] 术语表覆盖所有专业术语
- [ ] 【版本管理】文档头「关联 PRD」字段包含精确版本号（如 `prd-xxx.md v1.0.0`）
- [ ] 【版本管理】文档头版本号与 §11 变更记录最新条目一致
- [ ] 【版本管理】若为迭代更新，版本号已按规则递增且变更记录已追加

**条件检项（满足条件时必须通过）**：

- [ ] 若存在 `wireframes/`，低保真分析提取了页面清单和导航结构
- [ ] 若存在 `hifi-wireframes/`，高保真分析额外提取了设计系统和交互动效
- [ ] 若选择微服务架构，已加载并引用 `microservices` Skill 规范
- [ ] 若涉及 AI/ML 或外部付费 API，成本估算章节（§6.5）已填写
- [ ] 若存在关键选型决策，已使用 ADR 模板记录
- [ ] 若使用分文档模式，主文档 §0 文档索引已填写且链接正确
- [ ] 若使用分文档模式，3 个子文档的「关联文档」表路径与主文档一致
- [ ] 若使用分文档模式，主文档 §3.4/§4/§5 为摘要形式且包含子文档链接
