import { randomUUID } from 'crypto';
import { extname } from 'path';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export const ALLOWED_IMAGE_MIME_TYPES = Object.keys(MIME_TO_EXT);
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export function resolveImageExtension(mimeType: string): string {
  return MIME_TO_EXT[mimeType] ?? '.bin';
}

export function buildStorageKey(prefix: string, mimeType: string): string {
  const extension = resolveImageExtension(mimeType);
  return `${prefix}/${randomUUID()}${extension}`;
}

export function sanitizeExtensionFromFilename(filename: string): string | null {
  const extension = extname(filename).toLowerCase();
  if (
    extension === '.jpg' ||
    extension === '.jpeg' ||
    extension === '.png' ||
    extension === '.webp'
  ) {
    return extension === '.jpeg' ? '.jpg' : extension;
  }
  return null;
}

export function validateImageUpload(mimeType: string, sizeBytes: number): void {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) {
    throw new Error('INVALID_IMAGE_TYPE');
  }

  if (sizeBytes <= 0 || sizeBytes > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('INVALID_IMAGE_SIZE');
  }
}
