# TypeScript / JavaScript 规范检查项

## TS01 - 类型系统

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| TS01-01 | 启用 strict 模式 | 🔴 MUST | tsconfig.json `"strict": true` |
| TS01-02 | 禁止使用 `any` | 🔴 MUST | 用 `unknown` + 类型守卫替代 |
| TS01-03 | 优先 `as const` 替代 enum | 🟡 SHOULD | 更好的类型推断和 tree-shaking |
| TS01-04 | interface 定义对象结构 | 🟢 NIT | type 用于联合/工具类型 |
| TS01-05 | 泛型参数有意义命名 | 🟢 NIT | `TUser` 优于 `T`（除非上下文清晰） |
| TS01-06 | 优先类型守卫而非类型断言 | 🟡 SHOULD | `isUser(x)` 优于 `x as User` |
| TS01-07 | 避免非空断言 `!` | 🟡 SHOULD | 使用可选链 `?.` 或条件检查 |

## TS02 - 异步处理

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| TS02-01 | async/await 替代 .then() 链 | 🟡 SHOULD | 提高可读性 |
| TS02-02 | 并发用 Promise.all/allSettled | 🟡 SHOULD | 避免串行 await |
| TS02-03 | 禁止循环内 await | 🔴 MUST | 使用 Promise.all 并行化 |
| TS02-04 | 长请求使用 AbortController | 🟡 SHOULD | 超时和取消控制 |
| TS02-05 | Promise 不能被忽略 | 🔴 MUST | 必须 await 或显式标记 void |

## TS03 - React 组件 (若适用)

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| TS03-01 | 使用函数组件 + Hooks | 🟡 SHOULD | 不使用 class 组件 |
| TS03-02 | Props 使用 interface + JSDoc | 🟡 SHOULD | 明确组件契约 |
| TS03-03 | 组件文件 ≤ 200 行 | 🟡 SHOULD | 超过需拆分 |
| TS03-04 | useEffect 依赖数组完整 | 🔴 MUST | 遗漏会导致 Bug |
| TS03-05 | 自定义 Hook 以 use 开头 | 🟡 SHOULD | React 约定 |
| TS03-06 | 避免内联对象/函数作为 Props | 🟡 SHOULD | 导致不必要的重渲染 |
| TS03-07 | key 使用稳定唯一值 | 🔴 MUST | 禁止用数组索引 |

## TS04 - Vue 组件 (若适用)

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| TS04-01 | 使用 `<script setup>` 语法 | 🟡 SHOULD | Vue 3 推荐 |
| TS04-02 | Props 使用 defineProps + TypeScript | 🟡 SHOULD | 类型安全 |
| TS04-03 | 组件名多词 PascalCase | 🟡 SHOULD | 避免与 HTML 元素冲突 |
| TS04-04 | v-for 必须有 :key | 🔴 MUST | 使用唯一稳定值 |
| TS04-05 | v-if 和 v-for 不同时使用 | 🟡 SHOULD | 先计算属性过滤 |

## TS05 - 测试规范

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| TS05-01 | 测试文件与源码同名 | 🟢 NIT | `user.ts` → `user.test.ts` |
| TS05-02 | 测试描述使用自然语言 | 🟢 NIT | `it('should return user by id')` |
| TS05-03 | 每个测试只断言一个行为 | 🟡 SHOULD | 单一职责 |
| TS05-04 | 使用 describe 分组 | 🟢 NIT | 按功能/场景分组 |
| TS05-05 | mock 在测试间隔离 | 🔴 MUST | beforeEach/afterEach 清理 |
