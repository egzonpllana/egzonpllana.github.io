// Rounds a profile photo into a circle with a green accent ring.
// Output: ~/Downloads/egzonpllana-avatar.png  (1000x1000, transparent corners)
import sharp from 'sharp';
import { homedir } from 'node:os';
import { join } from 'node:path';

const SRC = join(homedir(), 'Downloads', 'me.png');
const OUT = join(homedir(), 'Downloads', 'egzonpllana-avatar.png');

const SIZE = 1000;
const GREEN = '#2ee06a';
const MARGIN = 16; // transparent safety margin (so LinkedIn's circle crop keeps the ring)
const RING = 32; // green ring thickness

const outerR = SIZE / 2 - MARGIN;
const photoD = (outerR - RING) * 2;

// 1) circular-cropped photo
const photoSquare = await sharp(SRC)
  .resize(photoD, photoD, { fit: 'cover', position: 'centre' })
  .toBuffer();
const photoMask = Buffer.from(
  `<svg width="${photoD}" height="${photoD}"><circle cx="${photoD / 2}" cy="${photoD / 2}" r="${photoD / 2}" fill="#fff"/></svg>`
);
const circularPhoto = await sharp(photoSquare)
  .composite([{ input: photoMask, blend: 'dest-in' }])
  .png()
  .toBuffer();

// 2) green ring base (full green disc; the photo on top leaves only the ring visible)
const ring = Buffer.from(
  `<svg width="${SIZE}" height="${SIZE}">
     <circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${outerR}" fill="${GREEN}"/>
   </svg>`
);

// 3) compose on a transparent canvas
const offset = Math.round((SIZE - photoD) / 2);
await sharp({
  create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([
    { input: ring },
    { input: circularPhoto, left: offset, top: offset },
  ])
  .png()
  .toFile(OUT);

console.log('saved', OUT);
