# Seedance Prompt Studio — 模块导航索引

> **所属产品**：[Seedance Prompt Studio — 产品需求文档（PRD）](../prd-seedance-prompt.md)
> **最后更新**：2026-04-12

---

## 模块一览

| 模块标识 | 中文名称 | 功能点数 | 最高优先级 | 状态 | Module PRD |
|----------|----------|----------|------------|------|------------|
| `prompt-optimizer` | 提示词优化引擎 | 4 | P0 | 草稿 | [prd-prompt-optimizer.md](prd-prompt-optimizer.md) |
| `template-library` | 模板库 | 3 | P1 | 草稿 | [prd-template-library.md](prd-template-library.md) |
| `history-management` | 历史管理 | 3 | P1 | 草稿 | [prd-history-management.md](prd-history-management.md) |
| `api-preview` | API 集成预览 | 3 | P1 | 草稿 | [prd-api-preview.md](prd-api-preview.md) |

---

## 模块依赖关系图

```
[模板库 template-library]
         ↓ 应用模板
[提示词优化引擎 prompt-optimizer]  ←← 核心模块（P0）
         ↓ 保存历史           ↓ 传递提示词
[历史管理 history-management]    [API 集成预览 api-preview]
         ↑ 关联 task_id  ←←←←←←←←←←↙
```

---

## 下游消费关系

| 阶段 | 工具/Agent | 输入产物 | 输出产物 |
|------|-----------|---------|---------|
| 架构设计 | `architect` Agent | 本目录所有 Module PRD | `architecture-seedance-prompt.md` + 各模块架构文档 |
| 需求转 Issue | `requirement-to-issues` Skill | 本目录所有 Module PRD | GitHub Epic Issues（每模块一个）+ Task Issues（每功能点一个） |
| 阶段评审 | `gate_review` Agent | 主 PRD + 所有 Module PRD | Gate 1 评审报告（Go/No-Go） |
| 高保真设计 | `designer` Agent | 主 PRD + wireframes/ | hifi-wireframes/ 目录 |

---

## 原型图（Wireframes）

原型图文件位于 `../wireframes/` 目录：

| 模块 | 原型文件 | 说明 |
|------|---------|------|
| `prompt-optimizer` | [prompt-optimizer-editor.html](../wireframes/prompt-optimizer-editor.html) | 编辑器主页 |
| `prompt-optimizer` | [prompt-optimizer-result.html](../wireframes/prompt-optimizer-result.html) | 结果与调参页 |
| `template-library` | [template-library-browse.html](../wireframes/template-library-browse.html) | 模板库浏览页 |
| `history-management` | [history-management-list.html](../wireframes/history-management-list.html) | 历史记录列表页 |
| `api-preview` | [api-preview-panel.html](../wireframes/api-preview-panel.html) | API 预览面板 |
