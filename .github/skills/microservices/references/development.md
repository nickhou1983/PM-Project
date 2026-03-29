# 微服务开发规范

## 服务拆分原则

### 何时拆分

- 按业务能力边界拆分（每个服务对应一个业务域）
- 团队自治：一个服务由一个团队全权负责
- 独立部署：服务可独立发布而不影响其他服务
- 数据自治：每个服务拥有自己的数据存储

### 拆分粒度

| 信号 | 拆分建议 |
| ---- | -------- |
| 两个功能变更频率差异大 | 拆分 |
| 两个功能需要不同扩展策略 | 拆分 |
| 两个功能由不同团队维护 | 拆分 |
| 功能之间需频繁同步调用 | 不拆分 |
| 功能共享相同数据模型 | 不拆分 |

### 反模式

- ❌ 分布式单体：服务拆分了但必须一起部署
- ❌ 纳米服务：拆得太细，增加运维复杂度
- ❌ 共享数据库：多个服务直接访问同一数据库表
- ❌ 同步链路过长：A → B → C → D 同步调用链 > 3 层

## 服务间通信

### 同步通信（REST / gRPC）

**REST API 规范**：

```text
GET    /api/v1/users          # 列出资源
GET    /api/v1/users/:id      # 获取单个资源
POST   /api/v1/users          # 创建资源
PUT    /api/v1/users/:id      # 全量更新
PATCH  /api/v1/users/:id      # 部分更新
DELETE /api/v1/users/:id      # 删除资源
```

- URL 使用 kebab-case 复数名词
- 版本通过 URL 前缀管理（`/api/v1/`）
- 统一响应格式（见后端规范中的 ApiResponse）
- 错误码参考 HTTP 标准：400 参数错误、401 未认证、403 无权限、404 未找到、409 冲突、500 服务错误

**gRPC 规范**：

- Proto 文件按服务组织，统一存放在 `proto/` 目录
- 使用 `google.api.http` 注解暴露 REST 网关
- 流式 RPC 用于大数据量或实时推送场景
- 超时和重试策略在客户端配置

### 异步通信（事件驱动）

- 使用消息队列（Kafka / RabbitMQ / NATS）解耦服务
- 事件命名：`<domain>.<entity>.<action>`（如 `order.payment.completed`）
- 事件 schema 使用 JSON Schema 或 Avro 定义
- 保证至少一次投递（at-least-once），消费者实现幂等

```typescript
// 事件结构
interface DomainEvent<T> {
  eventId: string;          // 全局唯一 ID（UUID）
  eventType: string;        // 如 "order.created"
  timestamp: string;        // ISO 8601
  source: string;           // 发送服务名
  data: T;                  // 业务负载
  metadata: {
    correlationId: string;  // 请求链路 ID
    version: number;        // schema 版本
  };
}
```

### 通信选择矩阵

| 场景 | 推荐方式 | 原因 |
| ---- | -------- | ---- |
| 实时查询，需立即返回 | REST / gRPC | 同步调用，低延迟 |
| 通知其他服务数据变更 | 事件 | 解耦，不需等待响应 |
| 跨服务数据聚合 | API 网关 / BFF | 避免客户端多次调用 |
| 批量数据处理 | 消息队列 | 异步削峰 |
| 高性能低延迟 RPC | gRPC | 二进制协议，HTTP/2 |

## 数据管理

### Database per Service

- 每个服务独占数据库（或独立 Schema）
- 禁止跨服务直接访问数据库
- 数据同步通过事件或 API 完成

### Saga 模式（分布式事务）

对于跨服务事务，使用 Saga 编排：

```text
创建订单 Saga：
  1. Order Service: 创建订单（PENDING）
  2. Payment Service: 扣款
     ✅ 成功 → 3
     ❌ 失败 → 补偿: 取消订单
  3. Inventory Service: 扣减库存
     ✅ 成功 → 4
     ❌ 失败 → 补偿: 退款 → 取消订单
  4. Order Service: 确认订单（CONFIRMED）
```

- 每个步骤都有对应的补偿操作
- 使用编排器模式（Orchestrator）管理流程
- 记录 Saga 状态便于故障恢复

### CQRS（命令查询分离）

适合读写比例悬殊的场景：

- 写模型：领域驱动，强一致性
- 读模型：为查询优化的视图/缓存
- 通过事件同步写模型到读模型

## 服务治理

### 服务注册与发现

- 使用 Consul / Eureka / Kubernetes DNS
- 健康检查端点：`GET /health` 返回 200
- 就绪检查端点：`GET /ready`（DB 和依赖就绪时返回 200）

### 断路器模式

```typescript
// 断路器状态机
// CLOSED → (失败率达阈值) → OPEN → (超时) → HALF_OPEN → (探测成功) → CLOSED
//                                                      → (探测失败) → OPEN

interface CircuitBreakerConfig {
  failureThreshold: number;   // 触发熔断的失败率（如 50%）
  resetTimeout: number;       // 熔断恢复等待时间（如 30s）
  halfOpenRequests: number;   // 半开状态允许的探测请求数
}
```

### 重试与超时

- 所有外部调用设置超时（建议 ≤5s）
- 重试使用指数退避 + 抖动（jitter）
- 最大重试次数 ≤3
- 幂等操作才可重试（GET 安全，POST 需幂等键）

### 限流

- API 网关层统一限流
- 单服务使用令牌桶 / 漏桶算法
- 返回 429 Too Many Requests + `Retry-After` 头
- 关键 API 配置独立的限流配额

## 可观测性

### 三大支柱

| 支柱 | 工具 | 用途 |
| ---- | ---- | ---- |
| 日志（Logs） | ELK / Loki | 事件记录和问题排查 |
| 指标（Metrics） | Prometheus + Grafana | 性能监控和告警 |
| 追踪（Traces） | Jaeger / Zipkin / OpenTelemetry | 请求链路追踪 |

### 日志规范

- 结构化 JSON 日志
- 必须包含：`timestamp`、`level`、`service`、`traceId`、`message`
- 日志级别：ERROR（需人工处理）、WARN（需关注）、INFO（关键操作）、DEBUG（开发调试）
- 敏感信息脱敏

### 指标规范

RED 方法（面向服务）：

- **Rate**：请求速率（QPS）
- **Errors**：错误率
- **Duration**：请求延迟（P50/P95/P99）

USE 方法（面向资源）：

- **Utilization**：资源使用率
- **Saturation**：资源饱和度
- **Errors**：资源错误

### 分布式追踪

- 所有服务集成 OpenTelemetry SDK
- 通过 `traceparent` HTTP Header 传递上下文
- 关键操作添加 Span 和属性
- 采样率：生产环境建议 1%-10%

## API 网关

### 职责

- 路由转发
- 认证鉴权（JWT 验证）
- 限流熔断
- 请求/响应转换
- API 聚合（BFF 模式）
- 日志和监控

### 推荐方案

| 场景 | 推荐 |
| ---- | ---- |
| Kubernetes 环境 | Ingress + Envoy / Istio |
| 轻量级 | Kong / APISIX |
| 云原生 | AWS API Gateway / Azure API Management |
| Node.js 生态 | Express Gateway / 自建 BFF |
