import { supabase } from '../supabase';
import { currentUserId, rpc, unwrap } from './client';
import type { Notification, Profile, Readiness } from './types';

export async function getProfile(): Promise<Profile> {
  const id = await currentUserId();
  return unwrap<Profile>(
    await supabase
      .from('users')
      .select('id, email, full_name, phone, owns_no_property_or_vehicle, last_reviewed_at, vault_status')
      .eq('id', id)
      .single(),
  );
}

/** OP7 */
export async function saveProfile(fullName: string, phone: string): Promise<void> {
  const id = await currentUserId();
  const p = phone.replace(/\s/g, '');
  unwrap(await supabase.from('users').update({ full_name: fullName.trim(), phone: p || null }).eq('id', id));
}

/** OP38 */
export async function setOwnsNoPropertyOrVehicle(value: boolean): Promise<void> {
  const id = await currentUserId();
  unwrap(await supabase.from('users').update({ owns_no_property_or_vehicle: value }).eq('id', id));
}

/** OP36 */
export const getReadiness = () => rpc<Readiness>('get_readiness');

/** OP37 */
export const confirmReview = () => rpc<void>('confirm_review');

/** OP39 */
export async function listNotifications(): Promise<Notification[]> {
  const id = await currentUserId();
  return unwrap<Notification[]>(
    await supabase
      .from('notifications')
      .select('id, type, text, link_target, is_read, created_at')
      .eq('recipient_id', id)
      .order('is_read', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(30),
  );
}

export async function markNotificationRead(id: string): Promise<void> {
  unwrap(await supabase.from('notifications').update({ is_read: true }).eq('id', id));
}
