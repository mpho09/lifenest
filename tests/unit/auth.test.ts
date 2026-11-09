import { logIn, signUp } from '../../lib/api/auth';
import { messages } from '../../lib/messages';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: { auth: { signUp: jest.fn(), signInWithPassword: jest.fn() } },
}));

const auth = supabase.auth as unknown as { signUp: jest.Mock; signInWithPassword: jest.Mock };

function fail(status: number, code: string, message = code) {
  return { data: { user: null, session: null }, error: Object.assign(new Error(message), { status, code }) };
}

describe('T-AUTH-RL sign-up and log-in rate limits (Section 18 #35)', () => {
  it('the email sending limit gets its own message, not the 15-minute one', async () => {
    auth.signUp.mockResolvedValue(fail(429, 'over_email_send_rate_limit', 'email rate limit exceeded'));
    const r = await signUp('a@example.com', 'abcdef1234');
    expect(r).toEqual({ ok: false, message: messages.emailLimit });
  });

  it('too many sign-up requests still show the 15-minute message', async () => {
    auth.signUp.mockResolvedValue(fail(429, 'over_request_rate_limit'));
    const r = await signUp('a@example.com', 'abcdef1234');
    expect(r).toEqual({ ok: false, message: messages.tooManyAttempts });
  });

  it('a log-in blocked by the email limit (unverified resend) also gets the email message', async () => {
    auth.signInWithPassword.mockResolvedValue(fail(429, 'over_email_send_rate_limit'));
    const r = await logIn('a@example.com', 'abcdef1234');
    expect(r).toEqual({ ok: false, message: messages.emailLimit });
  });
});
