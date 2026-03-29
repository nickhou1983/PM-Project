# Go 规范检查项

## GO01 - 代码风格

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| GO01-01 | 使用 gofmt/goimports 格式化 | 🔴 MUST | 统一代码格式 |
| GO01-02 | 导出名 PascalCase，非导出 camelCase | 🟡 SHOULD | Go 标准命名 |
| GO01-03 | 包名小写单词，无下划线 | 🟡 SHOULD | `userservice` 而非 `user_service` |
| GO01-04 | 缩略词全大写 | 🟡 SHOULD | `HTTPClient` / `userID` |
| GO01-05 | 接口名以 -er 结尾 | 🟢 NIT | `Reader`、`Writer`、`Closer` |

## GO02 - 错误处理

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| GO02-01 | 检查所有返回的 error | 🔴 MUST | 不能忽略 `_, err := ...` 中的 err |
| GO02-02 | 使用 `fmt.Errorf("...: %w", err)` 包装 | 🟡 SHOULD | 保留错误链 |
| GO02-03 | 自定义错误类型实现 error 接口 | 🟡 SHOULD | 便于类型断言 |
| GO02-04 | 使用 errors.Is / errors.As | 🟡 SHOULD | 而非 `==` 直接比较 |
| GO02-05 | panic 仅用于不可恢复的错误 | 🔴 MUST | 不用于业务逻辑 |

## GO03 - 并发

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| GO03-01 | goroutine 有退出机制 | 🔴 MUST | 使用 context / done channel |
| GO03-02 | channel 有明确的关闭方 | 🔴 MUST | 发送者关闭 |
| GO03-03 | 共享变量使用 sync.Mutex | 🔴 MUST | 或使用 channel 通信 |
| GO03-04 | 使用 errgroup 管理 goroutine 组 | 🟡 SHOULD | 错误传播和等待 |
| GO03-05 | context 作为第一个参数传递 | 🟡 SHOULD | `func DoWork(ctx context.Context, ...)` |

## GO04 - 接口与设计

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| GO04-01 | 接口在使用方定义 | 🟡 SHOULD | 而非实现方 |
| GO04-02 | 接口保持小巧 | 🟡 SHOULD | 1-3 个方法 |
| GO04-03 | 接受 interface，返回 struct | 🟡 SHOULD | 依赖倒置 |
| GO04-04 | 使用 table-driven tests | 🟡 SHOULD | 便于添加测试用例 |

## GO05 - 安全

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| GO05-01 | SQL 使用预编译语句 | 🔴 MUST | `db.Query("... WHERE id = ?", id)` |
| GO05-02 | HTTP 客户端配置超时 | 🔴 MUST | `&http.Client{Timeout: 10*time.Second}` |
| GO05-03 | 使用 crypto/rand 而非 math/rand | 🔴 MUST | 安全敏感场景 |
| GO05-04 | 输入边界检查 | 🟡 SHOULD | 数组越界、整数溢出 |
