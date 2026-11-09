import * as Crypto from 'expo-crypto';

import type { PreparedFile } from '../files/preparePhoto';
import { uploadFile } from '../files/upload';
import { supabase } from '../supabase';
import { currentUserId, rpc, unwrap } from './client';
import type { EmergencyProfile, Instruction, OpenRequest, SharedVault } from './types';

/* Instructions and personal messages (OP27–OP29) ------------------------- */

export async function listInstructions(): Promise<Instruction[]> {
  const id = await currentUserId();
  return unwrap<Instruction[]>(
    await supabase
      .from('instructions')
      .select('id, kind, section, recipient_id, text, updated_at')
      .eq('owner_id', id)
      .order('created_at'),
  );
}

export async function saveInstruction(
  instructionId: string | null,
  input: { kind: 'instruction' | 'message'; section: string | null; recipient_id: string | null; text: string },
): Promise<void> {
  const row = {
    section: input.kind === 'instruction' ? input.section : null,
    recipient_id: input.kind === 'message' ? input.recipient_id : null,
    text: input.text.trim(),
  };
  if (instructionId) {
    unwrap(await supabase.from('instructions').update(row).eq('id', instructionId));
  } else {
    unwrap(await supabase.from('instructions').insert({ ...row, kind: input.kind }));
  }
}

export async function deleteInstruction(instructionId: string): Promise<void> {
  unwrap(await supabase.from('instructions').delete().eq('id', instructionId));
}

/* Emergency profile (OP30) ------------------------------------------------ */

export async function getEmergencyProfile(): Promise<EmergencyProfile | null> {
  const id = await currentUserId();
  return unwrap<EmergencyProfile | null>(
    await supabase
      .from('emergency_profiles')
      .select('emergency_contacts, medical_aid_provider, medical_aid_number, key_notes, share_now')
      .eq('owner_id', id)
      .maybeSingle(),
  );
}

export async function saveEmergencyProfile(profile: EmergencyProfile): Promise<void> {
  const id = await currentUserId();
  const row = {
    emergency_contacts: profile.emergency_contacts
      .filter((c) => c.name.trim())
      .map((c) => ({ name: c.name.trim(), relationship: c.relationship.trim(), phone: c.phone.replace(/\s/g, '') })),
    medical_aid_provider: profile.medical_aid_provider?.trim() || null,
    medical_aid_number: profile.medical_aid_number?.trim() || null,
    key_notes: profile.key_notes?.trim() || null,
    share_now: profile.share_now,
  };
  const updated = unwrap<{ owner_id: string }[]>(
    await supabase.from('emergency_profiles').update(row).eq('owner_id', id).select('owner_id'),
  );
  if (updated.length === 0) unwrap(await supabase.from('emergency_profiles').insert(row));
}

/* Shared vault and access requests (OP31–OP35) ---------------------------- */

export const getSharedVault = (ownerId: string) => rpc<SharedVault>('get_shared_vault', { owner: ownerId });

/** OP32: the id is made here so the proof paths are known before upload. */
export async function submitAccessRequest(input: {
  ownerId: string;
  reason: 'death' | 'incapacity';
  proof: PreparedFile;
  idCopy: PreparedFile;
}): Promise<void> {
  const me = await currentUserId();
  const id = Crypto.randomUUID();
  const proofPath = `${me}/${id}/proof.${input.proof.ext}`;
  const idPath = `${me}/${id}/id.${input.idCopy.ext}`;
  await uploadFile('proof', proofPath, input.proof);
  await uploadFile('proof', idPath, input.idCopy);
  // No .select() afterwards: nobody may read proof paths back (SEC14).
  unwrap(
    await supabase.from('access_requests').insert({
      id,
      owner_id: input.ownerId,
      reason: input.reason,
      proof_path: proofPath,
      requester_id_path: idPath,
      declaration_ticked: true,
    }),
  );
}

export const getMyOpenRequest = () => rpc<OpenRequest | null>('get_my_open_request');
export const cancelAccessRequest = (requestId: string) => rpc<void>('cancel_access_request', { request_id: requestId });
export const revokeRelease = () => rpc<void>('revoke_release');
