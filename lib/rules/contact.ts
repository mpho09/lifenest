import { isValidEmail } from './password';

export const SA_PHONE = /^(\+27|0)[0-9]{9}$/;

export type ContactInput = { name: string; relationship: string; email: string; phone: string };
export type ContactErrors = Partial<Record<keyof ContactInput, true>>;

/** BR4: name, relationship and email are required; phone is optional but must be South African. */
export function validateContact(input: ContactInput): ContactErrors {
  const errors: ContactErrors = {};
  if (!input.name.trim()) errors.name = true;
  if (!input.relationship.trim()) errors.relationship = true;
  if (!isValidEmail(input.email)) errors.email = true;
  const phone = input.phone.replace(/\s/g, '');
  if (phone && !SA_PHONE.test(phone)) errors.phone = true;
  return errors;
}

export function isValidSaPhone(phone: string): boolean {
  const p = phone.replace(/\s/g, '');
  return p === '' || SA_PHONE.test(p);
}

/** BR4 as changed by Section 18 #33: at most 3 invited or accepted contacts (the database enforces it too). */
export const MAX_CONTACTS = 3;
