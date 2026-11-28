// 직업과 이어진 출신과 인연 (Z120)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, dispatch } from '../src/core/game.js';
import { rollDice, ORIGINS, ORIGIN_GRADES, GRADE_BASE, dealOrigins, originById } from '../src/data/origins.js';
import { gainXp, xpToNext } from '../src/core/level.js';
import { skillsNow } from '../src/core/jobs.js';
import { mainParts, bondFx, priestOpen } from '../src/core/statplan.js';
import { valueOf } from '../src/core/derived.js';
import { healOf } from '../src/core/battle.js';
import { itemDef } from '../src/data/items.js';

const make = (origin, seed = 'b') => createGame({ name: '인연', origin, rolled: rollDice('same'), seed });
const toLevel5 = (s) => { while (s.level < 5) gainXp(s, xpToNext(s.level)); };
const choose = (s, job) => { toLevel5(s); dispatch(s, { type: 'career', op: 'choose', id: job }); };

test('인연은 이어진 직업을 골랐을 때만 열린다', () => {
  const s = make('emberkeeper');
  toLevel5(s);
  assert.equal(bondFx(s), null);
  dispatch(s, { type: 'career', op: 'choose', id: 'warrior' });
  assert.equal(bondFx(s), null, '다른 직업이면 없다');
  const m = make('emberkeeper', 'b2');
  choose(m, 'mage');
  assert.ok(bondFx(m));
  // 불씨와 얼음 못이 처음부터 열린다
  assert.deepEqual(skillsNow(m).filter((x) => x.open).map((x) => x.id), ['ember', 'frost']);
});

test('스킬에 얹히는 인연: 마나, 급소, 약하게, 감싸기, 막기, 치유', () => {
  const at = (origin, job, id) => { const s = make(origin, origin); if (job === 'priest') s.flags.fastPrayed = true; choose(s, job); return skillsNow(s).find((x) => x.id === id); };
  assert.equal(at('whitesnow', 'archer', 'aim').mp, 2);
  assert.equal(at('shadowking', 'rogue', 'smoke').mp, 3);
  assert.equal(at('archivist', 'mage', 'bolt').mp, 10);
  assert.ok(Math.abs(at('falconer', 'archer', 'twin').crit - 0.1) < 1e-9);
  assert.equal(at('mercboy', 'warrior', 'roar').weaken.cut, 0.4);
  assert.equal(at('mistreader', 'mage', 'veil').ward.turns, 4);
  assert.equal(at('guide', 'priest', 'bless').ward.turns, 5);
  assert.ok(Math.abs(at('squire', 'warrior', 'shieldup').guard - 0.8) < 1e-9);
  assert.ok(Math.abs(at('miraclekid', 'priest', 'lay').heal - 3.6) < 1e-9);
  assert.equal(at('apothecary', 'priest', 'wash').heal, 2);
});

test('방패잡이의 후예: 전사면 힘 10마다 +3%', () => {
  const s = make('shieldheir');
  choose(s, 'warrior');
  s.stats.str = 40;
  assert.equal(mainParts(s)[0].pct, 12);
});

test('기적을 본 아이는 드문 운을 안고 태어나 레벨 5에 바로 사제를 고를 수 있다 (굶으며 기도하지 않아도, Z131)', () => {
  const s = make('miraclekid');
  assert.equal(priestOpen(s), true);
  choose(s, 'priest');
  assert.equal(s.job, 'priest');
});

test('출신의 덤: 생명력·마나·무게, 뒷골목, 용병 삯, 회복', () => {
  const plain = make('farmer');
  assert.equal(valueOf(make('minewatch'), 'maxHp') - valueOf(plain, 'maxHp'), 20 + 3 * 5 - 2 * 5);
  assert.equal(valueOf(make('archivist'), 'maxMp'), valueOf(plain, 'maxMp') + 10 + 3 * 3);
  assert.equal(make('shadowking').factions.alley, 10);
  const herb = itemDef('herb');
  const max = 100;
  assert.ok(healOf(make('apothecary'), herb, max) > healOf(plain, herb, max));
  assert.ok(healOf(make('midwife'), herb, max) > healOf(plain, herb, max));
});

test('출신이 늘어도 등급마다 나오는 확률은 처음과 같다', () => {
  const count = [0, 0, 0, 0, 0];
  const N = 4000;
  for (let i = 0; i < N; i++) for (const id of dealOrigins(`z120|${i}`, 1)) count[originById(id).grade]++;
  const total = GRADE_BASE.reduce((a, n, g) => a + n * ORIGIN_GRADES[g].weight, 0);
  const want = GRADE_BASE.map((n, g) => (n * ORIGIN_GRADES[g].weight) / total);
  for (let g = 0; g < 5; g++) assert.ok(Math.abs(count[g] / N - want[g]) < 0.03, `등급 ${g}: ${count[g] / N} / ${want[g]}`);
  assert.equal(ORIGINS.length, 54);
});
