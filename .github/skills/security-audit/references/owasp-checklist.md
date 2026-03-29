# OWASP Top 10 (2021) 审查清单

## A01: Broken Access Control（访问控制失效）

- [ ] 默认拒绝策略（非公开资源必须认证）
- [ ] 每个 API 端点都有权限校验
- [ ] 不依赖客户端的访问控制
- [ ] CORS 配置限制为必要的来源
- [ ] 禁止通过修改 URL/参数/请求体绕过权限
- [ ] 目录浏览已禁用
- [ ] JWT/Session token 失效后无法继续使用
- [ ] 多租户场景下数据隔离正确
- [ ] 速率限制防止批量操作

## A02: Cryptographic Failures（加密失败）

- [ ] 敏感数据传输使用 TLS（禁止明文 HTTP）
- [ ] 密码使用 bcrypt/scrypt/Argon2 哈希（禁止 MD5/SHA1）
- [ ] 加密密钥不硬编码在源码中
- [ ] 使用安全的随机数生成器（`crypto.randomBytes` 而非 `Math.random`）
- [ ] 敏感数据（PII、信用卡）加密存储
- [ ] 不在日志中记录敏感信息
- [ ] 不在 URL 参数中传递敏感数据
- [ ] 证书校验未被禁用（`rejectUnauthorized: false`）

## A03: Injection（注入攻击）

- [ ] SQL 查询使用参数化/预处理语句
- [ ] ORM 查询未拼接用户输入
- [ ] HTML 输出使用模板引擎自动转义
- [ ] 命令行调用不拼接用户输入（使用参数数组）
- [ ] LDAP 查询参数化
- [ ] 正则表达式不包含用户输入（防止 ReDoS）
- [ ] GraphQL 查询有深度/复杂度限制
- [ ] 文件路径不直接拼接用户输入

## A04: Insecure Design（不安全设计）

- [ ] 认证流程有暴力破解防护（限速、锁定）
- [ ] 敏感操作有二次确认机制
- [ ] 业务逻辑有 abuse case 考量
- [ ] API 有请求大小限制
- [ ] 文件上传有类型和大小校验
- [ ] 不信任客户端计算结果（价格、权限等服务端校验）

## A05: Security Misconfiguration（安全配置错误）

- [ ] 生产环境禁用 debug 模式和详细错误信息
- [ ] 移除默认账号/密码
- [ ] 安全 Headers 配置：
  - `Strict-Transport-Security`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY` 或 CSP frame-ancestors
  - `Content-Security-Policy`
- [ ] 不必要的 HTTP methods 已禁用
- [ ] CORS 不使用 `*` 通配符
- [ ] 错误响应不暴露技术栈信息（框架版本、堆栈跟踪）
- [ ] 不必要的端口/服务未开放

## A06: Vulnerable and Outdated Components（易受攻击的组件）

- [ ] 依赖包无已知 CVE
- [ ] 依赖版本在维护周期内（未 EOL）
- [ ] 锁文件（`package-lock.json` / `poetry.lock`）已提交
- [ ] CI 中配置了自动依赖安全扫描
- [ ] 不使用被废弃的 API

## A07: Identification and Authentication Failures（身份认证失败）

- [ ] 密码策略合理（最小长度、复杂度）
- [ ] 登录失败响应一致（不泄露用户是否存在）
- [ ] Session/JWT 有合理的过期时间
- [ ] 注销时 token 需失效
- [ ] 多因素认证（MFA）可用于敏感操作
- [ ] Session ID 使用安全 cookie（`HttpOnly`, `Secure`, `SameSite`）
- [ ] 防止 Session Fixation 攻击

## A08: Software and Data Integrity Failures（数据完整性失败）

- [ ] CI/CD 流水线有完整性校验
- [ ] 不从不受信任的来源加载未经验证的代码/数据
- [ ] 反序列化时验证数据结构（不接受任意对象）
- [ ] 软件更新有签名校验
- [ ] 数据库迁移有回滚机制

## A09: Security Logging and Monitoring Failures（日志和监控失败）

- [ ] 登录成功/失败有日志记录
- [ ] 权限变更操作有审计日志
- [ ] 日志中不包含敏感数据（密码、token、PII）
- [ ] 日志有防篡改机制或集中存储
- [ ] 异常模式（如暴力破解）有告警
- [ ] 日志格式化为可查询结构（JSON 格式）

## A10: Server-Side Request Forgery（服务端请求伪造）

- [ ] 用户输入的 URL 有白名单校验
- [ ] 禁止请求内网地址（`127.0.0.1`、`169.254.x.x`、`10.x.x.x`）
- [ ] DNS 重绑定防护
- [ ] 不将原始 HTTP 响应直接返回给用户
- [ ] 出站请求有网络策略限制（K8s NetworkPolicy、防火墙）
