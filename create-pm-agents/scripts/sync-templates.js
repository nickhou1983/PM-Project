#!/usr/bin/env node

/**
 * 同步脚本：从 PM-Project 源目录复制模板文件到 create-pm-agents/templates/
 * 用法：node scripts/sync-templates.js
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const PM_ROOT = resolve(ROOT, '..');
const TEMPLATES = resolve(ROOT, 'templates');

async function sync() {
  console.log('🔄 同步模板文件...\n');

  // 清空 templates/
  await fs.emptyDir(TEMPLATES);

  // 1. agents/
  console.log('  → agents/');
  await fs.copy(
    resolve(PM_ROOT, '.github', 'agents'),
    resolve(TEMPLATES, 'agents'),
  );

  // 2. skills/
  console.log('  → skills/');
  await fs.copy(
    resolve(PM_ROOT, '.github', 'skills'),
    resolve(TEMPLATES, 'skills'),
  );

  // 3. instructions/
  console.log('  → instructions/');
  const instrSrc = resolve(PM_ROOT, '.github', 'instructions');
  if (await fs.pathExists(instrSrc)) {
    await fs.copy(instrSrc, resolve(TEMPLATES, 'instructions'));
  }

  // 4. codex-agents/
  console.log('  → codex-agents/');
  const codexAgentsSrc = resolve(PM_ROOT, '.codex', 'agents');
  if (await fs.pathExists(codexAgentsSrc)) {
    await fs.copy(codexAgentsSrc, resolve(TEMPLATES, 'codex-agents'));
  }

  // 5. codex-rules/
  console.log('  → codex-rules/');
  const codexRulesSrc = resolve(PM_ROOT, '.codex', 'rules');
  if (await fs.pathExists(codexRulesSrc)) {
    await fs.copy(codexRulesSrc, resolve(TEMPLATES, 'codex-rules'));
  }

  // 6. docs/
  console.log('  → docs/');
  await fs.copy(
    resolve(PM_ROOT, 'docs'),
    resolve(TEMPLATES, 'docs'),
  );

  // 7. scripts/workflow-manifest.js
  console.log('  → scripts/workflow-manifest.js');
  const manifestSrc = resolve(PM_ROOT, 'scripts', 'workflow-manifest.js');
  if (await fs.pathExists(manifestSrc)) {
    await fs.ensureDir(resolve(TEMPLATES, 'scripts'));
    await fs.copy(manifestSrc, resolve(TEMPLATES, 'scripts', 'workflow-manifest.js'));
  }

  console.log('\n✅ 同步完成！');

  // 统计
  const agentCount = (await fs.readdir(resolve(TEMPLATES, 'agents'))).length;
  const skillCount = (await fs.readdir(resolve(TEMPLATES, 'skills'))).length;
  console.log(`   Agents: ${agentCount}, Skills: ${skillCount}`);
}

sync().catch(err => {
  console.error('❌ 同步失败:', err.message);
  process.exit(1);
});
