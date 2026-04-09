---
name: "code-review"
description: "代码审查规范 Skill。对代码进行系统化审查，按 MUST/SHOULD/NIT 三级分类输出审查意见，覆盖正确性、安全性、可维护性、性能、规范性五大维度。触发条件：(1) 代码审查/Code Review，(2) PR Review/Pull Request 审查，(3) 审查代码质量，(4) MUST/SHOULD/NIT 分级审查，(5) 代码走查，(6) 审查这个 PR。"
---

# 代码审查规范

对代码进行系统化审查，按 **MUST / SHOULD / NIT** 三级分类输出结构化审查意见。覆盖正确性、安全性、可维护性、性能、规范性五大维度。

## 外部 Skill 依赖

| Skill | 路径 | 何时加载 |
|-------|------|---------|
| `security-audit` | `.agents/skills/security-audit/SKILL.md` | 发现安全类 finding 需要深度分析时 |
| `coding-standards` | `.agents/skills/coding-standards/SKILL.md` | 需要语言特定编码规范参考时（若存在） |

## 严重等级定义

| 等级 | 标记 | 含义 | 合并影响 |
|------|------|------|---------|
| 🔴 MUST | `[MUST]` | 阻断合并，必须修复 | → `REQUEST_CHANGES` |
| 🟡 SHOULD | `[SHOULD]` | 强烈建议修复，不阻断 | → `COMMENT` |
| 🟢 NIT | `[NIT]` | 建议优化，可忽略 | → `COMMENT` |

### 等级判定标准

| 等级 | 适用场景 |
|------|---------|
| `[MUST]` | 逻辑错误导致功能异常、安全漏洞（注入/XSS/认证绕过）、数据丢失或损坏风险、并发竞态导致不一致、API 契约破坏（Breaking Change） |
| `[SHOULD]` | 性能问题（N+1 查询、内存泄漏、不必要渲染）、可维护性问题（高圈复杂度、深嵌套、重复逻辑）、缺少错误处理或日志、不符合项目最佳实践、缺少必要测试覆盖 |
| `[NIT]` | 命名不够清晰、注释缺失或过时、代码格式/排版、可用更简洁的写法、文档不完整 |

## 审查维度

### 1. 正确性（Correctness）

- 逻辑是否正确实现了需求（对照 Issue 验收标准）
- 边界条件是否覆盖（空值、零值、最大值、负数、空集合）
- 错误处理是否完整（异常捕获、错误传播、用户友好的错误信息）
- 并发安全（竞态条件、死锁风险、原子操作）
- 状态管理（状态一致性、状态泄漏、状态清理）

### 2. 安全性（Security）

- 输入验证与净化（SQL 注入、XSS、命令注入、路径遍历）
- 认证与授权（权限检查、越权风险、会话管理）
- 敏感数据处理（密钥硬编码、日志泄露、加密方式）
- 依赖安全（已知漏洞依赖、供应链风险）

> 发现安全类 finding 时，可加载 `security-audit` Skill 进行 OWASP Top 10 深度检查。

### 3. 可维护性（Maintainability）

- 命名清晰度（变量/函数/类名是否表达意图）
- 圈复杂度（单函数 > 10 标记 `[SHOULD]`，> 20 标记 `[MUST]`）
- 重复代码（DRY 原则，3+ 处相似逻辑应抽取）
- 模块耦合度（依赖方向、循环依赖、接口隔离）
- 单一职责（函数/类是否职责过多）

### 4. 性能（Performance）

- 数据库查询效率（N+1 查询、缺少索引、全表扫描）
- 内存使用（泄漏、不必要的大对象拷贝、缓存策略）
- 前端渲染（不必要的重渲染、大列表未虚拟化、bundle 体积）
- 算法复杂度（O(n²) 可优化为 O(n log n) 等）
- I/O 效率（串行可改并行、缺少批量操作、连接池配置）

### 5. 规范性（Standards）

- 编码风格一致性（与项目现有代码一致）
- API 设计一致性（RESTful 规范、错误响应格式、分页模式）
- 错误处理模式（与项目约定一致）
- 测试覆盖（新功能是否有对应测试、测试是否有效）
- 提交规范（commit message 格式、PR 描述完整度）

## 约束

1. **不修改代码** — 审查 Agent 仅输出审查意见，不直接修改源码
2. **不跳过文件** — PR diff 中的每个变更文件都必须审查
3. **每个 finding 必须包含**：严重等级 `[MUST/SHOULD/NIT]`、文件路径、行号（或行范围）、问题描述、修复建议
4. **不编造问题** — 只报告实际存在的问题，不为凑数量而虚构
5. **上下文感知** — 审查时考虑代码的业务上下文，不机械套用规则
6. **一致性** — 同类问题给出相同等级，不在文件间出现等级漂移

## 工作流

### 步骤 1：确定审查范围

1. 确认审查来源：
   - **PR 模式**：读取 PR diff，获取变更文件列表
   - **文件模式**：用户指定的文件或目录
   - **模块模式**：用户指定的模块（通过 `module:{slug}` 标签定位）
2. 统计变更规模：文件数、新增/删除行数
3. 标记重点关注区域：新文件、核心业务逻辑文件、安全敏感文件（认证/支付/权限）

### 步骤 2：检测技术栈

1. 识别语言和框架（读取 `package.json`、`pom.xml`、`go.mod`、`pyproject.toml`、`*.csproj` 等）
2. 识别已有 lint/format 配置（`.eslintrc`、`prettier`、`pylint`、`golangci-lint` 等）
3. 加载对应的审查规则集（若存在 `coding-standards` Skill 则引用）

### 步骤 3：逐文件审查

对每个变更文件，按 5 大维度逐项检查：

1. 阅读文件完整上下文（不仅看 diff，还要看周围代码）
2. 按维度顺序检查：正确性 → 安全性 → 可维护性 → 性能 → 规范性
3. 对每个发现的问题，记录为 finding：

```markdown
### [MUST] {问题简述}

**文件**：`{file_path}`
**行号**：L{start}-L{end}
**维度**：{正确性/安全性/可维护性/性能/规范性}

**问题**：{详细描述}

**建议**：
```{language}
// 建议的修复代码
```
```

### 步骤 4：跨文件分析

1. **模块耦合**：检查新增的模块间依赖是否合理
2. **API 一致性**：新增的 API 风格是否与已有 API 一致
3. **重复模式**：跨文件是否存在可抽取的公共逻辑
4. **依赖引入**：新增的依赖是否必要、版本是否安全

### 步骤 5：生成审查报告

输出格式：

```markdown
# 📝 代码审查报告

> **审查范围**：{PR #N / 文件列表 / 模块}
> **审查日期**：{当前日期}
> **变更规模**：{N} 文件，+{adds} / -{deletes} 行

---

## 审查摘要

| 等级 | 数量 | 关键问题 |
|------|------|---------|
| 🔴 MUST | {count} | {最重要的 1-2 项} |
| 🟡 SHOULD | {count} | {最重要的 1-2 项} |
| 🟢 NIT | {count} | — |

**审查建议**：{APPROVE / REQUEST_CHANGES / COMMENT}

---

## 审查详情

{按严重等级排列的 finding 列表，MUST 在前}

---

## 亮点

{代码中做得好的地方，1-3 项}
```

### 步骤 6：提交审查（可选）

如果用户需要将审查结果写入 GitHub PR：
- 建议调用 `pr_review_submit` Agent，传入 finding 列表和最终决策
- 决策映射：
  - 有 `[MUST]` → `REQUEST_CHANGES`
  - 无 `[MUST]` 且质量良好 → `APPROVE`
  - 其他 → `COMMENT`

## 语言特定检查清单

### JavaScript / TypeScript

| 维度 | 检查项 |
|------|--------|
| 正确性 | `===` vs `==`、`async/await` 错误处理、类型断言安全 |
| 安全性 | `eval()`、`innerHTML`、`dangerouslySetInnerHTML`、SQL 拼接、`new Function()` |
| 性能 | useEffect 依赖数组、useMemo/useCallback 合理性、bundle 拆分 |
| 规范性 | ESLint 规则遵循、TypeScript strictNullChecks |

### Python

| 维度 | 检查项 |
|------|--------|
| 正确性 | 可变默认参数、except 过于宽泛、生成器/迭代器正确使用 |
| 安全性 | `exec()`/`eval()`、`pickle.loads()` 不可信输入、SQL format string |
| 性能 | 列表推导 vs 循环、生成器 vs 列表、GIL 相关并发 |
| 规范性 | PEP 8、类型注解完整性、docstring 格式 |

### Java

| 维度 | 检查项 |
|------|--------|
| 正确性 | NPE 风险、equals/hashCode 一致性、资源泄漏（try-with-resources） |
| 安全性 | `PreparedStatement` vs 字符串拼接、反序列化安全、权限注解 |
| 性能 | Stream 滥用、String 拼接（StringBuilder）、连接池配置 |
| 规范性 | Lombok 使用规范、日志级别、异常处理层级 |

### Go

| 维度 | 检查项 |
|------|--------|
| 正确性 | error 未检查、goroutine 泄漏、channel 死锁、defer 顺序 |
| 安全性 | `sql.DB` 参数化查询、`html/template` vs `text/template`、TLS 配置 |
| 性能 | slice 预分配、sync.Pool 使用、context 传递 |
| 规范性 | golint/staticcheck 规则、error wrapping（`%w`）、interface 最小化 |

## 快速命令

- "审查这个 PR" → 完整 6 步审查流程
- "审查 {文件路径}" → 指定文件的单文件审查
- "只看安全问题" → 仅执行安全性维度审查
- "快速审查" → 仅输出 MUST 级别 finding
