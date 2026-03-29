---
name: github-publish
description: "将代码发布到 GitHub 平台的完整工作流。包含代码 Commit、创建分支、推送代码、生成 Pull Request、指定代码审查者、管理审查流程。通过 GitHub MCP Server 与 GitHub 平台交互。触发条件：(1) 提交代码到 GitHub，(2) 创建 Pull Request，(3) 需要指定 PR 审查者，(4) 发布/上线代码，(5) 合并代码到主分支，(6) 代码提交和 PR 流程相关操作。"
---

# GitHub 发布工作流

通过 GitHub MCP 完成从代码提交到 PR 合并的完整发布流程。

## MCP 工具映射

本 Skill 使用以下 MCP 工具与 GitHub 交互：

| 操作 | MCP 工具 | 说明 |
| ---- | -------- | ---- |
| 获取当前用户 | `mcp_github_get_me` | 获取认证身份 |
| 创建分支 | `mcp_github_create_branch` | 从 base 分支创建 |
| 提交文件 | `mcp_github_create_or_update_file` / `mcp_github_push_files` | 单/多文件提交 |
| 创建 PR | `mcp_github_create_pull_request` | 创建 Pull Request |
| 搜索 PR 模板 | `mcp_github_get_file_contents` | 读取 `.github/PULL_REQUEST_TEMPLATE.md` |
| 请求审查 | `mcp_github_pull_request_review_write` | 指定审查者 |
| 合并 PR | `mcp_github_merge_pull_request` | 合并到目标分支 |
| 查看 PR 状态 | `mcp_github_pull_request_read` | 检查 CI 和审查状态 |
| 搜索 PR | `mcp_github_search_pull_requests` | 查找已有 PR |
| 列出分支 | `mcp_github_list_branches` | 查看现有分支 |

> 也可使用 `mcp_github2_*` 前缀的等效工具。

## 发布工作流

### 工作流总览

```text
1. 确认身份 → 2. 创建分支 → 3. 提交代码 → 4. 查找 PR 模板
→ 5. 创建 PR → 6. 指定审查者 → 7. 跟踪状态 → 8. 合并
```

### 步骤 1：确认身份与仓库

调用 `mcp_github_get_me` 确认当前认证用户身份。确认目标仓库的 owner 和 repo name。

### 步骤 2：创建功能分支

根据 [PR 规范](references/pr-conventions.md) 中的分支命名规范创建分支：

```text
mcp_github_create_branch:
  owner: <repo-owner>
  repo: <repo-name>
  branch: feature/<ticket-id>-<description>
  from_branch: main  (或 develop)
```

分支命名格式：`<type>/<ticket-id>-<description>`，type 取值见 PR 规范。

### 步骤 3：提交代码

**单文件提交**：

```text
mcp_github_create_or_update_file:
  owner: <repo-owner>
  repo: <repo-name>
  path: <file-path>
  content: <file-content>
  message: "feat(scope): add feature description"
  branch: <branch-name>
```

**多文件批量提交**：

```text
mcp_github_push_files:
  owner: <repo-owner>
  repo: <repo-name>
  branch: <branch-name>
  message: "feat(scope): add feature description"
  files: [{ path: "...", content: "..." }, ...]
```

Commit message 格式遵循 [PR 规范](references/pr-conventions.md) 中的 Commit 规范。

### 步骤 4：查找 PR 模板

在创建 PR 前，检查仓库是否有 PR 模板：

```text
mcp_github_get_file_contents:
  owner: <repo-owner>
  repo: <repo-name>
  path: .github/PULL_REQUEST_TEMPLATE.md
```

如果模板存在，用模板内容填充 PR 描述。如果不存在，使用 [PR 规范](references/pr-conventions.md) 中的描述模板。

### 步骤 5：创建 Pull Request

```text
mcp_github_create_pull_request:
  owner: <repo-owner>
  repo: <repo-name>
  title: "feat(scope): description"   # Conventional Commits 格式
  body: <按模板填写的 PR 描述>
  head: <feature-branch>
  base: main                           # 或 develop
```

PR 标题规范见 [PR 规范](references/pr-conventions.md)。

### 步骤 6：指定代码审查者

创建 PR 后请求代码审查：

```text
mcp_github_request_copilot_review:
  owner: <repo-owner>
  repo: <repo-name>
  pullNumber: <pr-number>
```

或使用 `mcp_github_pull_request_review_write` 指定特定审查者。

审查者选择原则见 [PR 规范](references/pr-conventions.md) 的代码审查规范章节。

### 步骤 7：跟踪 PR 状态

检查 CI 状态和审查进度：

```text
mcp_github_pull_request_read:
  owner: <repo-owner>
  repo: <repo-name>
  pullNumber: <pr-number>
```

关注：CI 检查是否通过、审查者是否已审批、是否有未解决的评论。

### 步骤 8：合并 PR

满足合并条件后执行合并：

```text
mcp_github_merge_pull_request:
  owner: <repo-owner>
  repo: <repo-name>
  pullNumber: <pr-number>
  merge_method: squash   # squash | merge | rebase
```

合并策略选择见 [PR 规范](references/pr-conventions.md) 的合并策略章节。

## 快速命令

### 一键发布（完整流程）

当用户说"发布代码"或"提交到 GitHub"时，按顺序执行步骤 1-6。

### 仅创建 PR

当用户说"创建 PR"时，假设代码已推送，执行步骤 4-6。

### 仅指定审查者

当用户说"添加审查者"时，执行步骤 6。

## 参考文件

- [PR 规范](references/pr-conventions.md)：PR 标题、描述模板、分支命名、Commit 规范、代码审查规范、合并策略
