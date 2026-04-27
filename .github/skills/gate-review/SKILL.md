---
name: gate-review
description: "Gate Review 评审检查清单与输出规范。提供 Gate 1/2/2.5/3 四个评审门的详细检查项、权重和评分规则，供 gate_review Agent 加载使用。"
---

# Gate Review 检查清单

## 概述

本 Skill 为 `gate_review` Agent 提供各评审门的详细检查清单参考文件，将大量检查项从 Agent 主体中解耦，减少 context 占用。

## 参考文件

| 文件 | 内容 | 检查项数 |
|------|------|---------|
| [gate1-checklist.md](references/gate1-checklist.md) | Gate 1: PRD 评审（需求完整性、商业合理性、可行性、原型质量、版本管理 + 模块 PRD 质量） | 27 + F1-F8 |
| [gate2-checklist.md](references/gate2-checklist.md) | Gate 2: 架构 + Issues 就绪门（含 Gate 2.5 Issues 质量评审） | 34 + 16 |
| [gate3-checklist.md](references/gate3-checklist.md) | Gate 3: 上线评审（功能完成度、测试覆盖、部署就绪、文档合规、可追溯性） | 23 |

## 使用方式

`gate_review` Agent 根据评审门类型读取对应参考文件，按清单逐项评审并输出 ✅/⚠️/❌ 判定。
