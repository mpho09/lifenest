import { supabase } from '../supabase';

/** Throws the Supabase error so callers can map it with messageForError. */
export function unwrap<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data as T;
}

export async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw { message: 'not_allowed' };
  return id;
}

export async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  return unwrap<T>(await supabase.rpc(fn, args));
}
