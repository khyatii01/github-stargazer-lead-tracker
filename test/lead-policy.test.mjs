import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateLead, normalizeGitHubProfile } from '../src/lead-policy.mjs';

const profile = (overrides = {}) => ({
  login: 'tester',
  name: 'Test User',
  company: 'Example',
  bio: 'Builds developer tools.',
  avatar_url: '',
  html_url: 'https://github.com/tester',
  followers: 0,
  public_repos: 0,
  ...overrides,
});

test('followers must be strictly greater than 100', () => {
  assert.equal(evaluateLead(profile({ followers: 100 })).qualified, false);
  assert.equal(evaluateLead(profile({ followers: 101 })).qualified, true);
});

test('public repositories must be strictly greater than 50', () => {
  assert.equal(evaluateLead(profile({ public_repos: 50 })).qualified, false);
  assert.equal(evaluateLead(profile({ public_repos: 51 })).qualified, true);
});

test('qualification uses OR semantics', () => {
  const byFollowers = evaluateLead(profile({ followers: 101, public_repos: 0 }));
  const byRepos = evaluateLead(profile({ followers: 0, public_repos: 51 }));
  assert.equal(byFollowers.qualified, true);
  assert.equal(byRepos.qualified, true);
});

test('normalization accepts nullable bio and company', () => {
  const normalized = normalizeGitHubProfile(profile({ bio: null, company: null }));
  assert.equal(normalized.bio, '');
  assert.equal(normalized.company, '');
});

test('invalid metrics fail fast', () => {
  assert.throws(() => normalizeGitHubProfile(profile({ followers: -1 })), /non-negative integer/);
  assert.throws(() => normalizeGitHubProfile(profile({ public_repos: 'many' })), /non-negative integer/);
});
