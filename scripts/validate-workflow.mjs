import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { validateWorkflowContract } from '../src/workflow-contract.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, '..');
const workflowPath = join(projectRoot, 'workflow', 'lead-sniper.n8n.json');
const workflow = JSON.parse(await readFile(workflowPath, 'utf8'));
const result = validateWorkflowContract(workflow);

if (!result.valid) {
  console.error('Workflow contract validation failed:');
  for (const error of result.errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Workflow contract valid (${workflow.nodes.length} nodes).`);
}
