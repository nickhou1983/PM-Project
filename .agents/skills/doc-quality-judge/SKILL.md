---
name: "doc-quality-judge"
description: "LLM-as-Judge 文档质量评估 Skill。利用大模型对 PRD 和架构文档进行深层语义质量评估，超越结构 Lint 检测「写了但写得不好」的问题。触发条件：(1) 文档质量评估/评审，(2) LLM-as-Judge，(3) PRD 语义审查，(4) 架构文档深度评审，(5) doc-quality-judge，(6) 文档语义评分。"
---

# LLM-as-Judge 文档质量评估

利用大模型对 PRD 和架构文档进行**深层语义质量评估**。与 `doc-lint` 互补：`doc-lint` 检查结构完整性（写了没有），本 Skill 评估内容质量（写得好不好）。

## 适用场景

- Gate Review 前对文档质量做深度预评
- 识别「结构 Lint 通过但内容空洞」的问题
- 为 pm_workflow_evaluator Dim5 需求质量信号提供 LLM 评分

## 评估维度

### PRD 质量评估

| 维度 | 权重 | 评估要点 |
|------|------|---------|
| 目标清晰度 | 20% | 背景与目标是否明确、可衡量（SMART） |
| 用户故事质量 | 20% | Persona 是否具体、AC 是否可测试 |
| 需求完整性 | 20% | 功能列表无遗漏、非功能需求有量化指标 |
| 优先级合理性 | 15% | RICE 评分是否与业务价值一致 |
| 可追溯性 | 15% | 需求→模块→架构→Issue 链路清晰 |
| 一致性 | 10% | 术语、版本号、状态在各文档间一致 |

### 架构质量评估

| 维度 | 权重 | 评估要点 |
|------|------|---------|
| 技术选型合理性 | 20% | 选型理由充分、与业务规模匹配 |
| 架构完整性 | 20% | 系统图覆盖所有组件、无孤岛模块 |
| 数据模型质量 | 20% | ER 图规范、字段类型明确、索引策略 |
| API 设计质量 | 15% | RESTful 规范、错误码完整、版本策略 |
| 安全设计 | 15% | 认证授权方案、数据保护、审计日志 |
| 运维友好度 | 10% | 监控方案、部署策略、容灾设计 |

## 评估流程

### 步骤 1：准备

```bash
# 先运行结构 Lint，获取基线数据
node .github/skills/doc-lint/scripts/prd-lint.js <project>
node .github/skills/doc-lint/scripts/arch-lint.js <project>
```

### 步骤 2：LLM 评估

Agent 读取以下文件进行评估：

1. **目标文档**：`prd-{project}.md` 或 `architecture-{project}.md`
2. **Lint 结果**：`gate-results/prd-lint-*.json` 或 `gate-results/arch-lint-*.json`
3. **RTM**：`gate-results/rtm-*.json`（如已生成）
4. **Module PRDs**：`modules/prd-*.md`（如存在）

### 步骤 3：输出评估报告

输出到 `projects/prd-{PROJECT}/gate-results/quality-judge-{date}.md`，格式：

```markdown
# 文档质量评估报告 — {project}

> **评估日期**：{date}
> **评估类型**：PRD / 架构 / 全量
> **总分**：{score}/100

## 维度评分

| 维度 | 权重 | 得分 | 等级 | 关键发现 |
|------|------|------|------|---------|
| ... | ... | .../10 | A/B/C/D | ... |

## 关键发现

### 🔴 阻断问题 (必须修复)
1. ...

### 🟡 改进建议 (强烈建议)
1. ...

### 🟢 优化建议 (可选)
1. ...

## 与结构 Lint 结果对比

| 检查类型 | 结果 | 说明 |
|----------|------|------|
| prd-lint | X pass / Y warn / Z fail | ... |
| LLM 评估 | 总分 N/100 | ... |
| 差异 | Lint 通过但语义不足的项 | ... |
```

## 评分标准

| 等级 | 分数范围 | 含义 |
|------|---------|------|
| A | 90-100 | 优秀，可直接提交 Gate |
| B | 75-89 | 良好，少量改进后可提交 |
| C | 60-74 | 合格，需明确改进计划 |
| D | <60 | 不合格，需重大修改 |

## 约束

1. 评估基于文档文本，不执行代码或运行测试
2. 每次评估应记录 LLM 模型和版本
3. 评分应附带具体引用和证据
4. 同一文档连续评估结果应可比较

## 与其他 Skill/Agent 关系

| 工具 | 关系 |
|------|------|
| `doc-lint` | 互补 — doc-lint 检查结构，本 Skill 评估语义 |
| `gate_review` | 前置 — 本 Skill 结果作为 Gate Review 参考输入 |
| `pm_workflow_evaluator` | 数据源 — Dim5 需求质量信号引用评分 |
| `code-review` | 平行 — 代码审查 Skill，本 Skill 聚焦文档审查 |
