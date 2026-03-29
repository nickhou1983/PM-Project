---
name: microservices
description: "微服务开发与部署技能。涵盖微服务架构设计、服务拆分、通信模式、数据管理、服务治理、可观测性，以及容器化、Kubernetes部署、CI/CD流水线、部署策略、配置管理和安全规范。触发条件：(1) 设计或开发微服务架构，(2) 服务拆分和通信模式选择，(3) 容器化和K8s部署，(4) CI/CD流水线设计，(5) 微服务治理与可观测性方案。"
---

# 微服务开发与部署 Skill

## 参考文件

| 文件 | 用途 |
| ---- | ---- |
| `references/development.md` | 微服务开发规范：服务拆分、通信模式、数据管理、治理、可观测性 |
| `references/deployment.md` | 微服务部署规范：容器化、K8s、CI/CD、部署策略、配置管理、安全 |

## 工作流

### 微服务架构设计

当用户需要设计或拆分微服务时：

1. **加载参考文件** — 读取 `references/development.md`
2. **分析需求** — 确认业务领域边界，识别核心域 / 支撑域 / 通用域
3. **拆分建议** — 按业务能力拆分，遵循单一职责，每个服务独立数据库
4. **通信选型** — 根据场景选择 REST / gRPC / 事件驱动，参考选型矩阵
5. **治理方案** — 配置熔断、重试、限流策略
6. **可观测性** — 设计 Metrics（RED/USE）、分布式链路追踪、结构化日志

### 微服务部署方案

当用户需要部署微服务时：

1. **加载参考文件** — 读取 `references/deployment.md`
2. **容器化** — 编写多阶段 Dockerfile，最小化镜像，非 root 运行
3. **K8s 编排** — 配置 Deployment / Service / HPA / NetworkPolicy
4. **CI/CD 设计** — 设计 Lint → Test → Build → Push → Deploy → Verify 流水线
5. **部署策略** — 根据场景选择 Rolling Update / Blue-Green / Canary
6. **配置与安全** — 环境变量注入，Secret 管理，mTLS 服务间认证

### 全栈微服务咨询

当用户咨询微服务相关问题时：

1. **加载所有参考文件** — 读取 `development.md` + `deployment.md`
2. **定位问题领域** — 判断属于开发还是部署范畴
3. **提供针对性建议** — 结合参考规范给出具体方案和代码示例
4. **最佳实践** — 提醒相关的注意事项和常见陷阱

## 快速参考

### 微服务设计原则

- 按业务能力拆分，避免按技术层拆分
- 每个服务有独立的数据存储（Database per Service）
- 服务间通过 API / 事件通信，禁止共享数据库
- 接口版本化（URL 路径版本 `/v1/`）

### 通信模式速查

| 场景 | 推荐模式 | 协议 |
| ---- | -------- | ---- |
| 同步 CRUD | REST | HTTP/JSON |
| 高性能内部调用 | gRPC | HTTP/2+Protobuf |
| 异步解耦 | 事件驱动 | Kafka/RabbitMQ |
| 实时推送 | WebSocket | WS |

### 部署核心清单

- [ ] Dockerfile 多阶段构建 + 非 root 用户
- [ ] K8s Deployment 配置 resources / probes / strategy
- [ ] CI/CD 流水线包含 lint / test / build / deploy / verify
- [ ] 生产环境使用 Canary 或 Blue-Green 部署
- [ ] 配置通过环境变量注入，密钥使用 Secret Manager
- [ ] 网络策略限制服务间通信范围
