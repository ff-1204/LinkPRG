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

console.log(done.join('\n'));
console.log('모두 ' + done.length + '장');
