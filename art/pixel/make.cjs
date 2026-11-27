// 시안에 넣을 픽셀 그림(PNG)을 만든다. 색은 게임의 네 가지 색과 명암만 쓴다.
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
const PAL = { K: '#3A2A1E', C: '#8A4F2B', c: '#B9793F', S: '#E6D9BD', W: '#FBF5E6', M: '#BFE3D0', m: '#2F7A5E', H: '#F2B63C', h: '#F8D98A', D: '#6B5443' };
const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

function crc32(buf) { let crc = ~0; for (let n = 0; n < buf.length; n++) { let c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return ~crc >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
function png(w, h, rgba) { const raw = Buffer.alloc((w * 4 + 1) * h); for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); } const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]); }

// 그림 = 글자 격자. '.'은 비침.
const grid = (rows, w) => { const W = w || Math.max(...rows.map(r => r.length)); return rows.map(r => { if (r.length > W) throw new Error('줄이 너무 김: ' + r); return r.padEnd(W, '.').split(''); }); };
const copy = g => g.map(r => r.slice());
const map = (g, f) => g.map((r, y) => r.map((ch, x) => f(ch, x, y)));
const set = (g, list) => { const n = copy(g); for (const [x, y, ch] of list) n[y][x] = ch; return n; };
const blank = (w, h, ch = '.') => Array.from({ length: h }, () => Array(w).fill(ch));
const blit = (dst, src, ox, oy) => { src.forEach((r, y) => r.forEach((ch, x) => { if (ch !== '.' && dst[oy + y] && dst[oy + y][ox + x] !== undefined) dst[oy + y][ox + x] = ch; })); return dst; };
function save(name, g, scale = 6) {
  const h = g.length, w = g[0].length, W = w * scale, Hh = h * scale, buf = Buffer.alloc(W * Hh * 4);
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
    const ch = g[Math.floor(y / scale)][Math.floor(x / scale)], i = (y * W + x) * 4;
    if (ch === '.') continue;
    if (!PAL[ch]) throw new Error(name + ': 모르는 색 글자 ' + ch);
    const [r, gg, b] = rgb(PAL[ch]); buf[i] = r; buf[i + 1] = gg; buf[i + 2] = b; buf[i + 3] = 255;
  }
  fs.writeFileSync(path.join(OUT, name + '.png'), png(W, Hh, buf));
  return `${name} ${w}x${h}`;
}
const done = [];

// ── 토끼 조각 (16×16) ──
const R4 = grid([
  '................', '.....KK...KK....', '....KcCK.KcCK...', '....KcCK.KcCK...', '....KcCK.KcCK...', '....KccKKKccK...',
  '...KccccccccK...', '...KcKccccKcK...', '...KccccccccK...', '...KcccCCcccK...', '....KccccccK....', '...KccccccccK...',
  '..KccccccccccK..', '..KcccccccccccK.', '..KKKKKKKKKKKKK.', '................'], 16);
const S0 = grid([
  '', '', '', '...KKKKKKKKKK', '...KCCCCCCCCK', '...KCcCCCCCCK', '...KCCCCCcCCK', '...KCCCCCCCCK', '...KCCcCCCCCK', '...KCCCCCCCCK',
  '...KCCCCCCcCK', '...KCcCCCCCCK', '...KCCCCCCCCK', '...KCCCCCCCCK', '...KKKKKKKKKK', ''], 16);
const S1 = grid([
  '', '', '....KKK..KKK', '....KCK..KCK', '....KCKKKKCK', '...KCCCCCCCCK', '...KCCCCCCCCK', '...KCCCCCCCCK', '...KCCCCCCCCK', '...KCCCCCCCCK',
  '...KCCCCCCCCK', '..KCCCCCCCCCCK', '..KCCCCCCCCCCK', '..KCCCCCCCCCCK', '..KKKKKKKKKKKK', ''], 16);
const S2 = set(map(R4, ch => ch === 'c' ? 'C' : ch), [[5, 7, 'C'], [10, 7, 'C']]);           // 꼴만 잡힘
const S3 = set(R4, [[7, 9, 'c'], [8, 9, 'c']]);                                               // 평작: 얼굴은 있지만 밋밋
const S4 = set(R4, [[1, 2, 'H'], [2, 1, 'H'], [2, 3, 'H'], [14, 5, 'H'], [13, 6, 'H'], [14, 7, 'H'], [1, 10, 'H'], [6, 7, 'W'], [11, 7, 'W']]); // 걸작: 눈빛과 반짝임
const LUMP = grid([
  '', '', '', '......KKK', '....KKCCCK', '...KCCCCCCKK', '...KCCCCCCCCK', '..KCCCCCCCCCK', '..KCCCCCCCCCCK', '..KCCCCCCCCCCK',
  '...KCCCCCCCCCK', '...KCCCCCCCCK', '..KCCCCCCCCCCK', '..KCCCCCCCCCCK', '..KKKKKKKKKKKK', ''], 16);
done.push(save('rabbit-0', S0), save('rabbit-1', S1), save('rabbit-2', S2), save('rabbit-3', S3), save('rabbit-4', S4), save('rabbit-lump', LUMP));

// ── 허수아비 (16×20) ──
const SC0 = grid([
  '', '......KKKK', '.....KhhhhK', '.....KhKKhK', '.....KhhhhK', '......KKKK', '.KKKKKKCCKKKKKK', '.KhhhhhCChhhhhK', '.KKKKKKCCKKKKKK',
  '.....KhCChK', '.....KhCChK', '.....KhhhhK', '.....KhhhhK', '......KKKK', '.......CC', '.......CC', '.......CC', '.......CC', '......KCCK', '.....KKKKKK'], 16);
const SC1 = set(SC0, [[3, 7, '.'], [4, 7, 'K'], [12, 7, '.'], [11, 7, 'K'], [6, 11, 'K'], [9, 12, 'K'], [6, 3, 'K'], [2, 9, 'h'], [13, 12, 'h'], [3, 18, 'h']]);
const SC2 = (() => { const g = blank(16, 20); SC1.forEach((r, y) => { const sh = y < 6 ? 2 : y < 14 ? 1 : 0; r.forEach((ch, x) => { if (ch !== '.' && x + sh < 16) g[y][x + sh] = ch; }); }); return set(g, [[1, 12, 'h'], [14, 15, 'h'], [2, 18, 'h'], [3, 19, 'h']]); })();
const SC3 = grid([
  '', '', '..h.........h', '.......h', '....h.......h', '', '.KKKKKKCCKKK', '.KhhhhhCChhK..h', '.KKKKKKCCKK', '.....KhCC', '......hCCh', '.....h.CC..h',
  '.......CC', '.......CC', '.......CC', '.......CC', '.......CC', '.......CC', '..h...KCCK...h', '.hhh.KKKKKK.hh'], 16);
done.push(save('scarecrow-0', SC0), save('scarecrow-1', SC1), save('scarecrow-2', SC2), save('scarecrow-3', SC3));

// ── 달군 쇠가 검이 되기까지 (24×8) ──
const F1 = grid(['', '', '.....KKKKKKKKKKKKKK', '....KHHHHHHHHHHHHHHK', '....KHhhhhhhhhhhhHHK', '.....KKKKKKKKKKKKKK', '', ''], 24);
const F2 = grid(['', '', '...KKKKKKKKKKKKKKKK', '..KHHHHHHHHHHHHHHHHKK', '..KHhhhhhhhhhhhhhhHHHK', '...KKKKKKKKKKKKKKKKKK', '', ''], 24);
const F3 = grid(['', '......K', '.....KCK', '.KKKKKCKKKKKKKKKKKKKK', '.KCCCKCKWWWWWWWWWWWWSK', '.KKKKKCKKKKKKKKKKKKKK', '.....KCK', '......K'], 24);
const F2C = map(F2, ch => ch === 'H' ? 'D' : ch === 'h' ? 'S' : ch);   // 식은 쇠
done.push(save('forge-1', F1), save('forge-2', F2), save('forge-3', F3), save('forge-cold', F2C));

// ── 물건 아이콘 (12×12) ──
const SW = grid(['.........KK', '........KBBK', '.......KBBK', '......KBBK', '.....KBBK', '....KBBK', '.K.KBBK', '.KKBBK', '..KCK', '.KCKKK', 'KCK..K', 'KK'], 12);
const sword = (b, extra = []) => set(map(SW, ch => ch === 'B' ? b : ch), extra);
done.push(save('sword-1', sword('D')), save('sword-2', sword('S')), save('sword-3', sword('M')), save('sword-4', sword('c')),
  save('sword-5', sword('H', [[9, 1, 'h'], [8, 2, 'h'], [7, 3, 'h'], [6, 4, 'h'], [5, 5, 'h'], [2, 2, 'H'], [1, 3, 'H'], [3, 3, 'H'], [2, 4, 'H'], [2, 3, 'h'], [10, 7, 'H'], [9, 8, 'H'], [11, 8, 'H'], [10, 9, 'H'], [10, 8, 'h']])));
done.push(save('item-ore', grid(['', '....KKKK', '...KSSSSK', '..KSSDSSSK', '.KSSSSSDSSK', '.KSDSSSSSSK', '.KSSSSDSSSK', '..KSSSSSSK', '...KKKKKK', '', '', ''], 12)));
done.push(save('item-potion', grid(['', '....KKKK', '....KSSK', '.....KK', '....KWWK', '...KWCCWK', '..KWCCCCWK', '..KCCCCCCK', '..KCCCCCCK', '...KCCCCK', '....KKKK', ''], 12)));
done.push(save('item-fish', grid(['', '', '', '...KKKKK', '..KMMMMMK.K', '.KMKMMMMMKMK', '.KMMMMMMMMMK', '..KMMMMMK.K', '...KKKKK', '', '', ''], 12)));
done.push(save('item-branch', grid(['.........KK', '........KCK', '..KK...KCK', '.KmmK.KCK', '.KmmKKCK', '..KKKCK', '....KCK', '...KCK', '..KCK', '.KCK', '.KK', ''], 12)));

// ── 멧돼지와 실루엣 (16×12) ──
const BOAR = grid(['', '....KKKKKKK', '...KCCCCCCCKK', '..KCCcCCCcCCCK', '.KCCCCCCCCCKCK', 'KWKCCCCCCCCCCCK', '.KKCCCCCCCCCCKK', '..KCCCCCCCCCK', '..KCKKCCCKKCK', '..KCK.KCK.KCK', '..KK..KK..KK', ''], 16);
done.push(save('boar', BOAR), save('boar-shadow', map(BOAR, ch => ch === '.' ? '.' : 'K')));

// ── 장소 띠 (96×24) ──
const TREE = grid(['..KKKK', '.KmmmmK', 'KmmMmmmK', 'KmmmmMmK', '.KmmmmK', '..KKKK', '...CC', '...CC', '...CC'], 8);
const HUT = grid(['......KK', '.....KCCK', '....KCCCCK', '...KCCCCCCK', '..KCCCCCCCCK', '.KKKKKKKKKKKK', '.KSSSSSSSSSSK', '.KSSKKSSSKKSK', '.KSSKKSSSKKSK', '.KKKKKKKKKKKK'], 14);
const FOUNT = grid(['.......MM', '......M..M', '.....M.MM.M', '.......KK', '......KSSK', '...KKKKSSKKKK', '..KMMMMMMMMMMK', '.KSSSSSSSSSSSSK', '.KSSSSSSSSSSSSK', '.KKKKKKKKKKKKKK'], 16);
const PED = grid(['..KKKKKKKKKKKK', '..KSSSSSSSSSSK', '.KSSSSSSSSSSSSK', '.KKKKKKKKKKKKKK'], 16);
const ground = g => { for (let x = 0; x < 96; x++) g[23][x] = 'K'; return g; };
const train = bg => { const g = ground(blank(96, 24, bg)); blit(g, HUT, 2, 13); blit(g, SC0, 22, 3); blit(g, SC1, 42, 3); blit(g, SC2, 62, 3); blit(g, TREE, 82, 14); blit(g, TREE, 88, 14); return g; };
const day = train('.');
const night = set(train('D'), [[8, 2, 'H'], [18, 5, 'h'], [38, 1, 'H'], [55, 4, 'h'], [79, 2, 'H'], [91, 6, 'h'], [84, 3, 'W'], [85, 3, 'W'], [84, 4, 'W'], [85, 4, 'W'], [86, 4, 'W'], [85, 5, 'W']]);
const plaza = ground(blank(96, 24));
blit(plaza, HUT, 1, 13); blit(plaza, HUT, 80, 13); blit(plaza, TREE, 18, 14); blit(plaza, FOUNT, 30, 13); blit(plaza, PED, 56, 19); blit(plaza, S4, 56, 4);
const plazaEmpty = ground(blank(96, 24));
blit(plazaEmpty, HUT, 1, 13); blit(plazaEmpty, HUT, 80, 13); blit(plazaEmpty, TREE, 18, 14); blit(plazaEmpty, FOUNT, 30, 13); blit(plazaEmpty, PED, 56, 19);
done.push(save('strip-train-day', day, 4), save('strip-train-night', night, 4), save('strip-plaza', plaza, 4), save('strip-plaza-empty', plazaEmpty, 4));

// ── M2: 물건 아이콘 더 (12×12) ──
done.push(save('item-woodsword', map(SW, (ch) => (ch === 'B' ? 'c' : ch))));
done.push(save('item-cloth', grid(['', '..KK....KK', '.KSSKKKKSSK', 'KSSSSSSSSSSK', 'KSSKSSSSKSSK', '.KKKSSSSKKK', '...KSSSSK', '...KSSSSK', '...KSSSSK', '...KSSSSK', '...KKKKKK', ''], 12)));
done.push(save('item-sandal', grid(['', '', '', '....KKKK', '...KhhhhK', '..KhKhhKhK', '.KhhhKKhhhK', '.KhhhhhhhhK', '.KKKKKKKKKK', '', '', ''], 12)));
done.push(save('item-copper', grid(['', '....KKKK', '...KSSSSK', '..KSSmSSSK', '.KSSSSSmSSK', '.KSmSSSSSSK', '.KSSSSmSSSK', '..KSSSSSSK', '...KKKKKK', '', '', ''], 12)));
done.push(save('item-herb', grid(['', '.....KK', '....KmmK.KK', '....KmMKKmmK', '.KK..KmKmMmK', 'KmmK.KmKmmK', 'KmMmKKmKKK', '.KmmmKmK', '..KKKmmK', '....KmK', '....KK', ''], 12)));
done.push(save('item-hide', grid(['', '.KK......KK', 'KCCK....KCCK', '.KCCKKKKCCK', '..KCCCCCCK', '..KCcCCcCK', '..KCCCCCCK', '.KCCKKKKCCK', 'KCCK....KCCK', '.KK......KK', '', ''], 12)));
done.push(save('item-meat', grid(['', '', '...KKKKK', '..KCCCCCK', '.KCCcCCCCK', '.KCCCCcCCKK', '.KCCCCCCKWWK', '..KCCCCKKWWK', '...KKKK..KK', '', '', ''], 12)));
done.push(save('item-wing', grid(['', '', 'K.........K', 'KK.......KK', 'KDK.KKK.KDK', 'KDDKDDDKDDK', 'KDDDDDDDDDK', '.KDKDDDKDK', '..K.KDK.K', '.....K', '', ''], 12)));
done.push(save('item-fang', grid(['', '', '...KKKK', '..KWWWWK', '..KWWWWK', '...KWWWK', '...KWWSK', '....KWSK', '....KWK', '.....KK', '', ''], 12)));
done.push(save('item-berry', grid(['', '.....KK', '....KmmK', '...KKKmK', '..KCCKKKK', '.KCcCKCCCK', '.KCCCKCcCK', '..KKKKCCCK', '..KCCKKKK', '.KCcCK', '.KCCCK', '..KKK'], 12)));
done.push(save('item-rice', grid(['', '', '.....KK', '....KWWK', '...KWWWWK', '..KWWWWWWK', '.KWWWWWWWWK', '.KWKKKKKKWK', '.KWKDDDDKWK', '.KKKKKKKKKK', '', ''], 12)));
done.push(save('item-unknown', grid(['', '...KKKKKK', '..KSSSSSSK', '..KSKKKKSK', '..KKK..KSK', '......KSSK', '.....KSSK', '.....KSK', '.....KKK', '.....KSK', '.....KKK', ''], 12)));

// ── M2: 장소 띠 더 (96×24) ──
const BIGTREE = grid(['...KKKKKK', '..KmmmmmmK', '.KmmMmmmmmK', 'KmmmmmmMmmmK', 'KmMmmmmmmmmK', 'KmmmmMmmmmmK', '.KmmmmmmmmK', '..KKmmmmKK', '....KCCK', '....KCCK', '....KCCK', '....KCCK', '....KCCK', '...KCCCCK'], 12);
const BUSH = grid(['..KKKK', '.KmmmmK', 'KmMmmmmK', 'KKKKKKKK'], 8);
const forest = (bg) => { const g = ground(blank(96, 24, bg)); [2, 16, 31, 52, 68, 83].forEach((x, i) => blit(g, BIGTREE, x, 9 - (i % 2))); [12, 44, 62, 78].forEach((x) => blit(g, BUSH, x, 19)); return g; };
const stars = (g) => set(g, [[8, 2, 'H'], [18, 5, 'h'], [38, 1, 'H'], [55, 4, 'h'], [79, 2, 'H'], [91, 6, 'h'], [47, 3, 'W'], [48, 3, 'W'], [47, 4, 'W'], [48, 4, 'W'], [49, 4, 'W'], [48, 5, 'W']]);
done.push(save('strip-forest-day', forest('.'), 4), save('strip-forest-night', stars(forest('D')), 4));

const ROCK = grid(['.....KKKKKKKKKKKK', '...KKDDDDDDDDDDDDKK', '..KDDDDDDDDDDDDDDDDK', '.KDDDDKKKKKKKKDDDDDDK', '.KDDDKKKKKKKKKKDDDDDK', 'KDDDDKKKKKKKKKKDDDDDDK', 'KDDDDKKKKKKKKKKDDDDDDK', 'KDDDDKKKKKKKKKKDDDDDDK', 'KDDDDKKKKKKKKKKDDDDDDK', 'KDDDDKKKKKKKKKKDDDDDDK'], 22);
const CART = grid(['.KKKKKKKK', '.KSDSDSDK', '.KKKKKKKK', '..K....K', '.KDK..KDK', '..K....K'], 10);
const mine = (bg) => { const g = ground(blank(96, 24, bg)); blit(g, ROCK, 34, 13); blit(g, CART, 62, 17); blit(g, BUSH, 6, 19); blit(g, TREE, 18, 14); blit(g, BUSH, 82, 19); for (let x = 72; x < 96; x += 3) g[22][x] = 'D'; return g; };
done.push(save('strip-mine-day', mine('.'), 4), save('strip-mine-night', stars(mine('D')), 4));

const REED = grid(['.h', 'hK', '.K', '.K', '.K', '.K'], 2);
const river = (bg) => { const g = blank(96, 24, bg); for (let x = 0; x < 96; x++) { g[23][x] = 'K'; for (let y = 18; y < 23; y++) g[y][x] = x > 26 ? 'M' : (bg === '.' ? '.' : bg); if (x > 26) g[17][x] = 'm'; if (x <= 26) g[22][x] = 'K'; } for (let x = 30; x < 96; x += 7) { g[19 + (x % 3)][x] = 'W'; g[19 + (x % 3)][x + 1] = 'W'; } blit(g, TREE, 3, 13); [22, 25, 40, 71, 88].forEach((x) => blit(g, REED, x, 12)); blit(g, grid(['K', 'K', 'K', 'K', 'K', 'KKKKKKKKKKKK'], 12), 18, 12); return g; };
done.push(save('strip-river-day', river('.'), 4), save('strip-river-night', stars(river('D')), 4));

const TEMPLE = grid(['.........KK', '........KHHK', '........KHHK', '.......KKKKKK', '.......KSSSSK', '.......KSKKSK', '.......KSKKSK', '....KKKKKKKKKKKK', '...KCCCCCCCCCCCCK', '..KCCCCCCCCCCCCCCK', '.KKKKKKKKKKKKKKKKKK', '.KSSSSSSSSSSSSSSSSK', '.KSSKKSSSKKKSSSKKSK', '.KSSKKSSSKKKSSSKKSK', '.KSSSSSSSKKKSSSSSSK', '.KKKKKKKKKKKKKKKKKK'], 20);
const temple = (bg) => { const g = ground(blank(96, 24, bg)); blit(g, TEMPLE, 36, 7); blit(g, TREE, 8, 14); blit(g, TREE, 78, 14); blit(g, BUSH, 22, 19); blit(g, BUSH, 64, 19); return g; };
done.push(save('strip-temple-day', temple('.'), 4), save('strip-temple-night', stars(temple('D')), 4));


// ── M3: 대장간, 잡화점, 주점 띠와 물건 ──
const HOUSE = (roof, extra = []) => set(grid(['....KKKKKKKKKKKKKK', '...K' + roof.repeat(14) + 'K', '..K' + roof.repeat(16) + 'K', '.KKKKKKKKKKKKKKKKKKKK', '.KSSSSSSSSSSSSSSSSSSK', '.KSSKKKSSSSSSSSKKKSSK', '.KSSKhKSSKKKKSSKhKSSK', '.KSSKKKSSKCCKSSKKKSSK', '.KSSSSSSSKCCKSSSSSSSK', '.KKKKKKKKKKKKKKKKKKKK'], 22), extra);
const ANVIL = grid(['KKKKKKKK', '.KDDDDDK', '..KDDK', '..KDDK', '.KKKKKK'], 8);
const BARREL = grid(['.KKKK', 'KCCCCK', 'KKKKKK', 'KCCCCK', 'KKKKKK'], 6);
const CRATE = grid(['KKKKKK', 'KSKKSK', 'KKSSKK', 'KSKKSK', 'KKKKKK'], 6);
const forgeS = (bg) => { const g = ground(blank(96, 24, bg)); blit(g, grid(['KKKK', 'KDDK', 'KDDK', 'KDDK', 'KDDK'], 4), 52, 8); blit(g, HOUSE('D', [[10, 7, 'H'], [11, 7, 'h'], [10, 8, 'h'], [11, 8, 'H']]), 36, 13); blit(g, ANVIL, 66, 18); blit(g, grid(['.h', 'hH', '.h'], 2), 54, 4); blit(g, TREE, 8, 14); blit(g, BUSH, 82, 19); return g; };
const storeS = (bg) => { const g = ground(blank(96, 24, bg)); blit(g, HOUSE('m'), 36, 13); blit(g, CRATE, 28, 18); blit(g, CRATE, 62, 18); blit(g, CRATE, 65, 13); blit(g, TREE, 78, 14); blit(g, BUSH, 10, 19); return g; };
const tavernS = (bg) => { const g = ground(blank(96, 24, bg)); blit(g, HOUSE('C', [[5, 6, 'H'], [16, 6, 'H']]), 36, 13); blit(g, BARREL, 28, 18); blit(g, BARREL, 22, 18); blit(g, grid(['KKKKKK', 'KhhhhK', 'KKKKKK', '..K'], 6), 62, 12); blit(g, TREE, 6, 14); blit(g, BUSH, 80, 19); return g; };
done.push(save('strip-forge-day', forgeS('.'), 4), save('strip-forge-night', stars(forgeS('D')), 4));
done.push(save('strip-store-day', storeS('.'), 4), save('strip-store-night', stars(storeS('D')), 4));
done.push(save('strip-tavern-day', tavernS('.'), 4), save('strip-tavern-night', stars(tavernS('D')), 4));
done.push(save('item-water', grid(['', '....KKKK', '....KSSK', '.....KK', '....KmmK', '...KmmmmK', '..KmmWmmmK', '..KmmmmmmK', '..KmmmmmmK', '...KmmmmK', '....KKKK', ''], 12)));

// ── M4: 폐허 입구 ──
const PILLAR = (h) => grid([...Array(h).fill('KSSK'), 'KKKKKK'].map((r, k) => (k === h ? r : '.' + r)), 6);
const ARCH = grid(['...KKKKKKKKKK', '..KDDDDDDDDDDK', '.KDDKKKKKKKKDDK', '.KDDK......KDDK', '.KDDK......KDDK', '.KDDK......KDDK', '.KDDK......KDDK', '.KDDK......KDDK', '.KDDK......KDDK'], 16);
const ruinsS = (bg) => { const g = ground(blank(96, 24, bg)); blit(g, ARCH, 40, 14); blit(g, PILLAR(8), 24, 14); blit(g, PILLAR(4), 32, 18); blit(g, PILLAR(6), 62, 16); blit(g, PILLAR(3), 72, 19); blit(g, BUSH, 6, 19); blit(g, BUSH, 84, 19); g[21][47] = 'h'; g[20][48] = 'H'; return g; };
done.push(save('strip-ruins-day', ruinsS('.'), 4), save('strip-ruins-night', stars(ruinsS('D')), 4));

// ── M5: 직업 장비 ──
done.push(save('item-shield', grid(['', '..KKKKKKKK', '.KCCCCCCCCK', '.KCSSSSSSCK', '.KCSCCCCSCK', '.KCSCHHCSCK', '.KCSCCCCSCK', '..KCSSSSCK', '...KCSSCK', '....KCCK', '.....KK', ''], 12)));
done.push(save('item-bow', grid(['', '....KK', '...KCK.W', '..KCK..W', '.KCK...W', '.KCK...W', '.KCK...W', '.KCK...W', '..KCK..W', '...KCK.W', '....KK', ''], 12)));
done.push(save('item-wand', grid(['', '........HH', '.......HhhH', '.......HhhH', '......KKHH', '.....KCK', '....KCK', '...KCK', '..KCK', '.KCK', '.KK', ''], 12)));
done.push(save('item-beads', grid(['', '...KKKKK', '..KS.K.SK', '.KS.....SK', '.K.......K', '.KS.....SK', '..K.....K', '..KS...SK', '...KKSKK', '.....K', '....KHK', '.....K'], 12)));
done.push(save('item-knife', grid(['', '', '.........K', '........KWK', '.......KWK', '......KWK', '.....KWK', '...KKWK', '..KCKK', '.KCK', '.KK', ''], 12)));

// ── M9: 나루 ──
const BOAT = grid(['......K', '.....KWK', '....KWWK', '...KWWWK', '......K', 'KKKKKKKKKKKK', '.KCCCCCCCCK', '..KKKKKKKK'], 12);
const water = (g, from, top) => { for (let x = from; x < 96; x++) { g[top][x] = 'm'; for (let y = top + 1; y < 23; y++) g[y][x] = 'M'; g[23][x] = 'K'; } for (let x = from + 4; x < 96; x += 9) { g[top + 2 + (x % 3)][x] = 'W'; g[top + 2 + (x % 3)][x + 1] = 'W'; } return g; };
const dockS = (bg) => { const g = ground(blank(96, 24, bg)); water(g, 30, 18); for (let x = 22; x < 62; x++) g[17][x] = 'C'; for (let x = 24; x < 62; x += 8) { g[18][x] = 'K'; g[19][x] = 'K'; g[20][x] = 'K'; } blit(g, BOAT, 64, 11); blit(g, BOAT, 80, 12); blit(g, TREE, 4, 14); blit(g, CRATE, 14, 18); return g; };
const STALL = (c) => grid(['KKKKKKKKKKKK', 'K' + c.repeat(10) + 'K', '.K' + 'WK'.repeat(4) + 'W.', '.K........K', '.KSSSSSSSSK', '.KKKKKKKKKK', '.K........K'], 12);
const marketS = (bg) => { const g = ground(blank(96, 24, bg)); blit(g, STALL('C'), 12, 16); blit(g, STALL('m'), 40, 16); blit(g, STALL('h'), 68, 16); blit(g, CRATE, 28, 18); blit(g, CRATE, 56, 18); blit(g, BARREL, 84, 18); return g; };
const bridgeS = () => { const g = ground(blank(96, 24, 'D')); for (let x = 8; x < 88; x++) { g[8][x] = 'K'; g[9][x] = 'S'; g[10][x] = 'K'; } for (const px of [12, 44, 76]) for (let y = 11; y < 23; y++) { g[y][px] = 'K'; g[y][px + 1] = 'S'; g[y][px + 2] = 'S'; g[y][px + 3] = 'K'; } blit(g, grid(['.KK', 'KHHK', 'KhhK', '.KK'], 4), 58, 15); blit(g, CRATE, 28, 18); blit(g, CRATE, 62, 19); return stars(g); };
const reedsS = (bg) => { const g = blank(96, 24, bg); water(g, 0, 19); for (let x = 2; x < 96; x += 3) blit(g, REED, x, 12 + (x % 5)); return g; };
done.push(save('strip-dock-day', dockS('.'), 4), save('strip-dock-night', stars(dockS('D')), 4));
done.push(save('strip-market-day', marketS('.'), 4), save('strip-market-night', stars(marketS('D')), 4));
done.push(save('strip-bridge-night', bridgeS(), 4));
done.push(save('strip-reeds-day', reedsS('.'), 4), save('strip-reeds-night', stars(reedsS('D')), 4));

// ── M10: 소리재 ──
const TOWER = grid(['.KKKKKKKKKK', '.K........K', '.KKKKKKKKKK', '.K........K', '.K........K', '.KKKKKKKKKK', '..KSSSSSSK', '..KSSKKSSK', '..KSSSSSSK', '..KSSSSSSK', '..KSSKKSSK', '..KSSSSSSK', '..KSSSSSSK', '.KKSSKKSSKK', '.KSSSKKSSSK', '.KKKKKKKKKK'], 12);
const towerS = (bg) => { const g = ground(blank(96, 24, bg)); blit(g, TOWER, 42, 7); blit(g, HOUSE('C'), 8, 13); blit(g, HOUSE('m'), 66, 13); return g; };
const PEAK = (h) => grid(Array.from({ length: h }, (_, y) => '.'.repeat(h - 1 - y) + 'K' + 'D'.repeat(y * 2) + 'K'), h * 2);
const passS = (bg) => { const g = ground(blank(96, 24, bg)); blit(g, PEAK(14), 2, 9); blit(g, PEAK(17), 26, 6); blit(g, PEAK(12), 58, 11); blit(g, PEAK(15), 70, 8); for (let x = 20; x < 80; x += 2) g[22][x] = 'S'; return g; };
done.push(save('strip-belltower-day', towerS('.'), 4), save('strip-belltower-night', stars(towerS('D')), 4));
done.push(save('strip-pass-day', passS('.'), 4), save('strip-pass-night', stars(passS('D')), 4));

// ── M15: 흰마루 (WM-A). 눈은 크림의 가장 밝은 쪽(W), 얼음은 민트(M) ──
const snowGround = (g, top = 20) => { for (let x = 0; x < 96; x++) { const y = top + ((x >> 3) % 2 ? 0 : 1); g[y][x] = 'S'; for (let k = y + 1; k < 23; k++) g[k][x] = 'W'; g[23][x] = 'K'; } return g; };
const SNOWTREE = grid(['...KK', '..KWWK', '.KWWWWK', '.KmmmmK', 'KWWWWWWK', 'KmmMmmmK', '.KKKKKK', '...CC', '...CC', '...CC'], 8);
const SNOWHUT = grid(['......KK', '.....KWWK', '....KWWWWK', '...KWWWWWWK', '..KWWWWWWWWK', '.KKKKKKKKKKKK', '.KSSSSSSSSSSK', '.KSSKKSSSKhSK', '.KSSKKSSSKhSK', '.KKKKKKKKKKKK'], 14);
const DRIFT = grid(['...SSSS', '.SSWWWWSS', 'SWWWWWWWWS'], 10);
const snowS = (bg) => { const g = snowGround(blank(96, 24, bg)); [6, 30, 71].forEach((x, i) => blit(g, SNOWTREE, x, 11 - (i % 2))); [18, 46, 58, 84].forEach((x) => blit(g, DRIFT, x, 18)); for (let x = 40; x < 70; x += 5) g[21][x] = 'S'; return g; };
const ICESPIKE = (h) => grid(Array.from({ length: h }, (_, y) => '.'.repeat(Math.floor((h - 1 - y) / 2)) + 'm' + 'M'.repeat(Math.floor(y / 2) * 2 + (y % 2)) + 'm'), h + 2);
const iceSheet = (g, top, from = 0, to = 96) => { for (let x = from; x < to; x++) { g[top][x] = 'm'; for (let y = top + 1; y < 23; y++) g[y][x] = 'M'; g[23][x] = 'K'; } for (let x = from + 5; x < to - 4; x += 11) { g[top + 2][x] = 'W'; g[top + 2][x + 1] = 'W'; g[top + 3][x + 2] = 'W'; g[top + 2][x + 3] = 'm'; } return g; };
const icelakeS = (bg) => { const g = iceSheet(ground(blank(96, 24, bg)), 17); blit(g, ICESPIKE(9), 10, 8); blit(g, ICESPIKE(12), 40, 5); blit(g, ICESPIKE(7), 66, 10); blit(g, ICESPIKE(10), 80, 7); blit(g, grid(['KKKK', 'KDDDK', 'KDDDDK', 'KKKKKK'], 6), 26, 18); return g; };
const HOLE = grid(['.KKKK', 'KDDDDK', '.KKKK'], 6);
const icepondS = (bg) => { const g = snowGround(blank(96, 24, bg)); iceSheet(g, 19, 34, 78); blit(g, SNOWHUT, 2, 10); blit(g, SNOWHUT, 18, 11); blit(g, SNOWHUT, 80, 10); blit(g, HOLE, 42, 20); blit(g, HOLE, 58, 20); blit(g, grid(['K', 'K', 'K', 'K'], 1), 49, 16); blit(g, grid(['K', 'K', 'K', 'K'], 1), 65, 16); blit(g, grid(['.S', 'S', '.S', 'S'], 2), 9, 5); blit(g, grid(['.S', 'S', '.S', 'S'], 2), 87, 5); return g; };
const ICECASE = (() => { const g = blank(18, 20); for (let y = 0; y < 20; y++) for (let x = 0; x < 18; x++) { const edge = y === 0 || x === 0 || x === 17; g[y][x] = edge ? 'm' : 'M'; } [[3, 3], [13, 6], [4, 12], [14, 15]].forEach(([x, y]) => { g[y][x] = 'W'; g[y + 1][x] = 'W'; }); return g; })();
const icetowerS = (bg) => { const g = snowGround(blank(96, 24, bg)); blit(g, ICECASE, 39, 3); blit(g, TOWER, 42, 6); blit(g, grid(['.KK', 'KDDK', 'KDDK', '.KK'], 4), 46, 8); for (const x of [40, 44, 51, 55]) { g[23 - 20][x] = 'm'; } [38, 47, 57].forEach((x) => { g[2][x] = 'W'; g[1][x] = 'W'; }); blit(g, SNOWHUT, 4, 10); blit(g, SNOWTREE, 74, 11); blit(g, DRIFT, 60, 18); return g; };
done.push(save('strip-snow-day', snowS('.'), 4), save('strip-snow-night', stars(snowS('D')), 4));
done.push(save('strip-icelake-day', icelakeS('.'), 4), save('strip-icelake-night', stars(icelakeS('D')), 4));
done.push(save('strip-icepond-day', icepondS('.'), 4), save('strip-icepond-night', stars(icepondS('D')), 4));
done.push(save('strip-icetower-day', icetowerS('.'), 4), save('strip-icetower-night', stars(icetowerS('D')), 4));

// ── M16: 소금벌 (SB-A). 소금은 크림의 가장 밝은 쪽(W), 그늘은 모래(S) ──
const saltGround = (g, top = 19) => { for (let x = 0; x < 96; x++) { g[top][x] = 'S'; for (let k = top + 1; k < 23; k++) g[k][x] = 'W'; g[23][x] = 'K'; } for (let x = 3; x < 94; x += 7) { const y = top + 1 + (x % 3); const y2 = Math.min(22, y + 1); g[y][x] = 'S'; g[y][x + 1] = 'S'; g[y2][x + 2] = 'S'; g[y2][x - 1] = 'S'; } return g; };
const SALTPILLAR = (h) => grid(Array.from({ length: h }, (_, y) => (y === 0 ? '.KK' : y < 3 ? 'KWWK' : 'KWSWK').padStart(y < 3 ? 4 : 5, '.')), 6);
const saltfloorS = (bg) => { const g = saltGround(blank(96, 24, bg)); blit(g, SALTPILLAR(9), 8, 11); blit(g, SALTPILLAR(6), 34, 14); blit(g, SALTPILLAR(11), 62, 9); blit(g, SALTPILLAR(5), 84, 15); blit(g, grid(['..KK', '.KCCK', 'KCCCCK...K', '.KKKK...KCK', '.......KCK', '........K'], 12), 44, 14); return g; };
const HULL = grid(['...KKKKKKKKKKKK', '..KCCCCCCCCCCCCK', '.KCCcCCCCcCCCCCCK', 'KKKKKKKKKKKKKKKKKK'], 18);
const MAST = (h) => grid(Array.from({ length: h }, (_, y) => (y === 1 ? 'KKKK' : y === 0 ? '.K' : '.C')), 4);
const CROW = grid(['.KK', 'KKKK', '.K'], 4);
const drychannelS = (bg) => { const g = saltGround(blank(96, 24, bg), 20); for (let x = 20; x < 78; x++) { g[20][x] = 'D'; g[21][x] = 'S'; } blit(g, HULL, 6, 16); blit(g, HULL, 40, 17); blit(g, HULL, 70, 16); blit(g, MAST(10), 30, 10); blit(g, MAST(8), 62, 12); blit(g, CROW, 30, 7); blit(g, CROW, 62, 9); blit(g, CROW, 12, 13); return g; };
const SCALE = grid(['....K', '.KKKKKKK', '.K..K..K', 'KKK.K.KKK', 'KhK.K.KhK', '....K', '...KKK'], 9);
const saltmarketS = (bg) => { const g = saltGround(blank(96, 24, bg), 20); blit(g, STALL('C'), 6, 13); blit(g, STALL('h'), 30, 13); blit(g, STALL('m'), 66, 13); blit(g, SCALE, 51, 13); blit(g, grid(['.KKKK', 'KWWWWK', 'KWWWWK', 'KKKKKK'], 6), 22, 17); blit(g, grid(['.KKKK', 'KWWWWK', 'KWWWWK', 'KKKKKK'], 6), 84, 17); return g; };
const DEPOT = (() => { const g = blank(34, 14); for (let y = 0; y < 14; y++) for (let x = 0; x < 34; x++) g[y][x] = y < 3 ? (y === 0 || x === 0 || x === 33 ? 'K' : 'C') : (x === 0 || x === 33 || y === 13 || y === 3 ? 'K' : 'S'); for (let y = 6; y < 13; y++) for (let x = 13; x < 21; x++) g[y][x] = y === 6 || x === 13 || x === 20 ? 'K' : 'C'; [[15, 8], [17, 10], [18, 8]].forEach(([x, y]) => { g[y][x] = 'H'; g[y + 1][x] = 'h'; }); return g; })();
const GUARD = grid(['.KK', '.KK', 'KCCK', 'KCCK', '.KK', '.KK'], 4);
const warehouseS = (bg) => { const g = saltGround(blank(96, 24, bg), 20); blit(g, DEPOT, 31, 7); blit(g, GUARD, 24, 15); blit(g, GUARD, 68, 15); for (const x of [23, 72]) for (let y = 11; y < 21; y++) g[y][x] = 'K'; blit(g, CRATE, 8, 16); blit(g, CRATE, 82, 16); return g; };
done.push(save('strip-saltfloor-day', saltfloorS('.'), 4), save('strip-saltfloor-night', stars(saltfloorS('D')), 4));
done.push(save('strip-drychannel-day', drychannelS('.'), 4), save('strip-drychannel-night', stars(drychannelS('D')), 4));
done.push(save('strip-saltmarket-day', saltmarketS('.'), 4), save('strip-saltmarket-night', stars(saltmarketS('D')), 4));
done.push(save('strip-warehouse-day', warehouseS('.'), 4), save('strip-warehouse-night', stars(warehouseS('D')), 4));

// ── M17: 잿골 (AG-A). 재는 모래(S)와 그 그늘(D), 쇳물과 불티는 꿀(H, h) ──
const ashGround = (g, top = 20) => { for (let x = 0; x < 96; x++) { g[top][x] = 'D'; for (let k = top + 1; k < 23; k++) g[k][x] = 'S'; g[23][x] = 'K'; } for (let x = 4; x < 94; x += 9) { g[top + 1 + (x % 2)][x] = 'W'; g[top + 2][x + 3] = 'D'; } return g; };
const CHIMNEY = (h) => grid([...Array.from({ length: h }, (_, y) => (y === 0 ? 'KKKK' : 'KCCK'))], 4);
const SMOKE = grid(['..SS', '.SSSS', '..SS', '.SS', '..S'], 5);
const kilntownS = (bg) => { const g = ashGround(blank(96, 24, bg)); blit(g, HOUSE('D'), 2, 12); blit(g, HOUSE('S'), 36, 12); blit(g, HOUSE('D'), 70, 12); [[8, 6], [26, 8], [44, 5], [62, 9], [78, 6]].forEach(([x, top]) => { blit(g, CHIMNEY(20 - top), x, top); blit(g, SMOKE, x, Math.max(0, top - 5)); }); blit(g, HOUSE('D'), 2, 12); blit(g, HOUSE('S'), 36, 12); blit(g, HOUSE('D'), 70, 12); for (const x of [14, 30, 52, 66, 88]) g[21][x] = 'W'; return g; };
const HUNGSWORD = grid(['KKKKKKKKK', '....K', '....W', '....W', '....W', '....W', '...KHK', '....C'], 9);
const FOLK = grid(['.KK', '.KK', 'KDDK', 'KDDK', '.KK'], 4);
const arenaS = (bg) => { const g = ashGround(blank(96, 24, bg)); for (let x = 24; x < 72; x++) { g[19][x] = 'K'; g[20][x] = 'c'; g[21][x] = 'c'; g[22][x] = 'K'; } for (let x = 28; x < 68; x += 6) g[20][x] = 'S'; for (let y = 2; y < 19; y++) { g[y][47] = 'K'; g[y][48] = 'C'; } for (let x = 47; x < 52; x++) g[1][x] = 'K'; blit(g, HUNGSWORD, 50, 1); [4, 9, 14, 19, 74, 79, 84, 89].forEach((x, i) => blit(g, FOLK, x, 15 + (i % 2))); return g; };
const STUMP = grid(['.K.K', 'KCCK', 'KCDK', 'KCCK'], 4);
const ashslopeS = (bg) => { const g = blank(96, 24, bg); for (let x = 0; x < 96; x++) { const top = 21 - Math.floor(x / 12); g[top][x] = 'D'; for (let k = top + 1; k < 23; k++) g[k][x] = 'S'; g[23][x] = 'K'; } [[10, 17], [34, 15], [58, 13], [82, 11]].forEach(([x, y]) => blit(g, STUMP, x, y)); [[20, 21], [45, 20], [46, 21], [70, 18], [90, 17], [27, 22]].forEach(([x, y]) => { g[y][x] = 'H'; }); [[6, 22], [52, 19], [76, 17]].forEach(([x, y]) => { g[y][x] = 'W'; }); return g; };
const KILNMOUTH = grid(['...KKKKKK', '..KDDDDDDK', '.KDDKKKKDDK', '.KDKHHHHKDK', 'KDDKHhhHKDDK', 'KDDKHhhHKDDK', 'KKKKHHHHKKKK'], 12);
const moltenbrookS = (bg) => { const g = ashGround(blank(96, 24, bg)); blit(g, PEAK(15), 58, 5); blit(g, KILNMOUTH, 67, 12); for (let x = 6; x < 74; x++) { const y = 20 + ((x >> 3) % 2); g[y][x] = 'H'; g[y + 1][x] = x % 5 === 0 ? 'h' : 'H'; } for (let y = 19; y < 21; y++) { g[y][72] = 'H'; g[y][73] = 'H'; } [[14, 19], [30, 20], [50, 19]].forEach(([x, y]) => { g[y][x] = 'K'; g[y][x + 1] = 'D'; g[y][x + 2] = 'K'; }); return g; };
done.push(save('strip-kilntown-day', kilntownS('.'), 4), save('strip-kilntown-night', stars(kilntownS('D')), 4));
done.push(save('strip-arena-day', arenaS('.'), 4), save('strip-arena-night', stars(arenaS('D')), 4));
done.push(save('strip-ashslope-day', ashslopeS('.'), 4), save('strip-ashslope-night', stars(ashslopeS('D')), 4));
done.push(save('strip-moltenbrook-day', moltenbrookS('.'), 4), save('strip-moltenbrook-night', stars(moltenbrookS('D')), 4));

// ── M18: 안개늪 (AN-A). 물과 이끼는 민트(m, M), 안개는 흰 줄(W), 등불은 꿀(H, h) ──
const marshWater = (g, top = 20) => { for (let x = 0; x < 96; x++) { g[top][x] = 'M'; for (let k = top + 1; k < 23; k++) g[k][x] = 'm'; g[23][x] = 'K'; } for (let x = 3; x < 93; x += 7) { g[top + 1 + (x % 2)][x] = 'W'; g[top + 1 + (x % 2)][x + 1] = 'W'; } return g; };
const mist = (g, rows) => { rows.forEach((y, i) => { for (let x = (i * 5) % 13; x < 90; x += 13) for (let k = 0; k < 6; k++) g[y][x + k] = 'W'; }); return g; };
const LAMPON = grid(['.K', 'KHK', 'KhK', '.K'], 3);
const LAMPOFF = grid(['.K', 'KDK', 'KDK', '.K'], 3);
const PUNT = grid(["K........K", "KCCCCCCCCK", ".KKKKKKKK"], 10);
const floattownS = (bg) => { const g = marshWater(mist(blank(96, 24, bg), [4, 8])); blit(g, HOUSE('M'), 2, 9); blit(g, HOUSE('m'), 38, 9); blit(g, HOUSE('M'), 72, 9); for (const [a, b] of [[23, 38], [59, 72]]) for (let x = a; x < b; x += 2) g[16][x] = 'K'; blit(g, PUNT, 26, 19); blit(g, PUNT, 60, 19); return g; };
const lampbridgeS = (bg) => { const g = marshWater(mist(blank(96, 24, bg), [3, 12])); for (let x = 2; x < 94; x++) { g[17][x] = 'K'; g[18][x] = 'C'; g[19][x] = x % 4 === 0 ? 'K' : g[19][x]; } [6, 20, 34, 48, 62, 76, 90].forEach((x, i) => { for (let y = 9; y < 23; y++) g[y][x] = y < 17 ? 'K' : 'C'; blit(g, i % 2 ? LAMPOFF : LAMPON, x - 1, 5); }); return g; };
const MOUND = grid(['...KKKKK', '.KKMMMMMKK', 'KMMmMMMmMMK', 'KMMMMmMMMMK'], 11);
const mossfieldS = (bg) => { const g = mist(blank(96, 24, bg), [6, 11]); for (let x = 0; x < 96; x++) { const top = 20 - ((x >> 4) % 2); g[top][x] = 'M'; for (let k = top + 1; k < 23; k++) g[k][x] = (x + k) % 6 === 0 ? 'M' : 'm'; g[23][x] = 'K'; } [[6, 15], [30, 16], [52, 15], [78, 16]].forEach(([x, y]) => blit(g, MOUND, x, y)); [[22, 21], [46, 21], [70, 20], [90, 21]].forEach(([x, y]) => { g[y][x] = 'W'; g[y][x + 1] = 'W'; }); for (let k = 0; k < 6; k++) { g[14][20 + k] = 'W'; g[14][62 + k] = 'W'; } return g; };
const TRUNK = (h) => grid([...Array.from({ length: h }, (_, y) => (y === 2 ? 'KKCCK' : y === 5 ? '.KCCKK' : '.KCCK'))], 6);
const sunkenwoodS = (bg) => { const g = marshWater(mist(blank(96, 24, bg), [5, 10]), 17); [[4, 1], [20, 3], [38, 0], [58, 2], [74, 1], [88, 4]].forEach(([x, top]) => blit(g, TRUNK(18 - top), x, top)); for (let k = 0; k < 6; k++) { g[13][10 + k] = 'W'; g[13][44 + k] = 'W'; g[15][64 + k] = 'W'; } blit(g, grid(['.h', 'hHh', '.h'], 3), 49, 12); return g; };
done.push(save('strip-floattown-day', floattownS('.'), 4), save('strip-floattown-night', stars(floattownS('D')), 4));
done.push(save('strip-lampbridge-day', lampbridgeS('.'), 4), save('strip-lampbridge-night', stars(lampbridgeS('D')), 4));
done.push(save('strip-mossfield-day', mossfieldS('.'), 4), save('strip-mossfield-night', stars(mossfieldS('D')), 4));
done.push(save('strip-sunkenwood-day', sunkenwoodS('.'), 4), save('strip-sunkenwood-night', stars(sunkenwoodS('D')), 4));

// ── M19: 잠긴 도성 (JD-A). 물은 민트(M, m), 기와와 청동은 시나몬(C, c), 빛줄기는 흰 줄(W), 종 모양의 것은 꿀(H, h) ──
const ROOF = grid(['......KK', '....KKCCKK', '..KKCCCCCCKK', 'KKCCCCCCCCCCKK', 'KCCcCCCcCCCcCK'], 14);
const seaTop = (g, top) => { for (let x = 0; x < 96; x++) { g[top][x] = 'M'; for (let k = top + 1; k < 23; k++) g[k][x] = 'm'; g[23][x] = 'K'; } for (let x = 2; x < 94; x += 9) { g[top + 1][x] = 'W'; g[top + 1][x + 1] = 'W'; g[top + 1][x + 2] = 'W'; } return g; };
const rooftownS = (bg) => { const g = seaTop(blank(96, 24, bg), 15); [[4, 11], [30, 10], [58, 11], [80, 10]].forEach(([x, y]) => blit(g, ROOF, x, y)); for (const [a, b] of [[18, 30], [44, 58], [72, 80]]) for (let x = a; x < b; x++) { g[14][x] = 'K'; if (x % 3 === 0) g[15][x] = 'K'; } blit(g, PUNT, 46, 12); for (const x of [36, 64]) for (let y = 7; y < 11; y++) g[y][x] = 'K'; return g; };
const BELLTOP = grid(['....KKKKKKKK', '..KKCCCCCCCCKK', 'KKCCCCCCCCCCCCKK', '.KKKKKKKKKKKKKK', '..K....HH....K', '..K...H..H...K', '..K...H..H...K', '..K....HH....K', '..KKKKKKKKKKKK', '..KSSSSSSSSSSK', '..KSSKKSSKKSSK'], 16);
const belltopS = (bg) => { const g = seaTop(blank(96, 24, bg), 16); blit(g, BELLTOP, 40, 5); blit(g, ROOF, 6, 12); blit(g, ROOF, 74, 12); for (let x = 20; x < 40; x++) { g[15][x] = 'K'; } for (let x = 56; x < 74; x++) { g[15][x] = 'K'; } return g; };
const shafts = (g) => { for (const x0 of [10, 34, 60, 84]) for (let k = 0; k < 9; k++) { const x = x0 + Math.floor(k / 2), y = 2 + k; if (g[y] && g[y][x] !== undefined) g[y][x] = 'W'; } return g; };
const weed = (g, x, h) => { for (let k = 0; k < h; k++) g[22 - k][x + (k % 2)] = 'M'; return g; };
const under = (bg) => { const g = blank(96, 24, bg === 'D' ? 'D' : 'm'); for (let x = 0; x < 96; x++) { g[0][x] = 'M'; g[1][x] = x % 6 < 3 ? 'M' : g[1][x]; g[23][x] = 'K'; } return shafts(g); };
const sunkenstreetS = (bg) => { const g = under(bg); blit(g, HOUSE('C'), 2, 13); blit(g, HOUSE('c'), 37, 13); blit(g, HOUSE('C'), 72, 13); [26, 30, 62, 66, 94].forEach((x, i) => weed(g, x, 4 + (i % 3))); blit(g, grid(['KKKKKK', 'KhhhhK', 'KKKKKK'], 6), 28, 9); g[8][30] = 'K'; g[8][31] = 'K'; return g; };
const JELLY = grid(['.hh', 'hHHh', 'hHHh', 'h..h'], 4);
const PGATE = grid(['......KKKKKKKKKKKKKKKK', '...KKKCCCCCCCCCCCCCCCCKKK', 'KKKCCCCCCCCCCCCCCCCCCCCCCKKK', '.KKKKKKKKKKKKKKKKKKKKKKKKKK', '..KSSK....KSSSSK....KSSK', '..KSSK....KSSSSK....KSSK', '..KSSK....KSSSSK....KSSK', '..KSSK....KSSSSK....KSSK', '..KSSK....KSSSSK....KSSK', '.KKKKKKKKKKKKKKKKKKKKKKKKKK'], 28);
const palaceyardS = (bg) => { const g = under(bg); blit(g, PGATE, 34, 9); for (let k = 0; k < 4; k++) for (let x = 30 - k * 2; x < 66 + k * 2; x++) g[19 + k][x] = k === 3 ? 'K' : 'S'; [[8, 6], [20, 12], [70, 5], [84, 11]].forEach(([x, y]) => blit(g, JELLY, x, y)); [4, 14, 78, 90].forEach((x, i) => weed(g, x, 4 + (i % 3))); return g; };
done.push(save('strip-rooftown-day', rooftownS('.'), 4), save('strip-rooftown-night', stars(rooftownS('D')), 4));
done.push(save('strip-belltop-day', belltopS('.'), 4), save('strip-belltop-night', stars(belltopS('D')), 4));
done.push(save('strip-sunkenstreet-day', sunkenstreetS('.'), 4), save('strip-sunkenstreet-night', sunkenstreetS('D'), 4));
done.push(save('strip-palaceyard-day', palaceyardS('.'), 4), save('strip-palaceyard-night', palaceyardS('D'), 4));

// ── M20: 구름다리 (GD-A). 바위는 모래(S), 다리 널과 깃대는 시나몬(C), 구름은 흰 줄(W), 금빛 지붕은 꿀(H, h), 깃발은 민트(M) ──
const cloudRow = (g, y, xs) => { for (const [a, b] of xs) for (let x = a; x < b; x++) { if (g[y] && g[y][x] !== undefined) g[y][x] = 'W'; } return g; };
const seaOfCloud = (g, top) => { cloudRow(g, top, [[0, 14], [22, 40], [50, 70], [80, 96]]); cloudRow(g, top + 1, [[0, 96]]); for (let y = top + 2; y < 24; y++) cloudRow(g, y, [[0, 96]]); for (let x = 4; x < 96; x += 11) { g[top + 2][x] = 'S'; g[top + 2][x + 1] = 'S'; g[top + 2][x + 2] = 'S'; } return g; };
const crag = (g, x0, w, top, flip) => { for (let y = top; y < 24; y++) { const half = Math.min(w, 2 + Math.floor((y - top) * 0.9)); for (let k = 0; k < half; k++) { const x = flip ? x0 - k : x0 + k; if (g[y] && g[y][x] !== undefined) g[y][x] = k === half - 1 ? 'K' : (x + y) % 5 === 0 ? 'c' : 'S'; } } return g; };
const GOLDROOF = grid(['....KK', '..KKHHKK', 'KKHHhHHHKK', '.KKKKKKKK', '..KSSSSK', '..KSKKSK'], 10);
const WFLAG = (ch) => grid(['K' + ch + ch + ch, 'K' + ch + ch, 'K', 'K', 'K', 'K'], 4);
const bridgegateS = (bg) => { const g = seaOfCloud(blank(96, 24, bg), 19); crag(g, 0, 20, 4, false); crag(g, 95, 22, 2, true); for (let x = 16; x < 80; x++) { const sag = Math.round(2 * Math.sin(((x - 16) / 64) * Math.PI)); g[12 + sag][x] = 'K'; g[13 + sag][x] = 'C'; if (x % 6 === 0) { g[11 + sag][x] = 'K'; g[10 + sag][x] = 'K'; } g[9 + sag][x] = x % 2 ? 'K' : g[9 + sag][x]; } blit(g, GOLDROOF, 82, 3); return g; };
const cliffroadS = (bg) => { const g = seaOfCloud(blank(96, 24, bg), 18); for (let x = 0; x < 96; x++) { const top = 3 + ((x >> 3) % 3); for (let y = top; y < 14; y++) g[y][x] = y === top ? 'K' : (x * 3 + y) % 7 === 0 ? 'c' : 'S'; g[14][x] = 'K'; g[15][x] = 'C'; g[16][x] = x % 5 === 0 ? 'K' : g[16][x]; } [14, 44, 74].forEach((x, i) => blit(g, WFLAG(i === 1 ? 'H' : 'M'), x, 8)); return g; };
const MONK = grid(['.KK', 'KSSK', 'KSSK', 'KSSSK', 'KKKKK'], 5);
const BIGROOF = grid(['..........KKKKKKKK', '......KKKKHHHHHHHHKKKK', '..KKKKHHHHhHHHHhHHHHHHKKKK', 'KKHHHHHHHHHHHHHHHHHHHHHHHHKK', '.KKKKKKKKKKKKKKKKKKKKKKKKKK', '..KSSK..KSSK.KHHK.KSSK..KSSK', '..KSSK..KSSK.KHHK.KSSK..KSSK', '..KSSK..KSSK.KHHK.KSSK..KSSK', '..KSSK..KSSK.KHHK.KSSK..KSSK', '.KKKKKKKKKKKKKKKKKKKKKKKKKK'], 28);
const templeyardS = (bg) => { const g = blank(96, 24, bg); for (let x = 0; x < 96; x++) { g[20][x] = 'K'; for (let y = 21; y < 24; y++) g[y][x] = (x + y) % 8 === 0 ? 'K' : 'S'; } blit(g, BIGROOF, 34, 10); [4, 14, 24, 68, 78, 88].forEach((x) => blit(g, MONK, x, 15)); cloudRow(g, 5, [[2, 16], [70, 90]]); cloudRow(g, 6, [[0, 22], [64, 96]]); return g; };
done.push(save('strip-bridgegate-day', bridgegateS('.'), 4), save('strip-bridgegate-night', stars(bridgegateS('D')), 4));
done.push(save('strip-cliffroad-day', cliffroadS('.'), 4), save('strip-cliffroad-night', stars(cliffroadS('D')), 4));
done.push(save('strip-templeyard-day', templeyardS('.'), 4), save('strip-templeyard-night', stars(templeyardS('D')), 4));

// ── M21: 별못 (BM-A). 못물은 민트(M)와 흰 줄(W), 집은 모래(S)와 시나몬 지붕(C), 열린 문의 불빛과 별 조각은 꿀(H, h), 풀은 민트(m) ──
const pondWater = (g, x0, x1, top, bot) => { for (let y = top; y <= bot; y++) { const inset = Math.round(Math.abs(y - (top + bot) / 2) * 1.6); for (let x = x0 + inset; x < x1 - inset; x++) if (g[y] && g[y][x] !== undefined) g[y][x] = (x + y * 3) % 9 === 0 ? 'W' : 'M'; } return g; };
const OPENHOUSE = grid(['...KKKKKK', '..KCCCCCCK', '.KCCCCCCCCK', 'KKKKKKKKKKKK', '.KSSSSSSSSK', '.KSSKhhKSSK', '.KSSKhhKSSK', '.KKKKhhKKKK'], 12);
const pondGround = (g, y0) => { for (let x = 0; x < 96; x++) { g[y0][x] = 'K'; for (let y = y0 + 1; y < 24; y++) g[y][x] = (x + y) % 7 === 0 ? 'c' : 'S'; } return g; };
const echogateS = (bg) => { const g = pondGround(blank(96, 24, bg), 20); pondWater(g, 26, 70, 13, 22); [2, 14, 72, 84].forEach((x) => blit(g, OPENHOUSE, x, 12)); [30, 46, 60].forEach((x) => blit(g, OPENHOUSE, x, 4)); return g; };
const PREED = grid(['.m', '.m', 'mm', '.m', '.m', '.m'], 2);
const MOTH = grid(['h.h', '.H.'], 3);
const pondsideS = (bg) => { const g = pondGround(blank(96, 24, bg), 21); pondWater(g, 4, 92, 10, 23); for (let x = 2; x < 94; x += 7) blit(g, PREED, x, 15 + (x % 3)); [[12, 6], [33, 4], [51, 8], [70, 5], [86, 7]].forEach(([x, y]) => blit(g, MOTH, x, y)); return g; };
const STARSHARD = grid(['.H', 'HhH', '.H'], 3);
const starfieldS = (bg) => { const g = pondGround(blank(96, 24, bg), 18); for (let x = 0; x < 94; x += 3) { if (x > 36 && x < 60) continue; g[17][x] = 'm'; g[16][x + 1] = 'm'; } for (let x = 38; x < 58; x++) { const d = Math.round(4 * Math.sin(((x - 38) / 20) * Math.PI)); for (let y = 18; y <= 18 + d; y++) g[y][x] = y === 18 + d ? 'K' : 'D'; } [[8, 12], [24, 14], [66, 13], [82, 11], [47, 19]].forEach(([x, y]) => blit(g, STARSHARD, x, y)); return g; };
done.push(save('strip-echogate-day', echogateS('.'), 4), save('strip-echogate-night', stars(echogateS('D')), 4));
done.push(save('strip-pondside-day', pondsideS('.'), 4), save('strip-pondside-night', stars(pondsideS('D')), 4));
done.push(save('strip-starfield-day', starfieldS('.'), 4), save('strip-starfield-night', stars(starfieldS('D')), 4));


// ── 처음 모루 (CM-A, M22): 모루 아래 야영지, 모루 앞, 쇳물 골 ──
const TENT = (ch) => grid(['....K....', '...K' + ch + 'K...', '..K' + ch + ch + ch + 'K..', '.K' + ch + ch + 'K' + ch + ch + 'K.', 'K' + ch + ch + ch + 'K' + ch + ch + ch + 'K'], 9);
const CAMPFIRE = grid(['.H.', 'HhH', 'KKK'], 3);
const rockGround = (g, top = 20) => { for (let x = 0; x < 96; x++) { g[top][x] = 'K'; for (let y = top + 1; y < 24; y++) g[y][x] = (x * 3 + y) % 5 === 0 ? 'c' : 'C'; } return g; };
const anvilcampS = (bg) => { const g = rockGround(blank(96, 24, bg)); crag(g, 95, 26, 1, true); [[3, 'c'], [14, 'C'], [25, 'c'], [36, 'C'], [52, 'c'], [63, 'C'], [74, 'c']].forEach(([x, ch]) => blit(g, TENT(ch), x, 15)); blit(g, CAMPFIRE, 46, 17); return g; };
const ANVILBIG = grid(['.KKKKKKKKKKK.', 'KccccccccccCK', '.KKKccccKKKK.', '....KccK.....', '....KccK.....', '...KccccK....', '..KKKKKKKK...'], 13);
const HAMMERLY = grid(['KKK.....', 'KcKKKKKK', 'KKK.....'], 8);
const anvilfrontS = (bg) => { const g = seaOfCloud(blank(96, 24, bg), 20); for (let x = 12; x < 84; x++) { g[16][x] = 'K'; for (let y = 17; y < 24; y++) g[y][x] = (x + y * 2) % 6 === 0 ? 'c' : 'C'; } blit(g, ANVILBIG, 41, 9); blit(g, HAMMERLY, 58, 13); return g; };
const meltgullyS = (bg) => { const g = rockGround(blank(96, 24, bg)); crag(g, 0, 18, 3, false); crag(g, 95, 20, 5, true); for (let x = 12; x < 84; x++) { g[20][x] = x % 7 < 4 ? 'H' : 'h'; g[21][x] = x % 5 < 2 ? 'H' : 'h'; if (x % 11 === 3) g[19][x] = 'h'; } return g; };
done.push(save('strip-anvilcamp-day', anvilcampS('.'), 4), save('strip-anvilcamp-night', stars(anvilcampS('D')), 4));
done.push(save('strip-anvilfront-day', anvilfrontS('.'), 4), save('strip-anvilfront-night', stars(anvilfrontS('D')), 4));
done.push(save('strip-meltgully-day', meltgullyS('.'), 4), save('strip-meltgully-night', stars(meltgullyS('D')), 4));
console.log(done.join('\n'));
console.log('모두 ' + done.length + '장');
