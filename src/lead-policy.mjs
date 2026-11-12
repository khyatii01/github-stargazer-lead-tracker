export const LEAD_THRESHOLDS = Object.freeze({
  followersExclusive: 100,
  publicReposExclusive: 50,
});

function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value;
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function nullableString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function nonNegativeInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new TypeError(`${label} must be a non-negative integer`);
  }
  return number;
}

export function normalizeGitHubProfile(input) {
  const raw = requireObject(input, 'GitHub profile');
  const login = requireString(raw.login, 'login');

  return Object.freeze({
    login,
    name: nullableString(raw.name) || login,
    company: nullableString(raw.company),
    bio: nullableString(raw.bio),
    avatarUrl: nullableString(raw.avatar_url),
    profileUrl: nullableString(raw.html_url) || `https://github.com/${encodeURIComponent(login)}`,
    followers: nonNegativeInteger(raw.followers, 'followers'),
    publicRepos: nonNegativeInteger(raw.public_repos, 'public_repos'),
  });
}

export function evaluateLead(input) {
  const profile = normalizeGitHubProfile(input);
  const followerQualified = profile.followers > LEAD_THRESHOLDS.followersExclusive;
  const repositoryQualified = profile.publicRepos > LEAD_THRESHOLDS.publicReposExclusive;
  const qualified = followerQualified || repositoryQualified;

  const reasons = [];
  if (followerQualified) reasons.push(`${profile.followers} followers`);
  if (repositoryQualified) reasons.push(`${profile.publicRepos} public repositories`);

  return Object.freeze({
    profile,
    qualified,
    followerQualified,
    repositoryQualified,
    reason: qualified ? reasons.join(' and ') : 'thresholds not exceeded',
  });
}
