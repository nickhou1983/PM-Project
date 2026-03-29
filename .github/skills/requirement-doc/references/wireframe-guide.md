# 原型图（Wireframe）生成规范

## 概述

为 PRD 生成配套的 HTML 低保真原型图（wireframe），用纯 HTML + 内联 CSS 实现，不依赖外部框架或 CDN。
目的是表达页面布局和交互逻辑，而非视觉设计。

## 视觉规范

### 配色（灰度系）

```
背景色:       #FFFFFF（白色）
卡片/区块背景: #F5F5F5（浅灰）
边框:          #D0D0D0（中灰）
占位区域:      #E0E0E0（灰色，用于图片/图标占位）
主文字:        #333333（深灰）
次文字:        #888888（中灰）
主操作按钮:    #555555 背景 + #FFFFFF 文字
次操作按钮:    #FFFFFF 背景 + #555555 文字 + 1px #AAAAAA 边框
链接/可交互:   #4A90D9（蓝灰色，仅用于表示可点击）
```

### 字体

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

### 字号体系

```
页面标题:   24px, font-weight: 700
区块标题:   18px, font-weight: 600
正文:       14px, font-weight: 400
辅助文字:   12px, font-weight: 400, color: #888
```

### 间距

```
页面内边距: 24px
卡片内边距: 16px
元素间距:   12px
```

## HTML 页面模板

每个原型页面使用以下基础结构：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{页面名称} - {项目名称} 原型</title>
  <style>
    /* === 全局重置 === */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #333;
      background: #fff;
      max-width: 375px;       /* 移动端优先，可改为 1200px 做桌面端 */
      margin: 0 auto;
      border: 1px solid #d0d0d0;
      min-height: 100vh;
    }

    /* === 通用组件样式 === */
    .header {
      background: #f5f5f5;
      padding: 12px 24px;
      border-bottom: 1px solid #d0d0d0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header h1 { font-size: 18px; font-weight: 600; }

    .content { padding: 24px; }

    .card {
      background: #f5f5f5;
      border: 1px solid #d0d0d0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
    }

    .btn-primary {
      background: #555;
      color: #fff;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      text-align: center;
    }

    .btn-secondary {
      background: #fff;
      color: #555;
      border: 1px solid #aaa;
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      text-align: center;
    }

    .img-placeholder {
      background: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #888;
      font-size: 12px;
      border-radius: 4px;
    }

    .input-field {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d0d0d0;
      border-radius: 6px;
      font-size: 14px;
      background: #fff;
      margin-bottom: 12px;
    }

    .tab-bar {
      display: flex;
      border-top: 1px solid #d0d0d0;
      background: #f5f5f5;
      position: fixed;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      max-width: 375px;
      width: 100%;
    }
    .tab-bar a {
      flex: 1;
      text-align: center;
      padding: 8px 0;
      font-size: 12px;
      color: #888;
      text-decoration: none;
      border-top: 2px solid transparent;
    }
    .tab-bar a.active {
      color: #333;
      border-top-color: #555;
      font-weight: 600;
    }

    .nav-link {
      color: #4a90d9;
      text-decoration: none;
    }
    .nav-link:hover { text-decoration: underline; }

    .text-secondary { color: #888; font-size: 12px; }
    .mt-12 { margin-top: 12px; }
    .mb-12 { margin-bottom: 12px; }
    .flex { display: flex; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .gap-12 { gap: 12px; }
  </style>
</head>
<body>
  <!-- 页面内容区 -->
</body>
</html>
```

## 导航首页模板（index.html）

```html
<!-- 在 <body> 中 -->
<div class="header">
  <h1>{项目名称} — 原型导航</h1>
</div>
<div class="content">
  <p class="text-secondary mb-12">
    低保真原型图（wireframe），展示页面布局与核心交互流程。点击页面名称进入。
  </p>

  <div class="card">
    <h3 style="font-size:16px; margin-bottom:8px;">核心流程</h3>
    <p class="text-secondary">{描述核心用户操作流程，如：注册 → 浏览首页 → 查看详情 → 互动}</p>
  </div>

  <h3 style="font-size:16px; margin:16px 0 8px;">页面列表</h3>
  <!-- 每个页面一个卡片 -->
  <div class="card flex-between">
    <div>
      <a href="{文件名}.html" class="nav-link" style="font-size:15px; font-weight:600;">{页面名称}</a>
      <p class="text-secondary" style="margin-top:4px;">{功能描述}</p>
    </div>
    <span class="text-secondary">P0</span>
  </div>
  <!-- 重复... -->
</div>
```

## 常用 UI 模式

### 1. 列表项（内容卡片）

```html
<div class="card flex" style="gap:12px;">
  <div class="img-placeholder" style="width:80px; height:80px; flex-shrink:0;">图片</div>
  <div style="flex:1;">
    <div style="font-size:15px; font-weight:600;">标题文字</div>
    <div class="text-secondary" style="margin-top:4px;">描述文字，最多两行...</div>
    <div class="flex-between mt-12">
      <span class="text-secondary">附加信息</span>
      <span class="text-secondary">操作</span>
    </div>
  </div>
</div>
```

### 2. 表单

```html
<div class="card">
  <label style="font-size:12px; color:#888; display:block; margin-bottom:4px;">字段名称</label>
  <input class="input-field" type="text" placeholder="请输入...">

  <label style="font-size:12px; color:#888; display:block; margin-bottom:4px;">多行输入</label>
  <textarea class="input-field" rows="4" placeholder="请输入详细内容..."></textarea>

  <button class="btn-primary" style="width:100%; margin-top:8px;">提交</button>
</div>
```

### 3. 图片网格（瀑布流/宫格）

```html
<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
  <div class="img-placeholder" style="height:120px; border-radius:8px;">风景图1</div>
  <div class="img-placeholder" style="height:160px; border-radius:8px;">风景图2</div>
  <div class="img-placeholder" style="height:140px; border-radius:8px;">风景图3</div>
  <div class="img-placeholder" style="height:120px; border-radius:8px;">风景图4</div>
</div>
```

### 4. 地图占位

```html
<div class="img-placeholder" style="height:200px; border-radius:8px; border:1px solid #d0d0d0;">
  <div style="text-align:center;">
    <div style="font-size:24px;">🗺️</div>
    <div style="margin-top:4px;">地图区域</div>
  </div>
</div>
```

### 5. 搜索栏

```html
<div style="padding:12px 24px; background:#f5f5f5; border-bottom:1px solid #d0d0d0;">
  <div style="display:flex; gap:8px;">
    <input class="input-field" style="margin-bottom:0; flex:1;" type="text" placeholder="🔍 搜索...">
    <button class="btn-secondary" style="white-space:nowrap;">筛选</button>
  </div>
</div>
```

### 6. 评论/互动区

```html
<div class="card">
  <div class="flex" style="gap:8px; align-items:center; margin-bottom:8px;">
    <div class="img-placeholder" style="width:32px; height:32px; border-radius:50%;">头像</div>
    <div>
      <div style="font-size:14px; font-weight:600;">用户名</div>
      <div class="text-secondary">3小时前</div>
    </div>
  </div>
  <p style="font-size:14px;">评论内容文本...</p>
  <div class="flex mt-12" style="gap:16px;">
    <span class="text-secondary" style="cursor:pointer;">👍 12</span>
    <span class="text-secondary" style="cursor:pointer;">💬 回复</span>
  </div>
</div>
```

### 7. 底部标签导航

```html
<div class="tab-bar">
  <a href="home.html" class="active">🏠<br>首页</a>
  <a href="explore.html">🔍<br>发现</a>
  <a href="publish.html">➕<br>发布</a>
  <a href="message.html">💬<br>消息</a>
  <a href="profile.html">👤<br>我的</a>
</div>
```

## 生成规则

1. **页面数量**：3-8 个页面，覆盖所有 P0 功能的关键界面
2. **设备适配**：默认移动端优先（max-width: 375px），如产品定位为桌面端则使用 max-width: 1200px
3. **交互链接**：页面之间通过 `<a href="xxx.html">` 相对链接跳转，形成可点击的流程
4. **零外部依赖**：不使用任何 CDN、外部 CSS/JS 框架，纯 HTML + 内联 CSS
5. **占位内容**：使用灰色区块 + 文字标注代替真实图片和数据
6. **语义清晰**：每个占位元素要有说明文字，让阅读者理解该位置的内容含义
7. **导航首页**：必须生成 `index.html` 作为原型入口，列出所有页面及其功能说明
8. **文件命名**：使用小写英文 + 连字符，如 `home.html`、`post-detail.html`、`user-profile.html`
