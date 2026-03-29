---
name: security-audit
description: "安全专项审查 Skill。基于 OWASP Top 10 (2021) 提供系统化的安全审查清单，覆盖注入攻击、认证失败、敏感数据泄露、XXE、访问控制、安全配置、XSS、反序列化、依赖漏洞、日志监控不足等。触发条件：(1) 安全审查/安全审计，(2) OWASP 合规检查，(3) 漏洞扫描，(4) 安全加固建议，(5) 依赖安全检查。"
---

# 安全专项审查 Skill

基于 OWASP Top 10 (2021) 的系统化安全审查流程，输出结构化安全报告。

## 参考文件

| 文件 | 用途 |
| ---- | ---- |
| [owasp-checklist.md](./references/owasp-checklist.md) | OWASP Top 10 完整审查清单 |

## 审查流程

### 步骤 1：确定审查范围

1. **识别技术栈** — 语言、框架、数据库、部署环境
2. **标记敏感区域** — 认证/鉴权、支付、用户数据处理、文件上传、API 端点
3. **确认审查深度** — 快速扫描（仅 CRITICAL）还是全面审计（CRITICAL + HIGH + MEDIUM）

### 步骤 2：按 OWASP Top 10 逐项检查

加载 [owasp-checklist.md](./references/owasp-checklist.md)，按照以下10个类别逐一检查代码：

| # | OWASP 类别 | 严重度基线 |
|---|-----------|-----------|
| A01 | Broken Access Control（访问控制失效） | CRITICAL |
| A02 | Cryptographic Failures（加密失败） | CRITICAL |
| A03 | Injection（注入攻击） | CRITICAL |
| A04 | Insecure Design（不安全设计） | HIGH |
| A05 | Security Misconfiguration（安全配置错误） | HIGH |
| A06 | Vulnerable Components（易受攻击的组件） | HIGH |
| A07 | Authentication Failures（身份认证失败） | CRITICAL |
| A08 | Data Integrity Failures（数据完整性失败） | HIGH |
| A09 | Logging & Monitoring Failures（日志和监控失败） | MEDIUM |
| A10 | SSRF（服务端请求伪造） | HIGH |

### 步骤 3：依赖安全检查

1. 检查 `package.json` / `requirements.txt` / `go.mod` 中的依赖版本
2. 识别已知有 CVE 的依赖包
3. 建议运行：
   - Node.js: `npm audit` / `npx audit-ci`
   - Python: `pip-audit` / `safety check`
   - Go: `govulncheck`

### 步骤 4：输出安全报告

```markdown
## Security Audit Report

**审查范围**: <files/modules>
**技术栈**: <language/framework>
**审查深度**: Quick Scan | Full Audit

### 🔴 CRITICAL（必须立即修复）
- **[A0X][file:line]** 问题描述 → 修复建议

### 🟠 HIGH（应尽快修复）
- **[A0X][file:line]** 问题描述 → 修复建议

### 🟡 MEDIUM（建议修复）
- **[A0X][file:line]** 问题描述 → 修复建议

### 依赖安全
- 已知 CVE 的依赖列表
- 建议升级的包和目标版本

### 安全加固建议
- 推荐的安全 Headers
- 推荐的安全配置
- 缺少的安全基础设施

### Summary
- 发现 X 个 CRITICAL / Y 个 HIGH / Z 个 MEDIUM
- 总体安全评估：一句话
```
