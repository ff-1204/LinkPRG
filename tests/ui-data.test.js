// 화면이 쓰는 값들 가운데 화면 없이 확인할 수 있는 것.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HELP } from '../src/ui/help.js';
import { tuneOf } from '../src/ui/sound.js';
import { DEFAULTS, loadSettings, saveSettings, SETTING_GROUPS } from '../src/ui/settings.js';
import { derived, formula } from '../src/core/derived.js';
import { createGame, dispatch, DING_LEVELS } from '../src/core/game.js';
import { ACTION_LINES } from '../src/data/lines.js';
import { existsSync } from 'node:fs';
import { PLACES } from '../src/data/places.js';

test('도움말 갈래는 열이고, 히든은 말하지 않는다 (H2-1, H2-3)', () => {
  assert.equal(HELP.length, 10);
  assert.equal(HELP.some((t) => t.id === 'hidden'), false);
  const all = JSON.stringify(HELP);
  for (const word of ['300', '인내', '삼백', '히든']) assert.equal(all.includes(word), false, `도움말이 "${word}"를 말하면 안 된다`);
});

test('띠링 소리는 귀한 정도 다섯마다 다르다 (M1-10)', () => {
  const tunes = [1, 2, 3, 4, 5].map((l) => tuneOf(l).join(','));
  assert.equal(new Set(tunes).size, 5);
  assert.equal(DING_LEVELS.slice(1).length, 5);
});

test('설정은 남고, 모르는 값은 기본값으로 채워진다 (G4-3, G4-4)', () => {
  const m = new Map();
  const st = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
  assert.deepEqual(loadSettings(st), DEFAULTS);
  saveSettings(st, { ...DEFAULTS, fs: 3, chatter: 'high' });
  assert.equal(loadSettings(st).fs, 3);
  m.set('ttiring.settings', 'broken');
  assert.deepEqual(loadSettings(st), DEFAULTS);
  const keys = SETTING_GROUPS.flatMap((g) => g.rows.map((r) => r.key));
  for (const k of keys) assert.ok(k in DEFAULTS, k);
  assert.deepEqual(SETTING_GROUPS.map((g) => g.title), ['보기', '소리', '게임']);
});

test('계산된 값을 누르면 셈이 보인다 (G2-2)', () => {
  const s = createGame({ name: '서진', origin: 'smithboy', spent: { str: 1 }, seed: 'd' });
  dispatch(s, { type: 'move', to: 'training' });
  for (let i = 0; i < 300; i++) dispatch(s, { type: 'act', id: 'strike' });
  const attack = derived(s).find((d) => d.id === 'attack');
  // 삼백 번을 치면 배가 고파져서 벌이 붙는다. 셈에 그 줄까지 보인다. 치는 사이 힘이 드물게 오른다 (Z61)
  const str = s.stats.str;
  assert.ok(str > 12, '삼백 번 치면 힘이 한 번은 오른다');
  const hungry = -attack.parts.find((x) => x.label.startsWith('굶주림')).value; // 벌은 공격력에 비례한다
  assert.ok(hungry > 0);
  assert.equal(attack.value, str + 9 - hungry);
  assert.equal(formula(attack), `힘 ${str} + 무기 6 + 치기 숙련 3 − 굶주림 ${hungry}`);
  dispatch(s, { type: 'use', index: s.bag.findIndex((x) => x.id === 'riceball') });
  const fed = derived(s).find((d) => d.id === 'attack');
  assert.equal(fed.value, str + 9);
  assert.equal(formula(fed), `힘 ${str} + 무기 6 + 치기 숙련 3`);
  assert.equal(derived(s).find((d) => d.id === 'maxHp').value, 100);
  assert.equal(derived(s).find((d) => d.id === 'carry').value, 30 + Math.floor(str * 2.5));
});

test('남은 점수는 기본 스탯에만 쓸 수 있다 (Q6-3)', () => {
  const s = createGame({ name: '서진', origin: 'smithboy', spent: {}, seed: 'p' });
  assert.equal(s.unspent, 5);
  dispatch(s, { type: 'spend', stat: 'agi' });
  assert.deepEqual([s.stats.agi, s.unspent], [10, 4]);
  assert.throws(() => dispatch(s, { type: 'spend', stat: 'endure' }), /올릴 수 없는/);
});

test('글과 그림 파일이 모두 있다', () => {
  for (const [key, list] of Object.entries(ACTION_LINES)) assert.ok(list.length >= 3, `${key} 글이 셋 이상`);
  const names = ['scarecrow-0', 'scarecrow-1', 'scarecrow-2', 'scarecrow-3'];
  for (const p of Object.values(PLACES)) names.push(p.strip.day, p.strip.night);
  for (const n of names) assert.ok(existsSync(new URL(`../art/pixel/out/${n}.png`, import.meta.url)), `${n}.png`);
});

test('기본 스탯은 기본 + 장비 + 추가로 나뉘어 보인다 (Z103). 0인 몫은 글에서 빠진다', async () => {
  const { statParts } = await import('../src/core/derived.js');
  const s = createGame({ name: '셈', origin: 'smithboy', spent: { str: 1 }, seed: 'parts' });
  const str = s.stats.str;
  assert.deepEqual(statParts(s, 'str'), { total: str, base: str, gear: 0, extra: 0, text: `기본 ${str}` });
  s.stats.str += 4; s.toilGained.str = 3; s.toughGained.str = 1;
  assert.deepEqual(statParts(s, 'str'), { total: str + 4, base: str, gear: 0, extra: 4, text: `기본 ${str} + 추가 4` });
  for (const k of ['str', 'agi', 'con', 'wis']) { const p = statParts(s, k); assert.equal(p.base + p.gear + p.extra, s.stats[k]); }
});
