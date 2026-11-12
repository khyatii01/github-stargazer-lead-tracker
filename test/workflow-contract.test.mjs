import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { validateWorkflowContract } from '../src/workflow-contract.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, '..');
const workflow = JSON.parse(await readFile(join(projectRoot, 'workflow', 'lead-sniper.n8n.json'), 'utf8'));

test('workflow satisfies the executable contract', () => {
  const result = validateWorkflowContract(workflow);
  assert.deepEqual(result.errors, []);
  assert.equal(result.valid, true);
});

test('validator catches an AND filter regression', () => {
  const clone = structuredClone(workflow);
  const filter = clone.nodes.find((node) => node.name === 'High-Value Lead?');
  filter.parameters.conditions.combinator = 'and';
  const result = validateWorkflowContract(clone);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('OR semantics')));
});

test('workflow contains no exported credential bindings', () => {
  for (const node of workflow.nodes) {
    assert.equal(node.credentials, undefined);
  }
});
