export const MAX_CONCERN_FILE_SIZE = 10 * 1024 * 1024;

export const VALID_CONCERN_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/pdf'
] as const;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isValidConcernMimeType(mimeType: string): boolean {
  return (VALID_CONCERN_MIME_TYPES as readonly string[]).includes(mimeType);
}

/** PNG/JPEG only — used for Supporting Documents authenticity checks. */
export const VERIFIED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg'] as const;

export function isVerifiedImageMimeType(mimeType: string): boolean {
  return (VERIFIED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function normalizeImageMimeType(mimeType: string, fileName: string): string {
  if (mimeType === 'image/jpg') return 'image/jpeg';
  if (mimeType && mimeType !== 'application/octet-stream') return mimeType;
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return mimeType;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function inferMimeFromDataUrl(dataUrl: string): string {
  const match = /^data:([^;]+);/.exec(dataUrl);
  return match?.[1] ?? 'application/octet-stream';
}
