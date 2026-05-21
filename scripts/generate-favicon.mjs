/**
 * Generates rounded favicon PNGs from the CITEzen logo in public/.
 * Run: node scripts/generate-favicon.mjs
 * Requires: npx sharp (dev-time only)
 */
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.join(
  root,
  'public',
  'Gemini_Generated_Image_u7mgetu7mgetu7mg.png'
);

if (!fs.existsSync(input)) {
  console.error('Logo not found:', input);
  process.exit(1);
}

const sharp = (await import('sharp')).default;

const sizes = [
  { size: 32, out: 'favicon-32.png', radiusRatio: 0.28 },
  { size: 192, out: 'favicon-192.png', radiusRatio: 0.28 }
];

for (const { size, out, radiusRatio } of sizes) {
  const radius = Math.round(size * radiusRatio);
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/></svg>`
  );

  await sharp(input)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toFile(path.join(root, 'public', out));

  console.log('Wrote', out, `(rx=${radius})`);
}
