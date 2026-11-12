import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSalesPitchPrompt, normalizeSalesPitch } from '../src/pitch.mjs';
import { buildDiscordWebhookPayload } from '../src/discord.mjs';

const profile = {
  login: 'octocat',
  name: 'monalisa octocat',
  company: 'GitHub',
  bio: 'Design and build all the things. Interested in Open Source and AI.',
  followers: 120,
  public_repos: 52,
  avatar_url: 'https://example.test/avatar.png',
  html_url: 'https://github.com/octocat',
};

test('prompt delimits profile data and requests one sentence', () => {
  const prompt = buildSalesPitchPrompt(profile, 'n8n-io/n8n');
  assert.match(prompt.system, /exactly one sentence/i);
  assert.match(prompt.system, /untrusted data/i);
  assert.match(prompt.user, /<profile>/);
  assert.match(prompt.user, /GitHub/);
});

test('model response normalization supports n8n message shape', () => {
  assert.equal(normalizeSalesPitch({ message: { content: '  A useful pitch.  ' } }), 'A useful pitch.');
  assert.equal(normalizeSalesPitch({ text: '  A useful pitch.  ' }), 'A useful pitch.');
  assert.equal(normalizeSalesPitch({ response: '  A useful pitch.  ' }), 'A useful pitch.');
  assert.equal(normalizeSalesPitch({ candidates: [{ content: { parts: [{ text: '  A useful pitch.  ' }] } }] }), 'A useful pitch.');
});

test('Discord payload contains name, bio, and pitch', () => {
  const payload = buildDiscordWebhookPayload({
    profile,
    repository: 'n8n-io/n8n',
    pitch: 'A targeted one-sentence pitch.',
  });
  const serialized = JSON.stringify(payload);
  assert.match(serialized, /monalisa octocat/);
  assert.match(serialized, /Interested in Open Source and AI/);
  assert.match(serialized, /A targeted one-sentence pitch/);
});
