# 前端编码规范

## TypeScript 规范

### 类型系统

- 始终启用 `strict` 模式
- 优先使用 `type` 定义联合类型和工具类型，`interface` 定义对象结构和可扩展契约
- 禁止使用 `any`，用 `unknown` + 类型守卫替代
- 使用 `as const` 替代枚举
- 泛型参数用有意义的名称（`TUser` 而非 `T`，除非上下文足够清晰）

```typescript
// ✅ 好的
type Status = 'idle' | 'loading' | 'success' | 'error';

interface ApiResponse<TData> {
  data: TData;
  status: Status;
  message?: string;
}

const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
} as const;
type Role = typeof ROLES[keyof typeof ROLES];

// ❌ 差的
enum Role { Admin, User, Guest }
function parse(data: any) { ... }
```

### 异步处理

- 使用 `async/await` 替代 `.then()` 链
- 并发请求使用 `Promise.all` / `Promise.allSettled`
- 带超时的请求使用 `AbortController`
- 避免在循环中 `await`

```typescript
// ✅ 并发请求
const [users, orders] = await Promise.all([
  fetchUsers(),
  fetchOrders(),
]);

// ✅ 带超时
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);
try {
  const res = await fetch(url, { signal: controller.signal });
} finally {
  clearTimeout(timeout);
}
```

## React 规范

### 组件设计

- 使用函数组件 + Hooks
- 组件 Props 使用 `interface` 定义，加 JSDoc
- 拆分容器组件（数据逻辑）和展示组件（纯 UI）
- 单个组件文件不超过 200 行
- 使用 `React.memo` 仅在有测量依据时

```typescript
/** 用户头像组件 props */
interface AvatarProps {
  /** 用户头像 URL */
  src: string;
  /** 用户显示名称，用于 alt 文本 */
  name: string;
  /** 头像尺寸 */
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ src, name, size = 'md' }: AvatarProps) {
  return <img src={src} alt={name} className={`avatar-${size}`} />;
}
```

### Hooks 规范

- 自定义 Hook 以 `use` 开头
- 保持 Hook 职责单一
- 避免在 Hook 中耦合 UI 逻辑
- `useEffect` 依赖数组必须完整

```typescript
// ✅ 单一职责的自定义 Hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

### 状态管理

- 局部状态：`useState` / `useReducer`
- 跨组件共享：Context + `useReducer` 或 Zustand
- 服务端状态：TanStack Query / SWR
- 全局状态最小化；能用 props 传递就不提升到全局
- 避免在 Context 中放置频繁变化的值

### 样式方案

- 优先 CSS Modules 或 Tailwind CSS
- 避免内联样式（除动态计算值）
- 响应式使用 mobile-first
- CSS 变量管理主题/设计 token
- 类名使用 BEM 命名法（若非 CSS Modules/Tailwind）

## Next.js 规范

### App Router

- 默认使用 Server Components，仅在需要交互时使用 `'use client'`
- 数据获取在 Server Component 中完成
- 路由分组用 `(group)` 文件夹
- 使用 `loading.tsx` 和 `error.tsx` 处理加载和错误状态
- metadata 使用 `generateMetadata` 动态生成

### 性能优化

- 图片使用 `next/image`，字体使用 `next/font`
- 动态导入用 `next/dynamic` 延迟加载非关键组件
- API 响应合理设置 Cache-Control
- 使用 `Suspense` 边界实现流式渲染

## Vue 规范（如适用）

### Composition API

- 使用 `<script setup>` 语法
- Composables 以 `use` 开头
- Ref 和 Reactive 选择：简单值用 `ref`，复杂对象用 `reactive`
- Props 用 `defineProps` 配合 TypeScript 类型

```vue
<script setup lang="ts">
interface Props {
  title: string;
  count?: number;
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
});

const emit = defineEmits<{
  update: [value: number];
}>();
</script>
```
