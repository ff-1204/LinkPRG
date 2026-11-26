// 처음 화면 그림 시안 다섯 장을 만든다: node art/pixel/title-mock.cjs → art/pixel/mock/title-1~5.png
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const OUT = path.join(__dirname, 'out'), MOCK = path.join(__dirname, 'mock');
fs.mkdirSync(MOCK, { recursive: true });

function crc32(buf) { let crc = ~0; for (let n = 0; n < buf.length; n++) { let c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return ~crc >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
function encode(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
function decode(name) {
  const b = fs.readFileSync(path.join(OUT, name + '.png'));
  const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
  const parts = [];
  for (let p = 8; p < b.length;) { const len = b.readUInt32BE(p); if (b.toString('ascii', p + 4, p + 8) === 'IDAT') parts.push(b.subarray(p + 8, p + 8 + len)); p += 12 + len; }
  const raw = zlib.inflateSync(Buffer.concat(parts));
  const rgba = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) raw.copy(rgba, y * w * 4, y * (w * 4 + 1) + 1, (y + 1) * (w * 4 + 1));
  return { w, h, rgba };
}

const W = 1200, H = 630;
const CREAM = [251, 244, 228], DEEP = [58, 42, 30], HONEY = [242, 180, 56], SAND = [243, 232, 211], NIGHT = [38, 30, 44];
function board(bg) {
  const c = Buffer.alloc(W * H * 4);
  const fill = (x0, y0, w, h, [r, g, b]) => { for (let y = Math.max(0, y0); y < Math.min(H, y0 + h); y++) for (let x = Math.max(0, x0); x < Math.min(W, x0 + w); x++) { const i = (y * W + x) * 4; c[i] = r; c[i + 1] = g; c[i + 2] = b; c[i + 3] = 255; } };
  const paste = (img, ox, oy, s, crop = null) => {
    const x0 = crop ? crop[0] : 0, x1 = crop ? crop[1] : img.w;
    for (let y = 0; y < img.h; y++) for (let x = x0; x < x1; x++) { const p = (y * img.w + x) * 4; if (img.rgba[p + 3] < 128) continue; fill(ox + (x - x0) * s, oy + y * s, s, s, [img.rgba[p], img.rgba[p + 1], img.rgba[p + 2]]); }
  };
  fill(0, 0, W, H, bg);
  return { c, fill, paste, save: (n) => { fs.writeFileSync(path.join(MOCK, `title-${n}.png`), encode(W, H, c)); } };
}
const fit = (img, maxW, maxH) => Math.max(1, Math.min(Math.floor(maxW / img.w), Math.floor(maxH / img.h)));
const corner = (img) => (img.rgba[3] < 128 ? CREAM : [img.rgba[0], img.rgba[1], img.rgba[2]]); // 낮 그림은 바탕이 비어 있다

// 1. 마을 한 줄: 광장 띠 하나를 크게. 군더더기 없이.
{
  const b = board(CREAM);
  const img = decode('strip-plaza-empty');
  const s = fit(img, W, 420);
  b.paste(img, Math.floor((W - img.w * s) / 2), Math.floor((H - img.h * s) / 2), s);
  b.save(1);
}
// 2. 밤의 종루: 어두운 바탕에 종루의 밤. 이야기의 분위기.
{
  const img = decode('strip-belltower-night');
  const b = board(corner(img));
  const s = fit(img, W, 460);
  b.paste(img, Math.floor((W - img.w * s) / 2), Math.floor((H - img.h * s) / 2), s);
  b.fill(0, H - 14, W, 14, HONEY);
  b.save(2);
}
// 3. 허수아비 하나: 한 번 누르면 한 번. 이 게임이 시작하는 자리.
{
  const b = board(SAND);
  const img = decode('scarecrow-0');
  const s = fit(img, 520, 470);
  const x = Math.floor((W - img.w * s) / 2), y = Math.floor((H - img.h * s) / 2) - 10;
  b.paste(img, x, y, s);
  b.fill(160, y + img.h * s, W - 320, 10, DEEP);
  b.save(3);
}
// 4. 낮과 밤: 같은 숲의 낮과 밤을 반씩. 시간이 흐르는 세계.
{
  const day = decode('strip-forest-day'), night = decode('strip-forest-night');
  const b = board(corner(day));
  b.fill(W / 2, 0, W / 2, H, corner(night));
  const s = fit(day, W, 460);
  const half = Math.floor(day.w / 2), ox = Math.floor((W - day.w * s) / 2), oy = Math.floor((H - day.h * s) / 2);
  b.paste(day, ox, oy, s, [0, half]);
  b.paste(night, ox + half * s, oy, s, [half, night.w]);
  b.fill(W / 2 - 3, 0, 6, H, HONEY);
  b.save(4);
}
// 5. 가는 곳들: 훈련소의 낮, 숲의 낮, 종루의 밤을 세 줄로. 아침에서 밤까지, 마을에서 먼 곳까지.
{
  const b = board(DEEP);
  const names = ['strip-train-day', 'strip-forest-day', 'strip-belltower-night'];
  const gap = 10, rh = Math.floor((H - gap * 4) / 3);
  names.forEach((n, i) => {
    const img = decode(n);
    const s = fit(img, W - gap * 2, rh);
    const oy = gap + i * (rh + gap);
    b.fill(gap, oy, W - gap * 2, rh, corner(img));
    b.paste(img, Math.floor((W - img.w * s) / 2), oy + rh - img.h * s, s);
  });
  b.save(5);
}
console.log('title-1~5.png');
