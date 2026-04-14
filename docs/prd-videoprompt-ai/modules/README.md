# 视频提示词工坊 — 模块导航索引

> **所属产品**：[视频提示词工坊 — 主 PRD](../prd-videoprompt-ai.md)
> **版本**：v1.0.0
> **最后更新**：2026-04-13

---

## 模块列表

| 模块标识 | 模块名称 | 功能点数 | 最高优先级 | Module PRD | 架构文档 | 状态 |
|---------|---------|---------|------------|------------|---------|------|
| `prompt-builder` | Prompt 构建器 | 5 | P0 | [prd-prompt-builder.md](prd-prompt-builder.md) | 待生成 | 草稿 |
| `template-library` | 模板库 | 5 | P0 | [prd-template-library.md](prd-template-library.md) | 待生成 | 草稿 |
| `model-adapter` | 多模型适配 | 4 | P0 | [prd-model-adapter.md](prd-model-adapter.md) | 待生成 | 草稿 |
| `history-share` | 历史与分享 | 4 | P0 | [prd-history-share.md](prd-history-share.md) | 待生成 | 草稿 |

---

## 原型图导航

| 页面 | 原型文件 | 关联模块 |
|------|---------|---------|
| 原型导航首页 | [../wireframes/index.html](../wireframes/index.html) | — |
| Prompt 构建器 | [../wireframes/prompt-builder-editor.html](../wireframes/prompt-builder-editor.html) | prompt-builder + model-adapter |
| 模板库 | [../wireframes/template-library-browse.html](../wireframes/template-library-browse.html) | template-library |
| 历史记录 | [../wireframes/history-share-list.html](../wireframes/history-share-list.html) | history-share |

---

## 下游消费关系

```
architect Agent
  → 架构文档 architecture-videoprompt-ai.md（主）
  → 模块级架构文档 architecture-videoprompt-ai-{module_en_slug}.md

gate_review Agent（Gate 1 PRD 评审）
  → 输入：主 PRD + 4 个 Module PRD + 原型图

requirement-to-issues Skill
  → 按模块拆分为 GitHub Issues（Epic + Task）
```

---

## 模块间依赖关系

```
model-adapter ──提供 Schema──→ prompt-builder
template-library ──应用模板──→ prompt-builder
prompt-builder ──保存历史──→ history-share
template-library ←──收藏模板──→ history-share
```
