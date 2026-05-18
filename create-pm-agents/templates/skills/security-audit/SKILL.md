---
name: "security-audit"
description: "OWASP Top 10 安全审查 Skill。对代码进行系统化安全审计，基于 OWASP Top 10 (2021) 逐项检查，输出漏洞详情和修复建议。触发条件：(1) 安全审查/Security Audit，(2) OWASP 检查，(3) 漏洞扫描，(4) 安全评估，(5) 安全代码审查，(6) 检查安全问题。"
---

# OWASP Top 10 安全审查

基于 **OWASP Top 10 (2021)** 对代码进行系统化安全审计。逐项检查 10 大安全风险类别，输出漏洞详情、严重等级和修复建议。

## 严重等级定义

| 等级 | 标记 | 含义 | 处置要求 |
|------|------|------|---------|
| 🔴 Critical | `[CRITICAL]` | 可被远程利用，直接影响数据安全或系统可用性 | 立即修复，阻断发布 |
| 🟠 High | `[HIGH]` | 需要特定条件利用，影响较大 | 发布前必须修复 |
| 🟡 Medium | `[MEDIUM]` | 有风险但利用成本较高 | 限期修复（建议 1-2 周） |
| 🟢 Low | `[LOW]` | 最佳实践建议，安全加固 | 建议修复 |

## 约束

1. **不修改代码** — 仅输出审计发现和修复建议
2. **不编造漏洞** — 只报告有代码证据的实际问题
3. **不泄露敏感信息** — 报告中不包含明文密钥/密码/token
4. **完整扫描** — 不跳过任何 OWASP 类别，即使该类别无发现也标注 ✅
5. **上下文判断** — 结合业务场景判断严重性，不机械套用规则
6. **提供修复代码** — 每个漏洞必须给出具体的修复代码示例

## OWASP Top 10 (2021) 检查基线

### A01: Broken Access Control（失效的访问控制）

检查项：
- 越权访问：水平越权（访问其他用户数据）、垂直越权（普通用户执行管理操作）
- 默认拒绝：未经认证的请求是否默认拒绝
- CORS 配置：`Access-Control-Allow-Origin` 是否过于宽泛（`*`）
- 目录遍历：路径参数是否可被注入 `../`
- API 权限：RESTful 端点是否有权限中间件保护
- IDOR：ID 参数是否可被篡改访问其他资源

### A02: Cryptographic Failures（加密失败）

检查项：
- 明文传输：敏感数据是否通过 HTTPS 传输
- 弱加密算法：是否使用 MD5/SHA1 做密码哈希（应使用 bcrypt/scrypt/Argon2）
- 密钥管理：密钥/密码是否硬编码在源码中
- 数据分类：敏感字段（密码、信用卡、PII）是否有适当保护
- 随机数生成：是否使用密码学安全的随机数生成器

### A03: Injection（注入）

检查项：
- SQL 注入：是否使用参数化查询/Prepared Statement
- NoSQL 注入：MongoDB 查询是否有输入验证
- XSS：用户输入是否经过转义后再输出到 HTML
- 命令注入：是否使用 `exec()`/`eval()`/`system()` 拼接用户输入
- LDAP/XML/模板注入：是否有对应的输入净化

### A04: Insecure Design（不安全设计）

检查项：
- 威胁建模：是否考虑了核心业务流的滥用场景
- 速率限制：登录/注册/API 是否有频率限制
- 业务逻辑缺陷：是否有金额篡改、流程跳过等风险
- 最小权限：服务/组件是否只有必要的权限

### A05: Security Misconfiguration（安全配置错误）

检查项：
- 默认凭据：是否存在默认账号密码
- 错误信息泄露：生产环境是否暴露堆栈跟踪或调试信息
- HTTP Header：是否设置 `X-Content-Type-Options`、`X-Frame-Options`、`Strict-Transport-Security`
- CSP：是否配置 Content-Security-Policy
- 不必要的功能：是否开启了调试模式、管理后台暴露

### A06: Vulnerable and Outdated Components（脆弱和过时组件）

检查项：
- 依赖版本：`package.json`/`requirements.txt`/`pom.xml`/`go.mod` 中是否有已知漏洞依赖
- 锁文件：是否存在 `package-lock.json`/`yarn.lock`/`poetry.lock`（防止供应链攻击）
- 废弃 API：是否使用已废弃的框架/库 API

### A07: Identification and Authentication Failures（认证失败）

检查项：
- 密码策略：是否有最小长度、复杂度要求
- 暴力破解防护：登录失败是否有锁定/延迟机制
- 会话管理：Session/JWT 是否安全配置（过期时间、HttpOnly、Secure、SameSite）
- 多因素认证：高敏感操作是否支持 MFA
- 密码存储：是否使用 bcrypt/scrypt/Argon2 + salt

### A08: Software and Data Integrity Failures（软件和数据完整性失败）

检查项：
- CI/CD 安全：构建管道是否有完整性验证
- 依赖完整性：是否验证下载的依赖签名/哈希
- 反序列化：是否接受不可信来源的序列化数据（`pickle.loads`、`ObjectInputStream`、`JSON.parse` 后未验证）

### A09: Security Logging and Monitoring Failures（安全日志和监控失败）

检查项：
- 审计日志：登录、权限变更、数据修改是否有日志
- 日志内容：日志中是否泄露敏感数据（密码、token、PII）
- 日志完整性：日志是否可被篡改
- 告警机制：关键安全事件是否触发告警

### A10: Server-Side Request Forgery (SSRF)

检查项：
- URL 验证：用户提供的 URL 是否验证协议和目标地址
- 内网访问：是否阻止访问 `127.0.0.1`、`169.254.169.254`（云元数据）、内网 IP 段
- 重定向：是否验证重定向目标地址

## 工作流

### 步骤 1：确定审计范围

1. 确认审计模式：
   - **全量扫描**：整个项目代码库
   - **增量扫描**：PR diff 或指定 commit 范围
   - **定向扫描**：用户指定的文件/目录/模块
2. 标记高风险区域（认证模块、支付流程、数据访问层、API 网关）

### 步骤 2：依赖扫描

1. 读取依赖声明文件（`package.json`、`requirements.txt`、`pom.xml`、`go.mod`、`Gemfile`、`*.csproj`）
2. 检查锁文件是否存在且更新
3. 标记已知漏洞依赖（基于版本号和已知 CVE）

### 步骤 3：静态代码分析

按 OWASP Top 10 逐项检查：

1. 遍历所有目标文件
2. 对每个文件，按 A01–A10 顺序扫描
3. 记录每个发现：

```markdown
### [CRITICAL] A03: SQL 注入 — {简述}

**文件**：`{file_path}`
**行号**：L{start}-L{end}
**OWASP**：A03 Injection

**漏洞描述**：
{详细描述漏洞原理和影响}

**问题代码**：
```{language}
// 存在问题的代码
```

**修复建议**：
```{language}
// 修复后的代码
```

**影响评估**：{可能的攻击场景和业务影响}
```

### 步骤 4：配置审查

1. **环境变量**：检查 `.env` 文件是否在 `.gitignore` 中，密钥是否硬编码
2. **CORS 配置**：检查 `Access-Control-Allow-Origin` 设置
3. **CSP 配置**：检查 Content-Security-Policy 设置
4. **TLS/SSL**：检查 HTTPS 强制和证书配置
5. **Docker/K8s**：检查容器安全配置（非 root 运行、端口暴露、Secret 管理）

### 步骤 5：生成安全审计报告

输出格式：

```markdown
# 🔒 安全审计报告

> **审计范围**：{项目名/PR/模块}
> **审计日期**：{当前日期}
> **审计基线**：OWASP Top 10 (2021)

---

## 审计摘要

| 等级 | 数量 |
|------|------|
| 🔴 Critical | {count} |
| 🟠 High | {count} |
| 🟡 Medium | {count} |
| 🟢 Low | {count} |

**合规状态**：{✅ 通过 / ⚠️ 有条件通过 / ❌ 未通过}

---

## OWASP Top 10 检查矩阵

| # | 类别 | 状态 | 发现数 | 最高等级 |
|---|------|------|--------|---------|
| A01 | Broken Access Control | ✅/⚠️/❌ | {N} | {等级} |
| A02 | Cryptographic Failures | ✅/⚠️/❌ | {N} | {等级} |
| A03 | Injection | ✅/⚠️/❌ | {N} | {等级} |
| A04 | Insecure Design | ✅/⚠️/❌ | {N} | {等级} |
| A05 | Security Misconfiguration | ✅/⚠️/❌ | {N} | {等级} |
| A06 | Vulnerable Components | ✅/⚠️/❌ | {N} | {等级} |
| A07 | Auth Failures | ✅/⚠️/❌ | {N} | {等级} |
| A08 | Integrity Failures | ✅/⚠️/❌ | {N} | {等级} |
| A09 | Logging Failures | ✅/⚠️/❌ | {N} | {等级} |
| A10 | SSRF | ✅/⚠️/❌ | {N} | {等级} |

---

## 漏洞详情

{按严重等级排列的漏洞列表，Critical 在前}

---

## 依赖安全

| 依赖 | 当前版本 | 安全版本 | CVE | 等级 |
|------|---------|---------|-----|------|
| {pkg} | {ver} | {safe_ver} | {CVE-ID} | {等级} |

---

## 修复优先级

1. 🔴 **立即修复**：{Critical 项列表}
2. 🟠 **发布前修复**：{High 项列表}
3. 🟡 **限期修复**：{Medium 项列表}
4. 🟢 **建议改进**：{Low 项列表}

---

## 合规建议

{整体安全改进建议，如引入 SAST/DAST 工具、安全培训等}
```

## 语言特定检查矩阵

### JavaScript / TypeScript

| OWASP | 关键检查点 |
|-------|-----------|
| A01 | 中间件权限检查（`express`/`koa`/`nest` 的 Guard/Middleware）、路由保护 |
| A02 | `crypto.createHash('md5')` → 改用 `bcrypt`、JWT secret 强度 |
| A03 | `eval()`、`innerHTML`、`dangerouslySetInnerHTML`、`${}` SQL 拼接、`child_process.exec()` |
| A05 | `helmet` 中间件、`cors()` 配置、生产环境 `NODE_ENV=production` |
| A07 | `express-session` 配置（`secure`/`httpOnly`/`sameSite`）、JWT 过期设置 |
| A10 | `axios`/`fetch` 发起的请求是否验证目标地址 |

### Python

| OWASP | 关键检查点 |
|-------|-----------|
| A01 | Django `@permission_required`、Flask `@login_required`、对象级权限 |
| A02 | `hashlib.md5()` → 改用 `bcrypt`/`passlib`、`Fernet` 密钥管理 |
| A03 | `exec()`/`eval()`、`os.system()`、`subprocess.shell=True`、f-string SQL、`pickle.loads()` |
| A05 | Django `DEBUG=False`、`ALLOWED_HOSTS`、`SECURE_*` 设置 |
| A07 | Django `SESSION_COOKIE_SECURE`、`CSRF_COOKIE_HTTPONLY` |
| A10 | `requests.get(user_url)` 未验证目标、`urllib.request.urlopen()` |

### Java

| OWASP | 关键检查点 |
|-------|-----------|
| A01 | Spring Security `@PreAuthorize`/`@Secured`、URL 级别权限配置 |
| A02 | `MessageDigest.getInstance("MD5")` → 改用 `BCryptPasswordEncoder` |
| A03 | `Statement` → `PreparedStatement`、`Runtime.exec()` 参数拼接、XSS 输出编码 |
| A05 | Spring Boot Actuator 端点保护、`server.error.include-stacktrace=never` |
| A07 | Spring Session 配置、`@EnableWebSecurity` |
| A08 | `ObjectInputStream.readObject()` 反序列化安全 |

### Go

| OWASP | 关键检查点 |
|-------|-----------|
| A01 | 中间件权限校验、`context` 传递用户身份 |
| A02 | `crypto/md5` → 改用 `golang.org/x/crypto/bcrypt`、密钥管理 |
| A03 | `database/sql` 参数化查询、`html/template` vs `text/template`、`os/exec` 参数注入 |
| A05 | `net/http` TLS 配置、CORS 中间件、生产环境调试关闭 |
| A07 | JWT 库选择（`golang-jwt`）、Session cookie 配置 |
| A10 | `http.Get(userURL)` 内网地址校验、DNS rebinding |

## 快速命令

- "安全审查" / "Security Audit" → 完整 5 步审计流程
- "检查 OWASP {A01-A10}" → 仅检查指定的 OWASP 类别
- "依赖安全扫描" → 仅执行步骤 2（依赖扫描）
- "快速安全检查" → 仅输出 Critical 和 High 级别发现
