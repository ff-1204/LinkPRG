// 게임 규칙의 본체. 화면을 모른다. 상태(state)는 그대로 저장되는 순수한 값이다.
// dispatch(state, action, options)가 상태를 고치고, 그 사이 일어난 일(events)을 돌려준다.

import { seedFrom, pick, chance, int, roll01, cidFrom } from './rng.js?v=2134347';
import { emptySkill, useSkill, gradeLabel, SKILL_NAMES } from './skills.js?v=2134347';
import { emptyCounters, checkHidden, hiddenById } from './hidden.js?v=2134347';
import { iGa, eulReul, ro, eunNeun } from './ko.js?v=2134347';
import { pushLine, ding } from './log.js?v=2134347';
import { SAVE_VERSION, bodyFields, makerFields, townFields, jobFields, artFields, dungeonFields } from './migrate.js?v=2134347';
import { enterDungeon, leaveDungeon, moveRoom, restInRoom, roomView, dungeonMap, dungeonHook } from './dungeon.js?v=2134347';
import { finishMain, persuadeHansol, persuadeSlot, buyShard, turnWeighers, shardSlots, redoChapter, hangBlade, quenchFire, ashSlots, pumpGoal, emberScoop, emberMove, sunkenSlots, offerBronze, patrolStep, ledgerScoop, cloudSlots, standAtDoor, herdStep } from './quests.js?v=2134347';
import { SUNKEN, SUNKEN_LINES, sunkenFields, inSunken, underwater, breathOf, breathMax, breathView, breathMove, fillBreath, useAirbag, digTrouble, escortEnd, escorts, chestsLeft, chestsOpened, openChest } from './sunken.js?v=2134347';
import { relievedPosts } from './dungeon.js?v=2134347';
import { grantXp as giveXp } from './reward.js?v=2134347';
import { HANSOL_FIRST, YUGYEOM_FIRST, DARAE_FIRST, BELLOWS_KNACK } from '../data/quests.js?v=2134347';
import { worldFields, auctionFields, endingFields } from './migrate.js?v=2134347';
import { standBeforeBell, applyEnding, ringFor } from './ending.js?v=2134347';
import { worldDay, trackDay, claim, readRumors, usersInBand } from './world.js?v=2134347';
import { FIRSTS } from '../data/world.js?v=2134347';
import { listItem, bid, auctionDay } from './auction.js?v=2134347';
import { grantTitle } from './social.js?v=2134347';
import { startSculpt, cut, quitSculpt, sculptView, admire, placeWork, unplaceWork, sellWork, giftWork, statueOf, statueDay } from './sculpt.js?v=2134347';
import { cook } from './cook.js?v=2134347';
import { askToJoin, hireMerc, giveLife, dismiss, setPlan, setRow, partyDay, partyRest, mercsStay } from './party.js?v=2134347';
import { chooseJob, skipJob, skillsNow, jobXp, jobName, canChooseJob, chooseAdvance, adv } from './jobs.js?v=2134347';
import { standingOf } from './factions.js?v=2134347';
import { SEARCH_LINES, SEARCH_MARKS, SEARCH_NEED, FAINT_CHATTER } from '../data/lines.js?v=2134347';
import { foundCount } from './hidden.js?v=2134347';
import { tellChance, statChance } from './dungeon.js?v=2134347';
import { greet, talk, gift, wearTitle, peopleHere, workedHere } from './social.js?v=2134347';
import { acceptJob, finishJob, dropJob, acceptSub, chooseSub, questHook, offersOf } from './quests.js?v=2134347';
import { startCraft, hammer, reheat, quitCraft, craftView } from './craft.js?v=2134347';
import { RECIPES } from '../data/recipes.js?v=2134347';
import { chooseBranch, forgetBranch, pendingEvolves, branchOf } from './evolve.js?v=2134347';
import { buy, sell, sellMany, deposit, withdraw, depositSilver, withdrawSilver, storeDay } from './trade.js?v=2134347';
import { valueOf, isHungry, isTired, TIRED_AT, TIRED_MAX } from './derived.js?v=2134347';
/** 기도 한 번에 돌아오는 생명력 (Z100, 사용자 요청). */
export const PRAY_HEAL = 1;
import { chiselOf } from './sculpt.js?v=2134347';
import { START_SCENES } from '../data/scenes.js?v=2134347';
import { PEOPLE } from '../data/people.js?v=2134347';
import { ORIGIN_GRADES } from '../data/origins.js?v=2134347';
import { memoryHook, chooseMemory } from './memories.js?v=2134347';
import { knowsWork, watchWork, askToLearn, nativeWork } from './work.js?v=2134347';
import { bondOf as bondOfNpc } from './social.js?v=2134347';
import { drink } from './social.js?v=2134347';
import { makeItem, equip as equipItem, unequip as unequipItem, discard as discardItem, totalWeight, countOf } from './inventory.js?v=2134347';
import { xpToNext } from './level.js?v=2134347';
import { tickFall, recoverRelic, bless, prayShadow, fall, blessingHere, blessFee, graceFee } from './fall.js?v=2134347';
import { applyCarry, rebirthCarry } from './rebirth.js?v=2134347';
import { hasTitle } from './titles.js?v=2134347';
import { deliverMail, readMail, takeMail } from './mail.js?v=2134347';
import { restBuff, giveRoomBuff, ROOM_BUFFS, giveGrace, GRACE } from './buffs.js?v=2134347';
import { startBattle, dozeInBattle, battleAct, fleeChance, intentOf, eat, healOf, weighted, STANCES, stanceOf, foeDef } from './battle.js?v=2134347';
import { repair, enhance } from './gear.js?v=2134347';
import { joinGuild, leaveGuild, donate, guildHook } from './guild.js?v=2134347';
import { explore, gather, choose, choiceView, dangerNow, senseBars, predatorComes, fadeScent } from './explore.js?v=2134347';
import { monsterDef, STATUS } from '../data/monsters.js?v=2134347';
import { itemDef } from '../data/items.js?v=2134347';
import { WILDS, DANGER, TRAVEL_TICKS } from '../data/wild.js?v=2134347';
import { INTEREST_WORK, bandOfPlace } from '../data/bands.js?v=2134347';
import { coldMove, coldView, coldTire, lightTorch, inWhite, coldFields, COLD_LINES, WARM_MAX, COLD } from './cold.js?v=2134347';
import { buildStats, originById } from '../data/origins.js?v=2134347';
import { ACTIONS, PLACES, PHASES, PHASE_TICKS, MOVE_TICKS, WILD_ORDER, TOWNS, TOWN_NAMES, WHITE_GATE, SALT_ROAD, SALT_GATE, ASH_ROAD, ASH_GATE, MARSH_ROAD, MARSH_GATE, SUNKEN_ROAD, SUNKEN_GATE, CLOUD_ROAD, CLOUD_GATE, POND_ROAD, POND_GATE, ANVIL_ROAD, ANVIL_GATE, isGate, placeById } from '../data/places.js?v=2134347';
import { notePromo } from './after.js?v=2134347';
import { ANVIL, ANVIL_LINES, anvilFields, inAnvil, forged, temperView, building, shelled, hammerGain, liftHammer, openCarve, applyAnvilEnd, anvilSlots } from './anvil.js?v=2134347';
import { CLOUD, CLOUD_LINES, inCloud, windNow, windView, windLine, lookFlag } from './cloud.js?v=2134347';
import { POND, POND_LINES, inPond, daonFirst, pondFields, watchSlot, witness, saySaw, sitBeside, mirrored, readView, sameSub, answeredPeople, hangBell, bellsHung, relayTalk, guardStep, pondSlots, doneMark, sawAnswer, SHARDS } from './pond.js?v=2134347';
import { drumBuff } from './buffs.js?v=2134347';
import { CARAVAN, caravanFields, caravanOffered, buyCaravan, sendLoad, caravanWork, caravanDay, caravanView, hearRumor } from './caravan.js?v=2134347';
import { MARSH, MARSH_LINES, marshFields, marshOf, inMarsh, curseOf, curseView, prayCurse, lostInFog, lightLamp, lampMove, tieKnot, knotsHere } from './marsh.js?v=2134347';
import { SHOP, shopOffered, lookShop, buyShop, hireHand, hireOffer, setJob, putOnShelf, takeFromShelf, shopWork, shopDay, workshopView, stageNow } from './workshop.js?v=2134347';
import { SURYEON_FIRST, MOSS, MOSS_LINES, HANBYEOL_FIRST, ECHO, GOYO_FIRST } from '../data/quests.js?v=2134347';
import { offerHidden } from './quests.js?v=2134347';
import { marketHint, pricesView } from './trade.js?v=2134347';
import { STALL, buyStall, putOnStall, takeFromStall, stallWork, stallDay, stallView, stallOffered } from './stall.js?v=2134347';
import { thirstMove, thirstView, thirstFields, useWell, drink as drinkWater, seekWell, wellFound, THIRST, THIRST_LINES, WATER_MAX } from './thirst.js?v=2134347';
import { DUNGEONS } from '../data/dungeon.js?v=2134347';
import { heatMove, heatView, heatWin, useWhetstone, whetTarget, ashFields, inAsh, HEAT, HEAT_LINES } from './heat.js?v=2134347';
import { startDuel, watchDuel, arenaHook, arenaView, judgeSays, pumped, ARENA } from './arena.js?v=2134347';
import { takeById, addItem } from './inventory.js?v=2134347';
import {
  ACTION_LINES, COUNT_WORDS, PHASE_LINES, INSTRUCTOR, SCARECROW_LINES, USERS,
  STRIKE_CHATTER, AFTER_ENDURE_CHATTER, AMBIENT_CHATTER, START_JOURNAL, BATTLE_CHATTER,
} from '../data/lines.js?v=2134347';

export { SAVE_VERSION };
export { LOG_KEEP } from './log.js?v=2134347';

/** 띠링의 귀한 정도 다섯 (G4-6). */
export const DING_LEVELS = ['', '흔함', '귀함', '아주 귀함', '가장 귀함', '세계 최초'];
const CHATTER_RATE = { low: 0.01, mid: 0.03, high: 0.07 };

/** 새 게임을 만든다. */
export function createGame({ name, origin, spent, seed, rolled, carry, cid }) {
  const trimmed = String(name || '').trim();
  if (!trimmed) throw new Error('이름을 적어 주세요');
  if (trimmed.length > 12) throw new Error('이름은 열두 자까지입니다');
  const o = originById(origin);
  if (!o) throw new Error('출신을 골라 주세요');
  const { stats, unspent } = buildStats(origin, spent, rolled); // rolled: 주사위로 굴린 스탯 (만들기 화면)
  const state = {
    v: SAVE_VERSION,
    // 캐릭터 표 (Z96): 드라이브와 맞출 때 같은 캐릭터인지 본다. 화면이 새 표를 넘겨주고, 다시 태어난 삶은 지난 삶의 표를 잇는다
    cid: carry?.cid || cid || cidFrom(`${seed ?? `${trimmed}-${origin}`}|${trimmed}|${origin}`),
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
    ...coldFields(), // 체온과 켜 둔 횃불 (WM-B). 흰마루에서만 쓰인다
    ...thirstFields(), // 물과 찾은 옛 우물 (SB-B). 소금벌에서만 쓰인다
    ...ashFields(), // 달궈진 쇠와 겨루기 (AG-B, AG-C). 잿골에서만 쓰인다
    ...marshFields(), // 저주·등불·표식 끈·걷은 이끼, 그리고 공방 (AN-B, AN-C)
    ...sunkenFields(), // 숨, 연 하사품 상자, 종루에 바친 청동 (JD-B, JD-D). 잠긴 도성에서만 쓰인다
    caravan: null, // 상단 (GD-D). 깃발을 사기 전에는 없다
    cloud: { prayers: 0 }, // 구름다리에서 올린 기도 (LV-E8, 화면에 내보내지 않는다)
    ...pondFields(), // 지켜본 일과 건 작은 종 (BM-D, BM-E). 별못에서만 쓰인다
    ...anvilFields(), // 모루 위에 남긴 종, 새긴 끝, 본 끝들 (CM-D). 처음 모루에서만 쓰인다
  };
  if (state.flags.templeKnown) state.factions.temple = 10; // 신전 고아는 신전과 낯익다
  state.lives = 1; // 몇 번째 삶인가 (Z32)
  state.pastLives = [];
  state.pastHidden = {}; // 지난 삶들에서 쌓은 히든 횟수
  state.tough = { str: 0, agi: 0, con: 0, wis: 0 }; // 다시 일어선 몸: 쌓인 몫 (Z30)
  state.toughGained = { str: 0, agi: 0, con: 0, wis: 0 }; // 다시 일어선 몸으로 오른 스탯
  state.toilGained = { str: 0, agi: 0, con: 0, wis: 0 }; // 몸을 쓰는 일로 오른 스탯 (Z61). 환생해도 남는다 (Z101)
  state.mail = { got: [] }; // 우편함 (Z59)
  state.scent = {}; // 먹잇감 냄새 (Z64)
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
  // 처음 모루 (CM-E4): 여기까지 온 가상 유저보다 많을 수는 없다. 한둘뿐이고, 아직 아무도 못 왔으면 나뿐이다
  if (placeById(state.place).band === ANVIL.band) return Math.max(0, Math.min(base + wobble, usersInBand(state, ANVIL.band)));
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
    // 거울 (BM-B1): 별못의 싸움에서는 거듭 누른 칸에 "몇 번째"가 작게 붙고, 넷째 칸이 태세가 된다(물건은 가방에서 쓴다)
    const sub = (key) => { const t = sameSub(state, key); return t ? { sub: t } : {}; };
    // 벼리며 싸우기 (CM-B1, CM-D1): 처음 모루의 싸움에서는 넷째 칸이 망치질이 된다(물건은 가방에서 쓴다)
    const b = state.battle, gain = hammerGain(state);
    const hammerSub = building(b) ? (shelled(b) ? (gain > 1 ? '종 +1' : '종 두 번에 +1') : `종 +${gain * ANVIL.openMult}`) : `벼림 +${gain}`;
    return [
      { label: '공격', action: { type: 'battle', choice: 'attack' }, ...sub('attack'), ...(shelled(b) ? { sub: '껍질을 깬다' } : {}) },
      quickSlot(state),
      { label: stanceOf(state).label, action: { type: 'battle', choice: 'defend' }, ...sub('defend') },
      forged(state) ? { label: '망치질', action: { type: 'battle', choice: 'hammer' }, sub: hammerSub } : mirrored(state) ? { label: '태세', open: 'stance', sub: stanceOf(state).name } : { label: '아이템', open: 'bag' },
      { label: `도망 ${Math.round(fleeChance(state) * 100)}%`, action: { type: 'battle', choice: 'flee' } },
    ];
  }
  if (state.craft) {
    const c = craftView(state);
    if (c.kind !== 'smith') {
      return [
        { label: `${c.kind === 'cook' ? '젓기' : c.kind === 'jewel' ? '다듬기' : '한 땀'} ${c.hits} / ${c.total}`, action: { type: 'hammer' } },
        { label: '그만둔다', action: { type: 'craftQuit' }, confirm: '그만두면 넣은 재료는 돌아오지 않습니다.' },
      ];
    }
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
    // 이끼 덮인 종 앞 (AN-D): 종지기는 먼저 치지 않는다. 곁에 서서 이끼를 걷거나, 쓰러뜨려 쉬게 한다. 9장을 끝낸 뒤에도 이끼는 걷을 수 있다
    if (state.dungeon.id === MOSS.dungeon && state.dungeon.room === MOSS.room) {
      if (!state.dmem[MOSS.dungeon]?.keeper) inside.unshift({ label: '종지기를 쉬게 한다', action: { type: 'bellman' } });
      inside.unshift({ label: '이끼 걷기', action: { type: 'moss' }, ...(state.main.chapter === 9 ? { sub: `${Math.min(MOSS.peel, state.marsh?.moss || 0)} / ${MOSS.peel}` } : {}) });
    }
    // 잠긴 궁 (JD-A11): 물 아래다. 하사품 곳간에서는 상자를 열 수 있고, 공기 주머니를 물 수 있고, 문지방에서는 숨 쉬러 올라간다
    if (underwater(state)) {
      if (DUNGEONS[state.dungeon.id].rooms[state.dungeon.room].vault && chestsLeft(state, 'vault') > 0) inside.unshift({ label: '상자를 연다', sub: '임금의 하사품', action: { type: 'chest' } });
      const have = countOf(state, SUNKEN.bag), full = breathOf(state) >= breathMax(state);
      if (have > 0) inside.push({ label: '공기 주머니', sub: `가방에 ${have}개`, action: { type: 'airbag' }, disabled: full, why: full ? '숨이 가득하다' : '' });
      if (v.canLeave) inside.push({ label: '숨 쉬기', sub: '물 위로', action: { type: 'surface' } });
    }
    if (v.canLeave) inside.push({ label: '밖으로 나간다', action: { type: 'dungeon', op: 'leave' } });
    return inside.slice(0, 5);
  }
  // 말 걸기는 왼쪽 방 목록의 사람 이름을 누른다
  // 쉬기는 밤에만 된다(잠자기·야영). 낮에 피로를 풀려면 주점에서 방을 빌린다
  // 신전의 치료는 낮에만 된다(밤에는 그 자리에 잠자기가 온다)
  const list = placeById(state.place).actions.filter((id) => id !== 'talk' && (id !== 'rest' || state.phase === 2) && (id !== 'heal' || state.phase !== 2) && !hiddenAction(state, id)).map((id) => (ACTIONS[id].open ? { label: ACTIONS[id].label, open: ACTIONS[id].open } : { label: ACTIONS[id].label, action: { type: 'act', id } }));
  { const i = list.findIndex((x) => x.action?.type === 'act' && x.action.id === 'witness'); if (i >= 0) list[i] = watchSlot(state); } // 지켜보기 (BM-D1). 끝까지 본 뒤에는 그 자리에 "봤다고 말한다"가 온다 (BM-G4)
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
    if (x.action?.type === 'act' && x.action.id === 'room') { const fee = roomFee(state); x.label = `방 빌리기 (은화 ${fee})`; if (ROOM_BUFFS[state.place]) x.sub = `${ROOM_BUFFS[state.place].name}: ${ROOM_BUFFS[state.place].text}`; if (state.silver < fee) { x.disabled = true; x.why = '은화가 모자란다'; } }
    if (x.action?.type === 'act' && x.action.id === 'torch') {
      const have = countOf(state, 'torch');
      if ((state.torch || 0) > 0) { x.sub = `켜짐 · ${state.torch}번 남음`; x.disabled = true; x.why = x.sub; } // 켜져 있는 동안은 남은 번 수를 보여 준다
      else if (have > 0) x.sub = `가방에 ${have}개`;
      else { x.disabled = true; x.why = '횃불이 없다'; }
    }
    if (x.action?.type === 'act' && x.action.id === 'well') {
      x.label = `물 채우기 (은화 ${THIRST.fee})`;
      const empty = countOf(state, 'emptypouch');
      if (empty) x.sub = `빈 물 주머니 ${empty}개도 채운다`;
      if ((state.water ?? WATER_MAX) >= WATER_MAX && !empty) { x.disabled = true; x.why = '물이 가득하다'; }
      else if (state.silver < THIRST.fee) { x.disabled = true; x.why = '은화가 모자란다'; }
    }
    if (x.action?.type === 'act' && x.action.id === 'drink') {
      const have = countOf(state, 'waterpouch');
      const full = (state.water ?? WATER_MAX) >= WATER_MAX;
      if (wellFound(state)) { x.label = '물 채우기'; x.sub = WILDS[state.place].well.sub; if (full && !countOf(state, 'emptypouch')) { x.disabled = true; x.why = '물이 가득하다'; } }
      else if (have > 0) { x.sub = `물 주머니 ${have}개`; if (full) { x.disabled = true; x.why = '목이 마르지 않다'; } }
      else { x.disabled = true; x.why = '물 주머니가 없다'; }
    }
    // 숨 쉬기와 공기 주머니 (JD-B2): 물 아래의 칸. 캐기는 용병 둘이 곁에 있으면 "호위받는 중" (JD-C2, 처음 겪은 뒤에만 적힌다)
    if (x.action?.type === 'act' && x.action.id === 'surface') x.sub = '물 위로';
    if (x.action?.type === 'act' && x.action.id === 'airbag') {
      const have = countOf(state, SUNKEN.bag);
      if (have < 1) { x.disabled = true; x.why = '공기 주머니가 없다'; }
      else { x.sub = `가방에 ${have}개`; if (breathOf(state) >= breathMax(state)) { x.disabled = true; x.why = '숨이 가득하다'; } }
    }
    if (x.action?.type === 'act' && x.action.id === 'dig' && underwater(state) && state.flags.sawEscort && escorts(state)) x.sub = '호위받는 중';
    // 등불 (AN-B1): 켜져 있으면 남은 번 수, 아니면 가방에 몇 개인지
    if (x.action?.type === 'act' && x.action.id === 'lamp') {
      const have = countOf(state, MARSH.lamp), left = state.marsh?.lamp || 0;
      if (left > 0) { x.sub = `켜짐 · ${left}번 남음`; x.disabled = true; x.why = x.sub; }
      else if (have > 0) x.sub = `가방에 ${have}개`;
      else { x.disabled = true; x.why = '등불이 없다'; }
    }
    // 표식 묶기 (AN-B1): 끈이 몇 개인지. 열 개를 다 묶은 곳에는 칸이 없다
    if (x.action?.type === 'act' && x.action.id === 'knot') {
      const have = countOf(state, MARSH.knot);
      if (have > 0) x.sub = `끈 ${have}개`; else { x.disabled = true; x.why = '표식 끈이 없다'; }
    }
    // 성수 (AN-B1): 저주가 앉았을 때만 생기는 칸. 가방에 몇 병인지
    if (x.action?.type === 'act' && x.action.id === 'holy') {
      const have = state.bag.filter((it) => itemDef(it.id).eat?.shadow).reduce((a, it) => a + it.n, 0);
      if (have > 0) x.sub = `가방에 ${have}병`; else { x.disabled = true; x.why = '성수가 없다'; }
    }
    // 숫돌 (AG-B1): 가방에 몇 개인지. 갈 쇠 장비가 없으면 꺼진다
    if (x.action?.type === 'act' && x.action.id === 'whet') {
      const have = countOf(state, HEAT.stone);
      if (have < 1) { x.disabled = true; x.why = '숫돌이 없다'; }
      else { x.sub = `가방에 ${have}개`; if (!whetTarget(state)) { x.disabled = true; x.why = '갈 쇠 장비가 없다'; } }
    }
    // 겨루기 (AG-C1): 하루에 한 번. 지고 나서는 풀무질 서른 번을 채워야 다시 선다
    if (x.action?.type === 'act' && x.action.id === 'duel') {
      const v = arenaView(state);
      if (v.lost) { x.disabled = true; x.why = `풀무질 ${v.need - v.pumps}번이 남았다`; x.sub = x.why; }
      else if (v.fought) { x.disabled = true; x.why = '오늘은 이미 겨뤘다'; x.sub = x.why; }
      else x.sub = '오늘 1번 남음';
    }
    if (x.action?.type === 'act' && ACTIONS[x.action.id]?.teach && !knowsWork(state, x.action.id) && !placeById(state.place).anyone) x.label = `구경하기 (${ACTIONS[x.action.id].label})`;
    if (x.open === 'sculpt' && !chiselOf(state)) { x.disabled = true; x.why = '조각칼이 없다'; }
  }
  if (state.relic && state.relic.place === state.place) list.push({ label: '유품 찾기', action: { type: 'relic' } });
  { const p = persuadeSlot(state); if (p) list.push(p); } // 6장 말하는 길 (WM-D5)
  list.push(...shardSlots(state)); // 7장 사 모으는 길, 돌려세우는 길 (SB-F)
  list.push(...ashSlots(state)); // 8장 지어 보이는 길, 불을 끄는 길 (AG-D)
  // 1부의 끝을 본 뒤, 고갯길에서 흰마루로 넘어간다 (WM-A1). 반나절 길
  if (state.place === 'pass' && state.opened.includes(WHITE_GATE)) list.push({ label: '고개를 넘는다', action: { type: 'travel', to: WHITE_GATE } });
  // 좌판 임자에게 값을 들은 뒤에야 살 수 있다. 사기 전에는 "가게" 칸이 없다 (SB-I3)
  if (state.place === STALL.place && stallOffered(state)) list.push({ label: `좌판 사기 (은화 ${STALL.price.toLocaleString('en-US')})`, action: { type: 'stall', op: 'buy' }, disabled: state.silver < STALL.price, why: state.silver < STALL.price ? '은화가 모자란다' : '', confirm: `은화 ${STALL.price.toLocaleString('en-US')}을 내고 빈 좌판을 삽니다.`, ask: { title: '좌판을 살까요?', no: '그만둔다', yes: '산다' } });
  // 6장을 끝낸 뒤, 언못 어귀에서 소금벌로 내려간다 (SB-A1). 반나절 길
  if (state.place === WHITE_GATE && state.opened.includes(SALT_ROAD)) list.push({ label: '소금벌로 내려간다', action: { type: 'travel', to: SALT_GATE } });
  // 7장을 끝낸 뒤, 저울목 어귀에서 잿골로 오른다 (AG-A1). 반나절 길
  if (state.place === SALT_GATE && state.opened.includes(ASH_ROAD)) list.push({ label: '잿골로 오른다', action: { type: 'travel', to: ASH_GATE } });
  // 8장을 끝낸 뒤, 가마골 어귀에서 안개늪으로 내려간다 (AN-A1). 반나절 길
  if (state.place === ASH_GATE && state.opened.includes(MARSH_ROAD)) list.push({ label: '안개늪으로 내려간다', action: { type: 'travel', to: MARSH_GATE } });
  // 9장을 끝낸 뒤, 뜬마을 나루에서 잠긴 도성으로 내려간다 (JD-A1). 배로 반나절
  if (state.place === MARSH_GATE && state.opened.includes(SUNKEN_ROAD)) list.push({ label: '물길을 따라 내려간다', action: { type: 'travel', to: SUNKEN_GATE } });
  // 10장을 끝낸 뒤, 지붕마을 선창에서 구름다리로 오른다 (GD-A1). 하루 길
  if (state.place === SUNKEN_GATE && state.opened.includes(CLOUD_ROAD)) list.push({ label: '산길로 오른다', action: { type: 'travel', to: CLOUD_GATE } });
  // 11장을 끝낸 뒤, 다릿목 어귀에서 별못으로 내려간다 (BM-A1). 하루 길
  if (state.place === CLOUD_GATE && state.opened.includes(POND_ROAD)) list.push({ label: '별못으로 내려간다', action: { type: 'travel', to: POND_GATE } });
  list.push(...sunkenSlots(state)); // 10장 다시 짓는 길, 서브 "근위병의 마지막 순찰" (JD-D)
  list.push(...cloudSlots(state)); // 11장 함께 여는 길, 서브 "견습 사제의 의심" (GD-E)
  list.push(...pondSlots(state)); // 12장 나누는 길, 서브 "조각을 줍는 아이" (BM-E)
  // 12장을 끝낸 뒤, 맞울 어귀에서 처음 모루로 오른다 (CM-A1). 이틀 길
  if (state.place === POND_GATE && state.opened.includes(ANVIL_ROAD)) list.push({ label: '처음 모루로 오른다', action: { type: 'travel', to: ANVIL_GATE } });
  list.push(...anvilSlots(state)); // 13장: 모루 앞의 "망치를 든다"(레벨 95부터), 종을 다 지은 뒤의 "새긴다" (CM-D, CM-G2)
  // 장터 어른에게 값을 들은 뒤에야 깃발을 살 수 있다. 사기 전에는 "상단" 칸이 없다 (GD-D, GD-G3)
  if (state.place === CARAVAN.place && caravanOffered(state)) list.push({ label: `깃발 사기 (은화 ${CARAVAN.price.toLocaleString('en-US')})`, action: { type: 'caravan', op: 'buy' }, disabled: state.silver < CARAVAN.price, why: state.silver < CARAVAN.price ? '은화가 모자란다' : '', confirm: `은화 ${CARAVAN.price.toLocaleString('en-US')}을 내고 상단 깃발을 삽니다.`, ask: { title: '상단 깃발을 살까요?', no: '그만둔다', yes: '산다' } });
  // 빈 공방을 둘러보아 값을 안 뒤에야 살 수 있다. 사기 전에는 "공방" 칸이 없다 (AN-F3)
  if (state.place === SHOP.place && shopOffered(state)) list.push({ label: `공방 사기 (은화 ${SHOP.price.toLocaleString('en-US')})`, action: { type: 'workshop', op: 'buy' }, disabled: state.silver < SHOP.price, why: state.silver < SHOP.price ? '은화가 모자란다' : '', confirm: `은화 ${SHOP.price.toLocaleString('en-US')}을 내고 빈 공방을 삽니다.`, ask: { title: '공방을 살까요?', no: '그만둔다', yes: '산다' } });
  // 견습 (AN-C4): 공방이 있고 자리가 비었을 때만, 물 위 주막의 용병 칸 옆에 생긴다
  // 61부터는 자리가 하나 더 있다 (AN-C8). 그 전에는 둘째 자리가 어디에도 나오지 않는다
  if (state.place === SHOP.inn && state.shop && hireOffer(state)) { const p = PEOPLE[hireOffer(state)]; list.push({ label: '견습', sub: `${p.name} · 하루 삯 ${SHOP.wage}`, action: { type: 'workshop', op: 'hire' }, disabled: state.silver < SHOP.wage, why: state.silver < SHOP.wage ? '첫날 삯이 모자란다' : '', confirm: `${p.name}. ${p.story} 하루 삯은 은화 ${SHOP.wage}이고, 못 주면 떠납니다.`, ask: { title: '견습으로 들일까요?', no: '그만둔다', yes: '들인다' } }); }
  // 폐허 입구에서는 안으로 내려갈 수 있다
  for (const d of Object.values(DUNGEONS)) {
    if (d.from !== state.place) continue;
    const short = d.needFlag && !state.flags[d.needFlag];
    list.push({ label: d.enterLabel || (d.id === 'ruins' ? '안으로 내려간다' : `${ro(d.name)} 노를 젓는다`), action: { type: 'dungeon', op: 'enter', id: d.id }, disabled: !!short, why: short ? d.needSay : '' });
  }
  return list;
}

/** 아직 없는 칸 (SB-I3, SB-I4): 좌판을 사기 전의 "가게", 7장을 끝내기 전의 "다시 태어나기". 단축 칸에도, 눌러서 하는 길에도 나오지 않는다. */
export function hiddenAction(state, id) {
  if (id === 'stall') return !state.stall;
  if (id === 'caravan') return !state.caravan; // 깃발을 사기 전에는 "상단" 칸이 없다 (GD-G3)
  if (id === 'reborn') return !rebornHere(state);
  if (id === 'holy') return curseOf(state) < 1; // 저주가 없으면 성수 칸도 없다 (AN-B1)
  if (id === 'knot') return knotsHere(state) >= MARSH.knots; // 다 묶은 곳에는 묶을 것이 없다
  if (state.place === SHOP.place && ['workshop', 'craft', 'sew'].includes(id)) return !state.shop; // 사기 전의 빈 공방 (AN-F3)
  return false;
}
/** 스스로 고르는 환생 (SB-E1): 지금 구간의 메인 장을 끝낸 사람에게만. 소금벌에서는 7장을 끝낸 뒤다. */
export const canChooseRebirth = (state) => [...state.main.done, ...(state.main.past || [])].some((d) => d.chapter === 7);
/** 이 사당에서 고를 수 있는가 (SB-E1): 그 구간의 메인 장을 끝낸 사람만. 저울목의 사당은 7장, 늪 사당은 9장이다. */
export const rebornHere = (state) => { const ch = (placeById(state.place).band || 4) + 3; return [...state.main.done, ...(state.main.past || [])].some((d) => d.chapter === ch); };

/**
 * 스스로 고른 환생이 가지고 갈 것 (SB-E). 사당의 "다시 태어나기"에서만, 7장을 끝낸 사람만. 상태는 고치지 않는다.
 * 화면이 두 번 묻고, 이 꾸러미로 새 삶을 만든다(createGame의 carry).
 */
export function chosenRebirth(state) {
  if (!placeById(state.place).actions.includes('reborn') || hiddenAction(state, 'reborn')) throw new Error('여기서는 할 수 없는 일입니다');
  if (state.battle || state.dungeon || state.choice || state.craft || state.sculpt) throw new Error('지금은 할 수 없습니다');
  return rebirthCarry(state, { chosen: true });
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
  const same = sameSub(state, `skill:${sk.id}`); // 같은 스킬을 거듭 쓴 수 (BM-B1)
  return { label: `${sk.name} (마나 ${sk.mp})`, action: { type: 'battle', choice: 'skill', index: sk.id }, disabled: short, why: short ? '마나가 모자란다' : '', ...(same ? { sub: same } : {}) };
}

/** 세계 지도에 보일 곳들 (N7). */
export function mapView(state) {
  const here = placeById(state.place);
  const row = (p, name) => {
    const wildId = p.wild ? p.id : here.wild ? here.id : null;
    const locked = !!p.locked && !state.opened.includes(p.opensWith || p.id);
    return {
      locked, lockSay: locked ? p.lockSay : '',
      id: p.id, name, wild: !!p.wild, danger: p.wild ? dangerNow(state, p.id) : '안전', levels: p.levels || '', scent: !!state.scent?.[p.id],
      here: p.wild ? here.id === p.id : !here.wild,
      ambush: wildId ? Math.round(DANGER[dangerNow(state, wildId)].ambush * 100) : 0,
      relic: !!state.relic && state.relic.place === p.id,
      alt: p.stripAlt, strip: p.strip,
      well: !!p.well && wellFound(state, p.id), // 찾은 옛 우물은 지도에 남는다 (SB-B2, SB-I5)
    };
  };
  // 숨은 곳(흰마루)은 길이 나기 전에는 잠긴 줄로도 나오지 않는다 (WM-F1)
  const shown = (p) => !p.secret || state.opened.includes(p.opensWith || p.id);
  return [...TOWN_NAMES.filter((t) => shown(PLACES[TOWNS[t].gate])).map((t) => ({ ...row(PLACES[TOWNS[t].gate], t), here: !here.wild && here.town === t, town: true })), ...WILD_ORDER.filter((id) => shown(PLACES[id])).map((id) => row(PLACES[id], PLACES[id].name))];
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
    cold: coldView(state), // 흰마루 밖에서는 null: 체온 칸이 생기지 않는다 (WM-B1, WM-F2)
    thirst: thirstView(state), // 소금벌 밖에서는 null: 물 칸이 생기지 않는다 (SB-B1, SB-I2)
    heat: heatView(state), // 잿골 밖에서는 null: 장비 칸이 생기지 않는다 (AG-B1, AG-F2)
    curse: curseView(state), // 안개늪 밖이고 저주도 없으면 null: 저주 칸이 생기지 않는다 (AN-B1, AN-F2)
    breath: breathView(state), // 물 위에서는 null: 숨 칸이 생기지 않는다 (JD-B1, JD-F2)
    drum: drumBuff(state), // 북 치는 이가 곁에 없으면 null (GD-C2)
    wind: windView(state), // 벼랑길과 신전 뜰에서만. 다른 데서는 null: 바람 칸이 생기지 않는다 (GD-B1, GD-G2)
    temper: temperView(state), // 처음 모루의 싸움 중에만. 다른 데서는 null: 벼림 칸도 종 칸도 생기지 않는다 (CM-B1, CM-D1)
    read: readView(state), // 별못의 싸움 중에만. 다른 데서는 null: 읽힘 칸이 생기지 않는다 (BM-B1, BM-G2)
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
    id: b.mon, person: !!b.person, elite: !!b.elite, name: m.name, level: m.level, hp: b.hp, maxHp: m.hp, turn: b.turn, element: m.element || '', boss: !!m.boss, stage: base.phases ? (b.phase || 0) + 1 : 0, stages: base.phases ? base.phases.length + 1 : 0,
    next: move ? { name: move.name, tell: move.tell, kind: move.kind } : null,
    hint: !move ? '' : stanceHint(state, move.kind) + (state.flags.knowsBoar && !b.person && !b.bandit && b.mon === 'boar' && move.kind === 'charge' ? ' (뒷발을 긁으면 온다. 옆으로 비켜라.)' : ''),
  };
}

export { tellChance, pricesView, stallView, arenaView, inAsh, workshopView, inMarsh, inSunken, underwater, inCloud, windNow, caravanView, inPond, mirrored, inAnvil, forged };
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
  const slow = Math.max(0.5, 1 - (state.hidden?.vigil?.value || 0) * 0.03) * (state.flags.slowTire ? 0.9 : 1) * (restBuff(state)?.tire || 1) * coldTire(state); // 식은 몸 1.5배, 언 몸 2배 (WM-B3) // 숯쟁이는 더디게 지친다 // 집념: 버텨 본 몸은 더디게 지친다
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

/** 감정 (Z62): 중급 1이 되면 가방의 이름 모를 물건을 알아본다. 그 뒤에 주운 것은 한눈에 알아본다. */
export const APPRAISE_KNOW = 9;
export function identify(state, events) {
  if ((state.skills.appraise?.grade || 0) < APPRAISE_KNOW) return;
  for (const it of state.bag) {
    const def = itemDef(it.id);
    if (!def.unknown || !def.knownAs) continue;
    const was = def.name;
    it.id = def.knownAs;
    const now = itemDef(it.id).name;
    if (!state.flags.identified) {
      state.flags.identified = true;
      pushLine(state, events, { k: 'sys', text: `감정하는 눈이 깊어졌다. 가방의 ${was}을 다시 들여다본다.` });
      pushLine(state, events, { k: 'sys', tone: 'good', text: `날의 글씨가 읽힌다. "${now}". 오래전 이름난 조각가의 것이다.` });
    } else pushLine(state, events, { k: 'sys', tone: 'good', text: `한눈에 알아보았다. ${now}이다.` });
    events.push({ type: 'bag' });
  }
}

function advance(state, events, ticks, quiet = false) {
  identify(state, events);
  hunger(state, events, ticks);
  regen(state, ticks);
  if (!quiet && ticks > 0) coldMove(state, events); // 한 번 움직일 때마다 (WM-B3)
  if (!quiet && ticks > 0) thirstMove(state, events); // 소금벌 들판에서 열 번에 한 모금 (SB-B3)
  if (!quiet && ticks > 0) heatMove(state, events); // 달궈진 쇠는 서른 번 움직이는 동안만 (AG-B3)
  if (!quiet && ticks > 0) emberMove(state, events); // 퍼 담은 재는 식는다 (AG-D7)
  if (!quiet && ticks > 0) lampMove(state, events); // 켜 둔 등불은 예순 번 움직이는 동안만 (AN-B3)
  if (!quiet && ticks > 0) breathMove(state, events); // 물 아래에서는 한 번 움직일 때마다(싸움의 한 턴도) 숨이 하나 준다 (JD-B3)
  if (!quiet) tire(state, events, ticks);
  state.tick += ticks;
  while (state.tick >= PHASE_TICKS) {
    state.tick -= PHASE_TICKS;
    nextPhase(state, events, !quiet);
  }
}

const CHORE_LEVEL = { '시작 마을': 1, 나루: 6, 소리재: 12, 언못: 22, 저울목: 32, 가마골: 42, 뜬마을: 52, 지붕마을: 62, 다릿목: 72, '신전 뜰': 76, 맞울: 82, '모루 아래 야영지': 92 };
const HUNGRY_WORK = 30; // 굶은 날로 치려면 그날 굶은 채 한 일의 수

/** 1부의 끝을 본 밤에 들리는 소리. 흰마루(WM-D2)가 "그 밤 들은 소리"라고 받는다. */
export const BEYOND_LINE = '밤이 깊었다. 고개 너머 먼 데서 무언가 한 번 울렸다. 띠링과 닮았지만 훨씬 멀고, 누구에게 답하는 소리 같았다.';
/** 흰마루에 처음 들어섰을 때 (WM-D2, WM-F5). */
export const WHITE_FIRST = ['고갯마루를 넘자 바람이 바뀌었다. 아래로 흰 것뿐이다. 멀리 못 하나가 얼어 있고, 그 곁에 얼음 기둥 같은 것이 서 있다. 그 밤 들은 소리는 저기서 났다.', '몸이 식는 것이 느껴진다. 들판에 오래 있으면 지친다.'];

/** 소금벌에 처음 내려섰을 때 (SB-F2). 둘째 줄은 처음 값이다. */
export const SALT_FIRST = ['눈이 끝나는 곳에서 소금이 시작됐다. 바다였던 바닥이 하얗게 말라 있다. 멀리 천막 지붕들이 보이고, 바람에 실려 온 띠링 소리가 끊이지 않는다. 너무 자주 울린다.', '입술이 마른다. 들판에 나가면 물이 줄어든다.'];

/** 잿골에 처음 올랐을 때 (AG-D2). 둘째 줄은 처음 값이다. */
export const ASH_FIRST = HEAT_LINES.first;

/** 안개늪에 처음 내려섰을 때 (AN-D2). 둘째 줄은 처음 값이다. */
export const MARSH_FIRST = MARSH_LINES.first;

/** 잠긴 도성에 처음 닿았을 때 (JD-D2). 둘째 줄은 처음 값이다. */
export const SUNKEN_FIRST = SUNKEN_LINES.first;

/** 구름다리에 처음 올랐을 때 (GD-E2). 둘째 줄은 처음 값이다. */
export const CLOUD_FIRST = CLOUD_LINES.first;

/** 별못에 처음 내려섰을 때 (BM-E2). 둘째 줄은 처음 값이다. */
export const POND_FIRST = POND_LINES.first;

/** @param awake 깨어서 움직이다 때가 넘어갔는가(자거나 곯아떨어진 것이 아니다) */
function nextPhase(state, events, awake = false) {
  // 종루 앞에서 밤을 새웠다 (LV-E3): 해 질 때부터 종루 아래를 떠나지 않고 깨어서 아침을 맞았다
  if (state.phase === 2 && awake && state.place === 'underbell' && !state.dungeon && state.flags.bellSince === state.day) state.flags.bellNights = (state.flags.bellNights || 0) + 1;
  if (state.phase === 2) delete state.flags.bellSince;
  const windWas = windNow(state)?.id;
  state.phase += 1;
  if (state.phase === 2 && state.place === 'underbell' && !state.dungeon) state.flags.bellSince = state.day;
  fadeScent(state); // 먹잇감 냄새는 하루가 지나면 걷힌다 (Z64)
  if (state.flags.legendNight && state.day === 1 && state.phase === 2) {
    delete state.flags.legendNight;
    pushLine(state, events, { k: 'room', text: '종루 쪽에서 아주 작은 울림이 한 번 지나갔다. 아무도 고개를 들지 않았다.' });
  }
  // 어느 끝을 골랐든, 그 밤 고개 너머에서 답하는 소리가 들리고 2부의 길이 열린다 (LV-B2, WM-A1)
  if (state.phase === 2 && state.ending && !state.opened.includes(WHITE_GATE)) {
    state.opened.push(WHITE_GATE);
    pushLine(state, events, { k: 'room', text: BEYOND_LINE });
    events.push({ type: 'quest' });
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
    storeDay(state, events, (state.flags.dayWork || 0) >= INTEREST_WORK); // 이자는 일한 날에만 (LV-L9)
    state.flags.dayWork = 0;
    stallDay(state);
    shopDay(state, events); // 견습의 하루 삯 (AN-C4)
    caravanDay(state, events); // 호위로 나간 용병의 하루 삯 (GD-D5)
    statueDay(state, events);
    if (state.scarecrow.hits >= 300) {
      state.scarecrow.hits = 0;
      if (state.place === 'training') pushLine(state, events, { k: 'room', text: SCARECROW_LINES.fresh });
      events.push({ type: 'art' });
    }
  }
  pushLine(state, events, { k: 'room', text: PHASE_LINES[state.phase] });
  if (windNow(state) && windNow(state).id !== windWas) windLine(state, events, true); // 때가 바뀌면 바람도 바뀐다 (GD-B3)
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
  let beside = null;
  const pondBefore = doneMark(state); // 별못에서 끝까지 한 일에는 사람이 답한다 (BM-D5). 별못 밖에서는 null
  if (state.flags?.mustRebirth) throw new Error('숨이 끊어졌습니다. 다시 태어나야 합니다');
  if (state.battle && !['battle', 'use', 'equip', 'quick', 'mail'].includes(t) && !(t === 'party' && action.op === 'plan')) throw new Error('싸우는 중입니다');
  if (state.craft && !['hammer', 'reheat', 'craftQuit', 'spend', 'evolve'].includes(t) && !(t === 'choose' && state.choice)) throw new Error('만들던 것을 끝내거나 그만두어야 합니다');
  if (state.sculpt && !['cut', 'sculptQuit', 'spend', 'evolve'].includes(t) && !(t === 'choose' && state.choice)) throw new Error('깎던 것을 끝내거나 그만두어야 합니다');
  if (!state.battle && state.choice && !['choose', 'spend', 'mail'].includes(t)) throw new Error('먼저 정해야 할 것이 있습니다');
  if (state.dungeon && ['lifthammer', 'carve', 'saw', 'hangbell', 'guardkid', 'redo', 'shard', 'turn', 'hang', 'quench', 'bronze', 'patrol', 'herd', 'opendoor', 'stall', 'caravan', 'workshop', 'boat', 'offer', 'move', 'travel', 'act', 'craft', 'sculpt', 'cook', 'job', 'buy', 'sell', 'sellMany', 'deposit', 'withdraw', 'greet', 'talk', 'gift', 'relic', 'rumor', 'auction'].includes(t)) throw new Error('던전 안에서는 할 수 없습니다');
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
    else if (state.bag[action.index] && itemDef(state.bag[action.index].id).whet) useWhetstone(state, events); // 숫돌은 어디서든 가방에서 쓸 수 있다 (AG-F2)
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
    const r = RECIPES[action.recipe];
    const need = r?.cook ? 'cook' : r?.jewel ? 'jewel' : r?.sew ? 'sew' : 'craft';
    if (!placeById(state.place).actions.includes(need) || hiddenAction(state, need)) throw new Error(need === 'cook' ? '모닥불이나 공용주방에서 요리합니다' : need === 'jewel' ? '예술협회에서 다듬습니다' : need === 'sew' ? '여기서는 가죽을 꿰맬 수 없습니다' : '여기에는 화덕이 없습니다');
    startCraft(state, events, action.recipe);
  } else if (t === 'hammer') {
    beside = state.craft?.recipe || null; // 견습 곁에서 같은 것을 두드리는가 (AN-C5)
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
  } else if (t === 'sellMany') {
    sellMany(state, events, action.picks);
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
    // 순례자 숙소의 게시판에는 짐꾼들이 흘린 말도 붙는다 (GD-D7). 상단이 없는 사람에게는 보이지 않는다
    if (state.place === 'pilgriminn') { const said = hearRumor(state); if (said) pushLine(state, events, { k: 'npc', who: '숙소지기', text: said }); }
    advance(state, events, 1);
  } else if (t === 'auction') {
    if (action.op === 'list') listItem(state, events, action.index, action.start, action.days);
    else if (action.op === 'bid') bid(state, events, action.key, action.amount);
    else throw new Error('모르는 경매 행동입니다');
  } else if (t === 'dungeon') {
    if (action.op === 'enter') { enterDungeon(state, events, action.id); delete state.flags.bellSince; advance(state, events, 2); }
    else if (action.op === 'leave') { leaveDungeon(state, events); advance(state, events, 2); }
    else if (action.op === 'rest') { restInRoom(state, events); advance(state, events, 10); if (DUNGEONS[state.dungeon.id].rooms[state.dungeon.room].air) fillBreath(state); } // 공기 고인 쉼터에서는 쉬는 동안 숨이 닳지 않는다 (JD-A11)
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
    else if (action.op === 'unplace') unplaceWork(state, events, action.no);
    else if (action.op === 'sell') sellWork(state, events, action.no);
    else if (action.op === 'gift') giftWork(state, events, action.no, action.npc);
    else if (action.op === 'alive') giveLife(state, events, action.no);
    else throw new Error('모르는 작품 행동입니다');
  } else if (t === 'cook') {
    throw new Error('요리는 요리 목록에서 골라 젓는다'); // 재료 조합 찾기는 없앴다 (Z93)
  } else if (t === 'party') {
    if (action.op === 'ask') askToJoin(state, events, action.npc);
    else if (action.op === 'hire') hireMerc(state, events, action.id);
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
  } else if (t === 'persuade') {
    persuadeHansol(state, events);
    advance(state, events, 2);
  } else if (t === 'redo') {
    redoChapter(state, events, action.chapter);
  } else if (t === 'shard') {
    buyShard(state, events);
  } else if (t === 'turn') {
    turnWeighers(state, events);
    advance(state, events, 2);
  } else if (t === 'hang') {
    hangBlade(state, events);
    advance(state, events, 2);
  } else if (t === 'quench') {
    quenchFire(state, events);
    advance(state, events, 2);
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
    sitBeside(state, action.npc); // 마당에서 말을 건 사람 곁에 앉는다 (BM-D3)
    relayTalk(state, events, action.npc); // 서브 "서로 답하는 마을": 말을 다음 사람에게 건넨다 (BM-E6)
  } else if (t === 'talk') {
    talk(state, events, action.npc);
    sitBeside(state, action.npc);
    relayTalk(state, events, action.npc);
    // 장터 어른은 상단 임자에게 들은 것을 하나 일러 준다 (GD-D7)
    if (action.npc === CARAVAN.owner) { const said = hearRumor(state); if (said) pushLine(state, events, { k: 'npc', who: PEOPLE[CARAVAN.owner].name, text: said }); }
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
  } else if (t === 'stall') {
    // 가게 (SB-D): 좌판을 사고, 내가 만든 것을 올리고 내린다
    if (action.op === 'buy') buyStall(state, events);
    else if (action.op === 'put') putOnStall(state, events, action.index);
    else if (action.op === 'take') takeFromStall(state, events, action.index);
    else throw new Error('모르는 가게 일입니다');
  } else if (t === 'caravan') {
    // 상단 (GD-D): 깃발을 사고, 짐을 꾸려 보낸다
    if (action.op === 'buy') buyCaravan(state, events);
    else if (action.op === 'send') sendLoad(state, events, action.to, action.picks, action.escort || null);
    else throw new Error('모르는 상단 일입니다');
  } else if (t === 'workshop') {
    // 공방과 견습 (AN-C): 사고, 견습을 들이고, 일을 맡기고, 선반에 넣고 꺼낸다
    if (action.op === 'buy') buyShop(state, events);
    else if (action.op === 'hire') hireHand(state, events);
    else if (action.op === 'job') setJob(state, events, action.job, action.who);
    else if (action.op === 'put') putOnShelf(state, events, action.index, action.n);
    else if (action.op === 'take') takeFromShelf(state, events, action.index, action.n);
    else throw new Error('모르는 공방 일입니다');
  } else if (t === 'moss') {
    peelMoss(state, events);
    advance(state, events, 1);
  } else if (t === 'surface') {
    surface(state, events); // 잠긴 궁의 문지방에서 물 위로 (JD-B3)
  } else if (t === 'airbag') {
    useAirbag(state, events);
  } else if (t === 'chest') {
    // 하사품 곳간의 상자 (JD-F4): 보이고 열 수 있다. 한 번에 하나
    if (!state.dungeon || !DUNGEONS[state.dungeon.id].rooms[state.dungeon.room].vault) throw new Error('여기에는 상자가 없습니다');
    pushLine(state, events, { k: 'me', text: SUNKEN_LINES.vault });
    openChest(state, events, 'vault');
    advance(state, events, 1);
  } else if (t === 'herd') {
    herdStep(state, events); // 서브 "견습 사제의 의심" (GD-E7): 한 번 누르면 한 번
    advance(state, events, 1);
  } else if (t === 'saw') {
    saySaw(state, events); // 끝까지 본 일을 봤다고 말해 준다 (BM-D2)
    // 12장 그대로 두는 길: 일곱 사람의 일을 한 번씩 끝까지 보고 답해 주었다 (BM-E5)
    if (state.main.chapter === 12 && answeredPeople(state) >= SHARDS.people) finishMain(state, events, 'leave');
  } else if (t === 'hangbell') {
    hangBell(state, events); // 12장 나누는 길: 작은 종 하나를 처마에 건다 (BM-E4)
    advance(state, events, 1);
    if (state.main.chapter === 12 && bellsHung(state) >= SHARDS.bells) finishMain(state, events, 'share');
  } else if (t === 'guardkid') {
    // 서브 "조각을 줍는 아이" (BM-E7): 덤비는 것이 있으면 내가 막아서 싸운다
    const mon = guardStep(state, events);
    advance(state, events, 1);
    if (mon && !state.battle) startBattle(state, events, mon);
  } else if (t === 'lifthammer') {
    // 망치를 든다 (CM-A8, CM-D): 던전이 없다. 모루 앞에서 그대로 마지막 싸움이 시작된다
    const start = liftHammer(state, events);
    startBattle(state, events, ANVIL.mon, { bell: start });
  } else if (t === 'carve') {
    if (openCarve(state, events) === 'eight') applyAnvilEnd(state, events, 'eight'); // 숨은 끝은 고르지 않는다 (CM-D6)
  } else if (t === 'opendoor') {
    standAtDoor(state, events); // 11장 함께 여는 길 (GD-E5)
  } else if (t === 'bronze') {
    offerBronze(state, events);
  } else if (t === 'patrol') {
    patrolStep(state, events);
    advance(state, events, 1);
  } else if (t === 'bellman') {
    if (state.dungeon?.id !== MOSS.dungeon || state.dungeon.room !== MOSS.room || state.dmem[MOSS.dungeon]?.keeper) throw new Error('쉬게 할 종지기가 없습니다');
    pushLine(state, events, { k: 'me', text: MOSS_LINES.fight });
    startBattle(state, events, MOSS.mon);
  } else if (t === 'relic') {
    recoverRelic(state, events);
    advance(state, events, 1);
  } else throw new Error('모르는 행동: ' + t);
  // 잿골 (AG-B3, AG-C): 들판의 싸움을 이기면 든 무기가 달고, 겨루기가 끝나면 마당의 규칙이 값을 매긴다
  if (events.some((e) => e.type === 'battle' && e.phase === 'win' && !e.arena)) heatWin(state, events);
  arenaHook(state, events);
  // 저주를 세 겹 넘게 안은 채 이긴 싸움은 따로 세어진다 (AN-B3, AN-F5). 어디에도 내보내지 않는다
  if (events.some((e) => e.type === 'battle' && e.phase === 'win' && !e.arena) && curseOf(state) > MARSH.cursedAt) state.counters.cursedWins = (state.counters.cursedWins || 0) + 1;
  clampBody(state);
  afterCounters(state, events);
  noticeEvolve(state, events);
  // 문지기 곁에서 밤을 새웠으면 아침이 된다
  if (events.some((e) => e.type === 'night')) { hunger(state, events, 25); state.tick = 0; while (state.phase !== 0) nextPhase(state, events); }
  // 걸작(전설 등급)으로 지은 대장의 승급작은 적어 둔다 (CM-E, LV-M4)
  for (const e of events) if (e.type === 'craft' && e.phase === 'done') notePromo(state, e.item, e.grade);
  // 종을 다 지었으면 그 자리에서 정을 쥔다 (CM-D7). 숨은 끝의 조건을 채웠으면 고르지 않고 그 끝이 된다
  if (events.some((e) => e.type === 'bellbuilt') && !state.battle && !state.choice && state.hp > 0 && openCarve(state, events) === 'eight') applyAnvilEnd(state, events, 'eight');
  const ended2 = events.find((e) => e.type === 'ending2');
  if (ended2 && state.main.chapter === 13) finishMain(state, events, ended2.id);
  const ended = events.find((e) => e.type === 'ending');
  if (ended && state.main.chapter === 5) { state.dingsAtEnd = state.dings.length; finishMain(state, events, ended.id); }
  const bell = dungeonHook(state, events);
  if (bell && state.main.chapter === 2) finishMain(state, events, bell);
  // 6장 쓰러뜨리는 길: 얼음 종루 맨 위의 파수꾼을 쓰러뜨렸다 (WM-D3)
  if (state.main.chapter === 6 && state.dmem.icetower?.keeper === 'beat' && !state.battle) finishMain(state, events, 'beat');
  // 7장 터는 길: 종 조각 창고 맨 안쪽의 징수인을 쓰러뜨렸다 (SB-F3)
  if (state.main.chapter === 7 && state.dmem.shardhouse?.keeper === 'beat' && !state.battle) finishMain(state, events, 'raid');
  // 8장 꺾는 길: 식지 않는 가마 맨 안쪽의 망치를 쓰러뜨렸다 (AG-D3)
  if (state.main.chapter === 8 && state.dmem.kiln?.keeper === 'beat' && !state.battle) finishMain(state, events, 'beat');
  // 11장 쓰러뜨리는 길: 하늘 신전 맨 안쪽의 대사제를 쓰러뜨렸다 (GD-E3)
  if (state.main.chapter === 11 && state.dmem.skytemple?.keeper === 'beat' && !state.battle) finishMain(state, events, 'beat');
  // 12장 거두는 길: 별 떨어진 자리 바닥의 마지막 조각을 쓰러뜨렸다 (BM-E3)
  if (state.main.chapter === 12 && state.dmem[SHARDS.dungeon]?.keeper === 'beat' && !state.battle) finishMain(state, events, 'gather');
  // 10장 잠재우는 길: 잠긴 궁 맨 안쪽의 메아리를 쓰러뜨렸다 (JD-D3). 풀어 주는 길: 근위병 다섯에게 교대를 알렸다 (JD-D5)
  if (state.main.chapter === 10 && state.dmem[ECHO.dungeon]?.keeper === 'beat' && !state.battle) finishMain(state, events, 'quiet');
  if (state.main.chapter === 10 && relievedPosts(state) >= ECHO.posts && !state.battle && !state.choice) finishMain(state, events, 'relieve');
  // 히든 "받지 않은 사람" (LV-E7): 상자를 하나도 열지 않고 10장을 끝낸 사람이 물 위로 올라왔을 때. 조건은 어디에도 내보내지 않는다
  if (!state.hq.ungifted && chestsOpened(state) === 0 && state.main.done.some((d) => d.chapter === 10) && !underwater(state) && !state.battle && !state.choice && !state.craft && !state.sculpt) offerHidden(state, events, 'ungifted');
  // 9장 쉬게 하는 길: 가라앉는 오솔길 끝의 종지기를 쓰러뜨렸다 (AN-D3)
  if (state.main.chapter === 9 && state.dmem.sunkenpath?.keeper === 'beat' && !state.battle) finishMain(state, events, 'rest');
  if (state.main.chapter === 4 && state.dungeon?.id === 'ruins' && state.dungeon.room === 'f3-bell' && !state.flags.bellSpoke && foundCount(state) >= 5) {
    state.flags.bellSpoke = true;
    pushLine(state, events, { k: 'room', text: '묻기도 전에 종이 먼저 울었다. 다섯 번. 내가 아무도 모르게 끝까지 해낸 다섯 가지를, 종은 하나씩 불렀다. "봤다." 종은 그렇게 말하고 있었다.' });
  }
  questHook(state, events, action);
  worldHook(state, events, action);
  guildHook(state, events, action);
  clampBody(state);
  // 고된 일을 하나 했다(끝까지 된 것만): 그 방의 행동, 망치질, 칼질, 싸움의 한 턴. 쉬기와 받기만 하는 것은 아니다
  const toiled = (t === 'act' && !ACTIONS[action.id]?.rest && !ACTIONS[action.id]?.open && !ACTIONS[action.id]?.service) || ['hammer', 'cut', 'battle', 'enhance', 'moss', 'herd'].includes(t); // 염소 치기도 일터의 일이다 (GD-E7)
  // "일" (SB-D6, LV-K9): 탐색, 싸움의 한 턴, 망치질·바느질, 캐기, 낚시, 일터의 일. 둘러보기는 일이 아니다. 이자가 붙는 날과 가게의 손님을 이것으로 센다
  if (toiled && !(t === 'act' && action.id === 'look')) {
    state.flags.dayWork = (state.flags.dayWork || 0) + 1;
    stallWork(state, events); // 가게의 손님도 같은 "일"로 센다 (SB-D6)
    shopWork(state, events, { beside }); // 견습도 같은 "일"로만 돈다. 쉬기만 눌러서는 돌지 않는다 (AN-C, LV-K)
    caravanWork(state, events); // 상단의 짐도 같은 "일"로만 간다. 쉬거나 자는 동안에는 가지 않는다 (GD-D3, LV-K9)
  }
  // 9장 가르치는 길: 견습의 손이 끝(5단계)까지 갔다 (AN-D5)
  if (state.main.chapter === 9 && stageNow(state) >= SHOP.every.length && !state.battle && !state.choice && !state.craft && !state.sculpt) finishMain(state, events, 'teach');
  if (toiled) {
    if (isTired(state)) state.counters.tiredWork = (state.counters.tiredWork || 0) + 1; // 집념의 재료
    if (state.full === 0) state.flags.hungryWork = (state.flags.hungryWork || 0) + 1; // 근성의 재료
  }
  afterCounters(state, events);
  sawAnswer(state, events, pondBefore); // 별못에서 끝까지 한 일에는 마을 사람 하나가 "봤어"라고 말해 준다 (BM-D5)
  memoryHook(state, events, t, action);
  if (t === 'act' && action.id === 'pray') {
    prayShadow(state, events); prayCurse(state, events); // 늪 사당의 기도 열 번에 저주 한 겹 (AN-B3)
    if (state.hp > 0 && state.hp < valueOf(state, 'maxHp')) state.hp += PRAY_HEAL; // 기도 한 번에 생명력 +1 (Z100)
  }
  if (!state.battle && !state.dungeon && !state.choice) {
    // 그곳에 맞는 일: 그 방의 행동(쉬기 빼고), 망치질, 칼질, 사고팔기, 요리, 바치기
    const fit = (t === 'act' && !ACTIONS[action.id]?.rest && !ACTIONS[action.id]?.open) || ['hammer', 'cut', 'buy', 'sell', 'sellMany', 'cook', 'offer', 'enhance', 'repair'].includes(t);
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
  // 체온이 바닥났다 (WM-B3): 지금의 쓰러짐과 같은 규칙. 싸움 중이면 싸움이 끝난 뒤에
  if (inWhite(state) && Number.isFinite(state.warm) && state.warm <= 0 && !state.battle && !state.choice && !state.craft && !state.sculpt && !events.some((e) => e.type === 'fall')) {
    state.dungeon = null;
    const info = fall(state, events, COLD_LINES.fall);
    info.frozen = true;
    state.warm = WARM_MAX; state.torch = 0;
  }
  // 물이 떨어진 채 생명력이 바닥났다 (SB-B3): 지금의 쓰러짐과 같은 규칙
  if (state.flags.parched && state.hp > 0) delete state.flags.parched;
  if (state.flags.parched && !state.battle && !state.choice && !state.craft && !state.sculpt && !events.some((e) => e.type === 'fall')) {
    delete state.flags.parched;
    state.dungeon = null;
    const info = fall(state, events, THIRST_LINES.fall);
    info.parched = true;
    state.water = WATER_MAX; state.dryStep = 0;
  }
  // 숨이 다한 채 생명력이 바닥났다 (JD-B3): 지금의 쓰러짐과 같은 규칙
  if (state.flags.choked && state.hp > 0) delete state.flags.choked;
  if (state.flags.choked && !state.battle && !state.choice && !state.craft && !state.sculpt && !events.some((e) => e.type === 'fall')) {
    delete state.flags.choked;
    state.dungeon = null;
    const info = fall(state, events, SUNKEN_LINES.fall);
    info.choked = true;
    fillBreath(state);
  }
  if (state.flags.doze && (state.tired || 0) < DOZE_AT) delete state.flags.doze; // 그사이 쉬었다
  // 싸우다 잠들면 쓰러진다 (Z65)
  if (state.battle && ((state.tired || 0) >= TIRED_MAX || state.flags.doze) && !events.some((e) => e.type === 'fall')) {
    delete state.flags.doze;
    dozeInBattle(state, events);
  }
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
  for (const [key, f] of Object.entries(FIRSTS)) if (f.dmem && state.dmem[f.dmem]?.keeper === 'beat') claim(state, events, key); // 새 지역의 우두머리 (LV-M6)
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
  // 공용주방 (Z83): 맞는 요리를 셋 만들면 주방장이 일을 권한다
  if (state.place === 'kitchen') {
    if ((state.counters.dishes || 0) < (state.flags.chefAsk || 3)) return;
    state.choice = { kind: 'offer', job: 'chef' };
    pushLine(state, events, { k: 'npc', who: '주방장', text: '손맛이 있네. 여기서 같이 솥 저어 볼래? 재료는 내가 대 줄게.' });
    events.push({ type: 'choice' });
    return;
  }
  // 의류점 (Z74): 가죽 옷을 세 벌 지으면 재봉사가 일을 권한다
  if (state.place === 'tailor') {
    if ((state.counters.sewn || 0) < (state.flags.tailorAsk || 3)) return;
    state.choice = { kind: 'offer', job: 'tailor' };
    pushLine(state, events, { k: 'npc', who: '재봉사', text: '손이 좋네. 우리 가게 일 좀 해 볼 텐가? 바늘이랑 물레는 얼마든지 써.' });
    events.push({ type: 'choice' });
    return;
  }
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
  mercsStay(state, events, bandOfPlace(dest).n); // 용병은 제 구간까지만 따라온다 (JD-C3)
  delete state.flags.bellSince; // 자리를 떴다 왔으면 그 밤은 새운 것이 아니다
  if ((state.ash?.hot || 0) > 0 && !inAsh(state)) heatMove(state, events); // 잿골을 벗어나면 달았던 쇠는 바로 식는다 (AG-B3)
  state.lastAction = null;
  const statue = dest.id === 'plaza' ? statueOf(state) : null;
  pushLine(state, events, { k: 'room', text: statue ? `분수 옆 받침대에 내가 깎은 ${statue.name}이 서 있다. 사람들이 오가며 그 앞에서 걸음을 늦춘다.` : dest.room });
  windLine(state, events); // 벼랑길과 신전 뜰: 지금 부는 바람 (GD-B1)
  if (dest.id === 'training' && !state.flags.gotSword) {
    state.flags.gotSword = true;
    const sword = makeItem('woodsword');
    pushLine(state, events, { k: 'npc', who: '교관', text: '맨손으로 칠 셈이냐. 이거 받아라.' });
    if (state.equip.weapon) state.bag.push(sword); else state.equip.weapon = sword;
    pushLine(state, events, { k: 'sys', text: '낡은 목검을 받았다.' });
  }
  if (dest.id === WHITE_GATE && !state.flags.sawWhite) {
    state.flags.sawWhite = true;
    pushLine(state, events, { k: 'room', text: WHITE_FIRST[0] });
    pushLine(state, events, { k: 'sys', text: WHITE_FIRST[1], tone: 'warn' });
  }
  if (dest.id === ASH_GATE && !state.flags.sawAsh) {
    state.flags.sawAsh = true;
    pushLine(state, events, { k: 'room', text: ASH_FIRST[0] });
    pushLine(state, events, { k: 'sys', text: ASH_FIRST[1], tone: 'warn' });
  }
  if (dest.id === MARSH_GATE && !state.flags.sawMarsh) {
    state.flags.sawMarsh = true;
    pushLine(state, events, { k: 'room', text: MARSH_FIRST[0] });
    pushLine(state, events, { k: 'sys', text: MARSH_FIRST[1], tone: 'warn' });
  }
  if (dest.id === SUNKEN_GATE && !state.flags.sawSunken) {
    state.flags.sawSunken = true;
    pushLine(state, events, { k: 'room', text: SUNKEN_FIRST[0] });
    pushLine(state, events, { k: 'sys', text: SUNKEN_FIRST[1], tone: 'warn' });
  }
  if (dest.id === CLOUD_GATE && !state.flags.sawCloud) {
    state.flags.sawCloud = true;
    pushLine(state, events, { k: 'room', text: CLOUD_FIRST[0] });
    pushLine(state, events, { k: 'sys', text: CLOUD_FIRST[1], tone: 'warn' });
  }
  if (dest.id === POND_GATE && !state.flags.sawPond) {
    state.flags.sawPond = true;
    pushLine(state, events, { k: 'room', text: POND_FIRST[0] });
    pushLine(state, events, { k: 'sys', text: POND_FIRST[1], tone: 'warn' });
  }
  // 처음 모루 (CM-E4, CM-D11): 야영지에 처음 닿았을 때와 모루에 처음 올랐을 때
  if (dest.id === ANVIL_GATE && !state.flags.sawAnvil) {
    state.flags.sawAnvil = true;
    pushLine(state, events, { k: 'room', text: ANVIL_LINES.camp(usersInBand(state, ANVIL.band)) });
    pushLine(state, events, { k: 'sys', text: ANVIL_LINES.first[1], tone: 'warn' });
  }
  if (dest.id === ANVIL_GATE && state.anvil?.tent) pushLine(state, events, { k: 'room', text: ANVIL_LINES.myTent }); // "내려간다"를 고른 뒤 (CM-D6)
  if (dest.id === ANVIL.front && !state.flags.sawAnvilTop) {
    state.flags.sawAnvilTop = true;
    pushLine(state, events, { k: 'room', text: ANVIL_LINES.first[0] });
  }
  // 마당지기 다온과 처음 만난다 (BM-E1). 1부의 숨은 끝을 본 사람에게는 첫마디가 다르다
  if (dest.id === POND_GATE && !state.flags.metDaon) {
    state.flags.metDaon = true;
    for (const [who, text] of daonFirst(state)) pushLine(state, events, who === 'me' ? { k: 'me', text } : { k: 'npc', who: PEOPLE[who].name, text });
  }
  // 문지기 사제 고요, 견습 사제 새벽과 처음 만난다 (GD-E1)
  if (dest.id === 'templedoor' && !state.flags.metGoyo) {
    state.flags.metGoyo = true;
    for (const [who, text] of GOYO_FIRST) pushLine(state, events, who === 'me' ? { k: 'me', text } : { k: 'npc', who: PEOPLE[who].name, text });
  }
  // 조합장 한별과 처음 만난다 (JD-D1)
  if (dest.id === 'divers' && !state.flags.metHanbyeol) {
    state.flags.metHanbyeol = true;
    for (const [k, text] of HANBYEOL_FIRST) pushLine(state, events, k === 'npc' ? { k, who: '조합장 한별', text } : { k, text });
  }
  // 약초꾼 수련과 처음 만난다 (AN-D1)
  if (dest.id === 'herbhut' && !state.flags.metSuryeon) {
    state.flags.metSuryeon = true;
    for (const [k, text] of SURYEON_FIRST) pushLine(state, events, k === 'npc' ? { k, who: '약초꾼 수련', text } : { k, text });
  }
  if (dest.id === ARENA.place) judgeSays(state, events); // 심판이 그날 상대를 알린다 (AG-C1)
  if (dest.id === SALT_GATE && !state.flags.sawSalt) {
    state.flags.sawSalt = true;
    pushLine(state, events, { k: 'room', text: SALT_FIRST[0] });
    pushLine(state, events, { k: 'sys', text: SALT_FIRST[1], tone: 'warn' });
  }
  // 종지기 한솔과 처음 만난다 (WM-D1)
  if (dest.id === 'underbell' && !state.flags.metHansol) {
    state.flags.metHansol = true;
    for (const [k, text] of HANSOL_FIRST) pushLine(state, events, k === 'npc' ? { k, who: '종지기 한솔', text } : { k, text });
  }
  // 풀무꾼 다래와 처음 만난다 (AG-D1)
  if (dest.id === 'bellowsrow' && !state.flags.metDarae) {
    state.flags.metDarae = true;
    for (const [k, text] of DARAE_FIRST) pushLine(state, events, k === 'npc' ? { k, who: '풀무꾼 다래', text } : { k, text });
  }
  // 상단 대리인 유겸과 처음 만난다 (SB-F1). 쥐어 본 조각의 띠링은 대화방의 한 줄일 뿐이다
  if (dest.id === 'warehouse' && !state.flags.metYugyeom) {
    state.flags.metYugyeom = true;
    for (const [k, text] of YUGYEOM_FIRST) pushLine(state, events, k === 'npc' ? { k, who: '상단 대리인 유겸', text } : { k, text });
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
  // 지붕마을에서 물 아래로 다시 내려가는 데는 다섯 번 움직인 만큼의 때가 든다 (JD-B3). 물 아래의 다른 곳으로 갈 때도 올라왔다 내려간다
  const dive = !!dest.under && from.band === SUNKEN.band;
  // 지붕마을과 다릿목 사이의 산길은 하루 길이다 (GD-A1)
  const climb = (from.id === SUNKEN_GATE && dest.id === CLOUD_GATE) || (from.id === CLOUD_GATE && dest.id === SUNKEN_GATE);
  // 다릿목과 맞울 사이의 내리막도 하루 길이다 (BM-A1)
  const descend = (from.id === CLOUD_GATE && dest.id === POND_GATE) || (from.id === POND_GATE && dest.id === CLOUD_GATE);
  // 맞울과 모루 아래 야영지 사이는 이틀 길이다 (CM-A1)
  const ascend = (from.id === POND_GATE && dest.id === ANVIL_GATE) || (from.id === ANVIL_GATE && dest.id === POND_GATE);
  advance(state, events, Math.round((dive ? SUNKEN.dive : climb ? CLOUD.road : descend ? POND.road : ascend ? ANVIL.road : TRAVEL_TICKS) * (over ? 1.5 : 1)));
  if (dest.under) fillBreath(state); // 물 위에서 내려서는 길이다: 숨은 가득 찬 채다
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
  if (!def || !placeById(state.place).actions.includes(id) || hiddenAction(state, id)) throw new Error('여기서는 할 수 없는 일입니다');
  if (def.rest) return rest(state, events);
  if (def.open) throw new Error('창에서 하는 일입니다');
  if (def.special === 'room') return rentRoom(state, events);
  if (def.special === 'heal') return templeHeal(state, events, def);
  if (def.special === 'torch') { state.lastAction = null; return lightTorch(state, events, takeById, countOf); }
  if (def.special === 'well') { state.lastAction = null; return useWell(state, events); }
  if (def.special === 'drink') { state.lastAction = null; return drinkWater(state, events); }
  if (def.special === 'whet') { state.lastAction = null; return useWhetstone(state, events); }
  if (def.special === 'lamp') { state.lastAction = null; return lightLamp(state, events); }
  if (def.special === 'surface') return surface(state, events);
  if (def.special === 'flag') { state.lastAction = null; return lookFlag(state, events); }
  if (def.special === 'witness') { state.lastAction = null; witness(state, events); advance(state, events, def.ticks); return; } // 한 번 누르면 한 번 지켜본다. 일로 치지 않는다 (BM-D4)
  if (def.special === 'airbag') { state.lastAction = null; return useAirbag(state, events); }
  if (def.special === 'knot') { state.lastAction = null; tieKnot(state, events); advance(state, events, def.ticks); return; }
  if (def.special === 'holy') {
    const i = state.bag.findIndex((x) => itemDef(x.id).eat?.shadow);
    if (i < 0) throw new Error('성수가 없습니다');
    state.lastAction = null;
    return eat(state, events, i);
  }
  if (def.special === 'duel') { state.lastAction = null; return startDuel(state, events); }
  if (def.special === 'watch') { state.lastAction = null; watchDuel(state, events); advance(state, events, def.ticks); return; }
  if (def.special === 'blessing') { state.lastAction = null; return blessingHere(state, events, giveGrace); }
  // 남의 일터의 일은 배워야 한다. 모르면 곁에서 구경한다 (Z29)
  if (def.teach && !knowsWork(state, id) && !placeById(state.place).anyone) { watchWork(state, events, id); state.lastAction = null; advance(state, events, def.ticks); return; }
  if (def.special === 'bread') {
    if (state.flags.breadDay === state.day) throw new Error('오늘은 이미 받았습니다. 빵은 하루에 하나입니다');
    state.flags.breadDay = state.day;
    const loaves = state.flags.bread2 ? 2 : 1; // 순례자는 어느 문에서 빵이 나오는지 안다
    addItem(state, 'bread', loaves);
    const baker = state.place === 'kitchen' ? '주방장' : state.place === 'grandtemple' ? '대사제' : '신전지기'; // 시작 마을의 빵은 공용주방에서 나눈다 (Z92)
    pushLine(state, events, { k: 'npc', who: baker, text: loaves > 1 ? '"먼 길 온 이에게는 하나 더."' : state.place === 'kitchen' ? '"배고픈 이는 누구든 하나씩. 경매장 사람들이 낸 은화로 구웠어."' : '"배고픈 이는 누구든 하나씩."' });
    pushLine(state, events, { k: 'sys', text: `빵 ${loaves}개를 받았다.` });
    events.push({ type: 'bag' });
    advance(state, events, def.ticks);
    return;
  }
  if (def.special === 'search') { search(state, events); advance(state, events, def.ticks); return; }
  if (def.wild) {
    // 안개 (AN-B2): 등불도 표식도 없이 탐색하면 길을 잃는다. 다친 데는 없지만 반나절이 가고 뜬마을 나루로 돌아온다
    if (def.wild === 'explore' && lostInFog(state, events)) {
      state.lastAction = null;
      advance(state, events, TRAVEL_TICKS);
      arrive(state, events, placeById(MARSH_GATE));
      pushLine(state, events, { k: 'sys', text: MARSH_LINES.found });
      pushLine(state, events, { k: 'npc', who: PEOPLE.yeoul.name, text: MARSH_LINES.keeper });
      return;
    }
    if (def.wild === 'explore') { explore(state, events); if (!state.battle && !state.choice) seekWell(state, events); } // 소금벌의 옛 우물 (SB-B2)
    else {
      gather(state, events); emberScoop(state, events); // 식은 가마: 쇳물 내의 식지 않은 재 (AG-D7)
      ledgerScoop(state, events); // 젖은 족보: 잠긴 거리의 궤 (JD-D6)
      // 물 아래에서는 캐는 동안에도 덤빈다 (JD-C4). 용병 둘이 다 있으면 그들이 맡고 나는 캐기를 이어 간다. 아니면 내가 싸운다
      const trouble = digTrouble(state, events, WILDS[state.place].monsters || [], weighted);
      if (trouble?.escorted) escortEnd(state, events, trouble, giveXp);
      else if (trouble) startBattle(state, events, trouble.mon);
    }
    advance(state, events, def.ticks + (def.wild === 'gather' ? branchOf(state, def.skill)?.ticks || 0 : 0));
    return;
  }

  const count = (state.counters.act[id] = (state.counters.act[id] || 0) + 1);
  const repeated = state.lastAction === id;
  state.lastAction = id;

  if (id === 'strike') strike(state, events, count);
  else pushLine(state, events, { k: 'me', text: variedLine(state, ACTION_LINES[`${id}@${state.place}`] ? `${id}@${state.place}` : id) }); // 곳마다 글이 다른 일(둘러보기, 기도)

  if (def.skill) {
    const skill = state.skills[def.skill] || (state.skills[def.skill] = emptySkill());
    const endure = state.hidden.endure?.value || 0;
    // 곳마다 하는 일은 그곳의 수준이 어려움이다(먼 마을일수록 많이 오른다)
    const difficulty = def.chore ? (CHORE_LEVEL[placeById(state.place).town] ?? 1) : def.difficulty;
    const result = useSkill(skill, difficulty, (repeated ? 1 + endure * 0.01 + (hasTitle(state, 'scarecrow') ? 0.02 : 0) : 1) * jobXp(state, def.skill, repeated) * (id === 'bellows' && state.flags.bellowsKnack ? BELLOWS_KNACK : 1)); // 풀무 요령 (AG-D6)
    if (result.leveled) {
      ding(state, events, {
        level: result.rankUp ? 2 : 1,
        title: `${SKILL_NAMES[def.skill]} 숙련도가 ${iGa(gradeLabel(result.grade))} 되었습니다`,
      });
    }
  }

  if (id === 'look') lookShop(state, events); // 빈 공방을 둘러보면 값을 안다 (AN-F3)
  // 레벨 95가 되기 전의 모루 앞 (CM-G2): 둘러보면 한 줄
  if (id === 'look' && state.place === ANVIL.front && state.main.chapter === 13 && state.level < ANVIL.liftLevel) pushLine(state, events, { k: 'sys', text: ANVIL_LINES.notYet });
  if (id === 'bellows') { pumped(state, events); pumpGoal(state, events); } // 풀무 골목의 풀무질 (AG-C4, AG-D)
  toilStat(state, events, id, count);
  afterCounters(state, events);
  chatter(state, events, id, count, options);
  advance(state, events, def.ticks);
}

/** 숨 쉬기 (JD-B2, JD-B3): 물 위로 올라가 선창으로 돌아온다. 숨이 가득 찬다. 싸우는 중에는 못 한다. 궁 안에서는 문지방에서만 오른다. */
function surface(state, events) {
  if (!underwater(state)) throw new Error('물 아래가 아닙니다');
  if (state.dungeon && !roomView(state).canLeave) throw new Error('물 위로 오르는 길은 들어온 곳에 있습니다');
  state.dungeon = null;
  state.lastAction = null;
  pushLine(state, events, { k: 'me', text: SUNKEN_LINES.up });
  arrive(state, events, placeById(SUNKEN_GATE));
  fillBreath(state);
  pushLine(state, events, { k: 'room', text: SUNKEN_LINES.wet });
  advance(state, events, ACTIONS.surface.ticks);
}

/** 종의 이끼를 한 번 걷는다 (AN-D). 가라앉는 오솔길의 끝, 종 앞에서만. 한 번 누르면 한 번이다. 오백 번이면 9장이 끝나고, 그 뒤에도 걷을 수 있다. */
function peelMoss(state, events) {
  if (state.dungeon?.id !== MOSS.dungeon || state.dungeon.room !== MOSS.room) throw new Error('이끼 덮인 종은 가라앉는 오솔길의 끝에 있습니다');
  const a = marshOf(state);
  a.moss += 1;
  state.counters.act.moss = (state.counters.act.moss || 0) + 1;
  state.lastAction = 'moss';
  pushLine(state, events, { k: 'me', text: MOSS_LINES.peel[int(state, MOSS_LINES.peel.length)] });
  if (a.moss === MOSS.peel / 2) pushLine(state, events, { k: 'room', text: MOSS_LINES.half });
  if (state.main.chapter === 9 && a.moss >= MOSS.peel) finishMain(state, events, 'peel');
  // 히든 "이끼 한 장" (LV-E6): 조건은 어디에도 내보내지 않는다
  if (a.moss >= MOSS.hidden && !state.hq.mossleaf && !state.choice) offerHidden(state, events, 'mossleaf');
}

/** 몸을 쓰는 일 (Z61): 한 번 할 때마다 그 일이 단련하는 능력치가 드물게 1 오른다. 상한은 없다. */
export const TOIL_STAT_RATE = 0.05; // 1% → 5% (Z101, 사용자 요청)
export const TOIL_STATS = {
  bellows: { stat: 'con', text: '풀무를 밀던 몸이 단단해졌다. 체력 +1.' },
  strike: { stat: 'str', text: '허수아비를 치던 팔에 힘이 붙었다. 힘 +1.' },
  pray: { stat: 'wis', text: '기도하던 마음이 한결 맑아졌다. 지혜 +1.' },
  sort: { stat: 'agi', text: '물건을 살피던 손끝이 빨라졌다. 민첩 +1.' },
  spin: { stat: 'agi', text: '실을 잣던 손끝이 빨라졌다. 민첩 +1.' },
  trim: { stat: 'con', text: '재료를 다듬던 팔에 힘이 붙었다. 체력 +1.' },
};
function toilStat(state, events, id, count) {
  const t = TOIL_STATS[id];
  if (!t || roll01(`${state.seed}|toilstat|${id}|${count}`) >= TOIL_STAT_RATE) return;
  state.stats[t.stat] += 1;
  if (!state.toilGained) state.toilGained = { str: 0, agi: 0, con: 0, wis: 0 };
  state.toilGained[t.stat] = (state.toilGained[t.stat] || 0) + 1; // 환생해도 남는다 (Z101)
  pushLine(state, events, { k: 'sys', tone: 'good', text: t.text });
  events.push({ type: 'stats' });
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
/** 그곳의 방 값. 새 지역은 그 구간 벌이에 맞춘다 (LV-L11, WM-C1: 화롯방 주막 30). */
export const roomFee = (state) => placeById(state.place).roomFee || INN_FEE;
/** 버프가 언제까지인지: 오늘 안에 끝나면 "낮(밤)이 되기 전까지". */
const untilText = (state, u) => (u.day === state.day ? (u.phase === 2 ? '밤이 되기 전까지' : '낮이 되기 전까지') : u.phase === 0 ? '다음 날 아침까지' : '다음 날 낮까지');

/** 들판에서 쉬거나 자는 사이 덮치는가. 덮치면 싸움이 시작된다. */
function ambushedAtRest(state, events, weight) {
  const here = placeById(state.place);
  if (!here.wild || !WILDS[here.id]) return false;
  if (predatorComes(state, events, '쉬는 사이 피 냄새를 맡은 것이 다가왔다.')) return true; // 먹잇감 냄새 (Z64)
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
  pushLine(state, events, { k: 'npc', who: HEALERS[state.place] || '신전지기', text: state.place === 'temple' ? '앉게. 어디 보자. 값은 걱정 말게, 경매장 수수료로 약은 넉넉히 사 두었어.' : '앉게. 어디 보자.' });
  pushLine(state, events, { k: 'sys', tone: 'good', text: `상처를 돌봐 주었다. 생명력 +${max - before}.` });
  advance(state, events, def.ticks);
}

/** 방을 빌려 제대로 잔다. 낮에도 된다. 생명력·마나가 다 차고 피로가 풀린다. 밤이면 아침까지, 낮이면 다음 때까지. */
function rentRoom(state, events) {
  const fee = roomFee(state);
  if (state.silver < fee) throw new Error(`은화 ${fee}은 있어야 합니다`);
  state.silver -= fee;
  state.lastAction = null;
  pushLine(state, events, { k: 'me', text: `은화 ${fee}을 내고 방을 빌렸다. 문을 닫고 누웠다.` });
  if (inWhite(state)) state.warm = WARM_MAX; // 화롯방 주막에서 자면 체온이 가득 찬다 (WM-B3)
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
    pushLine(state, events, { k: 'sys', tone: 'mint', text: `잘 잔 몸: ${b.name}. ${b.text}. ${untilText(state, b.until)}.` });
    const host = ROOM_HOSTS[state.place];
    if (host) pushLine(state, events, { k: 'npc', who: host[0], text: host[1] });
  }
  // 우물가 주막 (SB-C2): 자고 가는 수레꾼들이 가끔 내일 값을 흘린다
  if (state.place === 'wellinn') { const hint = marketHint(state); if (hint) pushLine(state, events, { k: 'npc', who: '우물 주인', text: `수레꾼들이 그러는데, ${hint.text}` }); }
}
const ROOM_HOSTS = {
  tavern: ['주점 주인', '잘 잤나. 우리 집 이불은 해 냄새가 나지.'],
  inn: ['주막 주인', '아랫목 덕 봤지? 뱃사람들은 그 맛에 여기 와.'],
  innrow: ['여인숙 주인', '깃털 이불이야. 머리가 맑아질 거야.'],
  hearth: ['주막 할멈', '여긴 다들 일찍 자. 끝까지 해 봐야 종이 안 우니까.'], // WM-D 주막의 글
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
