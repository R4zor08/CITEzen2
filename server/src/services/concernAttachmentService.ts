import type { ConcernAttachment } from '../types.js';
import {
  getDisplayLabelForField,
  isVerifiedAttachmentField,
  isVerifiedImageMimeType,
  MAX_ATTACHMENT_BYTES,
  normalizeVerificationMimeType,
  parseDataUrl,
  resolveFieldKeyFromApiName,
  UNSUPPORTED_MIME_MESSAGE,
  VERIFIED_API_FIELD_NAMES
} from '../lib/attachmentVerification.js';
import * as sightengineService from './sightengineService.js';

export type AttachmentVerificationResponse = {
  ok: boolean;
  verified: boolean;
  genai: number;
  deepfake: number;
  message: string;
};

function toVerificationResponse(
  result: sightengineService.SightengineVerificationResult
): AttachmentVerificationResponse {
  return {
    ok: result.ok,
    verified: result.ok,
    genai: result.genai,
    deepfake: result.deepfake,
    message: result.message
  };
}

export async function verifyAttachmentPayload(body: {
  fieldName: (typeof VERIFIED_API_FIELD_NAMES)[number];
  dataUrl: string;
  fileName: string;
  mimeType: string;
}): Promise<AttachmentVerificationResponse> {
  const fieldKey = resolveFieldKeyFromApiName(body.fieldName);
  if (!fieldKey) {
    return {
      ok: false,
      verified: false,
      genai: 0,
      deepfake: 0,
      message: 'Invalid field for verification.'
    };
  }

  const contextLabel = body.fieldName;

  if (!body.dataUrl?.trim()) {
    return {
      ok: false,
      verified: false,
      genai: 0,
      deepfake: 0,
      message: 'File data is required.'
    };
  }

  if (!isVerifiedImageMimeType(body.mimeType)) {
    return {
      ok: false,
      verified: false,
      genai: 0,
      deepfake: 0,
      message: UNSUPPORTED_MIME_MESSAGE
    };
  }

  try {
    const { buffer } = parseDataUrl(body.dataUrl);
    if (buffer.length > MAX_ATTACHMENT_BYTES) {
      return {
        ok: false,
        verified: false,
        genai: 0,
        deepfake: 0,
        message: 'File exceeds maximum size of 10MB.'
      };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid file data';
    return {
      ok: false,
      verified: false,
      genai: 0,
      deepfake: 0,
      message
    };
  }

  const mimeType = normalizeVerificationMimeType(body.mimeType);
  const result = await sightengineService.verifyImageAttachment({
    dataUrl: body.dataUrl,
    mimeType,
    fileName: body.fileName,
    contextLabel
  });
  return toVerificationResponse(result);
}

export async function validateAttachmentsForCreate(
  attachments?: ConcernAttachment[]
): Promise<{ ok: true } | { error: string }> {
  if (!attachments?.length) return { ok: true };

  for (const att of attachments) {
    if (att.size > MAX_ATTACHMENT_BYTES) {
      return { error: 'One or more attachments exceed the maximum size of 10MB.' };
    }

    if (!isVerifiedAttachmentField(att.field)) {
      continue;
    }

    const contextLabel = getDisplayLabelForField(att.field) ?? att.field;

    if (att.mimeType === 'application/pdf') {
      return {
        error: `${contextLabel} cannot be verified because PDF is not supported. Please upload PNG or JPG.`
      };
    }

    if (!isVerifiedImageMimeType(att.mimeType)) {
      return {
        error: `${contextLabel} must be a PNG or JPG image. ${UNSUPPORTED_MIME_MESSAGE}`
      };
    }

    const mimeType = normalizeVerificationMimeType(att.mimeType);
    const result = await sightengineService.verifyImageAttachment({
      dataUrl: att.dataUrl,
      mimeType,
      fileName: att.name,
      contextLabel
    });
    if (!result.ok) {
      return { error: result.message };
    }
  }

  return { ok: true };
}
