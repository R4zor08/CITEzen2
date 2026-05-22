export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export const VERIFIED_API_FIELD_NAMES = [
  'Supporting Documents',
  'Affidavit of Loss',
  'Photo of Issue'
] as const;

export type VerifiedApiFieldName = (typeof VERIFIED_API_FIELD_NAMES)[number];

export const VERIFIED_ATTACHMENT_FIELDS = {
  evidence: {
    apiFieldName: 'Supporting Documents' as const,
    displayLabel: 'Supporting Documents'
  },
  affidavit: {
    apiFieldName: 'Affidavit of Loss' as const,
    displayLabel: 'Affidavit of Loss'
  },
  photo: {
    apiFieldName: 'Photo of Issue' as const,
    displayLabel: 'Photo of Issue'
  }
} as const;

export type VerifiedAttachmentFieldKey = keyof typeof VERIFIED_ATTACHMENT_FIELDS;

/** @deprecated Use isVerifiedAttachmentField */
export const SUPPORTING_DOCUMENTS_FIELD = 'evidence';

export const VERIFIED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg'] as const;

export type VerifiedImageMimeType = (typeof VERIFIED_IMAGE_MIME_TYPES)[number];

export const PDF_AUTHENTICITY_MESSAGE =
  'PDF files cannot be verified for AI authenticity. Please upload a clear PNG or JPG image instead.';

export const UNSUPPORTED_MIME_MESSAGE =
  'Only PNG and JPG files can be verified.';

export function isVerifiedAttachmentField(field?: string): field is VerifiedAttachmentFieldKey {
  if (!field) return false;
  return field in VERIFIED_ATTACHMENT_FIELDS;
}

/** @deprecated Use isVerifiedAttachmentField */
export function isSupportingDocumentsField(field?: string): boolean {
  return field === SUPPORTING_DOCUMENTS_FIELD;
}

export function resolveFieldKeyFromApiName(
  apiFieldName: string
): VerifiedAttachmentFieldKey | null {
  const entry = Object.entries(VERIFIED_ATTACHMENT_FIELDS).find(
    ([, meta]) => meta.apiFieldName === apiFieldName
  );
  return entry ? (entry[0] as VerifiedAttachmentFieldKey) : null;
}

export function getApiFieldName(
  fieldName: string,
  fieldLabel?: string
): VerifiedApiFieldName | null {
  if (fieldName in VERIFIED_ATTACHMENT_FIELDS) {
    return VERIFIED_ATTACHMENT_FIELDS[fieldName as VerifiedAttachmentFieldKey]
      .apiFieldName;
  }
  if (fieldLabel === 'Supporting Documents') return 'Supporting Documents';
  if (fieldLabel?.includes('Affidavit of Loss')) return 'Affidavit of Loss';
  if (fieldLabel === 'Photo of Issue') return 'Photo of Issue';
  return null;
}

export function getDisplayLabelForField(field?: string): string | null {
  if (!field || !isVerifiedAttachmentField(field)) return null;
  return VERIFIED_ATTACHMENT_FIELDS[field].displayLabel;
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
