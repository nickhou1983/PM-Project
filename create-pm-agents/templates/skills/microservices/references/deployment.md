# 微服务部署规范

## 容器化

### Dockerfile 规范

```dockerfile
# ✅ 多阶段构建，最小化镜像体积
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
# 非 root 用户运行
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/index.js"]
```

### Dockerfile 要点

- 多阶段构建：构建阶段和运行阶段分离
- 基础镜像使用 Alpine/Distroless 最小化攻击面
- 非 root 用户运行（`USER appuser`）
- 固定基础镜像版本（`node:20-alpine` 而非 `node:latest`）
- `.dockerignore` 排除 `node_modules`、`.git`、测试文件
- HEALTHCHECK 指令用于容器健康检测
- 不包含敏感信息（密钥、凭证通过环境变量注入）

### Docker Compose（本地开发）

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/mydb
      - REDIS_URL=redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 10s
      retries: 3

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 5s
      retries: 5

  cache:
    image: redis:7-alpine

volumes:
  pgdata:
```

## Kubernetes 部署

### Deployment 模板

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  labels:
    app: user-service
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
        version: v1
    spec:
      containers:
        - name: user-service
          image: registry.example.com/user-service:1.0.0
          ports:
            - containerPort: 3000
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: user-service-secrets
                  key: database-url
```

### K8s 部署要点

- 设置 `resources.requests` 和 `resources.limits`
- `livenessProbe`：存活检测，失败重启容器
- `readinessProbe`：就绪检测，失败从 Service 摘除
- 使用 `RollingUpdate` 策略保证零停机
- 敏感配置放 `Secret`，普通配置放 `ConfigMap`
- 使用固定镜像 tag（`v1.2.3`）而非 `latest`
- 反亲和性：同服务 Pod 分布在不同节点

### Service 暴露

```yaml
apiVersion: v1
kind: Service
metadata:
  name: user-service
spec:
  selector:
    app: user-service
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP    # 内部访问用 ClusterIP，外部用 Ingress
```

### HPA 自动扩缩

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

## CI/CD 流水线

### 标准流水线阶段

```text
┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐
│ Lint │ → │ Test │ → │Build │ → │ Push │ → │Deploy│ → │Verify│
└──────┘   └──────┘   └──────┘   └──────┘   └──────┘   └──────┘
```

1. **Lint**：代码风格检查（ESLint / Ruff / golangci-lint）
2. **Test**：单元测试 + 集成测试，覆盖率 ≥ 80%
3. **Build**：构建 Docker 镜像，多阶段构建
4. **Push**：推送镜像到注册表（带 commit SHA tag）
5. **Deploy**：部署到目标环境
6. **Verify**：冒烟测试 / 健康检查验证

### 环境策略

| 环境 | 触发条件 | 部署方式 |
| ---- | -------- | -------- |
| Dev | Push to feature branch | 自动部署 |
| Staging | Merge to develop | 自动部署 |
| Production | Tag release / Manual | 审批后部署 |

### 部署策略

| 策略 | 适用场景 | 回滚速度 |
| ---- | -------- | -------- |
| Rolling Update | 默认策略，无状态服务 | 中 |
| Blue/Green | 需要快速回滚 | 快（切换流量） |
| Canary | 大流量场景，需灰度验证 | 快（调整权重） |

### Canary 部署步骤

```text
1. 部署新版本（5% 流量）
2. 监控 5-10 分钟：错误率、延迟、业务指标
3. 逐步放量：5% → 25% → 50% → 100%
4. 任何一步异常 → 立即回滚到旧版本
```

## 配置管理

### 12-Factor App 原则

- 配置通过环境变量注入，不硬编码
- 不同环境使用不同配置实例，代码相同
- 密钥使用 Secret Manager（Vault / AWS Secrets Manager / K8s Secrets）

### 配置层次

```text
优先级（高 → 低）：
1. 环境变量
2. 配置中心（如 Consul KV / Nacos）
3. 配置文件（config.{env}.yaml）
4. 代码默认值
```

### 配置校验

在服务启动时校验所有必需配置：

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
});

// 启动时校验，缺少配置立即失败
export const config = envSchema.parse(process.env);
```

## 安全

### 服务间认证

- 内部服务使用 mTLS（Istio / Linkerd 自动管理）
- 或使用服务账号 + JWT 认证
- 禁止在内网跳过认证

### 网络策略

- 默认拒绝所有入站流量（deny-all）
- 按需开放服务间通信
- 生产环境数据库仅允许对应服务访问

```yaml
# K8s NetworkPolicy 示例
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: user-service-policy
spec:
  podSelector:
    matchLabels:
      app: user-service
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: api-gateway
      ports:
        - port: 3000
```

### 镜像安全

- 使用 Trivy / Snyk 扫描镜像漏洞
- 基础镜像定期更新
- 签名镜像（cosign / Notary）
- 仅允许从受信任的注册表拉取镜像
