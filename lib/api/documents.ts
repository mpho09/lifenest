import * as Crypto from 'expo-crypto';

import type { PreparedFile } from '../files/preparePhoto';
import { uploadFile } from '../files/upload';
import { supabase } from '../supabase';
import { currentUserId, unwrap } from './client';
import type { DocumentRow } from './types';
import type { Category } from '../rules/categories';

const COLUMNS = 'id, title, category, file_path, file_type, size_kb, notes, created_at';

/** OP10: titles and details only, never file contents (T-NFR-5). */
export async function listDocuments(search = ''): Promise<DocumentRow[]> {
  const id = await currentUserId();
  let query = supabase.from('documents').select(COLUMNS).eq('owner_id', id).order('created_at', { ascending: false });
  const term = search.trim();
  if (term.length >= 2) query = query.ilike('title', `%${term.replace(/[%_]/g, '')}%`);
  return unwrap<DocumentRow[]>(await query);
}

/** OP12 */
export async function getDocument(documentId: string): Promise<{ document: DocumentRow; assets: { id: string; name: string }[] } | null> {
  const doc = unwrap<DocumentRow | null>(await supabase.from('documents').select(COLUMNS).eq('id', documentId).maybeSingle());
  if (!doc) return null;
  const { data: links, error } = await supabase.from('asset_documents').select('assets(id, name)').eq('document_id', documentId);
  if (error) throw error;
  // A link points to exactly one asset; PostgREST may type it as an object or an array.
  const assets = (links ?? []).flatMap((l) => {
    const a = l.assets as unknown as { id: string; name: string } | { id: string; name: string }[] | null;
    return Array.isArray(a) ? a : a ? [a] : [];
  });
  return { document: doc, assets };
}

const pathFor = (ownerId: string, documentId: string, ext: string) => `${ownerId}/${documentId}.${ext}`;

/** OP11: the id is made here so the file path is known before upload; the file is removed if the row fails. */
export async function uploadDocument(input: { file: PreparedFile; title: string; category: Category; notes: string }): Promise<string> {
  const ownerId = await currentUserId();
  const id = Crypto.randomUUID();
  const path = pathFor(ownerId, id, input.file.ext);
  await uploadFile('vault', path, input.file);
  const { error } = await supabase.from('documents').insert({
    id,
    title: input.title.trim(),
    category: input.category,
    notes: input.notes.trim() || null,
    file_path: path,
    file_type: input.file.ext,
    size_kb: Math.max(1, Math.ceil(input.file.size / 1024)),
  });
  if (error) {
    await supabase.storage.from('vault').remove([path]);
    throw error;
  }
  return id;
}

export async function updateDocumentDetails(documentId: string, input: { title: string; category: Category; notes: string }) {
  unwrap(
    await supabase
      .from('documents')
      .update({ title: input.title.trim(), category: input.category, notes: input.notes.trim() || null })
      .eq('id', documentId),
  );
}

/** OP14: upload to a new path, point the row at it, then remove the old file. */
export async function replaceDocumentFile(doc: DocumentRow, file: PreparedFile): Promise<void> {
  const ownerId = await currentUserId();
  const newPath = `${ownerId}/${doc.id}-${Date.now()}.${file.ext}`;
  await uploadFile('vault', newPath, file);
  const { error } = await supabase
    .from('documents')
    .update({ file_path: newPath, file_type: file.ext, size_kb: Math.max(1, Math.ceil(file.size / 1024)) })
    .eq('id', doc.id);
  if (error) {
    await supabase.storage.from('vault').remove([newPath]);
    throw error;
  }
  await supabase.storage.from('vault').remove([doc.file_path]);
}

/** OP15 */
export async function deleteDocument(doc: Pick<DocumentRow, 'id' | 'file_path'>): Promise<void> {
  unwrap(await supabase.from('documents').delete().eq('id', doc.id));
  await supabase.storage.from('vault').remove([doc.file_path]);
}

/**
 * OP13 get a 60-second link. Contacts always go through the get-file-link Edge
 * Function (SEC20, audit). Owners may sign links for their own files directly.
 */
export async function getFileLink(documentId: string, purpose: 'view' | 'download', ownFilePath?: string): Promise<string> {
  if (ownFilePath) {
    const res = await supabase.storage
      .from('vault')
      .createSignedUrl(ownFilePath, 60, purpose === 'download' ? { download: true } : undefined);
    if (res.error || !res.data) throw { message: 'gone' };
    return res.data.signedUrl;
  }
  const { data, error } = await supabase.functions.invoke('get-file-link', { body: { document_id: documentId, purpose } });
  if (error) {
    const status = (error as { context?: { status?: number } }).context?.status;
    throw { message: status === 404 ? 'gone' : status === 403 || status === 401 ? 'not_allowed' : 'server_error' };
  }
  return (data as { url: string }).url;
}
