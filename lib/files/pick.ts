import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { checkFile } from './check';
import { preparePhoto, type PreparedFile } from './preparePhoto';

export type PickResult =
  | { status: 'picked'; file: PreparedFile; name: string }
  | { status: 'cancelled' }
  | { status: 'rejected'; message: string }
  | { status: 'permission' };

async function finish(uri: string, name: string, mimeType: string | null | undefined, size: number | null | undefined): Promise<PickResult> {
  const check = checkFile({ name, mimeType, size });
  if (!check.ok) return { status: 'rejected', message: check.message };
  if (check.kind === 'pdf') {
    return { status: 'picked', name, file: { uri, mimeType: 'application/pdf', ext: 'pdf', size: size ?? 0 } };
  }
  return { status: 'picked', name, file: await preparePhoto(uri) };
}

/** File picker: PDFs and photos (BR1). */
export async function pickFile(): Promise<PickResult> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/heif'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets?.[0]) return { status: 'cancelled' };
  const a = res.assets[0];
  return finish(a.uri, a.name, a.mimeType, a.size ?? a.file?.size);
}

/** Photo from the gallery. */
export async function pickPhoto(): Promise<PickResult> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { status: 'permission' };
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, exif: false });
  if (res.canceled || !res.assets?.[0]) return { status: 'cancelled' };
  const a = res.assets[0];
  return finish(a.uri, a.fileName ?? 'photo.jpg', a.mimeType ?? 'image/jpeg', a.fileSize ?? (await (await fetch(a.uri)).blob()).size);
}

/** Photo from the camera. */
export async function takePhoto(): Promise<PickResult> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return { status: 'permission' };
  const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1, exif: false });
  if (res.canceled || !res.assets?.[0]) return { status: 'cancelled' };
  const a = res.assets[0];
  return finish(a.uri, a.fileName ?? 'photo.jpg', a.mimeType ?? 'image/jpeg', a.fileSize ?? (await (await fetch(a.uri)).blob()).size);
}
