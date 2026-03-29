# Pull Request 规范

## PR 标题规范

使用 Conventional Commits 格式：

```text
<type>(<scope>): <简要描述>
```

### 类型（type）

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(auth): add OAuth2 login` |
| `fix` | 修复 Bug | `fix(cart): resolve race condition` |
| `docs` | 文档更新 | `docs(api): update endpoint docs` |
| `style` | 代码格式（不影响功能） | `style: fix eslint warnings` |
| `refactor` | 重构（不新增功能或修复 Bug） | `refactor(api): extract middleware` |
| `perf` | 性能优化 | `perf(query): add database index` |
| `test` | 测试相关 | `test(user): add service unit tests` |
| `build` | 构建/依赖相关 | `build: upgrade webpack to v5` |
| `ci` | CI/CD 配置 | `ci: add staging deploy workflow` |
| `chore` | 杂项（不修改源码或测试） | `chore: update .gitignore` |

### 标题要求

- 英文首字母小写
- 不加句号
- 祈使语气（"add feature" 而非 "added feature"）
- 不超过 72 字符

## PR 描述模板

```markdown
## What

<!-- 简要描述此 PR 做了什么 -->

## Why

<!-- 为什么需要这个变更？关联哪个 issue？ -->

Closes #<issue-number>

## How

<!-- 实现方式的简要说明 -->

## Changes

<!-- 主要变更列表 -->

- [ ] Change 1
- [ ] Change 2

## Screenshots (if applicable)

<!-- UI 变更请附截图或录屏 -->

## Testing

<!-- 如何测试这些变更？ -->

- [ ] 单元测试已添加/更新
- [ ] 集成测试已通过
- [ ] 本地手动测试已完成

## Checklist

- [ ] 代码遵循项目编码规范
- [ ] 自测通过
- [ ] 无 lint errors / warnings
- [ ] 文档已更新（如需要）
- [ ] 无敏感信息（密钥、token 等）
- [ ] 数据库变更已有迁移脚本（如需要）
```

## 分支命名规范

格式：`<type>/<ticket-id>-<简要描述>`

示例：

- `feature/AUTH-123-oauth-login`
- `fix/CART-456-quantity-race-condition`
- `refactor/API-789-extract-middleware`
- `docs/update-api-endpoints`
- `hotfix/critical-data-loss`
- `release/v2.1.0`

### 分支来源

- `feature/*` / `fix/*` / `refactor/*`：从 `develop` 或 `main` 创建
- `hotfix/*`：从 `main` 创建
- `release/*`：从 `develop` 创建

## Commit 规范

### 格式

```text
<type>(<scope>): <subject>

<body>

<footer>
```

### 要求

- subject 不超过 50 字符
- body 每行不超过 72 字符
- body 说明 **为什么** 而非 **怎么做**
- footer 放 breaking changes 和关联 issue

### 示例

```text
feat(auth): add JWT refresh token mechanism

Implement refresh token rotation to improve session security.
Access tokens now expire in 15 minutes with auto-refresh.

Closes #234
BREAKING CHANGE: /api/auth/login response format changed
```

### Commit 原子性

- 每个 commit 应是一个逻辑完整的变更
- 可独立编译通过
- 不要将不相关的变更混在同一个 commit

## 代码审查（Code Review）规范

### 审查者选择原则

- **必选审查者**：代码改动涉及模块的 Owner/Maintainer
- **推荐审查者**：
  - 熟悉相关业务逻辑的同事
  - 最近修改过相同文件的贡献者
  - 团队中的技术 Lead（对于架构变更）

### 审查者数量

- 常规 PR：至少 1 位审查者
- 核心模块 / 架构变更：至少 2 位审查者
- Hotfix：至少 1 位审查者（可加急）

### 审查要求

- 审查者应在 **24 小时内** 完成首次审查
- 审查评论使用标准前缀：
  - `[MUST]`：阻断项，必须修改
  - `[SHOULD]`：建议项，强烈建议修改
  - `[NIT]`：微小建议，可选
  - `[QUESTION]`：疑问，需要解释

### PR 合并条件

- [ ] 所有 CI 检查通过
- [ ] 所有必选审查者已 Approve
- [ ] 无未解决的 `[MUST]` 评论
- [ ] 与目标分支无冲突
- [ ] commit 历史干净（必要时 squash）

### 合并策略

| 场景 | 策略 | 说明 |
|------|------|------|
| 功能分支 → develop/main | Squash & Merge | 保持主线整洁 |
| release → main | Merge Commit | 保留完整历史 |
| hotfix → main | Merge Commit | 可追踪修复历史 |
| 个人 fork → upstream | Squash & Merge | 简化贡献历史 |

## PR 大小指南

| 大小 | 变更行数 | 建议 |
|------|----------|------|
| XS | < 50 行 | ✅ 理想大小 |
| S | 50-200 行 | ✅ 推荐 |
| M | 200-500 行 | ⚠️ 可接受，考虑拆分 |
| L | 500-1000 行 | ⚠️ 建议拆分 |
| XL | > 1000 行 | ❌ 必须拆分（自动生成代码除外） |

拆分策略：

- 按功能模块拆分
- 重构和功能变更分开 PR
- 先提 infra/基础设施 PR，再提业务 PR
- 数据库迁移单独 PR
