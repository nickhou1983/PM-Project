---
name: code-review
description: "代码审查（Code Review）专用 Skill。提供系统化的审查流程、三级严重度清单（🔴MUST/🟡SHOULD/🟢NIT）、按语言的审查要点、标准化评论模板。适用于：(1) 审查 PR 或代码变更，(2) 检查代码安全漏洞，(3) 评估代码质量和最佳实践，(4) 识别性能问题和重构机会，(5) 提供结构化的审查意见。"
---

# 代码审查 Skill

系统化的代码审查流程，输出结构化的审查报告。

## 审查流程

### 步骤 1：理解上下文

- 阅读 PR 标题、描述和关联 issue
- 了解变更的目的和预期行为
- 查看整体改动范围（文件数、行数）

### 步骤 2：分级审查

按 [审查规范](references/review-conventions.md) 中的清单逐项检查：

1. **🔴 阻断项（MUST）** — 安全漏洞、正确性问题、数据风险
2. **🟡 重点关注（SHOULD）** — 设计结构、类型、性能、测试
3. **🟢 建议改进（NIT）** — 命名、风格、文档

对于不同语言/框架，参考规范中的「按语言/框架的审查要点」章节。

### 步骤 3：输出审查报告

使用以下结构化格式输出：

```markdown
## Code Review Report

**Status**: ✅ APPROVED | 🔄 NEEDS_REVISION | ❌ REJECTED

### Summary
<!-- 1-2 句总结 -->

### Issues Found

#### 🔴 Must Fix
- **[文件:行号]** [问题描述] → [修复建议]

#### 🟡 Should Fix
- **[文件:行号]** [问题描述] → [修复建议]

#### 🟢 Nice to Have
- **[文件:行号]** [建议描述]

### Strengths
- [做得好的地方]

### Recommendations
- [改进建议]
```

### 步骤 4：提交审查（可选）

若需通过 GitHub MCP 提交审查：

```text
# 创建待提交审查
mcp_github_pull_request_review_write:
  method: create
  owner: <repo-owner>
  repo: <repo-name>
  pullNumber: <pr-number>

# 添加行级评论
mcp_github_add_comment_to_pending_review:
  owner: <repo-owner>
  repo: <repo-name>
  pullNumber: <pr-number>
  path: <file-path>
  line: <line-number>
  body: "[MUST] 问题描述\n建议修改为：..."

# 提交审查
mcp_github_pull_request_review_write:
  method: submit_pending
  owner: <repo-owner>
  repo: <repo-name>
  pullNumber: <pr-number>
  event: REQUEST_CHANGES  # APPROVE | REQUEST_CHANGES | COMMENT
  body: "审查总结"
```

## 评论格式

所有审查评论使用前缀标签，详见 [审查规范](references/review-conventions.md)：

- `[MUST]` — 阻断，必须修复
- `[SHOULD]` — 建议，强烈建议修复
- `[NIT]` — 微小建议
- `[QUESTION]` — 疑问
- `[PRAISE]` — 表扬好的实践

## 审查决策

| 条件 | 结果 |
| ---- | ---- |
| 无 🔴，无 🟡 | ✅ APPROVED |
| 无 🔴，有 🟡 | 🔄 NEEDS_REVISION（或酌情 APPROVED + 备注） |
| 有 🔴 | 🔄 NEEDS_REVISION |
| 方案根本问题 | ❌ REJECTED |

## 参考文件

- [审查规范](references/review-conventions.md)：完整审查清单、评论模板、语言专项要点、审查结果定义
