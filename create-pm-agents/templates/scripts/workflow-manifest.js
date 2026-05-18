#!/usr/bin/env node
/**
 * workflow-manifest.js — 维护 projects/prd-{project}/workflow-manifest.json
 *
 * 用法：
 *   node scripts/workflow-manifest.js init  <project>
 *   node scripts/workflow-manifest.js show  <project>
 *   node scripts/workflow-manifest.js set   <project> <stage>          # JSON 通过 stdin 传入
 *   node scripts/workflow-manifest.js check <project> <stage>          # 校验上游
 *   node scripts/workflow-manifest.js feedback <project> <jsonOnStdin> # 追加 feedback_log 项
 *
 * 规范：docs/workflow-manifest-spec.md
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const MANIFEST_VERSION = '1.0';

const VALID_STAGES = [
  'intake', 'prd', 'gate1', 'design', 'architecture',
  'gate2', 'issues', 'gate2_5', 'development', 'gate3', 'post_launch'
];

const UPSTREAM_RULES = {
  intake:       { requires: [], gateOk: [] },
  prd:          { requires: ['intake'], gateOk: [] },
  gate1:        { requires: ['prd'], gateOk: [] },
  design:       { requires: ['prd'], gateOk: ['gate1'] },
  architecture: { requires: ['prd'], gateOk: ['gate1'] },
  gate2:        { requires: ['architecture'], gateOk: ['gate1'] },
  issues:       { requires: ['architecture'], gateOk: ['gate2'] },
  gate2_5:      { requires: ['issues'], gateOk: [] },
  development:  { requires: ['issues'], gateOk: ['gate2', 'gate2_5_or_merged'] },
  gate3:        { requires: ['development'], gateOk: [] },
  post_launch:  { requires: ['gate3'], gateOk: ['gate3'] }
};

function manifestPath(project) {
  return path.join(REPO_ROOT, 'projects', `prd-${project}`, 'workflow-manifest.json');
}

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function emptyManifest(project) {
  return {
    project,
    manifest_version: MANIFEST_VERSION,
    current_stage: null,
    updated_at: new Date().toISOString(),
    stages: {},
    feedback_log: []
  };
}

function loadOrInit(project) {
  const file = manifestPath(project);
  const data = readJson(file);
  return data || emptyManifest(project);
}

function readStdinJson() {
  const raw = fs.readFileSync(0, 'utf8').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('stdin 不是合法 JSON:', e.message);
    process.exit(2);
  }
}

function ensureStage(stage) {
  if (!VALID_STAGES.includes(stage)) {
    console.error(`未知阶段: ${stage}\n合法值: ${VALID_STAGES.join(', ')}`);
    process.exit(2);
  }
}

function isGateOk(stages, stage) {
  if (stage === 'gate2_5_or_merged') {
    const g2 = stages.gate2 || {};
    const g25 = stages.gate2_5 || {};
    if (g2.merged_with_gate2_5) return g2.decision !== 'No-Go';
    return g25.decision && g25.decision !== 'No-Go';
  }
  const s = stages[stage];
  if (!s || !s.decision) return false;
  return s.decision !== 'No-Go';
}

function checkUpstream(manifest, stage) {
  const rule = UPSTREAM_RULES[stage];
  const errs = [];
  for (const req of rule.requires) {
    if (!manifest.stages[req]) errs.push(`缺少上游阶段: ${req}`);
  }
  for (const gate of rule.gateOk) {
    if (!isGateOk(manifest.stages, gate)) errs.push(`上游 Gate 未通过: ${gate}`);
  }
  return errs;
}

function cmdInit(project) {
  const file = manifestPath(project);
  if (fs.existsSync(file)) {
    console.error(`已存在: ${file}`);
    process.exit(1);
  }
  writeJson(file, emptyManifest(project));
  console.log(`已初始化: ${file}`);
}

function cmdShow(project) {
  const data = loadOrInit(project);
  process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}

function cmdSet(project, stage) {
  ensureStage(stage);
  const payload = readStdinJson();
  const manifest = loadOrInit(project);
  manifest.stages[stage] = { ...(manifest.stages[stage] || {}), ...payload };
  manifest.current_stage = stage;
  manifest.updated_at = new Date().toISOString();
  writeJson(manifestPath(project), manifest);
  console.log(`已写入 stages.${stage}`);
}

function cmdCheck(project, stage) {
  ensureStage(stage);
  const manifest = loadOrInit(project);
  const errs = checkUpstream(manifest, stage);
  if (errs.length === 0) {
    console.log(`OK: 上游就绪，可执行 ${stage}`);
    process.exit(0);
  }
  console.error(`阻塞: ${stage} 无法启动`);
  errs.forEach(e => console.error(' - ' + e));
  process.exit(3);
}

function cmdFeedback(project) {
  const payload = readStdinJson();
  if (!payload.from_stage || !payload.to_stage || !payload.file) {
    console.error('feedback JSON 必须含 from_stage / to_stage / file');
    process.exit(2);
  }
  const manifest = loadOrInit(project);
  manifest.feedback_log.push({
    from_stage: payload.from_stage,
    to_stage: payload.to_stage,
    file: payload.file,
    blocking: !!payload.blocking,
    opened_at: payload.opened_at || new Date().toISOString().slice(0, 10),
    closed_at: payload.closed_at || null
  });
  manifest.updated_at = new Date().toISOString();
  writeJson(manifestPath(project), manifest);
  console.log('已追加 feedback_log');
}

function main() {
  const [, , cmd, project, stage] = process.argv;
  if (!cmd || !project) {
    console.error('用法: node scripts/workflow-manifest.js <init|show|set|check|feedback> <project> [stage]');
    process.exit(2);
  }
  switch (cmd) {
    case 'init': return cmdInit(project);
    case 'show': return cmdShow(project);
    case 'set': return stage ? cmdSet(project, stage) : (console.error('set 需要 stage'), process.exit(2));
    case 'check': return stage ? cmdCheck(project, stage) : (console.error('check 需要 stage'), process.exit(2));
    case 'feedback': return cmdFeedback(project);
    default:
      console.error(`未知命令: ${cmd}`);
      process.exit(2);
  }
}

main();
