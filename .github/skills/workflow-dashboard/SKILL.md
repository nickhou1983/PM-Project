---
name: workflow-dashboard
description: >
  工作流度量仪表盘 Skill。一条命令扫描 pm-assistant 项目目录的本地产物（gate-results JSON、PRD 文档、wireframes、hifi-wireframes），生成含 Chart.js 图表的自包含 HTML 仪表盘（dashboard.html）。展示：7 阶段流程进度时间轴、产物统计卡片（Module PRD 数 / 低保真原型数 / 高保真原型数 / Gate 评审轮次）、Gate 评审雷达图 + 堆叠条形图（pass/warn/fail）、待改进事项清单。触发条件：(1) 查看/生成项目指标或度量，(2) 生成工作流仪表盘，(3) 可视化 Gate 评审结果，(4) 流程健康检查，(5) 产物覆盖率统计，(6) 生成 dashboard，(7) 查看评审进度或产物状态。
---

# 工作流度量仪表盘

## 概述

本 Skill 读取仓库内本地文件，为单个 pm-assistant 项目生成 **自包含的 HTML 度量仪表盘**。  
无需服务器、无需 GitHub API、无需额外 npm install，一条命令即可运行。

> **适用范围**：单项目，不跨项目汇总。

---

## 数据来源（全部本地文件）

| 数据 | 来源路径 | 采集内容 |
|------|---------|---------|
| Gate 评审结果 | `docs/prd-{项目}/gate-results/*.json` | decision、各维度分数、pass/warn/fail 计数 |
| PRD 版本号 | `docs/prd-{项目}/prd-{项目}.md` | 正则提取 `vX.Y.Z` |
| Module PRD 数 | `docs/prd-{项目}/modules/prd-*.md` | 文件计数 |
| 低保真原型数 | `docs/prd-{项目}/wireframes/*.html` | 文件计数（排除 index.html）|
| 高保真原型数 | `docs/prd-{项目}/hifi-wireframes/*.html` | 文件计数（排除 index.html）|
| 阶段完成状态 | 各阶段关键产物文件的存在性 | 7 阶段 ✅/⏳/⬜ |

---

## 使用方式

### 推荐：npm script

```bash
npm run dashboard -- videoprompt-ai
```

### 直接运行（推荐，从 skill 包执行）

```bash
node .github/skills/workflow-dashboard/scripts/generate-dashboard.js <项目名>
```

**示例**：
```bash
node .github/skills/workflow-dashboard/scripts/generate-dashboard.js videoprompt-ai
```

> `scripts/generate-dashboard.js` 是一个转发入口，实际逻辑在 `skills/workflow-dashboard/scripts/generate-dashboard.js`，两者效果相同。

### 生成后打开

```bash
open docs/prd-videoprompt-ai/dashboard.html
```

---

## 输出

- **生成文件**：`docs/prd-{项目名}/dashboard.html`  
- **打开方式**：直接双击或 `open` 命令，无需服务器  
- **Chart.js**：从 CDN 加载（需联网）；项目数据已内联，离线仅图表不渲染  

---

## 仪表盘内容结构

```
┌──────────────────────────────────────────────────────┐
│  项目名 · PRD 版本 · 生成日期                         │
│  ████████████░░░░░  工作流进度 5/7 阶段 (71%)         │
├──────────────────────────────────────────────────────┤
│  流程阶段时间轴                                       │
│  ✅ 立项 › ✅ PRD › ✅ Gate1 › ⏳ 高保真 › ⬜ 架构… │
├────────┬────────┬────────┬─────────────────────────┤
│ Module │ 低保真 │ 高保真  │ Gate 评审轮次             │
│ PRD 数 │ 原型数 │ 原型数  │                         │
├──────────────────────────────────────────────────────┤
│  Gate 1 评审       [Conditional Go]  2026-04-13      │
│  摘要文字（蓝色左边框）                               │
│  [雷达图：各维度得分]  [横向堆叠条形图：✅⚠️❌]       │
├──────────────────────────────────────────────────────┤
│  待改进事项 (N 条)                                    │
│  ⚠️ Gate 1 · 商业合理性 · 目标用户和痛点无数据支撑…  │
└──────────────────────────────────────────────────────┘
```

---

## 前置条件

- **Node.js** 已安装（无需额外安装 npm 包，使用内置 `fs`/`path`）
- 项目目录符合 pm-assistant 规范：`docs/prd-{项目名}/`
- `gate-results/` 目录下有标准格式的 Gate 评审 JSON（无 JSON 时仍可生成，仅展示产物统计和阶段状态）

---

## Gate JSON 格式要求

Gate 评审 JSON 需包含以下字段才能渲染图表：

```json
{
  "gate": "Gate 1",
  "project": "videoprompt-ai",
  "date": "2026-04-13",
  "decision": "Conditional Go",
  "summary": "...",
  "dimensions": [
    {
      "name": "需求完整性",
      "weight": 0.30,
      "score": 0.90,
      "pass_count": 9,
      "warn_count": 1,
      "fail_count": 0,
      "items": [
        { "id": 1, "check": "...", "result": "pass", "note": "..." }
      ]
    }
  ]
}
```

`weight: 0.00` 的维度会包含在条形图中，但不参与雷达图和加权总分计算。

---

## 约束

- 仅读取本地仓库数据，**不调用** GitHub API 或任何外部服务
- 单项目视图，不跨项目汇总
- 生成的 `dashboard.html` 可以放入 `.gitignore`（按需）或提交到仓库作为快照
