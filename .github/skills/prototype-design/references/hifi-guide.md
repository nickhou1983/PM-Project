# 高保真原型图（Hi-Fi Prototype）生成规范

## 概述

为 PRD 生成配套的 HTML 高保真原型图，用纯 HTML + CSS 实现（允许 Google Fonts 和 Lucide Icons CDN），呈现接近最终产品的视觉效果。
目的是让利益相关者直观感受产品的视觉设计、品牌调性和交互细节。

## 主题系统

根据产品定位自动选择最匹配的预设主题，通过 CSS 变量实现一键切换。

### 预设主题

**科技蓝（Tech Blue）** — 适合：工具类、SaaS、AI、开发者产品
```css
:root {
  --color-primary: #2563EB;
  --color-primary-hover: #1D4ED8;
  --color-primary-light: #EFF6FF;
  --color-secondary: #7C3AED;
  --color-secondary-light: #F5F3FF;
  --color-accent: #06B6D4;
  --color-surface: #FFFFFF;
  --color-surface-alt: #F8FAFC;
  --color-border: #E2E8F0;
  --color-border-hover: #CBD5E1;
  --color-text-primary: #0F172A;
  --color-text-secondary: #64748B;
  --color-text-tertiary: #94A3B8;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
  --gradient-primary: linear-gradient(135deg, #2563EB, #7C3AED);
  --gradient-surface: linear-gradient(180deg, #F8FAFC, #FFFFFF);
  --font-display: 'DM Sans', 'Noto Sans SC', sans-serif;
  --font-body: 'Noto Sans SC', 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

**自然绿（Nature Green）** — 适合：健康、环保、生活方式、社区类产品
```css
:root {
  --color-primary: #059669;
  --color-primary-hover: #047857;
  --color-primary-light: #ECFDF5;
  --color-secondary: #D97706;
  --color-secondary-light: #FFFBEB;
  --color-accent: #0891B2;
  --color-surface: #FFFFFF;
  --color-surface-alt: #F0FDF4;
  --color-border: #D1FAE5;
  --color-border-hover: #A7F3D0;
  --color-text-primary: #064E3B;
  --color-text-secondary: #4B5563;
  --color-text-tertiary: #9CA3AF;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #06B6D4;
  --gradient-primary: linear-gradient(135deg, #059669, #0891B2);
  --gradient-surface: linear-gradient(180deg, #F0FDF4, #FFFFFF);
  --font-display: 'DM Sans', 'Noto Sans SC', sans-serif;
  --font-body: 'Noto Sans SC', 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

**优雅紫（Elegant Purple）** — 适合：创意工具、社交、媒体、内容平台
```css
:root {
  --color-primary: #7C3AED;
  --color-primary-hover: #6D28D9;
  --color-primary-light: #F5F3FF;
  --color-secondary: #EC4899;
  --color-secondary-light: #FDF2F8;
  --color-accent: #F59E0B;
  --color-surface: #FFFFFF;
  --color-surface-alt: #FAF5FF;
  --color-border: #E9D5FF;
  --color-border-hover: #D8B4FE;
  --color-text-primary: #1E1B4B;
  --color-text-secondary: #6B7280;
  --color-text-tertiary: #9CA3AF;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #8B5CF6;
  --gradient-primary: linear-gradient(135deg, #7C3AED, #EC4899);
  --gradient-surface: linear-gradient(180deg, #FAF5FF, #FFFFFF);
  --font-display: 'DM Sans', 'Noto Sans SC', sans-serif;
  --font-body: 'Noto Sans SC', 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### 主题选择规则

根据 PRD 中的产品定位和目标用户自动匹配：
- 工具/效率/SaaS/AI/开发 → **科技蓝**
- 健康/环保/社区/生活/宠物/运动 → **自然绿**
- 创意/社交/媒体/内容/娱乐/视频 → **优雅紫**
- 若产品跨多个类别，选择最核心的用户场景对应的主题

## 外部依赖

高保真模式允许以下 CDN 资源：

```html
<!-- Google Fonts：中英文双字体 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet">

<!-- Lucide Icons：轻量 SVG 图标库 -->
<script src="https://unpkg.com/lucide@latest"></script>
```

> Lucide 图标使用方式：`<i data-lucide="icon-name"></i>`，在 body 末尾调用 `<script>lucide.createIcons();</script>` 初始化。

## 视觉规范

### 字体

```css
/* 标题/展示用字体 */
font-family: var(--font-display);

/* 正文/界面用字体 */
font-family: var(--font-body);
```

### 字号体系

```
页面主标题:   28px, font-weight: 700, letter-spacing: -0.02em
区块标题:     20px, font-weight: 600
卡片标题:     16px, font-weight: 600
正文:         14px, font-weight: 400, line-height: 1.6
辅助文字:     12px, font-weight: 400, color: var(--color-text-tertiary)
标签/徽章:    11px, font-weight: 500, text-transform: uppercase, letter-spacing: 0.05em
```

### 阴影体系

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
```

### 圆角体系

```css
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;
--radius-xl: 24px;
--radius-full: 9999px;
```

### 间距

```
页面内边距: 24px
卡片内边距: 20px
元素间距:   16px
紧凑间距:   8px
```

### 过渡动效

```css
/* 所有可交互元素默认过渡 */
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;

/* 页面入场动画 */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* 卡片内容依次入场 */
.card { animation: fadeInUp var(--transition-slow) both; }
.card:nth-child(1) { animation-delay: 0ms; }
.card:nth-child(2) { animation-delay: 80ms; }
.card:nth-child(3) { animation-delay: 160ms; }
.card:nth-child(4) { animation-delay: 240ms; }
```

## HTML 页面模板

每个高保真原型页面使用以下基础结构：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{页面名称} - {项目名称}</title>
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet">
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    /* === 主题变量（根据产品定位选择预设主题） === */
    :root {
      /* 粘贴对应主题的 CSS 变量 */

      /* 阴影体系 */
      --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
      --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);

      /* 圆角体系 */
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 16px;
      --radius-xl: 24px;
      --radius-full: 9999px;

      /* 过渡 */
      --transition-fast: 150ms ease;
      --transition-base: 200ms ease;
      --transition-slow: 300ms ease;
    }

    /* === 全局重置 === */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: var(--font-body);
      color: var(--color-text-primary);
      background: var(--gradient-surface);
      max-width: 375px;       /* 移动端优先，可改为 1200px 做桌面端 */
      margin: 0 auto;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }

    /* === 入场动画 === */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* === 通用组件样式 === */
    .header {
      background: var(--color-surface);
      padding: 16px 24px;
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      backdrop-filter: blur(10px);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .header h1 {
      font-family: var(--font-display);
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .content {
      padding: 24px;
    }

    .card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: var(--shadow-sm);
      transition: box-shadow var(--transition-base), border-color var(--transition-base), transform var(--transition-base);
      animation: fadeInUp var(--transition-slow) both;
    }
    .card:hover {
      box-shadow: var(--shadow-md);
      border-color: var(--color-border-hover);
      transform: translateY(-1px);
    }

    .btn-primary {
      background: var(--color-primary);
      color: #FFFFFF;
      border: none;
      padding: 12px 24px;
      border-radius: var(--radius-sm);
      font-family: var(--font-body);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: background var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast);
    }
    .btn-primary:hover {
      background: var(--color-primary-hover);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }
    .btn-primary:active {
      transform: translateY(0) scale(0.98);
    }

    .btn-secondary {
      background: var(--color-surface);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border);
      padding: 12px 24px;
      border-radius: var(--radius-sm);
      font-family: var(--font-body);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: background var(--transition-fast), border-color var(--transition-fast);
    }
    .btn-secondary:hover {
      background: var(--color-surface-alt);
      border-color: var(--color-border-hover);
    }

    .btn-ghost {
      background: transparent;
      color: var(--color-primary);
      border: none;
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      font-family: var(--font-body);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background var(--transition-fast);
    }
    .btn-ghost:hover {
      background: var(--color-primary-light);
    }

    .btn-danger {
      background: var(--color-error);
      color: #FFFFFF;
      border: none;
      padding: 12px 24px;
      border-radius: var(--radius-sm);
      font-family: var(--font-body);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity var(--transition-fast);
    }
    .btn-danger:hover { opacity: 0.9; }

    .img-placeholder {
      background: linear-gradient(135deg, var(--color-surface-alt), var(--color-border));
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-tertiary);
      font-size: 12px;
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .input-field {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-family: var(--font-body);
      font-size: 14px;
      background: var(--color-surface);
      color: var(--color-text-primary);
      margin-bottom: 16px;
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
      outline: none;
    }
    .input-field::placeholder {
      color: var(--color-text-tertiary);
    }
    .input-field:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-light);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.03em;
    }
    .badge-primary {
      background: var(--color-primary-light);
      color: var(--color-primary);
    }
    .badge-success {
      background: #ECFDF5;
      color: var(--color-success);
    }
    .badge-warning {
      background: #FFFBEB;
      color: var(--color-warning);
    }
    .badge-error {
      background: #FEF2F2;
      color: var(--color-error);
    }

    .progress-bar {
      width: 100%;
      height: 6px;
      background: var(--color-border);
      border-radius: var(--radius-full);
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      background: var(--gradient-primary);
      border-radius: var(--radius-full);
      transition: width 0.6s ease;
    }

    .star-rating {
      display: inline-flex;
      gap: 2px;
      color: var(--color-warning);
      font-size: 16px;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      background: var(--gradient-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-weight: 600;
      font-size: 14px;
      flex-shrink: 0;
    }

    .divider {
      height: 1px;
      background: var(--color-border);
      margin: 16px 0;
    }

    .tab-bar {
      display: flex;
      border-top: 1px solid var(--color-border);
      background: var(--color-surface);
      position: fixed;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      max-width: 375px;
      width: 100%;
      backdrop-filter: blur(10px);
      z-index: 100;
    }
    .tab-bar a {
      flex: 1;
      text-align: center;
      padding: 8px 0 6px;
      font-size: 11px;
      color: var(--color-text-tertiary);
      text-decoration: none;
      border-top: 2px solid transparent;
      transition: color var(--transition-fast), border-color var(--transition-fast);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .tab-bar a i { width: 20px; height: 20px; }
    .tab-bar a.active {
      color: var(--color-primary);
      border-top-color: var(--color-primary);
      font-weight: 600;
    }

    .nav-link {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 500;
      transition: opacity var(--transition-fast);
    }
    .nav-link:hover { opacity: 0.8; }

    .chip {
      display: inline-flex;
      align-items: center;
      padding: 6px 14px;
      border-radius: var(--radius-full);
      font-size: 13px;
      font-weight: 500;
      background: var(--color-surface-alt);
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .chip:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
      background: var(--color-primary-light);
    }
    .chip.active {
      background: var(--color-primary);
      color: #FFFFFF;
      border-color: var(--color-primary);
    }

    .text-secondary { color: var(--color-text-secondary); font-size: 13px; }
    .text-tertiary { color: var(--color-text-tertiary); font-size: 12px; }
    .mt-8 { margin-top: 8px; }
    .mt-16 { margin-top: 16px; }
    .mb-8 { margin-bottom: 8px; }
    .mb-16 { margin-bottom: 16px; }
    .flex { display: flex; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-center { display: flex; align-items: center; }
    .gap-8 { gap: 8px; }
    .gap-12 { gap: 12px; }
    .gap-16 { gap: 16px; }
  </style>
</head>
<body>
  <!-- 页面内容区 -->

  <!-- Lucide 图标初始化（放在 body 末尾） -->
  <script>lucide.createIcons();</script>
</body>
</html>
```

## 导航首页模板（index.html）

```html
<!-- 在 <body> 中 -->
<div class="header">
  <h1>{项目名称}</h1>
  <span class="badge badge-primary">原型预览</span>
</div>
<div class="content">
  <p class="text-secondary mb-16">
    高保真原型（Hi-Fi Prototype）— 展示产品的真实视觉效果与核心交互流程。点击页面名称进入。
  </p>

  <div class="card" style="background: var(--gradient-primary); color: #fff; border: none;">
    <div style="font-size: 13px; opacity: 0.85; margin-bottom: 4px;">核心流程</div>
    <div style="font-size: 15px; font-weight: 600;">{描述核心用户操作流程}</div>
  </div>

  <h3 style="font-size: 16px; font-weight: 600; margin: 20px 0 12px; display: flex; align-items: center; gap: 8px;">
    <i data-lucide="layout-grid" style="width:18px; height:18px; color: var(--color-primary);"></i>
    页面列表
  </h3>

  <!-- 每个页面一个卡片 -->
  <a href="{文件名}.html" style="text-decoration: none; color: inherit;">
    <div class="card flex-between">
      <div class="flex-center gap-12">
        <div style="width:40px; height:40px; border-radius: var(--radius-sm); background: var(--color-primary-light); display:flex; align-items:center; justify-content:center;">
          <i data-lucide="{对应图标}" style="width:20px; height:20px; color: var(--color-primary);"></i>
        </div>
        <div>
          <div style="font-size:15px; font-weight:600;">{页面名称}</div>
          <div class="text-tertiary" style="margin-top:2px;">{功能描述}</div>
        </div>
      </div>
      <div class="flex-center gap-8">
        <span class="badge badge-primary">P0</span>
        <i data-lucide="chevron-right" style="width:16px; height:16px; color: var(--color-text-tertiary);"></i>
      </div>
    </div>
  </a>
  <!-- 重复... -->
</div>

<script>lucide.createIcons();</script>
```

## 常用 UI 模式

### 1. 列表项（内容卡片）

```html
<a href="{详情页}.html" style="text-decoration: none; color: inherit;">
  <div class="card flex gap-12">
    <div class="img-placeholder" style="width:88px; height:88px; flex-shrink:0; border-radius: var(--radius-md);">
      <i data-lucide="image" style="width:24px; height:24px; opacity:0.4;"></i>
    </div>
    <div style="flex:1; min-width:0;">
      <div style="font-size:15px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">标题文字</div>
      <div class="text-secondary" style="margin-top:4px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">描述文字，最多显示两行内容，超出部分会自动截断...</div>
      <div class="flex-between mt-8">
        <div class="flex-center gap-8">
          <span class="badge badge-primary">标签</span>
          <span class="star-rating">★★★★☆</span>
        </div>
        <span class="text-tertiary">附加信息</span>
      </div>
    </div>
  </div>
</a>
```

### 2. 表单

```html
<div class="card">
  <label style="font-size:13px; color: var(--color-text-secondary); display:block; margin-bottom:6px; font-weight:500;">字段名称 <span style="color: var(--color-error);">*</span></label>
  <input class="input-field" type="text" placeholder="请输入...">

  <label style="font-size:13px; color: var(--color-text-secondary); display:block; margin-bottom:6px; font-weight:500;">多行输入</label>
  <textarea class="input-field" rows="4" placeholder="请输入详细内容..." style="resize:vertical;"></textarea>

  <label style="font-size:13px; color: var(--color-text-secondary); display:block; margin-bottom:6px; font-weight:500;">选择标签</label>
  <div class="flex gap-8 mb-16" style="flex-wrap:wrap;">
    <span class="chip active">标签一</span>
    <span class="chip">标签二</span>
    <span class="chip">标签三</span>
  </div>

  <button class="btn-primary" style="width:100%;">
    <i data-lucide="check" style="width:16px; height:16px;"></i>
    提交
  </button>
</div>
```

### 3. 图片网格（瀑布流/宫格）

```html
<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
  <div style="border-radius: var(--radius-md); overflow:hidden; box-shadow: var(--shadow-sm);">
    <div class="img-placeholder" style="height:130px;">
      <i data-lucide="image" style="width:24px; height:24px; opacity:0.3;"></i>
    </div>
    <div style="padding:10px 12px; background: var(--color-surface);">
      <div style="font-size:13px; font-weight:600;">图片标题</div>
      <div class="flex-between mt-8">
        <div class="flex-center gap-8">
          <div class="avatar" style="width:20px; height:20px; font-size:10px;">U</div>
          <span class="text-tertiary">用户名</span>
        </div>
        <span class="text-tertiary flex-center gap-8"><i data-lucide="heart" style="width:12px; height:12px;"></i> 42</span>
      </div>
    </div>
  </div>
  <!-- 高度可交错：130px / 170px / 150px 等，营造瀑布流效果 -->
</div>
```

### 4. 地图占位

```html
<div class="img-placeholder" style="height:220px; border-radius: var(--radius-lg); border:1px solid var(--color-border); position:relative; overflow:hidden;">
  <!-- 模拟地图纹理 -->
  <div style="position:absolute; inset:0; opacity:0.08; background-image: radial-gradient(circle, var(--color-primary) 1px, transparent 1px); background-size: 20px 20px;"></div>
  <div style="text-align:center; position: relative; z-index:1;">
    <i data-lucide="map-pin" style="width:32px; height:32px; color: var(--color-primary);"></i>
    <div style="margin-top:8px; font-size:13px; font-weight:500; color: var(--color-text-secondary);">地图区域</div>
  </div>
</div>
```

### 5. 搜索栏

```html
<div style="padding:12px 24px; background: var(--color-surface); border-bottom:1px solid var(--color-border); position:sticky; top:0; z-index:50;">
  <div style="display:flex; gap:10px;">
    <div style="flex:1; position:relative;">
      <i data-lucide="search" style="width:16px; height:16px; position:absolute; left:14px; top:50%; transform:translateY(-50%); color: var(--color-text-tertiary);"></i>
      <input class="input-field" style="margin-bottom:0; padding-left:40px;" type="text" placeholder="搜索...">
    </div>
    <button class="btn-secondary" style="white-space:nowrap; padding:12px 16px;">
      <i data-lucide="sliders-horizontal" style="width:16px; height:16px;"></i>
    </button>
  </div>
  <!-- 可选：筛选标签 -->
  <div class="flex gap-8 mt-8" style="overflow-x:auto; padding-bottom:4px;">
    <span class="chip active">全部</span>
    <span class="chip">分类1</span>
    <span class="chip">分类2</span>
    <span class="chip">分类3</span>
  </div>
</div>
```

### 6. 评论/互动区

```html
<div class="card">
  <div class="flex gap-12" style="align-items:flex-start;">
    <div class="avatar">A</div>
    <div style="flex:1;">
      <div class="flex-between">
        <div>
          <span style="font-size:14px; font-weight:600;">用户名</span>
          <span class="text-tertiary" style="margin-left:8px;">3小时前</span>
        </div>
        <button class="btn-ghost" style="padding:4px;">
          <i data-lucide="more-horizontal" style="width:16px; height:16px;"></i>
        </button>
      </div>
      <p style="font-size:14px; line-height:1.6; margin-top:8px; color: var(--color-text-primary);">评论内容文本，支持多行显示。这是一条高质量的用户评价...</p>
      <div class="flex gap-16 mt-8">
        <button class="btn-ghost" style="padding:4px 8px; font-size:13px;">
          <i data-lucide="thumbs-up" style="width:14px; height:14px;"></i> 12
        </button>
        <button class="btn-ghost" style="padding:4px 8px; font-size:13px;">
          <i data-lucide="message-circle" style="width:14px; height:14px;"></i> 回复
        </button>
        <button class="btn-ghost" style="padding:4px 8px; font-size:13px;">
          <i data-lucide="share-2" style="width:14px; height:14px;"></i> 分享
        </button>
      </div>
    </div>
  </div>
</div>
```

### 7. 底部标签导航

```html
<div class="tab-bar">
  <a href="home.html" class="active">
    <i data-lucide="home"></i>
    首页
  </a>
  <a href="explore.html">
    <i data-lucide="compass"></i>
    发现
  </a>
  <a href="publish.html">
    <i data-lucide="plus-circle"></i>
    发布
  </a>
  <a href="message.html">
    <i data-lucide="message-square"></i>
    消息
  </a>
  <a href="profile.html">
    <i data-lucide="user"></i>
    我的
  </a>
</div>
```

## 额外组件参考

以下组件在高保真模式中可按需使用：

### 空状态

```html
<div style="text-align:center; padding:48px 24px;">
  <i data-lucide="inbox" style="width:48px; height:48px; color: var(--color-text-tertiary); margin-bottom:16px;"></i>
  <div style="font-size:16px; font-weight:600; margin-bottom:8px;">暂无内容</div>
  <div class="text-secondary" style="margin-bottom:24px;">这里还没有任何数据</div>
  <button class="btn-primary">
    <i data-lucide="plus" style="width:16px; height:16px;"></i>
    创建第一个
  </button>
</div>
```

### 统计卡片

```html
<div class="flex gap-12">
  <div class="card" style="flex:1; text-align:center;">
    <div class="text-tertiary" style="margin-bottom:4px;">总数</div>
    <div style="font-size:24px; font-weight:700; color: var(--color-primary);">128</div>
  </div>
  <div class="card" style="flex:1; text-align:center;">
    <div class="text-tertiary" style="margin-bottom:4px;">今日</div>
    <div style="font-size:24px; font-weight:700; color: var(--color-success);">+12</div>
  </div>
  <div class="card" style="flex:1; text-align:center;">
    <div class="text-tertiary" style="margin-bottom:4px;">评分</div>
    <div style="font-size:24px; font-weight:700; color: var(--color-warning);">4.8</div>
  </div>
</div>
```

### Toast 提示

```html
<div style="position:fixed; top:24px; left:50%; transform:translateX(-50%); background: var(--color-text-primary); color:#fff; padding:12px 24px; border-radius: var(--radius-full); font-size:14px; display:flex; align-items:center; gap:8px; box-shadow: var(--shadow-lg); z-index:200;">
  <i data-lucide="check-circle" style="width:16px; height:16px; color: var(--color-success);"></i>
  操作成功
</div>
```

## 生成规则

1. **页面数量**：3-8 个页面，覆盖所有 P0 功能的关键界面
2. **设备适配**：默认移动端优先（max-width: 375px），如产品定位为桌面端则使用 max-width: 1200px
3. **交互链接**：页面之间通过 `<a href="xxx.html">` 相对链接跳转，形成可点击的流程
4. **允许外部依赖**：仅限 Google Fonts CDN 和 Lucide Icons CDN
5. **主题一致**：所有页面使用同一套主题 CSS 变量，确保视觉一致性
6. **占位内容**：使用渐变色块 + Lucide 图标代替真实图片，比灰色块更有层次
7. **语义清晰**：每个占位元素要有说明文字或图标暗示其内容类型
8. **导航首页**：必须生成 `index.html` 作为原型入口，列出所有页面及其功能说明
9. **文件命名**：使用小写英文 + 连字符，如 `home.html`、`post-detail.html`
10. **交互反馈**：所有可点击元素必须有 hover 状态变化（颜色/阴影/位移）
11. **内容入场**：使用 `fadeInUp` 动画让页面内容有序入场，提升精致感
12. **图标使用**：使用 Lucide 图标替代 emoji，确保专业统一的视觉风格
