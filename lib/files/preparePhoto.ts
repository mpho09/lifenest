import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export const MAX_PHOTO_SIDE = 2000;
export const MAX_PHOTO_BYTES = 1024 * 1024;
const QUALITIES = [0.85, 0.7, 0.55, 0.4, 0.3];

export type PreparedFile = { uri: string; mimeType: string; ext: 'pdf' | 'jpg' | 'png'; size: number };

async function sizeOf(uri: string): Promise<number> {
  const res = await fetch(uri);
  return (await res.blob()).size;
}

/**
 * BR1: photos are resized so the longest side is at most 2,000 px and saved as
 * JPEG under 1 MB (quality stepped down if needed). Re-encoding drops all
 * metadata, including GPS location. HEIC becomes JPEG.
 */
export async function preparePhoto(uri: string): Promise<PreparedFile> {
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const { width, height } = original;
  const longest = Math.max(width, height);
  const context = ImageManipulator.manipulate(uri);
  if (longest > MAX_PHOTO_SIDE) {
    context.resize(width >= height ? { width: MAX_PHOTO_SIDE } : { height: MAX_PHOTO_SIDE });
  }
  const image = await context.renderAsync();

  let last: PreparedFile | null = null;
  for (const compress of QUALITIES) {
    const saved = await image.saveAsync({ compress, format: SaveFormat.JPEG });
    const size = await sizeOf(saved.uri);
    last = { uri: saved.uri, mimeType: 'image/jpeg', ext: 'jpg', size };
    if (size <= MAX_PHOTO_BYTES) break;
  }
  return last!;
}
