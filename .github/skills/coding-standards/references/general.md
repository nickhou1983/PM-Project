# 通用编码规范

## 命名规范

### 文件命名
- 组件文件：PascalCase（`UserProfile.tsx`、`OrderList.vue`）
- 工具/模块文件：camelCase 或 kebab-case（`dateUtils.ts`、`api-client.ts`）
- 样式文件：与组件同名（`UserProfile.module.css`）
- 测试文件：`*.test.ts` 或 `*.spec.ts`
- 常量文件：UPPER_SNAKE_CASE 文件名可选，但内容中常量用 `UPPER_SNAKE_CASE`

### 变量与函数命名
- 变量/函数：camelCase（`getUserName`、`isLoading`）
- 类/接口/类型：PascalCase（`UserService`、`IUserRepository`）
- 常量：UPPER_SNAKE_CASE（`MAX_RETRY_COUNT`、`API_BASE_URL`）
- 布尔变量：`is`/`has`/`should`/`can` 前缀（`isVisible`、`hasPermission`）
- 事件处理：`handle` 或 `on` 前缀（`handleClick`、`onSubmit`）
- 私有成员：`_` 前缀（仅在无语言级私有支持时）

### 命名反模式（禁止）
- ❌ 单字母变量名（循环索引 `i/j/k` 除外）
- ❌ 缩写命名（`usr`、`btn`、`msg`），除非是广泛认可的缩写（`URL`、`API`、`ID`）
- ❌ 类型前缀匈牙利命名法（`strName`、`intCount`）
- ❌ 与语言关键字冲突的名称

## 代码结构

### 函数设计
- 单一职责：每个函数只做一件事
- 函数体不超过 50 行（不含注释和空行）
- 参数不超过 4 个，超过时使用对象参数
- 提前返回（early return）减少嵌套
- 纯函数优先，最小化副作用

```typescript
// ✅ 好的：提前返回，职责单一
function getDiscount(user: User): number {
  if (!user.isActive) return 0;
  if (user.isVIP) return 0.2;
  if (user.orderCount > 10) return 0.1;
  return 0.05;
}

// ❌ 差的：深层嵌套，职责不清
function getDiscount(user: User): number {
  let discount = 0;
  if (user.isActive) {
    if (user.isVIP) {
      discount = 0.2;
    } else {
      if (user.orderCount > 10) {
        discount = 0.1;
      } else {
        discount = 0.05;
      }
    }
  }
  return discount;
}
```

### 模块组织
- 每个模块/文件只导出一个主要功能（可伴随辅助类型导出）
- 导入顺序：外部依赖 → 内部模块 → 相对路径 → 类型导入
- 避免循环依赖
- barrel 文件（`index.ts`）仅用于公共 API 聚合

### 错误处理
- 使用具体的错误类型，避免通用 `Error`
- 在边界层（API层、UI层）统一处理错误
- 不要吞掉错误（catch 后不处理）
- 异步操作必须有错误处理
- 使用 Result/Either 模式处理可预期的失败

```typescript
// ✅ 自定义错误类型
class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

// ✅ Result 模式
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };
```

## 注释规范

### 何时写注释
- ✅ 解释「为什么」（业务原因、设计决策）
- ✅ 复杂算法的简要说明
- ✅ TODO/FIXME/HACK 标注（附 issue 链接）
- ✅ 公共 API 的 JSDoc/docstring
- ❌ 不要解释「是什么」（代码本身应该足够清晰）
- ❌ 不要注释掉代码并提交（用版本控制）

### 注释格式
```typescript
/**
 * 计算用户的折扣率。
 *
 * 折扣策略：VIP > 订单量 > 默认折扣，按优先级取最高折扣。
 * 参考：https://wiki.example.com/discount-policy
 *
 * @param user - 当前用户信息
 * @returns 折扣率（0-1 之间的小数）
 */
function getDiscount(user: User): number { ... }

// TODO(#123): 迁移到新的定价引擎后移除此逻辑
// HACK: 临时绕过第三方 API 的速率限制，见 #456
```

## Git 规范

### Commit Message
使用 Conventional Commits 格式：
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

类型：`feat` | `fix` | `docs` | `style` | `refactor` | `perf` | `test` | `build` | `ci` | `chore`

示例：
```
feat(auth): add OAuth2 login support
fix(cart): resolve race condition in quantity update
refactor(api): extract common request interceptor
```

### 分支命名
- feature/：`feature/user-auth`、`feature/JIRA-123-payment`
- bugfix/：`bugfix/login-redirect`
- hotfix/：`hotfix/critical-data-loss`
- release/：`release/v2.1.0`
