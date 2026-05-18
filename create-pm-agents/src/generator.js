import { resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import fs from 'fs-extra';
import { AGENTS, MCP_SERVICES, resolveSkills } from './templates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMPLATES_DIR = resolve(__dirname, '..', 'templates');

/**
 * 生成文件到目标目录
 */
export async function generate({ answers, targetDir, dryRun }) {
  const { projectName, selectedAgents, selectedMcps, techPreset, platform } = answers;
  const skills = resolveSkills(selectedAgents, techPreset);
  const files = [];

  // ─── 1. .github/agents/ ─────────────────────────────────────
  if (platform === 'copilot' || platform === 'both') {
    for (const agentId of selectedAgents) {
      const agent = AGENTS[agentId];
      if (!agent) continue;
      const src = join(TEMPLATES_DIR, 'agents', agent.file);
      const dest = join(targetDir, '.github', 'agents', agent.file);
      files.push(relative(targetDir, dest));
      if (!dryRun) await fs.copy(src, dest);
    }
  }

  // ─── 2. .github/skills/ ────────────────────────────────────
  if (platform === 'copilot' || platform === 'both') {
    for (const skillId of skills) {
      const src = join(TEMPLATES_DIR, 'skills', skillId);
      const dest = join(targetDir, '.github', 'skills', skillId);
      if (await fs.pathExists(src)) {
        const skillFiles = await collectFiles(src);
        for (const f of skillFiles) {
          const rel = relative(src, f);
          files.push(join('.github', 'skills', skillId, rel));
        }
        if (!dryRun) await fs.copy(src, dest);
      }
    }
  }

  // ─── 3. .github/instructions/ ──────────────────────────────
  if (platform === 'copilot' || platform === 'both') {
    const instrSrc = join(TEMPLATES_DIR, 'instructions');
    const instrDest = join(targetDir, '.github', 'instructions');
    if (await fs.pathExists(instrSrc)) {
      const instrFiles = await collectFiles(instrSrc);
      for (const f of instrFiles) {
        files.push(join('.github', 'instructions', relative(instrSrc, f)));
      }
      if (!dryRun) await fs.copy(instrSrc, instrDest);
    }
  }

  // ─── 4. .codex/ ────────────────────────────────────────────
  let codexGenerated = false;
  if (platform === 'codex' || platform === 'both') {
    codexGenerated = true;

    // .codex/agents/
    for (const agentId of selectedAgents) {
      const src = join(TEMPLATES_DIR, 'codex-agents', `${agentId}.toml`);
      const dest = join(targetDir, '.codex', 'agents', `${agentId}.toml`);
      if (await fs.pathExists(src)) {
        files.push(relative(targetDir, dest));
        if (!dryRun) await fs.copy(src, dest);
      }
    }

    // .codex/rules/
    const rulesSrc = join(TEMPLATES_DIR, 'codex-rules');
    const rulesDest = join(targetDir, '.codex', 'rules');
    if (await fs.pathExists(rulesSrc)) {
      const ruleFiles = await collectFiles(rulesSrc);
      for (const f of ruleFiles) {
        files.push(join('.codex', 'rules', relative(rulesSrc, f)));
      }
      if (!dryRun) await fs.copy(rulesSrc, rulesDest);
    }

    // .codex/config.toml — 动态生成
    const configContent = generateCodexConfig(selectedAgents, selectedMcps);
    const configDest = join(targetDir, '.codex', 'config.toml');
    files.push(relative(targetDir, configDest));
    if (!dryRun) await fs.outputFile(configDest, configContent);
  }

  // ─── 5. .agents/skills/ 软链接（Codex 发现入口） ────────────
  if (platform === 'codex' || platform === 'both') {
    for (const skillId of skills) {
      const linkPath = join(targetDir, '.agents', 'skills', skillId);
      const linkTarget = join('..', '..', '.github', 'skills', skillId);
      files.push(relative(targetDir, linkPath));
      if (!dryRun) {
        await fs.ensureDir(dirname(linkPath));
        if (!await fs.pathExists(linkPath)) {
          await fs.symlink(linkTarget, linkPath, 'dir');
        }
      }
    }
  }

  // ─── 6. docs/ ──────────────────────────────────────────────
  const docsSrc = join(TEMPLATES_DIR, 'docs');
  if (await fs.pathExists(docsSrc)) {
    const docFiles = await collectFiles(docsSrc);
    for (const f of docFiles) {
      files.push(join('docs', relative(docsSrc, f)));
    }
    if (!dryRun) await fs.copy(docsSrc, join(targetDir, 'docs'));
  }

  // ─── 7. scripts/workflow-manifest.js ───────────────────────
  const manifestSrc = join(TEMPLATES_DIR, 'scripts', 'workflow-manifest.js');
  if (await fs.pathExists(manifestSrc)) {
    const dest = join(targetDir, 'scripts', 'workflow-manifest.js');
    files.push(relative(targetDir, dest));
    if (!dryRun) await fs.copy(manifestSrc, dest);
  }

  // ─── 8. 顶层配置文件 ───────────────────────────────────────
  // AGENTS.md
  const agentsMdContent = generateAgentsMd(projectName, selectedAgents, skills);
  files.push('AGENTS.md');
  if (!dryRun) await fs.outputFile(join(targetDir, 'AGENTS.md'), agentsMdContent);

  // .github/copilot-instructions.md
  const copilotInstrContent = generateCopilotInstructions(projectName, selectedAgents, skills);
  files.push('.github/copilot-instructions.md');
  if (!dryRun) await fs.outputFile(join(targetDir, '.github', 'copilot-instructions.md'), copilotInstrContent);

  // projects/ 和 plans/ 目录
  if (!dryRun) {
    await fs.ensureDir(join(targetDir, 'projects'));
    await fs.ensureDir(join(targetDir, 'plans'));
  }
  files.push('projects/');
  files.push('plans/');

  return {
    files: files.sort(),
    agents: selectedAgents.length,
    skills: skills.length,
    mcps: selectedMcps.length,
    codex: codexGenerated,
  };
}

// ─── 辅助函数 ─────────────────────────────────────────────────

async function collectFiles(dir) {
  const results = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await collectFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function generateCodexConfig(selectedAgents, selectedMcps) {
  let content = `# Codex 项目级配置 — 由 create-pm-agents 生成\n\n`;
  content += `[project]\nname = "pm-agents-workflow"\n\n`;

  // Agents
  content += `# ─── Agents ───\n`;
  for (const agentId of selectedAgents) {
    content += `[[agents]]\nname = "${agentId}"\npath = ".codex/agents/${agentId}.toml"\n\n`;
  }

  // MCP Servers
  if (selectedMcps.length > 0) {
    content += `# ─── MCP Servers ───\n`;
    for (const mcpId of selectedMcps) {
      const svc = MCP_SERVICES[mcpId];
      if (!svc) continue;
      content += `[mcp_servers.${mcpId}]\n`;
      content += `command = "${svc.config.command}"\n`;
      content += `args = ${JSON.stringify(svc.config.args)}\n`;
      if (svc.config.env) {
        content += `[mcp_servers.${mcpId}.env]\n`;
        for (const [k, v] of Object.entries(svc.config.env)) {
          content += `${k} = "${v}"\n`;
        }
      }
      content += `\n`;
    }
  }

  return content;
}

function generateAgentsMd(projectName, selectedAgents, skills) {
  let md = `# AGENTS.md — Codex 项目级指令\n\n`;
  md += `本项目使用 PM Agent 工作流体系（由 create-pm-agents 生成）。\n\n`;
  md += `## Agent 索引\n\n`;
  md += `| Agent | 职责 |\n| --- | --- |\n`;

  const descriptions = {
    pm_assistant: '需求分析、查重、竞品检索、立项前价值评估',
    architect: '根据 PRD 输出技术架构方案与 ADR',
    designer: '从 PRD / wireframe 生成高保真原型',
    gate_review: 'Gate 1/2/2.5/3 评审与 Go/No-Go 决策',
    planning: '开发前上下文研究与实施规划',
    tdd_developer: '基于 Issue / 架构文档执行 TDD 开发',
    code_testing: '多层测试策略、测试补齐与覆盖分析',
    code_review: 'MUST/SHOULD/NIT 三级代码审查',
    pr_review_submit: '将审查结论写入 GitHub PR Review',
    pm_workflow_evaluator: '横向评估整条 PM 工作流健康度',
    post_launch_review: '上线复盘、数据分析与迭代建议',
  };

  for (const id of selectedAgents) {
    md += `| \`${id}\` | ${descriptions[id] || ''} |\n`;
  }

  md += `\n## Skill 索引\n\n`;
  md += `| Skill | 用途 |\n| --- | --- |\n`;
  for (const s of skills) {
    md += `| \`${s}\` | — |\n`;
  }

  md += `\n## 工作流\n\n`;
  md += '```\npm_assistant → requirement-doc → gate_review Gate 1 → architect\n';
  md += '  → gate_review Gate 2 → requirement-to-issues → tdd_developer → gate_review Gate 3\n```\n';
  md += `\n## 维护约束\n\n`;
  md += `- 使用中文输出；必要时保留英文技术术语\n`;
  md += `- 提交信息优先使用 Conventional Commits\n`;

  return md;
}

function generateCopilotInstructions(projectName, selectedAgents, skills) {
  let md = `# Project Guidelines\n\n`;
  md += `## 仓库定位\n\n`;
  md += `本项目使用 PM Agent 工作流体系管理产品需求到上线的完整流程。\n\n`;
  md += `## 目录结构\n\n`;
  md += `| 路径 | 用途 |\n|------|------|\n`;
  md += `| \`.github/agents/*.agent.md\` | GitHub Copilot Agent 定义 |\n`;
  md += `| \`.github/skills/<name>/SKILL.md\` | Skill 主定义 |\n`;
  md += `| \`.codex/agents/*.toml\` | Codex Agent 定义 |\n`;
  md += `| \`projects/prd-{name}/\` | 项目产物目录 |\n`;
  md += `| \`docs/\` | 流程规范文档 |\n`;
  md += `| \`plans/\` | 运行时 Planning 输出 |\n\n`;
  md += `## 协作流程\n\n`;
  md += '```\npm_assistant → requirement-doc → gate1 → architect → gate2\n';
  md += '  → requirement-to-issues → development → gate3 → post_launch_review\n```\n\n';
  md += `## 编写约定\n\n`;
  md += `- 使用中文撰写，技术术语可保留英文\n`;
  md += `- 使用 Conventional Commits\n`;
  md += `- Agent/Skill 文件引用 references/ 不要复制大段材料\n`;

  return md;
}
