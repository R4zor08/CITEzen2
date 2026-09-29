import {
  dataUrlFromBase64,
  isVerifiedImageMimeType,
  parseDataUrl,
  UNSUPPORTED_MIME_MESSAGE
} from '../lib/attachmentVerification.js';
import {
  evaluateImageAuthenticityLocally,
  type ImageAuthenticityResult
} from './imageAuthenticityService.js';

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
  if (
    apiUser.includes('your_api_user') ||
    apiSecret.includes('your_api_secret') ||
    apiUser === 'your_api_user_number_here'
  ) {
    return null;
  }
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

  // Always run local authenticity inspection first (deep metadata & provenance)
  const localAnalysis: ImageAuthenticityResult = evaluateImageAuthenticityLocally(
    buffer,
    input.mimeType,
    fileName
  );

  // If local analysis finds definitive AI generation signatures (e.g. Stable Diffusion parameters, ComfyUI, Midjourney tags):
  if (localAnalysis.hasAiSignatures || localAnalysis.method === 'ai_metadata') {
    const message = prefixContextMessage(
      input.contextLabel,
      buildFailureMessage(
        localAnalysis.genai,
        localAnalysis.deepfake,
        genaiThreshold,
        deepfakeThreshold
      )
    );
    return {
      ok: false,
      genai: localAnalysis.genai,
      deepfake: localAnalysis.deepfake,
      message
    };
  }

  // Attempt external Sightengine verification if credentials are configured
  const credentials = getCredentials();
  if (credentials) {
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

      if (res.ok && body.status === 'success') {
        const { genai, deepfake } = extractScores(body);
        const failedGenai = genai > genaiThreshold;
        const failedDeepfake = deepfake > deepfakeThreshold;

        // If Sightengine flags it as AI:
        if (failedGenai || failedDeepfake) {
          // Safeguard: If local analysis verified it as an authentic document/screenshot and Sightengine score is borderline:
          if (
            localAnalysis.isReal &&
            (localAnalysis.method === 'document_screenshot' ||
              localAnalysis.method === 'exif_hardware') &&
            genai < 0.8
          ) {
            // Authentic student document / screenshot — favor authentic provenance
            return {
              ok: true,
              genai: localAnalysis.genai,
              deepfake: localAnalysis.deepfake,
              message: PASS_MESSAGE
            };
          }

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
      }
      // If Sightengine API call was not successful (e.g. rate limit, 401, quota),
      // we fall through to the local analysis result below.
    } catch {
      // Fall through to local analysis
    }
  }

  // When Sightengine is not configured or unavailable, rely on local authenticity analysis
  if (!localAnalysis.ok) {
    const message = prefixContextMessage(
      input.contextLabel,
      buildFailureMessage(
        localAnalysis.genai,
        localAnalysis.deepfake,
        genaiThreshold,
        deepfakeThreshold
      )
    );
    return {
      ok: false,
      genai: localAnalysis.genai,
      deepfake: localAnalysis.deepfake,
      message
    };
  }

  return {
    ok: true,
    genai: localAnalysis.genai,
    deepfake: localAnalysis.deepfake,
    message: PASS_MESSAGE
  };
}
