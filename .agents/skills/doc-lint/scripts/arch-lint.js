#!/usr/bin/env node
/**
 * arch-lint.js — 架构文档结构 Lint
 *
 * 用法：
 *   node .github/skills/doc-lint/scripts/arch-lint.js <project>
 *
 * 检查规则 (对应 Gate 2 检查项)：
 *   AR01: §0-§12 章节全部存在              (Gate2#1)
 *   AR02: §2 技术选型有选型理由列            (Gate2#2)
 *   AR03: §1.5 需求追溯矩阵存在且覆盖 P0    (Gate2#12)
 *   AR04: §3 系统架构图 Mermaid 存在         (Gate2#3)
 *   AR05: §4 ER 图 Mermaid 存在             (Gate2#4)
 *   AR06: 文档头「关联 PRD」含精确版本号      (Gate2#30)
 *   AR07: 版本号与 §12 变更记录一致          (Gate2#32)
 *   AR08: 模块级架构文件全部存在             (Gate2#9)
 *   AR09: 主架构 §0 索引表引用完整           (Gate2#10)
 *
 * 输出：gate-results/arch-lint-{YYYY-MM-DD}.json + .md
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

const ARCH_SECTIONS = [
  /^##\s+0\.\s/m, /^##\s+1\.\s/m, /^##\s+2\.\s/m, /^##\s+3\.\s/m,
  /^##\s+4\.\s/m, /^##\s+5\.\s/m, /^##\s+6\.\s/m, /^##\s+7\.\s/m,
  /^##\s+8\.\s/m, /^##\s+9\.\s/m, /^##\s+10\.\s/m, /^##\s+11\.\s/m,
  /^##\s+12\.\s/m
];

function projectDir(project) {
  return path.join(REPO_ROOT, 'projects', `prd-${project}`);
}

function readFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

function extractHeader(content) {
  const header = {};
  const versionMatch = content.match(/>\s*\*\*版本\*\*[：:]\s*(.+)/);
  if (versionMatch) header.version = versionMatch[1].trim();
  const prdMatch = content.match(/>\s*\*\*关联\s*PRD\*\*[：:]\s*(.+)/);
  if (prdMatch) header.linkedPRD = prdMatch[1].trim();
  const statusMatch = content.match(/>\s*\*\*状态\*\*[：:]\s*(.+)/);
  if (statusMatch) header.status = statusMatch[1].trim();
  return header;
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

function extractVersionFromChangelog(content) {
  const section = extractSection(content, 12);
  if (!section) return null;
  const tables = extractTables(section);
  if (tables.length === 0) return null;
  const lastRow = tables[0].rows[tables[0].rows.length - 1];
  if (!lastRow) return null;
  return lastRow[0] ? lastRow[0].trim() : null;
}

function lintArchDoc(project) {
  const archPath = path.join(projectDir(project), `architecture-${project}.md`);
  const content = readFile(archPath);
  if (!content) return [{ id: 'AR00', rule: '架构文档存在', result: 'fail', note: `文件不存在: ${archPath}` }];

  const results = [];
  const header = extractHeader(content);

  // AR01: §0-§12 全部存在
  const missingSections = [];
  ARCH_SECTIONS.forEach((regex, i) => {
    if (!regex.test(content)) missingSections.push(i === 0 ? 0 : i);
  });
  results.push({
    id: 'AR01', rule: '§0-§12 章节全部存在', gate_ref: 'Gate2#1',
    result: missingSections.length === 0 ? 'pass' : 'fail',
    note: missingSections.length === 0 ? '13 个章节全部存在' : `缺少章节: §${missingSections.join(', §')}`
  });

  // AR02: §2 技术选型有理由列
  const section2 = extractSection(content, 2);
  if (section2) {
    const tables = extractTables(section2);
    const hasReason = tables.some(t => t.header.some(h => /理由|reason|说明|选型依据|why/i.test(h)));
    results.push({
      id: 'AR02', rule: '§2 技术选型有选型理由', gate_ref: 'Gate2#2',
      result: hasReason ? 'pass' : 'warn',
      note: hasReason ? '选型表含理由/说明列' : '§2 表格未找到理由/说明列'
    });
  } else {
    results.push({ id: 'AR02', rule: '§2 技术选型有选型理由', gate_ref: 'Gate2#2', result: 'fail', note: '§2 不存在' });
  }

  // AR03: §1.5 需求追溯矩阵存在
  const section1 = extractSection(content, 1);
  if (section1) {
    const hasRTM = /需求追溯矩阵|1\.5|追溯|Traceability/i.test(section1);
    const tables = extractTables(section1);
    const hasP0 = tables.some(t => t.rows.some(r => r.some(c => /P0/i.test(c))));
    results.push({
      id: 'AR03', rule: '§1.5 需求追溯矩阵覆盖 P0', gate_ref: 'Gate2#12',
      result: hasRTM && hasP0 ? 'pass' : hasRTM ? 'warn' : 'fail',
      note: hasRTM && hasP0 ? '追溯矩阵存在且含 P0 映射'
        : hasRTM ? '追溯矩阵存在但未检测到 P0 映射'
        : '§1 未找到需求追溯矩阵'
    });
  } else {
    results.push({ id: 'AR03', rule: '§1.5 需求追溯矩阵覆盖 P0', gate_ref: 'Gate2#12', result: 'fail', note: '§1 不存在' });
  }

  // AR04: §3 系统架构图 Mermaid 存在
  const section3 = extractSection(content, 3);
  if (section3) {
    const hasMermaid = /```mermaid/i.test(section3);
    results.push({
      id: 'AR04', rule: '§3 系统架构图 Mermaid 存在', gate_ref: 'Gate2#3',
      result: hasMermaid ? 'pass' : 'warn',
      note: hasMermaid ? '§3 含 Mermaid 架构图' : '§3 未找到 Mermaid 代码块'
    });
  } else {
    results.push({ id: 'AR04', rule: '§3 系统架构图 Mermaid 存在', gate_ref: 'Gate2#3', result: 'fail', note: '§3 不存在' });
  }

  // AR05: §4 ER 图 Mermaid 存在
  const section4 = extractSection(content, 4);
  if (section4) {
    const hasMermaid = /```mermaid/i.test(section4);
    results.push({
      id: 'AR05', rule: '§4 ER 图 Mermaid 存在', gate_ref: 'Gate2#4',
      result: hasMermaid ? 'pass' : 'warn',
      note: hasMermaid ? '§4 含 Mermaid ER 图' : '§4 未找到 Mermaid 代码块'
    });
  } else {
    results.push({ id: 'AR05', rule: '§4 ER 图 Mermaid 存在', gate_ref: 'Gate2#4', result: 'fail', note: '§4 不存在' });
  }

  // AR06: 文档头「关联 PRD」含精确版本号
  if (header.linkedPRD) {
    const hasVersion = /v\d+\.\d+\.\d+/.test(header.linkedPRD);
    results.push({
      id: 'AR06', rule: '关联 PRD 含精确版本号', gate_ref: 'Gate2#30',
      result: hasVersion ? 'pass' : 'warn',
      note: hasVersion ? `关联 PRD: ${header.linkedPRD}` : `关联 PRD 未含精确版本号: ${header.linkedPRD}`
    });
  } else {
    results.push({ id: 'AR06', rule: '关联 PRD 含精确版本号', gate_ref: 'Gate2#30', result: 'warn', note: '文档头未找到「关联 PRD」字段' });
  }

  // AR07: 版本号与 §12 变更记录一致
  const changelogVersion = extractVersionFromChangelog(content);
  const versionMatch = header.version && changelogVersion &&
    header.version.replace(/^v/, '') === changelogVersion.replace(/^v/, '');
  results.push({
    id: 'AR07', rule: '版本号与 §12 变更记录一致', gate_ref: 'Gate2#32',
    result: versionMatch ? 'pass' : 'warn',
    note: versionMatch
      ? `版本一致: ${header.version}`
      : `文档头 ${header.version || 'N/A'} ≠ 变更记录 ${changelogVersion || 'N/A'}`
  });

  // AR08: 模块级架构文件全部存在
  const dir = projectDir(project);
  const modulesDir = path.join(dir, 'modules');
  if (fs.existsSync(modulesDir)) {
    const moduleFiles = fs.readdirSync(modulesDir).filter(f => f.startsWith('prd-') && f.endsWith('.md'));
    const missing = [];
    for (const mf of moduleFiles) {
      const slug = mf.replace('prd-', '').replace('.md', '');
      const archFile = `architecture-${project}-${slug}.md`;
      if (!fs.existsSync(path.join(dir, archFile))) {
        missing.push(archFile);
      }
    }
    results.push({
      id: 'AR08', rule: '模块级架构文件全部存在', gate_ref: 'Gate2#9',
      result: missing.length === 0 ? 'pass' : 'fail',
      note: missing.length === 0 ? `${moduleFiles.length} 个模块架构文件全部存在` : `缺失: ${missing.join(', ')}`
    });
  } else {
    results.push({
      id: 'AR08', rule: '模块级架构文件全部存在', gate_ref: 'Gate2#9',
      result: 'pass', note: '非模块化，跳过'
    });
  }

  // AR09: §0 索引表引用完整
  const section0 = extractSection(content, 0);
  if (section0 && fs.existsSync(modulesDir)) {
    const moduleFiles = fs.readdirSync(modulesDir).filter(f => f.startsWith('prd-') && f.endsWith('.md'));
    const missingRefs = [];
    for (const mf of moduleFiles) {
      const slug = mf.replace('prd-', '').replace('.md', '');
      const archFileName = `architecture-${project}-${slug}`;
      if (!section0.includes(archFileName)) {
        missingRefs.push(archFileName);
      }
    }
    results.push({
      id: 'AR09', rule: '§0 索引表引用完整', gate_ref: 'Gate2#10',
      result: missingRefs.length === 0 ? 'pass' : 'warn',
      note: missingRefs.length === 0 ? '§0 索引表引用全部模块架构' : `§0 缺少引用: ${missingRefs.join(', ')}`
    });
  } else if (!section0) {
    results.push({ id: 'AR09', rule: '§0 索引表引用完整', gate_ref: 'Gate2#10', result: 'fail', note: '§0 不存在' });
  } else {
    results.push({ id: 'AR09', rule: '§0 索引表引用完整', gate_ref: 'Gate2#10', result: 'pass', note: '非模块化，跳过' });
  }

  return results;
}

function lintModuleArch(project, slug) {
  const archPath = path.join(projectDir(project), `architecture-${project}-${slug}.md`);
  const content = readFile(archPath);
  if (!content) return [];

  const results = [];
  const header = extractHeader(content);

  // Check linked Module PRD version
  if (header.linkedPRD) {
    const hasVersion = /v\d+\.\d+\.\d+/.test(header.linkedPRD);
    results.push({
      id: 'MAR01', rule: '模块架构关联 Module PRD 版本', gate_ref: 'Gate2#34', module: slug,
      result: hasVersion ? 'pass' : 'warn',
      note: hasVersion ? `关联: ${header.linkedPRD}` : '未含精确版本号'
    });
  }

  // Check Mermaid diagrams exist
  const hasMermaid = /```mermaid/i.test(content);
  results.push({
    id: 'MAR02', rule: '模块架构含 Mermaid 图', gate_ref: 'Gate2#11', module: slug,
    result: hasMermaid ? 'pass' : 'warn',
    note: hasMermaid ? '含 Mermaid 图' : '未找到 Mermaid 代码块'
  });

  return results;
}

function formatDate() {
  return new Date().toISOString().slice(0, 10);
}

function generateMarkdown(project, mainResults, moduleResults) {
  const date = formatDate();
  const allResults = [...mainResults, ...moduleResults];
  const pass = allResults.filter(r => r.result === 'pass').length;
  const warn = allResults.filter(r => r.result === 'warn').length;
  const fail = allResults.filter(r => r.result === 'fail').length;

  let md = `# 架构文档 Lint 报告 — ${project}\n\n`;
  md += `> **检查日期**：${date}  \n`;
  md += `> **检查工具**：doc-lint / arch-lint.js  \n`;
  md += `> **结果摘要**：✅ ${pass} pass / ⚠️ ${warn} warn / ❌ ${fail} fail  \n\n`;
  md += `---\n\n`;

  md += `## 主架构文档检查结果\n\n`;
  md += `| # | 规则 | Gate 映射 | 结果 | 说明 |\n`;
  md += `|---|------|----------|------|------|\n`;
  for (const r of mainResults) {
    const icon = r.result === 'pass' ? '✅' : r.result === 'warn' ? '⚠️' : '❌';
    md += `| ${r.id} | ${r.rule} | ${r.gate_ref} | ${icon} | ${r.note} |\n`;
  }

  if (moduleResults.length > 0) {
    md += `\n## 模块级架构检查结果\n\n`;
    md += `| # | 规则 | Gate 映射 | 模块 | 结果 | 说明 |\n`;
    md += `|---|------|----------|------|------|------|\n`;
    for (const r of moduleResults) {
      const icon = r.result === 'pass' ? '✅' : r.result === 'warn' ? '⚠️' : '❌';
      md += `| ${r.id} | ${r.rule} | ${r.gate_ref} | ${r.module || '-'} | ${icon} | ${r.note} |\n`;
    }
  }

  return md;
}

function main() {
  const project = process.argv[2];
  if (!project) {
    console.error('用法: node .github/skills/doc-lint/scripts/arch-lint.js <project>');
    process.exit(2);
  }

  const dir = projectDir(project);
  if (!fs.existsSync(dir)) {
    console.error(`项目目录不存在: ${dir}`);
    process.exit(1);
  }

  const mainResults = lintArchDoc(project);

  // Lint module architectures
  let moduleResults = [];
  const modulesDir = path.join(dir, 'modules');
  if (fs.existsSync(modulesDir)) {
    const moduleFiles = fs.readdirSync(modulesDir).filter(f => f.startsWith('prd-') && f.endsWith('.md'));
    for (const mf of moduleFiles) {
      const slug = mf.replace('prd-', '').replace('.md', '');
      moduleResults = moduleResults.concat(lintModuleArch(project, slug));
    }
  }

  // Output
  const date = formatDate();
  const outputDir = path.join(dir, 'gate-results');
  fs.mkdirSync(outputDir, { recursive: true });

  const allResults = [...mainResults, ...moduleResults];
  const summary = {
    total: allResults.length,
    pass: allResults.filter(r => r.result === 'pass').length,
    warn: allResults.filter(r => r.result === 'warn').length,
    fail: allResults.filter(r => r.result === 'fail').length
  };

  const jsonOutput = {
    tool: 'arch-lint',
    project,
    date,
    summary,
    main_arch: mainResults,
    module_archs: moduleResults
  };

  const jsonPath = path.join(outputDir, `arch-lint-${date}.json`);
  const mdPath = path.join(outputDir, `arch-lint-${date}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2) + '\n', 'utf8');
  fs.writeFileSync(mdPath, generateMarkdown(project, mainResults, moduleResults), 'utf8');

  console.log(`✅ 架构 Lint 完成: ${summary.pass} pass / ${summary.warn} warn / ${summary.fail} fail`);
  console.log(`   JSON → ${path.relative(REPO_ROOT, jsonPath)}`);
  console.log(`   MD   → ${path.relative(REPO_ROOT, mdPath)}`);

  process.exit(summary.fail > 0 ? 1 : 0);
}

main();
