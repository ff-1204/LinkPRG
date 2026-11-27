// 별못 (BM-A ~ BM-E): 맞울의 규칙.
// 거울: 별못의 싸움에서는 같은 수를 거듭하면 읽힌다(읽힘 0~100). 싸움에 걸리는 것은 battle.js가 여기 숫자를 읽어 넣는다.
// 지켜보기: 답하는 마당에서 마을 사람의 일을 끝까지 지켜보고 "봤다고 말한다". 일로 치지 않는다.

import { placeById } from '../data/places.js?v=81955bc';

/**
 * BM-A1, BM-B3의 숫자. road: 다릿목에서 내려가는 하루 길에 드는 때.
 * same/other: 직전과 같은 행동·다른 행동에 읽힘이 움직이는 몫. at: 이것을 넘으면 읽혔다. cut/hurt: 읽혔을 때 내 공격이 깎이는 몫과 맞는 피해가 느는 몫.
 * mirror: 못의 거울상(공격력이 내 공격력의 90%, 경험치가 내 레벨 몬스터 한 마리 반). clean: 한 번도 읽히지 않고 이긴 싸움에 더 오르는 숙련도의 몫.
 */
export const POND = { band: 9, gate: 'echogate', town: '맞울', road: 50, max: 100, same: 20, other: 30, at: 60, cut: 0.25, hurt: 0.25, mirror: 'pondmirror', mirrorAttack: 0.9, mirrorXp: 1.5, clean: 0.2 };
export const POND_LINES = {
  // BM-E2. 둘째 줄은 처음 값이다
  first: ['구름 아래로 내려서자 둥근 못이 있었다. 밤인데 물이 밝다. 못가에서 사람들이 일하고 있고, 그 곁마다 누가 앉아 있다. 종소리는 없다. 대신 여기저기서 낮은 말소리가 났다. 같은 말이었다.', '못 둘레와 별 떨어진 벌의 것들은 나를 비춘다. 같은 수를 거듭하면 읽힌다.'],
};
/** 마당지기 다온과 처음 만날 때 (BM-E1). [누가, 글]. me는 내 말이다 */
export const DAON_FIRST = [
  ['daon', '종? 깨졌어. 할아버지 때. 별이 떨어졌거든.'],
  ['daon', '그래서 우린 서로 봐 줘. 누가 끝까지 하면 옆 사람이 말해. "봤어." 그게 다야.'],
  ['me', '그것으로 되느냐고 물었다.'],
  ['daon', '몰라. 종은 틀린 적이 없었대. 사람은 가끔 못 봐. 졸기도 하고, 딴 데 보기도 하고. 그게 좀 그래.'],
  ['daon', '그래도 종은 "봤어"라고는 안 했잖아. 그냥 울었지.'],
];
/** 1부의 숨은 끝("서로 답한다")을 본 사람에게는 다온의 첫마디가 다르다 (BM-E1). 처음 값이다 */
export const DAON_FIRST_SEEN = '…너, 그 말을 들어 본 얼굴이네. 종한테서가 아니라 사람한테서. 그럼 긴말 안 해도 되겠다. 여긴 삼대째 그렇게 살아.';

/** 별못에 있는가 (맞울의 방들, 못 둘레, 별 떨어진 벌, 별 떨어진 자리). */
export const inPond = (state) => placeById(state.place).band === POND.band;
/** 다온의 첫 만남에 나올 줄들: 숨은 끝을 본 사람은 첫 줄이 다르다. */
export const daonFirst = (state) => (state.ending === 'hidden' ? [['daon', DAON_FIRST_SEEN], ...DAON_FIRST.slice(1)] : DAON_FIRST);

// ── 답하는 마당: 지켜보기 (BM-D) ──
import { PEOPLE, WATCHED } from '../data/people.js?v=81955bc';
import { WATCH, WORKERS } from '../data/pond.js?v=81955bc';
import { pushLine } from './log.js?v=81955bc';
import { bondBy } from './social.js?v=81955bc';
import { iGa } from './ko.js?v=81955bc';

export { WATCH, WORKERS, WATCHED };
/** 마당의 자리. */
export const YARD = 'answeryard';
export const WATCH_LINES = {
  ready: '끝까지 지켜보았다. 말해 줄 수 있다.',
  must: '먼저 봤다고 말해 준다',
  none: '마당의 일이 모두 끝났다',
};
/** 별못의 칸: who(지금 곁에 앉은 사람), watch(사람마다 지금 일을 본 수 n, 답해 준 일의 수 done, 끝까지 보아 말해 줄 수 있는가 ready), bells(집집에 건 작은 종). */
export const pondFields = () => ({ pond: { who: null, watch: {}, bells: 0 } });
const rec = (state, id) => { const p = state.pond || (state.pond = pondFields().pond); return p.watch[id] || (p.watch[id] = { n: 0, done: 0, ready: false }); };
const left = (state, id) => (state.pond?.watch?.[id]?.done || 0) < WATCH.each;
/** 지금 지켜볼 사람: 곁에 앉은 사람에게 볼 일이 남았으면 그 사람, 아니면 볼 일이 남은 첫 사람. 모두 끝났으면 null. */
export const watchTarget = (state) => (state.pond?.who && left(state, state.pond.who) ? state.pond.who : WATCHED.find((id) => left(state, id)) || null);
/** 마당에서 그 사람에게 말을 걸면 그 곁에 앉는다 (BM-D3: 한 번에 한 사람). */
export function sitBeside(state, npc) {
  if (state.place !== YARD || !WATCHED.includes(npc) || !left(state, npc)) return;
  (state.pond || (state.pond = pondFields().pond)).who = npc;
}
/** 지켜보기 칸이 그릴 것 (BM-D1, BM-D2, BM-G4): 끝까지 본 뒤에만 "봤다고 말한다"가 나온다. */
export function watchSlot(state) {
  const id = watchTarget(state);
  if (!id) return { label: '지켜보기', action: { type: 'act', id: 'witness' }, disabled: true, why: WATCH_LINES.none };
  const w = WORKERS[id], r = state.pond?.watch?.[id] || { n: 0, done: 0, ready: false };
  if (r.ready) return { label: '봤다고 말한다', sub: w.short, action: { type: 'saw' } };
  return { label: '지켜보기', sub: `${w.short}의 ${w.works[r.done].what}`, action: { type: 'act', id: 'witness' } };
}
/** 한 번 지켜본다 (BM-D1). 한 번 누르면 한 번이다. 일로 치지 않는다 (BM-D4). 자리를 떠도 센 것은 남는다 (BM-D3). */
export function witness(state, events) {
  if (state.place !== YARD || state.dungeon) throw new Error('지켜볼 일은 답하는 마당에 있습니다');
  const id = watchTarget(state);
  if (!id) throw new Error(WATCH_LINES.none);
  const w = WORKERS[id], r = rec(state, id), work = w.works[r.done];
  if (r.ready) throw new Error(WATCH_LINES.must);
  state.pond.who = id;
  r.n += 1;
  pushLine(state, events, { k: 'me', text: `${w.beside} 곁에 앉아 지켜보았다. (${r.n} / ${WATCH.n})` });
  if (r.n % WATCH.per === 0) bondBy(state, events, id, 1); // 그 사람과의 사이가 오른다 (BM-D4)
  if (r.n >= WATCH.n) {
    r.ready = true;
    pushLine(state, events, { k: 'me', text: work.end });
    pushLine(state, events, { k: 'sys', text: WATCH_LINES.ready, tone: 'mint' });
  } else if (r.n % WATCH.say === 0) pushLine(state, events, { k: 'npc', who: PEOPLE[id].name, text: work.mid[(r.n / WATCH.say - 1) % work.mid.length] });
  events.push({ type: 'watch', who: id, n: r.n });
}
/** 끝까지 본 일을 봤다고 말해 준다 (BM-D2). 세계 공지에 한 줄이 오른다. */
export function saySaw(state, events) {
  if (state.place !== YARD || state.dungeon) throw new Error('답하는 마당에서 말해 줍니다');
  const id = watchTarget(state), r = id ? rec(state, id) : null;
  if (!id || !r.ready) throw new Error('끝까지 지켜본 일이 없습니다');
  const w = WORKERS[id], work = w.works[r.done], name = PEOPLE[id].name;
  pushLine(state, events, { k: 'me', text: w.mine[r.done] });
  pushLine(state, events, { k: 'npc', who: name, text: work.reply });
  const said = `${iGa(`'${name}'`)} ${work.notice}.`;
  state.world.notices.push({ day: state.day, phase: state.phase, who: state.name, mine: true, text: `${said} 본 사람: '${state.name}'.` });
  pushLine(state, events, { k: 'sys', who: '세계 공지', text: `${said} 본 사람: 나.` });
  r.done += 1; r.n = 0; r.ready = false;
  bondBy(state, events, id, WATCH.bond);
  events.push({ type: 'saw', who: id, done: r.done });
  events.push({ type: 'world' });
}
/** 한 가지 일이라도 끝까지 보고 답해 준 사람의 수 (그대로 두는 길). */
export const answeredPeople = (state) => WATCHED.filter((id) => (state.pond?.watch?.[id]?.done || 0) >= 1).length;
/** 일곱 사람이 가진 일을 모두 보고 답해 주었는가 (히든. 어디에도 내보내지 않는다). */
export const answeredAll = (state) => WATCHED.every((id) => (state.pond?.watch?.[id]?.done || 0) >= WATCH.each);

// ── 거울: 읽히는 버릇 (BM-B) ──
import { ro } from './ko.js?v=81955bc';

/** 읽히는 곳에 서 있는가: 못 둘레, 별 떨어진 벌, 그리고 별 떨어진 자리(던전 안에서도 곳은 그 어귀다). */
export const mirrored = (state) => !!placeById(state.place).mirror;
/** 지금 읽혔는가 (60을 넘었는가). */
export const isRead = (state, b = state.battle) => !!b && mirrored(state) && (b.read || 0) > POND.at;
const ORD = ['', '첫', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
/** "네 번째" (BM-B1). 열을 넘으면 숫자로 적는다. */
export const ordinal = (n) => (n >= 1 && n <= 10 ? `${ORD[n]} 번째` : `${n}번째`);
export const READ_LINES = {
  // 처음 읽혔을 때의 한 줄 (BM-G2). 처음 값이다
  first: '읽혔다. 별못의 것들은 거듭한 수를 먼저 안다. 다른 수를 섞거나 태세를 바꾸면 풀린다.',
  same: (n, name) => `${ordinal(n)} 같은 수다. ${iGa(name)} 먼저 비켜섰다.`,
  lost: (name) => `${iGa(name)} 머뭇거린다. 읽지 못하고 있다.`,
  stance: (name) => `태세를 ${ro(name)} 바꿨다.`,
  clean: '한 번도 읽히지 않았다. 손에 익은 것이 더 깊이 남는다.',
  tag: { name: '읽혔다', text: `내 공격 −${Math.round(POND.cut * 100)}%, 맞는 피해 +${Math.round(POND.hurt * 100)}%` },
};
/** 읽힘으로 세는 행동의 열쇠: 공격, 방어, 같은 스킬. 그 밖(물건, 달아나기, 바꿔 쥐기)은 늘 "다른 행동"이다. */
export const readKey = (choice, arg) => (choice === 'attack' || choice === 'defend' ? choice : choice === 'skill' ? `skill:${arg}` : '');
/**
 * 한 턴의 행동으로 읽힘이 움직인다 (BM-B3): 직전과 같은 행동이면 +20, 다른 행동이면 −30. 싸움의 첫 행동에는 움직이지 않는다.
 * 읽히지 않는 곳에서는 아무것도 하지 않고 null을 돌려준다.
 * @returns {{was:number, now:number, same:number}|null} same: 같은 행동을 이어 한 수(이번 것까지)
 */
export function readStep(state, b, key) {
  if (!mirrored(state)) return null;
  const was = b.read || 0;
  if (b.last === undefined || b.last === null) { b.read = was; b.same = 1; }
  else if (key && key === b.last) { b.read = Math.min(POND.max, was + POND.same); b.same = (b.same || 1) + 1; }
  else { b.read = Math.max(0, was - POND.other); b.same = 1; }
  b.last = key;
  if (b.read > POND.at) b.wasRead = true;
  return { was, now: b.read, same: b.same };
}
/** 태세를 바꿨다 (BM-B3): 읽힘이 0으로 돌아가고, 저쪽은 처음부터 다시 읽어야 한다. */
export function readReset(state, b) {
  if (!mirrored(state)) return null;
  const was = b.read || 0;
  b.read = 0; b.same = 0; b.last = null;
  return { was, now: 0, same: 0 };
}
/** 화면이 그릴 것 (BM-B1, BM-G2). 별못의 싸움 중에만 있다. 그 밖에서는 null: 칸이 생기지 않는다. */
export function readView(state) {
  const b = state.battle;
  if (!b || !mirrored(state)) return null;
  const n = b.read || 0, on = n > POND.at;
  return { n, max: POND.max, on, tag: on ? READ_LINES.tag : null };
}
/** 거듭 누른 칸에 작게 붙는 "몇 번째" (BM-B1). 두 번째부터 붙는다. */
export const sameSub = (state, key) => { const b = state.battle; return b && mirrored(state) && key && b.last === key && (b.same || 0) >= 2 ? `${b.same}번째` : ''; };

// ── 12장 깨진 종의 길과 서브 둘, "봤어" (BM-D5, BM-E) ──
import { SHARDS, SHARD_LINES, SAW_SAY, SUBS } from '../data/quests.js?v=81955bc';
import { WILDS } from '../data/wild.js?v=81955bc';
import { MONSTERS } from '../data/monsters.js?v=81955bc';
import { countOf, takeById } from './inventory.js?v=81955bc';
import { chance, roll01 } from './rng.js?v=81955bc';

export { SHARDS, SHARD_LINES };
/** 집집에 건 작은 종의 수 (나누는 길). */
export const bellsHung = (state) => state.pond?.bells || 0;
/** 나누는 길 (BM-E4): 내가 지은 작은 종 하나를 처마에 건다. 한 번 누르면 하나다. 일곱이면 장이 끝난다(끝내는 것은 game.js가 본다). */
export function hangBell(state, events) {
  if (state.main.chapter !== 12) throw new Error('지금은 종을 걸 집이 없습니다');
  if (state.place !== SHARDS.hangAt || state.dungeon) throw new Error('작은 종은 맞울 어귀의 집집에 겁니다');
  if (bellsHung(state) >= SHARDS.bells) throw new Error('집집에 다 걸었습니다');
  if (countOf(state, SHARDS.bell) < 1) throw new Error('작은 종이 없습니다');
  takeById(state, SHARDS.bell, 1);
  const p = state.pond || (state.pond = pondFields().pond);
  p.bells = (p.bells || 0) + 1;
  state.lastAction = null;
  pushLine(state, events, { k: 'me', text: `${SHARD_LINES.hang[p.bells % SHARD_LINES.hang.length]} (${p.bells} / ${SHARDS.bells})` });
  events.push({ type: 'quest' });
  events.push({ type: 'bag' });
}
const relayOn = (state) => { const st = state.quests?.[SHARDS.relayQuest]; return !!st && !st.done && st.step === 'pass'; };
/**
 * 서브 "서로 답하는 마을" (BM-E6): 말을 건 사람이 다음 차례면 말이 넘어간다. 받은 날 안에 건네야 한다.
 * 하루를 넘겼으면 받지 않는다: 말을 준 사람에게 다시 말을 걸어 오늘 말로 받는다(그 사람부터 다시).
 */
export function relayTalk(state, events, npc) {
  if (!relayOn(state)) return;
  const q = SUBS[SHARDS.relayQuest], st = state.quests[SHARDS.relayQuest];
  const n = st.count || 0, next = SHARDS.relay[n], from = n === 0 ? SHARDS.relayFrom : SHARDS.relay[n - 1];
  const fresh = (st.leg ?? st.day) === state.day;
  if (npc === next && PEOPLE[next].place === state.place) {
    if (!fresh) { pushLine(state, events, { k: 'room', text: SHARD_LINES.relayLate }); pushLine(state, events, { k: 'sys', who: '서브 퀘스트', text: `'${q.name}': ${PEOPLE[from].name}에게 말을 다시 받는다.`, tone: 'warn' }); return; }
    st.count = n + 1; st.leg = state.day;
    pushLine(state, events, { k: 'room', text: SHARD_LINES.relay[next] });
    if (st.count >= SHARDS.relay.length) { st.step = q.steps[1].id; st.count = 0; pushLine(state, events, { k: 'sys', who: '서브 퀘스트', text: `'${q.name}': ${q.steps[1].text}` }); }
    else pushLine(state, events, { k: 'sys', who: '서브 퀘스트', text: `'${q.name}': 다음은 ${PEOPLE[SHARDS.relay[st.count]].name}. (${st.count} / ${SHARDS.relay.length})` });
    events.push({ type: 'quest' });
  } else if (npc === from && !fresh && PEOPLE[from].place === state.place) {
    st.leg = state.day;
    pushLine(state, events, { k: 'npc', who: PEOPLE[from].name, text: SHARD_LINES.relayAgain });
    events.push({ type: 'quest' });
  }
}
const guardOn = (state) => { const st = state.quests?.[SHARDS.guardQuest]; return !!st && !st.done && st.step === 'guard'; };
/**
 * 서브 "조각을 줍는 아이" (BM-E7): 솔이 조각을 줍는 동안 곁을 지킨다. 한 번 누르면 한 번이다.
 * 덤비는 것이 있으면 내가 막아서 싸우고(그 번에는 줍지 못한다), 없으면 솔이 하나를 줍는다. 스무 조각이면 끝이다.
 * @returns 덤빈 몬스터의 id(싸움은 game.js가 건다) 또는 null
 */
export function guardStep(state, events) {
  if (!guardOn(state)) throw new Error('지금은 지킬 사람이 없습니다');
  if (state.place !== SHARDS.guardAt || state.dungeon) throw new Error('솔은 별 떨어진 벌에서 조각을 줍습니다');
  const q = SUBS[SHARDS.guardQuest], st = state.quests[SHARDS.guardQuest];
  state.lastAction = null;
  if (chance(state, SHARDS.guardRisk)) {
    const list = WILDS[SHARDS.guardAt].monsters, total = list.reduce((a, x) => a + x.w, 0);
    let r = roll01(`${state.seed}|guard|${state.day}|${state.tick}|${st.count || 0}|${state.counters.fights || 0}`) * total, mon = list[0].id;
    for (const x of list) { r -= x.w; if (r < 0) { mon = x.id; break; } }
    pushLine(state, events, { k: 'room', text: SHARD_LINES.trouble });
    return mon;
  }
  st.count = (st.count || 0) + 1;
  pushLine(state, events, { k: 'me', text: `${SHARD_LINES.guard[st.count % SHARD_LINES.guard.length]} (${st.count} / ${SHARDS.guard})` });
  if (st.count === SHARDS.guard / 2) pushLine(state, events, { k: 'npc', who: PEOPLE.sol.name, text: SHARD_LINES.guardHalf });
  if (st.count >= SHARDS.guard) {
    st.step = q.steps[1].id; st.count = 0;
    pushLine(state, events, { k: 'npc', who: PEOPLE.sol.name, text: SHARD_LINES.guardDone });
    pushLine(state, events, { k: 'sys', who: '서브 퀘스트', text: `'${q.name}': ${q.steps[1].text}` });
  }
  events.push({ type: 'quest' });
  return null;
}
/** 별못의 칸: 맞울 어귀의 "작은 종 걸기"(12장, 작은 종을 지었거나 걸기 시작했을 때), 별 떨어진 벌의 "호위"(서브). 할 수 있게 된 때에만 나온다. */
export function pondSlots(state) {
  if (state.dungeon) return [];
  const out = [];
  if (state.main.chapter === 12 && state.place === SHARDS.hangAt && (countOf(state, SHARDS.bell) > 0 || bellsHung(state) > 0)) {
    const have = countOf(state, SHARDS.bell);
    out.push({ label: '작은 종 걸기', sub: `${bellsHung(state)} / ${SHARDS.bells}`, action: { type: 'hangbell' }, disabled: have < 1, why: have < 1 ? '작은 종이 없다' : '' });
  }
  if (state.place === SHARDS.guardAt && guardOn(state)) out.push({ label: '호위', sub: `솔의 조각 ${state.quests[SHARDS.guardQuest].count || 0} / ${SHARDS.guard}`, action: { type: 'guardkid' } });
  return out;
}
/** 끝까지 한 일의 표: 제작 단계, 끝낸 장·서브·히든·의뢰의 수. 행동 앞뒤를 견주어 본다 (BM-D5). */
export function doneMark(state) {
  if (!inPond(state)) return null;
  return {
    tier: Object.values(state.craftTier || {}).reduce((a, n) => a + (n || 0), 0),
    main: state.main.done.length,
    subs: Object.values(state.quests || {}).filter((q) => q && q.done).length,
    hq: Object.values(state.hq || {}).filter((h) => h && h.status === 'done').length,
    jobs: state.jobsDone || 0,
  };
}
/**
 * 내가 이 마을에서 무언가를 끝까지 했으면(제작 승급, 우두머리, 퀘스트) 띠링 뒤에 마을 사람 하나가 "봤어"라고 말해 준다 (BM-D5, BM-H5). 별못에서만이다.
 * 12장의 끝 글에는 그 말이 이미 들어 있어 따로 붙이지 않는다.
 */
export function sawAnswer(state, events, before) {
  if (!before || !inPond(state)) return;
  const now = doneMark(state);
  const boss = events.some((e) => e.type === 'battle' && e.phase === 'win' && e.mon && MONSTERS[e.mon]?.boss);
  const ended12 = now.main > before.main && state.main.done.at(-1)?.chapter === 12;
  if (ended12) return;
  if (!(boss || now.tier > before.tier || now.main > before.main || now.subs > before.subs || now.hq > before.hq || now.jobs > before.jobs)) return;
  const [who, text] = SAW_SAY[Math.floor(roll01(`${state.seed}|saw|${state.day}|${state.tick}|${now.jobs}|${now.subs}|${now.tier}`) * SAW_SAY.length) % SAW_SAY.length];
  pushLine(state, events, { k: 'npc', who: PEOPLE[who].name, text });
  events.push({ type: 'answered', who });
}
