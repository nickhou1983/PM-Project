# 通用规则

> 所有 Agent 在运行时必须遵守以下约定。

## 输出语言

- 所有面向用户的输出使用中文
- 技术术语可保留英文原文
- 代码注释使用英文

## 文件操作

- 产物文件写入 `projects/prd-{project}/` 目录
- 运行时计划写入 `plans/` 目录
- 不要修改 `.github/agents/`、`.github/skills/`、`.codex/` 下的定义文件
- 不要修改 `docs/` 下的规范文档

## 质量约束

- 不编造数据，所有分析结论必须来自实际检索结果
- 按工作流顺序执行，不跳步
- 产出物必须包含可追溯的来源引用

## 提交规范

- 使用 Conventional Commits：`feat:` / `fix:` / `docs:` / `refactor:` / `chore:`
- 不自动 git commit，由用户决定提交时机

## Skill 使用

当任务匹配某个 Skill 的触发条件时：
1. 读取 `.github/skills/<skill-name>/SKILL.md`
2. 按 SKILL.md 中定义的步骤顺序执行
3. 需要模板时，读取 `.github/skills/<skill-name>/references/` 下的对应文件

## MCP 工具使用

- Tavily：用于竞品分析、市场调研等网络搜索场景
- GitHub MCP：用于 Issue/PR 管理
- Playwright：用于 UI 自动化测试
- 飞书 MCP：用于文档查重和同步
- 墨刀 MCP：用于原型发布
- Context7：用于文档检索和知识库查询
