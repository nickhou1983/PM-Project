/**
 * Agent / Skill / MCP 依赖图与分组定义
 */

// ─── Agent 分组 ──────────────────────────────────────────────
export const AGENT_GROUPS = {
  core: {
    label: '核心 PM 流',
    agents: ['pm_assistant', 'gate_review', 'pm_workflow_evaluator', 'post_launch_review'],
  },
  design: {
    label: '设计流',
    agents: ['architect', 'designer'],
  },
  dev: {
    label: '开发流',
    agents: ['planning', 'tdd_developer', 'code_testing', 'code_review', 'pr_review_submit'],
  },
};

// ─── Agent 元数据 ─────────────────────────────────────────────
export const AGENTS = {
  pm_assistant: {
    label: '需求分析 (pm_assistant)',
    file: 'pm_assistant.agent.md',
    skills: ['requirement-doc', 'requirement-to-issues'],
  },
  architect: {
    label: '架构设计 (architect)',
    file: 'architect.agent.md',
    skills: ['architect-doc'],
  },
  designer: {
    label: '原型设计 (designer)',
    file: 'designer.agent.md',
    skills: ['prototype-design', 'prototype-publish', 'premium-frontend-ui'],
  },
  gate_review: {
    label: 'Gate 评审 (gate_review)',
    file: 'gate_review.agent.md',
    skills: ['gate-review', 'doc-lint', 'doc-quality-judge'],
  },
  planning: {
    label: '任务规划 (planning)',
    file: 'planning.agent.md',
    skills: [],
  },
  tdd_developer: {
    label: 'TDD 开发 (tdd_developer)',
    file: 'tdd_developer.agent.md',
    skills: ['tdd-coder'],
  },
  code_testing: {
    label: '测试 (code_testing)',
    file: 'code_testing.agent.md',
    skills: ['playwright-testing'],
  },
  code_review: {
    label: '代码审查 (code_review)',
    file: 'code_review.agent.md',
    skills: ['code-review', 'security-audit'],
  },
  pr_review_submit: {
    label: 'PR 提交 (pr_review_submit)',
    file: 'pr_review_submit.agent.md',
    skills: ['github-publish'],
  },
  pm_workflow_evaluator: {
    label: '工作流评估 (pm_workflow_evaluator)',
    file: 'pm_workflow_evaluator.agent.md',
    skills: ['workflow-dashboard'],
  },
  post_launch_review: {
    label: '上线复盘 (post_launch_review)',
    file: 'post_launch_review.agent.md',
    skills: [],
  },
};

// ─── MCP 服务 ─────────────────────────────────────────────────
export const MCP_SERVICES = {
  github: {
    label: 'GitHub',
    description: 'Issue/PR/Repo 管理',
    config: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: { GITHUB_PERSONAL_ACCESS_TOKEN: '{{GITHUB_TOKEN}}' },
    },
  },
  playwright: {
    label: 'Playwright',
    description: 'UI/E2E 自动化测试',
    config: {
      command: 'npx',
      args: ['-y', '@anthropic-ai/mcp-server-playwright'],
    },
  },
  feishu: {
    label: '飞书',
    description: '飞书文档/知识库 MCP',
    config: {
      command: 'npx',
      args: ['-y', '@anthropic-ai/mcp-server-feishu'],
      env: { FEISHU_APP_ID: '{{FEISHU_APP_ID}}', FEISHU_APP_SECRET: '{{FEISHU_APP_SECRET}}' },
    },
  },
  modao: {
    label: '墨刀',
    description: '原型设计平台',
    config: {
      command: 'npx',
      args: ['-y', '@anthropic-ai/mcp-server-modao'],
      env: { MODAO_TOKEN: '{{MODAO_TOKEN}}' },
    },
  },
  tavily: {
    label: 'Tavily',
    description: '网络搜索与研究',
    config: {
      command: 'npx',
      args: ['-y', 'tavily-mcp@latest'],
      env: { TAVILY_API_KEY: '{{TAVILY_API_KEY}}' },
    },
  },
};

// ─── 技术栈偏好 → Skill 过滤 ──────────────────────────────────
export const TECH_PRESETS = {
  frontend: {
    label: '前端 (React/Vue)',
    extraSkills: ['premium-frontend-ui', 'playwright-testing'],
    removeSkills: ['microservices'],
  },
  backend: {
    label: '后端 (Node/Go/Java)',
    extraSkills: ['microservices', 'security-audit'],
    removeSkills: ['premium-frontend-ui', 'prototype-design', 'prototype-publish'],
  },
  fullstack: {
    label: '全栈',
    extraSkills: [],
    removeSkills: [],
  },
};

// ─── 公共 Skill（始终包含） ────────────────────────────────────
export const COMMON_SKILLS = ['feishu-docs'];

// ─── Skill 目录结构（用于判断是否含子文件夹） ──────────────────
export const SKILLS_WITH_REFS = [
  'requirement-doc',
  'architect-doc',
  'gate-review',
  'github-publish',
  'prototype-design',
  'prototype-publish',
  'microservices',
  'playwright-testing',
  'workflow-dashboard',
];

/**
 * 解析用户选择，返回最终需要包含的 Skill 列表
 */
export function resolveSkills(selectedAgents, techPreset) {
  const skillSet = new Set(COMMON_SKILLS);

  // 从 Agent 依赖收集
  for (const agentId of selectedAgents) {
    const agent = AGENTS[agentId];
    if (agent) {
      for (const s of agent.skills) {
        skillSet.add(s);
      }
    }
  }

  // 技术栈偏好追加
  const preset = TECH_PRESETS[techPreset];
  if (preset) {
    for (const s of preset.extraSkills) skillSet.add(s);
    for (const s of preset.removeSkills) skillSet.delete(s);
  }

  return [...skillSet].sort();
}
