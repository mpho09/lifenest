import { supabase } from '../supabase';
import type { PreparedFile } from './preparePhoto';

/** Uploads a prepared file to a private bucket. Never overwrites an existing file. */
export async function uploadFile(bucket: 'vault' | 'proof', path: string, file: PreparedFile): Promise<void> {
  const body = await (await fetch(file.uri)).arrayBuffer();
  const { error } = await supabase.storage.from(bucket).upload(path, body, {
    contentType: file.mimeType,
    upsert: false,
  });
  if (error) throw error;
}
