#!/usr/bin/env node
/**
 * warning-tracker.js — Gate Warning 追踪器
 *
 * 用法：
 *   node .github/skills/doc-lint/scripts/warning-tracker.js scan <project>
 *   node .github/skills/doc-lint/scripts/warning-tracker.js resolve <project> <warning-id> [resolution-note]
 *   node .github/skills/doc-lint/scripts/warning-tracker.js status <project>
 *
 * 功能：
 *   scan    - 扫描 gate-results/ 下所有 lint 和 gate 结果文件，提取 warn/fail 项
 *   resolve - 标记某个 warning 为已解决
 *   status  - 输出当前项目所有 warnings 的状态摘要
 *
 * 数据存储：gate-results/warnings-tracker.json
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

function projectDir(project) {
  return path.join(REPO_ROOT, 'projects', `prd-${project}`);
}

function trackerPath(project) {
  return path.join(projectDir(project), 'gate-results', 'warnings-tracker.json');
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return null;
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function scanWarnings(project) {
  const gateDir = path.join(projectDir(project), 'gate-results');
  if (!fs.existsSync(gateDir)) {
    console.error(`gate-results 目录不存在: ${gateDir}`);
    return [];
  }

  const warnings = [];
  const jsonFiles = fs.readdirSync(gateDir).filter(f => f.endsWith('.json') && f !== 'warnings-tracker.json');

  for (const file of jsonFiles) {
    const data = readJson(path.join(gateDir, file));
    if (!data) continue;

    const source = file.replace('.json', '');
    const extractItems = (items, prefix) => {
      if (!Array.isArray(items)) return;
      for (const item of items) {
        if (item.result === 'warn' || item.result === 'fail') {
          const wid = `${source}::${item.id || item.rule || 'unknown'}${item.module ? `::${item.module}` : ''}`;
          warnings.push({
            id: wid,
            source: file,
            rule_id: item.id || 'N/A',
            rule: item.rule || item.name || 'N/A',
            severity: item.result,
            note: item.note || '',
            module: item.module || null,
            gate_ref: item.gate_ref || null,
            detected_at: data.date || new Date().toISOString().slice(0, 10)
          });
        }
      }
    };

    // Scan for results arrays in known structures
    if (data.main_prd) extractItems(data.main_prd, 'prd');
    if (data.module_prds) extractItems(data.module_prds, 'module');
    if (data.main_arch) extractItems(data.main_arch, 'arch');
    if (data.module_archs) extractItems(data.module_archs, 'module-arch');
    if (data.results) extractItems(data.results, 'gate');
    if (data.items) extractItems(data.items, 'gate');

    // Scan for flat-format gate results
    if (data.checks && Array.isArray(data.checks)) {
      for (const check of data.checks) {
        if (check.result === '⚠️' || check.result === 'warn' || check.result === '❌' || check.result === 'fail') {
          const wid = `${source}::${check.id || check.item || 'unknown'}`;
          warnings.push({
            id: wid,
            source: file,
            rule_id: check.id || check.item || 'N/A',
            rule: check.description || check.item || 'N/A',
            severity: (check.result === '❌' || check.result === 'fail') ? 'fail' : 'warn',
            note: check.note || check.comment || '',
            module: null,
            gate_ref: check.gate_ref || null,
            detected_at: data.date || new Date().toISOString().slice(0, 10)
          });
        }
      }
    }
  }

  return warnings;
}

function cmdScan(project) {
  const tp = trackerPath(project);
  const existing = readJson(tp) || { warnings: [], resolved: [] };
  const scanned = scanWarnings(project);

  // Merge: keep resolved status, add new warnings
  const resolvedIds = new Set(existing.resolved.map(r => r.id));
  const existingIds = new Set(existing.warnings.map(w => w.id));

  let added = 0;
  for (const w of scanned) {
    if (!existingIds.has(w.id) && !resolvedIds.has(w.id)) {
      existing.warnings.push({ ...w, status: 'open' });
      added++;
    }
  }

  // Mark stale: if a warning was in tracker but not in latest scan, mark it
  const scannedIds = new Set(scanned.map(w => w.id));
  for (const w of existing.warnings) {
    if (!scannedIds.has(w.id) && w.status === 'open') {
      w.status = 'stale';
    }
  }

  existing.last_scan = new Date().toISOString().slice(0, 10);
  writeJson(tp, existing);

  const open = existing.warnings.filter(w => w.status === 'open').length;
  const stale = existing.warnings.filter(w => w.status === 'stale').length;
  const resolved = existing.resolved.length;

  console.log(`✅ Warning 扫描完成:`);
  console.log(`   新增: ${added}`);
  console.log(`   Open: ${open} | Stale: ${stale} | Resolved: ${resolved}`);
  console.log(`   → ${path.relative(REPO_ROOT, tp)}`);
}

function cmdResolve(project, warningId, note) {
  const tp = trackerPath(project);
  const data = readJson(tp);
  if (!data) {
    console.error(`Tracker 文件不存在，请先运行 scan 命令`);
    process.exit(1);
  }

  const idx = data.warnings.findIndex(w => w.id === warningId);
  if (idx < 0) {
    // Try partial match
    const matches = data.warnings.filter(w => w.id.includes(warningId));
    if (matches.length === 0) {
      console.error(`未找到 warning: ${warningId}`);
      console.error(`当前 Open warnings:`);
      data.warnings.filter(w => w.status === 'open').forEach(w => console.error(`  - ${w.id}`));
      process.exit(1);
    } else if (matches.length > 1) {
      console.error(`多个匹配，请提供更精确的 ID:`);
      matches.forEach(m => console.error(`  - ${m.id}`));
      process.exit(1);
    }
    // Exact partial match
    const match = matches[0];
    const realIdx = data.warnings.indexOf(match);
    const resolved = data.warnings.splice(realIdx, 1)[0];
    resolved.status = 'resolved';
    resolved.resolved_at = new Date().toISOString().slice(0, 10);
    resolved.resolution_note = note || '';
    data.resolved.push(resolved);
    writeJson(tp, data);
    console.log(`✅ 已解决: ${resolved.id}`);
    return;
  }

  const resolved = data.warnings.splice(idx, 1)[0];
  resolved.status = 'resolved';
  resolved.resolved_at = new Date().toISOString().slice(0, 10);
  resolved.resolution_note = note || '';
  data.resolved.push(resolved);
  writeJson(tp, data);
  console.log(`✅ 已解决: ${resolved.id}`);
}

function cmdStatus(project) {
  const tp = trackerPath(project);
  const data = readJson(tp);
  if (!data) {
    console.error(`Tracker 文件不存在，请先运行 scan 命令`);
    process.exit(1);
  }

  const open = data.warnings.filter(w => w.status === 'open');
  const stale = data.warnings.filter(w => w.status === 'stale');
  const resolved = data.resolved || [];

  console.log(`\n📊 Warning Tracker 状态 — ${project}`);
  console.log(`   最近扫描: ${data.last_scan || 'N/A'}`);
  console.log(`   Open: ${open.length} | Stale: ${stale.length} | Resolved: ${resolved.length}\n`);

  if (open.length > 0) {
    console.log(`🔴 Open Warnings:`);
    for (const w of open) {
      console.log(`   [${w.severity.toUpperCase()}] ${w.id}`);
      console.log(`      规则: ${w.rule}`);
      console.log(`      说明: ${w.note}`);
      if (w.gate_ref) console.log(`      Gate: ${w.gate_ref}`);
      console.log('');
    }
  }

  if (stale.length > 0) {
    console.log(`🟡 Stale (最新扫描未再出现):`);
    for (const w of stale) {
      console.log(`   ${w.id} — ${w.rule}`);
    }
    console.log('');
  }

  // Generate status markdown
  const date = new Date().toISOString().slice(0, 10);
  let md = `# Warning Tracker 状态 — ${project}\n\n`;
  md += `> **查询日期**：${date}  \n`;
  md += `> **最近扫描**：${data.last_scan || 'N/A'}  \n`;
  md += `> **Open**: ${open.length} | **Stale**: ${stale.length} | **Resolved**: ${resolved.length}  \n\n`;

  if (open.length > 0) {
    md += `## Open Warnings\n\n`;
    md += `| ID | 严重度 | 规则 | Gate 映射 | 说明 |\n`;
    md += `|----|--------|------|----------|------|\n`;
    for (const w of open) {
      md += `| ${w.id} | ${w.severity} | ${w.rule} | ${w.gate_ref || '-'} | ${w.note} |\n`;
    }
  }

  if (resolved.length > 0) {
    md += `\n## Resolved (最近 10 条)\n\n`;
    md += `| ID | 解决日期 | 解决说明 |\n`;
    md += `|----|----------|----------|\n`;
    for (const r of resolved.slice(-10)) {
      md += `| ${r.id} | ${r.resolved_at} | ${r.resolution_note || '-'} |\n`;
    }
  }

  const mdPath = path.join(projectDir(project), 'gate-results', `warnings-status-${date}.md`);
  fs.writeFileSync(mdPath, md, 'utf8');
  console.log(`   MD → ${path.relative(REPO_ROOT, mdPath)}`);
}

function main() {
  const cmd = process.argv[2];
  const project = process.argv[3];

  if (!cmd || !project) {
    console.error('用法:');
    console.error('  node warning-tracker.js scan <project>');
    console.error('  node warning-tracker.js resolve <project> <warning-id> [note]');
    console.error('  node warning-tracker.js status <project>');
    process.exit(2);
  }

  switch (cmd) {
    case 'scan':
      cmdScan(project);
      break;
    case 'resolve':
      const wid = process.argv[4];
      const note = process.argv.slice(5).join(' ');
      if (!wid) {
        console.error('请提供 warning-id');
        process.exit(2);
      }
      cmdResolve(project, wid, note);
      break;
    case 'status':
      cmdStatus(project);
      break;
    default:
      console.error(`未知命令: ${cmd}（支持: scan, resolve, status）`);
      process.exit(2);
  }
}

main();
