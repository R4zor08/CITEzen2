import { apiJson } from './api';

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

export type VerifiedApiFieldName =
  (typeof VERIFIED_ATTACHMENT_FIELDS)[keyof typeof VERIFIED_ATTACHMENT_FIELDS]['apiFieldName'];

export const PDF_AUTHENTICITY_MESSAGE =
  'PDF files cannot be verified for AI authenticity. Please upload a clear PNG or JPG image instead.';

export type AttachmentVerificationResult = {
  ok: boolean;
  verified?: boolean;
  genai: number;
  deepfake: number;
  message: string;
};

export function requiresAuthenticityVerification(
  fieldName: string,
  fieldLabel?: string
): boolean {
  if (fieldName in VERIFIED_ATTACHMENT_FIELDS) return true;
  if (fieldLabel === 'Supporting Documents') return true;
  if (fieldLabel?.includes('Affidavit of Loss')) return true;
  if (fieldLabel === 'Photo of Issue') return true;
  return false;
}

export function getApiFieldNameForUpload(
  fieldName: string,
  fieldLabel?: string
): VerifiedApiFieldName | null {
  if (fieldName in VERIFIED_ATTACHMENT_FIELDS) {
    return VERIFIED_ATTACHMENT_FIELDS[
      fieldName as keyof typeof VERIFIED_ATTACHMENT_FIELDS
    ].apiFieldName;
  }
  if (fieldLabel === 'Supporting Documents') return 'Supporting Documents';
  if (fieldLabel?.includes('Affidavit of Loss')) return 'Affidavit of Loss';
  if (fieldLabel === 'Photo of Issue') return 'Photo of Issue';
  return null;
}

export async function verifyConcernAttachment(input: {
  fieldName: VerifiedApiFieldName;
  dataUrl: string;
  fileName: string;
  mimeType: string;
}): Promise<AttachmentVerificationResult> {
  return apiJson<AttachmentVerificationResult>('/api/concerns/attachments/verify', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}
