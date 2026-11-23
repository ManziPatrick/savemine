export const SESSION_MS = 2 * 60 * 60 * 1000;

function readPayload(token) {
  const part = String(token || '').split('.')[1];
  if (!part) return null;
  try {
    const padded = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function sessionEndsAt(token) {
  const payload = readPayload(token);
  if (!payload) return 0;
  if (payload.sessionEndsAt) return payload.sessionEndsAt * 1000;
  if (payload.iat) return payload.iat * 1000 + SESSION_MS;
  if (payload.exp) return payload.exp * 1000;
  return 0;
}

export function sessionExpired(token, now = Date.now()) {
  if (!token) return true;
  return now >= sessionEndsAt(token);
}
