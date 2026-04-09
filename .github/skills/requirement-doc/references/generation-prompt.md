# 模块化 PRD 生成流程（Generation Prompt）

> 本文档定义了将产品需求按模块拆分生成独立 Module PRD 的 4 步流程。供 AI Agent 在执行 `requirement-doc` Skill 时参照。

## 适用场景

当用户明确要求「模块化 PRD」、「按模块拆分 PRD」、「生成 Module PRD」时，或当产品功能模块 ≥3 个时，自动进入模块化生成模式。

## 前置条件

- 已完成需求收集和信息整理（SKILL.md 步骤 1-2）
- 已加载 [prd-template.md](prd-template.md)（主 PRD 模板）和 [module-prd-template.md](module-prd-template.md)（模块 PRD 模板）

---

## Step 1：提取 Module 列表

从原始需求或已有 PRD §4.1 功能概览表中，识别并提取所有功能模块。

### 输入

- 用户的产品灵感描述或需求分析报告
- 或已有 PRD 的 §4.1 功能概览表

### 处理逻辑

1. 识别所有功能点，按业务能力聚合为模块（Module）
2. 为每个模块生成英文 slug 和中文名称：
   - `module_en_slug`：小写英文单词、以 `-` 连接（如 `task-management`、`time-management`、`category`）
   - `module_zh_name`：中文显示名称（如 任务管理、时间管理、分类）
3. 统计每个模块的功能点数量、最高优先级
4. 分析模块间依赖关系

### 输出

**模块清单**（JSON 格式，供后续步骤使用）：

```json
{
  "project_slug": "{project-en-slug}",
  "project_name": "{项目中文名}",
  "modules": [
    {
      "module_en_slug": "task-management",
      "module_zh_name": "任务管理",
      "description": "任务的创建、编辑、完成、删除等核心操作",
      "feature_count": 5,
      "highest_priority": "P0",
      "depends_on": [],
      "features": [
        {
          "name": "新增待办",
          "priority": "P0",
          "rice_score": 12.5
        }
      ]
    },
    {
      "module_en_slug": "time-management",
      "module_zh_name": "时间管理",
      "description": "截止日期设置、时间提醒、日历视图",
      "feature_count": 3,
      "highest_priority": "P1",
      "depends_on": ["task-management"]
    }
  ]
}
```

### Slug 命名规范

| 中文模块名 | 英文 Slug | 规则 |
|------------|-----------|------|
| 任务管理 | `task-management` | 直译为英文，用 `-` 连接 |
| 时间管理 | `time-management` | 直译为英文，用 `-` 连接 |
| 优先级 | `priority` | 单词即可，不需要 `-` |
| 分类 | `category` | 单词即可 |
| 提醒 | `reminder` | 单词即可 |
| 场所发现 | `place-discovery` | 直译为英文 |
| 用户认证 | `user-auth` | 缩写可接受 |
| AI 对话核心 | `ai-conversation` | 技术前缀保留 |

---

## Step 2：生成主 PRD

使用 [prd-template.md](prd-template.md) 模板生成主 PRD 文档。

### 关键调整

1. **§4.1 模块导航表**：填写所有模块的 `module_en_slug`、中文名、功能点数、最高优先级、Module PRD 链接
2. **§4.2 功能概览**：生成全局功能汇总表（每行包含 `module_en_slug` + 中文名），但**不写功能详细描述**
3. **§3 用户故事**：保留全局用户故事，但标注每个故事关联的模块 slug
4. **其他章节**（§1-3, §5-11）：正常填写，与单文件模式一致

### 输出路径

```
docs/prd-{project_slug}/prd-{project_slug}.md
```

---

## Step 3：生成各模块 PRD

遍历 Step 1 的模块清单，为每个模块使用 [module-prd-template.md](module-prd-template.md) 模板生成独立的 Module PRD。

### 生成逻辑（每个模块重复一次）

1. **填充模块元信息**：
   - `module_en_slug` 和 `module_zh_name`
   - 反向链接到主 PRD（`../prd-{project_slug}.md`）
   - 相关模块（从 Step 1 的 `depends_on` 提取）

2. **填充 §2 功能需求**：
   - §2.1 功能概览表：该模块下所有功能点的 RICE 评分
   - §2.2 功能详细描述：每个功能点的输入/输出/处理逻辑/异常场景

3. **填充 §3 用户故事**：
   - 从主 PRD 的全局用户故事中筛选与该模块相关的故事
   - 编号格式：`US-{module_en_slug}-001`
   - 生成验收标准汇总表，标注测试类型

4. **填充 §4 交互设计**：
   - 从 wireframes 中筛选以 `{module_en_slug}-` 为前缀的原型页面
   - 若无前缀匹配，根据功能描述关联最相关的原型页面

5. **填充 §5 依赖与风险**：
   - 外部依赖（第三方 API 等）
   - 风险项
   - 技术参考占位符（待 architect skill 填充）

### 输出路径

```
docs/prd-{project_slug}/modules/prd-{module_en_slug}.md
```

### 示例

```
docs/prd-personal-todo-app/modules/prd-task-management.md
docs/prd-personal-todo-app/modules/prd-time-management.md
docs/prd-personal-todo-app/modules/prd-priority.md
docs/prd-personal-todo-app/modules/prd-category.md
docs/prd-personal-todo-app/modules/prd-reminder.md
```

---

## Step 4：生成导航索引

在 `modules/` 目录下生成 `README.md` 作为模块导航索引，并确保主 PRD §4.1 的链接正确。

### modules/README.md 内容

```markdown
# {项目中文名} — 模块需求文档索引

> 本目录包含按模块拆分的独立 PRD 文档。主 PRD 文档位于上级目录。

## 模块列表

| # | 模块标识 | 模块名称 | 功能点数 | 优先级 | Module PRD | 模块架构 |
|---|----------|----------|----------|--------|------------|----------|
| 1 | `{slug}` | {中文名} | {N} | P0 | [prd-{slug}.md](prd-{slug}.md) | [待生成] |
| 2 | `{slug}` | {中文名} | {N} | P1 | [prd-{slug}.md](prd-{slug}.md) | [待生成] |

## 文档关系

- **主 PRD**: [../prd-{project_slug}.md](../prd-{project_slug}.md)
- **架构文档**: [../architecture-{project_slug}.md](../architecture-{project_slug}.md)（若已生成）
- **原型图**: [../wireframes/index.html](../wireframes/index.html)

## 下游消费

- `architect` Skill → 读取 Module PRD 生成模块级架构设计
- `requirement-to-issues` Skill → 读取 Module PRD 生成 Epic + Task Issues
- `gate_review` Agent → Gate 1 评审时检查主 PRD + 所有 Module PRD
```

### 输出路径

```
docs/prd-{project_slug}/modules/README.md
```

---

## 交付物检查清单

完成 4 步流程后，验证以下交付物：

- [ ] 主 PRD 已生成：`docs/prd-{project_slug}/prd-{project_slug}.md`
- [ ] 模块 PRD 已生成：`docs/prd-{project_slug}/modules/prd-{module_en_slug}.md`（每个模块一个）
- [ ] 导航索引已生成：`docs/prd-{project_slug}/modules/README.md`
- [ ] 主 PRD §4.1 模块导航表中的链接指向正确的 Module PRD 文件
- [ ] 每个 Module PRD 的反向链接指向主 PRD
- [ ] 所有功能点在全局汇总表（§4.2）和 Module PRD（§2.1）中都有出现
- [ ] 用户故事在 Module PRD 中的编号格式为 `US-{module_en_slug}-NNN`
- [ ] Wireframe 文件在 Module PRD §4.2 中正确关联
- [ ] `module_en_slug` 符合命名规范（小写英文、`-` 连接）
