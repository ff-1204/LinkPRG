// 던전 (T15~T19). 층과 방을 방 목록으로 옮겨 다닌다. 지나온 방만 지도에 그려진다.
// 나가면 지도와 연 문·챙긴 보물은 남고, 괴물과 쉼터는 다시 찬다.

import { next } from './rng.js?v=1034cb5';
import { pushLine, ding } from './log.js?v=1034cb5';
import { DUNGEONS, REST_HEAL, KEEPER } from '../data/dungeon.js?v=1034cb5';
import { STAT_NAMES } from '../data/origins.js?v=1034cb5';
import { itemDef } from '../data/items.js?v=1034cb5';
import { monsterDef } from '../data/monsters.js?v=1034cb5';
import { addItem, countOf, takeById } from './inventory.js?v=1034cb5';
import { startBattle } from './battle.js?v=1034cb5';
import { emptySkill, useSkill, gradeLabel, SKILL_NAMES } from './skills.js?v=1034cb5';
import { valueOf } from './derived.js?v=1034cb5';
import { jobXp, adv } from './jobs.js?v=1034cb5';
import { partyRest } from './party.js?v=1034cb5';
import { iGa, eulReul, ro } from './ko.js?v=1034cb5';
import { hasTitle } from './titles.js?v=1034cb5';

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const defOf = (state) => DUNGEONS[state.dungeon.id];
const roomOf = (state, id = state.dungeon.room) => defOf(state).rooms[id];
const memOf = (state, id = state.dungeon.id) => state.dmem[id] || (state.dmem[id] = { seen: [], done: {}, nights: 0, keeper: null });

/** 스탯 판정의 성공 확률: 50% + (내 스탯 − 필요한 값) × 5%. */
export function statChance(state, { stat, need }) {
  return clamp(0.5 + (state.stats[stat] - need) * 0.05, 0.05, 0.95);
}
function rollStat(state, events, name, check) {
  const need = Math.round(statChance(state, check) * 100);
  const roll = 1 + Math.floor(next(state) * 100);
  const ok = roll <= need;
  pushLine(state, events, { k: 'sys', who: '판정', text: `${name} ${ok ? '성공' : '실패'}. 주사위 ${roll}, ${need} 이하면 성공. (${STAT_NAMES[check.stat]} ${state.stats[check.stat]})` });
  events.push({ type: 'check', kind: name, ok, roll, need });
  return ok;
}

/** 자물쇠 따기의 성공 확률: 자물쇠 숙련도로. */
export function pickChance(state, need) {
  return clamp(0.4 + ((state.skills.lockpick?.grade || 0) - need) * 0.1 + (state.job === 'rogue' ? 0.15 : 0) + (adv(state).pick || 0), 0.05, 0.95);
}

/** 이 방의 일이 끝났는가(싸움을 이겼거나, 함정을 지났거나, 문을 열었거나). */
function resolved(state, id = state.dungeon.room) {
  const r = roomOf(state, id);
  const mem = memOf(state);
  if (r.kind === 'fight') return !!state.dungeon.cleared[id];
  if (r.kind === 'boss') return !!mem.keeper;
  if (r.kind === 'trap' || r.kind === 'door') return !!mem.done[id];
  return true;
}

export function enterDungeon(state, events, id) {
  const d = DUNGEONS[id];
  if (!d) throw new Error('모르는 곳입니다');
  if (state.dungeon) throw new Error('이미 안에 있습니다');
  if (state.place !== d.from) throw new Error('입구에서 들어갑니다');
  if (d.needFlag && !state.flags[d.needFlag]) throw new Error(d.needSay);
  state.dungeon = { id, room: d.start, prev: null, cleared: {}, rested: {}, alert: false };
  state.lastAction = null;
  const mem = memOf(state);
  pushLine(state, events, { k: 'me', text: `${d.name} 안으로 내려갔다.${mem.seen.length ? ' 지난번에 그린 지도가 손에 있다.' : ''}` });
  arrive(state, events);
  events.push({ type: 'move', to: state.place });
}

export function leaveDungeon(state, events) {
  if (!state.dungeon) throw new Error('던전 안이 아닙니다');
  if (!roomOf(state).exit) throw new Error('밖으로 나가는 길은 들어온 곳에 있습니다');
  const d = defOf(state);
  state.dungeon = null;
  state.lastAction = null;
  pushLine(state, events, { k: 'me', text: `${d.name} 밖으로 나왔다. 눈이 부시다.` });
  events.push({ type: 'move', to: state.place });
}

function arrive(state, events) {
  const dg = state.dungeon;
  const r = roomOf(state);
  const mem = memOf(state);
  if (!mem.seen.includes(dg.room)) mem.seen.push(dg.room);
  pushLine(state, events, { k: 'room', who: `${defOf(state).floors[r.floor]}, ${r.name}`, text: r.text });
  events.push({ type: 'room', room: dg.room });
  if (r.kind === 'fight' && !dg.cleared[dg.room]) {
    const ambush = dg.alert;
    dg.alert = false;
    if (ambush) pushLine(state, events, { k: 'room', text: '문 부서지는 소리를 듣고 기다리고 있었다.' });
    startBattle(state, events, r.mon, { ambush });
    return;
  }
  if ((r.kind === 'trap' || r.kind === 'door') && !mem.done[dg.room]) { state.choice = { kind: r.kind, room: dg.room }; events.push({ type: 'choice' }); return; }
  if (r.kind === 'boss' && !mem.keeper) { state.choice = { kind: 'keeper', room: dg.room }; events.push({ type: 'choice' }); return; }
  if (r.kind === 'treasure' && !mem.done[dg.room]) {
    mem.done[dg.room] = true;
    for (const [id, n] of r.loot.items) addItem(state, id, n);
    state.silver += r.loot.silver || 0;
    pushLine(state, events, { k: 'sys', who: '보물', text: r.loot.say });
  }
}

/** 옆 방으로 간다. 이 방의 일이 끝나지 않았으면 지나온 방으로만 돌아갈 수 있다. */
export function moveRoom(state, events, to) {
  const dg = state.dungeon;
  if (!dg) throw new Error('던전 안이 아닙니다');
  const r = roomOf(state);
  if (!r.exits.includes(to)) throw new Error('이 방에서 갈 수 없는 곳입니다');
  const mem = memOf(state);
  if (!resolved(state) && !mem.seen.includes(to)) throw new Error('이 방의 일을 넘어야 앞으로 갈 수 있습니다');
  if (r.kind === 'door' && r.door.beyond === to && !mem.done[dg.room]) throw new Error(`${iGa(r.door.name)} 잠겨 있습니다`);
  dg.prev = dg.room;
  dg.room = to;
  state.lastAction = null;
  pushLine(state, events, { k: 'me', text: `${ro(roomOf(state).name)} 갔다.` });
  arrive(state, events);
}

/** 방 목록이 그릴 것: "이 방에서 갈 수 있는 곳" (T15). 가 보지 않은 방은 이름을 모른다. */
export function roomView(state) {
  const dg = state.dungeon;
  if (!dg) return null;
  const d = defOf(state);
  const r = roomOf(state);
  const mem = memOf(state);
  const KIND = { fight: '싸움', trap: '함정', door: '잠긴 문', treasure: '보물', rest: '쉼터', boss: '우두머리', hall: '지나는 길', bell: '맨 아래' };
  return {
    dungeon: d.name, floor: d.floors[r.floor], name: r.name, kind: KIND[r.kind], text: r.text,
    canLeave: !!r.exit, canRest: r.kind === 'rest', rested: !!dg.rested[dg.room],
    exits: r.exits.map((id) => {
      const x = d.rooms[id];
      const seen = mem.seen.includes(id);
      const locked = r.kind === 'door' && r.door.beyond === id && !mem.done[dg.room];
      const blocked = !seen && !resolved(state);
      // 방향 (사용자 피드백: 어디쯤인지 모르겠다): 다른 층이면 아래층·위층, 같은 층이면 칸의 자리로 동서남북
      const dx = x.pos[0] - r.pos[0], dy = x.pos[1] - r.pos[1];
      const dir = x.floor !== r.floor ? (x.floor > r.floor ? '아래로' : '위로') : Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? '동' : dx < 0 ? '서' : '') : (dy > 0 ? '남' : '북');
      return { id, name: seen ? x.name : '가 보지 않은 곳', dir, floor: x.floor !== r.floor ? d.floors[x.floor] : '', seen, can: !locked && !blocked, why: locked ? '잠겨 있다' : blocked ? '이 방의 일을 넘어야 한다' : '' };
    }),
  };
}

/** 일지 탭의 지도 (T18): 지나온 방만. 층마다 칸의 목록. */
export function dungeonMap(state, id = state.dungeon?.id) {
  if (!id || !state.dmem[id]) return null;
  const d = DUNGEONS[id];
  const mem = state.dmem[id];
  const here = state.dungeon?.id === id ? state.dungeon.room : null;
  return d.floors.map((name, f) => ({
    name,
    rooms: mem.seen.filter((rid) => d.rooms[rid].floor === f).map((rid) => ({ id: rid, name: d.rooms[rid].name, pos: d.rooms[rid].pos, here: rid === here })),
  })).filter((fl) => fl.rooms.length);
}

/** 쉼터에서 쉰다. 한 번만 (T19). */
export function restInRoom(state, events) {
  const dg = state.dungeon;
  if (!dg || roomOf(state).kind !== 'rest') throw new Error('쉼터가 아닙니다');
  if (dg.rested[dg.room]) throw new Error('이미 쉬었습니다');
  dg.rested[dg.room] = true;
  const max = valueOf(state, 'maxHp');
  const before = state.hp;
  state.hp = Math.min(max, state.hp + Math.round(max * REST_HEAL));
  state.mp = valueOf(state, 'maxMp');
  partyRest(state);
  pushLine(state, events, { k: 'me', text: '불을 피우고 등을 기댔다. 눈을 조금 붙였다.' });
  pushLine(state, events, { k: 'sys', text: `생명력 +${state.hp - before}. 마나가 찼다. 여기서는 더 쉴 수 없다.` });
  events.push({ type: 'room', room: dg.room });
}

// ── 함정, 잠긴 문, 문지기 앞에서 정하는 것 ──

export function dungeonChoiceView(state) {
  const c = state.choice;
  const r = roomOf(state, c.room);
  const pct = (p) => Math.round(p * 100);
  if (c.kind === 'trap') {
    const t = r.trap;
    return {
      kind: 'trap', title: '함정', side: t.name, text: r.text, note: `밟으면 ${t.dmg} 피해를 입는다.`,
      options: [
        { id: 'dodge', label: `뛰어넘는다 (${STAT_NAMES[t.dodge.stat]} 판정, 성공 ${pct(statChance(state, t.dodge))}%)`, go: true },
        { id: 'disarm', label: `풀어 놓는다 (${STAT_NAMES[t.disarm.stat]} 판정, 성공 ${pct(statChance(state, t.disarm))}%)` },
        { id: 'back', label: '돌아간다' },
      ],
    };
  }
  if (c.kind === 'door') {
    const d = r.door;
    const hasKey = countOf(state, d.key) > 0;
    return {
      kind: 'door', title: '잠긴 문', side: d.name, text: r.text, note: '부수면 소리가 난다. 다음 방의 것이 먼저 덤빈다.',
      options: [
        { id: 'pick', label: `자물쇠를 딴다 (자물쇠 숙련, 성공 ${pct(pickChance(state, d.pick))}%)`, go: true },
        { id: 'force', label: `부순다 (${STAT_NAMES[d.force.stat]} 판정, 성공 ${pct(statChance(state, d.force))}%)` },
        { id: 'key', label: `${itemDef(d.key).name}로 연다`, disabled: !hasKey, why: hasKey ? '' : `${itemDef(d.key).name}가 없다` },
        { id: 'back', label: '돌아간다' },
      ],
    };
  }
  // 문지기
  const mem = memOf(state);
  const night = state.phase === 2;
  const closed = mem.keeperClosed || [];
  const mendOk = (state.skills[KEEPER.mend.skill[0]]?.grade || 0) >= KEEPER.mend.skill[1] && KEEPER.mend.items.every(([id, n]) => countOf(state, id) >= n);
  return {
    kind: 'keeper', title: '문지기 앞에서', side: '폐허의 문지기', text: r.text,
    note: `문지기는 먼저 치지 않는다. 문만 지킨다.${mem.nights ? ` 곁에서 지킨 밤: ${mem.nights}.` : ''}`,
    options: [
      { id: 'fight', label: '쓰러뜨린다', go: true },
      { id: 'tell', label: `네 주인은 죽었다고 말한다 (설득 판정, 성공 ${pct(tellChance(state))}%)`, disabled: closed.includes('tell'), why: closed.includes('tell') ? '이미 통하지 않았다' : '' },
      { id: 'mend', label: '부서진 팔을 고쳐 준다', disabled: !mendOk, why: mendOk ? '' : '대장 중급 1 이상, 철광석 10개' },
      { id: 'sneak', label: `등 뒤로 몰래 지나간다 (민첩 판정, 성공 ${pct(statChance(state, KEEPER.sneak))}%)`, disabled: !night || mem.sneakDay === state.day, why: !night ? '밤이어야 한다' : mem.sneakDay === state.day ? '들켰다. 오늘은 안 된다' : '' },
      { id: 'stay', label: '곁에 앉아 같이 문을 본다', disabled: !night, why: night ? '' : '밤이어야 한다' },
      { id: 'back', label: '돌아간다' },
    ],
  };
}

/** 문지기에게 말이 통할 확률: 매력과 떠돌이 악사의 말솜씨. 문지기의 고집은 14. */
export function tellChance(state) {
  return clamp(0.5 + (10 + (state.hidden.charm?.value || 0) * 2 - 14) * 0.05 + (state.flags.persuade10 ? 0.10 : 0) + (hasTitle(state, 'helper') ? 0.05 : 0), 0.05, 0.95);
}

function goBack(state, events) {
  const dg = state.dungeon;
  state.choice = null;
  const to = dg.prev && roomOf(state).exits.includes(dg.prev) ? dg.prev : roomOf(state).exits.find((x) => memOf(state).seen.includes(x) && x !== dg.room);
  pushLine(state, events, { k: 'me', text: '물러섰다.' });
  if (to) { const from = dg.room; dg.room = to; dg.prev = from; arrive(state, events); }
}

function passKeeper(state, events, path, say) {
  const mem = memOf(state);
  mem.keeper = path;
  state.flags.keeperAlive = path !== 'beat';
  state.choice = null;
  if (say) pushLine(state, events, { k: 'room', text: say });
  pushLine(state, events, { k: 'sys', text: '큰 문이 열렸다. 아래로 내려가는 계단이 보인다.' });
  events.push({ type: 'room', room: state.dungeon?.room });
}

export function dungeonChoose(state, events, id) {
  const c = state.choice;
  const r = roomOf(state, c.room);
  const mem = memOf(state);
  if (id === 'back') return goBack(state, events);
  if (c.kind === 'trap') {
    const t = r.trap;
    if (id !== 'dodge' && id !== 'disarm') throw new Error('고를 수 없는 것입니다');
    const ok = rollStat(state, events, id === 'dodge' ? '뛰어넘기' : '풀어 놓기', t[id]);
    mem.done[c.room] = true; // 한 번 지나면 다시 걸리지 않는다
    state.choice = null;
    if (ok) pushLine(state, events, { k: 'me', text: id === 'dodge' ? t.okSay : t.disarmSay });
    else { state.hp = Math.max(1, state.hp - t.dmg); pushLine(state, events, { k: 'room', text: `${t.say} ${t.dmg} 피해.` }); }
    return;
  }
  if (c.kind === 'door') {
    const d = r.door;
    if (id === 'key') {
      if (countOf(state, d.key) < 1) throw new Error(`${itemDef(d.key).name}가 없습니다`);
      takeById(state, d.key, 1);
      mem.done[c.room] = true; state.choice = null;
      pushLine(state, events, { k: 'me', text: `${itemDef(d.key).name}를 넣고 돌렸다. 녹이 부서지며 문이 열린다.` });
      return;
    }
    if (id === 'pick') {
      const need = Math.round(pickChance(state, d.pick) * 100);
      const roll = 1 + Math.floor(next(state) * 100);
      const ok = roll <= need;
      pushLine(state, events, { k: 'sys', who: '판정', text: `자물쇠 따기 ${ok ? '성공' : '실패'}. 주사위 ${roll}, ${need} 이하면 성공.` });
      events.push({ type: 'check', kind: '자물쇠 따기', ok, roll, need });
      const skill = state.skills.lockpick || (state.skills.lockpick = emptySkill());
      const up = useSkill(skill, d.pick * 3, jobXp(state, 'lockpick'));
      if (up.leveled) ding(state, events, { level: up.rankUp ? 2 : 1, title: `${SKILL_NAMES.lockpick} 숙련도가 ${iGa(gradeLabel(up.grade))} 되었습니다` });
      if (ok) { mem.done[c.room] = true; state.choice = null; pushLine(state, events, { k: 'me', text: '걸쇠가 딸깍 넘어갔다. 문이 소리 없이 열린다.' }); }
      else pushLine(state, events, { k: 'room', text: '철사가 헛돌았다. 다시 해 볼 수 있다.' });
      events.push({ type: 'choice' });
      return;
    }
    if (id === 'force') {
      const ok = rollStat(state, events, '문 부수기', d.force);
      if (ok) { mem.done[c.room] = true; state.choice = null; state.dungeon.alert = true; pushLine(state, events, { k: 'me', text: `${eulReul(d.name)} 어깨로 들이받아 부쉈다. 소리가 복도 끝까지 울린다.` }); }
      else { state.hp = Math.max(1, state.hp - 5); pushLine(state, events, { k: 'room', text: '문은 꿈쩍도 않고 어깨만 울린다. 5 피해.' }); events.push({ type: 'choice' }); }
      return;
    }
    throw new Error('고를 수 없는 것입니다');
  }
  if (c.kind === 'keeper') {
    const closed = mem.keeperClosed || (mem.keeperClosed = []);
    if (id === 'fight') { state.choice = null; pushLine(state, events, { k: 'me', text: '무기를 들었다. 문지기가 처음으로 이쪽을 본다.' }); startBattle(state, events, r.mon); return; }
    if (id === 'tell') {
      if (closed.includes('tell')) throw new Error('이미 통하지 않았습니다');
      const need = Math.round(tellChance(state) * 100);
      const roll = 1 + Math.floor(next(state) * 100);
      const ok = roll <= need;
      pushLine(state, events, { k: 'me', text: '"네가 기다리는 사람은 오지 않아. 오래전에 죽었어."' });
      pushLine(state, events, { k: 'sys', who: '판정', text: `설득 ${ok ? '성공' : '실패'}. 주사위 ${roll}, ${need} 이하면 성공. (문지기의 고집 14)` });
      events.push({ type: 'check', kind: 'persuade', ok, roll, need });
      if (ok) return passKeeper(state, events, 'tell', '문지기는 오래 서 있었다. 그러고는 한 걸음 옆으로 비켜섰다. 쇠 긁히는 소리가 꼭 한숨 같다.');
      closed.push('tell');
      pushLine(state, events, { k: 'room', text: '문지기는 듣지 않는다. 문만 본다.' });
      events.push({ type: 'choice' });
      return;
    }
    if (id === 'mend') {
      const m = KEEPER.mend;
      if ((state.skills[m.skill[0]]?.grade || 0) < m.skill[1]) throw new Error('대장 숙련도가 중급 1 이상이어야 합니다');
      for (const [itemId, n] of m.items) if (countOf(state, itemId) < n) throw new Error(`${iGa(itemDef(itemId).name)} 모자랍니다`);
      for (const [itemId, n] of m.items) takeById(state, itemId, n);
      return passKeeper(state, events, 'mend', '갈라진 팔을 쇠로 덧대고 못을 쳤다. 문지기가 팔을 한 번 쥐었다 편다. 그러고는 제 손으로 문을 밀어 열었다.');
    }
    if (id === 'sneak') {
      if (state.phase !== 2) throw new Error('밤이어야 합니다');
      if (mem.sneakDay === state.day) throw new Error('들켰습니다. 오늘은 안 됩니다');
      const ok = rollStat(state, events, '몰래 지나가기', KEEPER.sneak);
      if (ok) return passKeeper(state, events, 'sneak', '문지기의 등 뒤, 문틈으로 몸을 밀어 넣었다. 문지기는 돌아보지 않았다. 알고도 모른 척한 것 같기도 하다.');
      mem.sneakDay = state.day;
      pushLine(state, events, { k: 'room', text: '쇠 손이 앞을 막는다. 밀어내기만 하고 치지는 않는다.' });
      events.push({ type: 'choice' });
      return;
    }
    if (id === 'stay') {
      if (state.phase !== 2) throw new Error('밤이어야 합니다');
      mem.nights += 1;
      pushLine(state, events, { k: 'me', text: '문지기 곁에 앉아 문을 보았다. 아무 일도 일어나지 않았다. 밤이 갔다.' });
      state.choice = null;
      events.push({ type: 'night' }); // 밤을 새웠다: 게임이 아침으로 넘긴다
      if (mem.nights >= KEEPER.nights) passKeeper(state, events, 'hidden', '사흘째 아침, 문지기가 먼저 일어섰다. 이쪽을 한 번 보고, 제 손으로 문을 열었다. 같이 지킨 사람에게는 문을 지킬 까닭이 없다는 듯이.');
      else { pushLine(state, events, { k: 'room', text: '문지기가 고개를 아주 조금 이쪽으로 돌린 것 같다.' }); state.choice = { kind: 'keeper', room: c.room }; events.push({ type: 'choice' }); }
      return;
    }
    throw new Error('고를 수 없는 것입니다');
  }
  throw new Error('고를 수 없는 것입니다');
}

/**
 * dispatch가 끝날 때마다 부른다: 이긴 싸움의 방을 비우고, 쓰러졌으면 밖으로 내보낸다.
 * @returns {string|null} 종이 있는 방에 닿았으면 문지기를 넘은 길
 */
export function dungeonHook(state, events) {
  const dg = state.dungeon;
  if (!dg) return null;
  if (events.some((e) => e.type === 'fall')) { state.dungeon = null; return null; }
  const r = roomOf(state);
  const mem = memOf(state);
  const won = events.find((e) => e.type === 'battle' && e.phase === 'win');
  if (won) {
    if (r.kind === 'fight' && won.mon === r.mon) dg.cleared[dg.room] = true;
    if (r.kind === 'boss' && won.mon === r.mon && !mem.keeper) passKeeper(state, events, 'beat', `${iGa(monsterDef(r.mon).name)} 무릎을 꿇었다. 쇠와 돌이 흩어진다. 끝까지 문 쪽으로 손을 뻗고 있었다.`);
  }
  // 달아났으면 지나온 방으로 물러난다
  if (events.some((e) => e.type === 'battle' && e.phase === 'fled') && !resolved(state)) goBack(state, events);
  if (r.kind === 'bell' && mem.keeper && !mem.bell) { mem.bell = true; return mem.keeper; }
  return null;
}
