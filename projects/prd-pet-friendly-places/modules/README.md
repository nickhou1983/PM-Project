# 宠物友好场所 — 模块导航索引

> **产品 PRD**：[prd-pet-friendly-places.md](../prd-pet-friendly-places.md)
> **版本**：v1.0.0
> **最后更新**：2026-04-17

---

## 模块列表

| # | 模块名称 | 标识 (slug) | 优先级 | 功能点数 | 文档 |
|---|---------|------------|--------|---------|------|
| 1 | 场所发现与搜索 | `place-discovery` | P0 | 4 | [prd-place-discovery.md](prd-place-discovery.md) |
| 2 | 场所详情与评价 | `place-detail` | P0 | 4 | [prd-place-detail.md](prd-place-detail.md) |
| 3 | 用户上报与 UGC | `user-contribution` | P1 | 3 | [prd-user-contribution.md](prd-user-contribution.md) |
| 4 | 用户中心 | `user-center` | P1 / P2 | 3 | [prd-user-center.md](prd-user-center.md) |

**合计**：4 个模块，14 个功能点

---

## 模块依赖关系

```text
place-discovery (P0)
  └──▶ place-detail (P0)        ← 地图/列表点击后跳转
          ├──▶ user-center (P1)  ← 评价/收藏需登录
          └──◀▶ user-contribution (P1) ← 纠错入口 / 审核更新
                    └──▶ user-center (P1)  ← 上报需登录
```

---

## 里程碑对应

| 里程碑 | 时间 | 涉及模块 |
|--------|------|---------|
| M1 — MVP 核心功能 | 2026-01 ~ 2026-03 | `place-discovery`、`place-detail` |
| M2 — UGC 与社区 | 2026-04 ~ 2026-05 | `user-contribution`、`user-center`（注册登录+收藏） |
| M3 — 个性化推荐 | 2026-06 ~ 2026-08 | `user-center`（宠物档案）、推荐算法 |

---

## 原型页面索引

| 页面 | 所属模块 | 文件 |
|------|---------|------|
| 地图首页 | place-discovery | [wireframes/place-discovery-map.html](../wireframes/place-discovery-map.html) |
| 搜索结果 | place-discovery | [wireframes/place-discovery-search.html](../wireframes/place-discovery-search.html) |
| 场所详情 | place-detail | [wireframes/place-detail-info.html](../wireframes/place-detail-info.html) |
| 上报场所 | user-contribution | [wireframes/user-contribution-submit.html](../wireframes/user-contribution-submit.html) |
| 个人中心 | user-center | [wireframes/user-center-profile.html](../wireframes/user-center-profile.html) |
