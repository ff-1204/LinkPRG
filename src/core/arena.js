// 겨루기 마당 (AG-C): 하루에 한 번, 내 레벨 언저리의 가상 유저와 일대일로 싸운다.
// 싸움은 "모험가와 싸우기"(Z72)의 틀 그대로다. 다만 죽지 않고, 살인의 추억도 붙지 않는다.
// 이기면 명성과 은화와 띠링. 지면 잃는 것은 없고, 풀무 골목에서 풀무질 서른 번을 해야 다시 선다.

import { seedFrom } from './rng.js?v=fb79329';
import { pushLine, ding } from './log.js?v=fb79329';
import { startBattle } from './battle.js?v=fb79329';
import { addFame } from './social.js?v=fb79329';
import { bandByNo } from '../data/bands.js?v=fb79329';
import { ARENA_FOES, foeById, habitSay } from '../data/arena.js?v=fb79329';
import { ashOf, HEAT } from './heat.js?v=fb79329';
import { eulReul } from './ko.js?v=fb79329';

/** place: 마당. row: 풀무 골목. pumps: 지고 나서 채울 풀무질. wins: 큰 대장간 주인이 나서는 승수. fame: 한 번 이길 때의 명성. base: 상대의 바탕이 되는 괴물(틀만 빌린다). */
export const ARENA = { place: 'arena', row: 'bellowsrow', pumps: 30, wins: 10, fame: 5, base: 'ashblade', judge: '심판 노을' };
export const ARENA_LINES = {
  enter: '마당에 들어섰다.',
  win: '상대가 한쪽 무릎을 꿇었다. 심판 노을이 내 손을 들었다. 높은 대에서 검이 길게 운다.',
  lose: '무릎이 꺾였다. 심판 노을이 상대의 손을 들었다. 검이 운다. 내 것이 아닌 소리다.',
  loseSay: '졌소. 풀무 골목에서 풀무질 서른 번이오. 채우면 다시 서도 좋소.',
  loseNote: '겨루기에서 졌다. 잃은 것은 없다. 풀무 골목에서 풀무질 서른 번을 해야 마당에 다시 설 수 있다.',
  back: '풀무질 서른 번을 채웠다. 마당에 다시 설 수 있다.',
  ten: '열 번이오. 큰 대장간 주인이 당신을 찾소. 그 사람이 먼저 사람을 찾는 건 드문 일이오.',
  watch: '둘레에 끼어 서서 남의 겨루기를 지켜보았다.',
  watchNone: '둘레에 끼어 서서 남의 겨루기를 지켜보았다. 새로 눈에 들어오는 것은 없다.',
};

const duelOf = (state) => ashOf(state).duel;
/** 한 번 이길 때의 은화: 그 구간 하루 벌이의 절반 (AG-C3). */
export const arenaPrize = () => Math.round(bandByNo(HEAT.band).day / 2);

/** 오늘의 상대: 날마다 바뀌고, 같은 날에는 같다. 레벨은 내 레벨 언저리(−1 ~ +2). */
export function foeToday(state) {
  const foe = ARENA_FOES[seedFrom(`${state.seed}|arena|${state.day}`) % ARENA_FOES.length];
  const level = Math.max(1, state.level - 1 + (seedFrom(`${state.seed}|arenalv|${state.day}`) % 4));
  return { id: foe.id, name: foe.name, level };
}

/** 화면이 그릴 것: 오늘 상대, 오늘 남은 판, 지고 나서 남은 풀무질. */
export function arenaView(state) {
  const d = duelOf(state);
  const fought = d.day === state.day;
  return { foe: foeToday(state), left: fought || d.lost ? 0 : 1, fought, lost: !!d.lost, pumps: d.pumps || 0, need: ARENA.pumps, wins: d.wins || 0 };
}

/** 마당에 들어서면 심판이 그날 상대를 알린다 (AG-C1). 하루에 한 번만 말한다. */
export function judgeSays(state, events) {
  const d = duelOf(state);
  if (d.told === state.day) return;
  d.told = state.day;
  const v = arenaView(state);
  const text = v.lost ? `풀무질이 ${v.need - v.pumps}번 남았소. 채우고 오시오. 그 전에는 마당에 못 서오.`
    : `오늘 상대는 '${v.foe.name}'이오. 레벨 ${v.foe.level}쯤. 죽이지는 않소. 지면 풀무 골목에서 풀무질 서른 번이오.`;
  pushLine(state, events, { k: 'npc', who: ARENA.judge, text });
}

/** 겨루기를 시작한다. 하루에 한 번. 지고 나서는 풀무질 서른 번을 채워야 한다. */
export function startDuel(state, events) {
  if (state.place !== ARENA.place) throw new Error('겨루기는 겨루기 마당에서 합니다');
  const d = duelOf(state);
  if (d.lost) throw new Error(`풀무 골목에서 풀무질 ${ARENA.pumps - (d.pumps || 0)}번을 더 해야 다시 설 수 있습니다`);
  if (d.day === state.day) throw new Error('오늘은 이미 겨뤘습니다. 겨루기는 하루에 한 번입니다');
  d.day = state.day;
  const foe = foeToday(state);
  pushLine(state, events, { k: 'me', text: ARENA_LINES.enter });
  startBattle(state, events, ARENA.base, { arena: { foe: foe.id, name: foe.name, level: foe.level, last: null, rested: false } });
}

/** 구경 (AG-C5): 한 번 볼 때마다 그날 상대의 버릇 하나가 대화방에 적힌다. */
export function watchDuel(state, events) {
  if (state.place !== ARENA.place) throw new Error('구경은 겨루기 마당에서 합니다');
  const d = duelOf(state);
  if (d.seenDay !== state.day) { d.seenDay = state.day; d.seen = []; }
  const foe = foeById(foeToday(state).id);
  const next = foe.habits.find((h) => !d.seen.includes(h));
  if (!next) { pushLine(state, events, { k: 'me', text: ARENA_LINES.watchNone }); return; }
  d.seen.push(next);
  pushLine(state, events, { k: 'me', text: ARENA_LINES.watch });
  pushLine(state, events, { k: 'sys', who: '구경', text: habitSay(foe, next) });
}

/** 싸움이 끝났다(이겼거나 졌거나). dispatch가 싸움 뒤에 부른다. */
export function arenaHook(state, events) {
  const e = events.find((x) => x.type === 'battle' && x.arena && (x.phase === 'win' || x.phase === 'lose'));
  if (!e) return;
  const d = duelOf(state);
  if (e.arena.won) {
    d.wins = (d.wins || 0) + 1;
    const silver = arenaPrize();
    state.silver += silver;
    pushLine(state, events, { k: 'room', text: ARENA_LINES.win });
    addFame(state, events, ARENA.fame);
    pushLine(state, events, { k: 'sys', text: `겨루기에서 이겼다. 은화 +${silver}, 명성 +${ARENA.fame}.`, tone: 'good' });
    ding(state, events, { level: 2, kind: 'arena', title: `겨루기에서 ${eulReul(`'${e.arena.name}'`)} 이겼습니다`, big: `마당에서 ${d.wins}번 이김`, body: '높은 대에 걸린 검이 울었습니다.' });
    if (d.wins === ARENA.wins) pushLine(state, events, { k: 'npc', who: ARENA.judge, text: ARENA_LINES.ten });
  } else {
    d.lost = true; d.pumps = 0;
    pushLine(state, events, { k: 'room', text: ARENA_LINES.lose });
    pushLine(state, events, { k: 'npc', who: ARENA.judge, text: ARENA_LINES.loseSay });
    pushLine(state, events, { k: 'sys', text: ARENA_LINES.loseNote, tone: 'warn' });
  }
  events.push({ type: 'quest' });
}

/** 풀무 골목에서 풀무를 한 번 밀었다. 진 사람은 서른 번을 채우면 다시 선다 (AG-C4). */
export function pumped(state, events) {
  if (state.place !== ARENA.row) return;
  const a = ashOf(state);
  a.pumps = (a.pumps || 0) + 1;
  const d = a.duel;
  if (!d.lost) return;
  d.pumps = (d.pumps || 0) + 1;
  if (d.pumps >= ARENA.pumps) {
    d.lost = false; d.pumps = 0; d.told = 0;
    pushLine(state, events, { k: 'sys', text: ARENA_LINES.back, tone: 'good' });
    events.push({ type: 'quest' });
  }
}
