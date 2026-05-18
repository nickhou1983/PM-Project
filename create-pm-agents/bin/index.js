#!/usr/bin/env node

import { resolve } from 'node:path';
import chalk from 'chalk';
import { collectAnswers } from '../src/prompts.js';
import { generate } from '../src/generator.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const skipPrompts = args.includes('--yes') || args.includes('-y');

console.log('');
console.log(chalk.bold('🤖 create-pm-agents'));
console.log(chalk.dim('向你的业务仓库注入 PM Agent/Skill 工作流体系'));
console.log('');

const targetDir = resolve(process.cwd());

try {
  const answers = await collectAnswers({ skipPrompts, targetDir });
  const result = await generate({ answers, targetDir, dryRun });

  console.log('');
  if (dryRun) {
    console.log(chalk.yellow('📋 Dry Run — 以下文件将被生成：'));
    for (const f of result.files) {
      console.log(chalk.dim(`  + ${f}`));
    }
    console.log('');
    console.log(chalk.dim(`共 ${result.files.length} 个文件，使用 --yes 或去掉 --dry-run 实际写入`));
  } else {
    console.log(chalk.green('✔') + ` 已注入 ${result.agents} 个 Agent, ${result.skills} 个 Skill, ${result.mcps} 个 MCP`);
    console.log(chalk.green('✔') + ` 生成 .github/agents/ (${result.agents} files)`);
    console.log(chalk.green('✔') + ` 生成 .github/skills/ (${result.skills} dirs)`);
    if (result.codex) {
      console.log(chalk.green('✔') + ' 生成 .codex/ (config + agents + rules)');
    }
    console.log(chalk.green('✔') + ' 生成 AGENTS.md, .github/copilot-instructions.md');
    console.log(chalk.green('✔') + ' 生成 docs/ + scripts/');
    console.log('');
    console.log(chalk.bold('Done! 运行你的 AI Agent 工作流吧 🚀'));
  }
} catch (err) {
  if (err.name === 'ExitPromptError') {
    console.log(chalk.dim('\n已取消。'));
    process.exit(0);
  }
  console.error(chalk.red('错误：'), err.message);
  process.exit(1);
}
