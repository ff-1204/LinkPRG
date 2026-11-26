// 게임 규칙의 본체. 화면을 모른다. 상태(state)는 그대로 저장되는 순수한 값이다.
// dispatch(state, action, options)가 상태를 고치고, 그 사이 일어난 일(events)을 돌려준다.

import { seedFrom, pick, chance, int, roll01 } from './rng.js?v=4071dc9';
import { emptySkill, useSkill, gradeLabel, SKILL_NAMES } from './skills.js?v=4071dc9';
import { emptyCounters, checkHidden, hiddenById } from './hidden.js?v=4071dc9';
import { iGa, eulReul, ro, eunNeun } from './ko.js?v=4071dc9';
import { pushLine, ding } from './log.js?v=4071dc9';
import { SAVE_VERSION, bodyFields, makerFields, townFields, jobFields, artFields, dungeonFields } from './migrate.js?v=4071dc9';
import { enterDungeon, leaveDungeon, moveRoom, restInRoom, roomView, dungeonMap, dungeonHook } from './dungeon.js?v=4071dc9';
import { finishMain } from './quests.js?v=4071dc9';
import { worldFields, auctionFields, endingFields } from './migrate.js?v=4071dc9';
import { standBeforeBell, applyEnding, ringFor } from './ending.js?v=4071dc9';
import { worldDay, trackDay, claim, readRumors } from './world.js?v=4071dc9';
import { listItem, bid, auctionDay } from './auction.js?v=4071dc9';
import { grantTitle } from './social.js?v=4071dc9';
import { startSculpt, cut, quitSculpt, sculptView, admire, placeWork, sellWork, giftWork, statueOf, statueDay } from './sculpt.js?v=4071dc9';
import { cook } from './cook.js?v=4071dc9';
import { askToJoin, hireMerc, giveLife, dismiss, setPlan, setRow, partyDay, partyRest } from './party.js?v=4071dc9';
import { chooseJob, skipJob, skillsNow, jobXp, jobName, canChooseJob, chooseAdvance, adv } from './jobs.js?v=4071dc9';
import { standingOf } from './factions.js?v=4071dc9';
import { SEARCH_LINES, SEARCH_MARKS, SEARCH_NEED, FAINT_CHATTER } from '../data/lines.js?v=4071dc9';
import { foundCount } from './hidden.js?v=4071dc9';
import { tellChance, statChance } from './dungeon.js?v=4071dc9';
import { greet, talk, gift, wearTitle, peopleHere, workedHere } from './social.js?v=4071dc9';
import { acceptJob, finishJob, dropJob, acceptSub, chooseSub, questHook, offersOf } from './quests.js?v=4071dc9';
import { startCraft, hammer, reheat, quitCraft, craftView } from './craft.js?v=4071dc9';
import { chooseBranch, forgetBranch, pendingEvolves, branchOf } from './evolve.js?v=4071dc9';
import { buy, sell, deposit, withdraw, depositSilver, withdrawSilver, storeDay } from './trade.js?v=4071dc9';
import { valueOf, isHungry, isTired, TIRED_AT, TIRED_MAX } from './derived.js?v=4071dc9';
import { chiselOf } from './sculpt.js?v=4071dc9';
import { START_SCENES } from '../data/scenes.js?v=4071dc9';
import { PEOPLE } from '../data/people.js?v=4071dc9';
import { ORIGIN_GRADES } from '../data/origins.js?v=4071dc9';
import { memoryHook, chooseMemory } from './memories.js?v=4071dc9';
import { knowsWork, watchWork, askToLearn, nativeWork } from './work.js?v=4071dc9';
import { bondOf as bondOfNpc } from './social.js?v=4071dc9';
import { drink } from './social.js?v=4071dc9';
import { makeItem, equip as equipItem, unequip as unequipItem, discard as discardItem, totalWeight, countOf } from './inventory.js?v=4071dc9';
import { xpToNext } from './level.js?v=4071dc9';
import { tickFall, recoverRelic, bless, prayShadow, fall, blessingHere, blessFee, graceFee } from './fall.js?v=4071dc9';
import { applyCarry } from './rebirth.js?v=4071dc9';
import { hasTitle } from './titles.js?v=4071dc9';
import { deliverMail, readMail, takeMail } from './mail.js?v=4071dc9';
import { restBuff, giveRoomBuff, ROOM_BUFFS, giveGrace, GRACE } from './buffs.js?v=4071dc9';
import { startBattle, battleAct, fleeChance, intentOf, eat, healOf, weighted, STANCES, stanceOf, foeDef } from './battle.js?v=4071dc9';
import { repair, enhance } from './gear.js?v=4071dc9';
import { joinGuild, leaveGuild, donate, guildHook } from './guild.js?v=4071dc9';
import { explore, gather, choose, choiceView, dangerNow, senseBars } from './explore.js?v=4071dc9';
import { monsterDef, STATUS } from '../data/monsters.js?v=4071dc9';
import { itemDef } from '../data/items.js?v=4071dc9';
import { WILDS, DANGER, TRAVEL_TICKS } from '../data/wild.js?v=4071dc9';
import { buildStats, originById } from '../data/origins.js?v=4071dc9';
import { ACTIONS, PLACES, PHASES, PHASE_TICKS, MOVE_TICKS, WILD_ORDER, TOWNS, TOWN_NAMES, isGate, placeById } from '../data/places.js?v=4071dc9';
import { DUNGEONS } from '../data/dungeon.js?v=4071dc9';
import { takeById, addItem } from './inventory.js?v=4071dc9';
import {
  ACTION_LINES, COUNT_WORDS, PHASE_LINES, INSTRUCTOR, SCARECROW_LINES, USERS,
  STRIKE_CHATTER, AFTER_ENDURE_CHATTER, AMBIENT_CHATTER, START_JOURNAL, BATTLE_CHATTER,
} from '../data/lines.js?v=4071dc9';

export { SAVE_VERSION };
export { LOG_KEEP } from './log.js?v=4071dc9';

/** 띠링의 귀한 정도 다섯 (G4-6). */
export const DING_LEVELS = ['', '흔함', '귀함', '아주 귀함', '가장 귀함', '세계 최초'];
const CHATTER_RATE = { low: 0.01, mid: 0.03, high: 0.07 };

/** 새 게임을 만든다. */
export function createGame({ name, origin, spent, seed, rolled, carry }) {
  const trimmed = String(name || '').trim();
  if (!trimmed) throw new Error('이름을 적어 주세요');
  if (trimmed.length > 12) throw new Error('이름은 열두 자까지입니다');
  const o = originById(origin);
  if (!o) throw new Error('출신을 골라 주세요');
  const { stats, unspent } = buildStats(origin, spent, rolled); // rolled: 주사위로 굴린 스탯 (만들기 화면)
  const state = {
    v: SAVE_VERSION,
    seed: seed ?? `${trimmed}-${origin}`,
    rng: seedFrom(seed ?? `${trimmed}-${origin}`),
    name: trimmed,
    origin,
    job: null,
    guild: null, // 든 길드: { id, contrib, joined }
    stance: 'hold', // 전투 태세: hold 버티기, clash 맞받아치기, dodge 피하기, focus 모으기
    tired: 0, // 피로 0~100. 움직일수록 쌓이고 밤에 자면 풀린다
    level: 1,
    stats,
    unspent,
    silver: o.silver || 0,
    flags: { ...(o.flags || {}) },
    skills: {},
    hidden: {},
    hints: {},
    counters: emptyCounters(),
    place: 'plaza',
    day: 1,
    phase: 0,
    tick: 0,
    scarecrow: { hits: 0 },
    lastAction: null,
    lastLine: {},
    seenChatter: [],
    pendingChatter: [],
    log: [],
    dings: [],
    journal: [],
    memo: '',
    ...bodyFields(),
    ...makerFields(),
    ...townFields(),
    ...jobFields(),
    ...artFields(),
    ...dungeonFields(),
    ...worldFields(),
    ...auctionFields(),
    ...endingFields(),
  };
  if (state.flags.templeKnown) state.factions.temple = 10; // 신전 고아는 신전과 낯익다
  state.lives = 1; // 몇 번째 삶인가 (Z32)
  state.pastLives = [];
  state.pastHidden = {}; // 지난 삶들에서 쌓은 히든 횟수
  state.tough = { str: 0, agi: 0, con: 0, wis: 0 }; // 다시 일어선 몸: 쌓인 몫 (Z30)
  state.toughGained = { str: 0, agi: 0, con: 0, wis: 0 }; // 다시 일어선 몸으로 오른 스탯
  state.mail = { got: [] }; // 우편함 (Z59)
  if (carry) applyCarry(state, carry); // 환생: 종이 기억한 것을 안고 온다
  state.hp = valueOf(state, 'maxHp');
  state.mp = valueOf(state, 'maxMp');
  for (const [id, grade] of Object.entries(o.skills || {})) state.skills[id] = { ...emptySkill(), grade };
  for (const [id, n] of o.items || []) addItem(state, id, n); // 출신이 들고 나온 것
  // 뿌리의 약속 (Z25 ①): 적힌 대로 사람들이 대한다
  const start = (id, pts) => { state.people[id] = { pts, talked: 0, likes: [], dislikes: [], stats: [], met: false }; };
  if (o.root === 'smithboy') start('smith', 10);
  if (o.root === 'farmer') for (const p of Object.values(PEOPLE)) if (PLACES[p.place]?.town === '시작 마을') start(p.id, 5);
  if (o.root === 'fallen') { start('agent', 10); start('trader', 10); }
  if (o.root === 'hunter') state.dex.mon.boar = { seen: 1, won: 0, lost: 0 };
  state.lore = { hints: [] };
  state.learned = nativeWork(origin); // 출신이 처음부터 할 줄 아는 일
  // 첫 장면 (Z27)
  const scene = START_SCENES[origin];
  state.journal.push({ day: state.day, phase: state.phase, place: 'plaza', text: scene ? scene.journal : START_JOURNAL[o.root || origin], note: carry ? `${carry.lives}번째 삶` : null });
  pushLine(state, [], { k: 'room', text: PLACES.plaza.room });
  for (const [k, text] of scene?.lines || []) pushLine(state, [], { k, text });
  if (carry) pushLine(state, [], { k: 'sys', text: `다시 태어났다. ${carry.lives}번째 삶. 종이 지난 삶에서 해낸 것들을 기억한다.` });
  deliverMail(state, []); // 첫 편지 (다시 태어난 삶은 지난 우편함을 이어받아 같은 편지가 다시 오지 않는다)
  // 등급의 맛 (Z25 ④)
  if (o.grade >= 3) pushLine(state, [], { k: 'user', who: "지나가던 유저 '밤비노'", text: o.grade >= 4 ? '방금 시작한 사람 출신 봤음? 저거 진짜 처음 봄' : '방금 시작한 사람 출신 봤음? 저거 잘 안 나오는 건데' });
  if (o.grade >= 4) {
    state.world.notices.push({ day: state.day, phase: state.phase, who: trimmed, mine: true, text: `'${trimmed}'님이 드문 지난날(${ORIGIN_GRADES[o.grade].name})을 안고 시작했습니다` });
    state.flags.legendNight = true;
  }
  return state;
}

// ── 보기 좋게 꺼내는 함수들 ──────────────────────────────────

export function phaseName(state) { return PHASES[state.phase]; }
export function isNight(state) { return state.phase === 2; }
export function whenLabel(state) { return `${state.day}일째 ${PHASES[state.phase]}`; }

/** 이 방에 있는 가상 유저 수. 때와 곳에 따라 다르고, 저장해도 같은 값이 나온다. */
export function usersHere(state) {
  const base = placeById(state.place).users[state.phase];
  const wobble = (seedFrom(`${state.seed}-${state.place}-${state.day}-${state.phase}`) % 3) - 1;
  return Math.max(base > 0 ? 1 : 0, base + wobble);
}

/** 허수아비 그림의 단계 0~3 (X1). */
export function scarecrowStage(state) {
  return Math.min(3, Math.floor(state.scarecrow.hits / 100));
}

/** 지금 방에서 할 수 있는 행동 (단축 칸에 놓일 것). */
export function actionsHere(state) {
  return placeById(state.place).actions.map((id) => ACTIONS[id]);
}

/** 지금 방에서 갈 수 있는 곳. */
export function exitsHere(state) {
  return Object.values(PLACES).filter((p) => p.id !== state.place && p.town === placeById(state.place).town);
}

/** 싸우는 중인지, 정할 것이 있는지. */
export const BOAT_NEEDS = [['oakbranch', 20], ['tar', 5], ['sailcloth', 2]];
export const BOAT_FEE = 100;
export const OFFER_FEE = 10;

/** 방 목록에 놓일 이 마을의 다른 곳들. 밤에만 열리는 곳은 낮에 닫혀 있다 (H3-2). */
export function townRooms(state) {
  const here = placeById(state.place);
  if (here.wild) return [];
  return TOWNS[here.town].order.map((id) => { // 지금 있는 곳도 제자리에 둔다. 화면이 꺼 둔다
    const p = PLACES[id];
    const stranger = !!p.needFaction && standingOf(state, p.needFaction[0]) < p.needFaction[1];
    return { id, here: id === here.id, name: p.name, part: p.part || '', closed: (!!p.nightOnly && state.phase !== 2) || stranger, why: stranger ? '낯이 익어야 들어간다' : p.nightOnly ? '밤에만 열린다' : '' };
  });
}

export function modeOf(state) {
  return state.battle ? 'battle' : state.craft ? 'craft' : state.sculpt ? 'sculpt' : state.choice ? 'choice' : 'free';
}

/** 지금 단축 칸에 놓일 것. 상황에 따라 바뀐다 (D4, E6). */
export function slotsNow(state) {
  if (state.battle) {
    return [
      { label: '공격', action: { type: 'battle', choice: 'attack' } },
      quickSlot(state),
      { label: stanceOf(state).label, action: { type: 'battle', choice: 'defend' } },
      { label: '아이템', open: 'bag' },
      { label: `도망 ${Math.round(fleeChance(state) * 100)}%`, action: { type: 'battle', choice: 'flee' } },
    ];
  }
  if (state.craft) {
    const c = craftView(state);
    return [
      { label: `망치질 ${c.hits} / ${c.total}`, action: { type: 'hammer' }, disabled: c.cold, why: c.cold ? '쇠가 식었다' : '', hammer: true },
      { label: '다시 달구기', action: { type: 'reheat' }, disabled: !c.cold, why: c.cold ? '' : '쇠가 아직 뜨겁다' },
      { label: '그만둔다', action: { type: 'craftQuit' }, confirm: '그만두면 넣은 재료는 돌아오지 않습니다.' },
    ];
  }
  if (state.sculpt) {
    const v = sculptView(state);
    return [
      { label: `칼질 ${v.cuts} / ${v.total}`, action: { type: 'cut' } },
      { label: '그만둔다', action: { type: 'sculptQuit' }, confirm: '그만두면 깎던 토막은 버려집니다.' },
    ];
  }
  if (state.choice) {
    const all = choiceView(state).options.map((o) => ({ label: o.label, action: { type: 'choose', id: o.id }, disabled: !!o.disabled, why: o.why || '' }));
    // 칸은 다섯이다. 넘치면 넷만 놓고, 다섯째 칸은 모든 선택지가 보이는 창을 연다
    return all.length > 5 ? [...all.slice(0, 4), { label: '다른 선택지 보기', open: 'choice' }] : all;
  }
  if (state.dungeon) {
    const v = roomView(state);
    const inside = [];
    if (v.canRest) inside.push({ label: '쉬기', action: { type: 'dungeon', op: 'rest' }, disabled: v.rested, why: v.rested ? '이미 쉬었습니다' : '' });
    for (const x of v.exits) inside.push({ label: `${x.name}${x.floor ? ` (${x.floor})` : ''}`, action: { type: 'room', to: x.id }, disabled: !x.can, why: x.why });
    if (state.main.chapter === 5 && !state.ending && state.dungeon.id === 'ruins' && state.dungeon.room === 'f3-bell') inside.unshift({ label: '종 앞에 선다', action: { type: 'ending' } });
    if (state.main.chapter === 4 && state.dungeon.id === 'ruins') {
      if (state.dungeon.room === 'f2-door' && state.flags.keeperAlive && !state.flags.askedKeeper) inside.unshift({ label: '문지기에게 묻는다', action: { type: 'ask', who: 'keeper' } });
      if (state.dungeon.room === 'f3-bell' && !state.flags.askedBell) inside.unshift({ label: '종에게 묻는다', action: { type: 'ask', who: 'bell' }, disabled: state.flags.bellDay === state.day, why: state.flags.bellDay === state.day ? '오늘은 더 답하지 않는다' : '' });
    }
    if (v.canLeave) inside.push({ label: '밖으로 나간다', action: { type: 'dungeon', op: 'leave' } });
    return inside.slice(0, 5);
  }
  // 말 걸기는 왼쪽 방 목록의 사람 이름을 누른다
  // 쉬기는 밤에만 된다(잠자기·야영). 낮에 피로를 풀려면 주점에서 방을 빌린다
  // 신전의 치료는 낮에만 된다(밤에는 그 자리에 잠자기가 온다)
  const list = placeById(state.place).actions.filter((id) => id !== 'talk' && (id !== 'rest' || state.phase === 2) && (id !== 'heal' || state.phase !== 2)).map((id) => (ACTIONS[id].open ? { label: ACTIONS[id].label, open: ACTIONS[id].open } : { label: ACTIONS[id].label, action: { type: 'act', id } }));
  for (const x of list) {
    if (x.action?.type === 'act' && x.action.id === 'rest') x.label = placeById(state.place).wild ? '야영' : '잠자기';
    if (x.action?.type === 'act' && x.action.id === 'bread' && state.flags.breadDay === state.day) { x.disabled = true; x.why = '오늘은 이미 받았다'; }
    if (x.action?.type === 'act' && x.action.id === 'heal') {
      x.sub = '하루 한 번, 공짜. 생명력이 다 찬다';
      if (state.flags.healDay === state.day) { x.disabled = true; x.why = '오늘은 이미 받았다'; }
    }
    if (x.action?.type === 'act' && x.action.id === 'blessing') {
      const fee = state.shadow > 0 ? blessFee(state) : graceFee(state);
      x.label = `축복받기 (은화 ${fee})`;
      x.sub = state.shadow > 0 ? `그림자 ${state.shadow}겹을 모두 걷는다` : `${GRACE.name}: ${GRACE.text}`;
      if (state.silver < fee) { x.disabled = true; x.why = '은화가 모자란다'; }
    }
    if (x.action?.type === 'act' && x.action.id === 'room') { x.label = `방 빌리기 (은화 ${INN_FEE})`; if (ROOM_BUFFS[state.place]) x.sub = `${ROOM_BUFFS[state.place].name}: ${ROOM_BUFFS[state.place].text}`; if (state.silver < INN_FEE) { x.disabled = true; x.why = '은화가 모자란다'; } }
    if (x.action?.type === 'act' && ACTIONS[x.action.id]?.teach && !knowsWork(state, x.action.id)) x.label = `구경하기 (${ACTIONS[x.action.id].label})`;
    if (x.open === 'sculpt' && !chiselOf(state)) { x.disabled = true; x.why = '조각칼이 없다'; }
  }
  if (state.relic && state.relic.place === state.place) list.push({ label: '유품 찾기', action: { type: 'relic' } });
  // 폐허 입구에서는 안으로 내려갈 수 있다
  for (const d of Object.values(DUNGEONS)) {
    if (d.from !== state.place) continue;
    const short = d.needFlag && !state.flags[d.needFlag];
    list.push({ label: d.id === 'ruins' ? '안으로 내려간다' : `${ro(d.name)} 노를 젓는다`, action: { type: 'dungeon', op: 'enter', id: d.id }, disabled: !!short, why: short ? d.needSay : '' });
  }
  return list;
}

/** 전투의 둘째 칸: 고른 직업 스킬 (T24). */
function quickSlot(state) {
  const open = skillsNow(state).filter((x) => x.open);
  if (!open.length) return { label: '스킬', disabled: true, why: state.job ? '이 직업에는 싸움 스킬이 없습니다' : '직업을 얻으면 쓸 수 있습니다' };
  // 쓸 수 있는 스킬이 둘 이상이면 싸우는 중에 고른다 (사용자 요청). 하나뿐이면 바로 쓴다
  if (open.length > 1) {
    const any = open.some((x) => state.mp >= x.mp);
    return { label: '스킬', open: 'skillpick', sub: `${open.length}가지 가운데 고른다`, disabled: !any, why: any ? '' : '마나가 모자란다' };
  }
  const sk = open[0];
  const short = state.mp < sk.mp;
  return { label: `${sk.name} (마나 ${sk.mp})`, action: { type: 'battle', choice: 'skill', index: sk.id }, disabled: short, why: short ? '마나가 모자란다' : '' };
}

/** 세계 지도에 보일 곳들 (N7). */
export function mapView(state) {
  const here = placeById(state.place);
  const row = (p, name) => {
    const wildId = p.wild ? p.id : here.wild ? here.id : null;
    const locked = !!p.locked && !state.opened.includes(p.opensWith || p.id);
    return {
      locked, lockSay: locked ? p.lockSay : '',
      id: p.id, name, wild: !!p.wild, danger: p.wild ? dangerNow(state, p.id) : '안전', levels: p.levels || '',
      here: p.wild ? here.id === p.id : !here.wild,
      ambush: wildId ? Math.round(DANGER[dangerNow(state, wildId)].ambush * 100) : 0,
      relic: !!state.relic && state.relic.place === p.id,
      alt: p.stripAlt, strip: p.strip,
    };
  };
  return [...TOWN_NAMES.map((t) => ({ ...row(PLACES[TOWNS[t].gate], t), here: !here.wild && here.town === t, town: true })), ...WILD_ORDER.map((id) => row(PLACES[id], PLACES[id].name))];
}

/** 몸 상태 한눈에 (G2-3). */
export function bodyView(state) {
  const weight = totalWeight(state);
  const carry = valueOf(state, 'carry');
  return {
    hp: state.hp, maxHp: valueOf(state, 'maxHp'), mp: state.mp, maxMp: valueOf(state, 'maxMp'),
    full: state.full, xp: state.xp, xpNeed: xpToNext(state.level),
    weight, carry, over: weight > carry,
    hungry: isHungry(state), shadow: state.shadow || 0,
    tired: Math.round(state.tired || 0), tiredOut: isTired(state),
    status: state.status.map((x) => ({ id: x.id, name: STATUS[x.id].name, turns: x.turns, say: STATUS[x.id].say })),
    sense: placeById(state.place).wild ? senseBars(state) : 0,
  };
}

const STANCE_HINTS = {
  hold: { charge: '큰 피해. 방어하면 막고 반격합니다.', wait: '틈입니다.', other: '방어하면 덜 받습니다.' },
  clash: { charge: '큰 피해. 맞받아쳐 이기면 꺾고 칩니다.', wait: '틈입니다. 맞받아치면 그냥 한 대 칩니다.', other: '맞받아쳐 이기면 절반만 받고 방어를 무시해 칩니다.' },
  dodge: { charge: '큰 피해. 피하면 맞지 않습니다.', wait: '틈입니다. 피할 것이 오지 않습니다.', other: '피하면 맞지 않고 다음 공격이 급소에 들어갑니다.' },
  focus: { charge: '큰 피해. 모으는 동안은 그대로 맞습니다.', wait: '틈입니다. 모으기 좋습니다.', other: '모으는 동안은 그대로 맞습니다.' },
};
const stanceHint = (state, kind) => { const h = STANCE_HINTS[stanceOf(state).id] || STANCE_HINTS.hold; return h[kind] || h.other; };

/** 싸우는 상대와 예고된 다음 행동 (E7). */
export function enemyView(state) {
  const b = state.battle;
  if (!b) return null;
  const base = monsterDef(b.mon);
  const m = foeDef(b);
  const move = intentOf(state);
  return {
    fierce: Math.round(((b.fierce || 1) - 1) * 1000) / 10, // 사나움 +n% (Z60)
    id: b.mon, elite: !!b.elite, name: m.name, level: m.level, hp: b.hp, maxHp: m.hp, turn: b.turn, element: m.element || '', boss: !!m.boss, stage: base.phases ? (b.phase || 0) + 1 : 0, stages: base.phases ? base.phases.length + 1 : 0,
    next: move ? { name: move.name, tell: move.tell, kind: move.kind } : null,
    hint: !move ? '' : stanceHint(state, move.kind) + (state.flags.knowsBoar && b.mon === 'boar' && move.kind === 'charge' ? ' (뒷발을 긁으면 온다. 옆으로 비켜라.)' : ''),
  };
}

export { tellChance };
export { choiceView, countOf, craftView, peopleHere, offersOf, jobName, canChooseJob, skillsNow, sculptView, statueOf, roomView, dungeonMap };

export function skillLabel(state, id) {
  const s = state.skills[id];
  return s ? gradeLabel(s.grade) : '안 해 봄';
}

// ── 안에서 쓰는 것 ─────────────────────────────────────────

function variedLine(state, key) {
  const list = ACTION_LINES[key];
  let i = int(state, list.length);
  if (list.length > 1 && i === state.lastLine[key]) i = (i + 1) % list.length;
  state.lastLine[key] = i;
  return list[i];
}

function userName(state) {
  return pick(state, USERS.filter((u) => u !== state.name));
}

function say(state, events, entry) {
  const text = typeof entry === 'string' ? entry : entry.text;
  pushLine(state, events, { k: 'user', who: `지나가던 유저 '${userName(state)}'`, text });
  if (typeof entry !== 'string' && entry.hint) addHint(state, entry.hint);
}

function addHint(state, hint) {
  const list = state.hints[hint.stat] || (state.hints[hint.stat] = []);
  if (!list.includes(hint.text)) {
    list.push(hint.text);
    state.memo = hint.text;
  }
}

/** 배가 꺼진다. 다섯 번 움직일 때마다 1 (농부의 자식은 여덟 번). */
function hunger(state, events, ticks) {
  const per = state.flags.slowHunger ? 8 : 5;
  state.hungerTick += ticks;
  const drop = Math.floor(state.hungerTick / per);
  if (!drop) return;
  state.hungerTick -= drop * per;
  const before = state.full;
  state.full = Math.max(0, before - drop);
  // 굶주림 (Z38): 포만감이 0인데 배가 더 고파지면 그만큼 몸이 상한다
  const empty = Math.max(0, drop - before);
  if (empty > 0) {
    const max = valueOf(state, 'maxHp');
    const hpBefore = state.hp;
    state.hp = Math.max(0, state.hp - empty * Math.max(1, Math.round(max * STARVE_RATE)));
    pushLine(state, events, { k: 'sys', text: `굶주림에 몸이 상한다. 생명력 −${hpBefore - state.hp}.`, tone: 'warn' });
    if (hpBefore > max * 0.5 && state.hp <= max * 0.5 && state.hp > 0) pushLine(state, events, { k: 'sys', text: '생명력이 절반 아래다. 이대로면 굶어 쓰러진다.', tone: 'warn' });
    if (hpBefore > max * 0.2 && state.hp <= max * 0.2 && state.hp > 0) pushLine(state, events, { k: 'sys', text: '눈앞이 하얗다. 다리가 제 것 같지 않다.', tone: 'warn' });
    if (state.hp <= 0) state.flags.starved = true;
  }
  if (before >= 20 && state.full < 20) pushLine(state, events, { k: 'sys', text: '배가 고프다. 힘이 잘 들어가지 않는다.', tone: 'warn' });
  if (before > 0 && state.full === 0) pushLine(state, events, { k: 'sys', text: '배가 등에 붙었다. 무엇이든 먹어야 한다.', tone: 'warn' });
  // 허기 (Z35): 포만감이 5 아래로 1 줄 때마다 쓰러질 수 있다. 0에 붙은 뒤에도 줄 때마다 굴린다
  for (let i = 1; i <= drop && !state.flags.faint; i++) {
    const v = Math.max(0, before - i);
    if (v <= FAINT_AT && roll01(`${state.seed}|faint|${state.day}|${state.phase}|${state.tick}|${i}`) < faintChance(v)) state.flags.faint = true;
  }
}

export const FAINT_AT = 5;
export const HURT_AT = 0.2; // 생명력이 이만큼 아래면 회복 아이템을 저도 모르게 쓴다 (Z56)
export const STARVE_RATE = 0.02; // 포만감 0에서 배가 더 고파질 때마다 최대 생명력의 이만큼
/** 포만감 v가 되는 순간 쓰러질 확률: 5에 4%, 1 줄 때마다 4%씩 (0에 24%). */
export function faintChance(v) {
  return v <= FAINT_AT ? (FAINT_AT + 1 - v) * 0.04 : 0;
}

/** 지금 시각. 아침 06~12시, 낮 12~20시, 밤 20~06시. 한 일마다 조금씩 흐른다. */
const CLOCK = [[6, 6], [12, 8], [20, 10]];
export function clockOf(state) {
  const [start, span] = CLOCK[state.phase];
  const min = Math.floor((start * 60 + (Math.min(state.tick, PHASE_TICKS - 1) / PHASE_TICKS) * span * 60) / 10) * 10 % (24 * 60);
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

const TIRE_DAY = 0.4; // 낮에 한 일 하나의 피로
const TIRE_NIGHT = 1.0; // 밤을 새우며 한 일은 더 무겁다
/** 움직인 만큼 지친다. 잠을 자야 할 밤에 깨어 있으면 더 빨리 쌓인다. */
function tire(state, events, ticks) {
  const before = state.tired || 0;
  const slow = Math.max(0.5, 1 - (state.hidden?.vigil?.value || 0) * 0.03) * (state.flags.slowTire ? 0.9 : 1) * (restBuff(state)?.tire || 1); // 숯쟁이는 더디게 지친다 // 집념: 버텨 본 몸은 더디게 지친다
  state.tired = Math.min(TIRED_MAX, Math.round((before + ticks * (state.phase === 2 ? TIRE_NIGHT : TIRE_DAY) * slow) * 100) / 100);
  if (before < TIRED_AT && state.tired >= TIRED_AT) pushLine(state, events, { k: 'sys', text: '몸이 무겁다. 눈이 자꾸 감긴다. 밤에 자야 풀린다.', tone: 'warn' });
  // 졸음 (Z34): 피로가 90을 넘으면 1 오를 때마다 곯아떨어질 수 있다. 100에 가까울수록 잘 그런다
  for (let n = Math.max(DOZE_AT, Math.floor(before) + 1); n <= Math.floor(state.tired) && n < TIRED_MAX && !state.flags.doze; n++) {
    if (roll01(`${state.seed}|doze|${state.day}|${state.phase}|${state.tick}|${n}`) < dozeChance(n)) state.flags.doze = true;
  }
}

export const DOZE_AT = 90;
/** 피로 n이 되는 순간 곯아떨어질 확률: 90에 2%, 1 오를 때마다 2%씩 (99에 20%). */
export function dozeChance(n) {
  return n >= DOZE_AT ? (n - DOZE_AT + 1) * 0.02 : 0;
}

/** 피로가 끝까지 찼다. 그 자리에서 곯아떨어져 다음 날 아침이 된다. */
function passOut(state, events) {
  const starved = !!state.flags.faint && !state.flags.doze && (state.tired || 0) < TIRED_MAX;
  delete state.flags.doze;
  delete state.flags.faint;
  pushLine(state, events, starved
    ? { k: 'sys', text: '눈앞이 캄캄해졌다. 허기를 못 이기고 그 자리에 쓰러졌다.', tone: 'warn' }
    : { k: 'sys', text: '더는 눈을 뜨고 있을 수 없다. 그 자리에서 곯아떨어졌다.', tone: 'warn' });
  if (placeById(state.place).wild && state.silver > 0) {
    const lost = Math.max(1, Math.floor(state.silver * 0.05));
    state.silver -= lost;
    pushLine(state, events, { k: 'sys', text: `자는 사이 누가 주머니를 뒤졌다. 은화 −${lost}.`, tone: 'warn' });
  }
  state.lastAction = null;
  state.tick = 0;
  do nextPhase(state, events); while (state.phase !== 0);
  // 신전·사당에서 지쳐 잠들면 (Z45): 신전지기가 담요를 덮어 준다. 피로가 다 풀린다
  const holy = !starved && ['temple', 'shrine', 'grandtemple'].includes(state.place);
  state.tired = holy ? 0 : 30;
  if (holy) {
    pushLine(state, events, { k: 'me', text: '눈을 뜨니 아침이다. 누가 담요를 덮어 주었다. 몸이 가볍다.' });
    pushLine(state, events, { k: 'sys', text: '신전의 고요 속에서 푹 잤다. 피로가 다 풀렸다.', tone: 'good' });
  } else pushLine(state, events, { k: 'me', text: '눈을 뜨니 아침이다. 맨바닥에서 잔 몸이 개운하지 않다.' });
  events.push({ type: 'phase' });
}

/** 테스트와 도구가 아무 일 없이 때를 흘릴 때 쓴다. 화면에는 이런 길이 없다. 배는 고파지고 피로는 쌓이지 않는다. */
export function idle(state, ticks) {
  const events = [];
  advance(state, events, ticks, true);
  return events;
}

/**
 * 자연 회복 (Z49): 싸우지 않는 동안 시간이 흐르면 생명력이 조금씩 찬다. 민첩이 높을수록 빨리 찬다(몸이 가볍게 숨을 고른다).
 * 행동 한 번(1틱)에 최대 생명력의 0.1% + 민첩 × 0.02%. 배가 고프면 절반, 굶었으면(포만 0) 차지 않는다.
 */
export const REGEN_BASE = 0.001, REGEN_AGI = 0.0002;
export function regenRate(state) {
  if (state.battle || (state.full || 0) <= 0) return 0;
  const r = REGEN_BASE + (state.stats.agi || 0) * REGEN_AGI;
  return isHungry(state) ? r / 2 : r;
}
function regen(state, ticks) {
  const rate = regenRate(state);
  if (!rate) return;
  const max = valueOf(state, 'maxHp');
  if (state.hp >= max) { state.regen = 0; return; }
  state.regen = (state.regen || 0) + max * rate * ticks;
  const whole = Math.floor(state.regen);
  if (whole > 0) { state.hp = Math.min(max, state.hp + whole); state.regen -= whole; }
}

function advance(state, events, ticks, quiet = false) {
  hunger(state, events, ticks);
  regen(state, ticks);
  if (!quiet) tire(state, events, ticks);
  state.tick += ticks;
  while (state.tick >= PHASE_TICKS) {
    state.tick -= PHASE_TICKS;
    nextPhase(state, events);
  }
}

const CHORE_LEVEL = { '시작 마을': 1, 나루: 6, 소리재: 12 };
const HUNGRY_WORK = 30; // 굶은 날로 치려면 그날 굶은 채 한 일의 수

function nextPhase(state, events) {
  state.phase += 1;
  if (state.flags.legendNight && state.day === 1 && state.phase === 2) {
    delete state.flags.legendNight;
    pushLine(state, events, { k: 'room', text: '종루 쪽에서 아주 작은 울림이 한 번 지나갔다. 아무도 고개를 들지 않았다.' });
  }
  if (state.phase > 2) {
    state.phase = 0;
    state.day += 1;
    // 사나움 (Z60): 백 날마다 한 줄
    if (state.day > 1 && (state.day - 1) % 100 === 0) pushLine(state, events, { k: 'sys', tone: 'warn', text: '들짐승들이 한결 사나워졌다는 말이 돈다.' });
    worldDay(state, events);
    auctionDay(state, events);
    partyDay(state, events);
    // 근성: 굶은 채 '일하며' 넘긴 날만 센다. 누워서 굶기만 한 날은 세지 않는다
    if (state.full === 0 && (state.flags.hungryWork || 0) >= HUNGRY_WORK) state.counters.hungryDays += 1;
    state.flags.hungryWork = 0;
    storeDay(state, events);
    statueDay(state, events);
    if (state.scarecrow.hits >= 300) {
      state.scarecrow.hits = 0;
      if (state.place === 'training') pushLine(state, events, { k: 'room', text: SCARECROW_LINES.fresh });
      events.push({ type: 'art' });
    }
  }
  pushLine(state, events, { k: 'room', text: PHASE_LINES[state.phase] });
  tickFall(state, events);
  events.push({ type: 'phase', day: state.day, phase: state.phase });
}

function afterCounters(state, events) {
  for (const e of checkHidden(state)) {
    const def = hiddenById(e.id);
    if (e.type === 'half') {
      pushLine(state, events, { k: 'sys', text: '무언가 쌓이는 느낌이 든다.' });
    } else if (e.type === 'found') {
      ding(state, events, {
        level: 3, title: `새로운 스탯 ${iGa(`'${e.name}'`)} 생겼습니다`, big: `${e.name} +1`,
        body: `${def.effect}. 행동으로만 오릅니다.`, reason: foundReason(state, e.id),
      });
      state.journal.push({ day: state.day, phase: state.phase, place: state.place, text: foundJournal(state, e.id), note: `${eulReul(e.name)} 얻은 날` });
    } else {
      ding(state, events, { level: 1, title: `${iGa(e.name)} ${iGa(e.value)} 되었습니다`, body: def.effect });
    }
  }
}

function foundReason(state, id) {
  if (id === 'endure') {
    const [actId, n] = Object.entries(state.counters.act).sort((a, b) => b[1] - a[1])[0];
    const what = actId === 'strike' ? '허수아비를' : eulReul(ACTIONS[actId]?.label || SKILL_NAMES[actId] || (actId === 'enhance' ? '강화' : '같은 일'));
    return `${what} ${n}번 ${actId === 'strike' ? '쳤습니다' : '했습니다'}`;
  }
  return '';
}

function foundJournal(state, id) {
  if (id === 'endure') return '오늘도 같은 일만 했다. 삼백 번째에 무언가가 달라졌다. 손바닥은 이제 아프지도 않다.';
  return `${iGa(hiddenById(id).name)} 생겼다. 언제부터 쌓이고 있었는지는 모르겠다.`;
}

// ── 행동 ────────────────────────────────────────────────

/**
 * @param {object} state 고쳐지는 상태
 * @param {{type:'move',to:string}|{type:'act',id:string}} action
 * @param {{chatter?:'low'|'mid'|'high'}} [options]
 * @returns {Array<object>} 일어난 일
 */
export function dispatch(state, action, options = {}) {
  const events = [];
  const t = action.type;
  if (state.flags?.mustRebirth) throw new Error('숨이 끊어졌습니다. 다시 태어나야 합니다');
  if (state.battle && !['battle', 'use', 'equip', 'quick', 'mail'].includes(t) && !(t === 'party' && action.op === 'plan')) throw new Error('싸우는 중입니다');
  if (state.craft && !['hammer', 'reheat', 'craftQuit', 'spend', 'evolve'].includes(t) && !(t === 'choose' && state.choice)) throw new Error('만들던 것을 끝내거나 그만두어야 합니다');
  if (state.sculpt && !['cut', 'sculptQuit', 'spend', 'evolve'].includes(t) && !(t === 'choose' && state.choice)) throw new Error('깎던 것을 끝내거나 그만두어야 합니다');
  if (!state.battle && state.choice && !['choose', 'spend', 'mail'].includes(t)) throw new Error('먼저 정해야 할 것이 있습니다');
  if (state.dungeon && ['boat', 'offer', 'move', 'travel', 'act', 'craft', 'sculpt', 'cook', 'job', 'buy', 'sell', 'deposit', 'withdraw', 'greet', 'talk', 'gift', 'relic', 'rumor', 'auction'].includes(t)) throw new Error('던전 안에서는 할 수 없습니다');
  if (t === 'move') move(state, events, action.to);
  else if (t === 'act') act(state, events, action.id, options);
  else if (t === 'spend') spend(state, events, action.stat);
  else if (t === 'repair') repair(state, events, action.slot ? { slot: action.slot } : { index: action.index });
  else if (t === 'enhance') { enhance(state, events, action.slot ? { slot: action.slot } : { index: action.index }); advance(state, events, 2); }
  else if (t === 'guild') {
    if (state.battle) throw new Error('싸우는 중에는 할 수 없습니다');
    if (state.dungeon) throw new Error('던전 안에서는 할 수 없습니다');
    if (action.op === 'join') joinGuild(state, events, action.id);
    else if (action.op === 'leave') leaveGuild(state, events);
    else if (action.op === 'donate') donate(state, events);
    else throw new Error('모르는 길드 일입니다');
  }
  else if (t === 'drink') drink(state, events, action.npc);
  else if (t === 'learn') askToLearn(state, events, action.npc, bondOfNpc);
  else if (t === 'mail') {
    if (action.op === 'read') readMail(state, action.id);
    else if (action.op === 'take') takeMail(state, events, action.id);
    else throw new Error('모르는 우편 일입니다');
  }
  else if (t === 'bless') {
    if (placeById(state.place).id !== PEOPLE[action.npc]?.place) throw new Error('여기에 없습니다');
    bless(state, events, action.npc);
  }
  else if (t === 'stance') {
    if (!STANCES[action.id]) throw new Error('모르는 태세입니다');
    if (state.battle) throw new Error('싸우는 중에는 태세를 바꿀 수 없습니다');
    state.stance = action.id;
    events.push({ type: 'stance' });
    pushLine(state, events, { k: 'me', text: `싸울 때의 태세를 '${STANCES[action.id].name}'로 잡았다.` });
  }
  else if (t === 'travel') travel(state, events, action.to);
  else if (t === 'choose') { choose(state, events, action.id); advance(state, events, 1); }
  else if (t === 'battle') {
    if (!state.battle) throw new Error('싸우고 있지 않습니다');
    battleAct(state, events, action.choice, action.index);
    advance(state, events, 1);
    watchers(state, events, options);
  } else if (t === 'use') {
    if (state.battle) { battleAct(state, events, 'item', action.index); advance(state, events, 1); }
    else eat(state, events, action.index);
  } else if (t === 'equip' && state.battle) {
    // 싸우는 중에는 무기와 보조만 바꾸고, 한 턴을 쓴다 (G1-3)
    battleAct(state, events, 'swap', action.index);
    advance(state, events, 1);
  } else if (t === 'equip') {
    const item = state.bag[action.index];
    const { old } = equipItem(state, action.index);
    pushLine(state, events, { k: 'me', text: old ? `${eulReul(itemDef(old.id).name)} 벗고 ${eulReul(itemDef(item.id).name)} 찼다.` : `${eulReul(itemDef(item.id).name)} 찼다.` });
    events.push({ type: 'gear' });
  } else if (t === 'unequip') {
    const item = unequipItem(state, action.slot);
    pushLine(state, events, { k: 'me', text: `${eulReul(itemDef(item.id).name)} 벗어 가방에 넣었다.` });
    events.push({ type: 'gear' });
  } else if (t === 'discard') {
    const item = state.bag[action.index];
    const name = item ? itemDef(item.id).name : '';
    const n = action.n || 1;
    discardItem(state, action.index, n);
    pushLine(state, events, { k: 'me', text: `${name} ${n}개를 버렸다.` });
    events.push({ type: 'gear' });
  } else if (t === 'craft') {
    if (!placeById(state.place).actions.includes('craft')) throw new Error('여기에는 화덕이 없습니다');
    startCraft(state, events, action.recipe);
  } else if (t === 'hammer') {
    hammer(state, events, action.late === true);
    advance(state, events, 1);
    offerWork(state, events);
  } else if (t === 'reheat') {
    reheat(state, events);
    advance(state, events, 2);
  } else if (t === 'craftQuit') {
    quitCraft(state, events);
  } else if (t === 'evolve') {
    chooseBranch(state, events, action.skill, action.branch);
  } else if (t === 'forget') {
    forgetBranch(state, events, action.skill);
  } else if (t === 'buy') {
    buy(state, events, action.id);
  } else if (t === 'sell') {
    sell(state, events, action.index, action.n || 1);
  } else if (t === 'deposit') {
    if (action.silver) depositSilver(state, events, action.silver); else deposit(state, events, action.index, action.n || 1);
  } else if (t === 'withdraw') {
    if (action.silver) withdrawSilver(state, events, action.silver); else withdraw(state, events, action.index, action.n || 1);
  } else if (t === 'boat') {
    // 배를 짓는다 (H3-1): 참나무 가지 20, 역청 5, 돛천 2, 품삯 은화 100
    if (!placeById(state.place).actions.includes('boat')) throw new Error('배는 배 짓는 곳에서 짓습니다');
    if (state.flags.boat) throw new Error('이미 배가 있습니다');
    for (const [id, n] of BOAT_NEEDS) if (countOf(state, id) < n) throw new Error(`${iGa(itemDef(id).name)} 모자랍니다 (${countOf(state, id)} / ${n})`);
    if (state.silver < BOAT_FEE) throw new Error(`품삯 은화 ${BOAT_FEE}이 모자랍니다`);
    for (const [id, n] of BOAT_NEEDS) takeById(state, id, n);
    state.silver -= BOAT_FEE;
    state.flags.boat = true;
    pushLine(state, events, { k: 'npc', who: '배 목수', text: '사흘 걸릴 걸 하루에 했네. 자네가 날라 준 나무가 좋았어. 이름은 자네가 붙이게.' });
    ding(state, events, { level: 2, kind: 'boat', title: '배 한 척이 생겼습니다', big: '내 배', body: '나루터에서 가라앉은 배까지 노를 저어 갈 수 있습니다.' });
    advance(state, events, 20);
  } else if (t === 'offer') {
    // 사당에 바친다. 값이 아니라 횟수다
    if (!placeById(state.place).actions.includes('offer')) throw new Error('바칠 곳이 아닙니다');
    if (state.silver < OFFER_FEE) throw new Error(`은화 ${OFFER_FEE}은 있어야 합니다`);
    if (state.flags.offeredDay === state.day) throw new Error('오늘은 이미 바쳤습니다');
    state.flags.offeredDay = state.day;
    state.silver -= OFFER_FEE;
    state.counters.offer += 1;
    state.counters.sendoff += 1;
    pushLine(state, events, { k: 'me', text: `초 한 자루를 사서 켰다. 은화 −${OFFER_FEE}. 강 쪽으로 고개를 숙였다.` });
    advance(state, events, 2);
  } else if (t === 'rumor') {
    if (!placeById(state.place).actions.includes('rumor')) throw new Error('소문 게시판은 주점에 있습니다');
    readRumors(state, events);
    advance(state, events, 1);
  } else if (t === 'auction') {
    if (action.op === 'list') listItem(state, events, action.index, action.start, action.days);
    else if (action.op === 'bid') bid(state, events, action.key, action.amount);
    else throw new Error('모르는 경매 행동입니다');
  } else if (t === 'dungeon') {
    if (action.op === 'enter') { enterDungeon(state, events, action.id); advance(state, events, 2); }
    else if (action.op === 'leave') { leaveDungeon(state, events); advance(state, events, 2); }
    else if (action.op === 'rest') { restInRoom(state, events); advance(state, events, 10); }
    else throw new Error('모르는 던전 행동입니다');
  } else if (t === 'room') {
    moveRoom(state, events, action.to);
    advance(state, events, 2);
  } else if (t === 'sculpt') {
    if (!placeById(state.place).actions.includes('sculpt')) throw new Error('여기서는 깎을 수 없습니다');
    startSculpt(state, events, action.subject);
  } else if (t === 'cut') {
    cut(state, events);
    advance(state, events, 1);
  } else if (t === 'sculptQuit') {
    quitSculpt(state, events);
  } else if (t === 'work') {
    if (action.op === 'admire') { admire(state, events, action.no); advance(state, events, 1); }
    else if (action.op === 'place') placeWork(state, events, action.no);
    else if (action.op === 'sell') sellWork(state, events, action.no);
    else if (action.op === 'gift') giftWork(state, events, action.no, action.npc);
    else if (action.op === 'alive') giveLife(state, events, action.no);
    else throw new Error('모르는 작품 행동입니다');
  } else if (t === 'cook') {
    cook(state, events, action.ids);
    advance(state, events, 3);
  } else if (t === 'party') {
    if (action.op === 'ask') askToJoin(state, events, action.npc);
    else if (action.op === 'hire') hireMerc(state, events);
    else if (action.op === 'dismiss') dismiss(state, events, action.id);
    else if (action.op === 'plan') setPlan(state, events, action.id, action.plan);
    else if (action.op === 'row') setRow(state, events, action.id, action.row);
    else throw new Error('모르는 동료 행동입니다');
  } else if (t === 'ending') {
    // 종 앞에 선다. 숨은 끝의 조건을 채웠으면 고르지 않고 그 끝이 된다
    if (standBeforeBell(state, events) === 'hidden') applyEnding(state, events, 'hidden');
  } else if (t === 'ring') {
    ringFor(state, events, action.k);
    advance(state, events, 1);
  } else if (t === 'advance') {
    chooseAdvance(state, events, action.id);
  } else if (t === 'ask') {
    askTruth(state, events, action.who);
    advance(state, events, 2);
  } else if (t === 'career') {
    if (action.op === 'choose') chooseJob(state, events, action.id);
    else if (action.op === 'skip') skipJob(state, events);
    else throw new Error('모르는 직업 행동입니다');
  } else if (t === 'quick') {
    // 단축 칸에 놓을 직업 스킬을 고른다 (T24)
    if (!skillsNow(state).some((x) => x.id === action.id && x.open)) throw new Error('쓸 수 없는 스킬입니다');
    state.quick = action.id;
    events.push({ type: 'job' });
  } else if (t === 'greet') {
    greet(state, events, action.npc);
  } else if (t === 'talk') {
    talk(state, events, action.npc);
    advance(state, events, 2);
  } else if (t === 'gift') {
    gift(state, events, action.npc, action.index);
    advance(state, events, 1);
  } else if (t === 'job') {
    if (action.op === 'accept') acceptJob(state, events, action.id);
    else if (action.op === 'finish') finishJob(state, events, action.id);
    else if (action.op === 'drop') dropJob(state, events, action.id);
    else throw new Error('모르는 의뢰 행동입니다');
  } else if (t === 'quest') {
    if (action.op === 'accept') acceptSub(state, events, action.id);
    else if (action.op === 'choose') { chooseSub(state, events, action.id, action.choice); advance(state, events, 1); }
    else throw new Error('모르는 퀘스트 행동입니다');
  } else if (t === 'title') {
    wearTitle(state, events, action.id ?? null);
  } else if (t === 'relic') {
    recoverRelic(state, events);
    advance(state, events, 1);
  } else throw new Error('모르는 행동: ' + t);
  clampBody(state);
  afterCounters(state, events);
  noticeEvolve(state, events);
  // 문지기 곁에서 밤을 새웠으면 아침이 된다
  if (events.some((e) => e.type === 'night')) { hunger(state, events, 25); state.tick = 0; while (state.phase !== 0) nextPhase(state, events); }
  const ended = events.find((e) => e.type === 'ending');
  if (ended && state.main.chapter === 5) { state.dingsAtEnd = state.dings.length; finishMain(state, events, ended.id); }
  const bell = dungeonHook(state, events);
  if (bell && state.main.chapter === 2) finishMain(state, events, bell);
  if (state.main.chapter === 4 && state.dungeon?.id === 'ruins' && state.dungeon.room === 'f3-bell' && !state.flags.bellSpoke && foundCount(state) >= 5) {
    state.flags.bellSpoke = true;
    pushLine(state, events, { k: 'room', text: '묻기도 전에 종이 먼저 울었다. 다섯 번. 내가 아무도 모르게 끝까지 해낸 다섯 가지를, 종은 하나씩 불렀다. "봤다." 종은 그렇게 말하고 있었다.' });
  }
  questHook(state, events, action);
  worldHook(state, events, action);
  guildHook(state, events, action);
  clampBody(state);
  // 고된 일을 하나 했다(끝까지 된 것만): 그 방의 행동, 망치질, 칼질, 싸움의 한 턴. 쉬기와 받기만 하는 것은 아니다
  const toiled = (t === 'act' && !ACTIONS[action.id]?.rest && !ACTIONS[action.id]?.open && !ACTIONS[action.id]?.service) || ['hammer', 'cut', 'battle', 'enhance'].includes(t);
  if (toiled) {
    if (isTired(state)) state.counters.tiredWork = (state.counters.tiredWork || 0) + 1; // 집념의 재료
    if (state.full === 0) state.flags.hungryWork = (state.flags.hungryWork || 0) + 1; // 근성의 재료
  }
  afterCounters(state, events);
  memoryHook(state, events, t, action);
  if (t === 'act' && action.id === 'pray') prayShadow(state, events);
  if (!state.battle && !state.dungeon && !state.choice) {
    // 그곳에 맞는 일: 그 방의 행동(쉬기 빼고), 망치질, 칼질, 사고팔기, 요리, 바치기
    const fit = (t === 'act' && !ACTIONS[action.id]?.rest && !ACTIONS[action.id]?.open) || ['hammer', 'cut', 'buy', 'sell', 'cook', 'offer', 'enhance', 'repair'].includes(t);
    if (t === 'move' || t === 'travel') workedHere(state, events, 'enter');
    // 지난 삶에 맡긴 은화 (Z42): 그 마을의 보관함이 있는 곳에 처음 들어서면 주인이 장부를 펼친다
    const here = placeById(state.place);
    if ((t === 'move' || t === 'travel') && here.storage && state.flags.pastBank?.includes(here.town)) {
      state.flags.pastBank = state.flags.pastBank.filter((x) => x !== here.town);
      if (!state.flags.pastBank.length) delete state.flags.pastBank;
      const host = ROOM_HOSTS[here.id]?.[0] || '주인';
      const box = state.store[here.town] || { silver: 0, items: [] };
      const what = [box.silver ? `은화 ${box.silver}` : null, box.items.length ? `물건 ${box.items.length}가지` : null].filter(Boolean).join('과 ');
      pushLine(state, events, { k: 'npc', who: host, text: `얼굴은 처음 보는데, 장부에 네 앞으로 맡긴 것이 있군. ${what}. 보관함에서 찾아가게.` });
    }
    else if (fit) workedHere(state, events, 'fit');
  }
  // 허겁지겁 (Z40): 배가 바닥나거나 허기에 쓰러지려 할 때 가방에 먹을 것이 있으면 저도 모르게 먹는다. 가장 배를 덜 채우는 것부터
  if ((state.full <= 0 || state.flags.faint) && !state.battle && !state.choice && !state.craft && !state.sculpt && !events.some((e) => e.type === 'fall')) {
    const foods = state.bag.map((it, i) => ({ i, def: itemDef(it.id) })).filter((x) => x.def.eat?.full > 0 && !x.def.throw);
    if (foods.length) {
      const pickFood = foods.reduce((a, b) => (b.def.eat.full < a.def.eat.full ? b : a));
      pushLine(state, events, { k: 'sys', text: `너무 배가 고파서 가방 속 ${eulReul(pickFood.def.name)} 허겁지겁 먹었다.`, tone: 'warn' });
      eat(state, events, pickFood.i);
      if (state.full > FAINT_AT) delete state.flags.faint;
    }
  }
  // 아파하며 (Z56): 싸움 밖에서 생명력이 5분의 1 아래로 떨어지면 가방의 회복 아이템(약초·물약)을 저도 모르게 쓴다. 가장 덜 채우는 것부터
  if (state.hp > 0 && state.hp <= valueOf(state, 'maxHp') * HURT_AT && !state.battle && !state.choice && !state.craft && !state.sculpt && !events.some((e) => e.type === 'fall')) {
    const max = valueOf(state, 'maxHp');
    const cures = state.bag.map((it, i) => ({ i, def: itemDef(it.id) })).filter((x) => (x.def.eat?.hp > 0 || x.def.eat?.hpPct > 0) && !x.def.eat.full && !x.def.throw).map((x) => ({ ...x, heal: healOf(state, x.def, max) }));
    if (cures.length) {
      const pickCure = cures.reduce((a, b) => (b.heal < a.heal ? b : a));
      pushLine(state, events, { k: 'sys', text: `너무 아파서 가방 속 ${eulReul(pickCure.def.name)} 꺼내 썼다.`, tone: 'warn' });
      eat(state, events, pickCure.i);
    }
  }
  // 굶어 쓰러진다 (Z38): 싸움 중이면 싸움이 끝난 뒤에. 그사이 생명력이 돌아왔으면 없던 일
  if (state.flags.starved && state.hp > 0) delete state.flags.starved;
  if (state.flags.starved && !state.battle && !state.choice && !state.craft && !state.sculpt && !events.some((e) => e.type === 'fall')) {
    delete state.flags.starved;
    delete state.flags.faint;
    state.dungeon = null;
    const info = fall(state, events, '굶주림을 이기지 못했다.');
    info.starved = true;
    state.full = Math.max(state.full, 20);
    if (info.fate === 'temple') pushLine(state, events, { k: 'npc', who: '신전지기', text: '굶어서 쓰러졌더군. 묽은 죽이라도 먹고 가게.' });
  }
  if (state.flags.doze && (state.tired || 0) < DOZE_AT) delete state.flags.doze; // 그사이 쉬었다
  if (state.flags.faint && (state.full > FAINT_AT || !(toiled || t === 'move' || t === 'travel'))) delete state.flags.faint; // 그사이 먹었거나, 누워 쉬던 참이다
  if (((state.tired || 0) >= TIRED_MAX || state.flags.doze || state.flags.faint) && !state.battle && !state.choice && !state.dungeon && !state.craft && !state.sculpt && !events.some((e) => e.type === 'fall')) passOut(state, events);
  return events;
}

/** 싸움이 끝나면 구경하던 유저가 한마디 한다 (E9). */
function watchers(state, events, options) {
  const end = events.find((e) => e.type === 'battle' && (e.phase === 'win' || e.phase === 'fled'));
  if (!end || state.place === 'temple' || usersHere(state) < 1) return;
  const rate = { low: 0.15, mid: 0.35, high: 0.6 }[options.chatter || 'mid'];
  if (!chance(state, rate)) return;
  say(state, events, pick(state, BATTLE_CHATTER[end.phase]));
}

/** 세계에서 처음인 일을 했는지 본다 (Q1-4, N6-6). 소문의 재료가 되는 나날도 적는다. */
function worldHook(state, events, action) {
  trackDay(state, action);
  for (const id of ['endure', 'craft', 'art', 'kind']) if ((state.hidden[id]?.value || 0) > 0) claim(state, events, `stat:${id}`);
  for (const id of ['favor', 'riverbed']) if (state.hq[id]) claim(state, events, `hq:${id}`);
  if (state.hjobs.oneway === 'taken') claim(state, events, 'job:oneway');
  if (state.dmem.ruins?.keeper) claim(state, events, 'boss:gatekeeper');
  if (events.some((e) => e.type === 'sculpt' && e.phase === 'done' && e.grade === 4)) claim(state, events, 'work:great');
  if (events.some((e) => e.type === 'craft' && e.phase === 'done' && e.grade === 4)) {
    claim(state, events, 'craft:legend');
    grantTitle(state, events, 'legend', '전설 등급을 손으로 두드려 냈습니다');
  }
}

/** 서고에서 기록을 찾는다 (메인 4장, 기록의 길). 한 번에 선반 하나. 감정 숙련도가 오른다. */
function search(state, events) {
  const n = (state.flags.archive = (state.flags.archive || 0) + 1);
  state.counters.act.search = (state.counters.act.search || 0) + 1;
  state.counters.appraise += 1;
  const repeated = state.lastAction === 'search';
  state.lastAction = 'search';
  const skill = state.skills.appraise || (state.skills.appraise = emptySkill());
  const up = useSkill(skill, 6, jobXp(state, 'appraise', repeated) * (state.flags.fastSearch ? 2 : 1));
  pushLine(state, events, { k: 'me', text: SEARCH_LINES[int(state, SEARCH_LINES.length)] });
  if (SEARCH_MARKS[n] && state.main.chapter >= 4) pushLine(state, events, { k: 'room', who: '기록', text: SEARCH_MARKS[n] });
  else if (SEARCH_MARKS[n]) pushLine(state, events, { k: 'room', text: '무언가의 한 쪽을 찾았다. 아직은 무슨 뜻인지 모르겠다.' });
  if (up.leveled) ding(state, events, { level: up.rankUp ? 2 : 1, title: `${SKILL_NAMES.appraise} 숙련도가 ${iGa(gradeLabel(up.grade))} 되었습니다` });
}

/** 메인 4장: 문지기와 종에게 묻는다. 던전 안, 그 방에서만 된다. */
function askTruth(state, events, who) {
  if (state.main.chapter !== 4) throw new Error('아직 물을 것이 없습니다');
  const room = state.dungeon?.id === 'ruins' ? state.dungeon.room : null;
  if (who === 'keeper') {
    if (room !== 'f2-door') throw new Error('문지기는 폐허 지하 2층의 큰 문 앞에 있습니다');
    if (!state.flags.keeperAlive) throw new Error('문지기는 이제 없습니다');
    state.flags.askedKeeper = true;
    pushLine(state, events, { k: 'me', text: '"네 주인은 무엇을 지키라고 했어?"' });
    pushLine(state, events, { k: 'room', text: '문지기가 처음으로 입을 연다. 쇠 갈리는 목소리다. "답을. 끝까지 한 이에게 주는 답을. 주인은 그것이 거저 주어지면 안 된다고 했다. 그래서 문을 두었다."' });
    return;
  }
  if (who === 'bell') {
    if (room !== 'f3-bell') throw new Error('종은 폐허 맨 아래층에 있습니다');
    if (state.flags.bellDay === state.day) throw new Error('오늘은 종이 더 답하지 않습니다');
    state.flags.bellDay = state.day;
    const need = Math.round(statChance(state, { stat: 'wis', need: 14 }) * 100);
    const roll = 1 + int(state, 100);
    const ok = roll <= need;
    pushLine(state, events, { k: 'me', text: '금에 손을 대고 물었다. "너는 누구에게 답해 온 거야?"' });
    pushLine(state, events, { k: 'sys', who: '판정', text: `알아듣기 ${ok ? '성공' : '실패'}. 주사위 ${roll}, ${need} 이하면 성공. (지혜 ${state.stats.wis})` });
    events.push({ type: 'check', kind: 'listen', ok, roll, need });
    if (ok) { state.flags.askedBell = true; pushLine(state, events, { k: 'room', text: '종이 울었다. 띠링이 아니라 말처럼 들렸다. 끝까지 한 사람들의 이름이, 천 년 치가, 한꺼번에.' }); }
    else pushLine(state, events, { k: 'room', text: '종이 울었다. 무슨 말인지 알아듣지 못했다. 내일 다시 물을 수 있다.' });
    return;
  }
  throw new Error('물을 수 없는 상대입니다');
}

/** 숙련도가 중급에 닿은 스킬이 있으면 갈림길을 한 번 알린다 (N4-1). */
function noticeEvolve(state, events) {
  for (const id of pendingEvolves(state)) {
    if (state.evolveSeen[id]) continue;
    state.evolveSeen[id] = true;
    pushLine(state, events, { k: 'sys', text: `${SKILL_NAMES[id]}의 갈림길에 섰다. 갈래 둘 가운데 하나를 고를 수 있다. 나중에 스킬창에서 골라도 된다.` });
    events.push({ type: 'evolve', skill: id });
  }
}

/** 대장간에서 몇 자루 만들고 나면 주인이 일을 권한다 (T7). */
function offerWork(state, events) {
  if (state.craft || state.work || state.choice || state.battle) return;
  if (state.place !== 'forge' || state.made < state.workAsk) return;
  state.choice = { kind: 'offer', job: 'smith' };
  pushLine(state, events, { k: 'npc', who: '대장간 주인', text: '망치 쥐는 손이 나쁘지 않아. 여기서 일해 볼 텐가. 화덕은 얼마든지 써도 좋네.' });
  events.push({ type: 'choice' });
}

function clampBody(state) {
  state.hp = Math.min(state.hp, valueOf(state, 'maxHp'));
  state.mp = Math.min(state.mp, valueOf(state, 'maxMp'));
}

/** 남은 스탯 점수 하나를 쓴다. 히든 스탯에는 쓸 수 없다 (Q6-3). */
function spend(state, events, stat) {
  if (!(stat in state.stats)) throw new Error('점수로 올릴 수 없는 스탯입니다');
  if (state.unspent <= 0) throw new Error('남은 점수가 없습니다');
  state.unspent -= 1;
  state.stats[stat] += 1;
  if (stat === 'con') state.hp += 5; // 최대 생명력이 는 만큼 채워 준다
  if (stat === 'wis') state.mp += 3;
  events.push({ type: 'stat', stat });
}

function move(state, events, to) {
  const from = placeById(state.place);
  const dest = placeById(to);
  if (dest.id === from.id) return;
  if (dest.town !== from.town) throw new Error('거기로는 아직 갈 수 없습니다');
  if (dest.needFaction && standingOf(state, dest.needFaction[0]) < dest.needFaction[1]) throw new Error(`${eunNeun(dest.name)} 낯이 익어야 들어갑니다 (뒷골목과 '낯익음' 이상)`);
  if (dest.nightOnly && state.phase !== 2) throw new Error(`${eunNeun(dest.name)} 밤에만 열립니다`);
  pushLine(state, events, { k: 'me', text: `${ro(dest.name)} 갔다.` });
  advance(state, events, MOVE_TICKS);
  arrive(state, events, dest);
}

function arrive(state, events, dest) {
  state.place = dest.id;
  state.lastAction = null;
  const statue = dest.id === 'plaza' ? statueOf(state) : null;
  pushLine(state, events, { k: 'room', text: statue ? `분수 옆 받침대에 내가 깎은 ${statue.name}이 서 있다. 사람들이 오가며 그 앞에서 걸음을 늦춘다.` : dest.room });
  if (dest.id === 'training' && !state.flags.gotSword) {
    state.flags.gotSword = true;
    const sword = makeItem('woodsword');
    pushLine(state, events, { k: 'npc', who: '교관', text: '맨손으로 칠 셈이냐. 이거 받아라.' });
    if (state.equip.weapon) state.bag.push(sword); else state.equip.weapon = sword;
    pushLine(state, events, { k: 'sys', text: '낡은 목검을 받았다.' });
  }
  if (state.relic && state.relic.place === dest.id) pushLine(state, events, { k: 'sys', text: '쓰러졌던 자리에 두고 간 것이 아직 있다.' });
  events.push({ type: 'move', to: dest.id });
}

/** 지도에서 길을 나선다 (N7). 반나절이 걸리고, 가는 길에 습격당할 수 있다 (R2-3). */
function travel(state, events, to) {
  const from = placeById(state.place);
  const dest = placeById(to);
  if (dest.town === from.town) throw new Error('같은 곳 안에서는 방 목록으로 옮깁니다');
  if (!dest.wild && !isGate(dest.id)) throw new Error('마을로는 그 마을의 어귀로 들어갑니다');
  if (dest.locked && !state.opened.includes(dest.opensWith || dest.id)) throw new Error('아직 길을 모릅니다');
  const over = totalWeight(state) > valueOf(state, 'carry');
  pushLine(state, events, { k: 'me', text: `${ro(dest.wild ? dest.name : dest.town)} 길을 나섰다.${over ? ' 짐이 무거워 걸음이 더디다.' : ''}` });
  advance(state, events, Math.round(TRAVEL_TICKS * (over ? 1.5 : 1)));
  const wildId = dest.wild ? dest.id : from.wild ? from.id : null;
  if (wildId) {
    const p = adv(state).noAmbush || state.flags.noAmbush ? 0 : DANGER[dangerNow(state, wildId)].ambush - (state.hidden.kind?.value || 0) * 0.01 - (state.flags.calmBeasts ? 0.05 : 0);
    if (chance(state, Math.max(0, p))) {
      const monId = weighted(state, WILDS[wildId].monsters).id;
      if (state.level < monsterDef(monId).level + 5) {
        if (dest.wild) arrive(state, events, dest);
        pushLine(state, events, { k: 'room', text: '길에서 무언가 덮쳤다.' });
        const seen = state.dex.mon[monId] || (state.dex.mon[monId] = { seen: 0, won: 0, lost: 0 });
        seen.seen = (seen.seen || 0) + 1;
        startBattle(state, events, monId, { ambush: true });
        return;
      }
    }
  }
  arrive(state, events, dest);
}

function act(state, events, id, options) {
  const def = ACTIONS[id];
  if (!def || !placeById(state.place).actions.includes(id)) throw new Error('여기서는 할 수 없는 일입니다');
  if (def.rest) return rest(state, events);
  if (def.open) throw new Error('창에서 하는 일입니다');
  if (def.special === 'room') return rentRoom(state, events);
  if (def.special === 'heal') return templeHeal(state, events, def);
  if (def.special === 'blessing') { state.lastAction = null; return blessingHere(state, events, giveGrace); }
  // 남의 일터의 일은 배워야 한다. 모르면 곁에서 구경한다 (Z29)
  if (def.teach && !knowsWork(state, id)) { watchWork(state, events, id); state.lastAction = null; advance(state, events, def.ticks); return; }
  if (def.special === 'bread') {
    if (state.flags.breadDay === state.day) throw new Error('오늘은 이미 받았습니다. 빵은 하루에 하나입니다');
    state.flags.breadDay = state.day;
    const loaves = state.flags.bread2 ? 2 : 1; // 순례자는 어느 문에서 빵이 나오는지 안다
    addItem(state, 'bread', loaves);
    pushLine(state, events, { k: 'npc', who: '신전지기', text: loaves > 1 ? '"먼 길 온 이에게는 하나 더."' : '"배고픈 이는 누구든 하나씩."' });
    pushLine(state, events, { k: 'sys', text: `신전의 빵 ${loaves}개를 받았다.` });
    events.push({ type: 'bag' });
    advance(state, events, def.ticks);
    return;
  }
  if (def.special === 'search') { search(state, events); advance(state, events, def.ticks); return; }
  if (def.wild) {
    if (def.wild === 'explore') explore(state, events);
    else gather(state, events);
    advance(state, events, def.ticks + (def.wild === 'gather' ? branchOf(state, def.skill)?.ticks || 0 : 0));
    return;
  }

  const count = (state.counters.act[id] = (state.counters.act[id] || 0) + 1);
  const repeated = state.lastAction === id;
  state.lastAction = id;

  if (id === 'strike') strike(state, events, count);
  else pushLine(state, events, { k: 'me', text: variedLine(state, id) });

  if (def.skill) {
    const skill = state.skills[def.skill] || (state.skills[def.skill] = emptySkill());
    const endure = state.hidden.endure?.value || 0;
    // 곳마다 하는 일은 그곳의 수준이 어려움이다(먼 마을일수록 많이 오른다)
    const difficulty = def.chore ? (CHORE_LEVEL[placeById(state.place).town] ?? 1) : def.difficulty;
    const result = useSkill(skill, difficulty, (repeated ? 1 + endure * 0.01 + (hasTitle(state, 'scarecrow') ? 0.02 : 0) : 1) * jobXp(state, def.skill, repeated));
    if (result.leveled) {
      ding(state, events, {
        level: result.rankUp ? 2 : 1,
        title: `${SKILL_NAMES[def.skill]} 숙련도가 ${iGa(gradeLabel(result.grade))} 되었습니다`,
      });
    }
  }

  afterCounters(state, events);
  chatter(state, events, id, count, options);
  advance(state, events, def.ticks);
}

function strike(state, events, count) {
  const burst = state.scarecrow.hits >= 300;
  let text = variedLine(state, burst ? 'strikeBurst' : 'strike');
  if (!burst && COUNT_WORDS[count]) text = `허수아비를 쳤다. ${COUNT_WORDS[count]}`;
  pushLine(state, events, { k: 'me', text });
  if (burst) return;
  state.scarecrow.hits += 1;
  const hits = state.scarecrow.hits;
  if (SCARECROW_LINES[hits]) {
    pushLine(state, events, { k: 'room', text: SCARECROW_LINES[hits] });
    events.push({ type: 'art' });
  }
}

const INN_FEE = 10; // 방 빌리는 값

/** 들판에서 쉬거나 자는 사이 덮치는가. 덮치면 싸움이 시작된다. */
function ambushedAtRest(state, events, weight) {
  const here = placeById(state.place);
  if (!here.wild || !WILDS[here.id]) return false;
  const p = adv(state).noAmbush || state.flags.noAmbush ? 0 : DANGER[dangerNow(state, here.id)].ambush * weight - (state.hidden.kind?.value || 0) * 0.01 - (state.flags.calmBeasts ? 0.05 : 0);
  if (!chance(state, Math.max(0, p))) return false;
  const monId = weighted(state, WILDS[here.id].monsters).id;
  if (state.level >= monsterDef(monId).level + 5) return false;
  pushLine(state, events, { k: 'room', text: '쉬는 사이 무언가 다가왔다.' });
  const seen = state.dex.mon[monId] || (state.dex.mon[monId] = { seen: 0, won: 0, lost: 0 });
  seen.seen = (seen.seen || 0) + 1;
  startBattle(state, events, monId, { ambush: true });
  return true;
}

/** 신전·사당의 치료 (Z50): 하루 한 번 공짜로 생명력을 다 채우고 피가 나거나 독이 든 것을 멎게 한다. 낮에만. */
const HEALERS = { temple: '신전지기', shrine: '사당지기', grandtemple: '대사제' };
function templeHeal(state, events, def) {
  if (state.phase === 2) throw new Error('밤에는 치료를 하지 않는다');
  if (state.flags.healDay === state.day) throw new Error('오늘은 이미 치료를 받았습니다');
  state.flags.healDay = state.day;
  state.lastAction = null;
  const max = valueOf(state, 'maxHp');
  const before = state.hp;
  state.hp = max;
  state.status = [];
  pushLine(state, events, { k: 'npc', who: HEALERS[state.place] || '신전지기', text: '앉게. 어디 보자.' });
  pushLine(state, events, { k: 'sys', tone: 'good', text: `상처를 돌봐 주었다. 생명력 +${max - before}.` });
  advance(state, events, def.ticks);
}

/** 방을 빌려 제대로 잔다. 낮에도 된다. 생명력·마나가 다 차고 피로가 풀린다. 밤이면 아침까지, 낮이면 다음 때까지. */
function rentRoom(state, events) {
  if (state.silver < INN_FEE) throw new Error(`은화 ${INN_FEE}은 있어야 합니다`);
  state.silver -= INN_FEE;
  state.lastAction = null;
  pushLine(state, events, { k: 'me', text: `은화 ${INN_FEE}을 내고 방을 빌렸다. 문을 닫고 누웠다.` });
  hunger(state, events, 25);
  state.hp = valueOf(state, 'maxHp');
  state.mp = valueOf(state, 'maxMp');
  state.tired = 0;
  partyRest(state);
  state.tick = 0;
  nextPhase(state, events);
  pushLine(state, events, { k: 'sys', text: '푹 잤다. 생명력과 마나가 다 찼고 피로가 풀렸다.' });
  // 잘 잔 몸 (Z41)
  const b = giveRoomBuff(state, state.place);
  if (b) {
    state.hp = valueOf(state, 'maxHp');
    pushLine(state, events, { k: 'sys', tone: 'mint', text: `잘 잔 몸: ${b.name}. ${b.text}. ${b.until.phase === 2 ? '밤이 되기 전까지' : b.until.phase === 0 ? '다음 날 아침까지' : '다음 날 낮까지'}.` });
    const host = ROOM_HOSTS[state.place];
    if (host) pushLine(state, events, { k: 'npc', who: host[0], text: host[1] });
  }
}
const ROOM_HOSTS = {
  tavern: ['주점 주인', '잘 잤나. 우리 집 이불은 해 냄새가 나지.'],
  inn: ['주막 주인', '아랫목 덕 봤지? 뱃사람들은 그 맛에 여기 와.'],
  innrow: ['여인숙 주인', '깃털 이불이야. 머리가 맑아질 거야.'],
};

function rest(state, events) {
  if (state.phase !== 2) throw new Error('잠은 밤에 잔다. 낮에는 주점에서 방을 빌린다');
  const rough = !!placeById(state.place).wild;
  pushLine(state, events, { k: 'me', text: rough ? '바람을 막을 만한 데를 찾아 웅크렸다.' : '자리를 펴고 누웠다. 눈을 감자마자 잠이 들었다.' });
  state.lastAction = null;
  if (rough && ambushedAtRest(state, events, 2)) return; // 자는 사이에는 낮보다 두 배로 잘 덮친다
  state.tired = rough ? Math.min(state.tired || 0, 25) : 0;
  hunger(state, events, 25);
  const max = valueOf(state, 'maxHp');
  const before = state.hp;
  state.hp = Math.min(max, state.hp + Math.round(max * ((state.full > 0 ? 0.4 : 0.1) + (hasTitle(state, 'survivor') ? 0.1 : 0))));
  state.mp = valueOf(state, 'maxMp');
  partyRest(state);
  if (state.hp > before) pushLine(state, events, { k: 'sys', text: `생명력 +${state.hp - before}.${state.full > 0 ? '' : ' 배가 고파 잘 낫지 않는다.'}` });
  state.tick = 0;
  nextPhase(state, events);
  pushLine(state, events, { k: 'sys', text: rough ? '맨바닥에서 잤다. 몸이 다 풀리지는 않았다.' : '푹 잤다. 피로가 풀렸다.' });
}

function chatter(state, events, id, count, options) {
  if (id === 'strike' && state.place === 'training') {
    // 횟수에 맞춘 잡담은 방에 아무도 없으면 미뤄 두었다가, 누가 들어오면 그때 한다.
    const fixed = STRIKE_CHATTER.find((c) => c.at === count);
    if (fixed) state.pendingChatter.push(fixed);
    if (INSTRUCTOR[count]) pushLine(state, events, { ...INSTRUCTOR[count] });
    if (count === 300) state.pendingChatter.push(pick(state, AFTER_ENDURE_CHATTER));
    if (state.pendingChatter.length && usersHere(state) > 0) {
      say(state, events, state.pendingChatter.shift());
      return;
    }
    if (INSTRUCTOR[count]) return;
  }
  const rate = CHATTER_RATE[options.chatter || 'mid'];
  // 4장 동안은 어디서나 띠링 이야기가 섞인다 (H4-3)
  if (state.main.chapter === 4 && usersHere(state) > 0 && chance(state, rate * 2)) { say(state, events, pick(state, FAINT_CHATTER)); return; }
  const pool = AMBIENT_CHATTER[state.place] || [];
  if (pool.length && usersHere(state) > 0 && chance(state, rate)) {
    const fresh = pool.filter((c) => !state.seenChatter.includes(typeof c === 'string' ? c : c.text));
    const entry = pick(state, fresh.length ? fresh : pool);
    const text = typeof entry === 'string' ? entry : entry.text;
    if (!state.seenChatter.includes(text)) state.seenChatter.push(text);
    if (state.seenChatter.length >= pool.length) state.seenChatter = [];
    say(state, events, entry);
  }
}
