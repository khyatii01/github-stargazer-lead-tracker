import { normalizeGitHubProfile } from './lead-policy.mjs';
import { normalizeSalesPitch } from './pitch.mjs';

function truncate(value, maximum) {
  const text = String(value ?? '').trim();
  return text.length <= maximum ? text : `${text.slice(0, maximum - 3)}...`;
}

export function buildDiscordWebhookPayload({ profile: profileInput, repository, pitch }) {
  const profile = normalizeGitHubProfile(profileInput);
  const normalizedPitch = normalizeSalesPitch(pitch);
  if (typeof repository !== 'string' || repository.trim() === '') {
    throw new TypeError('repository must be a non-empty string');
  }

  return {
    username: 'Lead Sniper',
    embeds: [
      {
        title: 'High-Value GitHub Star Detected',
        url: profile.profileUrl,
        description: `**${truncate(profile.name, 120)}** (@${profile.login}) starred **${truncate(repository, 150)}**.`,
        color: 5793266,
        thumbnail: profile.avatarUrl ? { url: profile.avatarUrl } : undefined,
        fields: [
          {
            name: 'Bio',
            value: truncate(profile.bio || 'Not provided', 1024),
            inline: false,
          },
          {
            name: 'Company',
            value: truncate(profile.company || 'Not provided', 1024),
            inline: true,
          },
          {
            name: 'Influence',
            value: `${profile.followers} followers | ${profile.publicRepos} public repos`,
            inline: true,
          },
          {
            name: 'AI Sales Pitch',
            value: truncate(normalizedPitch, 1024),
            inline: false,
          },
        ],
        footer: {
          text: 'Lead Sniper - automated by n8n',
        },
      },
    ],
  };
}
