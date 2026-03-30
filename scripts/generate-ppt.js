#!/usr/bin/env node
"use strict";
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const https = require("https");

// ─── Palette ────────────────────────────────────────────────────────
const C = {
  navy:   "0F172A",
  pri:    "0D4F8B",
  sec:    "1A8FBF",
  amber:  "F59E0B",
  light:  "F8FAFC",
  white:  "FFFFFF",
  text:   "1E293B",
  muted:  "64748B",
  card:   "F1F5F9",
  teal:   "0D9488",
  green:  "16A34A",
  purple: "7C3AED",
  rose:   "E11D48",
};
const FONT_H = "Georgia";
const FONT_B = "Calibri";

// ─── Icon helpers ───────────────────────────────────────────────────
const {
  FaLightbulb, FaFileAlt, FaPalette, FaSitemap, FaTasks,
  FaExclamationCircle, FaClock, FaSearch, FaLink,
  FaBook, FaGlobe, FaChartLine, FaClipboardList,
  FaDesktop, FaShareAlt, FaPaintBrush, FaProjectDiagram,
  FaGithub, FaComments, FaPencilRuler, FaCode,
  FaRocket, FaMousePointer, FaMagic, FaArrowRight,
  FaCheckCircle, FaRobot, FaUsers, FaBug, FaShieldAlt,
  FaVial, FaEye, FaCog, FaLayerGroup, FaPlay
} = require("react-icons/fa");

async function icon64(Comp, color, sz = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(Comp, { color, size: String(sz) })
  );
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// ─── Image download ─────────────────────────────────────────────────
function dl(url, dest) {
  return new Promise((resolve) => {
    const out = fs.createWriteStream(dest);
    const get = (u) => {
      https.get(u, { timeout: 20000 }, (res) => {
        if ([301, 302, 307].includes(res.statusCode) && res.headers.location) {
          get(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) { out.close(); resolve(null); return; }
        res.pipe(out);
        out.on("finish", () => { out.close(); resolve(dest); });
      }).on("error", () => { out.close(); resolve(null); })
        .on("timeout", function () { this.destroy(); resolve(null); });
    };
    get(url);
  });
}

// ─── Reusable factories (never reuse objects) ───────────────────────
const shadow = () => ({ type: "outer", color: "000000", blur: 6, offset: 2, angle: 135, opacity: 0.12 });
const cardShadow = () => ({ type: "outer", color: "000000", blur: 8, offset: 3, angle: 135, opacity: 0.10 });

function titleBar(slide, text, dark = false) {
  slide.addText(text, {
    x: 0.5, y: 0.25, w: 9, h: 0.65,
    fontSize: 28, fontFace: FONT_H, bold: true,
    color: dark ? C.white : C.navy, margin: 0,
  });
  // amber accent
  slide.addShape("rect", {
    x: 0.5, y: 0.95, w: 1.2, h: 0.06,
    fill: { color: C.amber },
  });
}

function addCard(slide, x, y, w, h, fill = C.white) {
  slide.addShape("rect", { x, y, w, h, fill: { color: fill }, shadow: cardShadow() });
}

function addAccentBar(slide, x, y, h, color = C.amber) {
  slide.addShape("rect", { x, y, w: 0.07, h, fill: { color } });
}

// ─── Main ───────────────────────────────────────────────────────────
async function main() {
  console.log("⏳ 准备图标…");
  const I = {};
  const iconList = [
    ["lightbulb", FaLightbulb, C.amber],
    ["file", FaFileAlt, C.pri],
    ["palette", FaPalette, C.purple],
    ["sitemap", FaSitemap, C.pri],
    ["tasks", FaTasks, C.teal],
    ["excl", FaExclamationCircle, C.rose],
    ["clock", FaClock, C.amber],
    ["search", FaSearch, C.sec],
    ["link", FaLink, C.muted],
    ["book", FaBook, C.teal],
    ["globe", FaGlobe, C.sec],
    ["chart", FaChartLine, C.teal],
    ["clipboard", FaClipboardList, C.pri],
    ["desktop", FaDesktop, C.pri],
    ["share", FaShareAlt, C.sec],
    ["brush", FaPaintBrush, C.purple],
    ["project", FaProjectDiagram, C.pri],
    ["github", FaGithub, C.text],
    ["comments", FaComments, C.sec],
    ["pencil", FaPencilRuler, C.purple],
    ["code", FaCode, C.teal],
    ["rocket", FaRocket, C.amber],
    ["mouse", FaMousePointer, C.pri],
    ["magic", FaMagic, C.purple],
    ["arrow", FaArrowRight, C.muted],
    ["check", FaCheckCircle, C.teal],
    ["robot", FaRobot, C.sec],
    ["users", FaUsers, C.pri],
    ["bug", FaBug, C.rose],
    ["shield", FaShieldAlt, C.rose],
    ["vial", FaVial, C.teal],
    ["eye", FaEye, C.pri],
    ["cog", FaCog, C.muted],
    ["layers", FaLayerGroup, C.pri],
    ["play", FaPlay, C.amber],
  ];
  for (const [k, Comp, c] of iconList) {
    I[k] = await icon64(Comp, "#" + c);
  }

  console.log("⏳ 下载封面背景图…");
  const tmpDir = path.join(__dirname, "..", ".tmp");
  fs.mkdirSync(tmpDir, { recursive: true });
  const bgPath = path.join(tmpDir, "cover-bg.jpg");
  const bgImg = await dl(
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=75&fit=crop",
    bgPath
  );
  if (!bgImg) {
    // fallback
    await dl(
      "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=1600&q=75&fit=crop",
      bgPath
    );
  }
  const hasBg = fs.existsSync(bgPath) && fs.statSync(bgPath).size > 10000;

  console.log("⏳ 生成幻灯片…");
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "PM-Project";
  pres.title = "AI 驱动的产品经理工作台";

  // ════════════════════════════════════════════════════════════════════
  // SLIDE 1 — Cover
  // ════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };
    if (hasBg) {
      s.addImage({ path: bgPath, x: 0, y: 0, w: 10, h: 5.625, transparency: 50 });
    }
    // dark overlay
    s.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.navy, transparency: 40 } });
    // decorative circles
    s.addShape("ellipse", { x: 7.5, y: -0.5, w: 3.5, h: 3.5, fill: { color: C.pri, transparency: 70 } });
    s.addShape("ellipse", { x: 8.2, y: 2.5, w: 2.5, h: 2.5, fill: { color: C.sec, transparency: 75 } });
    // amber accent line
    s.addShape("rect", { x: 0.8, y: 1.7, w: 1.5, h: 0.06, fill: { color: C.amber } });
    // title
    s.addText("AI 驱动的产品经理工作台", {
      x: 0.8, y: 1.9, w: 7, h: 1.0,
      fontSize: 38, fontFace: FONT_H, bold: true, color: C.white, margin: 0,
    });
    // subtitle
    s.addText("从灵感到开发的全链路自动化", {
      x: 0.8, y: 2.9, w: 7, h: 0.6,
      fontSize: 20, fontFace: FONT_B, color: C.sec, margin: 0,
    });
    // bottom info
    s.addText("PM-Project  |  基于 GitHub Copilot 自定义 Agent & Skill", {
      x: 0.8, y: 4.8, w: 8, h: 0.4,
      fontSize: 12, fontFace: FONT_B, color: C.muted, margin: 0,
    });
  }

  // ════════════════════════════════════════════════════════════════════
  // SLIDE 2 — Pain Points
  // ════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.light };
    titleBar(s, "产品经理面临的挑战");

    const pains = [
      { icon: I.excl,  title: "灵感评估靠直觉", desc: "缺乏数据支撑，立项决策全凭经验，\n容易做重复或无价值的需求" },
      { icon: I.clock, title: "PRD 手写耗时", desc: "逐章节填写、格式不统一，\n反复修改导致交付周期长" },
      { icon: I.search, title: "竞品调研散乱", desc: "信息来源分散、无标准流程，\n调研结果无法沉淀复用" },
      { icon: I.link,  title: "PRD → 开发断链", desc: "需求到架构、任务拆分全靠人工，\n关键信息在流转中丢失" },
    ];

    const cw = 4.3, ch = 1.7, gx = 0.4, gy = 0.4;
    pains.forEach((p, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const cx = 0.5 + col * (cw + gx);
      const cy = 1.35 + row * (ch + gy);
      addCard(s, cx, cy, cw, ch);
      addAccentBar(s, cx, cy, ch, C.amber);
      s.addImage({ data: p.icon, x: cx + 0.3, y: cy + 0.3, w: 0.42, h: 0.42 });
      s.addText(p.title, {
        x: cx + 0.85, y: cy + 0.2, w: cw - 1.1, h: 0.4,
        fontSize: 15, fontFace: FONT_B, bold: true, color: C.text, margin: 0,
      });
      s.addText(p.desc, {
        x: cx + 0.85, y: cy + 0.65, w: cw - 1.1, h: 0.9,
        fontSize: 11, fontFace: FONT_B, color: C.muted, margin: 0, lineSpacingMultiple: 1.3,
      });
    });
  }

  // ════════════════════════════════════════════════════════════════════
  // SLIDE 3 — Flow Overview
  // ════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    titleBar(s, "端到端自动化流水线");

    const steps = [
      { num: "1", label: "立项验证", sub: "PM-assistant", color: C.amber, icon: I.lightbulb },
      { num: "2", label: "PRD 生成", sub: "requirement-doc", color: C.pri, icon: I.file },
      { num: "3", label: "高保真原型", sub: "Designer", color: C.purple, icon: I.palette },
      { num: "4", label: "架构设计", sub: "Architect", color: C.teal, icon: I.sitemap },
      { num: "5", label: "任务拆分", sub: "req-to-issues", color: C.sec, icon: I.tasks },
      { num: "6", label: "评审与复盘", sub: "gate-review", color: C.rose, icon: I.shield },
    ];

    const sw = 1.35, sh = 2.3, gap = 0.15;
    const totalW = steps.length * sw + (steps.length - 1) * gap;
    const startX = (10 - totalW) / 2;
    const sy = 1.5;

    steps.forEach((st, i) => {
      const sx = startX + i * (sw + gap);
      // card
      s.addShape("rect", { x: sx, y: sy, w: sw, h: sh, fill: { color: C.white }, shadow: shadow() });
      // top color bar
      s.addShape("rect", { x: sx, y: sy, w: sw, h: 0.08, fill: { color: st.color } });
      // number circle
      s.addShape("ellipse", {
        x: sx + sw / 2 - 0.25, y: sy + 0.25, w: 0.5, h: 0.5,
        fill: { color: st.color },
      });
      s.addText(st.num, {
        x: sx + sw / 2 - 0.25, y: sy + 0.25, w: 0.5, h: 0.5,
        fontSize: 16, fontFace: FONT_B, bold: true, color: C.white, align: "center", valign: "middle", margin: 0,
      });
      // icon
      s.addImage({ data: st.icon, x: sx + sw / 2 - 0.22, y: sy + 0.9, w: 0.44, h: 0.44 });
      // label
      s.addText(st.label, {
        x: sx, y: sy + 1.45, w: sw, h: 0.4,
        fontSize: 13, fontFace: FONT_B, bold: true, color: C.text, align: "center", margin: 0,
      });
      // sub
      s.addText(st.sub, {
        x: sx, y: sy + 1.8, w: sw, h: 0.35,
        fontSize: 9, fontFace: FONT_B, color: C.muted, align: "center", margin: 0,
      });

      // arrow between cards
      if (i < steps.length - 1) {
        s.addImage({ data: I.arrow, x: sx + sw + 0.02, y: sy + sh / 2 - 0.12, w: 0.22, h: 0.22 });
      }
    });

    // bottom tagline
    s.addText("每一步都有结构化输出，Stage-Gate 质量关卡确保产出物达标", {
      x: 0.5, y: 4.5, w: 9, h: 0.5,
      fontSize: 13, fontFace: FONT_B, italic: true, color: C.muted, align: "center", margin: 0,
    });
  }

  // ════════════════════════════════════════════════════════════════════
  // SLIDE 4 — Stage 1: PM-assistant
  // ════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    titleBar(s, "阶段 1：立项前验证（PM-assistant）");

    // Left: 5 steps
    const steps = [
      { icon: I.search, t: "需求理解与拆解", d: "核心功能、用户画像、痛点、用户研究验证" },
      { icon: I.book, t: "飞书文档查重", d: "自动检索内部知识库，避免重复造轮子" },
      { icon: I.globe, t: "网络竞品检索 + SWOT", d: "竞品分析、差异化机会、SWOT 矩阵" },
      { icon: I.chart, t: "商业模型快评", d: "Lean Canvas 七要素快速商业校验" },
      { icon: I.layers, t: "可落地性联合快评", d: "UI 复杂度 + 技术可行性前置校准" },
    ];
    steps.forEach((st, i) => {
      const iy = 1.35 + i * 0.72;
      s.addImage({ data: st.icon, x: 0.6, y: iy + 0.05, w: 0.36, h: 0.36 });
      s.addText(st.t, {
        x: 1.15, y: iy, w: 3.5, h: 0.3,
        fontSize: 13, fontFace: FONT_B, bold: true, color: C.text, margin: 0,
      });
      s.addText(st.d, {
        x: 1.15, y: iy + 0.32, w: 3.5, h: 0.3,
        fontSize: 10, fontFace: FONT_B, color: C.muted, margin: 0,
      });
      // connecting line
      if (i < steps.length - 1) {
        s.addShape("rect", { x: 0.76, y: iy + 0.45, w: 0.02, h: 0.25, fill: { color: C.card } });
      }
    });

    // Right: output card
    addCard(s, 5.3, 1.35, 4.2, 3.5, C.light);
    addAccentBar(s, 5.3, 1.35, 3.5, C.amber);
    s.addText("产出物：价值评估报告", {
      x: 5.6, y: 1.5, w: 3.7, h: 0.4,
      fontSize: 14, fontFace: FONT_B, bold: true, color: C.text, margin: 0,
    });
    const outputs = [
      "Lean Canvas 商业模型评估",
      "五维评分: 创新度 / 需求度 / 难度 / 优势 / 商业性",
      "SWOT 矩阵分析",
      "UI 复杂度: 低 / 中 / 高",
      "技术可行性: 高 / 中 / 低",
      "结论: 推进 / 缩范围 / 不建议推进",
    ];
    outputs.forEach((t, i) => {
      s.addImage({ data: I.check, x: 5.7, y: 2.0 + i * 0.38, w: 0.24, h: 0.24 });
      s.addText(t, {
        x: 6.05, y: 1.98 + i * 0.38, w: 3.3, h: 0.35,
        fontSize: 10, fontFace: FONT_B, color: C.text, margin: 0,
      });
    });
  }

  // ════════════════════════════════════════════════════════════════════
  // SLIDE 5 — Stage 2: PRD + Wireframe
  // ════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    titleBar(s, "阶段 2：需求文档与低保真原型");

    // Left column: PRD chapters
    addCard(s, 0.5, 1.35, 4.3, 3.7);
    addAccentBar(s, 0.5, 1.35, 3.7, C.pri);
    s.addText("10 章节结构化 PRD", {
      x: 0.8, y: 1.45, w: 3.8, h: 0.35,
      fontSize: 14, fontFace: FONT_B, bold: true, color: C.text, margin: 0,
    });
    const chapters = [
      "产品概述", "用户分析", "用户故事", "功能需求",
      "非功能需求", "交互设计", "技术方案", "里程碑",
      "风险评估", "术语表",
    ];
    chapters.forEach((ch, i) => {
      const row = Math.floor(i / 2), col = i % 2;
      s.addText(`${i + 1}. ${ch}`, {
        x: 0.85 + col * 2.0, y: 1.95 + row * 0.48, w: 1.9, h: 0.35,
        fontSize: 10, fontFace: FONT_B, color: C.text, margin: 0,
      });
    });

    // Right column: features
    const features = [
      { icon: I.desktop, t: "可点击 HTML 线框图", d: "3-8 个核心页面，灰度交互原型" },
      { icon: I.share, t: "多渠道分发", d: "本地文件 / 飞书 / GitHub PR / 墨刀" },
      { icon: I.clipboard, t: "质量自检清单", d: "12 项结构完整性检查" },
    ];
    features.forEach((f, i) => {
      const fy = 1.35 + i * 1.2;
      addCard(s, 5.3, fy, 4.2, 1.0);
      addAccentBar(s, 5.3, fy, 1.0, C.sec);
      s.addImage({ data: f.icon, x: 5.55, y: fy + 0.15, w: 0.36, h: 0.36 });
      s.addText(f.t, {
        x: 6.05, y: fy + 0.1, w: 3.3, h: 0.3,
        fontSize: 12, fontFace: FONT_B, bold: true, color: C.text, margin: 0,
      });
      s.addText(f.d, {
        x: 6.05, y: fy + 0.42, w: 3.3, h: 0.3,
        fontSize: 10, fontFace: FONT_B, color: C.muted, margin: 0,
      });
    });
  }

  // ════════════════════════════════════════════════════════════════════
  // SLIDE 6 — Stage 3: HiFi Prototypes
  // ════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    titleBar(s, "阶段 3：高保真原型设计");

    const themes = [
      { name: "科技蓝", sub: "Tech Blue", color: C.pri, fit: "工具 / SaaS / AI / 效率" },
      { name: "自然绿", sub: "Nature Green", color: C.green, fit: "健康 / 社区 / 运动 / 环保" },
      { name: "优雅紫", sub: "Elegant Purple", color: C.purple, fit: "创意 / 社交 / 娱乐 / 媒体" },
    ];

    const tw = 2.7, tgap = 0.35;
    const totalTW = themes.length * tw + (themes.length - 1) * tgap;
    const tsx = (10 - totalTW) / 2;

    themes.forEach((th, i) => {
      const tx = tsx + i * (tw + tgap);
      // card
      s.addShape("rect", { x: tx, y: 1.3, w: tw, h: 2.4, fill: { color: C.white }, shadow: shadow() });
      // top color band
      s.addShape("rect", { x: tx, y: 1.3, w: tw, h: 0.7, fill: { color: th.color } });
      // color swatch circle
      s.addShape("ellipse", {
        x: tx + tw / 2 - 0.3, y: 1.45, w: 0.6, h: 0.6,
        fill: { color: C.white, transparency: 20 },
      });
      s.addImage({ data: I.palette, x: tx + tw / 2 - 0.17, y: 1.55, w: 0.34, h: 0.34 });
      // name
      s.addText(th.name, {
        x: tx, y: 2.15, w: tw, h: 0.4,
        fontSize: 16, fontFace: FONT_B, bold: true, color: C.text, align: "center", margin: 0,
      });
      s.addText(th.sub, {
        x: tx, y: 2.5, w: tw, h: 0.3,
        fontSize: 10, fontFace: FONT_B, color: C.muted, align: "center", margin: 0,
      });
      // fit
      s.addText(th.fit, {
        x: tx + 0.15, y: 2.9, w: tw - 0.3, h: 0.55,
        fontSize: 10, fontFace: FONT_B, color: C.muted, align: "center", margin: 0,
      });
    });

    // Bottom upgrade list
    const upgrades = [
      "灰度 → 品牌配色",
      "文字占位 → Lucide Icons",
      "静态 → 入场动画 + 悬停效果",
      "可导出墨刀用于评审",
    ];
    upgrades.forEach((u, i) => {
      const ux = 0.8 + i * 2.3;
      s.addImage({ data: I.check, x: ux, y: 4.2, w: 0.22, h: 0.22 });
      s.addText(u, {
        x: ux + 0.3, y: 4.18, w: 2.0, h: 0.35,
        fontSize: 10, fontFace: FONT_B, color: C.text, margin: 0,
      });
    });
  }

  // ════════════════════════════════════════════════════════════════════
  // SLIDE 7 — Stage 4+5: Architecture + Issues
  // ════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    titleBar(s, "阶段 4+5：架构设计与任务拆分");

    // Left: Architecture
    addCard(s, 0.5, 1.35, 4.3, 3.7);
    addAccentBar(s, 0.5, 1.35, 3.7, C.teal);
    s.addImage({ data: I.project, x: 0.75, y: 1.5, w: 0.36, h: 0.36 });
    s.addText("Architect Agent", {
      x: 1.25, y: 1.5, w: 3.4, h: 0.35,
      fontSize: 14, fontFace: FONT_B, bold: true, color: C.text, margin: 0,
    });
    const archItems = [
      "技术栈选型 + 选型理由", "系统架构图（Mermaid）",
      "ER 数据模型", "RESTful API 设计",
      "部署拓扑 + 成本估算", "安全设计（OWASP Top 10）",
    ];
    archItems.forEach((t, i) => {
      s.addImage({ data: I.check, x: 0.8, y: 2.1 + i * 0.42, w: 0.2, h: 0.2 });
      s.addText(t, {
        x: 1.1, y: 2.08 + i * 0.42, w: 3.5, h: 0.3,
        fontSize: 10, fontFace: FONT_B, color: C.text, margin: 0,
      });
    });

    // Right: Issues
    addCard(s, 5.3, 1.35, 4.2, 3.7);
    addAccentBar(s, 5.3, 1.35, 3.7, C.sec);
    s.addImage({ data: I.tasks, x: 5.55, y: 1.5, w: 0.36, h: 0.36 });
    s.addText("requirement-to-issues", {
      x: 6.05, y: 1.5, w: 3.3, h: 0.35,
      fontSize: 14, fontFace: FONT_B, bold: true, color: C.text, margin: 0,
    });

    // Issue tree visual
    const treeItems = [
      { indent: 0, t: "📦 模块 Epic（P0, 3 个功能点）", bold: true },
      { indent: 1, t: "├── 功能点 Task A（P0）" },
      { indent: 1, t: "├── 功能点 Task B（P0）" },
      { indent: 1, t: "└── 功能点 Task C（P1）" },
      { indent: 0, t: "📦 模块 Epic（P1, 2 个功能点）", bold: true },
      { indent: 1, t: "├── 功能点 Task D（P1）" },
      { indent: 1, t: "└── 功能点 Task E（P2）" },
    ];
    treeItems.forEach((ti, i) => {
      s.addText(ti.t, {
        x: 5.7 + ti.indent * 0.3, y: 2.1 + i * 0.35, w: 3.5, h: 0.3,
        fontSize: 10, fontFace: "Consolas", bold: !!ti.bold, color: ti.bold ? C.text : C.muted, margin: 0,
      });
    });

    // bottom features
    s.addText("自动关联: 用户故事 · 架构引用 · 里程碑 · 模块依赖", {
      x: 5.55, y: 4.5, w: 3.9, h: 0.3,
      fontSize: 9, fontFace: FONT_B, color: C.muted, margin: 0,
    });
  }

  // ════════════════════════════════════════════════════════════════════
  // SLIDE 8 — Ecosystem
  // ════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };
    if (hasBg) {
      s.addImage({ path: bgPath, x: 0, y: 0, w: 10, h: 5.625, transparency: 65 });
    }
    s.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.navy, transparency: 30 } });
    titleBar(s, "全链路协作生态", true);

    // Central hub
    s.addShape("ellipse", { x: 3.75, y: 1.8, w: 2.5, h: 2.5, fill: { color: C.pri, transparency: 20 } });
    s.addShape("ellipse", { x: 4.0, y: 2.05, w: 2.0, h: 2.0, fill: { color: C.pri } });
    s.addImage({ data: I.code, x: 4.55, y: 2.5, w: 0.45, h: 0.45 });
    s.addText("VS Code\nCopilot", {
      x: 4.0, y: 3.0, w: 2.0, h: 0.7,
      fontSize: 11, fontFace: FONT_B, bold: true, color: C.white, align: "center", margin: 0,
    });

    // Satellites
    const sats = [
      { x: 0.5, y: 1.5, icon: I.comments, name: "飞书", desc: "查重 · 同步 · 知识库", color: C.sec },
      { x: 7.5, y: 1.5, icon: I.github, name: "GitHub", desc: "PR · Issue · 审查", color: C.white },
      { x: 4.0, y: 4.5, icon: I.pencil, name: "墨刀", desc: "原型评审 · 团队协作", color: C.purple },
    ];
    sats.forEach((sat) => {
      // connecting line to center
      const cx = 5.0, cy = 3.05;
      const sx = sat.x + 0.85, sy = sat.y + 0.35;
      // We use a simple line
      s.addShape("line", {
        x: Math.min(sx, cx), y: Math.min(sy, cy),
        w: Math.abs(cx - sx), h: Math.abs(cy - sy),
        line: { color: C.muted, width: 1.5, dashType: "dash" },
        flipH: sx > cx,
      });
      // satellite circle
      s.addShape("ellipse", { x: sat.x, y: sat.y, w: 1.7, h: 0.9, fill: { color: sat.color, transparency: 80 } });
      s.addImage({ data: sat.icon, x: sat.x + 0.15, y: sat.y + 0.18, w: 0.36, h: 0.36 });
      s.addText(sat.name, {
        x: sat.x + 0.55, y: sat.y + 0.1, w: 1.0, h: 0.3,
        fontSize: 13, fontFace: FONT_B, bold: true, color: C.white, margin: 0,
      });
      s.addText(sat.desc, {
        x: sat.x + 0.55, y: sat.y + 0.42, w: 1.1, h: 0.3,
        fontSize: 9, fontFace: FONT_B, color: C.muted, margin: 0,
      });
    });

    // Bottom tagline
    s.addText("产品经理无需切换工具，在一个对话窗口里完成全部操作", {
      x: 0.5, y: 5.0, w: 9.0, h: 0.35,
      fontSize: 12, fontFace: FONT_B, italic: true, color: C.sec, align: "center", margin: 0,
    });
  }

  // ════════════════════════════════════════════════════════════════════
  // SLIDE 9 — Customer Value
  // ════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    titleBar(s, "客户价值");

    const vals = [
      { big: "10 min", label: "立项评估", desc: "灵感到决策报告，\n从数天压缩到 10 分钟", icon: I.clock, color: C.amber },
      { big: "自动生成", label: "结构化 PRD", desc: "10 章节 + 原型图\n一次对话完成", icon: I.file, color: C.pri },
      { big: "即时交付", label: "高保真原型", desc: "无需等待设计师，\n一键从低保真升级", icon: I.palette, color: C.purple },
      { big: "一键拆分", label: "GitHub Issues", desc: "模块→Task 两级拆分\n自动关联上下文", icon: I.tasks, color: C.teal },
    ];

    const cw = 4.2, ch = 1.7, gx = 0.6, gy = 0.5;
    vals.forEach((v, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const cx = 0.5 + col * (cw + gx);
      const cy = 1.35 + row * (ch + gy);
      addCard(s, cx, cy, cw, ch);
      // color left bar
      addAccentBar(s, cx, cy, ch, v.color);
      // big number
      s.addText(v.big, {
        x: cx + 0.3, y: cy + 0.15, w: 2.0, h: 0.55,
        fontSize: 28, fontFace: FONT_H, bold: true, color: v.color, margin: 0,
      });
      // label
      s.addText(v.label, {
        x: cx + 0.3, y: cy + 0.7, w: 2.0, h: 0.3,
        fontSize: 12, fontFace: FONT_B, bold: true, color: C.text, margin: 0,
      });
      // desc
      s.addText(v.desc, {
        x: cx + 0.3, y: cy + 1.0, w: 2.5, h: 0.55,
        fontSize: 10, fontFace: FONT_B, color: C.muted, margin: 0, lineSpacingMultiple: 1.3,
      });
      // icon
      s.addImage({ data: v.icon, x: cx + cw - 0.7, y: cy + 0.3, w: 0.45, h: 0.45 });
    });
  }

  // ════════════════════════════════════════════════════════════════════
  // SLIDE 10 — Appendix A: Agent List
  // ════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    titleBar(s, "附录 A：Agent 清单");

    s.addText("Agent 是角色化协作单元，负责路由、分析、评审、设计等任务。每个 Agent 拥有独立职责和触发条件。", {
      x: 0.5, y: 1.05, w: 9, h: 0.35, fontSize: 10, fontFace: FONT_B, color: C.muted, margin: 0,
    });

    const agents = [
      ["PM-assistant",     "立项前验证与需求过滤",     "「我有一个产品灵感…」"],
      ["Requirement Analyst","需求分析与灵感验证",     "「帮我分析这个需求可行性」"],
      ["Designer",         "高保真原型设计",           "「将线框图升级为高保真」"],
      ["Architect",        "技术架构设计",             "「根据 PRD 设计架构」"],
      ["gate-review",      "Stage-Gate 评审门",        "「对 PRD 做评审」"],
      ["post-launch-review","上线复盘与迭代决策",      "「复盘上线数据表现」"],
      ["planning",         "任务上下文研究与路由",      "每次任务前自动调用"],
      ["new-employee-mentor","统一入口与任务分发",      "不确定用哪个工具时"],
      ["code-review",      "代码评审与质量检查",        "「审查这段代码」"],
      ["code-debug",       "报错排查与修复",           "「这个报错怎么修」"],
      ["code-testing",     "测试生成与覆盖",           "「写单元测试」"],
      ["code-docs",        "文档生成",                 "「生成 README」"],
      ["pr-review-submit", "PR 审查提交",              "「提交审查意见到 PR」"],
      ["ui-testing",       "UI 自动化测试",            "「用 Playwright 测试」"],
    ];

    const headerOpts = (txt) => ({
      text: txt,
      options: { fill: { color: C.navy }, color: C.white, bold: true, fontSize: 10, fontFace: FONT_B, align: "left", valign: "middle" },
    });
    const cellOpts = (txt, i) => ({
      text: txt,
      options: { fill: { color: i % 2 === 0 ? C.light : C.white }, color: C.text, fontSize: 9, fontFace: FONT_B, align: "left", valign: "middle" },
    });

    const rows = [
      [headerOpts("Agent 名称"), headerOpts("定位"), headerOpts("典型触发场景")],
      ...agents.map((a, i) => [cellOpts(a[0], i), cellOpts(a[1], i), cellOpts(a[2], i)]),
    ];

    s.addTable(rows, {
      x: 0.5, y: 1.45, w: 9.0,
      colW: [2.0, 3.5, 3.5],
      rowH: [0.30, ...Array(agents.length).fill(0.25)],
      border: { pt: 0.5, color: "E2E8F0" },
      margin: [0.05, 0.15, 0.05, 0.15],
    });
  }

  // ════════════════════════════════════════════════════════════════════
  // SLIDE 11 — Appendix B: Skill List
  // ════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    titleBar(s, "附录 B：Skill 清单");

    s.addText("Skill 是领域知识沉淀，包含方法论、模板、参考文档和执行流程。被 Agent 按需调用。", {
      x: 0.5, y: 1.05, w: 9, h: 0.35, fontSize: 10, fontFace: FONT_B, color: C.muted, margin: 0,
    });

    const skills = [
      ["requirement-doc",       "PRD 与低保真原型生成",    "「生成需求文档」"],
      ["requirement-to-issues", "PRD 拆分为 GitHub Issues","「拆需求到 Issue」"],
      ["prototype-design",      "高保真原型设计规范",      "「生成高保真原型」"],
      ["modao-prototype",       "墨刀原型导入",           "「导入墨刀」"],
      ["architect",             "架构设计模板与方法",      "「设计技术方案」"],
      ["coding-standards",      "全栈编码规范集",          "「查询编码规范」"],
      ["code-review",           "审查流程标准化",          "「代码审查」"],
      ["code-standards-check",  "规范合规性扫描与报告",    "「检查代码规范」"],
      ["github-publish",        "Git 提交与发布工作流",    "「提交到 GitHub」"],
      ["feishu-docs",           "飞书文档查重、读写与同步","「查飞书文档」"],
      ["microservices",         "微服务设计、治理与部署",   "「微服务架构」"],
      ["playwright-testing",    "Playwright UI 测试规范",  "「E2E 测试」"],
      ["security-audit",        "OWASP 安全专项审查",      "「安全审计」"],
    ];

    const headerOpts = (txt) => ({
      text: txt,
      options: { fill: { color: C.navy }, color: C.white, bold: true, fontSize: 10, fontFace: FONT_B, align: "left", valign: "middle" },
    });
    const cellOpts = (txt, i) => ({
      text: txt,
      options: { fill: { color: i % 2 === 0 ? C.light : C.white }, color: C.text, fontSize: 9, fontFace: FONT_B, align: "left", valign: "middle" },
    });

    const rows = [
      [headerOpts("Skill 名称"), headerOpts("定位"), headerOpts("典型触发场景")],
      ...skills.map((sk, i) => [cellOpts(sk[0], i), cellOpts(sk[1], i), cellOpts(sk[2], i)]),
    ];

    s.addTable(rows, {
      x: 0.5, y: 1.45, w: 9.0,
      colW: [2.2, 3.3, 3.5],
      rowH: [0.32, ...Array(skills.length).fill(0.27)],
      border: { pt: 0.5, color: "E2E8F0" },
      margin: [0.05, 0.15, 0.05, 0.15],
    });
  }

  // ════════════════════════════════════════════════════════════════════
  // SLIDE 12 — Q&A
  // ════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };
    if (hasBg) {
      s.addImage({ path: bgPath, x: 0, y: 0, w: 10, h: 5.625, transparency: 55 });
    }
    s.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.navy, transparency: 35 } });
    // decorative circles
    s.addShape("ellipse", { x: -1, y: 3.5, w: 3, h: 3, fill: { color: C.pri, transparency: 75 } });
    s.addShape("ellipse", { x: 8.5, y: -0.5, w: 2.5, h: 2.5, fill: { color: C.sec, transparency: 80 } });
    // Q & A
    s.addText("Q & A", {
      x: 0, y: 1.3, w: 10, h: 1.5,
      fontSize: 60, fontFace: FONT_H, bold: true, color: C.white, align: "center", valign: "middle", margin: 0,
    });
    // amber accent
    s.addShape("rect", { x: 4.2, y: 3.0, w: 1.6, h: 0.06, fill: { color: C.amber } });
    // repo
    s.addText("github.com/nickhou1983/PM-Project", {
      x: 0, y: 3.3, w: 10, h: 0.5,
      fontSize: 14, fontFace: FONT_B, color: C.sec, align: "center", margin: 0,
    });
    s.addText("感谢聆听", {
      x: 0, y: 4.5, w: 10, h: 0.5,
      fontSize: 16, fontFace: FONT_B, color: C.muted, align: "center", margin: 0,
    });
  }

  // ════════════════════════════════════════════════════════════════════
  // Write file
  // ════════════════════════════════════════════════════════════════════
  const outFile = path.join(__dirname, "..", "PM-Project-Intro.pptx");
  await pres.writeFile({ fileName: outFile });
  console.log("✅ PPT 已生成:", outFile);
}

main().catch((err) => { console.error("❌ 生成失败:", err); process.exit(1); });
