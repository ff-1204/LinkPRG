// 100 뒤에 할 일 (CM-E, LV-M4): 13장을 끝낸 뒤의 "끝난 뒤" 화면에 남은 것을 보인다.
// 끝이 보이는 것만이다. 끝없이 세지는 탑, 무한 구간, 날마다 해야 하는 일은 없다 (CM-E3).

import { LEVEL_MAX } from '../data/bands.js?v=81955bc';
import { MONSTERS } from '../data/monsters.js?v=81955bc';
import { ITEMS } from '../data/items.js?v=81955bc';
import { RECIPES } from '../data/recipes.js?v=81955bc';
import { REGION_HIDDENS } from '../data/anvil.js?v=81955bc';
import { endsSeen } from './anvil.js?v=81955bc';
import { ranking } from './world.js?v=81955bc';
import { xpToNext } from './level.js?v=81955bc';

/** 숨은 이야기 여덟: 일곱 지역의 것과 처음 모루의 것 (LV-E3 ~ LV-E10). 이름과 조건은 내보내지 않는다. */
export const STORY_HIDDENS = [...REGION_HIDDENS, 'eighth'];
/** 이름난 놈이 나올 수 있는 사냥감들(우두머리와 국면이 있는 것은 빼고). */
export const NAMED_MONS = Object.keys(MONSTERS).filter((id) => !MONSTERS[id].boss && !MONSTERS[id].phases);
/** 걸작으로 칠 등급: 가장 높은 등급(전설). */
export const MASTER_GRADE_GEAR = 4;
/** 대장의 승급작 아홉 (LV-F1 ~ LV-F9): 철검부터 별쇠 검까지. */
export const PROMO_WORKS = Object.values(RECIPES).filter((r) => r.promo && r.branch === 'smith').map((r) => r.makes);

/** 걸작으로 지은 승급작을 적어 둔다(제작이 끝났을 때 game.js가 부른다). */
export function notePromo(state, recipeId, grade) {
  if (!PROMO_WORKS.includes(recipeId) || (grade || 0) < MASTER_GRADE_GEAR) return;
  const list = state.promoBest || (state.promoBest = []);
  if (!list.includes(recipeId)) list.push(recipeId);
}
/** 레벨 100 뒤에 쌓인 경험치: 다시 태어날 때 남는 몫에 든다 (CM-E2). */
export const xpOver = (state) => (state.level >= LEVEL_MAX ? Math.max(0, state.xp || 0) : 0);

/**
 * "끝난 뒤" 화면이 그릴 것 (CM-E, CM-G5). 13장을 끝내기 전에는 null: 줄이 생기지 않는다.
 * 숨은 이야기는 푼 수만 보인다 (CM-E1).
 */
export function afterView(state) {
  if (!state.anvil?.end) return null;
  const stories = STORY_HIDDENS.filter((id) => state.hq?.[id]?.status === 'done').length;
  const named = NAMED_MONS.filter((id) => state.dex?.mon?.[id]?.elite).length;
  const monAll = Object.keys(MONSTERS).length, monSeen = Object.keys(MONSTERS).filter((id) => state.dex?.mon?.[id]).length;
  const itemAll = Object.keys(ITEMS).length, itemSeen = Object.keys(ITEMS).filter((id) => state.dex?.items?.[id]).length;
  const promo = (state.promoBest || []).filter((id) => PROMO_WORKS.includes(id)).length;
  const ends = endsSeen(state);
  const rank = ranking(state, 'level');
  const above = rank.myRank - 1;
  return {
    head: state.level >= LEVEL_MAX ? `레벨 ${LEVEL_MAX}. 이 뒤의 경험치 ${xpOver(state).toLocaleString('en-US')}은 다시 태어날 때 남는 몫에 든다.` : `레벨 ${state.level}. 레벨은 ${LEVEL_MAX}이 끝이다.`,
    rows: [
      { id: 'stories', name: '지역의 숨은 이야기', value: `${stories} / ${STORY_HIDDENS.length}` },
      { id: 'named', name: '이름난 개체', value: `${named} / ${NAMED_MONS.length}` },
      { id: 'dex', name: '도감', value: `괴물 ${monSeen} / ${monAll} · 물건 ${itemSeen} / ${itemAll}` },
      { id: 'promo', name: '걸작으로 지은 승급작', value: `${promo} / ${PROMO_WORKS.length}` },
      { id: 'ends', name: '본 끝', value: `${ends.have} / ${ends.all}` },
      { id: 'rank', name: '랭킹', value: `${rank.myRank}위${above > 0 ? ` (위에 가상 유저 ${above})` : ''}` },
    ],
  };
}
void xpToNext;
