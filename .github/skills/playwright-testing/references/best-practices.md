# Playwright 测试最佳实践

## 核心原则

1. **先探索后编写** — 通过 Playwright MCP 实际浏览页面，再编写测试代码
2. **使用 role-based 定位器** — 优先使用 `getByRole`，模拟真实用户的交互方式
3. **auto-retrying 断言** — 使用 `expect` 提供的自动重试断言，不使用手动等待
4. **测试隔离** — 每个测试独立运行，不依赖其他测试的状态

## 禁止项

- ❌ 不使用 `page.waitForTimeout()` — 这是固定等待，脆弱且缓慢
- ❌ 不使用 `page.waitForSelector()` — 用 `expect(locator).toBeVisible()` 替代
- ❌ 不依赖 CSS 类名定位 — 类名易变，使用语义化定位器
- ❌ 不硬编码测试数据 — 使用变量或 fixture

## 推荐项

- ✅ 使用 `@playwright/test` 的 TypeScript 类型
- ✅ 每个 test 有清晰的 AAA 结构（Arrange-Act-Assert）
- ✅ 使用 `test.describe` 分组相关测试
- ✅ 使用 `test.beforeEach` 处理通用前置操作（如登录）
- ✅ 使用 Page Object Model 管理复杂页面
- ✅ 视觉测试使用 `toHaveScreenshot()` 进行截图对比

## 调试技巧

- 使用 `--headed` 查看浏览器执行过程
- 使用 `--debug` 步进调试
- 使用 trace viewer 分析失败原因：`npx playwright show-trace trace.zip`
