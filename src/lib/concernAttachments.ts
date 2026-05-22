import { apiJson } from './api';

export const SUPPORTING_DOCUMENTS_FIELD = 'evidence';

export type AttachmentVerificationResult = {
  ok: boolean;
  genai: number;
  deepfake: number;
  message: string;
};

export function requiresAuthenticityVerification(
  fieldName: string,
  fieldLabel?: string
): boolean {
  return (
    fieldName === SUPPORTING_DOCUMENTS_FIELD || fieldLabel === 'Supporting Documents'
  );
}

export async function verifyConcernAttachment(input: {
  dataUrl: string;
  fileName: string;
  mimeType: string;
}): Promise<AttachmentVerificationResult> {
  return apiJson<AttachmentVerificationResult>('/api/concerns/attachments/verify', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}
