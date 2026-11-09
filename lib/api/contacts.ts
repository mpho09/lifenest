import { supabase } from '../supabase';
import { rpc, unwrap } from './client';
import type { AccessHistoryEntry, People } from './types';
import type { AccessLevel } from '../rules/categories';

/** OP24 */
export const getPeople = () => rpc<People>('get_people');

export type ContactInput = {
  name: string;
  relationship: string;
  email: string;
  phone: string;
  access_level: AccessLevel;
  allowed_sections: string[];
};

/** OP20: the database checks the 5-contact limit, self-invites and duplicates; a trigger queues the email. */
export async function inviteContact(input: ContactInput): Promise<void> {
  unwrap(
    await supabase.from('trusted_contacts').insert({
      name: input.name.trim(),
      relationship: input.relationship.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.replace(/\s/g, '') || null,
      access_level: input.access_level,
      allowed_sections: input.access_level === 'selected' ? input.allowed_sections : [],
    }),
  );
}

/** OP21: the owner can never change status, contact_user_id or the invite token (SEC11). */
export async function updateContact(id: string, input: Omit<ContactInput, 'email'>): Promise<void> {
  unwrap(
    await supabase
      .from('trusted_contacts')
      .update({
        name: input.name.trim(),
        relationship: input.relationship.trim(),
        phone: input.phone.replace(/\s/g, '') || null,
        access_level: input.access_level,
        allowed_sections: input.access_level === 'selected' ? input.allowed_sections : [],
      })
      .eq('id', id),
  );
}

/** OP22: triggers cancel their open request and delete their personal messages. */
export async function removeContact(id: string): Promise<void> {
  unwrap(await supabase.from('trusted_contacts').delete().eq('id', id));
}

/** OP23 */
export const resendInvite = (contactId: string) => rpc<void>('resend_invite', { contact_id: contactId });

/** OP25 */
export const acceptInvite = (token: string) => rpc<string>('accept_invite', { token });
export const declineInvite = (token: string) => rpc<void>('decline_invite', { token });

/** S2 invite mode: the invited email for a token (works before the person has an account). */
export const getInviteEmail = (token: string) =>
  rpc<{ email: string; expires_at: string; owner_name: string; status: string } | null>('get_invite_email', { token });

/** OP26 */
export const getAccessHistory = (contactId: string) => rpc<AccessHistoryEntry[]>('get_access_history', { contact_id: contactId });
