// 여정 (M6-9): 가을 2~8단계와 도현 2·3단계.
// 나무 줍기 → 토끼 깎기 → 걸작 → 세우기 → 요리 → 예술 → 돌토끼 → 함께 전투, 그리고 미루 영입.
import { passPhase, talkTo } from './_time.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame, dispatch, slotsNow, enemyView, statueOf } from '../src/core/game.js';
import { addItem, countOf, previewEquip } from '../src/core/inventory.js';
import { worksView } from '../src/core/sculpt.js';
import { cookMenu } from '../src/core/cook.js';
import { buffOf, foodBuff } from '../src/core/buffs.js';
import { partyView } from '../src/core/party.js';
import { fameOf, bondOf } from '../src/core/social.js';
import { valueOf } from '../src/core/derived.js';
import { CUTS } from '../src/data/works.js';

const go = (s, to) => { if (s.place !== to) dispatch(s, { type: 'move', to }); };
const feed = (s) => { s.full = 80; };
function fight(s) { let n = 0; while (s.battle && n++ < 300) dispatch(s, { type: 'battle', choice: enemyView(s).next.kind === 'charge' ? 'defend' : 'attack' }); }
function travel(s, to) {
  let n = 0;
  while (s.place !== to && n++ < 30) { if (s.battle) fight(s); else if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id }); else if (s.place === 'temple') go(s, 'plaza'); else if (to === 'plaza' && !['forest', 'river', 'mine', 'ruins'].includes(s.place)) go(s, 'plaza'); else dispatch(s, { type: 'travel', to }); }
  fight(s);
  assert.equal(s.place, to);
}
/** 숲에서 한 번에 하나씩: 싸움은 예고를 읽고, 기척은 돌아가고, 사건은 마지막 선택지. */
function forestStep(s, act) {
  if (s.battle) return fight(s);
  if (s.choice) return void dispatch(s, { type: 'choose', id: s.choice.kind === 'sense' ? 'leave' : slotsNow(s).at(-1).action.id });
  if (s.place !== 'forest') return travel(s, 'forest');
  dispatch(s, { type: 'act', id: act });
}

test('가을 2~8: 나무를 주워 토끼를 깎고, 걸작을 세우고, 붕어를 굽고, 돌토끼와 함께 싸운다', () => {
  const s = createGame({ name: '가을', origin: 'farmer', spent: { con: 3, agi: 2 }, seed: 'gaeul-3' });
  go(s, 'training');
  s.level = 6; s.stats.str += 6; s.stats.con += 8; s.hp = valueOf(s, 'maxHp'); // 숲을 다닐 만큼 큰 뒤라고 친다
  s.job = null; s.jobAsked = true;

  // 2단계: 서쪽 숲에서 나무를 줍고, 토끼를 본다
  travel(s, 'forest');
  let n = 0;
  while ((countOf(s, 'oakbranch') < 8 || !s.dex.animals.rabbit) && n++ < 1500) { forestStep(s, n % 3 === 0 ? 'explore' : 'gather'); feed(s); s.hp = valueOf(s, 'maxHp'); }
  assert.ok(countOf(s, 'oakbranch') >= 8, `참나무 가지 ${countOf(s, 'oakbranch')}`);
  assert.ok(s.dex.animals.rabbit, '숲에서 토끼를 보았다');
  travel(s, 'plaza');

  // 3단계: 주제 "토끼"를 골라 칼질 마흔 번
  let presses = 0;
  const carve = () => {
    if (countOf(s, 'oakbranch') < 4) addItem(s, 'oakbranch', 40); // 나무는 더 주워 왔다고 친다
    if (!s.bag.some((x) => x.id === 'chisel' && x.dur > 40)) addItem(s, 'chisel'); // 조각칼은 대장간에서 사 왔다고 친다
    s.tired = 0; // 밤마다 잤다고 친다
    if (s.place === 'plaza') s.place = 'artguild'; dispatch(s, { type: 'sculpt', subject: 'rabbit' });
    let ev = [];
    while (s.sculpt) { ev = dispatch(s, { type: 'cut' }); presses++; feed(s); }
    return ev.find((e) => e.type === 'sculpt' && e.phase === 'done');
  };
  const first = carve();
  assert.equal(presses, CUTS);
  assert.ok(s.skills.sculpting.uses >= CUTS || s.skills.sculpting.grade >= 0);
  assert.ok(first.grade >= 0);

  // 4단계: 몇 개 더 깎자 걸작이 나온다. 감상하면 하루 동안 버프
  let master = first.grade >= 3 ? first : null, made = 1, dingSeen = null;
  while (!master && made < 400) {
    const before = s.dings.length;
    const d = carve(); made++;
    if (d.grade >= 3) { master = d; dingSeen = s.dings.slice(before).find((x) => x.kind === 'masterwork'); }
    for (const w of worksView(s)) if (w.held && w.grade < 3 && s.works.filter((x) => x.where === 'bag').length > 3) dispatch(s, { type: 'work', op: 'sell', no: w.no });
    if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id });
  }
  assert.ok(master, `걸작이 나온다 (작품 ${made}점)`);
  assert.equal(presses, made * CUTS, '모든 작품은 마흔 번씩 손으로 깎았다');
  if (dingSeen) assert.ok(dingSeen.title.includes('완성되었습니다'));
  dispatch(s, { type: 'work', op: 'admire', no: master.no });
  assert.ok(buffOf(s), '감상 버프가 붙었다');

  // 5단계: 광장의 빈 받침대에 세운다. 다음 날 명성이 오른다
  const fame = fameOf(s);
  dispatch(s, { type: 'move', to: 'plaza' }); // 예술협회에서 깎고, 광장으로 나가 세운다 (Z80)
  dispatch(s, { type: 'work', op: 'place', no: master.no });
  assert.ok(statueOf(s).name.includes('토끼상'));
  for (let i = 0; i < 3; i++) { passPhase(s); feed(s); }
  assert.ok(fameOf(s) >= fame + 8);

  // 6단계: 강가 모닥불에서 붕어와 소금을 굽는다
  go(s, 'kitchen'); // 소금은 공용주방에서 판다 (Z84)
  s.silver = Math.max(s.silver, 10);
  dispatch(s, { type: 'buy', id: 'salt' });
  travel(s, 'river');
  n = 0;
  while (countOf(s, 'crucian') < 1 && n++ < 200) { if (s.battle) fight(s); else if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id }); else dispatch(s, { type: 'act', id: 'fish' }); feed(s); }
  s.full = 30;
  const hp = valueOf(s, 'maxHp');
  dispatch(s, { type: 'craft', recipe: 'cook_saltfish' }); // 요리 목록에서 골라 젓는다 (Z93)
  while (s.craft) { s.tired = 0; dispatch(s, { type: 'hammer' }); }
  assert.ok(s.dex.dishes.saltfish);
  assert.ok(s.full > 30);
  assert.equal(foodBuff(s).name, '든든한 속');
  assert.ok(valueOf(s, 'maxHp') >= hp + 15 - 10, '체력 버프가 붙는다(감상 버프가 그사이 끝났을 수 있다)');

  // 7단계: 작품 열 개에 예술이 생기고, 토끼상에 생명을 불어넣는다
  travel(s, 'plaza');
  while (made < 10) { carve(); made++; }
  assert.ok(s.hidden.art.value >= 1);
  let pick = worksView(s).find((w) => w.held && w.canAlive);
  n = 0;
  while (!pick && n++ < 50) { carve(); made++; pick = worksView(s).find((w) => w.held && w.canAlive); }
  dispatch(s, { type: 'work', op: 'alive', no: pick.no });
  assert.equal(partyView(s)[0].name, '돌토끼');

  // 8단계: 방침을 "나를 먼저"로, 앞줄에 두고 숲에서 함께 싸운다
  dispatch(s, { type: 'party', op: 'plan', id: 'stonerabbit', plan: 'mefirst' });
  assert.equal(partyView(s)[0].rowName, '앞줄');
  travel(s, 'forest');
  let blocked = 0, wins = 0;
  n = 0;
  while ((blocked < 1 || wins < 1) && n++ < 3000) {
    if (s.battle) { const ev = dispatch(s, { type: 'battle', choice: enemyView(s).next.kind === 'charge' ? 'defend' : 'attack' }); blocked += ev.filter((e) => e.type === 'line' && /앞을 막아섰다/.test(e.line.text)).length; wins += ev.filter((e) => e.type === 'battle' && e.phase === 'win').length; }
    else forestStep(s, 'explore');
    feed(s); s.hp = Math.max(s.hp, 60);
    if (s.choice?.kind === 'sense') dispatch(s, { type: 'choose', id: 'pounce' });
  }
  assert.ok(blocked >= 1, '돌토끼가 대신 맞아 준 적이 있다');
  assert.ok(wins >= 1, '함께 이겼다');
  assert.equal(s.party.length, 1, '굶기지 않았으니 떠나지 않았다');
});

test('도현 2·3: 단골이 된 미루에게 같이 가자고 청하고 방침을 정한다. 방패는 차기 전에 얼마나 오르는지 본다', () => {
  const s = createGame({ name: '도현', origin: 'smithboy', spent: { str: 3, con: 2 }, seed: 'dohyun-2' });
  s.level = 5; s.hp = valueOf(s, 'maxHp');
  dispatch(s, { type: 'career', op: 'choose', id: 'warrior' });
  go(s, 'tavern');
  dispatch(s, { type: 'greet', npc: 'miru' });
  assert.throws(() => dispatch(s, { type: 'party', op: 'ask', npc: 'miru' }), /단골/);
  // 날마다 이야기를 듣고 산열매를 건넨다. 선물은 하루 한 번
  let day = 0;
  while (bondOf(s, 'miru') < 2 && day++ < 20) {
    talkTo(s, 'miru');
    addItem(s, 'berry', 1); // 숲에서 따 온 것이라고 친다
    dispatch(s, { type: 'gift', npc: 'miru', index: s.bag.findIndex((x) => x.id === 'berry') });
    if (s.choice) dispatch(s, { type: 'choose', id: slotsNow(s).at(-1).action.id });
    for (let i = 0; i < 3 && bondOf(s, 'miru') < 2; i++) passPhase(s);
    s.full = 80;
  }
  assert.ok(day <= 4, `단골까지 ${day}일`);
  dispatch(s, { type: 'party', op: 'ask', npc: 'miru' });
  const m = partyView(s)[0];
  assert.equal(m.name, '미루');
  assert.equal(m.rowName, '뒷줄');
  dispatch(s, { type: 'party', op: 'plan', id: 'miru', plan: 'half' });
  assert.equal(partyView(s)[0].plan, 'half');
  // 3단계: 낡은 방패를 차기 전에 방어력이 얼마나 오르는지 본다
  const i = s.bag.findIndex((x) => x.id === 'oldshield');
  const pv = previewEquip(s, i);
  assert.deepEqual(pv.defense, [0, 4]);
  const def = valueOf(s, 'defense');
  dispatch(s, { type: 'equip', index: i });
  assert.equal(valueOf(s, 'defense'), def + 4);
});
