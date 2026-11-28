// 요리 (N3). 재료를 셋까지 넣어 조합을 찾는다. 맞으면 레시피가 도감에 적힌다.
// 틀리면 "먹을 수는 있는 것"이 된다. 재료는 돌아오지 않는다. 음식 버프는 한 번에 하나만 붙는다.

export const COOK_MAX = 3;
export const COOK_DIFFICULTY = 1;

/** 넣을 수 있는 것. */
export const INGREDIENTS = ['crucian', 'eel', 'boarmeat', 'bearmeat', 'salt', 'herb', 'berry', 'riceball'];

/**
 * needs: 재료 id들(순서 없음, 같은 것을 두 번 넣을 수도 있다).
 * buff: { name, text, turns(때 수), attack/defense(더하기), hp(최대 생명력) }
 * hint: 못 찾았을 때 도감에 보이는 귀띔 (N3-4)
 */
export const DISHES = {
  saltfish: { lv: 1, name: '소금 붕어 구이', needs: ['crucian', 'salt'], full: 45, buff: { name: '든든한 속', text: '최대 생명력 +15', hp: 15, phases: 3 }, hint: '할머니가 그러는데, 민물고기는 소금만 쳐서 굽는 게 제일이래요.' },
  boarstew: { lv: 1, name: '멧돼지 약초 찜', needs: ['boarmeat', 'herb', 'salt'], full: 70, buff: { name: '뜨거운 피', text: '공격력 +4', attack: 4, phases: 3 }, hint: '주점 주인이 누린내는 약초로 잡는다고 했다.' },
  berryrice: { lv: 1, name: '산열매 주먹밥', needs: ['riceball', 'berry'], full: 50, buff: { name: '가벼운 발', text: '방어력 +2', defense: 2, phases: 3 }, hint: '숲에서 누가 주먹밥에 열매를 박아 먹더라.' },
  herbfish: { lv: 1, name: '약초 붕어 탕', needs: ['crucian', 'herb'], full: 40, buff: { name: '맑은 정신', text: '숙련도 오름 +5%', xp: 0.05, phases: 3 }, hint: '신전지기는 아픈 사람에게 생선 넣은 약초 물을 먹인다.' },
  // 요리 레벨로 귀띔이 열리는 새 요리 (Z83)
  eelsoup: { lv: 2, name: '장어 소금 국', needs: ['eel', 'salt', 'herb'], full: 60, buff: { name: '깊은 숨', text: '최대 생명력 +25', hp: 25, phases: 3 }, hint: '주방장: 나루 장어는 소금이랑 약초만 넣고 끓여. 그게 다야.' },
  boarskewer: { lv: 3, promo: true, name: '멧돼지 산열매 꼬치', needs: ['boarmeat', 'berry', 'salt'], full: 55, buff: { name: '사나운 입맛', text: '공격력 +3, 방어력 +1', attack: 3, defense: 1, phases: 3 }, hint: '주방장: 멧돼지 고기에 산열매를 끼우고 소금을 쳐서 구워 봐. 누린내가 단내가 돼.' },
  // 2단계 (LV-F2): 고갯길의 곰. 요리 2단계의 승급작이다
  bearstew: { lv: 6, promo: true, name: '곰 고기 전골', needs: ['bearmeat', 'herb', 'salt'], full: 75, buff: { name: '곰의 속', text: '최대 생명력 +40, 공격력 +5', hp: 40, attack: 5, phases: 3 }, hint: '주방장: 곰 고기는 약초를 넉넉히 넣고 오래 끓여. 기름을 걷지 마.' },
};
export const DISH_ORDER = ['saltfish', 'berryrice', 'boarstew', 'herbfish', 'eelsoup', 'boarskewer', 'bearstew'];
/** 요리 레벨 (Z83): 레벨이 모자란 요리는 맞는 조합이어도 아직 손이 따라가지 못한다. */
export const COOK_LV = { name: '요리' };

/** 틀린 조합. */
export const MUSH = { name: '먹을 수는 있는 것', full: 15 };

export const COOK_LINES = ['모닥불에 올렸다. 연기가 오른다.', '모닥불에 올렸다. 지글거린다.', '모닥불에 올렸다. 냄새가 번진다.'];

// 3~10단계의 요리 (LV-H1): 비율로 붙는다. 그 지역을 낼 때까지는 재료를 구할 수 없다
import { tierDishes, TIERS } from './tiers.js?v=c3aa7be';
Object.assign(DISHES, tierDishes());
DISH_ORDER.push(...TIERS.map((t) => t.dish[0]));
INGREDIENTS.push(...TIERS.map((t) => t.meat[0]));
