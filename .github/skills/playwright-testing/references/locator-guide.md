# 定位器选择指南

## 优先级规则

Playwright 推荐根据用户可见行为选择定位器，优先级从高到低：

### 1. `getByRole` — 最推荐

基于 ARIA role 和 accessible name，最接近用户/辅助技术的交互方式。

```typescript
page.getByRole('button', { name: '提交' })
page.getByRole('heading', { name: '欢迎' })
page.getByRole('link', { name: '首页' })
page.getByRole('textbox', { name: '用户名' })
page.getByRole('checkbox', { name: '记住我' })
page.getByRole('dialog')
page.getByRole('navigation')
```

### 2. `getByText` — 静态文本

匹配页面上可见的文本内容。

```typescript
page.getByText('暂无数据')
page.getByText('欢迎回来', { exact: true })
page.getByText(/总计 \d+ 条/)
```

### 3. `getByLabel` — 表单字段

通过关联的 `<label>` 文本定位表单控件。

```typescript
page.getByLabel('邮箱地址')
page.getByLabel('密码')
```

### 4. `getByPlaceholder` — 占位符

通过 `placeholder` 属性定位输入框。

```typescript
page.getByPlaceholder('请输入搜索关键词')
page.getByPlaceholder('your@email.com')
```

### 5. `getByTestId` — 最后手段

当以上定位器都不适用时，使用 `data-testid` 属性。

```typescript
page.getByTestId('submit-button')
page.getByTestId('user-avatar')
```

## 避免使用

| 方式 | 原因 |
| ---- | ---- |
| `page.$('.class-name')` | CSS 类名不稳定 |
| `page.locator('//div[@id="x"]')` | XPath 脆弱，不可读 |
| `page.locator('#id')` | ID 可能变化 |
| `page.locator('div > span:nth-child(2)')` | 结构耦合，极易因 DOM 变化失败 |

## 复杂控件定位策略

当 Accessibility Tree 错误识别控件类型时（如下拉框被识别为 `textbox`），按以下递进策略处理。

> **源码预分析提示**：如果可以访问代码仓库，先分析源码可以大幅提升控件识别准确率：
>
> 1. 读取 `package.json` 确定 UI 框架（antd / element-plus / @mui 等）
> 2. 搜索目标页面组件源码，提取实际使用的控件类型（`<Select>` / `<DatePicker>` 等）
> 3. 检查已有的 `data-testid`、`aria-label` 属性
> 4. 带着源码中的控件类型信息去解读 Accessibility Tree，避免被误识别的 role 误导

### 策略 1：二次探索法（最推荐）

自定义组件的下拉面板、弹出层通常在交互后才挂载到 DOM：

```text
1. 第一次 snapshot → 看到 textbox（实际是下拉框触发器）
2. 点击该 textbox → 触发下拉面板展开
3. 第二次 snapshot → 看到 listbox / option / menuitem 等真实元素
4. 基于第二次 snapshot 编写定位器
```

```typescript
// 点击触发器展开下拉
await page.getByRole('textbox', { name: '选择城市' }).click();
// 展开后 option 可见，用 role 定位
await page.getByRole('option', { name: '北京' }).click();
```

### 策略 2：组合定位器 + filter

当 role 不够精确时，结合上下文缩小范围：

```typescript
// 通过相邻 label 文本定位
const selectTrigger = page.getByLabel('所在城市');
await selectTrigger.click();

// 使用 filter 从多个同名选项中筛选
await page
  .getByRole('option')
  .filter({ hasText: '北京' })
  .click();
```

### 策略 3：UI 框架专属模式

主流 UI 框架的自定义组件有固定交互模式：

| 框架 | Select 触发器 | 下拉面板 | 选项定位 |
| ------ | ------------- | --------- | ---------- |
| Ant Design | `.ant-select-selector` 或 `role="combobox"` | `.ant-select-dropdown` | `.ant-select-item-option` 或 `role="option"` |
| Element Plus | `.el-select__wrapper` 或 `role="combobox"` | `.el-select-dropdown` | `.el-select-dropdown__item` |
| Material UI | `role="combobox"` | `role="listbox"` | `role="option"` |
| Headless UI | `role="listbox"` 或 `role="combobox"` | 自动 ARIA | `role="option"` |

```typescript
// Ant Design Select 示例
await page.getByRole('combobox', { name: '选择城市' }).click();
await page.getByRole('option', { name: '北京' }).click();

// Element Plus — combobox role 可能缺失时
await page.locator('.el-select').filter({ hasText: '选择城市' }).click();
await page.locator('.el-select-dropdown__item').filter({ hasText: '北京' }).click();
```

### 策略 4：data-testid 回退

当语义化定位器不可用时，建议在源码中为自定义控件添加 `data-testid`：

```html
<!-- 源码侧 -->
<CustomSelect data-testid="city-selector" />
```

```typescript
// 测试侧
await page.getByTestId('city-selector').click();
await page.getByRole('option', { name: '北京' }).click();
```

### 策略 5：CSS 选择器 / evaluate 兜底

**仅在以上策略全部失败时使用**，必须在测试代码中添加注释说明原因：

```typescript
// WORKAROUND: CustomDropdown 缺少 ARIA 属性，无法用 role-based 定位器
await page.locator('.custom-dropdown-trigger').click();
await page.locator('.dropdown-option:has-text("北京")').click();

// 极端情况：通过 JS 直接设置值
await page.evaluate(() => {
  const select = document.querySelector('[data-field="city"]');
  // 触发框架的 change 事件
  select.value = 'beijing';
  select.dispatchEvent(new Event('change', { bubbles: true }));
});
```

### 常见误识别场景速查

| 实际控件 | 常见误识别为 | 推荐处理 |
| --------- | ------------ | ---------- |
| 下拉选择框（Select） | `textbox` | 二次探索：点击后用 `getByRole('option')` |
| 日期选择器（DatePicker） | `textbox` | 二次探索：点击后用 `getByRole('gridcell')` 或 `getByText('15')` |
| 自动补全（Autocomplete） | `textbox` | 先 `fill()` 输入文本触发建议列表，再用 `getByRole('option')` |
| 级联选择（Cascader） | `textbox` | 多次二次探索：逐级点击展开 |
| 穿梭框（Transfer） | `listbox` | 用 `filter({ hasText })` 区分左右两个列表 |
| 标签选择（TagSelect） | `textbox` + 多个 `button` | 点击展开面板，用 `getByRole('checkbox')` 或 `getByText` |
| Modal / Drawer | 不在初始 snapshot 中 | 触发打开操作后再 snapshot |
| Tab 切换 | `button` 或 `link` | 使用 `getByRole('tab', { name: '...' })` |

## 组合定位器

当单一定位器无法唯一定位时，使用 `filter` 链式缩小范围：

```typescript
page
  .getByRole('listitem')
  .filter({ hasText: '产品A' })
  .getByRole('button', { name: '购买' })
```
