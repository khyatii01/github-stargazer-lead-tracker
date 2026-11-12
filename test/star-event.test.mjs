import test from 'node:test';
import assert from 'node:assert/strict';
import { parseStarCreatedEvent } from '../src/star-event.mjs';

test('extracts username and repository from a created event', () => {
  const result = parseStarCreatedEvent({
    body: {
      action: 'created',
      starred_at: '2026-11-11T10:00:00Z',
      sender: { login: 'octocat' },
      repository: { full_name: 'n8n-io/n8n' },
    },
  });
  assert.deepEqual(result, {
    kind: 'star-created',
    username: 'octocat',
    repository: 'n8n-io/n8n',
    starredAt: '2026-11-11T10:00:00Z',
  });
});

test('ignores deletion and GitHub ping events', () => {
  assert.equal(parseStarCreatedEvent({ action: 'deleted' }).kind, 'ignored');
  assert.equal(parseStarCreatedEvent({ zen: 'Keep it logically awesome.' }).reason, 'github-ping');
});

test('rejects malformed created events', () => {
  assert.throws(() => parseStarCreatedEvent({ action: 'created', sender: {}, repository: {} }), /sender.login/);
});
