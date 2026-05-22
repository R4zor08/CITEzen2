import type { ConcernAttachment } from '../types.js';
import {
  isImageMimeType,
  isSupportingDocumentsField,
  isVerifiedImageMimeType,
  MAX_ATTACHMENT_BYTES,
  normalizeVerificationMimeType,
  parseDataUrl
} from '../lib/attachmentVerification.js';
import * as sightengineService from './sightengineService.js';

const PDF_REJECTION_MESSAGE =
  'PDF files cannot be verified for authenticity. Please upload PNG or JPG supporting documents.';

export async function verifyAttachmentPayload(body: {
  dataUrl: string;
  fileName: string;
  mimeType: string;
}): Promise<sightengineService.SightengineVerificationResult> {
  if (!body.dataUrl?.trim()) {
    return { ok: false, genai: 0, deepfake: 0, message: 'File data is required.' };
  }

  if (!isVerifiedImageMimeType(body.mimeType)) {
    return {
      ok: false,
      genai: 0,
      deepfake: 0,
      message: 'Only PNG and JPG images can be verified for authenticity.'
    };
  }

  try {
    const { buffer } = parseDataUrl(body.dataUrl);
    if (buffer.length > MAX_ATTACHMENT_BYTES) {
      return {
        ok: false,
        genai: 0,
        deepfake: 0,
        message: 'File exceeds maximum size of 10MB.'
      };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid file data';
    return { ok: false, genai: 0, deepfake: 0, message };
  }

  const mimeType = normalizeVerificationMimeType(body.mimeType);
  return sightengineService.verifyImageAttachment({
    dataUrl: body.dataUrl,
    mimeType,
    fileName: body.fileName
  });
}

export async function validateAttachmentsForCreate(
  attachments?: ConcernAttachment[]
): Promise<{ ok: true } | { error: string }> {
  if (!attachments?.length) return { ok: true };

  for (const att of attachments) {
    if (att.size > MAX_ATTACHMENT_BYTES) {
      return { error: 'One or more attachments exceed the maximum size of 10MB.' };
    }

    if (isSupportingDocumentsField(att.field)) {
      if (att.mimeType === 'application/pdf') {
        return { error: PDF_REJECTION_MESSAGE };
      }
      if (!isVerifiedImageMimeType(att.mimeType)) {
        return {
          error:
            'Supporting documents must be PNG or JPG images so authenticity can be verified.'
        };
      }

      const mimeType = normalizeVerificationMimeType(att.mimeType);
      const result = await sightengineService.verifyImageAttachment({
        dataUrl: att.dataUrl,
        mimeType,
        fileName: att.name
      });
      if (!result.ok) {
        return { error: result.message };
      }
      continue;
    }

    if (isImageMimeType(att.mimeType)) {
      if (!isVerifiedImageMimeType(att.mimeType)) {
        continue;
      }
      const mimeType = normalizeVerificationMimeType(att.mimeType);
      const result = await sightengineService.verifyImageAttachment({
        dataUrl: att.dataUrl,
        mimeType,
        fileName: att.name
      });
      if (!result.ok) {
        return { error: result.message };
      }
    }
  }

  return { ok: true };
}
