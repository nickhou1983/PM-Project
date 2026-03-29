# 通用编码规范检查项

## G01 - 命名规范

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| G01-01 | 变量/函数使用 camelCase | 🟡 SHOULD | `getUserName` ✅ / `get_user_name` ❌ (JS/TS) |
| G01-02 | 类/接口/类型使用 PascalCase | 🟡 SHOULD | `UserService` ✅ / `userService` ❌ |
| G01-03 | 常量使用 UPPER_SNAKE_CASE | 🟡 SHOULD | `MAX_RETRY_COUNT` ✅ / `maxRetryCount` ❌ |
| G01-04 | 布尔变量使用 is/has/should/can 前缀 | 🟢 NIT | `isVisible` ✅ / `visible` ❌ |
| G01-05 | 禁止单字母变量名（循环 i/j/k 除外） | 🟡 SHOULD | `const t = getUser()` ❌ |
| G01-06 | 禁止无意义缩写 | 🟡 SHOULD | `usr`/`btn`/`msg` ❌（`URL`/`API`/`ID` 允许） |
| G01-07 | 事件处理函数使用 handle/on 前缀 | 🟢 NIT | `handleClick` / `onSubmit` |

## G02 - 函数设计

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| G02-01 | 函数体 ≤ 50 行 | 🟡 SHOULD | 不含注释和空行 |
| G02-02 | 参数 ≤ 4 个 | 🟡 SHOULD | 超过时使用对象参数 |
| G02-03 | 单一职责 | 🟡 SHOULD | 每个函数只做一件事 |
| G02-04 | 优先使用提前返回 | 🟢 NIT | 减少嵌套层级 |
| G02-05 | 嵌套层级 ≤ 3 | 🟡 SHOULD | 超过需重构 |
| G02-06 | 无未使用参数 | 🟡 SHOULD | 删除或使用 `_` 前缀标记 |

## G03 - 错误处理

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| G03-01 | 禁止空 catch 块 | 🔴 MUST | 必须处理或向上抛出 |
| G03-02 | 使用具体错误类型 | 🟡 SHOULD | 避免通用 `throw new Error()` |
| G03-03 | 异步操作必须有错误处理 | 🔴 MUST | await 需 try-catch 或 .catch() |
| G03-04 | 边界层统一错误处理 | 🟡 SHOULD | API/UI 层统一拦截 |
| G03-05 | 禁止吞掉错误 | 🔴 MUST | catch 后至少记录日志 |

## G04 - 注释与文档

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| G04-01 | 公共 API 有 JSDoc/docstring | 🟡 SHOULD | 导出函数/类需要文档 |
| G04-02 | 禁止注释掉的死代码 | 🟡 SHOULD | 用版本控制管理 |
| G04-03 | TODO/FIXME 附 issue 链接 | 🟢 NIT | `// TODO(#123): ...` |
| G04-04 | 注释解释"为什么"而非"是什么" | 🟢 NIT | 代码本身应足够清晰 |

## G05 - 模块与导入

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| G05-01 | 无循环依赖 | 🔴 MUST | A → B → A 禁止 |
| G05-02 | 导入顺序规范 | 🟢 NIT | 外部 → 内部 → 相对 → 类型 |
| G05-03 | 无未使用的导入 | 🟡 SHOULD | 清理未使用的 import |
| G05-04 | 避免 `import *` | 🟡 SHOULD | 使用具名导入 |

## G06 - Git 提交规范

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| G06-01 | Conventional Commits 格式 | 🟡 SHOULD | `feat:` / `fix:` / `refactor:` 等 |
| G06-02 | 提交信息不超过 72 字符 | 🟢 NIT | 首行简洁描述 |
| G06-03 | 禁止提交敏感信息 | 🔴 MUST | 密钥、密码、token 等 |
| G06-04 | 单次提交职责单一 | 🟡 SHOULD | 一个提交对应一个逻辑变更 |
