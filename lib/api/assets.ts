import { supabase } from '../supabase';
import { currentUserId, unwrap } from './client';
import type { AssetRow } from './types';

const COLUMNS =
  'id, category, type, name, provider, provider_phone, reference_number, last4, originals_location, notes, deleted_document_count, asset_documents(document_id)';

type Raw = Omit<AssetRow, 'document_ids'> & { asset_documents: { document_id: string }[] };
const toAsset = ({ asset_documents, ...a }: Raw): AssetRow => ({
  ...a,
  document_ids: asset_documents.map((l) => l.document_id),
});

/** OP16 */
export async function listAssets(): Promise<AssetRow[]> {
  const id = await currentUserId();
  const rows = unwrap<Raw[]>(await supabase.from('assets').select(COLUMNS).eq('owner_id', id).order('name'));
  return rows.map(toAsset);
}

export async function getAsset(assetId: string): Promise<AssetRow | null> {
  const row = unwrap<Raw | null>(await supabase.from('assets').select(COLUMNS).eq('id', assetId).maybeSingle());
  return row ? toAsset(row) : null;
}

export type AssetInput = Omit<AssetRow, 'id' | 'deleted_document_count' | 'document_ids'>;

/** OP17 + OP18: save the asset and its linked documents. Saving clears the "Document deleted" note. */
export async function saveAsset(assetId: string | null, input: AssetInput, documentIds: string[]): Promise<string> {
  const clean = {
    ...input,
    name: input.name.trim(),
    provider: input.provider?.trim() || null,
    provider_phone: input.provider_phone?.trim() || null,
    reference_number: input.reference_number?.trim() || null,
    last4: input.last4?.trim() || null,
    originals_location: input.originals_location?.trim() || null,
    notes: input.notes?.trim() || null,
  };
  let id = assetId;
  if (id) {
    unwrap(await supabase.from('assets').update({ ...clean, deleted_document_count: 0 }).eq('id', id));
  } else {
    id = unwrap<{ id: string }>(await supabase.from('assets').insert(clean).select('id').single()).id;
  }
  unwrap(await supabase.from('asset_documents').delete().eq('asset_id', id));
  if (documentIds.length) {
    unwrap(await supabase.from('asset_documents').insert(documentIds.map((document_id) => ({ asset_id: id, document_id }))));
  }
  return id;
}

/** OP19: linked documents are not deleted (BR12). */
export async function deleteAsset(assetId: string): Promise<void> {
  unwrap(await supabase.from('assets').delete().eq('id', assetId));
}
