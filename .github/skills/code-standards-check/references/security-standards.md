# 安全规范检查项

基于 OWASP Top 10 (2021) 整理的代码级安全检查项。

## SEC01 - 注入攻击防护

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| SEC01-01 | SQL 使用参数化查询 | 🔴 MUST | 禁止字符串拼接 SQL |
| SEC01-02 | ORM/Query Builder 优先 | 🟡 SHOULD | Prisma / SQLAlchemy / Drizzle |
| SEC01-03 | 用户输入不直接拼入命令 | 🔴 MUST | 禁止 `exec(userInput)` |
| SEC01-04 | 模板引擎自动转义开启 | 🔴 MUST | Jinja2 `autoescape=True` |
| SEC01-05 | 正则表达式防 ReDoS | 🟡 SHOULD | 避免灾难性回溯 |

## SEC02 - 认证与授权

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| SEC02-01 | 密码使用 bcrypt/argon2 哈希 | 🔴 MUST | 禁止 MD5/SHA 存明文哈希 |
| SEC02-02 | JWT 设置合理过期时间 | 🔴 MUST | access token ≤ 15min |
| SEC02-03 | API 端点有权限校验 | 🔴 MUST | 中间件/装饰器统一鉴权 |
| SEC02-04 | 权限校验在服务端 | 🔴 MUST | 不依赖客户端 |
| SEC02-05 | 会话管理安全 | 🔴 MUST | HttpOnly, Secure, SameSite |

## SEC03 - 敏感数据保护

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| SEC03-01 | 密钥通过环境变量注入 | 🔴 MUST | 禁止硬编码密钥 |
| SEC03-02 | .env 在 .gitignore 中 | 🔴 MUST | 不提交到版本控制 |
| SEC03-03 | 日志中敏感信息脱敏 | 🔴 MUST | 密码、token、身份证号等 |
| SEC03-04 | API 响应不泄露内部信息 | 🟡 SHOULD | 错误信息不含堆栈/SQL |
| SEC03-05 | 使用 HTTPS / TLS | 🔴 MUST | 传输层加密 |
| SEC03-06 | 加密使用标准库 | 🔴 MUST | 禁止自研加密算法 |

## SEC04 - XSS 防护

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| SEC04-01 | 用户输入 HTML 转义输出 | 🔴 MUST | `&lt;` `&gt;` `&amp;` |
| SEC04-02 | React 避免 dangerouslySetInnerHTML | 🔴 MUST | 必须使用时先消毒 |
| SEC04-03 | CSP 头部配置 | 🟡 SHOULD | Content-Security-Policy |
| SEC04-04 | URL 参数不直接渲染到页面 | 🔴 MUST | 先校验/转义 |

## SEC05 - CSRF / SSRF 防护

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| SEC05-01 | 状态变更请求验证 CSRF Token | 🔴 MUST | POST/PUT/DELETE |
| SEC05-02 | 服务端请求校验目标 URL | 🔴 MUST | 白名单/禁止内网地址 |
| SEC05-03 | 禁止用户控制服务端请求地址 | 🔴 MUST | 防 SSRF |

## SEC06 - 依赖安全

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| SEC06-01 | 定期检查依赖漏洞 | 🟡 SHOULD | `npm audit` / `pip-audit` / Dependabot |
| SEC06-02 | 锁定依赖版本 | 🟡 SHOULD | lock 文件纳入版本控制 |
| SEC06-03 | 最小化依赖范围 | 🟡 SHOULD | 不引入不必要的包 |
| SEC06-04 | 验证依赖包来源 | 🟡 SHOULD | 防供应链攻击 |

## SEC07 - 日志与监控

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| SEC07-01 | 记录认证事件 | 🟡 SHOULD | 登录成功/失败/登出 |
| SEC07-02 | 记录授权失败 | 🟡 SHOULD | 越权访问尝试 |
| SEC07-03 | 日志不含敏感信息 | 🔴 MUST | 密码、token 等 |
| SEC07-04 | 日志防篡改 | 🟡 SHOULD | 集中存储/只追加 |
