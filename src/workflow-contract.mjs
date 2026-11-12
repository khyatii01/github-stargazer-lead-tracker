const SECRET_PATTERNS = [
  /gh[pousr]_[A-Za-z0-9_]{20,}/,
  /sk-[A-Za-z0-9_-]{20,}/,
  /discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9._-]+/i,
];

function findNode(workflow, name) {
  return workflow.nodes?.find((node) => node.name === name);
}

function connectionTargets(workflow, source) {
  const main = workflow.connections?.[source]?.main ?? [];
  return main.flat().map((connection) => connection.node);
}

export function validateWorkflowContract(workflow) {
  const errors = [];
  if (!workflow || typeof workflow !== 'object') {
    return { valid: false, errors: ['Workflow must be an object'] };
  }

  const requiredNodes = [
    ['GitHub Star Webhook', 'n8n-nodes-base.webhook'],
    ['Parse & Validate Star Event', 'n8n-nodes-base.code'],
    ['Fetch GitHub User Profile', 'n8n-nodes-base.httpRequest'],
    ['High-Value Lead?', 'n8n-nodes-base.if'],
    ['Build Discord Message', 'n8n-nodes-base.code'],
    ['Send Discord Webhook', 'n8n-nodes-base.httpRequest'],
  ];

  for (const [name, type] of requiredNodes) {
    const node = findNode(workflow, name);
    if (!node) errors.push(`Missing node: ${name}`);
    else if (node.type !== type) errors.push(`${name} must use ${type}`);
  }

  const aiNode = workflow.nodes?.find((node) => {
    const name = String(node.name ?? '').toLowerCase();
    const type = String(node.type ?? '').toLowerCase();
    return name.includes('sales pitch') || type.includes('openai') || type.includes('gemini');
  });

  if (!aiNode) {
    errors.push('Missing AI node: expected an OpenAI or Google Gemini node');
  } else {
    const aiType = String(aiNode.type ?? '').toLowerCase();
    const isSupportedAI = aiType.includes('openai') || aiType.includes('gemini') || aiType.includes('langchain');
    if (!isSupportedAI) errors.push('AI node must be OpenAI or Google Gemini LLM based');
    if (!JSON.stringify(aiNode.parameters ?? {}).includes('one sentence')) {
      errors.push('AI prompt must request one sentence');
    }
  }

  const webhook = findNode(workflow, 'GitHub Star Webhook');
  if (webhook?.parameters?.httpMethod !== 'POST') errors.push('Webhook must accept POST');
  if (webhook?.parameters?.path !== 'github-star-lead') errors.push('Webhook path must be github-star-lead');

  const fetchProfile = findNode(workflow, 'Fetch GitHub User Profile');
  const fetchUrl = String(fetchProfile?.parameters?.url ?? '');
  if (!fetchUrl.includes('api.github.com/users/')) errors.push('GitHub profile endpoint is missing');
  const headersText = JSON.stringify(fetchProfile?.parameters?.headerParameters ?? {});
  if (!headersText.includes('GITHUB_TOKEN')) errors.push('GitHub token must be referenced from the environment');
  if (fetchProfile?.retryOnFail !== true || Number(fetchProfile?.maxTries) < 2) {
    errors.push('GitHub request must enable retry-on-fail');
  }

  const leadFilter = findNode(workflow, 'High-Value Lead?');
  const conditions = leadFilter?.parameters?.conditions;
  if (conditions?.combinator !== 'or') errors.push('Lead filter must use OR semantics');
  const conditionList = conditions?.conditions ?? [];
  const thresholdPairs = conditionList.map((condition) => [
    String(condition.leftValue ?? ''),
    Number(condition.rightValue),
    condition.operator?.operation,
  ]);
  if (!thresholdPairs.some(([left, right, operation]) => left.includes('followers') && right === 100 && operation === 'gt')) {
    errors.push('Lead filter must require followers > 100');
  }
  if (!thresholdPairs.some(([left, right, operation]) => left.includes('public_repos') && right === 50 && operation === 'gt')) {
    errors.push('Lead filter must require public_repos > 50');
  }

  const discord = findNode(workflow, 'Send Discord Webhook');
  if (!String(discord?.parameters?.url ?? '').includes('DISCORD_WEBHOOK_URL')) {
    errors.push('Discord webhook URL must come from the environment');
  }

  const requiredEdges = [
    ['GitHub Star Webhook', 'Parse & Validate Star Event'],
    ['Parse & Validate Star Event', 'Fetch GitHub User Profile'],
    ['Fetch GitHub User Profile', 'High-Value Lead?'],
  ];
  if (aiNode) {
    requiredEdges.push(['High-Value Lead?', aiNode.name]);
    requiredEdges.push([aiNode.name, 'Build Discord Message']);
  }
  requiredEdges.push(['Build Discord Message', 'Send Discord Webhook']);

  for (const [source, target] of requiredEdges) {
    if (!connectionTargets(workflow, source).includes(target)) errors.push(`Missing connection: ${source} -> ${target}`);
  }

  const serialized = JSON.stringify(workflow);
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(serialized)) errors.push(`Workflow appears to contain a hardcoded secret matching ${pattern}`);
  }

  return { valid: errors.length === 0, errors };
}
