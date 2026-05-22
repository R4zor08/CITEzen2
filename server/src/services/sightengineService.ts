import {
  dataUrlFromBase64,
  isVerifiedImageMimeType,
  parseDataUrl,
  UNSUPPORTED_MIME_MESSAGE
} from '../lib/attachmentVerification.js';

export type SightengineVerificationResult = {
  ok: boolean;
  genai: number;
  deepfake: number;
  message: string;
};

const SIGHTENGINE_CHECK_URL = 'https://api.sightengine.com/1.0/check.json';

const PASS_MESSAGE = 'File verified successfully.';
const API_ERROR_MESSAGE = 'Unable to verify the file. Please try again.';

function readThreshold(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function getCredentials(): { apiUser: string; apiSecret: string } | null {
  const apiUser = process.env.SIGHTENGINE_API_USER?.trim();
  const apiSecret = process.env.SIGHTENGINE_API_SECRET?.trim();
  if (!apiUser || !apiSecret) return null;
  return { apiUser, apiSecret };
}

function extractScores(body: Record<string, unknown>): { genai: number; deepfake: number } {
  const type = body.type as Record<string, unknown> | undefined;
  const genai = Number(type?.ai_generated ?? 0);
  const deepfake = Number(type?.deepfake ?? 0);
  return {
    genai: Number.isFinite(genai) ? genai : 0,
    deepfake: Number.isFinite(deepfake) ? deepfake : 0
  };
}

function buildFailureMessage(
  genai: number,
  deepfake: number,
  genaiThreshold: number,
  deepfakeThreshold: number
): string {
  if (genai > genaiThreshold) {
    return 'This file appears to be AI-generated. Please upload a real document/photo.';
  }
  if (deepfake > deepfakeThreshold) {
    return 'This file appears to be manipulated. Please upload a real document/photo.';
  }
  return 'This file did not pass authenticity verification.';
}

function prefixContextMessage(contextLabel: string | undefined, message: string): string {
  if (!contextLabel) return message;
  if (message.startsWith('This file appears to be AI-generated')) {
    return `${contextLabel} appears to be AI-generated. Please upload a real document/photo.`;
  }
  if (message.startsWith('This file appears to be manipulated')) {
    return `${contextLabel} appears to be manipulated. Please upload a real document/photo.`;
  }
  return message;
}

export async function verifyImageAttachment(input: {
  dataUrl?: string;
  base64?: string;
  mimeType: string;
  fileName?: string;
  contextLabel?: string;
}): Promise<SightengineVerificationResult> {
  const credentials = getCredentials();
  if (!credentials) {
    return {
      ok: false,
      genai: 0,
      deepfake: 0,
      message: 'Image verification is not configured. Please contact support.'
    };
  }

  if (!isVerifiedImageMimeType(input.mimeType)) {
    return {
      ok: false,
      genai: 0,
      deepfake: 0,
      message: UNSUPPORTED_MIME_MESSAGE
    };
  }

  let buffer: Buffer;
  try {
    if (input.dataUrl) {
      const parsed = parseDataUrl(input.dataUrl);
      if (!isVerifiedImageMimeType(parsed.mimeType)) {
        return {
          ok: false,
          genai: 0,
          deepfake: 0,
          message: UNSUPPORTED_MIME_MESSAGE
        };
      }
      buffer = parsed.buffer;
    } else if (input.base64) {
      const dataUrl = dataUrlFromBase64(input.base64, input.mimeType);
      buffer = parseDataUrl(dataUrl).buffer;
    } else {
      return {
        ok: false,
        genai: 0,
        deepfake: 0,
        message: 'No image data provided.'
      };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid image data';
    return { ok: false, genai: 0, deepfake: 0, message };
  }

  const genaiThreshold = readThreshold('SIGHTENGINE_GENAI_THRESHOLD', 0.5);
  const deepfakeThreshold = readThreshold('SIGHTENGINE_DEEPFAKE_THRESHOLD', 0.5);
  const fileName = input.fileName?.trim() || 'attachment.jpg';

  try {
    const form = new FormData();
    form.append(
      'media',
      new Blob([new Uint8Array(buffer)], { type: input.mimeType }),
      fileName
    );
    form.append('models', 'genai,deepfake');
    form.append('api_user', credentials.apiUser);
    form.append('api_secret', credentials.apiSecret);

    const res = await fetch(SIGHTENGINE_CHECK_URL, {
      method: 'POST',
      body: form
    });

    const body = (await res.json()) as Record<string, unknown>;

    if (!res.ok || body.status !== 'success') {
      return {
        ok: false,
        genai: 0,
        deepfake: 0,
        message: API_ERROR_MESSAGE
      };
    }

    const { genai, deepfake } = extractScores(body);
    const failedGenai = genai > genaiThreshold;
    const failedDeepfake = deepfake > deepfakeThreshold;

    if (failedGenai || failedDeepfake) {
      const message = prefixContextMessage(
        input.contextLabel,
        buildFailureMessage(genai, deepfake, genaiThreshold, deepfakeThreshold)
      );
      return {
        ok: false,
        genai,
        deepfake,
        message
      };
    }

    return {
      ok: true,
      genai,
      deepfake,
      message: PASS_MESSAGE
    };
  } catch {
    return {
      ok: false,
      genai: 0,
      deepfake: 0,
      message: API_ERROR_MESSAGE
    };
  }
}
