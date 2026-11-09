import { assetFieldsForType, isValidLast4, notesPasswordWarning } from '../../lib/rules/asset';
import { CATEGORIES, categoryLabel } from '../../lib/rules/categories';
import { validateContact } from '../../lib/rules/contact';
import { formatDate } from '../../lib/rules/format';
import { isValidPassword } from '../../lib/rules/password';
import { checkFile } from '../../lib/files/check';
import { messageForError } from '../../lib/errors';

describe('password rule (PRD 5)', () => {
  it('T-AUTH-1 "abcdefghi1" passes; no number, no letter or too short fail', () => {
    expect(isValidPassword('abcdefghi1')).toBe(true);
    expect(isValidPassword('abcdefghij')).toBe(false);
    expect(isValidPassword('1234567890')).toBe(false);
    expect(isValidPassword('abc12')).toBe(false);
  });
});

describe('categories (BR2)', () => {
  it('T-BR2-1 has exactly the 9 PRD categories in order', () => {
    expect(CATEGORIES.map((c) => c.label)).toEqual([
      'Identity', 'Insurance', 'Property', 'Vehicles', 'Banking and investments',
      'Debts and accounts', 'Medical', 'Business', 'Other',
    ]);
    expect(categoryLabel('banking_investments')).toBe('Banking and investments');
  });
});

describe('asset rules (BR3)', () => {
  it('T-BR3-1b last4 accepts exactly 4 digits', () => {
    expect(isValidLast4('1234')).toBe(true);
    ['123', '12345', '12a4', ''].forEach((v) => expect(isValidLast4(v)).toBe(false));
  });

  it('T-BR3-2 notes with "password" or "PIN" as a whole word warn; "pinned" and "spinach" do not', () => {
    const warning = 'Don’t store passwords here. Say where they are kept instead.';
    expect(notesPasswordWarning('My password is in the safe')).toBe(warning);
    expect(notesPasswordWarning('PIN: ask Kagiso')).toBe(warning);
    expect(notesPasswordWarning('pinned to the fridge')).toBeNull();
    expect(notesPasswordWarning('spinach recipe')).toBeNull();
  });

  it('T-BR3-3 "Last 4 digits" only for bank accounts and cards; policy number for the rest', () => {
    expect(assetFieldsForType('bank_account')).toEqual({ last4: true, referenceNumber: false });
    expect(assetFieldsForType('card')).toEqual({ last4: true, referenceNumber: false });
    expect(assetFieldsForType('policy')).toEqual({ last4: false, referenceNumber: true });
  });
});

describe('contact rules (BR4)', () => {
  it('T-BR4-1 name, relationship and a valid email are required; phone optional in SA format', () => {
    expect(validateContact({ name: 'Anika', relationship: 'Daughter', email: 'anika@example.com', phone: '' })).toEqual({});
    expect(validateContact({ name: '', relationship: '', email: 'nope', phone: '12' })).toEqual({
      name: true, relationship: true, email: true, phone: true,
    });
    expect(validateContact({ name: 'A', relationship: 'B', email: 'a@b.co', phone: '+27821234567' })).toEqual({});
  });
});

describe('file check (BR1)', () => {
  const MB = 1024 * 1024;
  it('T-BR1-1 accepts PDF, JPG, PNG and HEIC up to 10 MB', () => {
    expect(checkFile({ name: 'id.pdf', mimeType: 'application/pdf', size: MB })).toEqual({ ok: true, kind: 'pdf' });
    expect(checkFile({ name: 'a.JPG', mimeType: 'image/jpeg', size: MB })).toEqual({ ok: true, kind: 'photo' });
    expect(checkFile({ name: 'a.png', mimeType: 'image/png', size: 10 * MB })).toEqual({ ok: true, kind: 'photo' });
    expect(checkFile({ name: 'a.heic', mimeType: 'image/heic', size: MB })).toEqual({ ok: true, kind: 'photo' });
  });

  it('T-BR1-1 rejects other types and files over 10 MB with the exact message', () => {
    const msg = 'This file can’t be used. Choose a PDF or photo under 10 MB.';
    expect(checkFile({ name: 'a.docx', mimeType: 'application/msword', size: MB })).toEqual({ ok: false, message: msg });
    expect(checkFile({ name: 'a.pdf', mimeType: 'application/pdf', size: 10 * MB + 1 })).toEqual({ ok: false, message: msg });
  });
});

describe('dates (PRD 12)', () => {
  it('formats dates as "14 Nov 2026" in SAST', () => {
    expect(formatDate('2026-11-14T10:00:00Z')).toBe('14 Nov 2026');
    expect(formatDate('2026-11-13T23:30:00Z')).toBe('14 Nov 2026'); // 01:30 SAST
  });
});

describe('error messages (PRD 12)', () => {
  it('maps database errors to the exact PRD messages and never shows raw codes', () => {
    expect(messageForError({ message: 'limit_documents' })).toBe('You can store up to 200 documents.');
    expect(messageForError({ message: 'limit_contacts' })).toBe('You can have up to 5 trusted contacts.');
    expect(messageForError({ message: 'self_invite' })).toBe('You can’t add yourself.');
    expect(messageForError({ code: '23505', message: 'duplicate key value violates unique constraint "trusted_contacts_owner_id_email_key"' }))
      .toBe('This person is already one of your trusted contacts.');
    expect(messageForError({ message: 'invite_expired' })).toBe('This invitation has expired. Ask the person to send it again.');
    expect(messageForError({ message: 'request_open' }))
      .toBe('Someone has already asked for access. You’ll be told when it’s decided.');
    expect(messageForError({ message: 'not_allowed' })).toBe('You don’t have access to this.');
    expect(messageForError({ message: 'vault_gone' })).toBe('This vault no longer exists.');
    expect(messageForError({ message: 'TypeError: Failed to fetch' })).toBe('Something went wrong. Try again.');
  });
});
