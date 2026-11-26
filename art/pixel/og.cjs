// 미리보기 그림(og.png, 1200×630)을 만든다: node art/pixel/og.cjs
// 이미 만들어 둔 픽셀 그림(out/*.png)을 읽어 크림색 바탕 위에 늘어놓는다. 글자는 넣지 않는다.
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const OUT = path.join(__dirname, 'out');

function crc32(buf) { let crc = ~0; for (let n = 0; n < buf.length; n++) { let c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return ~crc >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
function encode(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
/** make.cjs가 쓴 PNG(8비트 RGBA, 필터 0)를 읽는다. */
function decode(file) {
  const b = fs.readFileSync(file);
  const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
  const parts = [];
  for (let p = 8; p < b.length;) { const len = b.readUInt32BE(p); const type = b.toString('ascii', p + 4, p + 8); if (type === 'IDAT') parts.push(b.subarray(p + 8, p + 8 + len)); p += 12 + len; }
  const raw = zlib.inflateSync(Buffer.concat(parts));
  const rgba = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) { if (raw[y * (w * 4 + 1)] !== 0) throw new Error('필터가 0이 아닌 줄: ' + file); raw.copy(rgba, y * w * 4, y * (w * 4 + 1) + 1, (y + 1) * (w * 4 + 1)); }
  return { w, h, rgba };
}

const W = 1200, H = 630;
const canvas = Buffer.alloc(W * H * 4);
const fill = (x0, y0, w, h, [r, g, b]) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { const i = (y * W + x) * 4; canvas[i] = r; canvas[i + 1] = g; canvas[i + 2] = b; canvas[i + 3] = 255; } };
/** 그림을 정수배로 늘려 붙인다. 투명한 점은 건너뛴다. */
const paste = (img, ox, oy, scale) => {
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const s = (y * img.w + x) * 4;
    if (img.rgba[s + 3] < 128) continue;
    fill(ox + x * scale, oy + y * scale, scale, scale, [img.rgba[s], img.rgba[s + 1], img.rgba[s + 2]]);
  }
};

const CREAM = [251, 244, 228], DEEP = [58, 42, 30], HONEY = [242, 180, 56];
fill(0, 0, W, H, CREAM);
fill(0, 0, W, 18, DEEP);
fill(0, H - 18, W, 18, DEEP);
// 가운데: 시작 마을의 광장
const plaza = decode(path.join(OUT, 'strip-plaza.png'));
const ps = Math.floor((W - 96) / plaza.w) || 1;
const px = Math.floor((W - plaza.w * ps) / 2), py = 150;
paste(plaza, px, py, ps);
// 아래: 허수아비, 멧돼지, 깎은 토끼, 목검, 물약
const row = ['scarecrow-0', 'boar', 'rabbit-4', 'item-woodsword', 'item-potion'].map((n) => decode(path.join(OUT, n + '.png')));
const gap = 56;
const hh = 120;
const sized = row.map((img) => { const sc = Math.max(1, Math.floor(hh / img.h)); return { img, sc, w: img.w * sc, h: img.h * sc }; });
let x = Math.floor((W - (sized.reduce((a, s) => a + s.w, 0) + gap * (sized.length - 1))) / 2);
const base = py + plaza.h * ps + 40 + hh;
for (const s of sized) { paste(s.img, x, base - s.h, s.sc); x += s.w + gap; }
fill(px, base + 14, plaza.w * ps, 6, HONEY);

fs.writeFileSync(path.join(__dirname, '..', '..', 'og.png'), encode(W, H, canvas));
console.log('og.png', W, H, '광장', plaza.w, plaza.h, '×', ps);
