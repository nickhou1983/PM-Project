# Python 规范检查项

## PY01 - 代码风格 (PEP 8)

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| PY01-01 | 遵循 PEP 8 缩进（4 空格） | 🟡 SHOULD | 禁止 Tab |
| PY01-02 | 行宽 ≤ 88 字符 | 🟡 SHOULD | Black 默认值，或 79 (PEP 8) |
| PY01-03 | 函数/变量使用 snake_case | 🟡 SHOULD | `get_user_name` ✅ |
| PY01-04 | 类名使用 PascalCase | 🟡 SHOULD | `UserService` ✅ |
| PY01-05 | 常量使用 UPPER_SNAKE_CASE | 🟡 SHOULD | `MAX_RETRY_COUNT` ✅ |
| PY01-06 | 模块名使用 snake_case | 🟡 SHOULD | `user_service.py` ✅ |

## PY02 - 类型标注

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| PY02-01 | 公共函数有类型标注 | 🟡 SHOULD | 参数和返回值 |
| PY02-02 | 使用 `from __future__ import annotations` | 🟢 NIT | 延迟求值，支持前向引用 |
| PY02-03 | 使用 `typing` 模块复杂类型 | 🟡 SHOULD | `Optional`、`Union`、`TypeVar` |
| PY02-04 | dataclass / pydantic 定义数据结构 | 🟡 SHOULD | 替代普通 dict |
| PY02-05 | 避免使用 `Any` | 🟡 SHOULD | 用 `object` 或具体类型 |

## PY03 - 错误处理

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| PY03-01 | 禁止裸 `except:` | 🔴 MUST | 至少 `except Exception:` |
| PY03-02 | 禁止 `except: pass` | 🔴 MUST | 不能吞掉异常 |
| PY03-03 | 使用具体异常类型 | 🟡 SHOULD | `except ValueError:` 优于 `except Exception:` |
| PY03-04 | 自定义异常继承合理 | 🟡 SHOULD | 业务异常继承链清晰 |
| PY03-05 | 使用 `raise ... from ...` 保留链 | 🟡 SHOULD | 异常链不丢失上下文 |

## PY04 - 安全与性能

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| PY04-01 | 禁止 `eval()` / `exec()` | 🔴 MUST | 代码注入风险 |
| PY04-02 | SQL 使用参数化查询 | 🔴 MUST | 禁止字符串拼接 SQL |
| PY04-03 | 使用 `secrets` 模块生成密钥 | 🔴 MUST | 禁止 `random` 用于安全场景 |
| PY04-04 | 文件操作使用 `with` 语句 | 🟡 SHOULD | 确保资源释放 |
| PY04-05 | 大列表使用生成器 | 🟡 SHOULD | 节省内存 |
| PY04-06 | 禁止 `pickle` 反序列化不可信数据 | 🔴 MUST | 任意代码执行风险 |

## PY05 - 项目结构

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| PY05-01 | 使用虚拟环境 | 🟡 SHOULD | venv / conda / poetry |
| PY05-02 | 依赖声明完整 | 🔴 MUST | requirements.txt / pyproject.toml |
| PY05-03 | `__init__.py` 仅做导出聚合 | 🟡 SHOULD | 不放业务逻辑 |
| PY05-04 | 测试与源码平行目录 | 🟢 NIT | `tests/` 与 `src/` 平级 |

## PY06 - 测试规范

| ID | 检查项 | 严重度 | 说明 |
|----|--------|--------|------|
| PY06-01 | 使用 pytest 框架 | 🟡 SHOULD | 优于 unittest |
| PY06-02 | fixture 替代 setUp/tearDown | 🟡 SHOULD | 依赖注入更灵活 |
| PY06-03 | 测试函数名 test_ 开头 | 🔴 MUST | pytest 发现机制 |
| PY06-04 | 参数化测试用 @pytest.mark.parametrize | 🟢 NIT | 减少重复 |
