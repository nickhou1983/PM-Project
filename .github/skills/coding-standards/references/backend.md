# 后端编码规范

## Node.js / TypeScript 后端

### 项目结构

推荐分层架构：

```
src/
├── controllers/     # 路由处理，请求/响应转换
├── services/        # 业务逻辑
├── repositories/    # 数据访问
├── models/          # 数据模型/实体
├── middlewares/      # 中间件
├── utils/           # 工具函数
├── config/          # 配置管理
├── types/           # 全局类型定义
└── index.ts         # 入口
```

### 依赖注入

- 使用构造函数注入或工厂函数，避免硬编码 `new`
- 服务层不直接依赖具体实现，依赖接口

```typescript
// ✅ 依赖注入
interface IUserRepository {
  findById(id: string): Promise<User | null>;
}

class UserService {
  constructor(private readonly userRepo: IUserRepository) {}

  async getUser(id: string): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundError('User', id);
    return user;
  }
}
```

### API 设计

- RESTful：资源名用复数（`/users`、`/orders`）
- HTTP 方法语义正确：GET 读取、POST 创建、PUT 全量更新、PATCH 部分更新、DELETE 删除
- 统一响应格式：

```typescript
interface ApiResponse<T> {
  code: number;       // 业务状态码
  data: T;            // 响应数据
  message: string;    // 描述信息
  timestamp: number;  // 时间戳
}

// 分页响应
interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

- 使用 Zod / Joi 校验请求参数
- API 版本管理通过 URL 前缀（`/api/v1/`）

### 数据库操作

- 使用 ORM/Query Builder（Prisma、Drizzle、TypeORM）
- 始终使用参数化查询，禁止拼接 SQL
- 事务操作用 `transaction` 包裹
- 数据库迁移受版本控制
- 连接池配置合理，避免连接泄漏

```typescript
// ✅ Prisma 事务
const result = await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.inventory.update({
    where: { productId: order.productId },
    data: { stock: { decrement: order.quantity } },
  });
  return order;
});
```

### 日志规范

- 使用结构化日志（Pino、Winston）
- 日志级别：`error` > `warn` > `info` > `debug`
- 生产环境禁止 `console.log`
- 请求链路追踪：每个请求分配唯一 `requestId`
- 敏感信息脱敏（密码、token、身份证号）

```typescript
logger.info({
  requestId: ctx.requestId,
  action: 'user.login',
  userId: user.id,
  ip: ctx.ip,
  duration: Date.now() - startTime,
});
```

## Python 后端

### 项目结构（FastAPI）

```
src/
├── api/
│   ├── routes/      # 路由定义
│   └── deps.py      # 依赖注入
├── core/
│   ├── config.py    # 配置
│   └── security.py  # 认证授权
├── models/          # SQLAlchemy/Pydantic 模型
├── services/        # 业务逻辑
├── repositories/    # 数据访问
└── main.py          # 入口
```

### Python 特定规范

- 始终使用 type hints
- Pydantic 模型校验入参和出参
- 使用 `async def` 处理 IO 密集操作
- 虚拟环境管理（venv / Poetry / uv）
- 代码格式化：Ruff（替代 Black + isort + flake8）

```python
from pydantic import BaseModel, Field

class CreateUserRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    age: int = Field(..., ge=0, le=150)

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Go 后端

### Go 特定规范

- 遵循 Effective Go 标准
- 错误处理：返回 `error` 而非 panic
- 接口定义在消费方而非实现方
- 使用 `context.Context` 传递请求级别数据
- 并发使用 `errgroup` 管理 goroutine 生命周期

```go
// ✅ 接口定义在消费方
type UserFinder interface {
    FindByID(ctx context.Context, id string) (*User, error)
}

type UserService struct {
    finder UserFinder
}

func (s *UserService) GetUser(ctx context.Context, id string) (*User, error) {
    user, err := s.finder.FindByID(ctx, id)
    if err != nil {
        return nil, fmt.Errorf("get user %s: %w", id, err)
    }
    return user, nil
}
```

## 安全规范（全栈通用）

- 所有用户输入必须校验和消毒
- 使用参数化查询防止 SQL 注入
- 使用 `helmet`（Node.js）或等效库设置安全 HTTP 头
- CORS 严格配置允许的源
- 密码使用 bcrypt/argon2 哈希，最少 12 字符
- JWT 设置合理过期时间，使用 refresh token 机制
- 敏感配置使用环境变量，禁止提交到代码仓库
- 依赖定期更新，使用 `npm audit` / `pip audit` / `govulncheck`

## 测试规范

### 测试金字塔

- 单元测试（70%）：覆盖业务逻辑和工具函数
- 集成测试（20%）：覆盖 API 端点和数据库交互
- E2E 测试（10%）：覆盖关键用户流程

### 测试编写原则

- AAA 模式：Arrange → Act → Assert
- 测试名清晰描述行为：`should return 404 when user not found`
- 每个测试独立，无顺序依赖
- Mock 外部服务，不 Mock 内部实现
- 测试数据用 Factory/Fixture 模式

```typescript
describe('UserService', () => {
  it('should throw NotFoundError when user does not exist', async () => {
    // Arrange
    const repo = createMockUserRepo({ findById: async () => null });
    const service = new UserService(repo);

    // Act & Assert
    await expect(service.getUser('non-existent'))
      .rejects.toThrow(NotFoundError);
  });
});
```
