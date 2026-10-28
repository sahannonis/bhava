/* Turns Sahan's finished images into game art.

     1. Put the PNGs from the image tool in  art-src/  (named as in the spec: class-sun.png, enemy-rahu.png ...)
     2. Run  npm run art
     3. The game picks them up from  src/art/  on the next build. Anything missing keeps the drawn ink art.

   Each image is painted on plain parchment. That parchment is lifted out (the "colour to alpha" trick:
   every pixel is read as ink laid over the paper colour), so the figure sits on the game's own leaf
   with no box around it, and bright parts such as glowing eyes keep their light.
   Squares become 512 x 512, tall images 640 x 960, all small WebP files. */
import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import { join, parse } from 'node:path';

const SRC = process.env.ART_SRC || 'art-src', OUT = process.env.ART_OUT || 'src/art';
const SKIP = new Set(['icon', 'feature-graphic']); // store images, not used inside the game
const KEEP_PAPER = new Set(['card-back']);        // the card back keeps its own paper

/* The paper colour: the median of the pixels along the edges. */
function paperOf(px, w, h) {
  const r = [], g = [], b = [];
  const take = (x, y) => { const i = (y * w + x) * 4; r.push(px[i]); g.push(px[i + 1]); b.push(px[i + 2]); };
  for (let x = 0; x < w; x += 4) { take(x, 0); take(x, 1); take(x, h - 1); take(x, h - 2); }
  for (let y = 0; y < h; y += 4) { take(0, y); take(1, y); take(w - 1, y); take(w - 2, y); }
  const med = a => a.sort((p, q) => p - q)[a.length >> 1];
  return [med(r), med(g), med(b)];
}

/* Each pixel = ink * a + paper * (1 - a). Take the smallest a that explains it, then the ink colour.
   A little noise around the paper (fibres, grain) is dropped so the edges stay clean. */
function lift(px, paper, floor = 0.1) {
  for (let i = 0; i < px.length; i += 4) {
    let a = 0;
    for (let c = 0; c < 3; c++) {
      const p = px[i + c], q = paper[c];
      const need = p < q ? (q - p) / Math.max(q, 1) : (p - q) / Math.max(255 - q, 1);
      if (need > a) a = need;
    }
    const kept = Math.max(0, (a - floor) / (1 - floor));
    if (kept <= 0) { px[i + 3] = 0; continue; }
    for (let c = 0; c < 3; c++) {
      const ink = (px[i + c] - (1 - a) * paper[c]) / a;
      px[i + c] = Math.max(0, Math.min(255, Math.round(ink)));
    }
    px[i + 3] = Math.round(Math.min(1, kept) * (px[i + 3] / 255) * 255);
  }
}

await mkdir(OUT, { recursive: true });
let files = [];
try { files = (await readdir(SRC)).filter(f => /\.(png|jpe?g|webp)$/i.test(f)); } catch { /* no folder yet */ }
if (!files.length) console.log(`No images in ${SRC}/ yet. Put the PNGs there and run this again.`);

for (const f of files) {
  const name = parse(f).name.toLowerCase();
  if (SKIP.has(name)) continue;
  const img = sharp(join(SRC, f)).ensureAlpha();
  const { width = 1, height = 1 } = await img.metadata();
  const tall = height > width * 1.2;
  const [w, h] = tall ? [640, 960] : [512, 512];
  const { data, info } = await img.resize(w, h, { fit: 'cover' }).raw().toBuffer({ resolveWithObject: true });
  if (!KEEP_PAPER.has(name)) lift(data, paperOf(data, info.width, info.height));
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ quality: 82, alphaQuality: 90, effort: 5 })
    .toFile(join(OUT, `${name}.webp`));
  console.log(`${f} → ${OUT}/${name}.webp`);
}
