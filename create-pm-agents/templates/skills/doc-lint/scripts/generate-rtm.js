#!/usr/bin/env node
/**
 * generate-rtm.js — 需求追溯矩阵 (Requirements Traceability Matrix) 自动生成
 *
 * 用法：
 *   node .github/skills/doc-lint/scripts/generate-rtm.js <project>
 *
 * 数据来源：
 *   1. PRD §4.2 功能概览表 → 功能需求列表
 *   2. 架构文档 §1.5 需求追溯矩阵 → 架构映射
 *   3. GitHub Issues（本地 gate-results/ 已有的 Issue 列表）→ Issue 映射
 *   4. Module PRD 文件 → 模块覆盖
 *
 * 输出：gate-results/rtm-{YYYY-MM-DD}.json + .md
 *
 * 矩阵列：
 *   需求ID | 需求描述 | 优先级 | PRD 章节 | 模块 PRD | 架构映射 | Issue # | 覆盖状态
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

function projectDir(project) {
  return path.join(REPO_ROOT, 'projects', `prd-${project}`);
}

function readFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

function extractTables(text) {
  const tables = [];
  const lines = text.split('\n');
  let current = null;
  for (const line of lines) {
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (!current) current = { header: null, separator: null, rows: [] };
      if (!current.header) {
        current.header = line.trim().split('|').filter(c => c.trim()).map(c => c.trim());
      } else if (line.includes('---')) {
        current.separator = true;
      } else {
        current.rows.push(line.trim().split('|').filter(c => c.trim()).map(c => c.trim()));
      }
    } else if (current && current.separator) {
      tables.push(current);
      current = null;
    }
  }
  if (current && current.separator) tables.push(current);
  return tables;
}

function extractSection(content, sectionNum) {
  const start = new RegExp(`^##\\s+${sectionNum}\\.\\s`, 'm');
  const next = new RegExp(`^##\\s+${sectionNum + 1}\\.\\s`, 'm');
  const startMatch = content.match(start);
  if (!startMatch) return null;
  const startIdx = startMatch.index;
  const nextMatch = content.slice(startIdx + 1).match(next);
  const endIdx = nextMatch ? startIdx + 1 + nextMatch.index : undefined;
  return content.slice(startIdx, endIdx);
}

function extractFeaturesFromPRD(content) {
  const features = [];
  // Try §4.2 subsection first
  const section4 = extractSection(content, 4);
  if (!section4) return features;

  const tables = extractTables(section4);
  for (const table of tables) {
    const nameIdx = table.header.findIndex(h => /功能|名称|需求|feature|name/i.test(h));
    const priorityIdx = table.header.findIndex(h => /优先级|priority|P0|P1|P2/i.test(h));
    const idIdx = table.header.findIndex(h => /编号|ID|序号/i.test(h));
    const moduleIdx = table.header.findIndex(h => /模块|module/i.test(h));

    for (let i = 0; i < table.rows.length; i++) {
      const row = table.rows[i];
      features.push({
        id: idIdx >= 0 && row[idIdx] ? row[idIdx].trim() : `F${String(i + 1).padStart(2, '0')}`,
        name: nameIdx >= 0 && row[nameIdx] ? row[nameIdx].trim() : `Feature ${i + 1}`,
        priority: priorityIdx >= 0 && row[priorityIdx] ? row[priorityIdx].trim() : 'N/A',
        module: moduleIdx >= 0 && row[moduleIdx] ? row[moduleIdx].trim() : null,
        prd_section: '§4'
      });
    }
  }
  return features;
}

function extractArchMapping(content) {
  // Try to find §1.5 需求追溯矩阵
  const section1 = extractSection(content, 1);
  if (!section1) return {};

  const mapping = {};
  const tables = extractTables(section1);
  for (const table of tables) {
    const reqIdx = table.header.findIndex(h => /需求|功能|PRD|feature/i.test(h));
    const archIdx = table.header.findIndex(h => /架构|组件|模块|service|component/i.test(h));

    if (reqIdx >= 0 && archIdx >= 0) {
      for (const row of table.rows) {
        const key = row[reqIdx] ? row[reqIdx].trim() : '';
        const value = row[archIdx] ? row[archIdx].trim() : '';
        if (key) mapping[key] = value;
      }
    }
  }
  return mapping;
}

function loadIssueMapping(project) {
  // Look for existing issue data in gate-results
  const dir = path.join(projectDir(project), 'gate-results');
  const mapping = {};
  if (!fs.existsSync(dir)) return mapping;

  const files = fs.readdirSync(dir).filter(f => f.includes('issue') && f.endsWith('.json'));
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      if (data.issues && Array.isArray(data.issues)) {
        for (const issue of data.issues) {
          const title = issue.title || issue.name || '';
          mapping[title] = issue.number || issue.id || 'N/A';
        }
      }
    } catch (e) { /* skip malformed files */ }
  }
  return mapping;
}

function loadModuleMapping(project) {
  const modulesDir = path.join(projectDir(project), 'modules');
  const mapping = {};
  if (!fs.existsSync(modulesDir)) return mapping;

  const files = fs.readdirSync(modulesDir).filter(f => f.startsWith('prd-') && f.endsWith('.md'));
  for (const f of files) {
    const slug = f.replace('prd-', '').replace('.md', '');
    const content = readFile(path.join(modulesDir, f));
    if (!content) continue;

    // Try to extract feature IDs or names from §2
    const section2 = extractSection(content, 2);
    if (section2) {
      const tables = extractTables(section2);
      for (const table of tables) {
        const nameIdx = table.header.findIndex(h => /功能|名称|feature|name/i.test(h));
        if (nameIdx >= 0) {
          for (const row of table.rows) {
            const name = row[nameIdx] ? row[nameIdx].trim() : '';
            if (name) mapping[name] = slug;
          }
        }
      }
    }
    // Also map by slug
    mapping[slug] = slug;
  }
  return mapping;
}

function matchFeatureToIssue(feature, issueMapping) {
  // Try exact title match first, then fuzzy
  for (const [title, num] of Object.entries(issueMapping)) {
    if (title.includes(feature.name) || feature.name.includes(title)) {
      return `#${num}`;
    }
  }
  return null;
}

function matchFeatureToArch(feature, archMapping) {
  for (const [key, value] of Object.entries(archMapping)) {
    if (key.includes(feature.name) || feature.name.includes(key) ||
        key.includes(feature.id) || feature.id.includes(key)) {
      return value;
    }
  }
  return null;
}

function matchFeatureToModule(feature, moduleMapping) {
  if (feature.module) {
    for (const [key, slug] of Object.entries(moduleMapping)) {
      if (feature.module.includes(key) || key.includes(feature.module)) return slug;
    }
  }
  for (const [key, slug] of Object.entries(moduleMapping)) {
    if (key.includes(feature.name) || feature.name.includes(key)) return slug;
  }
  return null;
}

function formatDate() {
  return new Date().toISOString().slice(0, 10);
}

function main() {
  const project = process.argv[2];
  if (!project) {
    console.error('用法: node .github/skills/doc-lint/scripts/generate-rtm.js <project>');
    process.exit(2);
  }

  const dir = projectDir(project);
  if (!fs.existsSync(dir)) {
    console.error(`项目目录不存在: ${dir}`);
    process.exit(1);
  }

  // Load PRD features
  const prdContent = readFile(path.join(dir, `prd-${project}.md`));
  if (!prdContent) {
    console.error(`PRD 文件不存在: prd-${project}.md`);
    process.exit(1);
  }
  const features = extractFeaturesFromPRD(prdContent);

  // Load architecture mapping
  const archContent = readFile(path.join(dir, `architecture-${project}.md`));
  const archMapping = archContent ? extractArchMapping(archContent) : {};

  // Load issue mapping
  const issueMapping = loadIssueMapping(project);

  // Load module mapping
  const moduleMapping = loadModuleMapping(project);

  // Build RTM
  const rtm = features.map(f => {
    const archRef = matchFeatureToArch(f, archMapping);
    const issueRef = matchFeatureToIssue(f, issueMapping);
    const moduleRef = matchFeatureToModule(f, moduleMapping);

    const hasPRD = true; // by definition
    const hasArch = !!archRef;
    const hasIssue = !!issueRef;
    const hasModule = !!moduleRef;

    let coverage = 'full';
    if (!hasArch && !hasIssue) coverage = 'prd-only';
    else if (!hasArch) coverage = 'no-arch';
    else if (!hasIssue) coverage = 'no-issue';

    return {
      id: f.id,
      name: f.name,
      priority: f.priority,
      prd_section: f.prd_section,
      module_prd: moduleRef,
      arch_mapping: archRef,
      issue: issueRef,
      coverage
    };
  });

  // Summary
  const total = rtm.length;
  const full = rtm.filter(r => r.coverage === 'full').length;
  const noArch = rtm.filter(r => r.coverage === 'no-arch').length;
  const noIssue = rtm.filter(r => r.coverage === 'no-issue').length;
  const prdOnly = rtm.filter(r => r.coverage === 'prd-only').length;
  const p0 = rtm.filter(r => /P0/i.test(r.priority));
  const p0Full = p0.filter(r => r.coverage === 'full').length;

  const date = formatDate();
  const outputDir = path.join(dir, 'gate-results');
  fs.mkdirSync(outputDir, { recursive: true });

  // JSON output
  const jsonOutput = {
    tool: 'generate-rtm',
    project,
    date,
    summary: {
      total, full, no_arch: noArch, no_issue: noIssue, prd_only: prdOnly,
      p0_total: p0.length, p0_full: p0Full,
      coverage_rate: total > 0 ? `${((full / total) * 100).toFixed(1)}%` : 'N/A',
      p0_coverage_rate: p0.length > 0 ? `${((p0Full / p0.length) * 100).toFixed(1)}%` : 'N/A'
    },
    matrix: rtm
  };

  // Markdown output
  let md = `# 需求追溯矩阵 (RTM) — ${project}\n\n`;
  md += `> **生成日期**：${date}  \n`;
  md += `> **生成工具**：doc-lint / generate-rtm.js  \n`;
  md += `> **覆盖率**：全量 ${jsonOutput.summary.coverage_rate} | P0 ${jsonOutput.summary.p0_coverage_rate}  \n\n`;
  md += `---\n\n`;

  md += `## 摘要\n\n`;
  md += `| 指标 | 值 |\n`;
  md += `|------|----|\n`;
  md += `| 总需求数 | ${total} |\n`;
  md += `| 完全覆盖 (PRD+Arch+Issue) | ${full} |\n`;
  md += `| 缺架构映射 | ${noArch} |\n`;
  md += `| 缺 Issue | ${noIssue} |\n`;
  md += `| 仅 PRD | ${prdOnly} |\n`;
  md += `| P0 总数 | ${p0.length} |\n`;
  md += `| P0 完全覆盖 | ${p0Full} |\n\n`;

  md += `## 追溯矩阵\n\n`;
  md += `| ID | 需求 | 优先级 | PRD 章节 | 模块 PRD | 架构映射 | Issue | 覆盖状态 |\n`;
  md += `|----|------|--------|----------|----------|----------|-------|----------|\n`;
  for (const r of rtm) {
    const coverIcon = r.coverage === 'full' ? '✅' :
      r.coverage === 'prd-only' ? '❌' : '⚠️';
    md += `| ${r.id} | ${r.name} | ${r.priority} | ${r.prd_section} | ${r.module_prd || '-'} | ${r.arch_mapping || '-'} | ${r.issue || '-'} | ${coverIcon} ${r.coverage} |\n`;
  }

  if (prdOnly + noArch + noIssue > 0) {
    md += `\n## 待补全项\n\n`;
    for (const r of rtm.filter(r => r.coverage !== 'full')) {
      const gaps = [];
      if (!r.arch_mapping) gaps.push('架构映射');
      if (!r.issue) gaps.push('Issue');
      if (!r.module_prd) gaps.push('模块 PRD');
      md += `- **${r.id}** ${r.name} (${r.priority}): 缺 ${gaps.join(', ')}\n`;
    }
  }

  const jsonPath = path.join(outputDir, `rtm-${date}.json`);
  const mdPath = path.join(outputDir, `rtm-${date}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2) + '\n', 'utf8');
  fs.writeFileSync(mdPath, md, 'utf8');

  console.log(`✅ RTM 生成完成: ${total} 需求, 覆盖率 ${jsonOutput.summary.coverage_rate} (P0: ${jsonOutput.summary.p0_coverage_rate})`);
  console.log(`   JSON → ${path.relative(REPO_ROOT, jsonPath)}`);
  console.log(`   MD   → ${path.relative(REPO_ROOT, mdPath)}`);

  process.exit(prdOnly > 0 ? 1 : 0);
}

main();
