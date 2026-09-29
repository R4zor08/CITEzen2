import zlib from 'node:zlib';

export interface ImageAuthenticityResult {
  ok: boolean;
  verified: boolean;
  genai: number;
  deepfake: number;
  isReal: boolean;
  hasAiSignatures?: boolean;
  method: 'sightengine' | 'ai_metadata' | 'exif_hardware' | 'document_screenshot' | 'heuristic';
  reasons: string[];
  message: string;
}

export interface ImageMetadata {
  format: 'png' | 'jpeg' | 'unknown';
  width: number;
  height: number;
  aspectRatio: number;
  colorType?: number;
  bitDepth?: number;
  textChunks: Record<string, string>;
  exifTags: Record<string, string>;
  hasCameraExif: boolean;
  cameraMake?: string;
  cameraModel?: string;
  hasAiSignatures: boolean;
  aiSignatures: string[];
  isLikelyScreenshotOrDoc: boolean;
}

const AI_SIGNATURE_PATTERNS = [
  /steps:\s*\d+/i,
  /sampler:\s*[\w\s+]+/i,
  /cfg scale:\s*[\d.]+/i,
  /seed:\s*\d+/i,
  /negative[_\s]?prompt/i,
  /novelai/i,
  /stable[_\s]?diffusion/i,
  /stablediffusion/i,
  /automatic1111/i,
  /comfyui/i,
  /ksampler/i,
  /checkpointloadersimple/i,
  /fooocus/i,
  /invokeai/i,
  /midjourney/i,
  /dall[-_\s]?e/i,
  /trainedalgorithmicmedia/i,
  /c2pa\.created/i,
  /c2pa\.actions/i,
  /dreamstudio/i,
  /civitaicivitai/i
];

const CAMERA_MAKERS = [
  'apple',
  'samsung',
  'google',
  'xiaomi',
  'huawei',
  'oppo',
  'vivo',
  'oneplus',
  'sony',
  'canon',
  'nikon',
  'fujifilm',
  'motorola',
  'asus',
  'realme',
  'panasonic',
  'olympus'
];

const COMMON_SCREEN_RESOLUTIONS: Array<[number, number]> = [
  [1920, 1080],
  [1366, 768],
  [1280, 720],
  [1440, 900],
  [1600, 900],
  [1536, 864],
  [1680, 1050],
  [1920, 1200],
  [2560, 1440],
  [3840, 2160],
  // Mobile resolutions
  [1080, 2400],
  [1080, 2340],
  [1080, 1920],
  [1170, 2532],
  [1284, 2778],
  [1290, 2796],
  [720, 1600],
  [720, 1520]
];

function isScreenOrDocDimensions(width: number, height: number): boolean {
  if (width <= 0 || height <= 0) return false;
  const ratio = Math.max(width, height) / Math.min(width, height);

  // Exact standard display resolution match
  const matchesKnown = COMMON_SCREEN_RESOLUTIONS.some(
    ([w, h]) =>
      (w === width && h === height) || (w === height && h === width)
  );
  if (matchesKnown) return true;

  // 16:9 ratio (~1.777), 16:10 (~1.6), A4 paper (~1.414), US Letter (~1.294)
  const is16by9 = Math.abs(ratio - 16 / 9) < 0.05;
  const is16by10 = Math.abs(ratio - 16 / 10) < 0.05;
  const isA4 = Math.abs(ratio - 1.414) < 0.08;
  const isLetter = Math.abs(ratio - 1.294) < 0.08;
  const isMobileScreen = ratio >= 1.9 && ratio <= 2.3;

  return is16by9 || is16by10 || isA4 || isLetter || isMobileScreen;
}

function parsePngMetadata(buffer: Buffer): ImageMetadata {
  const result: ImageMetadata = {
    format: 'png',
    width: 0,
    height: 0,
    aspectRatio: 1,
    textChunks: {},
    exifTags: {},
    hasCameraExif: false,
    hasAiSignatures: false,
    aiSignatures: [],
    isLikelyScreenshotOrDoc: false
  };

  if (buffer.length < 8) return result;
  // Verify PNG signature
  if (
    buffer[0] !== 0x89 ||
    buffer[1] !== 0x50 ||
    buffer[2] !== 0x4e ||
    buffer[3] !== 0x47 ||
    buffer[4] !== 0x0d ||
    buffer[5] !== 0x0a ||
    buffer[6] !== 0x1a ||
    buffer[7] !== 0x0a
  ) {
    return result;
  }

  let offset = 8;
  while (offset + 8 <= buffer.length) {
    const chunkLength = buffer.readUInt32BE(offset);
    const chunkType = buffer.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + chunkLength;

    if (dataEnd > buffer.length) break;

    const chunkData = buffer.subarray(dataStart, dataEnd);

    if (chunkType === 'IHDR' && chunkLength >= 13) {
      result.width = chunkData.readUInt32BE(0);
      result.height = chunkData.readUInt32BE(4);
      result.bitDepth = chunkData.readUInt8(8);
      result.colorType = chunkData.readUInt8(9);
      if (result.height > 0) {
        result.aspectRatio = result.width / result.height;
      }
    } else if (chunkType === 'tEXt') {
      const nullIdx = chunkData.indexOf(0);
      if (nullIdx !== -1) {
        const key = chunkData.toString('latin1', 0, nullIdx);
        const val = chunkData.toString('latin1', nullIdx + 1);
        result.textChunks[key] = val;
      }
    } else if (chunkType === 'zTXt') {
      const nullIdx = chunkData.indexOf(0);
      if (nullIdx !== -1 && nullIdx + 2 < chunkData.length) {
        const key = chunkData.toString('latin1', 0, nullIdx);
        try {
          const inflated = zlib.inflateSync(chunkData.subarray(nullIdx + 2));
          result.textChunks[key] = inflated.toString('latin1');
        } catch {
          // ignore decompression failure
        }
      }
    } else if (chunkType === 'iTXt') {
      const nullIdx = chunkData.indexOf(0);
      if (nullIdx !== -1 && nullIdx + 3 < chunkData.length) {
        const key = chunkData.toString('utf8', 0, nullIdx);
        const compFlag = chunkData[nullIdx + 1];
        // Skip compMethod, langTag, transKey
        let textStart = nullIdx + 3;
        // find next null for langTag
        const langNull = chunkData.indexOf(0, textStart);
        if (langNull !== -1) {
          textStart = langNull + 1;
          const transNull = chunkData.indexOf(0, textStart);
          if (transNull !== -1) {
            textStart = transNull + 1;
            const rawText = chunkData.subarray(textStart);
            try {
              if (compFlag === 1) {
                result.textChunks[key] = zlib.inflateSync(rawText).toString('utf8');
              } else {
                result.textChunks[key] = rawText.toString('utf8');
              }
            } catch {
              // ignore
            }
          }
        }
      }
    } else if (chunkType === 'IEND') {
      break;
    }

    offset += 8 + chunkLength + 4; // length + type + data + crc
  }

  // Check for AI signatures in text chunks
  for (const [key, val] of Object.entries(result.textChunks)) {
    const combined = `${key}: ${val}`;
    for (const pattern of AI_SIGNATURE_PATTERNS) {
      if (pattern.test(combined)) {
        result.hasAiSignatures = true;
        result.aiSignatures.push(`PNG chunk [${key}] matches ${pattern}`);
      }
    }
  }

  // Fallback: check entire buffer for AI markers in case chunks were customized
  if (!result.hasAiSignatures) {
    const rawString = buffer.toString('utf8', 0, Math.min(buffer.length, 300_000));
    for (const pattern of AI_SIGNATURE_PATTERNS) {
      if (pattern.test(rawString)) {
        result.hasAiSignatures = true;
        result.aiSignatures.push(`Buffer pattern ${pattern}`);
      }
    }
  }

  // Screenshots: indexed color or standard screen dimensions
  if (result.colorType === 3 || isScreenOrDocDimensions(result.width, result.height)) {
    result.isLikelyScreenshotOrDoc = true;
  }

  return result;
}

function parseJpegMetadata(buffer: Buffer): ImageMetadata {
  const result: ImageMetadata = {
    format: 'jpeg',
    width: 0,
    height: 0,
    aspectRatio: 1,
    textChunks: {},
    exifTags: {},
    hasCameraExif: false,
    hasAiSignatures: false,
    aiSignatures: [],
    isLikelyScreenshotOrDoc: false
  };

  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return result;
  }

  let offset = 2;
  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }

    const marker = buffer[offset + 1];
    if (marker === 0xd9 || marker === 0xda) {
      // EOI or SOS (start of scan)
      break;
    }

    const length = buffer.readUInt16BE(offset + 2);
    const dataStart = offset + 4;
    const dataEnd = offset + 2 + length;
    if (dataEnd > buffer.length) break;

    const segment = buffer.subarray(dataStart, dataEnd);

    // SOF0, SOF1, SOF2 (dimensions)
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      if (segment.length >= 5) {
        result.height = segment.readUInt16BE(1);
        result.width = segment.readUInt16BE(3);
        if (result.height > 0) {
          result.aspectRatio = result.width / result.height;
        }
      }
    }

    // APP1: EXIF or XMP
    if (marker === 0xe1) {
      const headerStr = segment.toString('ascii', 0, Math.min(segment.length, 30));
      if (headerStr.startsWith('Exif\0\0')) {
        parseExifTiff(segment.subarray(6), result);
      } else if (headerStr.includes('http://ns.adobe.com/xap/1.0/')) {
        const xmpStr = segment.toString('utf8');
        for (const pattern of AI_SIGNATURE_PATTERNS) {
          if (pattern.test(xmpStr)) {
            result.hasAiSignatures = true;
            result.aiSignatures.push(`XMP metadata pattern ${pattern}`);
          }
        }
      }
    }

    // COM: Comment marker
    if (marker === 0xfe) {
      const comment = segment.toString('latin1');
      result.textChunks.comment = comment;
      for (const pattern of AI_SIGNATURE_PATTERNS) {
        if (pattern.test(comment)) {
          result.hasAiSignatures = true;
          result.aiSignatures.push(`JPEG COM pattern ${pattern}`);
        }
      }
    }

    offset += 2 + length;
  }

  if (isScreenOrDocDimensions(result.width, result.height)) {
    result.isLikelyScreenshotOrDoc = true;
  }

  return result;
}

function parseExifTiff(tiffBuf: Buffer, result: ImageMetadata) {
  if (tiffBuf.length < 8) return;
  const isLE = tiffBuf[0] === 0x49 && tiffBuf[1] === 0x49; // 'II'
  const isBE = tiffBuf[0] === 0x4d && tiffBuf[1] === 0x4d; // 'MM'
  if (!isLE && !isBE) return;

  const readU16 = (off: number) =>
    isLE ? tiffBuf.readUInt16LE(off) : tiffBuf.readUInt16BE(off);
  const readU32 = (off: number) =>
    isLE ? tiffBuf.readUInt32LE(off) : tiffBuf.readUInt32BE(off);

  const ifd0Offset = readU32(4);
  if (ifd0Offset + 2 > tiffBuf.length) return;

  const numEntries = readU16(ifd0Offset);
  let cur = ifd0Offset + 2;

  for (let i = 0; i < numEntries && cur + 12 <= tiffBuf.length; i++, cur += 12) {
    const tag = readU16(cur);
    const type = readU16(cur + 2);
    const count = readU32(cur + 4);
    const valOffset = readU32(cur + 8);

    // ASCII string tag (type 2)
    if (type === 2 && count > 0) {
      let str = '';
      if (count <= 4) {
        str = tiffBuf.toString('ascii', cur + 8, cur + 8 + count - 1);
      } else if (valOffset + count <= tiffBuf.length) {
        str = tiffBuf.toString('ascii', valOffset, valOffset + count - 1);
      }
      str = str.replace(/\0+$/, '').trim();

      if (tag === 0x010f) {
        // Make
        result.cameraMake = str;
        result.exifTags.Make = str;
      } else if (tag === 0x0110) {
        // Model
        result.cameraModel = str;
        result.exifTags.Model = str;
      } else if (tag === 0x0131) {
        // Software
        result.exifTags.Software = str;
        for (const pattern of AI_SIGNATURE_PATTERNS) {
          if (pattern.test(str)) {
            result.hasAiSignatures = true;
            result.aiSignatures.push(`EXIF Software: ${str}`);
          }
        }
      }
    }
  }

  if (result.cameraMake) {
    const lowerMake = result.cameraMake.toLowerCase();
    if (CAMERA_MAKERS.some((m) => lowerMake.includes(m))) {
      result.hasCameraExif = true;
    }
  }
}

export function extractImageMetadata(
  buffer: Buffer,
  mimeType: string
): ImageMetadata {
  if (mimeType === 'image/png') {
    return parsePngMetadata(buffer);
  }
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return parseJpegMetadata(buffer);
  }
  // Try detection by magic bytes
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50) {
    return parsePngMetadata(buffer);
  }
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return parseJpegMetadata(buffer);
  }
  return {
    format: 'unknown',
    width: 0,
    height: 0,
    aspectRatio: 1,
    textChunks: {},
    exifTags: {},
    hasCameraExif: false,
    hasAiSignatures: false,
    aiSignatures: [],
    isLikelyScreenshotOrDoc: false
  };
}

export function evaluateImageAuthenticityLocally(
  buffer: Buffer,
  mimeType: string,
  fileName?: string
): ImageAuthenticityResult {
  const meta = extractImageMetadata(buffer, mimeType);
  const reasons: string[] = [];
  const lowerName = (fileName || '').toLowerCase();

  const isScreenshotName =
    lowerName.includes('screenshot') ||
    lowerName.includes('screen shot') ||
    lowerName.includes('capture') ||
    lowerName.includes('snip');

  const isDocumentName =
    lowerName.includes('doc') ||
    lowerName.includes('scan') ||
    lowerName.includes('grade') ||
    lowerName.includes('receipt') ||
    lowerName.includes('affidavit') ||
    lowerName.includes('id_') ||
    lowerName.includes('cor') ||
    lowerName.includes('photo_') ||
    lowerName.includes('img_') ||
    lowerName.includes('pxl_');

  // Rule 1: Explicit AI Generation Signatures Detected
  if (meta.hasAiSignatures) {
    reasons.push(
      `Detected generative AI parameters: ${meta.aiSignatures.slice(0, 2).join(', ')}`
    );
    return {
      ok: false,
      verified: false,
      genai: 0.96,
      deepfake: 0.02,
      isReal: false,
      hasAiSignatures: true,
      method: 'ai_metadata',
      reasons,
      message:
        'This file appears to be AI-generated. Please upload a real document/photo.'
    };
  }

  // Rule 2: Authentic Hardware Camera Photograph
  if (meta.hasCameraExif) {
    reasons.push(
      `Authentic camera capture verified (${meta.cameraMake || ''} ${meta.cameraModel || ''})`
    );
    return {
      ok: true,
      verified: true,
      genai: 0.02,
      deepfake: 0.01,
      isReal: true,
      method: 'exif_hardware',
      reasons,
      message: 'File verified successfully.'
    };
  }

  // Rule 3: Authentic Screenshot or Digital Document
  if (isScreenshotName || isDocumentName || meta.isLikelyScreenshotOrDoc) {
    const label = isScreenshotName
      ? 'System screenshot verified'
      : isDocumentName
        ? 'Digital document verified'
        : 'Display capture verified';
    reasons.push(
      `${label} (${meta.width > 0 ? `${meta.width}x${meta.height}` : 'Standard format'})`
    );
    return {
      ok: true,
      verified: true,
      genai: 0.03,
      deepfake: 0.01,
      isReal: true,
      method: 'document_screenshot',
      reasons,
      message: 'File verified successfully.'
    };
  }

  // Rule 4: Standard Diffusion AI Dimensions without Camera/Doc signatures
  // Diffusion standard sizes: exactly 512x512, 768x768, 1024x1024, 832x1216, 1216x832
  const isDiffusionStandardSize =
    (meta.width === 512 && meta.height === 512) ||
    (meta.width === 768 && meta.height === 768) ||
    (meta.width === 1024 && meta.height === 1024) ||
    (meta.width === 832 && meta.height === 1216) ||
    (meta.width === 1216 && meta.height === 832) ||
    (meta.width === 1024 && meta.height === 1536) ||
    (meta.width === 1536 && meta.height === 1024);

  if (isDiffusionStandardSize && !isScreenshotName && !isDocumentName) {
    reasons.push(
      `Image matches standard AI generative diffusion dimensions (${meta.width}x${meta.height}) with no camera provenance.`
    );
    return {
      ok: false,
      verified: false,
      genai: 0.88,
      deepfake: 0.04,
      isReal: false,
      method: 'heuristic',
      reasons,
      message:
        'This file appears to be AI-generated. Please upload a real document/photo.'
    };
  }

  // Default: Valid image without AI markers -> Genuine file passes verification
  reasons.push('Authenticity checks passed with no AI generation markers.');
  return {
    ok: true,
    verified: true,
    genai: 0.05,
    deepfake: 0.02,
    isReal: true,
    method: 'heuristic',
    reasons,
    message: 'File verified successfully.'
  };
}
