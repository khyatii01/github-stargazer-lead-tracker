function payloadFromEnvelope(envelope) {
  if (envelope === null || typeof envelope !== 'object' || Array.isArray(envelope)) {
    throw new TypeError('Webhook envelope must be an object');
  }
  const candidate = envelope.body ?? envelope;
  if (candidate === null || typeof candidate !== 'object' || Array.isArray(candidate)) {
    throw new TypeError('Webhook body must be an object');
  }
  return candidate;
}

export function parseStarCreatedEvent(envelope) {
  const payload = payloadFromEnvelope(envelope);

  if (typeof payload.zen === 'string') {
    return Object.freeze({ kind: 'ignored', reason: 'github-ping' });
  }

  if (payload.action !== 'created') {
    return Object.freeze({ kind: 'ignored', reason: `action:${String(payload.action)}` });
  }

  const username = payload.sender?.login;
  const repository = payload.repository?.full_name;

  if (typeof username !== 'string' || username.trim() === '') {
    throw new TypeError('Created star event is missing sender.login');
  }
  if (typeof repository !== 'string' || repository.trim() === '') {
    throw new TypeError('Created star event is missing repository.full_name');
  }

  return Object.freeze({
    kind: 'star-created',
    username: username.trim(),
    repository: repository.trim(),
    starredAt: typeof payload.starred_at === 'string' ? payload.starred_at : null,
  });
}
