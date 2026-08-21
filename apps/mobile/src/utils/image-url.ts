/** URLs that React Native can load in production builds (public https, not dev-only hosts). */
export function isDisplayableImageUrl(url: string | null | undefined): url is string {
  if (!url?.trim()) {
    return false;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') {
      return false;
    }

    const host = parsed.hostname.toLowerCase();
    return host !== 'localhost' && host !== '127.0.0.1' && host !== '10.0.2.2';
  } catch {
    return false;
  }
}

export function normalizeUploadMimeType(type: string | undefined, fileName: string): string {
  if (type === 'image/jpg') {
    return 'image/jpeg';
  }

  if (type?.startsWith('image/')) {
    return type;
  }

  const lower = fileName.toLowerCase();
  if (lower.endsWith('.png')) {
    return 'image/png';
  }
  if (lower.endsWith('.webp')) {
    return 'image/webp';
  }

  return 'image/jpeg';
}
