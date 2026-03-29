---
name: playwright-testing
description: "使用 Playwright MCP 进行 UI/E2E 自动化测试。支持页面探索、测试用例生成、执行验证、截图对比、axe-core WCAG 合规扫描。触发条件：(1) UI 自动化测试，(2) E2E 端到端测试，(3) 页面功能验证，(4) 浏览器测试，(5) Playwright 测试生成与执行，(6) 视觉回归测试，(7) 无障碍测试 / a11y / WCAG 合规检查。"
argument-hint: "提供目标 URL 和要测试的功能描述"
---

# Playwright UI/E2E 测试

通过 Playwright MCP 工具进行浏览器自动化测试，生成可维护的 TypeScript 测试代码。

## 参考文件

| 文件 | 用途 |
| ---- | ---- |
| [best-practices.md](./references/best-practices.md) | Playwright 测试最佳实践和编码规范 |
| [locator-guide.md](./references/locator-guide.md) | 定位器选择指南和优先级 |

## 测试用例目录

生成的测试文件统一存放到 `tests/` 目录下，按功能模块组织：

```
tests/
├── e2e/                    # 端到端测试
│   ├── auth.spec.ts        # 登录/注册/鉴权
│   ├── navigation.spec.ts  # 页面导航和路由
│   └── ...
├── ui/                     # UI 组件测试
│   ├── forms.spec.ts       # 表单交互
│   ├── modals.spec.ts      # 弹窗/对话框
│   └── ...
├── visual/                 # 视觉回归测试
│   └── screenshots/        # 截图基线
├── a11y/                   # 无障碍测试
│   └── wcag.spec.ts        # WCAG 2.1 AA 合规扫描
├── pages/                  # Page Object Model
│   ├── login.page.ts
│   └── ...
└── playwright.config.ts    # Playwright 配置
```

## UI 测试类型分类

| 类型 | 触发关键词 | 测试目录 | 说明 |
|------|-----------|----------|------|
| UI 组件测试 | UI 测试, 组件测试, 表单测试, 交互测试 | `tests/ui/` | 单个页面或组件的交互验证 |
| E2E 端到端 | E2E, 端到端, 用户流程, 完整场景 | `tests/e2e/` | 跨页面的完整用户操作流程 |
| 视觉回归 | 视觉测试, 截图对比, UI 回归, visual | `tests/visual/` | 页面截图基线对比（截图纳入 Git） |
| 无障碍测试 | a11y, 无障碍, accessibility, WCAG | `tests/a11y/` | 基于 axe-core 的 WCAG 2.1 合规自动扫描 |

## Constraints

1. **先探索后编码** — 禁止仅凭描述生成测试代码，必须通过 Playwright MCP 先探索页面结构
2. **Role-based locators** — 优先使用 `getByRole`、`getByText`、`getByLabel`，禁止 CSS 选择器和 XPath（除非没有其他选择）
3. **Auto-retrying assertions** — 使用 `expect(locator).toBeVisible()` 等自动重试断言，禁止 `page.waitForTimeout()` 和 `page.waitForSelector()`
4. **不修改生产代码** — 除非测试揭示了真正的 bug 且用户确认修复
5. **TDD 模式** — 先写测试，再运行验证
6. **Page Object Model** — 当页面交互复杂或多个测试文件访问同一页面时，抽取 POM 类到 `tests/pages/`
7. **截图基线纳入 Git** — 视觉回归截图存放在 `tests/visual/screenshots/`，随代码版本管理
8. **使用项目现有配置** — 遵循项目已有的 `playwright.config.ts` 和测试目录结构

## 工作流

### 步骤 1：确认测试目标

1. **获取 URL**：确认要测试的目标页面 URL
2. **明确功能**：确认要测试的具体功能（登录、表单提交、导航等）
3. **确定测试类型**：
   - 单个组件交互 → UI 组件测试
   - 跨页面完整流程 → E2E 端到端
   - 页面外观一致性 → 视觉回归
   - 可访问性合规 → 无障碍测试
4. **检查已有测试**：搜索 `tests/` 目录，了解已有测试覆盖情况，避免重复

### 步骤 2：源码预分析

**关键规则：当可以访问代码仓库时，先分析源码再探索页面。**

1. **识别 UI 框架** — 读取 `package.json` 检查依赖：
   - `antd` / `@ant-design/*` → Ant Design 交互模式
   - `element-plus` / `element-ui` → Element 交互模式
   - `@mui/*` / `@material-ui/*` → Material UI 交互模式
   - `@headlessui/*` / `@radix-ui/*` → 标准 ARIA
2. **定位目标组件源码** — 搜索路由定义找到 URL 到组件的映射，读取目标页面源码
3. **提取控件清单** — 从源码中识别控件类型及其 props（`data-testid`、`aria-*`、`placeholder`）
4. **生成控件映射表** — 输出源码分析结果，供后续阶段参考：

   | 源码控件 | 框架 | 预期 ARIA role | 已有 testid / aria | 预计定位策略 |
   | ---------- | ------ | -------------- | ----------------- | -------------- |
   | `<Select placeholder="选择城市">` | Ant Design | combobox | 无 | 二次探索 + getByRole('option') |
   | `<Input data-testid="username">` | Ant Design | textbox | data-testid="username" | getByTestId |

### 步骤 3：通过 Playwright MCP 探索页面

**关键规则：必须先探索再编写，禁止仅凭描述生成代码。**

1. **导航到目标 URL** — 使用 Playwright MCP 的 `browser_navigate` 工具
2. **探索页面结构** — 使用 `browser_snapshot` 获取页面 Accessibility Tree
3. **交互验证** — 逐步执行关键操作（点击、填写、提交），确认实际行为
4. **记录发现** — 记录关键元素的 role、name、text 用于编写定位器

### 步骤 3：生成测试代码

基于探索结果，编写 TypeScript 测试文件：

```typescript
import { test, expect } from '@playwright/test';

test.describe('功能模块名称', () => {
  test('具体测试场景', async ({ page }) => {
    // 1. 导航
    await page.goto('https://example.com');

    // 2. 交互 — 使用 role-based locators
    await page.getByRole('button', { name: '提交' }).click();

    // 3. 断言 — 使用 auto-retrying assertions
    await expect(page.getByRole('heading', { name: '成功' })).toBeVisible();
  });
});
```

### 步骤 4：Page Object Model 抽取

**触发条件**：页面有 5+ 个交互元素，或多个测试文件访问同一页面。

1. 创建 Page Object 类 → `tests/pages/<page-name>.page.ts`
2. 封装定位器和交互方法
3. 测试代码引用 POM 而不是直接操作元素

```typescript
// tests/pages/login.page.ts
import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByRole('textbox', { name: '用户名' });
    this.submitButton = page.getByRole('button', { name: '登录' });
  }

  async goto() { await this.page.goto('/login'); }
  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.page.getByRole('textbox', { name: '密码' }).fill(password);
    await this.submitButton.click();
  }
}
```

### 步骤 5：保存测试文件

1. 根据测试类型选择目录：`tests/e2e/` 或 `tests/ui/` 或 `tests/visual/` 或 `tests/a11y/`
2. 使用描述性文件名：`<功能>.spec.ts`
3. 如果 `playwright.config.ts` 不存在，生成默认配置

### 步骤 6：执行与迭代

1. 运行测试文件：`npx playwright test <path>`
2. 检查结果：
   - **通过** → 完成，输出测试报告
   - **失败** → 分析错误，修复测试代码，重新运行
3. 迭代直到所有测试通过
4. **视觉回归**（仅视觉测试）：首次运行 `--update-snapshots` 生成基线，后续自动对比
5. **无障碍扫描**（仅无障碍测试）：执行 `axe.analyze()` 并按严重度分级输出违规项
6. （可选）运行完整测试套件检查回归：`npx playwright test`

## 定位器优先级

按以下优先级选择定位器（参考 [locator-guide.md](./references/locator-guide.md)）：

| 优先级 | 定位器 | 示例 |
|--------|--------|------|
| 1 | `getByRole` | `page.getByRole('button', { name: '提交' })` |
| 2 | `getByText` | `page.getByText('欢迎回来')` |
| 3 | `getByLabel` | `page.getByLabel('用户名')` |
| 4 | `getByPlaceholder` | `page.getByPlaceholder('请输入邮箱')` |
| 5 | `getByTestId` | `page.getByTestId('submit-btn')` |

**禁止使用**：CSS 选择器、XPath（除非没有其他选择）。

## 断言规范

使用 auto-retrying assertions，不添加手动 timeout：

```typescript
// ✅ 正确 — auto-retrying assertions
await expect(page.getByRole('alert')).toBeVisible();
await expect(page.getByText('保存成功')).toBeVisible();
await expect(page).toHaveURL(/dashboard/);
await expect(page).toHaveTitle(/首页/);
await expect(page.getByRole('textbox')).toHaveValue('test');

// ✅ 正确 — 视觉回归断言（带容差）
await expect(page).toHaveScreenshot('homepage.png', { maxDiffPixelRatio: 0.01 });
await expect(locator).toHaveScreenshot('component.png', { maxDiffPixels: 100 });

// ❌ 错误 — 手动等待
await page.waitForTimeout(3000);
await page.waitForSelector('.alert');
```

## 视觉回归测试要点

详细的视觉回归策略参见 Agent 定义（`ui-testing.agent.md`），以下是核心要点：

### 截图粒度

| 粒度 | 方法 | 适用场景 |
|------|------|----------|
| 全页截图 | `expect(page).toHaveScreenshot('full.png', { fullPage: true })` | 落地页整页布局验证 |
| 组件截图 | `expect(locator).toHaveScreenshot('card.png')` | 单个组件样式验证（推荐，更稳定） |

### 容差配置

```typescript
// 严格 — 图标、Logo
await expect(logo).toHaveScreenshot('logo.png', { maxDiffPixels: 0 });
// 标准 — 普通页面（推荐默认）
await expect(page).toHaveScreenshot('page.png', { maxDiffPixelRatio: 0.01 });
// 宽松 — 含文字渲染的复杂页面
await expect(page).toHaveScreenshot('text.png', { maxDiffPixelRatio: 0.02, threshold: 0.3 });
```

### 动态内容处理

```typescript
// mask 遮罩动态区域（推荐）
await expect(page).toHaveScreenshot('dashboard.png', {
  mask: [page.getByTestId('current-time'), page.locator('.ad-banner')],
});
// 禁用动画
await page.evaluate(() => document.getAnimations().forEach(a => a.finish()));
await expect(page).toHaveScreenshot('static.png', { animations: 'disabled' });
```

### 基线管理

1. 首次生成：`npx playwright test tests/visual/ --update-snapshots`
2. 审核截图 → 提交 Git → CI 自动对比
3. UI 有意变更后重新 `--update-snapshots` 并 review 截图变更

## 无障碍测试要点

详细的无障碍策略参见 Agent 定义（`ui-testing.agent.md`），以下是核心要点：

### 依赖

```bash
npm install -D @axe-core/playwright
```

### 基本用法

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('首页应通过 WCAG 2.1 AA', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

### WCAG 违规严重度

| 级别 | axe 严重度 | 说明 | 示例 |
|------|-----------|------|------|
| 🔴 critical | `critical` | 阻断性，部分用户完全无法使用 | 图片无 alt、表单无 label |
| 🔴 serious | `serious` | 严重障碍 | 颜色对比度不足 |
| 🟡 moderate | `moderate` | 中等问题 | 缺少 landmark 区域 |
| 🟢 minor | `minor` | 最佳实践建议 | tabindex > 0 |

### 扫描技巧

- 指定区域：`.include('#main-form').exclude('.third-party')`
- 排除已知问题：`.disableRules(['color-contrast'])`
- 与 E2E 集成：在关键交互步骤后附加 `axe.analyze()` 扫描

## 输出格式

```markdown
## Playwright 测试报告

**目标 URL**: <tested URL>
**测试类型**: UI 组件 | E2E | 视觉回归 | 无障碍
**测试框架**: Playwright (@playwright/test)

### 源码预分析结果
- UI 框架: <framework name and version>
- 识别的控件: <component list with expected ARIA roles>
- 误识别风险: <components likely to be misidentified>

### 页面探索发现
- 关键元素及定位器
- 页面交互行为记录
- 页面结构复杂度评估

### Page Object Model
- POM 文件: <file path or "不需要">
- 封装的定位器数量: <count>
- 封装的交互方法: <method list>

### 测试用例
| 用例 | 描述 | 结果 |
|------|------|------|
| test name | what it verifies | ✅ / ❌ |

### 执行结果
- Total: <count> | Passed: <count> | Failed: <count>
- Duration: <time>
- Screenshot baselines: <count if visual test>

### 无障碍扫描结果（仅无障碍测试）
- WCAG 标准: 2.1 Level AA
- 扫描页面: <page count>
- 违规总数: <count>

| 严重度 | 规则 ID | 描述 | 影响元素数 |
|--------|---------|------|----------|
| 🔴 critical | image-alt | Images must have alternate text | 3 |

### 建议
- 未覆盖的场景
- 可补充的单元/集成测试（可交由 Code Testing Agent）
```
