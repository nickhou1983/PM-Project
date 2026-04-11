# VideoPrompt AI — 模块导航索引

> 本文件为 VideoPrompt AI PRD 的模块导航索引，列出所有功能模块及其关联文档。

## 模块概览

| 模块编号 | 模块名称 | 英文标识 | 优先级 | PRD 文档 | 架构文档 | 原型页面 |
|---------|---------|---------|--------|---------|---------|---------|
| M-1 | 智能提示词转换 | prompt-converter | P0 | [PRD](prd-prompt-converter.md) | 待生成 | [首页](../wireframes/prompt-converter-home.html) · [结果页](../wireframes/prompt-converter-result.html) |
| M-2 | AI 提示词生成 | prompt-generator | P0 | [PRD](prd-prompt-generator.md) | 待生成 | [生成页](../wireframes/prompt-generator-create.html) |
| M-3 | 模型能力对比 | model-comparison | P1 | [PRD](prd-model-comparison.md) | 待生成 | [对比矩阵](../wireframes/model-comparison-matrix.html) |
| M-4 | 模板库 | template-library | P1 | [PRD](prd-template-library.md) | 待生成 | [模板浏览](../wireframes/template-library-browse.html) |
| M-5 | 用户中心 | user-center | P0 | [PRD](prd-user-center.md) | 待生成 | [个人中心](../wireframes/user-center-profile.html) |

## 文档关系

```
prd-videoprompt-ai.md（主 PRD）
├── modules/
│   ├── README.md ← 本文件
│   ├── prd-prompt-converter.md
│   ├── prd-prompt-generator.md
│   ├── prd-model-comparison.md
│   ├── prd-template-library.md
│   └── prd-user-center.md
├── wireframes/
│   ├── index.html（原型导航）
│   ├── prompt-converter-home.html
│   ├── prompt-converter-result.html
│   ├── prompt-generator-create.html
│   ├── model-comparison-matrix.html
│   ├── template-library-browse.html
│   └── user-center-profile.html
└── hifi-wireframes/（待生成，由 designer Agent 负责）
```

## 模块间依赖

- **prompt-converter** 依赖 **model-comparison** 提供的模型注册表数据（参数映射规则）
- **prompt-generator** 依赖 **model-comparison** 提供的模型参数规格（适配约束）
- **template-library** 消费 prompt-converter 和 prompt-generator 的输出（保存为模板）
- **user-center** 为所有模块提供认证、配额管理和使用记录

## 下游消费说明

| 消费方 | 用途 |
|-------|------|
| `architect` Agent | 读取各模块 PRD 生成模块级架构文档 |
| `gate_review` Agent (Gate 1) | 评审主 PRD + 全部模块 PRD |
| `designer` Agent | 基于 wireframes 生成高保真原型（输出到 `hifi-wireframes/`） |
| `requirement-to-issues` Skill | 按模块拆分为 GitHub Issues（Epic + Tasks） |
