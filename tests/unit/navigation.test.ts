import { redirectFor } from '../../lib/session';

const base = {
  ready: true,
  loggedIn: true,
  hasPin: true,
  unlocked: true,
  recovery: false,
  area: 'app' as const,
  changingPin: false,
  afterUnlock: '/',
};

describe('Section 11 redirects (T-NAV-1)', () => {
  it('T-NAV-1 logged out: only S1–S4 and invite links; anything else goes to S1', () => {
    const out = { ...base, loggedIn: false, hasPin: false, unlocked: false };
    expect(redirectFor({ ...out, area: 'public' })).toBeNull();
    expect(redirectFor({ ...out, area: 'invite' })).toBeNull();
    expect(redirectFor({ ...out, area: 'app' })).toBe('/welcome');
    expect(redirectFor({ ...out, area: 'unlock' })).toBe('/welcome');
  });

  it('T-NAV-1 logged in without a PIN on this device: always S5', () => {
    const noPin = { ...base, hasPin: false, unlocked: false };
    expect(redirectFor({ ...noPin, area: 'app' })).toBe('/profile-setup');
    expect(redirectFor({ ...noPin, area: 'public' })).toBe('/profile-setup');
    expect(redirectFor({ ...noPin, area: 'setup' })).toBeNull();
  });

  it('T-NAV-1 logged in with a PIN but locked: always S6', () => {
    expect(redirectFor({ ...base, unlocked: false, area: 'app' })).toBe('/unlock');
    expect(redirectFor({ ...base, unlocked: false, area: 'unlock' })).toBeNull();
  });

  it('T-NAV-1 unlocked: app screens stay; auth screens go home (or to S21 first, T-NAV-2)', () => {
    expect(redirectFor({ ...base, area: 'app' })).toBeNull();
    expect(redirectFor({ ...base, area: 'unlock' })).toBe('/');
    expect(redirectFor({ ...base, area: 'public', afterUnlock: '/access-alert' })).toBe('/access-alert');
  });

  it('T-NAV-1 Change PIN may open S5 while unlocked', () => {
    expect(redirectFor({ ...base, area: 'setup', changingPin: true })).toBeNull();
    expect(redirectFor({ ...base, area: 'setup' })).toBe('/');
  });

  it('T-NAV-1 a password-reset link keeps the user on S4 (PASSWORD_RECOVERY)', () => {
    expect(redirectFor({ ...base, unlocked: false, recovery: true, area: 'reset' })).toBeNull();
  });

  it('waits until the session is loaded', () => {
    expect(redirectFor({ ...base, ready: false, loggedIn: false })).toBeNull();
  });
});
