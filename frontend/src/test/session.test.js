import { describe, expect, it } from 'vitest';
import { SESSION_MS, sessionEndsAt, sessionExpired } from '../utils/session';

function token(payload) {
  const body = btoa(JSON.stringify(payload)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `header.${body}.sig`;
}

describe('session', () => {
  it('ends two hours after the login stored on the token', () => {
    const ends = Math.floor(Date.now() / 1000) + 30;
    expect(sessionEndsAt(token({ sessionEndsAt: ends }))).toBe(ends * 1000);
    expect(sessionExpired(token({ sessionEndsAt: ends }), ends * 1000 - 1)).toBe(false);
    expect(sessionExpired(token({ sessionEndsAt: ends }), ends * 1000)).toBe(true);
  });

  it('treats an older token as finished two hours after it was issued', () => {
    const iat = Math.floor((Date.now() - SESSION_MS - 1000) / 1000);
    expect(sessionExpired(token({ iat, exp: iat + 7 * 24 * 60 * 60 }))).toBe(true);
  });
});