// 탐색과 랜덤 인카운터, 기척 (E1~E4, R2-3).
// 탐색 한 번마다 전투·발견·사건·만남·희귀 가운데 하나. 싸울지는 되도록 내가 고른다.

import { next, pick, chance, roll01 } from './rng.js?v=6b46da7';
import { addFame } from './social.js?v=6b46da7';
import { pushLine } from './log.js?v=6b46da7';
import { weighted, startBattle } from './battle.js?v=6b46da7';
import { addItem, countOf, takeById } from './inventory.js?v=6b46da7';
import { emptySkill, useSkill, gradeLabel, SKILL_NAMES } from './skills.js?v=6b46da7';
import { ding } from './log.js?v=6b46da7';
import { monsterDef } from '../data/monsters.js?v=6b46da7';
import { itemDef } from '../data/items.js?v=6b46da7';
import { USERS } from '../data/lines.js?v=6b46da7';
import { WILDS, INCIDENTS, DANGER, DANGER_UP, OTHER_WEIGHTS, TENSION_STEP, TENSION_MAX } from '../data/wild.js?v=6b46da7';
import { placeById } from '../data/places.js?v=6b46da7';
import { iGa, eulReul, eunNeun } from './ko.js?v=6b46da7';
import { branchOf } from './evolve.js?v=6b46da7';
import { answerHidden } from './quests.js?v=6b46da7';
import { jobXp, hiddenJobView, answerHiddenJob } from './jobs.js?v=6b46da7';
import { HIDDENS } from '../data/quests.js?v=6b46da7';
import { dungeonChoiceView, dungeonChoose } from './dungeon.js?v=6b46da7';
import { endingChoiceView, applyEnding } from './ending.js?v=6b46da7';
import { memoryChoiceView, chooseMemory } from './memories.js?v=6b46da7';

const WORK = { smith: { name: '대장장이', who: '대장간 주인', skill: 'smithing' } };

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/** 지금 이 곳의 위험도. 밤에는 한 단계 오른다 (R1-10). */
export function dangerNow(state, placeId = state.place) {
  const base = placeById(placeId).danger;
  return state.phase === 2 ? DANGER_UP[base] : base;
}

/** 다음 탐색에서 전투가 날 확률. 오래 조용했으면 오르고, 싸운 직후 두 번은 절반이다. */
export function battleChance(state) {
  const base = DANGER[dangerNow(state)].battle;
  if (base === 0) return 0;
  const tension = Math.min(TENSION_MAX, state.tension[state.place] || 0);
  let p = base + tension * TENSION_STEP - (state.hidden.kind?.value || 0) * 0.01;
  if (state.calm > 0) p /= 2;
  return clamp(p, 0, 0.95);
}

/** 기척 눈금 0~5칸 (E4). 조용할수록 싸움이 가깝다. */
export function senseBars(state) {
  if (DANGER[dangerNow(state)].battle === 0) return 0;
  return Math.min(5, 1 + Math.min(TENSION_MAX, state.tension[state.place] || 0));
}

/** 기척을 먼저 알아챌 확률: 민첩 겨루기. */
export function senseChance(state, monId) {
  const m = monsterDef(monId);
  const keen = state.flags.keenSense ? 0.15 : 0;
  const stealth = (state.hidden.stealth?.value || 0) * 0.02;
  return clamp(0.5 + (state.stats.agi - m.agi) * 0.05 + keen + stealth, 0.05, 0.95);
}

function rollOutcome(state) {
  if (chance(state, battleChance(state))) return 'battle';
  const w = { ...OTHER_WEIGHTS };
  if (state.phase === 2) w.rare *= 2; // 밤에는 귀한 것이 더 나온다
  w.rare += (state.hidden.luck?.value || 0) * 0.2;
  return weighted(state, Object.entries(w).map(([id, weight]) => ({ id, w: weight }))).id;
}

const userName = (state) => pick(state, USERS.filter((u) => u !== state.name));

/** 탐색 한 번. */
export function explore(state, events) {
  const wild = WILDS[state.place];
  if (!wild) throw new Error('여기서는 탐색할 것이 없습니다');
  const place = placeById(state.place);
  pushLine(state, events, { k: 'me', text: `${eulReul(place.name)} 탐색했다.` });
  const outcome = rollOutcome(state);
  if (state.calm > 0) state.calm -= 1; // 굴린 뒤에 깎아야 두 번이 절반이다
  if (outcome !== 'battle') state.tension[state.place] = Math.min(TENSION_MAX, (state.tension[state.place] || 0) + 1);
  events.push({ type: 'explore', outcome });

  if (outcome === 'battle') return meetMonster(state, events, wild);
  if (outcome === 'find') return find(state, events, pick(state, wild.finds));
  if (outcome === 'rare') { state.counters.rare += 1; return find(state, events, wild.rare, '희귀'); }
  if (outcome === 'meet') {
    pushLine(state, events, { k: 'user', who: `만남, 지나가던 유저 '${userName(state)}'`, text: pick(state, wild.meets) });
    return;
  }
  const pool = INCIDENTS[state.place] || [];
  const inc = pick(state, pool);
  pushLine(state, events, { k: 'room', who: '사건', text: inc.text });
  state.choice = { kind: 'incident', id: inc.id, place: state.place };
  events.push({ type: 'choice' });
}

function find(state, events, f, label = '발견') {
  // 짐승을 보았다: 물건은 없지만 본 것으로 적힌다(깎을 수 있게 된다)
  if (f.animal) { state.dex.animals[f.animal] = true; pushLine(state, events, { k: 'room', who: label, text: f.say }); return; }
  addItem(state, f.id, f.n || 1);
  pushLine(state, events, { k: 'sys', who: label, text: f.say });
}

function meetMonster(state, events, wild) {
  const monId = weighted(state, wild.monsters).id;
  const m = monsterDef(monId);
  state.tension[state.place] = 0;
  // 내가 다섯 레벨 넘게 높으면 달아난다 (R2-3)
  if (state.level >= m.level + 5) {
    pushLine(state, events, { k: 'room', text: `${iGa(m.name)} 이쪽을 보더니 달아났다.` });
    return find(state, events, pick(state, wild.finds));
  }
  seen(state, monId);
  if (chance(state, senseChance(state, monId))) {
    state.choice = { kind: 'sense', mon: monId, watched: false };
    // 기척이 짐승이 아니라 같은 들판을 다니는 모험가일 수도 있다 (Z37)
    const fights = state.counters.fights || 0;
    if (roll01(`${state.seed}|person|${state.day}|${state.phase}|${state.tick}|${fights}`) < personChance(state)) {
      state.choice.person = USERS[Math.floor(roll01(`${state.seed}|personname|${state.day}|${state.tick}`) * USERS.length)];
    }
    pushLine(state, events, { k: 'room', who: '기척', text: '가까이에서 무언가의 숨소리가 들린다. 아직 이쪽을 모른다.' });
    events.push({ type: 'choice' });
    return;
  }
  startBattle(state, events, monId, { ambush: true });
}

// ── 먼저 덮치기 (Z36)와 모험가 (Z37) ──
export const CAUGHT_BASE = 0.25;
/** 먼저 덮치다 들킬 확률. 적이 셀수록 높고, 민첩·은신·지켜보기·덫놓이로 낮아진다. 5%~70%. */
export function caughtChance(state, monId, watched) {
  const diff = monsterDef(monId).level - state.level;
  const p = CAUGHT_BASE + (diff > 0 ? diff * 0.05 : diff * 0.03) - (state.stats.agi - 10) * 0.01
    - (state.hidden.stealth?.value || 0) * 0.03 - (watched ? 0.10 : 0) - (state.flags.pounceBonus ? 0.10 : 0);
  return Math.min(0.70, Math.max(0.05, p));
}
/** 들킬 확률의 느낌. 숫자는 보이지 않는다. */
export function caughtFeel(p) {
  return p < 0.15 ? { id: 0, text: '자신 있다' } : p <= 0.35 ? { id: 1, text: '들킬지도 모른다' } : { id: 2, text: '들킬 것 같다' };
}
/** 기척이 모험가일 확률: 그곳 유저 수 × 1%, 많아야 15%. */
export function personChance(state) {
  const users = placeById(state.place).users?.[state.phase] || 0;
  return Math.min(0.15, users * 0.01);
}
export const HURT_FEE = 10; // 치료비: 내 레벨 × 이만큼
export const RUN_FAME = 20; // 달아나면 깎이는 명성
const PERSON_DOING = ['약초를 캐고 있다', '덫을 살피고 있다', '그루터기에 앉아 쉬고 있다', '지도를 펼쳐 들고 서 있다'];

function seen(state, monId) {
  const d = state.dex.mon[monId] || (state.dex.mon[monId] = { seen: 0, won: 0, lost: 0 });
  d.seen = (d.seen || 0) + 1;
}

/** 지금 정해야 하는 것의 글과 선택지. 화면의 창이 이것을 그린다 (E3). */
export function choiceView(state) {
  const c = state.choice;
  if (!c) return null;
  if (c.kind === 'sense') {
    const m = monsterDef(c.mon);
    if (c.watched && c.person) {
      return {
        kind: 'sense', title: '기척을 느꼈다', side: '사람이었다',
        text: `사람이다. 모험가 '${c.person}'가 ${PERSON_DOING[c.person.length % PERSON_DOING.length]}.`,
        note: '지켜본 덕에 잘못 덮치지 않았다.',
        options: [{ id: 'greet', label: '말을 건다', go: true }, { id: 'leave', label: '지나간다' }],
      };
    }
    const feel = caughtFeel(caughtChance(state, c.mon, c.watched));
    return {
      kind: 'sense', title: '기척을 느꼈다', side: `먼저 알아챔 (민첩 ${state.stats.agi})`,
      text: c.watched ? `${m.name}다. 레벨 ${m.level}쯤. 아직 이쪽을 모른다.` : '가까이에서 무거운 숨소리가 들린다. 아직 이쪽을 모른다.',
      feel: { label: '덮치면', ...feel },
      note: '알아채지 못했다면 습격당해 적이 먼저 움직입니다.',
      options: [
        { id: 'pounce', label: '먼저 덮친다', sub: '들키면 적이 먼저 움직인다', go: true },
        ...(c.watched ? [] : [{ id: 'watch', label: '숨어서 지켜본다', sub: '무엇인지 보고, 덮치기가 쉬워진다' }]),
        { id: 'leave', label: '돌아간다' },
      ],
    };
  }
  if (c.kind === 'hurt') {
    const fee = state.level * HURT_FEE;
    return {
      kind: 'hurt', title: '사람이었다', side: '잘못 덮쳤다',
      text: `덤불에서 뛰쳐나가 내리쳤는데, 비명이 사람 소리다. 모험가 '${c.person}'가 어깨를 감싸 쥐고 주저앉았다.`,
      note: `은화가 모자라면 가진 만큼 내고, 명성이 5 깎인다.`,
      options: [
        { id: 'pay', label: '사과하고 치료비를 낸다', sub: `은화 ${fee} (내 레벨 × ${HURT_FEE})`, go: true },
        { id: 'run', label: '모른 척 달아난다', sub: `이 근처 마을 명성 −${RUN_FAME}, 소문이 돈다` },
      ],
    };
  }
  if (c.kind === 'ending') return endingChoiceView(state);
  if (c.kind === 'trap' || c.kind === 'door' || c.kind === 'keeper') return dungeonChoiceView(state);
  if (c.kind === 'hjob') {
    const j = hiddenJobView(state, c.id);
    return {
      kind: 'hjob', title: '히든 직업', side: j.name, text: j.text,
      note: `찾은 까닭: ${j.why}. 얻는 것: ${j.gain}. 잃는 것: ${j.lose}.${j.had ? ` 지금의 직업 ${eunNeun(j.had)} 내려놓는다.` : ''} 거절해도 벌은 없지만 다시 오지 않습니다.`,
      options: [{ id: 'accept', label: '받는다', go: true }, { id: 'decline', label: '거절한다' }],
    };
  }
  if (c.kind === 'hq') {
    const q = HIDDENS[c.id];
    return {
      kind: 'hq', title: '히든 퀘스트', side: q.name, text: q.offer,
      note: `찾은 까닭: ${q.why}. 거절해도 벌은 없지만 다시 나타나지 않습니다.`,
      options: [{ id: 'accept', label: '받는다', go: true }, { id: 'decline', label: '거절한다' }],
    };
  }
  if (c.kind === 'memory') return memoryChoiceView(state);
  if (c.kind === 'offer') {
    const w = WORK[c.job];
    return {
      kind: 'offer', title: `${w.who}의 권유`, side: '일하는 직업',
      text: `"${w.name}"로 일하겠느냐고 묻는다. 일하는 직업은 하나만 가진다. 싸우는 직업과는 따로다.`,
      note: `얻는 것: ${SKILL_NAMES[w.skill]} 숙련도가 1.5배로 오른다. 이곳에서 사는 값이 조금 싸진다.`,
      options: [{ id: 'accept', label: '일하겠다', go: true }, { id: 'later', label: '아직은 아니다' }],
    };
  }
  const inc = (INCIDENTS[c.place] || []).find((x) => x.id === c.id);
  return {
    kind: 'incident', title: '어떻게 할까', side: '', text: inc.text, note: '',
    options: inc.options.map((o) => ({ id: o.id, label: o.label, disabled: !!(o.need?.item && countOf(state, o.need.item) < 1), why: o.need?.item ? `${itemDef(o.need.item).name}이 있어야 한다` : '' })),
  };
}

/** 선택지 하나를 고른다. */
export function choose(state, events, id) {
  const c = state.choice;
  if (!c) throw new Error('정할 것이 없습니다');
  if (c.kind === 'memory') return chooseMemory(state, events, id);
  if (c.kind === 'hurt') {
    state.choice = null;
    if (id === 'pay') {
      const fee = state.level * HURT_FEE;
      const paid = Math.min(fee, state.silver);
      state.silver -= paid;
      pushLine(state, events, { k: 'me', text: `은화 ${paid}을 건넸다. 몇 번이고 고개를 숙였다.` });
      if (paid < fee) { addFame(state, events, -5); pushLine(state, events, { k: 'sys', text: '가진 것이 모자랐다. 이 근처 마을 명성 −5.', tone: 'warn' }); }
      pushLine(state, events, { k: 'user', who: `모험가 '${c.person}'`, text: '다음엔 보고 덮쳐요. 그래도 손은 매섭네요.' });
      return;
    }
    if (id === 'run') {
      addFame(state, events, -RUN_FAME);
      state.flags.hitRun = { place: state.place, day: state.day };
      pushLine(state, events, { k: 'me', text: '뒤도 돌아보지 않고 달아났다.' });
      pushLine(state, events, { k: 'sys', text: `이 근처 마을 명성 −${RUN_FAME}. 누군가는 이 일을 떠들고 다닐 것이다.`, tone: 'warn' });
      return;
    }
    state.choice = c;
    throw new Error('고를 수 없는 것입니다');
  }
  if (c.kind === 'sense') {
    if (id === 'pounce' && c.person) {
      // 사람을 덮쳤다 (Z37): 다치게만 한다. 죽이는 길은 없다
      state.choice = { kind: 'hurt', person: c.person, mon: c.mon };
      events.push({ type: 'choice' });
      return;
    }
    if (id === 'pounce') {
      state.choice = null;
      const caught = roll01(`${state.seed}|caught|${c.mon}|${state.counters.fights || 0}|${state.day}|${state.tick}`) < caughtChance(state, c.mon, c.watched);
      return startBattle(state, events, c.mon, caught ? { caught: true } : { pounce: true });
    }
    if (c.person && c.watched && (id === 'greet' || id === 'leave')) {
      state.choice = null;
      if (id === 'greet') {
        pushLine(state, events, { k: 'me', text: '덤불에서 나와 손을 들어 보였다.' });
        pushLine(state, events, { k: 'user', who: `모험가 '${c.person}'`, text: '아이고 놀라라. 짐승인 줄 알았잖아요. 이 근처엔 멧돼지가 많으니 조심해요.' });
      } else pushLine(state, events, { k: 'me', text: '방해하지 않고 조용히 지나갔다.' });
      return;
    }
    if (id === 'watch' && !c.watched) {
      c.watched = true;
      state.counters.watch += 1;
      const m = monsterDef(c.mon);
      pushLine(state, events, { k: 'me', text: '숨을 죽이고 지켜보았다.' });
      pushLine(state, events, { k: 'room', text: c.person ? `짐승이 아니다. 모험가 '${c.person}'다.` : `${m.name}다. ${m.moves[0].tell}` });
      events.push({ type: 'choice' });
      return;
    }
    if (id === 'leave') {
      state.choice = null;
      pushLine(state, events, { k: 'me', text: '발소리를 죽이고 물러났다.' });
      return;
    }
    throw new Error('고를 수 없는 것입니다');
  }
  if (c.kind === 'ending') {
    if (id === 'back') { state.choice = null; pushLine(state, events, { k: 'me', text: '아직은 아니다. 종은 기다려 준다.' }); return; }
    return applyEnding(state, events, id);
  }
  if (c.kind === 'trap' || c.kind === 'door' || c.kind === 'keeper') return dungeonChoose(state, events, id);
  if (c.kind === 'hjob') {
    if (id !== 'accept' && id !== 'decline') throw new Error('고를 수 없는 것입니다');
    return answerHiddenJob(state, events, c.id, id === 'accept');
  }
  if (c.kind === 'hq') {
    if (id !== 'accept' && id !== 'decline') throw new Error('고를 수 없는 것입니다');
    return answerHidden(state, events, c.id, id === 'accept');
  }
  if (c.kind === 'offer') {
    const w = WORK[c.job];
    if (id === 'accept') {
      state.choice = null;
      state.work = c.job;
      ding(state, events, { level: 2, title: `일하는 직업 '${w.name}'를 얻었습니다`, big: w.name, body: `${SKILL_NAMES[w.skill]} 숙련도가 1.5배로 오릅니다.` });
      state.journal.push({ day: state.day, phase: state.phase, place: state.place, text: `${w.who}이 일을 권했다. 하겠다고 했다. 이제 나는 ${w.name}다.`, note: `${w.name}가 된 날` });
      return;
    }
    if (id === 'later') {
      state.choice = null;
      state.workAsk = state.made + 3;
      pushLine(state, events, { k: 'me', text: '아직은 아니라고 했다. 주인은 어깨를 으쓱한다.' });
      return;
    }
    throw new Error('고를 수 없는 것입니다');
  }
  const inc = (INCIDENTS[c.place] || []).find((x) => x.id === c.id);
  const opt = inc?.options.find((o) => o.id === id);
  if (!opt) throw new Error('고를 수 없는 것입니다');
  if (opt.need?.item && countOf(state, opt.need.item) < 1) throw new Error(`${itemDef(opt.need.item).name}이 없습니다`);
  const e = opt.effect;
  if (e.take) takeById(state, e.take, 1);
  if (e.counter) state.counters[e.counter] += e.counterN || 1;
  if (e.item) addItem(state, e.item.id, e.item.n || 1);
  if (e.silver) state.silver += e.silver;
  if (e.hp) state.hp = Math.max(1, state.hp + e.hp);
  if (e.flag) state.flags[e.flag] = true;
  state.choice = null;
  pushLine(state, events, { k: 'me', text: e.say });
}

/** 모으기 한 번 (채집·채광·낚시). 한 번 누르면 한 번. */
export function gather(state, events) {
  const g = WILDS[state.place]?.gather;
  if (!g) throw new Error('여기서는 모을 것이 없습니다');
  const count = (state.counters.act[g.action] = (state.counters.act[g.action] || 0) + 1);
  const repeated = state.lastAction === g.action;
  state.lastAction = g.action;
  let i = Math.floor(next(state) * g.say.length);
  if (g.say.length > 1 && i === state.lastLine[g.action]) i = (i + 1) % g.say.length;
  state.lastLine[g.action] = i;
  const skill = state.skills[g.skill] || (state.skills[g.skill] = emptySkill());
  const br = branchOf(state, g.skill);
  const rod = g.action === 'fish' ? (countOf(state, 'mistrod') ? 0.2 : countOf(state, 'grannyrod') ? 0.1 : 0) : 0;
  const missChance = clamp(g.miss - skill.grade * 0.01 + (br?.miss || 0) - rod, 0.05, 0.9);
  events.push({ type: 'gather', action: g.action, phase: state.phase });
  if (chance(state, missChance)) {
    pushLine(state, events, { k: 'me', text: `${g.say[i]} ${g.missSay}` });
  } else {
    const drop = weighted(state, g.drops.map((d) => ({ ...d, w: d.w * (br?.weight?.[d.id] ?? 1) })));
    const n = br?.double && chance(state, br.double) ? 2 : 1;
    addItem(state, drop.id, n);
    pushLine(state, events, { k: 'me', text: `${g.say[i]} ${itemDef(drop.id).name} ${n}.` });
  }
  const endure = state.hidden.endure?.value || 0;
  const up = useSkill(skill, g.difficulty, (repeated ? 1 + endure * 0.01 : 1) * (br?.xp || 1) * jobXp(state, g.skill, repeated));
  if (up.leveled) ding(state, events, { level: up.rankUp ? 2 : 1, title: `${SKILL_NAMES[g.skill]} 숙련도가 ${iGa(gradeLabel(up.grade))} 되었습니다` });
  return count;
}
