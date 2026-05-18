import { checkbox, select, input } from '@inquirer/prompts';
import { basename } from 'node:path';
import { AGENT_GROUPS, AGENTS, MCP_SERVICES, TECH_PRESETS } from './templates.js';

/**
 * 收集用户选择
 */
export async function collectAnswers({ skipPrompts, targetDir }) {
  if (skipPrompts) {
    return {
      projectName: basename(targetDir),
      selectedAgents: Object.keys(AGENTS),
      selectedMcps: Object.keys(MCP_SERVICES),
      techPreset: 'fullstack',
      platform: 'both',
    };
  }

  const projectName = await input({
    message: '项目名称',
    default: basename(targetDir),
  });

  // Agent 选择（按分组展示）
  const agentChoices = [];
  for (const [, group] of Object.entries(AGENT_GROUPS)) {
    agentChoices.push({ name: `── ${group.label} ──`, value: '__sep__', disabled: '─' });
    for (const id of group.agents) {
      agentChoices.push({
        name: AGENTS[id].label,
        value: id,
        checked: true,
      });
    }
  }

  const selectedAgents = (await checkbox({
    message: '选择 Agent 模块（空格切换，回车确认）',
    choices: agentChoices,
  })).filter(v => v !== '__sep__');

  // MCP 服务选择
  const mcpChoices = Object.entries(MCP_SERVICES).map(([id, svc]) => ({
    name: `${svc.label} — ${svc.description}`,
    value: id,
    checked: id === 'github',
  }));

  const selectedMcps = await checkbox({
    message: '启用的 MCP 服务',
    choices: mcpChoices,
  });

  // 技术栈偏好
  const techPreset = await select({
    message: '技术栈偏好（影响 Skill 子集）',
    choices: Object.entries(TECH_PRESETS).map(([id, p]) => ({
      name: p.label,
      value: id,
    })),
    default: 'fullstack',
  });

  // 平台选择
  const platform = await select({
    message: '目标平台',
    choices: [
      { name: '双平台 (Copilot + Codex)', value: 'both' },
      { name: '仅 GitHub Copilot', value: 'copilot' },
      { name: '仅 OpenAI Codex', value: 'codex' },
    ],
    default: 'both',
  });

  return { projectName, selectedAgents, selectedMcps, techPreset, platform };
}
