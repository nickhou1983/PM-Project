#!/usr/bin/env node
/**
 * prd-lint.js — PRD + Module PRD 结构 Lint
 *
 * 用法：
 *   node .github/skills/doc-lint/scripts/prd-lint.js <project>
 *
 * 检查规则 (对应 Gate 1 检查项)：
 *   R01: §1-§11 章节全部存在                (Gate1#1)
 *   R02: §4 功能概览表每行有优先级列         (Gate1#3)
 *   R03: §5 NFR 每行有目标值列               (Gate1#4)
 *   R04: §11 变更记录最新版本 = 文档头版本    (Gate1#25)
 *   R05: 状态字段为有效值                    (Gate1#26)
 *   R06: §3 用户故事有验收标准               (Gate1#2)
 *   R07: §4 RICE 列非空                     (Gate1#9)
 *   R08: 模块导航表引用文件存在              (Gate1#8)
 *   R09: 模糊词密度 < 2%                    (Gate1 新增)
 *
 * Module PRD 检查 (对应 Gate 1 F 系列)：
 *   MR01: §1 模块概述含职责和范围           (Gate1#F1)
 *   MR02: 功能点有优先级                    (Gate1#F2)
 *   MR03: P0 功能有用户故事 + AC            (Gate1#F3)
 *   MR04: §4 测试要点 ≥ 3 条               (Gate1#F5)
 *   MR05: §5 交互流程存在                   (Gate1#F6)
 *   MR06: §6.1 外部依赖已识别               (Gate1#F7)
 *   MR07: 版本号与所属 PRD 同步             (Gate1#F8)
 *   MR08: §6.3 技术参考已回填               (Dim2#2.5)
 *
 * 输出：gate-results/prd-lint-{YYYY-MM-DD}.json + .md
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

const REQUIRED_SECTIONS = [
  /^##\s+1\.\s/m, /^##\s+2\.\s/m, /^##\s+3\.\s/m, /^##\s+4\.\s/m,
  /^##\s+5\.\s/m, /^##\s+6\.\s/m, /^##\s+7\.\s/m, /^##\s+8\.\s/m,
  /^##\s+9\.\s/m, /^##\s+10\.\s/m, /^##\s+11\.\s/m
];

const VALID_STATUSES = ['草稿', '评审中', '已批准', '已替代'];

const FUZZY_WORDS = ['可能', '大约', '适当', '若干', '一些', '某些', '某种程度', '相对', '较为', '基本上', '差不多'];

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
  const section = extractSection(content, 11);
  if (!section) return null;
  const tables = extractTables(section);
  if (tables.length === 0) return null;
  const lastRow = tables[0].rows[tables[0].rows.length - 1];
  if (!lastRow) return null;
  return lastRow[0] ? lastRow[0].trim() : null;
}

function countFuzzyWords(content) {
  const cleanContent = content.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '');
  const totalChars = cleanContent.replace(/\s/g, '').length;
  let fuzzyCount = 0;
  const found = [];
  for (const word of FUZZY_WORDS) {
    const regex = new RegExp(word, 'g');
    const matches = cleanContent.match(regex);
    if (matches) {
      fuzzyCount += matches.length;
      found.push({ word, count: matches.length });
    }
  }
  return { totalChars, fuzzyCount, density: totalChars > 0 ? fuzzyCount / totalChars : 0, found };
}

function lintMainPRD(project) {
  const prdPath = path.join(projectDir(project), `prd-${project}.md`);
  const content = readFile(prdPath);
  if (!content) return [{ id: 'R00', rule: 'PRD 文件存在', result: 'fail', note: `文件不存在: ${prdPath}` }];

  const results = [];
  const header = extractHeader(content);

  // R01: §1-§11 全部存在
  const missingSections = [];
  REQUIRED_SECTIONS.forEach((regex, i) => {
    if (!regex.test(content)) missingSections.push(i + 1);
  });
  results.push({
    id: 'R01', rule: '§1-§11 章节全部存在', gate_ref: 'Gate1#1',
    result: missingSections.length === 0 ? 'pass' : 'fail',
    note: missingSections.length === 0 ? '11 个章节全部存在' : `缺少章节: §${missingSections.join(', §')}`
  });

  // R02: §4 功能概览表有优先级列
  const section4 = extractSection(content, 4);
  if (section4) {
    const tables = extractTables(section4);
    const hasPriority = tables.some(t => t.header.some(h => /优先级|priority|P0|P1|P2/i.test(h)));
    results.push({
      id: 'R02', rule: '§4 功能表有优先级列', gate_ref: 'Gate1#3',
      result: hasPriority ? 'pass' : 'warn',
      note: hasPriority ? '功能表含优先级列' : '§4 表格未找到优先级列'
    });
  } else {
    results.push({ id: 'R02', rule: '§4 功能表有优先级列', gate_ref: 'Gate1#3', result: 'fail', note: '§4 章节不存在' });
  }

  // R03: §5 NFR 有目标值列
  const section5 = extractSection(content, 5);
  if (section5) {
    const tables = extractTables(section5);
    const hasTarget = tables.some(t => t.header.some(h => /目标|指标|target|threshold|阈值/i.test(h)));
    results.push({
      id: 'R03', rule: '§5 NFR 有目标值列', gate_ref: 'Gate1#4',
      result: hasTarget ? 'pass' : 'warn',
      note: hasTarget ? 'NFR 表含目标值列' : '§5 表格未找到目标值/指标列'
    });
  } else {
    results.push({ id: 'R03', rule: '§5 NFR 有目标值列', gate_ref: 'Gate1#4', result: 'fail', note: '§5 章节不存在' });
  }

  // R04: 版本号一致性
  const changelogVersion = extractVersionFromChangelog(content);
  const versionMatch = header.version && changelogVersion &&
    header.version.replace(/^v/, '') === changelogVersion.replace(/^v/, '');
  results.push({
    id: 'R04', rule: '文档头版本 = §11 最新条目', gate_ref: 'Gate1#25',
    result: versionMatch ? 'pass' : 'warn',
    note: versionMatch
      ? `版本一致: ${header.version}`
      : `文档头 ${header.version || 'N/A'} ≠ 变更记录 ${changelogVersion || 'N/A'}`
  });

  // R05: 状态字段有效
  const validStatus = header.status && VALID_STATUSES.includes(header.status);
  results.push({
    id: 'R05', rule: '状态字段为有效值', gate_ref: 'Gate1#26',
    result: validStatus ? 'pass' : 'warn',
    note: validStatus
      ? `状态: ${header.status}`
      : `状态 "${header.status || 'N/A'}" 不在有效列表 [${VALID_STATUSES.join(', ')}]`
  });

  // R06: §3 用户故事有验收标准
  const section3 = extractSection(content, 3);
  if (section3) {
    const hasAC = /验收标准|AC|Acceptance Criteria/i.test(section3);
    results.push({
      id: 'R06', rule: '§3 用户故事有验收标准', gate_ref: 'Gate1#2',
      result: hasAC ? 'pass' : 'warn',
      note: hasAC ? '§3 包含验收标准' : '§3 未找到验收标准关键词'
    });
  } else {
    results.push({ id: 'R06', rule: '§3 用户故事有验收标准', gate_ref: 'Gate1#2', result: 'fail', note: '§3 章节不存在' });
  }

  // R07: §4 RICE 列非空
  if (section4) {
    const tables = extractTables(section4);
    const hasRICE = tables.some(t => t.header.some(h => /RICE|reach|impact|confidence|effort/i.test(h)));
    results.push({
      id: 'R07', rule: '§4 RICE 列非空', gate_ref: 'Gate1#9',
      result: hasRICE ? 'pass' : 'warn',
      note: hasRICE ? '功能表含 RICE 评分列' : '§4 表格未找到 RICE 相关列'
    });
  } else {
    results.push({ id: 'R07', rule: '§4 RICE 列非空', gate_ref: 'Gate1#9', result: 'fail', note: '§4 章节不存在' });
  }

  // R08: 模块导航表引用文件存在
  const modulesDir = path.join(projectDir(project), 'modules');
  if (fs.existsSync(modulesDir)) {
    const moduleFiles = fs.readdirSync(modulesDir).filter(f => f.startsWith('prd-') && f.endsWith('.md'));
    const moduleRefs = content.match(/modules\/prd-[\w-]+\.md/g) || [];
    const missing = moduleRefs.filter(ref => {
      const fileName = path.basename(ref);
      return !moduleFiles.includes(fileName);
    });
    results.push({
      id: 'R08', rule: '模块导航引用文件存在', gate_ref: 'Gate1#8',
      result: missing.length === 0 ? 'pass' : 'fail',
      note: missing.length === 0
        ? `${moduleFiles.length} 个模块文件全部存在`
        : `缺失文件: ${missing.join(', ')}`
    });
  } else {
    results.push({
      id: 'R08', rule: '模块导航引用文件存在', gate_ref: 'Gate1#8',
      result: 'pass', note: '非模块化 PRD，跳过'
    });
  }

  // R09: 模糊词密度
  const fuzzy = countFuzzyWords(content);
  const densityPct = (fuzzy.density * 100).toFixed(3);
  results.push({
    id: 'R09', rule: '模糊词密度 < 2%', gate_ref: '新增',
    result: fuzzy.density < 0.02 ? 'pass' : 'warn',
    note: `密度 ${densityPct}%（${fuzzy.fuzzyCount} 词 / ${fuzzy.totalChars} 字符）`,
    details: fuzzy.found.length > 0 ? fuzzy.found : undefined
  });

  return results;
}

function lintModulePRD(project, moduleFile, mainVersion) {
  const modulePath = path.join(projectDir(project), 'modules', moduleFile);
  const content = readFile(modulePath);
  if (!content) return [{ id: 'MR00', rule: 'Module PRD 文件可读', result: 'fail', note: `无法读取: ${modulePath}` }];

  const results = [];
  const header = extractHeader(content);
  const slug = moduleFile.replace('prd-', '').replace('.md', '');

  // MR01: §1 模块概述含职责和范围
  const section1 = extractSection(content, 1);
  if (section1) {
    const hasRole = /职责|responsibility/i.test(section1);
    const hasScope = /范围|scope|包含|不包含/i.test(section1);
    results.push({
      id: 'MR01', rule: '§1 模块概述含职责和范围', gate_ref: 'Gate1#F1', module: slug,
      result: hasRole && hasScope ? 'pass' : 'warn',
      note: hasRole && hasScope ? '含职责和范围描述' : `缺少: ${!hasRole ? '职责 ' : ''}${!hasScope ? '范围' : ''}`
    });
  } else {
    results.push({ id: 'MR01', rule: '§1 模块概述含职责和范围', gate_ref: 'Gate1#F1', module: slug, result: 'fail', note: '§1 不存在' });
  }

  // MR02: 功能点有优先级
  const section2 = extractSection(content, 2);
  if (section2) {
    const tables = extractTables(section2);
    const hasPriority = tables.some(t => t.header.some(h => /优先级|priority|P0|P1|P2/i.test(h)));
    results.push({
      id: 'MR02', rule: '功能点有优先级', gate_ref: 'Gate1#F2', module: slug,
      result: hasPriority ? 'pass' : 'warn',
      note: hasPriority ? '功能表含优先级列' : '§2 表格未找到优先级列'
    });
  } else {
    results.push({ id: 'MR02', rule: '功能点有优先级', gate_ref: 'Gate1#F2', module: slug, result: 'fail', note: '§2 不存在' });
  }

  // MR03: P0 功能有用户故事 + AC
  const section3 = extractSection(content, 3);
  if (section3) {
    const hasUS = /用户故事|User Story/i.test(section3);
    const hasAC = /验收标准|AC|Acceptance/i.test(section3);
    results.push({
      id: 'MR03', rule: 'P0 功能有用户故事 + AC', gate_ref: 'Gate1#F3', module: slug,
      result: hasUS && hasAC ? 'pass' : 'warn',
      note: hasUS && hasAC ? '含用户故事和验收标准' : `缺少: ${!hasUS ? 'US ' : ''}${!hasAC ? 'AC' : ''}`
    });
  } else {
    results.push({ id: 'MR03', rule: 'P0 功能有用户故事 + AC', gate_ref: 'Gate1#F3', module: slug, result: 'fail', note: '§3 不存在' });
  }

  // MR04: §4 测试要点 ≥ 3 条
  const section4 = extractSection(content, 4);
  if (section4) {
    const tables = extractTables(section4);
    const listItems = section4.match(/^[-*]\s/gm) || [];
    const totalItems = tables.reduce((sum, t) => sum + t.rows.length, 0) + listItems.length;
    results.push({
      id: 'MR04', rule: '§4 测试要点 ≥ 3 条', gate_ref: 'Gate1#F5', module: slug,
      result: totalItems >= 3 ? 'pass' : 'warn',
      note: `找到 ${totalItems} 条测试要点`
    });
  } else {
    results.push({ id: 'MR04', rule: '§4 测试要点 ≥ 3 条', gate_ref: 'Gate1#F5', module: slug, result: 'fail', note: '§4 不存在' });
  }

  // MR05: §5 交互流程存在
  const section5 = extractSection(content, 5);
  if (section5) {
    const hasFlow = /流程|状态机|mermaid|flowchart|stateDiagram|sequenceDiagram/i.test(section5);
    results.push({
      id: 'MR05', rule: '§5 交互流程存在', gate_ref: 'Gate1#F6', module: slug,
      result: hasFlow ? 'pass' : 'warn',
      note: hasFlow ? '含交互流程描述' : '§5 未找到流程/状态机描述'
    });
  } else {
    results.push({ id: 'MR05', rule: '§5 交互流程存在', gate_ref: 'Gate1#F6', module: slug, result: 'fail', note: '§5 不存在' });
  }

  // MR06: §6.1 外部依赖已识别
  const section6 = extractSection(content, 6);
  if (section6) {
    const hasDeps = /依赖|dependency|外部|第三方|API/i.test(section6);
    results.push({
      id: 'MR06', rule: '§6.1 外部依赖已识别', gate_ref: 'Gate1#F7', module: slug,
      result: hasDeps ? 'pass' : 'warn',
      note: hasDeps ? '含依赖描述' : '§6 未找到依赖描述'
    });
  } else {
    results.push({ id: 'MR06', rule: '§6.1 外部依赖已识别', gate_ref: 'Gate1#F7', module: slug, result: 'fail', note: '§6 不存在' });
  }

  // MR07: 版本号与主 PRD 同步
  if (mainVersion && header.version) {
    const match = header.version.replace(/^v/, '') === mainVersion.replace(/^v/, '');
    results.push({
      id: 'MR07', rule: '版本号与主 PRD 同步', gate_ref: 'Gate1#F8', module: slug,
      result: match ? 'pass' : 'warn',
      note: match ? `版本一致: ${header.version}` : `模块 ${header.version} ≠ 主 PRD ${mainVersion}`
    });
  } else {
    results.push({
      id: 'MR07', rule: '版本号与主 PRD 同步', gate_ref: 'Gate1#F8', module: slug,
      result: 'warn', note: `版本号缺失 (模块: ${header.version || 'N/A'}, 主PRD: ${mainVersion || 'N/A'})`
    });
  }

  // MR08: §6.3 技术参考已回填
  if (section6) {
    const techRef = /技术参考|6\.3/i.test(section6);
    const hasContent = /数据模型|API|组件|端点|endpoint/i.test(section6);
    results.push({
      id: 'MR08', rule: '§6.3 技术参考已回填', gate_ref: 'Dim2#2.5', module: slug,
      result: techRef && hasContent ? 'pass' : 'warn',
      note: techRef && hasContent ? '技术参考已回填' : '§6.3 技术参考可能未回填'
    });
  } else {
    results.push({ id: 'MR08', rule: '§6.3 技术参考已回填', gate_ref: 'Dim2#2.5', module: slug, result: 'fail', note: '§6 不存在' });
  }

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

  let md = `# PRD Lint 报告 — ${project}\n\n`;
  md += `> **检查日期**：${date}  \n`;
  md += `> **检查工具**：doc-lint / prd-lint.js  \n`;
  md += `> **结果摘要**：✅ ${pass} pass / ⚠️ ${warn} warn / ❌ ${fail} fail  \n\n`;
  md += `---\n\n`;

  md += `## 主 PRD 检查结果\n\n`;
  md += `| # | 规则 | Gate 映射 | 结果 | 说明 |\n`;
  md += `|---|------|----------|------|------|\n`;
  for (const r of mainResults) {
    const icon = r.result === 'pass' ? '✅' : r.result === 'warn' ? '⚠️' : '❌';
    md += `| ${r.id} | ${r.rule} | ${r.gate_ref} | ${icon} | ${r.note} |\n`;
  }

  if (moduleResults.length > 0) {
    md += `\n## Module PRD 检查结果\n\n`;
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
    console.error('用法: node .github/skills/doc-lint/scripts/prd-lint.js <project>');
    process.exit(2);
  }

  const dir = projectDir(project);
  if (!fs.existsSync(dir)) {
    console.error(`项目目录不存在: ${dir}`);
    process.exit(1);
  }

  // Lint main PRD
  const mainResults = lintMainPRD(project);

  // Lint Module PRDs
  const modulesDir = path.join(dir, 'modules');
  let moduleResults = [];
  const mainPrdContent = readFile(path.join(dir, `prd-${project}.md`));
  const mainVersion = mainPrdContent ? extractHeader(mainPrdContent).version : null;

  if (fs.existsSync(modulesDir)) {
    const moduleFiles = fs.readdirSync(modulesDir).filter(f => f.startsWith('prd-') && f.endsWith('.md'));
    for (const mf of moduleFiles) {
      moduleResults = moduleResults.concat(lintModulePRD(project, mf, mainVersion));
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
    tool: 'prd-lint',
    project,
    date,
    summary,
    main_prd: mainResults,
    module_prds: moduleResults
  };

  const jsonPath = path.join(outputDir, `prd-lint-${date}.json`);
  const mdPath = path.join(outputDir, `prd-lint-${date}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2) + '\n', 'utf8');
  fs.writeFileSync(mdPath, generateMarkdown(project, mainResults, moduleResults), 'utf8');

  console.log(`✅ PRD Lint 完成: ${summary.pass} pass / ${summary.warn} warn / ${summary.fail} fail`);
  console.log(`   JSON → ${path.relative(REPO_ROOT, jsonPath)}`);
  console.log(`   MD   → ${path.relative(REPO_ROOT, mdPath)}`);

  process.exit(summary.fail > 0 ? 1 : 0);
}

main();
