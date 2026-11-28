// 숨과 짝, 호위받는 채집, 임금의 하사품 (JD-B, JD-C, JD-D): 잠긴 도성의 규칙.
// 잠긴 도성의 사냥터와 잠긴 궁은 모두 물 아래다. 물 아래에서는 한 번 움직일 때마다(싸움의 한 턴도) 숨이 하나씩 준다.
// 숨이 다하면 움직일 때마다 생명력이 깎인다. 물 위에서는 칸도 이름표도 없다 (JD-F2).
// 여기 것들은 짝을 지어 다닌다: 하나를 쓰러뜨리면 둘째가 곧바로 덤빈다(연달아 두 판, JD-G1). 그 이음은 battle.js의 win()이 한다.

import { placeById } from '../data/places.js?v=d86445b';
import { DUNGEONS } from '../data/dungeon.js?v=d86445b';
import { ITEMS, itemDef } from '../data/items.js?v=d86445b';
import { COMPANIONS } from '../data/companions.js?v=d86445b';
import { monsterDef } from '../data/monsters.js?v=d86445b';
import { pushLine } from './log.js?v=d86445b';
import { next, chance, roll01 } from './rng.js?v=d86445b';
import { addItem, countOf, takeById } from './inventory.js?v=d86445b';
import { valueOf } from './derived.js?v=d86445b';
import { rollOptions, gearName } from './gear.js?v=d86445b';
import { gradeName } from '../data/items.js?v=d86445b';
import { iGa, waGwa } from './ko.js?v=d86445b';

/**
 * JD-B3, JD-C의 숫자. max: 가득 찬 숨. perGear: 비늘 가죽 장비 하나마다 더 가는 숨. choke: 막힌 숨에서 한 번에 깎이는 몫. bagAir: 공기 주머니 하나의 숨.
 * dive: 선창에서 다시 내려가는 데 드는 때(움직임 다섯 번만큼). digFight: 물 아래에서 캐는 동안 덤빌 확률.
 * escortHurt: 호위 싸움 한 번에 용병이 잃는 생명력의 몫(15~30%). escortXp: 호위 싸움의 경험치 몫. secondHp: 막는 이가 붙잡은 둘째의 생명력.
 * boxes: 곳마다 놓인 하사품 상자의 수. gift: 상자 하나에 우두머리가 세지는 몫(화면에 나오지 않는다).
 */
export const SUNKEN = { band: 7, gate: 'roofgate', town: '지붕마을', max: 20, perGear: 2, hide: 'scalehide', choke: 0.05, bag: 'airbag', bagAir: 10, dive: 5, digFight: 0.2, escortHurt: [0.15, 0.30], escortXp: 0.5, secondHp: 0.5, boxes: { sunkenstreet: 4, palaceyard: 4, vault: 3 }, gift: 0.05, giftGrades: [[2, 0.6], [3, 1]] };
export const CHOKE_TAG = { id: 'choke', name: '막힌 숨', text: '움직일 때마다 생명력이 깎인다' };
export const SUNKEN_LINES = {
  first: ['안개가 걷히자 물 위에 지붕들이 떠 있었다. 지붕이 아니다. 잠긴 것의 꼭대기다. 배 밑으로 거리가 지나갔다. 그리고 물속에서, 아주 많은 띠링이 한꺼번에 울리고 있었다.', '사냥터는 모두 물 아래다. 숨이 닳기 전에 올라와야 한다.'],
  out: '숨이 다했다. 가슴이 탄다.',
  up: '물 위로 솟구쳤다. 숨이 돌아왔다.',
  wet: '젖은 채로 널 위에 엎드렸다.',
  bag: '공기 주머니를 물었다.',
  pair: '물살이 갈라진다. 짝이 온다. 숨 돌릴 틈이 없다.',
  fall: '숨이 끊어졌다. 몸이 물 위로 떠올랐다.',
  sense: '기척:',
  escortFirst: '용병 둘이 곁에 있으면, 물 아래에서 캐는 동안 덤비는 것은 용병이 맡는다. 그 싸움의 경험치는 절반이다.',
  escortSay: '캐시오. 여긴 우리가.',
  chestRing: '물속 어디선가 띠링이 한 겹 더 겹쳤다.',
  vault: '상자 하나를 끌어 내려 뚜껑을 들었다. 안쪽에 글씨가 있다. "받아라. 아무것도 하지 않아도 된다."',
};

export const sunkenFields = () => ({ sunken: { breath: SUNKEN.max, boxes: {}, bronze: 0 } });
/** 잠긴 도성의 칸. 없던 저장에서도 그 자리에서 생긴다. */
export function sunkenOf(state) {
  if (!state.sunken || typeof state.sunken !== 'object') state.sunken = sunkenFields().sunken;
  if (!state.sunken.boxes) state.sunken.boxes = {};
  return state.sunken;
}

/** 잠긴 도성에 있는가 (지붕마을의 방들, 잠긴 거리, 잠긴 궁 뜰, 잠긴 궁). */
export const inSunken = (state) => placeById(state.place).band === SUNKEN.band;
/** 물 아래인가: 잠긴 거리, 잠긴 궁 뜰, 그리고 잠긴 궁 안. */
export const underwater = (state) => (state.dungeon ? !!DUNGEONS[state.dungeon.id]?.under : !!placeById(state.place).under);
/** 가득 찬 숨: 스무 번. 비늘 가죽으로 지은 장비 하나마다 +2 (장갑·장화 둘이면 24). */
export function breathMax(state) {
  let n = SUNKEN.max;
  for (const it of Object.values(state.equip || {})) if (it && ITEMS[it.id]?.hideOf === SUNKEN.hide) n += SUNKEN.perGear;
  return n;
}
export const breathOf = (state) => Math.min(breathMax(state), Number.isFinite(state.sunken?.breath) ? state.sunken.breath : breathMax(state));
export const isChoking = (state) => underwater(state) && breathOf(state) <= 0;

/** 화면이 그릴 것 (JD-B1, JD-F2). 물 위에서는 null: 칸이 생기지 않는다. */
export function breathView(state) {
  if (!underwater(state)) return null;
  const n = breathOf(state);
  return { n, max: breathMax(state), choke: n <= 0, tag: n <= 0 ? CHOKE_TAG : null };
}

/** 숨이 가득 찬다(물 위로 올라왔거나, 공기 고인 데서 쉬었다). */
export function fillBreath(state) { sunkenOf(state).breath = breathMax(state); }

/** 한 번 움직였다(싸움의 한 턴도). 물 아래면 숨이 하나 준다. 숨이 다했으면 최대 생명력의 5%가 깎인다. 물 위에서는 숨이 찬 채다. */
export function breathMove(state, events) {
  if (!underwater(state)) { if (state.sunken) state.sunken.breath = breathMax(state); return; }
  const a = sunkenOf(state);
  const before = breathOf(state);
  if (before <= 0) {
    const cut = Math.max(1, Math.round(valueOf(state, 'maxHp') * SUNKEN.choke));
    const hpBefore = state.hp;
    // 싸우는 중에는 숨만으로 끊어지지 않는다. 싸움 밖에서 0이 되면 쓰러진다
    state.hp = Math.max(state.battle ? 1 : 0, state.hp - cut);
    if (hpBefore > state.hp) pushLine(state, events, { k: 'sys', text: `${SUNKEN_LINES.out} 생명력 −${hpBefore - state.hp}.`, tone: 'frost' });
    if (state.hp <= 0) state.flags.choked = true;
    return;
  }
  a.breath = before - 1;
  if (a.breath <= 0) { pushLine(state, events, { k: 'sys', text: SUNKEN_LINES.out, tone: 'frost' }); events.push({ type: 'breath', choke: true }); }
}

/** 공기 주머니를 문다 (JD-B3): 물 아래에서 숨 +10. 싸우는 중에는 가방에서 쓴다(한 턴). @returns 돌아온 숨 */
export function useAir(state, n = SUNKEN.bagAir) {
  if (!underwater(state)) throw new Error('공기 주머니는 물 아래에서 씁니다');
  const a = sunkenOf(state);
  const before = breathOf(state);
  a.breath = Math.min(breathMax(state), before + n);
  return a.breath - before;
}
/** 들판의 "공기 주머니" 칸. */
export function useAirbag(state, events) {
  if (!underwater(state)) throw new Error('공기 주머니는 물 아래에서 씁니다');
  if (countOf(state, SUNKEN.bag) < 1) throw new Error('공기 주머니가 없습니다');
  if (breathOf(state) >= breathMax(state)) throw new Error('숨이 가득합니다');
  takeById(state, SUNKEN.bag, 1);
  const got = useAir(state, itemDef(SUNKEN.bag).eat.air);
  pushLine(state, events, { k: 'me', text: `${SUNKEN_LINES.bag} 숨 +${got}.` });
  events.push({ type: 'bag' });
}

// ── 짝 (JD-B3): 잠긴 도성의 보통 몬스터는 둘씩 다닌다 ──
/** 이 싸움을 이기면 짝이 이어 덤비는가: 물 아래에서 만난 잠긴 도성의 보통 몬스터의 첫째일 때. 혼자 선 근위병(solo), 굶주린 놈, 사람은 아니다. */
export function pairComes(state, b) {
  const m = monsterDef(b.mon);
  return underwater(state) && m.band === SUNKEN.band && !m.boss && !b.second && !b.solo && !b.hungry && !b.person && !b.bandit && !b.arena;
}
/** 짝의 둘째를 붙잡아 줄 막는 이: 쓰러지지 않은 막는 동료. 없으면 null. */
export const holder = (state) => (state.party || []).find((c) => !c.down && c.out !== state.day && COMPANIONS[c.id].role === 'guard') || null;

// ── 호위받는 채집 (JD-C2, JD-C4, JD-C5) ──
const standing = (state, c) => !c.down && c.out !== state.day && c.hp > 0;
/** 호위할 용병 둘: 삯을 받는 용병 둘이 다 서 있을 때만. 아니면 null. */
export function escorts(state) {
  const ms = (state.party || []).filter((c) => COMPANIONS[c.id].way === 'merc' && COMPANIONS[c.id].role !== 'bard' && standing(state, c)); // 북 치는 이는 싸우지 않는다 (GD-C0)
  return ms.length >= 2 ? ms.slice(0, 2) : null;
}
/**
 * 물 아래에서 캐는 동안 무언가 덤볐다. 용병 둘이 다 있으면 그들이 맡는다: 나는 캐기를 이어 가고, 경험치는 절반, 전리품은 그대로, 용병은 다친다.
 * @returns {{ mon: string, escorted: boolean } | null} 덤빈 것이 없으면 null. escorted가 false면 싸움은 내 몫이다(부른 쪽이 건다).
 */
export function digTrouble(state, events, monsters, weighted) {
  if (!underwater(state) || state.dungeon || !chance(state, SUNKEN.digFight)) return null;
  const mon = weighted(state, monsters).id;
  const m = monsterDef(mon);
  const seen = state.dex.mon[mon] || (state.dex.mon[mon] = { seen: 0, won: 0, lost: 0 });
  seen.seen = (seen.seen || 0) + 1;
  pushLine(state, events, { k: 'sys', text: `${SUNKEN_LINES.sense} ${m.name} 둘이 이쪽으로 온다.`, tone: 'frost' });
  const es = escorts(state);
  if (!es) return { mon, escorted: false };
  const [a, b] = es.map((c) => COMPANIONS[c.id].name);
  if (!state.flags.sawEscort) { state.flags.sawEscort = true; pushLine(state, events, { k: 'sys', text: SUNKEN_LINES.escortFirst, tone: 'mint' }); }
  pushLine(state, events, { k: 'sys', text: `${waGwa(a)} ${iGa(b)} 앞을 막았다. "${SUNKEN_LINES.escortSay}"`, tone: 'mint' });
  return { mon, escorted: true, names: [a, b] };
}
/** 호위 싸움의 끝 (JD-C4, JD-C5): 용병이 둘을 물리쳤다. 경험치는 절반, 전리품은 둘 몫 그대로. 용병은 생명력의 15~30%를 잃고, 쓰러지면 그날은 못 쓴다. */
export function escortEnd(state, events, trouble, grantXp) {
  const m = monsterDef(trouble.mon);
  const got = [];
  for (let i = 0; i < 2; i++) for (const d of m.drops || []) { if (!chance(state, d.p)) continue; addItem(state, d.id, 1); got.push(itemDef(d.id).name); }
  const xp = Math.round(m.xp * 2 * SUNKEN.escortXp);
  const hurt = [];
  for (const c of escorts(state) || []) {
    const d = COMPANIONS[c.id];
    const [lo, hi] = SUNKEN.escortHurt;
    c.hp = Math.max(0, c.hp - Math.round(d.hp * (lo + next(state) * (hi - lo))));
    if (c.hp <= 0) { c.out = state.day; hurt.push(`${iGa(d.name)} 쓰러졌다. 오늘은 더 못 쓴다`); }
    else hurt.push(`${iGa(d.name)} ${c.hp < d.hp / 2 ? '많이' : '조금'} 다쳤다`);
  }
  const [a, b] = trouble.names;
  pushLine(state, events, { k: 'sys', text: `${waGwa(a)} ${iGa(b)} ${m.name} 둘을 물리쳤다. 경험치 +${xp.toLocaleString('en-US')} (절반).${got.length ? ` 얻은 것: ${got.join(', ')}.` : ''} ${hurt.join('. ')}.` });
  grantXp(state, events, xp);
  events.push({ type: 'escort', mon: trouble.mon });
  events.push({ type: 'bag' }); events.push({ type: 'party' });
}

// ── 임금의 하사품 (JD-D, JD-F4): 상자는 보이고 열 수 있다. 열면 무엇이 달라지는지는 어디에도 내보내지 않는다 ──
/** 지금까지 연 상자의 수. */
export const chestsOpened = (state) => Object.values(state.sunken?.boxes || {}).reduce((a, n) => a + (n || 0), 0);
/** 그곳에 아직 열지 않은 상자가 남았는가. */
export const chestsLeft = (state, where = state.place) => (SUNKEN.boxes[where] || 0) - (state.sunken?.boxes?.[where] || 0);
/** 상자를 하나 연다: 그 구간의 좋은 물건(희귀·영웅 등급의 옛 청동 장비)이 그냥 나온다. */
export function openChest(state, events, where = state.place) {
  if (chestsLeft(state, where) < 1) throw new Error('열 상자가 남아 있지 않습니다');
  const a = sunkenOf(state);
  a.boxes[where] = (a.boxes[where] || 0) + 1;
  const n = chestsOpened(state);
  const pool = Object.entries(ITEMS).filter(([, d]) => d.kind === 'gear' && d.tier === SUNKEN.band && !d.job).map(([id]) => id);
  const id = pool[Math.floor(roll01(`${state.seed}|gift|${n}`) * pool.length)];
  const r = roll01(`${state.seed}|giftgrade|${n}`);
  const grade = SUNKEN.giftGrades.find(([, p]) => r < p)[0];
  const item = rollOptions(state, addItem(state, id, 1, { grade }), `gift|${n}`);
  pushLine(state, events, { k: 'sys', text: `임금의 하사품: ${gearName(item)} (${gradeName(grade)}).`, tone: 'mint' });
  pushLine(state, events, { k: 'room', text: SUNKEN_LINES.chestRing });
  events.push({ type: 'bag' }); events.push({ type: 'chest', n });
  return item;
}
/** 연 상자만큼 우두머리가 세지는 몫 (JD-D). 화면에 내보내지 않는다. */
export const giftBoost = (state) => 1 + SUNKEN.gift * chestsOpened(state);
