#!/usr/bin/env node
"use strict";

import fs from "fs";
import path from "path";

// ─── CLI args ────────────────────────────────────────────────────────────────
const project = process.argv[2];
if (!project) {
  console.error("❌ 用法：node scripts/generate-dashboard.js <project-name>");
  console.error("   示例：node scripts/generate-dashboard.js videoprompt-ai");
  process.exit(1);
}

const ROOT = process.cwd();
const projectDir = path.join(ROOT, "projects", `prd-${project}`);

if (!fs.existsSync(projectDir)) {
  console.error(`❌ 项目目录不存在：${projectDir}`);
  process.exit(1);
}

// ─── HTML escape helper ──────────────────────────────────────────────────────
function esc(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── 1. 读取所有 Gate 评审 JSON ──────────────────────────────────────────────
function readGateResults() {
  const gateDir = path.join(projectDir, "gate-results");
  if (!fs.existsSync(gateDir)) return [];
  return fs
    .readdirSync(gateDir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(gateDir, f), "utf8"));
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

// ─── 2. 目录文件计数（排除 index.html / README.md）───────────────────────────
function countFiles(subdir, pattern) {
  const dir = path.join(projectDir, subdir);
  if (!fs.existsSync(dir)) return 0;
  return fs
    .readdirSync(dir)
    .filter(
      (f) => pattern.test(f) && f !== "index.html" && f !== "README.md"
    ).length;
}

// ─── 3. 提取 PRD 版本号 ──────────────────────────────────────────────────────
function extractPrdVersion() {
  const prdFile = path.join(projectDir, `prd-${project}.md`);
  if (!fs.existsSync(prdFile)) return "N/A";
  const head = fs.readFileSync(prdFile, "utf8").slice(0, 3000);
  const m =
    head.match(/\*\*版本[^*]*\*\*\s*[:：]?\s*(v[\d.]+)/i) ||
    head.match(/version\s*[:：]\s*(v[\d.]+)/i) ||
    head.match(/\|\s*当前版本[^|]*\|\s*(v[\d.]+)/i) ||
    head.match(/(v\d+\.\d+\.\d+)/);
  return m ? m[1] : "N/A";
}

// ─── 4. 流程阶段完成状态 ─────────────────────────────────────────────────────
function getStages() {
  const e = (rel) => fs.existsSync(path.join(projectDir, rel));
  const hasGate = (n) => {
    const d = path.join(projectDir, "gate-results");
    if (!fs.existsSync(d)) return false;
    return fs.readdirSync(d).some((f) => f.toLowerCase().startsWith(`gate${n}`));
  };
  const hasHifi = countFiles("hifi-wireframes", /\.html$/) > 0;

  return [
    {
      id: 0,
      name: "立项验证",
      desc: "pm_assistant",
      done:
        fs
          .readdirSync(projectDir)
          .some((f) => f.startsWith("analysis-report")),
    },
    { id: 1, name: "PRD 生成", desc: "requirement-doc", done: e(`prd-${project}.md`) },
    { id: 2, name: "Gate 1 评审", desc: "PRD 评审", done: hasGate(1) },
    { id: 3, name: "高保真原型", desc: "designer", done: hasHifi },
    {
      id: 4,
      name: "技术架构",
      desc: "architect",
      done: e(`architecture-${project}.md`),
    },
    { id: 5, name: "Gate 2 评审", desc: "架构评审", done: hasGate(2) },
    { id: 6, name: "开发上线", desc: "Gate 3", done: hasGate(3) },
  ];
}

// ─── 5. 归一化 dimensions（兼容数组格式和对象格式）─────────────────────────────
function normalizeDimensions(gate) {
  const dims = gate.dimensions;
  if (!dims) return [];
  if (Array.isArray(dims)) return dims;
  // Object format: { "A_completeness": { weight, score, items: {...} }, ... }
  return Object.entries(dims).map(([key, val]) => {
    const items = val.items
      ? Array.isArray(val.items)
        ? val.items
        : Object.entries(val.items).map(([id, result]) => ({
            id,
            check: id,
            result: typeof result === "string" ? result : result.result || "pass",
            note: typeof result === "object" ? result.note || "" : "",
          }))
      : [];
    return {
      name: val.name || key,
      weight: val.weight || 0,
      score: val.score || 0,
      pass_count: items.filter((i) => i.result === "pass").length,
      warn_count: items.filter((i) => i.result === "warn").length,
      fail_count: items.filter((i) => i.result === "fail").length,
      items,
    };
  });
}

// ─── 5b. 收集所有 warn/fail 事项 ─────────────────────────────────────────────
function collectIssues(gateResults) {
  const issues = [];
  for (const g of gateResults) {
    for (const dim of normalizeDimensions(g)) {
      for (const item of dim.items || []) {
        if (item.result === "warn" || item.result === "fail") {
          issues.push({
            gate: g.gate,
            date: g.date || g.review_date,
            dim: dim.name,
            check: item.check,
            result: item.result,
            note: item.note || "",
          });
        }
      }
    }
  }
  return issues;
}

// ─── 6. 计算各 Gate 加权总分 ─────────────────────────────────────────────────
function calcOverallScore(gate) {
  const dims = normalizeDimensions(gate);
  const weighted = dims.filter((d) => d.weight > 0);
  if (!weighted.length) return gate.score != null ? (gate.score * 100).toFixed(1) : null;
  const total = weighted.reduce((s, d) => s + d.score * d.weight, 0);
  const weightSum = weighted.reduce((s, d) => s + d.weight, 0);
  return ((total / weightSum) * 100).toFixed(1);
}

// ─── 7. HTML 生成 ────────────────────────────────────────────────────────────
function buildStageTimeline(stages) {
  const lastDoneIdx = stages.reduce((acc, s, i) => (s.done ? i : acc), -1);
  const inProgressIdx =
    lastDoneIdx + 1 < stages.length ? lastDoneIdx + 1 : -1;

  return stages
    .map((s, i) => {
      let cls, icon;
      if (s.done) {
        cls = "stage-done";
        icon = "✅";
      } else if (i === inProgressIdx) {
        cls = "stage-inprogress";
        icon = "⏳";
      } else {
        cls = "stage-pending";
        icon = "⬜";
      }
      const arrow = i < stages.length - 1 ? '<div class="stage-arrow">›</div>' : "";
      return `<div class="stage-step ${cls}">
  <div class="stage-dot">${icon}</div>
  <div class="stage-label">
    <div class="stage-name">${esc(s.name)}</div>
    <div class="stage-desc">${esc(s.desc)}</div>
  </div>${arrow}
</div>`;
    })
    .join("\n");
}

function buildGateCards(gateResults) {
  if (!gateResults.length) return "";

  const cards = gateResults
    .map((g, gi) => {
      const significantDims = normalizeDimensions(g).filter((d) => d.weight > 0);
      const overallScore = calcOverallScore(g);

      const decColorMap = {
        Go: { text: "#15803d", bg: "#dcfce7", border: "#86efac" },
        go: { text: "#15803d", bg: "#dcfce7", border: "#86efac" },
        "Conditional Go": { text: "#b45309", bg: "#fef3c7", border: "#fcd34d" },
        conditional_go: { text: "#b45309", bg: "#fef3c7", border: "#fcd34d" },
        "No-Go": { text: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
        no_go: { text: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
      };
      const decStyle = decColorMap[g.decision] || {
        text: "#475569",
        bg: "#f1f5f9",
        border: "#cbd5e1",
      };

      // Radar data (weighted dims only)
      const radarLabels = JSON.stringify(significantDims.map((d) => d.name));
      const radarScores = JSON.stringify(
        significantDims.map((d) => Math.round((d.score || 0) * 100))
      );

      // Bar data (all dims)
      const allDims = normalizeDimensions(g);
      const barLabels = JSON.stringify(allDims.map((d) => d.name));
      const passData = JSON.stringify(allDims.map((d) => d.pass_count || 0));
      const warnData = JSON.stringify(allDims.map((d) => d.warn_count || 0));
      const failData = JSON.stringify(allDims.map((d) => d.fail_count || 0));

      return `<div class="gate-card">
  <div class="gate-header">
    <div class="gate-title-row">
      <span class="gate-name">${esc(g.gate)}</span>
      <span class="gate-date">${esc(g.date || g.review_date)}</span>
    </div>
    <div class="gate-right">
      ${overallScore ? `<span class="gate-score">${overallScore}分</span>` : ""}
      <span class="decision-badge" style="background:${decStyle.bg};color:${decStyle.text};border-color:${decStyle.border}">${esc(g.decision)}</span>
    </div>
  </div>
  <p class="gate-summary">${esc(g.summary)}</p>
  <div class="charts-row">
    <div class="chart-box">
      <canvas id="radar${gi}" width="260" height="260"></canvas>
      <div class="chart-lbl">各维度得分 (0–100)</div>
    </div>
    <div class="chart-box chart-bar-box">
      <canvas id="bar${gi}" width="440" height="260"></canvas>
      <div class="chart-lbl">通过 / 警告 / 阻断（条目数）</div>
    </div>
  </div>
  <script>
  (function(){
    var labels = ${radarLabels};
    new Chart(document.getElementById("radar${gi}"),{
      type:"radar",
      data:{
        labels:labels,
        datasets:[{
          label:"得分",
          data:${radarScores},
          backgroundColor:"rgba(13,79,139,0.12)",
          borderColor:"#0D4F8B",
          pointBackgroundColor:"#0D4F8B",
          pointRadius:4,
          pointHoverRadius:6
        }]
      },
      options:{
        scales:{r:{min:0,max:100,ticks:{stepSize:25,font:{size:9},backdropColor:"transparent"},pointLabels:{font:{size:10}}}},
        plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){return c.raw+"分";}}}}
      }
    });
    var allLabels = ${barLabels};
    new Chart(document.getElementById("bar${gi}"),{
      type:"bar",
      data:{
        labels:allLabels,
        datasets:[
          {label:"✅ 通过",data:${passData},backgroundColor:"#16a34a"},
          {label:"⚠️ 警告",data:${warnData},backgroundColor:"#d97706"},
          {label:"❌ 阻断",data:${failData},backgroundColor:"#dc2626"}
        ]
      },
      options:{
        indexAxis:"y",
        scales:{
          x:{stacked:true,ticks:{font:{size:10},stepSize:1}},
          y:{stacked:true,ticks:{font:{size:10}}}
        },
        plugins:{legend:{position:"bottom",labels:{font:{size:10},boxWidth:12}}}
      }
    });
  })();
  </sc` +
        `ript>
</div>`;
    })
    .join("\n");

  return `<div class="section-title">Gate 评审详情</div>\n${cards}`;
}

function buildIssuesList(issues) {
  if (!issues.length) {
    return `<div class="no-issues">暂无待改进事项 🎉</div>`;
  }
  return issues
    .map(
      (it) => `<div class="issue-item issue-${esc(it.result)}">
  <div class="issue-meta">
    <span class="issue-gate-tag">${esc(it.gate)}</span>
    <span class="issue-dim-tag">${esc(it.dim)}</span>
    <span class="issue-badge-${esc(it.result)}">${
        it.result === "warn" ? "⚠️ 警告" : "❌ 阻断"
      }</span>
  </div>
  <div class="issue-check">${esc(it.check)}</div>
  ${it.note ? `<div class="issue-note">${esc(it.note)}</div>` : ""}
</div>`
    )
    .join("\n");
}

function generateHTML({
  project,
  version,
  gateResults,
  stages,
  issues,
  modulePrdCount,
  wireframeCount,
  hifiCount,
}) {
  const completedCount = stages.filter((s) => s.done).length;
  const progressPct = Math.round((completedCount / stages.length) * 100);
  const today = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const stageHtml = buildStageTimeline(stages);
  const gateCardsHtml = buildGateCards(gateResults);
  const issuesHtml = buildIssuesList(issues);

  // Progress bar color
  const progressColor =
    progressPct >= 80 ? "#22c55e" : progressPct >= 40 ? "#f59e0b" : "#60a5fa";

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(project)} — 工作流度量仪表盘</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"><\/script>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;background:#f0f4f8;color:#1e293b;min-height:100vh;}

/* ── Header ── */
.hdr{background:linear-gradient(135deg,#0D4F8B 0%,#1A8FBF 100%);color:#fff;padding:28px 40px;}
.hdr-row{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;}
.hdr-left{}
.proj-name{font-size:22px;font-weight:800;letter-spacing:-.3px;}
.proj-sub{font-size:12px;opacity:.7;margin-top:4px;}
.hdr-right{display:flex;align-items:center;gap:10px;flex-shrink:0;}
.ver-badge{background:rgba(255,255,255,.18);padding:4px 14px;border-radius:20px;font-size:13px;font-weight:700;}
.gen-date{font-size:11px;opacity:.65;}
.prog-outer{margin-top:18px;background:rgba(255,255,255,.18);border-radius:8px;height:9px;}
.prog-inner{height:9px;border-radius:8px;transition:width .5s;}
.prog-lbl{margin-top:6px;font-size:12px;opacity:.75;}

/* ── Main ── */
.main{max-width:1120px;margin:0 auto;padding:32px 24px 60px;}
.section-title{font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1.2px;margin:32px 0 14px;}
.section-title:first-child{margin-top:0;}

/* ── Stage timeline ── */
.stage-tl{display:flex;align-items:center;background:#fff;border-radius:14px;padding:20px 24px;box-shadow:0 1px 4px rgba(0,0,0,.07);overflow-x:auto;gap:6px;flex-wrap:nowrap;}
.stage-step{display:flex;align-items:center;gap:8px;flex-shrink:0;}
.stage-dot{font-size:18px;line-height:1;}
.stage-name{font-size:12px;font-weight:700;}
.stage-desc{font-size:10px;color:#94a3b8;margin-top:2px;}
.stage-arrow{font-size:20px;color:#cbd5e1;margin:0 4px;flex-shrink:0;}
.stage-done .stage-name{color:#15803d;}
.stage-inprogress .stage-name{color:#b45309;}
.stage-pending .stage-name{color:#94a3b8;}

/* ── Stat cards ── */
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
.stat-card{background:#fff;border-radius:14px;padding:20px 18px;box-shadow:0 1px 4px rgba(0,0,0,.07);text-align:center;}
.stat-num{font-size:40px;font-weight:900;color:#0D4F8B;line-height:1;margin-bottom:4px;}
.stat-lbl{font-size:13px;font-weight:600;color:#475569;}
.stat-sub{font-size:10px;color:#94a3b8;margin-top:3px;}

/* ── Gate card ── */
.gate-card{background:#fff;border-radius:14px;padding:24px;box-shadow:0 1px 4px rgba(0,0,0,.07);margin-bottom:18px;}
.gate-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;}
.gate-title-row{display:flex;align-items:baseline;gap:10px;}
.gate-name{font-size:17px;font-weight:800;color:#1e293b;}
.gate-date{font-size:12px;color:#94a3b8;}
.gate-right{display:flex;align-items:center;gap:10px;}
.gate-score{font-size:18px;font-weight:800;color:#0D4F8B;}
.decision-badge{padding:4px 14px;border-radius:20px;font-size:12px;font-weight:800;border:1.5px solid;}
.gate-summary{font-size:13px;color:#475569;line-height:1.7;margin-bottom:22px;padding:12px 16px;background:#f8fafc;border-radius:8px;border-left:3px solid #0D4F8B;}
.charts-row{display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;}
.chart-box{display:flex;flex-direction:column;align-items:center;flex-shrink:0;}
.chart-bar-box{flex:1;min-width:300px;}
.chart-lbl{font-size:10px;color:#94a3b8;margin-top:6px;}

/* ── Issues ── */
.issues-list{display:flex;flex-direction:column;gap:10px;}
.issue-item{background:#fff;border-radius:10px;padding:14px 18px;box-shadow:0 1px 4px rgba(0,0,0,.07);border-left:4px solid;}
.issue-warn{border-color:#f59e0b;}
.issue-fail{border-color:#ef4444;}
.issue-meta{display:flex;align-items:center;gap:8px;margin-bottom:7px;flex-wrap:wrap;}
.issue-gate-tag{font-size:10px;font-weight:700;color:#475569;background:#f1f5f9;padding:2px 8px;border-radius:4px;flex-shrink:0;}
.issue-dim-tag{font-size:10px;color:#64748b;flex-shrink:0;}
.issue-badge-warn{font-size:10px;font-weight:700;color:#d97706;margin-left:auto;}
.issue-badge-fail{font-size:10px;font-weight:700;color:#dc2626;margin-left:auto;}
.issue-check{font-size:13px;font-weight:600;color:#1e293b;margin-bottom:4px;line-height:1.5;}
.issue-note{font-size:12px;color:#64748b;line-height:1.6;}
.no-issues{background:#fff;border-radius:14px;padding:28px;text-align:center;color:#94a3b8;box-shadow:0 1px 4px rgba(0,0,0,.07);font-size:14px;}

@media(max-width:768px){
  .stats-grid{grid-template-columns:repeat(2,1fr);}
  .hdr{padding:20px 16px;}
  .main{padding:20px 16px 40px;}
}
</style>
</head>
<body>

<div class="hdr">
  <div class="hdr-row">
    <div class="hdr-left">
      <div class="proj-name">📊 ${esc(project)}</div>
      <div class="proj-sub">PM-Project 工作流度量仪表盘</div>
    </div>
    <div class="hdr-right">
      <span class="ver-badge">PRD ${esc(version)}</span>
      <span class="gen-date">生成于 ${esc(today)}</span>
    </div>
  </div>
  <div class="prog-outer">
    <div class="prog-inner" style="width:${progressPct}%;background:${progressColor}"></div>
  </div>
  <div class="prog-lbl">工作流进度 ${completedCount} / ${stages.length} 阶段完成（${progressPct}%）</div>
</div>

<div class="main">

  <div class="section-title">流程阶段</div>
  <div class="stage-tl">
    ${stageHtml}
  </div>

  <div class="section-title">产物统计</div>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-num">${modulePrdCount}</div>
      <div class="stat-lbl">Module PRD</div>
      <div class="stat-sub">modules/ 目录</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${wireframeCount}</div>
      <div class="stat-lbl">低保真原型</div>
      <div class="stat-sub">wireframes/ 目录</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${hifiCount}</div>
      <div class="stat-lbl">高保真原型</div>
      <div class="stat-sub">hifi-wireframes/ 目录</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${gateResults.length}</div>
      <div class="stat-lbl">Gate 评审轮次</div>
      <div class="stat-sub">gate-results/ 目录</div>
    </div>
  </div>

  ${gateCardsHtml}

  <div class="section-title">待改进事项（${issues.length}）</div>
  <div class="issues-list">
    ${issuesHtml}
  </div>

</div>
</body>
</html>`;
}

// ─── Main ────────────────────────────────────────────────────────────────────
const gateResults = readGateResults();
const stages = getStages();
const issues = collectIssues(gateResults);
const version = extractPrdVersion();
const modulePrdCount = countFiles("modules", /^prd-.+\.md$/);
const wireframeCount = countFiles("wireframes", /\.html$/);
const hifiCount = countFiles("hifi-wireframes", /\.html$/);

const html = generateHTML({
  project,
  version,
  gateResults,
  stages,
  issues,
  modulePrdCount,
  wireframeCount,
  hifiCount,
});

const outPath = path.join(projectDir, "dashboard.html");
fs.writeFileSync(outPath, html, "utf8");

console.log(`✅  仪表盘已生成：${path.relative(ROOT, outPath)}`);
console.log(`    Gate 评审数：${gateResults.length}`);
console.log(
  `    流程进度：${stages.filter((s) => s.done).length}/${stages.length} 阶段`
);
console.log(`    待改进事项：${issues.length}`);
console.log(`\n🌐  在浏览器中打开：open ${path.relative(ROOT, outPath)}`);
