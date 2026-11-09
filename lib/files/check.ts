import { messages } from '../messages';

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export type PickedFile = { name: string; mimeType?: string | null; size?: number | null };
export type FileCheck = { ok: true; kind: 'pdf' | 'photo' } | { ok: false; message: string };

/** BR1: PDF, JPG, PNG or HEIC, up to 10 MB. */
export function checkFile(file: PickedFile): FileCheck {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mime = (file.mimeType ?? '').toLowerCase();
  const size = file.size ?? 0;
  if (size <= 0 || size > MAX_FILE_BYTES) return { ok: false, message: messages.fileRejected };
  if (mime === 'application/pdf' || ext === 'pdf') return { ok: true, kind: 'pdf' };
  if (['image/jpeg', 'image/png', 'image/heic', 'image/heif'].includes(mime) || ['jpg', 'jpeg', 'png', 'heic', 'heif'].includes(ext)) {
    return { ok: true, kind: 'photo' };
  }
  return { ok: false, message: messages.fileRejected };
}
