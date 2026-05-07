# 测试反模式

**在以下场景加载这份参考：** 编写或修改测试、添加 mock，或你有冲动把“只给测试用”的方法塞进生产代码时。

## 概览

测试必须验证真实行为，而不是 mock 的行为。mock 只是隔离手段，不是被测试对象本身。

**核心原则：** 测代码做了什么，而不是测 mock 做了什么。

**严格执行 TDD，可以显著避免这些反模式。**

## 铁律

```
1. NEVER test mock behavior
2. NEVER add test-only methods to production classes
3. NEVER mock without understanding dependencies
```

## 反模式 1：测试 mock 行为

**错误示例：**
```typescript
// ❌ BAD: Testing that the mock exists
test('renders sidebar', () => {
  render(<Page />);
  expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();
});
```

**为什么这不对：**
- 你验证的是 mock 存在，不是组件行为正确
- mock 在时测试就过，mock 不在时测试就挂
- 它对真实行为没有任何说明价值

**你的人工协作者会这样提醒你：** “我们现在测的是 mock 的行为吗？”

**正确做法：**
```typescript
// ✅ GOOD: Test real component or don't mock it
test('renders sidebar', () => {
  render(<Page />);  // Don't mock sidebar
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});

// OR if sidebar must be mocked for isolation:
// Don't assert on the mock - test Page's behavior with sidebar present
```

### 闸门检查

```
BEFORE asserting on any mock element:
  Ask: "Am I testing real component behavior or just mock existence?"

  IF testing mock existence:
    STOP - Delete the assertion or unmock the component

  Test real behavior instead
```

## 反模式 2：把测试专用方法放进生产代码

**错误示例：**
```typescript
// ❌ BAD: destroy() only used in tests
class Session {
  async destroy() {  // Looks like production API!
    await this._workspaceManager?.destroyWorkspace(this.id);
    // ... cleanup
  }
}

// In tests
afterEach(() => session.destroy());
```

**为什么这不对：**
- 生产类被测试专用代码污染
- 如果在生产环境误调用，会带来风险
- 违背 YAGNI 和关注点分离
- 混淆了对象生命周期和实体生命周期

**正确做法：**
```typescript
// ✅ GOOD: Test utilities handle test cleanup
// Session has no destroy() - it's stateless in production

// In test-utils/
export async function cleanupSession(session: Session) {
  const workspace = session.getWorkspaceInfo();
  if (workspace) {
    await workspaceManager.destroyWorkspace(workspace.id);
  }
}

// In tests
afterEach(() => cleanupSession(session));
```

### 闸门检查

```
BEFORE adding any method to production class:
  Ask: "Is this only used by tests?"

  IF yes:
    STOP - Don't add it
    Put it in test utilities instead

  Ask: "Does this class own this resource's lifecycle?"

  IF no:
    STOP - Wrong class for this method
```

## 反模式 3：在没搞清依赖时就 mock

**错误示例：**
```typescript
// ❌ BAD: Mock breaks test logic
test('detects duplicate server', () => {
  // Mock prevents config write that test depends on!
  vi.mock('ToolCatalog', () => ({
    discoverAndCacheTools: vi.fn().mockResolvedValue(undefined)
  }));

  await addServer(config);
  await addServer(config);  // Should throw - but won't!
});
```

**为什么这不对：**
- 你 mock 掉的方法带有测试所依赖的副作用（比如写配置）
- 为了“保险”而过度 mock，反而破坏了真实行为
- 测试可能因为错误原因通过，或者莫名其妙失败

**正确做法：**
```typescript
// ✅ GOOD: Mock at correct level
test('detects duplicate server', () => {
  // Mock the slow part, preserve behavior test needs
  vi.mock('MCPServerManager'); // Just mock slow server startup

  await addServer(config);  // Config written
  await addServer(config);  // Duplicate detected ✓
});
```

### 闸门检查

```
BEFORE mocking any method:
  STOP - Don't mock yet

  1. Ask: "What side effects does the real method have?"
  2. Ask: "Does this test depend on any of those side effects?"
  3. Ask: "Do I fully understand what this test needs?"

  IF depends on side effects:
    Mock at lower level (the actual slow/external operation)
    OR use test doubles that preserve necessary behavior
    NOT the high-level method the test depends on

  IF unsure what test depends on:
    Run test with real implementation FIRST
    Observe what actually needs to happen
    THEN add minimal mocking at the right level

  Red flags:
    - "I'll mock this to be safe"
    - "This might be slow, better mock it"
    - Mocking without understanding the dependency chain
```

  ## 反模式 4：不完整的 mock

  **错误示例：**
```typescript
// ❌ BAD: Partial mock - only fields you think you need
const mockResponse = {
  status: 'success',
  data: { userId: '123', name: 'Alice' }
  // Missing: metadata that downstream code uses
};

// Later: breaks when code accesses response.metadata.requestId
```

**为什么这不对：**
- **局部 mock 会掩盖结构假设**，因为你只 mock 了自己眼下知道的字段
- **下游代码可能依赖你没补齐的字段**，于是会静默出错
- **测试通过但集成失败**，因为 mock 不完整，而真实 API 是完整的
- **会制造虚假的信心**，测试并没有证明真实行为没问题

**铁律：** mock 时要还原现实中的**完整数据结构**，而不只是当前测试眼下会访问的字段。

**正确做法：**
```typescript
// ✅ GOOD: Mirror real API completeness
const mockResponse = {
  status: 'success',
  data: { userId: '123', name: 'Alice' },
  metadata: { requestId: 'req-789', timestamp: 1234567890 }
  // All fields real API returns
};
```

### 闸门检查

```
BEFORE creating mock responses:
  Check: "What fields does the real API response contain?"

  Actions:
    1. Examine actual API response from docs/examples
    2. Include ALL fields system might consume downstream
    3. Verify mock matches real response schema completely

  Critical:
    If you're creating a mock, you must understand the ENTIRE structure
    Partial mocks fail silently when code depends on omitted fields

  If uncertain: Include all documented fields
```

## 反模式 5：把集成测试当成事后补充

**错误示例：**
```
✅ Implementation complete
❌ No tests written
"Ready for testing"
```

**为什么这不对：**
- 测试是实现的一部分，不是可选的收尾动作
- 如果采用 TDD，这类问题本来就不会发生
- 没有测试，就不能声称“已经完成”

**正确做法：**
```
TDD cycle:
1. Write failing test
2. Implement to pass
3. Refactor
4. THEN claim complete
```

## 当 mock 变得过于复杂时

**警告信号：**
- mock 配置比测试逻辑本身还长
- 为了让测试通过，你把几乎所有东西都 mock 了
- mock 缺少真实组件实际拥有的方法
- mock 一改，测试就跟着碎掉

**你的人工协作者会问：** “这里真的需要 mock 吗？”

**要考虑的一点：** 用真实组件写集成测试，往往比维护复杂 mock 更简单。

## 为什么 TDD 能防住这些反模式

**TDD 有帮助的原因：**
1. **先写测试**：逼你先想清楚自己到底在测什么。
2. **先看它失败**：确认测试覆盖的是真实行为，不是 mock。
3. **最小实现**：减少测试专用逻辑悄悄混进生产代码。
4. **先理解真实依赖**：你会先看到测试真正需要什么，再决定该不该 mock。

**如果你测的是 mock 行为，那你已经偏离 TDD 了**，因为你是在没有先看真实代码失败的前提下，就把 mock 塞进去了。

## 快速对照表

| 反模式 | 修正方式 |
|--------------|-----|
| 对 mock 元素做断言 | 测真实组件，或者去掉 mock |
| 把测试专用方法放进生产代码 | 移到测试工具里 |
| 没搞清依赖就 mock | 先理解依赖，再做最小化 mock |
| mock 不完整 | 按真实 API 完整结构镜像 |
| 把测试当事后补充 | 按 TDD 来，先写测试 |
| mock 复杂到失控 | 考虑改写为集成测试 |

## 危险信号

- 断言在检查 `*-mock` 这种测试 ID
- 某个方法只在测试文件里被调用
- mock 配置占了测试内容的一半以上
- 一去掉 mock，测试就失败
- 你解释不清为什么这里必须 mock
- “先 mock 一下比较保险”

## 最后的结论

**mock 是隔离手段，不是测试对象。**

如果在 TDD 过程中发现自己测的是 mock 行为，说明方向已经错了。

修正方式只有两个方向：要么改成测试真实行为，要么重新质疑这里为什么需要 mock。
