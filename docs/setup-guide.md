# 环境配置操作手册

本手册面向新成员，指导完成本地开发环境的初始搭建，包括 VS Code 安装、GitHub Copilot 登录和墨刀 MCP 配置。

---

## 一、本地安装 VS Code

### 1.1 下载

前往 VS Code 官方网站下载对应系统的安装包：

- 官网地址：https://code.visualstudio.com/
- macOS：选择 **Apple Silicon**（M 系列芯片）或 **Intel** 版本
- Windows：选择 **User Installer** 或 **System Installer**

### 1.2 安装

**macOS**

1. 打开下载的 `.zip` 文件，解压后得到 `Visual Studio Code.app`
2. 将 `Visual Studio Code.app` 拖入 `/Applications` 文件夹
3. 首次打开时，如果系统提示"无法验证开发者"，前往 **系统设置 → 隐私与安全性**，点击 **仍要打开**

**Windows**

1. 双击下载的 `.exe` 安装程序
2. 按提示完成安装，建议勾选以下选项：
   - ✅ 将"通过 Code 打开"操作添加到文件上下文菜单
   - ✅ 将"通过 Code 打开"操作添加到目录上下文菜单
   - ✅ 将 Code 注册为受支持的文件类型的编辑器
   - ✅ 添加到 PATH

### 1.3 安装命令行工具（macOS）

1. 打开 VS Code
2. 按 `Cmd + Shift + P` 打开命令面板
3. 输入 `Shell Command: Install 'code' command in PATH` 并回车
4. 之后即可在终端使用 `code .` 打开当前目录

### 1.4 推荐基础设置

打开 VS Code 后，按 `Cmd + ,`（macOS）或 `Ctrl + ,`（Windows）进入 Settings，建议配置：

| 设置项 | 推荐值 | 说明 |
|--------|--------|------|
| Auto Save | `afterDelay` | 自动保存，避免丢失修改 |
| Font Size | `14` | 适合多数屏幕 |
| Tab Size | `2` | 与项目统一缩进 |
| Word Wrap | `on` | 长行自动换行 |

---

## 二、通过 GitHub Copilot 账户登录

### 2.1 前提条件

- 拥有 GitHub 账户
- 已订阅 GitHub Copilot（个人版、商业版或企业版均可）
  - 如未订阅，前往 https://github.com/features/copilot 开通

### 2.2 安装 GitHub Copilot 扩展

1. 打开 VS Code
2. 点击左侧 **扩展** 图标（或按 `Cmd + Shift + X`）
3. 搜索 **GitHub Copilot**
4. 安装以下两个扩展：
   - **GitHub Copilot** — 代码补全
   - **GitHub Copilot Chat** — 对话式交互（Agent 模式）

### 2.3 登录 GitHub 账户

1. 安装扩展后，VS Code 右下角会弹出登录提示，点击 **Sign in to GitHub**
2. 浏览器将自动打开 GitHub 授权页面
3. 点击 **Authorize Visual-Studio-Code**，完成 OAuth 授权
4. 返回 VS Code，状态栏应显示 Copilot 图标（已激活状态）

> **提示**：如果没有弹出提示，可以按 `Cmd + Shift + P`，输入 `GitHub Copilot: Sign In` 手动触发登录。

### 2.4 验证登录状态

1. 打开任意代码文件，输入一段注释（如 `// calculate sum of array`）
2. 如果 Copilot 在下方显示灰色的补全建议，说明已正常工作
3. 按 `Tab` 接受建议，或按 `Esc` 忽略

### 2.5 打开 Copilot Chat

1. 点击左侧活动栏的 **聊天图标**（💬），或按 `Cmd + Shift + I`
2. 在聊天面板中输入问题即可开始对话
3. 切换到 **Agent 模式**：在聊天输入框上方的下拉菜单中选择 `Agent`

---

## 三、配置墨刀 MCP

墨刀 MCP（`modao-proto-mcp`）用于在 VS Code 中通过 AI 生成 HTML 原型并导入墨刀平台。

### 3.1 前提条件

- Node.js 已安装（≥ 18），可通过 `node -v` 检查
- 已获取墨刀访问令牌（Token）

### 3.2 获取墨刀访问令牌

1. 登录 https://modao.cc
2. 进入 **个人设置** → **访问令牌 / API Token**
3. 创建或复制你的个人访问令牌

### 3.3 配置环境变量（推荐）

为避免令牌明文写入配置文件，建议通过环境变量注入：

**macOS / Linux**

编辑 `~/.zshrc`（或 `~/.bashrc`）：

```bash
export MODAO_TOKEN="你的墨刀访问令牌"
```

保存后执行：

```bash
source ~/.zshrc
```

**Windows（PowerShell）**

```powershell
[Environment]::SetEnvironmentVariable("MODAO_TOKEN", "你的墨刀访问令牌", "User")
```

设置后需重启 VS Code 使环境变量生效。

### 3.4 添加 MCP 配置

1. 按 `Cmd + Shift + P` 打开命令面板
2. 输入 `Preferences: Open User Settings (JSON)` 并回车
3. 在打开的 `settings.json` 中，确认是否已有 MCP 相关节点；如果没有，按以下方式添加

**方法 A：用户级 MCP 配置（推荐）**

打开 MCP 配置文件（路径为 `~/Library/Application Support/Code/User/mcp.json`，macOS），在 `servers` 节点中添加：

```json
{
  "servers": {
    "modao-proto-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modao-mcp/modao-proto-mcp",
        "--token=${MODAO_TOKEN}",
        "--url=https://modao.cc"
      ]
    }
  }
}
```

> 也可以通过命令面板输入 `MCP: Open User Configuration` 直接打开此文件。

**方法 B：工作区级 MCP 配置**

在项目根目录创建 `.vscode/mcp.json`：

```json
{
  "servers": {
    "modao-proto-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modao-mcp/modao-proto-mcp",
        "--token=${MODAO_TOKEN}",
        "--url=https://modao.cc"
      ]
    }
  }
}
```

### 3.5 验证 MCP 是否生效

1. 重启 VS Code（或重新加载窗口：`Cmd + Shift + P` → `Developer: Reload Window`）
2. 打开 Copilot Chat（`Cmd + Shift + I`），切换到 **Agent** 模式
3. 在输入框中输入以下测试指令：

   ```
   帮我生成一个简单登录页的设计说明
   ```

4. 如果 Agent 调用了 `gen_description` 工具并返回结构化设计说明，说明墨刀 MCP 已配置成功

### 3.6 墨刀 MCP 工具一览

配置成功后，Agent 模式下可使用以下 3 个工具：

| 工具 | 功能 | 典型用途 |
|------|------|----------|
| `gen_description` | 将简短需求扩写为结构化设计说明 | 在生成原型前对齐页面目标和交互细节 |
| `gen_html` | 根据设计说明生成 HTML 原型 | 快速生成可预览的页面原型 |
| `import_html` | 将 HTML 原型导入墨刀个人空间 | 导入墨刀后用于团队评审和协作 |

### 3.7 常见问题

| 问题 | 解决方案 |
|------|----------|
| `npx` 命令未找到 | 确认已安装 Node.js（≥ 18）并将其加入 PATH |
| Agent 模式未显示墨刀工具 | 检查 `mcp.json` 格式是否正确，重启 VS Code |
| 导入墨刀失败，提示 token 无效 | 检查环境变量 `MODAO_TOKEN` 是否正确设置，终端执行 `echo $MODAO_TOKEN` 验证 |
| 环境变量设置后未生效 | VS Code 需要完全退出后重新打开（不是 Reload Window） |

---

## 附录：完成检查清单

- [ ] VS Code 已安装并能正常打开
- [ ] `code` 命令可在终端使用
- [ ] GitHub Copilot 扩展已安装
- [ ] GitHub 账户已登录，Copilot 代码补全正常
- [ ] Copilot Chat 可正常对话
- [ ] Node.js ≥ 18 已安装
- [ ] `MODAO_TOKEN` 环境变量已配置
- [ ] 墨刀 MCP 配置已添加到 `mcp.json`
- [ ] Agent 模式下可调用墨刀 MCP 工具
