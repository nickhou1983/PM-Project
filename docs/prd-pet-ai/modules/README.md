# 宠物AI一体化 App — 模块需求文档索引

> 本目录包含按模块拆分的独立 PRD 文档。主 PRD 文档位于上级目录。

## 模块列表

| # | 模块标识 | 模块名称 | 功能点数 | 最高优先级 | Module PRD | 模块架构 |
|---|----------|----------|----------|------------|------------|----------|
| 1 | `user-auth` | 用户认证 | 5 | P0 | [prd-user-auth.md](prd-user-auth.md) | 待生成 |
| 2 | `pet-profile` | 宠物档案 | 5 | P0 | [prd-pet-profile.md](prd-pet-profile.md) | 待生成 |
| 3 | `pet-location` | 场景发现 | 5 | P0 | [prd-pet-location.md](prd-pet-location.md) | [待生成](../architecture-pet-ai-pet-location.md) |
| 4 | `ai-diagnosis` | AI 初诊 | 5 | P0 | [prd-ai-diagnosis.md](prd-ai-diagnosis.md) | 待生成 |
| 5 | `health-recommendation` | 保健品推荐 | 4 | P0 | [prd-health-recommendation.md](prd-health-recommendation.md) | 待生成 |
| 6 | `ecommerce` | 电商购物 | 6 | P0 | [prd-ecommerce.md](prd-ecommerce.md) | 待生成 |

## 文档关系

- **主 PRD**: [../prd-pet-ai.md](../prd-pet-ai.md)
- **架构文档**: [../architecture-pet-ai.md](../architecture-pet-ai.md)（待生成）
- **场景发现模块架构**: [../architecture-pet-ai-pet-location.md](../architecture-pet-ai-pet-location.md)（待生成）
- **原型图**: [../wireframes/index.html](../wireframes/index.html)

## 模块依赖关系

```
user-auth（基础层）
    ↓
pet-profile（基础数据层）
    ├── ai-diagnosis（健康能力层）
    └── pet-location（场景发现层）
            ↓
health-recommendation（转化桥接层）
            ↓
ecommerce（变现层）
```

## 下游消费

- `architect` Skill → 读取 Module PRD 生成主架构和模块级架构设计
- `requirement-to-issues` Skill → 读取 Module PRD 生成 Epic + Task Issues
- `gate_review` Agent → Gate 1 评审时检查主 PRD + 所有 Module PRD
