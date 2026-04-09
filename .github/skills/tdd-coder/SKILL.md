---
name: tdd-coder
description: "Write code using Test-Driven Development (TDD) methodology — always writing tests first, then implementation. Use this skill whenever the user asks to 'use TDD', 'write tests first', 'test-driven', 'Red-Green-Refactor', '测试驱动开发', '先写测试再写代码', or any request to build features/modules/functions where TDD workflow is mentioned or implied. Also use when the user asks to 'add a feature with tests' or 'build X with full test coverage'. Supports JavaScript/TypeScript (Jest/Vitest), Python (pytest), Java (JUnit 5), Go (testing), C#/.NET (xUnit), and more."
---

# TDD Coder — Test-Driven Development Skill

Guide Claude to write code following the strict Red → Green → Refactor cycle. The core discipline: **never write implementation code without a failing test first**.

## Workflow

For every feature or function requested, follow this exact sequence:

### Phase 1: Understand the Requirement

Before writing any code, break the requirement into small, independently testable behaviors. Each behavior becomes one TDD cycle. List them out as a plan:

```
Feature: Shopping Cart
  Cycle 1: Create empty cart (getItems returns [], count is 0)
  Cycle 2: Add single item
  Cycle 3: Add duplicate item increments quantity
  Cycle 4: Remove item
  ...
```

Present this plan to the user before proceeding. This ensures alignment and gives the user a chance to adjust scope.

### Phase 2: Red → Green → Refactor Cycles

For each cycle in the plan:

#### 🔴 Red — Write the Failing Test

Write a test that describes the expected behavior. The test MUST fail if run now (because the implementation doesn't exist yet or doesn't cover this case).

- One test per behavior — keep tests focused and small
- Use descriptive test names that read like specifications: `test('should return 0 for empty cart')` not `test('test1')`
- Include edge cases and boundary conditions as separate cycles

#### 🟢 Green — Write Minimum Implementation

Write the **smallest amount of code** that makes the failing test pass. Resist the urge to implement more than what the test requires. This is the hardest discipline in TDD — less is more at this stage.

- Don't optimize
- Don't handle cases not yet covered by tests
- Don't add "nice to haves"

#### 🔄 Refactor — Clean Up Under Test Protection

With all tests passing, improve the code:

- Extract repeated logic into helper methods
- Improve naming
- Simplify conditionals
- Remove duplication between test and production code

Run all tests after refactoring to confirm nothing broke.

### Phase 3: Deliver

After all cycles are complete:

1. **Create the test file** — contains all tests from every Red phase
2. **Create the implementation file** — contains the final implementation after all Green + Refactor phases
3. **Show the TDD journey** — in the conversation, walk through each cycle explaining what was tested and why, so the user understands the progression

## Language & Framework Selection

Choose the test framework based on the project context:

| Language | Test Framework | Test Runner | Notes |
|----------|---------------|-------------|-------|
| JavaScript | Jest | `npx jest` | Default for JS projects |
| TypeScript | Jest + ts-jest or Vitest | `npx jest` / `npx vitest` | Check for existing config |
| Python | pytest | `python -m pytest` | Use `pytest` style, not `unittest` |
| Java | JUnit 5 | `mvn test` / `gradle test` | Use `@Test`, `assertEquals` etc. |
| Go | testing (stdlib) | `go test ./...` | Use `t.Run` for subtests |
| C# / .NET | xUnit | `dotnet test` | Use `[Fact]` and `[Theory]` |

**Auto-detection**: Check for existing `package.json`, `pom.xml`, `go.mod`, `*.csproj`, `pyproject.toml`, or `requirements.txt` to infer the language and framework. If the project already has a test setup, use it.

If no project context exists, ask the user which language to use. Default to JavaScript + Jest if the user has no preference.

## Test Writing Guidelines

These principles apply regardless of language:

### Structure: Arrange → Act → Assert

Every test follows this pattern:
```
// Arrange — set up the preconditions
// Act — perform the action under test
// Assert — verify the outcome
```

### What Makes a Good Test

- **Independent**: Each test can run alone, in any order
- **Deterministic**: Same input always produces same result — no randomness, no time-dependence
- **Fast**: Unit tests should run in milliseconds
- **Readable**: A test is documentation — someone should understand the behavior just by reading it

### Naming Convention

Use names that describe behavior, not implementation:

```
✅ 'should calculate 10% discount on orders over $100'
✅ 'returns empty array when no items match filter'
✅ 'throws error when email format is invalid'

❌ 'test discount'
❌ 'test1'
❌ 'it works'
```

### Edge Cases to Consider

For each feature, think about:
- Empty inputs (null, undefined, empty string, empty array)
- Boundary values (0, -1, MAX_INT)
- Invalid inputs (wrong type, missing fields)
- Duplicate operations (add same item twice)
- State after operations (cart state after remove)

## Output Format

### In Conversation

Walk through each TDD cycle explicitly:

```
### 🔴 Cycle 1: Create empty cart

**Test:**
[code block with the failing test]

**Why this test?** We start with the simplest possible behavior — a new cart should be empty.

### 🟢 Cycle 1: Make it pass

**Implementation:**
[code block with minimum code]

### 🔄 Cycle 1: Refactor

No refactoring needed yet — code is already minimal.

---

### 🔴 Cycle 2: Add single item
...
```

### Files Created

Always create both files in the project:

```
<project>/
├── src/          (or appropriate source directory)
│   └── <Module>.{js,py,java,go,cs}
└── tests/        (or __tests__/, *_test.go, etc.)
    └── <Module>.test.{js,py,java,go,cs}
```

Follow the project's existing directory conventions. If none exist, use the conventions above.

### Running Tests

After creating all files, **run the tests** to prove they pass. Show the output to the user. This is the proof that TDD worked — all tests green.

## Scope Management

- If the user's request is large, break it into phases and confirm scope before starting
- Each phase should be completable in 5-10 TDD cycles
- If a cycle starts getting complex (testing multiple behaviors), split it
- It's OK to start with a simple version and iterate — TDD naturally supports incremental development

## Common Pitfalls to Avoid

- **Writing implementation before tests** — this defeats the entire purpose. Always Red first.
- **Writing too much in Green** — only what the current test demands. Future tests will drive the rest.
- **Skipping Refactor** — technical debt accumulates. Take a moment to clean up after each green.
- **Testing implementation details** — test behavior (what), not mechanics (how). Don't assert on internal state unless it's part of the public API.
- **Giant test methods** — if a test has multiple asserts testing different behaviors, split it into separate tests.
