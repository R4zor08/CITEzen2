export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/** Template field name for Supporting Documents (authenticity verification required). */
export const SUPPORTING_DOCUMENTS_FIELD = 'evidence';

export const VERIFIED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg'] as const;

export type VerifiedImageMimeType = (typeof VERIFIED_IMAGE_MIME_TYPES)[number];

export function isSupportingDocumentsField(field?: string): boolean {
  return field === SUPPORTING_DOCUMENTS_FIELD;
}

export function normalizeVerificationMimeType(mimeType: string): string {
  if (mimeType === 'image/jpg') return 'image/jpeg';
  return mimeType;
}

export function isVerifiedImageMimeType(mimeType: string): mimeType is VerifiedImageMimeType {
  const normalized = normalizeVerificationMimeType(mimeType);
  return (VERIFIED_IMAGE_MIME_TYPES as readonly string[]).includes(normalized);
}

export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function parseDataUrl(dataUrl: string): { mimeType: string; buffer: Buffer } {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl.trim());
  if (!match) {
    throw new Error('Invalid data URL format');
  }
  const mimeType = match[1] ?? 'application/octet-stream';
  const base64 = match[2] ?? '';
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length === 0) {
    throw new Error('Empty file data');
  }
  if (buffer.length > MAX_ATTACHMENT_BYTES) {
    throw new Error('File exceeds maximum size of 10MB');
  }
  return { mimeType, buffer };
}

export function dataUrlFromBase64(base64: string, mimeType: string): string {
  const trimmed = base64.replace(/^data:[^;]+;base64,/, '');
  return `data:${mimeType};base64,${trimmed}`;
}
