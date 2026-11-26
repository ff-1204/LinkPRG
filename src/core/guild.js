// 길드 (Z21). 가상 유저들의 길드에 들어가 한 일만큼 기여도를 쌓는다.
// 기여도는 계급이 되고, 계급은 길드마다 다른 덕을 준다. 길드끼리는 날마다 순위를 다툰다.

import { roll01 } from './rng.js?v=6b46da7';
import { pushLine, ding } from './log.js?v=6b46da7';
import { iGa, eulReul } from './ko.js?v=6b46da7';

export const GUILDS = {
  fang: { id: 'fang', name: '송곳니단', kind: 'fight', say: '사냥으로 말하는 사람들.', perk: '싸워서 얻는 경험치', per: 0.02, base: 1200, grow: 60 },
  anvil: { id: 'anvil', name: '모루회', kind: 'craft', say: '만든 것으로 말하는 사람들.', perk: '대장·조각·요리 숙련도 오름', per: 0.02, base: 1000, grow: 55 },
  lantern: { id: 'lantern', name: '등불 모임', kind: 'social', say: '사람 사이를 잇는 사람들.', perk: '가게에서 사는 값 깎임', per: 0.01, base: 900, grow: 50 },
};
export const GUILD_ORDER = ['fang', 'anvil', 'lantern'];
export const GUILD_RANKS = [
  { name: '신입', at: 0 }, { name: '단원', at: 50 }, { name: '정예', at: 200 }, { name: '간부', at: 600 }, { name: '부길드장', at: 1500 },
];
export const GUILD_LEVEL = 3; // 이 레벨부터 들어갈 수 있다
export const DONATE = { silver: 10, contrib: 2 };

export function guildRank(state) {
  const c = state.guild?.contrib || 0;
  let r = 0;
  for (let i = 0; i < GUILD_RANKS.length; i++) if (c >= GUILD_RANKS[i].at) r = i;
  return r;
}

/** 길드가 주는 덕의 크기(0이면 없음). kind: 'fight' | 'craft' | 'social'. */
export function guildPerk(state, kind) {
  const g = state.guild && GUILDS[state.guild.id];
  if (!g || g.kind !== kind) return 0;
  return g.per * guildRank(state);
}

/** 길드 순위. 가상 유저들의 길드는 날마다 조금씩 자란다. 내 길드에는 내 기여도가 더해진다. */
export function guildBoard(state) {
  return GUILD_ORDER.map((id) => {
    const g = GUILDS[id];
    const wobble = Math.floor(roll01(`${state.seed}|guild|${id}|${state.day}`) * 80);
    return { id, name: g.name, score: g.base + g.grow * state.day + wobble + (state.guild?.id === id ? state.guild.contrib : 0), mine: state.guild?.id === id };
  }).sort((a, b) => b.score - a.score).map((x, i) => ({ ...x, place: i + 1 }));
}

/** 길드 창이 그릴 것. */
export function guildView(state) {
  const g = state.guild && GUILDS[state.guild.id];
  const r = guildRank(state);
  const next = GUILD_RANKS[r + 1] || null;
  return {
    can: state.level >= GUILD_LEVEL,
    why: state.level >= GUILD_LEVEL ? '' : `레벨 ${GUILD_LEVEL}부터 들어갈 수 있다`,
    mine: g ? { id: g.id, name: g.name, kind: g.kind, say: g.say, contrib: state.guild.contrib, rank: GUILD_RANKS[r].name, next: next ? { name: next.name, at: next.at } : null, perk: `${g.perk} +${Math.round(g.per * r * 100)}%`, joined: state.guild.joined } : null,
    list: GUILD_ORDER.map((id) => ({ id, name: GUILDS[id].name, say: GUILDS[id].say, perk: `${GUILDS[id].perk} (계급마다 +${Math.round(GUILDS[id].per * 100)}%)` })),
    board: guildBoard(state),
    left: state.flags.guildLeft === state.day,
  };
}

export function joinGuild(state, events, id) {
  if (!GUILDS[id]) throw new Error('모르는 길드입니다');
  if (state.guild) throw new Error('이미 길드에 들어 있습니다');
  if (state.level < GUILD_LEVEL) throw new Error(`레벨 ${GUILD_LEVEL}부터 들어갈 수 있습니다`);
  if (state.flags.guildLeft === state.day) throw new Error('오늘 길드를 나왔습니다. 내일 다시 오십시오');
  state.guild = { id, contrib: 0, joined: state.day };
  pushLine(state, events, { k: 'user', who: `${GUILDS[id].name} 길드장`, text: '환영함. 여긴 말보다 한 일을 봄. 기여도는 속일 수 없으니까.' });
  ding(state, events, { level: 2, title: `길드 ${eulReul(`'${GUILDS[id].name}'`)} 들어갔습니다`, big: GUILDS[id].name, body: `한 일만큼 기여도가 쌓입니다. 계급이 오르면 ${GUILDS[id].perk}이 좋아집니다.` });
  state.journal.push({ day: state.day, phase: state.phase, place: state.place, text: `${GUILDS[id].name}에 들어갔다.`, note: '길드에 든 날' });
  events.push({ type: 'guild' });
}

export function leaveGuild(state, events) {
  if (!state.guild) throw new Error('길드에 들어 있지 않습니다');
  const g = GUILDS[state.guild.id];
  pushLine(state, events, { k: 'me', text: `${eulReul(g.name)} 나왔다. 쌓은 기여도는 두고 간다.` });
  state.guild = null;
  state.flags.guildLeft = state.day;
  events.push({ type: 'guild' });
}

/** 기여도를 올린다. 길드의 성격에 맞는 일(kind)이면 두 배. */
export function contribute(state, events, n, kind) {
  if (!state.guild || n <= 0) return;
  const g = GUILDS[state.guild.id];
  const before = guildRank(state);
  state.guild.contrib += Math.round(n * (g.kind === kind ? 2 : 1));
  const after = guildRank(state);
  if (after > before) {
    ding(state, events, { level: after >= 3 ? 3 : 2, title: `${g.name}에서 ${iGa(`'${GUILD_RANKS[after].name}'`)} 되었습니다`, big: GUILD_RANKS[after].name, body: `${g.perk} +${Math.round(g.per * after * 100)}%.` });
    events.push({ type: 'guild' });
  }
}

export function donate(state, events) {
  if (!state.guild) throw new Error('길드에 들어 있지 않습니다');
  if (state.silver < DONATE.silver) throw new Error(`은화 ${DONATE.silver}은 있어야 합니다`);
  state.silver -= DONATE.silver;
  pushLine(state, events, { k: 'me', text: `길드 금고에 은화 ${DONATE.silver}을 넣었다.` });
  contribute(state, events, DONATE.contrib, null);
  events.push({ type: 'guild' });
}

/**
 * 한 일이 끝난 뒤에 부른다. 무엇을 했는지는 일어난 일(events)에서 읽는다.
 * 싸움에서 이김 +1(이름난 개체 +10), 만든 것 +2(등급마다 +2), 강화 성공 +강화 수, 의뢰 끝냄 +5.
 */
export function guildHook(state, events, action) {
  if (!state.guild) return;
  for (const e of [...events]) {
    if (e.type === 'battle' && e.phase === 'win') contribute(state, events, e.elite ? 10 : 1, 'fight');
    else if (e.type === 'craft' && e.phase === 'done') contribute(state, events, 2 + (e.grade || 0) * 2, 'craft');
    else if (e.type === 'sculpt' && e.phase === 'done') contribute(state, events, 2 + (e.grade || 0) * 2, 'craft');
    else if (e.type === 'enhance' && e.ok) contribute(state, events, e.plus, 'craft');
    else if (e.type === 'jobdone') contribute(state, events, 5, 'social');
  }
  if (action.type === 'gift' || action.type === 'talk') {
    const g = state.flags.guildTalk && state.flags.guildTalk.day === state.day ? state.flags.guildTalk : (state.flags.guildTalk = { day: state.day, ids: [] });
    const key = `${action.type}:${action.npc}`;
    if (!g.ids.includes(key)) { g.ids.push(key); contribute(state, events, 1, 'social'); }
  }
}
