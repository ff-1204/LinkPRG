// 제작 (N1). 손으로 한다. 한 번 누르면 망치질 한 번.
// 쇠는 식는다. 얼마나 늦었는지는 화면이 재서 알려 주고(late), 규칙은 그 값만 본다.
// 그래서 같은 씨앗과 같은 입력이면 늘 같은 결과가 나온다.

import { next } from './rng.js?v=8782554';
import { rollOptions } from './gear.js?v=8782554';
import { pushLine, ding } from './log.js?v=8782554';
import { countOf, takeById, addItem } from './inventory.js?v=8782554';
import { emptySkill, useSkill, gradeLabel, SKILL_NAMES } from './skills.js?v=8782554';
import { itemDef, GRADES } from '../data/items.js?v=8782554';
import { RECIPES, RECIPE_ORDER, GRADE_BASE, PUSH, HAMMER_LINES, HAMMER_MARKS, recipeById, STITCH_LINES, JEWEL_LINES, BRANCHES, BRANCH_ORDER, CRAFT_LV, ORDER_OF } from '../data/recipes.js?v=8782554';
import { branchOf } from './evolve.js?v=8782554';
import { placeById } from '../data/places.js?v=8782554';
import { iGa, eulReul } from './ko.js?v=8782554';
import { jobXp } from './jobs.js?v=8782554';
import { jobDef } from '../data/jobs.js?v=8782554';
import { hasTitle } from './titles.js?v=8782554';

export const WORK_XP = 1.5; // 일하는 직업이 맞으면 그 숙련도가 빨리 오른다 (T7)
export const TANNER_XP = 1.2; // 무두장이 출신은 가죽 숙련도가 조금 빨리 오른다 (Z71)

const tanner = (state) => state.origin === 'tanner' || !!state.flags?.hideSeller;

// ── 제작 레벨 (Z79) ──
export const branchOfRecipe = (r) => r.branch || (r.jewel ? 'jewel' : r.sew ? 'sew' : 'smith');
export function emptyCraftLv() {
  return Object.fromEntries(BRANCH_ORDER.map((b) => [b, { lv: 1, xp: 0 }]));
}
/** 쌓인 제작 경험으로 레벨을 셈한다(지난 저장을 처음 레벨로 옮길 때). */
export function lvFromXp(xp) {
  let lv = 1;
  while (xp >= lv * CRAFT_LV.per) { xp -= lv * CRAFT_LV.per; lv += 1; }
  return { lv, xp };
}
export function craftLvOf(state, branch) {
  if (!state.craftLv) state.craftLv = emptyCraftLv();
  return state.craftLv[branch] || (state.craftLv[branch] = { lv: 1, xp: 0 });
}
/** 갈래 하나의 레벨과 다음 레벨까지. */
export function craftLvView(state, branch) {
  const c = craftLvOf(state, branch);
  return { id: branch, name: BRANCHES[branch].name, lv: c.lv, xp: c.xp, need: c.lv * CRAFT_LV.per };
}
/** 하나 다 만들었다: 설계도 레벨 × (1 + 등급). 그 갈래의 일하는 직업이면 1.5배. 끝이 없다. */
function gainCraftXp(state, events, r, grade) {
  const branch = branchOfRecipe(r);
  const c = craftLvOf(state, branch);
  const work = BRANCHES[branch].work;
  c.xp += Math.round((r.lv || 1) * (1 + grade) * (work && state.work === work ? CRAFT_LV.workXp : 1));
  while (c.xp >= c.lv * CRAFT_LV.per) {
    c.xp -= c.lv * CRAFT_LV.per;
    c.lv += 1;
    const opened = ORDER_OF[branch].map((id) => RECIPES[id]).filter((x) => x.lv === c.lv).map((x) => x.name);
    ding(state, events, { level: 2, title: `${BRANCHES[branch].name} 레벨 ${c.lv}이 되었습니다`, body: opened.length ? `새 설계도: ${opened.join(', ')}` : '' });
  }
}

/** 재료의 품질: 가방에서 쓰일 재료들의 평균 등급. */
function qualityOf(state, recipe) {
  let sum = 0;
  let n = 0;
  for (const need of recipe.needs) {
    const stacks = state.bag.filter((x) => x.id === need.id).sort((a, b) => b.grade - a.grade);
    let left = need.n;
    for (const st of stacks) {
      const take = Math.min(left, st.n);
      sum += st.grade * take; n += take; left -= take;
      if (!left) break;
    }
  }
  return n ? sum / n : 0;
}

/** 등급을 높은 쪽으로 미는 힘과 그 셈 (N1-3). */
export function pushOf(state, recipe, warmHits, quality) {
  const skill = state.skills[recipe.skill]?.grade || 0;
  const craft = state.hidden.craft?.value || 0;
  const branch = branchOf(state, recipe.skill);
  const parts = [
    { label: `${SKILL_NAMES[recipe.skill]} 숙련도`, value: skill * PUSH.perSkillGrade },
    { label: '손재주', value: craft * PUSH.perCraft, hidden: true },
    { label: '재료 품질', value: quality * PUSH.perQuality },
  ];
  // 가죽은 식지 않는다: 땀 수만 센다 (Z71)
  if (!recipe.sew) parts.push({ label: `식기 전에 친 횟수 ${warmHits} / ${recipe.hits}`, value: (warmHits / recipe.hits) * PUSH.warm });
  if (branch?.push) parts.push({ label: branch.name, value: branch.push });
  const job = jobDef(state.job);
  if (job?.push) parts.push({ label: job.name, value: job.push });
  return { total: parts.reduce((a, p) => a + p.value, 0), parts };
}

/** 등급별 확률(%). 밀기가 클수록 높은 등급 쪽이 커진다. 합은 100. */
export function gradeOdds(push) {
  const w = GRADE_BASE.map((b, i) => b * Math.pow(1 + Math.max(0, push), i));
  const total = w.reduce((a, x) => a + x, 0);
  return w.map((x) => (x / total) * 100);
}

/** 설계도 목록과, 지금 만들 수 있는지 (제작 창이 그린다). */
export function recipeList(state, order = RECIPE_ORDER) {
  return order.map((id) => {
    const r = RECIPES[id];
    const needs = r.needs.map((n) => ({ id: n.id, name: itemDef(n.id).name, n: n.n, have: countOf(state, n.id) }));
    const quality = qualityOf(state, r);
    const branch = branchOfRecipe(r);
    const locked = (r.lv || 1) > craftLvOf(state, branch).lv; // 제작 레벨이 모자라면 잠겨 있다 (보이기는 한다)
    const job = itemDef(r.makes).job;
    return {
      id, name: r.name, say: r.say, hits: r.hits, needs, lv: r.lv || 1, branch, locked, job, can: !locked && needs.every((n) => n.have >= n.n),
      // 두드리기 전에 보이는 확률: 하나도 식히지 않았을 때와 모두 식혔을 때 (가죽은 둘이 같다)
      best: gradeOdds(pushOf(state, r, r.hits, quality).total),
      worst: gradeOdds(pushOf(state, r, 0, quality).total),
    };
  });
}

/** 지금 만들고 있는 것의 모습. */
export function craftView(state) {
  const c = state.craft;
  if (!c) return null;
  const r = recipeById(c.recipe);
  const left = r.hits - c.hits;
  const push = pushOf(state, r, c.warm + left, c.quality); // 다시 달구고 끝까지 치면
  return {
    recipe: r.id, name: r.name, hits: c.hits, total: r.hits, warm: c.warm, cold: c.cold, kind: r.jewel ? 'jewel' : r.sew ? 'sew' : 'smith',
    stage: c.hits >= 9 ? 3 : c.hits >= 4 ? 2 : 1,
    odds: gradeOdds(push.total),
    parts: push.parts.filter((p) => !p.hidden || p.value > 0).map((p) => ({ label: p.label, up: p.value > 0 })),
  };
}

export function startCraft(state, events, recipeId) {
  if (state.craft) throw new Error('이미 만들고 있는 것이 있습니다');
  const r = recipeById(recipeId);
  const br = BRANCHES[branchOfRecipe(r)];
  if (state.place && !placeById(state.place).actions.includes(br.act)) throw new Error(`${br.where}에서 만듭니다`);
  if ((r.lv || 1) > craftLvOf(state, br.id).lv) throw new Error(`${br.name} 레벨 ${r.lv}에 열리는 설계도입니다`);
  for (const n of r.needs) if (countOf(state, n.id) < n.n) throw new Error(`${iGa(itemDef(n.id).name)} 모자랍니다 (${countOf(state, n.id)} / ${n.n})`);
  const quality = qualityOf(state, r);
  for (const n of r.needs) takeById(state, n.id, n.n);
  state.craft = { recipe: r.id, hits: 0, warm: 0, cold: false, quality };
  state.lastAction = null;
  const used = r.needs.map((n) => `${itemDef(n.id).name} ${n.n}`).join(', ');
  if (r.jewel) {
    pushLine(state, events, { k: 'me', text: `${used}. 재료를 작업대에 올리고 줄과 끌을 집었다.` });
  } else if (r.sew) {
    pushLine(state, events, { k: 'me', text: `${used}. 본에 맞춰 자르고 바늘에 실을 꿰었다.` });
  } else {
    pushLine(state, events, { k: 'me', text: `${used}. 화덕에 넣고 풀무를 밟았다.` });
    pushLine(state, events, { k: 'room', text: '쇠가 붉게 달았다. 식기 전에 쳐야 한다.' });
  }
  events.push({ type: 'craft', phase: 'start' });
  events.push({ type: 'art' });
}

/**
 * 망치질 한 번.
 * @param {boolean} late 지난번 망치질에서 너무 오래 지났는지(화면이 잰다)
 */
export function hammer(state, events, late = false) {
  const c = state.craft;
  if (!c) throw new Error('만들고 있는 것이 없습니다');
  const r = recipeById(c.recipe);
  if (r.sew) return stitch(state, events, c, r);
  if (c.cold) throw new Error('쇠가 식었습니다. 다시 달궈야 합니다');
  if (late && c.hits > 0) {
    c.cold = true;
    pushLine(state, events, { k: 'room', text: '쇠가 식었다. 망치가 튕겨 나온다. 다시 달궈야 한다.' });
    events.push({ type: 'craft', phase: 'cold' });
    events.push({ type: 'art' });
    return;
  }
  c.hits += 1;
  c.warm += 1;
  const count = (state.counters.act.hammer = (state.counters.act.hammer || 0) + 1);
  const repeated = state.lastAction === 'hammer';
  state.lastAction = 'hammer';
  const line = HAMMER_LINES[Math.floor(next(state) * HAMMER_LINES.length)];
  pushLine(state, events, { k: 'me', text: `${line} (${c.hits} / ${r.hits})` });
  if (HAMMER_MARKS[c.hits]) { pushLine(state, events, { k: 'room', text: HAMMER_MARKS[c.hits] }); events.push({ type: 'art' }); }
  const skill = state.skills[r.skill] || (state.skills[r.skill] = emptySkill());
  const endure = state.hidden.endure?.value || 0;
  const mult = (repeated ? 1 + endure * 0.01 : 1) * (state.work === 'smith' ? WORK_XP : 1) * jobXp(state, r.skill, repeated);
  const up = useSkill(skill, r.difficulty, mult);
  if (up.leveled) {
    ding(state, events, { level: up.rankUp ? 2 : 1, title: `${SKILL_NAMES[r.skill]} 숙련도가 ${iGa(gradeLabel(up.grade))} 되었습니다` });
  }
  if (c.hits >= r.hits) finish(state, events);
  return count;
}

/** 한 땀 (Z71), 또는 세공의 다듬기 한 번 (Z80). 식지 않는다. 횟수만 센다. */
function stitch(state, events, c, r) {
  c.hits += 1;
  c.warm += 1;
  const repeated = state.lastAction === 'hammer';
  state.lastAction = 'hammer';
  const count = (state.counters.act.hammer = (state.counters.act.hammer || 0) + 1);
  const lines = r.jewel ? JEWEL_LINES : STITCH_LINES;
  pushLine(state, events, { k: 'me', text: `${lines[Math.floor(next(state) * lines.length)]} (${c.hits} / ${r.hits})` });
  const skill = state.skills[r.skill] || (state.skills[r.skill] = emptySkill());
  const endure = state.hidden.endure?.value || 0;
  const leather = r.skill === 'leather';
  const mult = (repeated ? 1 + endure * 0.01 : 1) * (leather && tanner(state) ? TANNER_XP : 1) * (leather && state.work === 'tailor' ? WORK_XP : 1) * jobXp(state, r.skill, repeated);
  const up = useSkill(skill, r.difficulty, mult);
  if (up.leveled) ding(state, events, { level: up.rankUp ? 2 : 1, title: `${SKILL_NAMES[r.skill]} 숙련도가 ${iGa(gradeLabel(up.grade))} 되었습니다` });
  if (c.hits >= r.hits) finish(state, events);
  events.push({ type: 'art' });
  return count;
}

function rollGrade(state, odds) {
  let roll = next(state) * 100;
  let grade = 0;
  for (let i = 0; i < odds.length; i++) { roll -= odds[i]; if (roll < 0) { grade = i; break; } grade = i; }
  return grade;
}

/** 식은 쇠를 다시 달군다. 달구는 동안은 친 것으로 쳐 주지 않는다. */
export function reheat(state, events) {
  const c = state.craft;
  if (!c) throw new Error('만들고 있는 것이 없습니다');
  if (!c.cold) throw new Error('쇠는 아직 뜨겁습니다');
  c.cold = false;
  c.warm = Math.max(0, c.warm - 1); // 식혔다 달구면 그만큼 날이 무뎌진다
  state.lastAction = null;
  pushLine(state, events, { k: 'me', text: '쇠를 화덕에 다시 넣고 풀무를 밟았다. 다시 붉어진다.' });
  events.push({ type: 'craft', phase: 'reheat' });
  events.push({ type: 'art' });
}

/** 그만둔다. 재료는 돌아오지 않는다 (N1-4). */
export function quitCraft(state, events) {
  const c = state.craft;
  if (!c) throw new Error('만들고 있는 것이 없습니다');
  state.craft = null;
  state.lastAction = null;
  const r = recipeById(c.recipe);
  pushLine(state, events, { k: 'me', text: r.jewel ? '줄을 내려놓았다. 반쯤 다듬은 것은 쓸 수 없게 되었다.' : r.sew ? '바늘을 내려놓았다. 반쯤 꿰맨 것은 쓸 수 없게 되었다.' : '망치를 내려놓았다. 반쯤 두드린 쇠는 쓸 수 없게 되었다.' });
  events.push({ type: 'craft', phase: 'quit' });
  events.push({ type: 'art' });
}

const DING_BY_GRADE = [1, 2, 3, 4, 4];

function finish(state, events) {
  const c = state.craft;
  const r = recipeById(c.recipe);
  const odds = gradeOdds(pushOf(state, r, c.warm, c.quality).total);
  const grade = rollGrade(state, odds);
  const branch = branchOf(state, r.skill);
  const item = addItem(state, r.makes, 1, { grade, maker: state.name });
  if (itemDef(r.makes).tool) item.dur = Math.round(item.dur * (1 + 0.5 * grade)); // 도구: 등급마다 내구도 +50%
  if (branch?.dur) item.dur = Math.round(item.dur * branch.dur);
  if (jobDef(state.job)?.dur) item.dur = Math.round(item.dur * jobDef(state.job).dur);
  if (hasTitle(state, 'legend')) item.dur = Math.round(item.dur * 1.1);
  item.max = item.dur;
  rollOptions(state, item, `craft|${state.made || 0}`);
  state.craft = null;
  state.lastAction = null;
  if (r.jewel) { /* 세공은 일하는 직업 권유 셈에 들지 않는다 */ } else if (r.sew) state.counters.sewn = (state.counters.sewn || 0) + 1; // 재봉사가 일을 권하는 셈 (Z74)
  else state.made = (state.made || 0) + 1;
  gainCraftXp(state, events, r, grade);
  // 손재주의 재료: 만들 때마다 1, 높은 등급이면 그만큼 더 (Q5)
  state.counters.crafts += 1 + grade;
  const name = itemDef(r.makes).name;
  pushLine(state, events, { k: 'room', text: r.jewel ? `마지막으로 광을 냈다. ${iGa(name)} 다 되었다.` : r.sew ? `마지막 땀을 매듭지었다. ${iGa(name)} 다 지어졌다.` : `물에 담그자 김이 오른다. ${eulReul(name)} 건져 올렸다.` });
  const legend = grade === 4;
  ding(state, events, {
    level: DING_BY_GRADE[grade], kind: legend ? 'legend' : 'craft',
    title: `${GRADES[grade]} 등급 ${iGa(name)} 만들어졌습니다`, big: legend ? '전설 등급' : `${GRADES[grade]} 등급 ${name}`,
    body: `만든 이: ${state.name}. ${r.jewel ? `다듬기 ${r.hits}번.` : r.sew ? `땀 ${r.hits}번.` : `식기 전에 친 횟수 ${c.warm} / ${r.hits}.`}`,
    reason: legend ? `이 확률은 ${odds[4].toFixed(1)}%였습니다` : '',
  });
  if (grade >= 3) state.journal.push({ day: state.day, phase: state.phase, place: state.place, text: r.sew ? `${GRADES[grade]} 등급 ${iGa(name)} 나왔다. 매듭을 지을 때 손이 떨렸다. 안쪽에 내 이름을 꿰맸다.` : `${GRADES[grade]} 등급 ${iGa(name)} 나왔다. 물에서 건질 때 손이 떨렸다. 자루 밑에 내 이름을 새겼다.`, note: `${GRADES[grade]} 등급을 띄운 날` });
  events.push({ type: 'craft', phase: 'done', grade, item: r.makes });
  events.push({ type: 'art' });
}
