// 요리 (N3). 재료를 셋까지 넣어 조합을 찾는다. 맞으면 레시피가 도감에 적힌다.
// 틀리면 "먹을 수는 있는 것"이 된다. 재료는 돌아오지 않는다. 음식 버프는 한 번에 하나만 붙는다.

export const COOK_MAX = 3;
export const COOK_DIFFICULTY = 1;

/** 넣을 수 있는 것. */
export const INGREDIENTS = ['crucian', 'boarmeat', 'salt', 'herb', 'berry', 'riceball'];

/**
 * needs: 재료 id들(순서 없음, 같은 것을 두 번 넣을 수도 있다).
 * buff: { name, text, turns(때 수), attack/defense(더하기), hp(최대 생명력) }
 * hint: 못 찾았을 때 도감에 보이는 귀띔 (N3-4)
 */
export const DISHES = {
  saltfish: { name: '소금 붕어 구이', needs: ['crucian', 'salt'], full: 45, buff: { name: '든든한 속', text: '최대 생명력 +15', hp: 15, phases: 3 }, hint: '할머니가 그러는데, 민물고기는 소금만 쳐서 굽는 게 제일이래요.' },
  boarstew: { name: '멧돼지 약초 찜', needs: ['boarmeat', 'herb', 'salt'], full: 70, buff: { name: '뜨거운 피', text: '공격력 +4', attack: 4, phases: 3 }, hint: '주점 주인이 누린내는 약초로 잡는다고 했다.' },
  berryrice: { name: '산열매 주먹밥', needs: ['riceball', 'berry'], full: 50, buff: { name: '가벼운 발', text: '방어력 +2', defense: 2, phases: 3 }, hint: '숲에서 누가 주먹밥에 열매를 박아 먹더라.' },
  herbfish: { name: '약초 붕어 탕', needs: ['crucian', 'herb'], full: 40, buff: { name: '맑은 정신', text: '숙련도 오름 +5%', xp: 0.05, phases: 3 }, hint: '신전지기는 아픈 사람에게 생선 넣은 약초 물을 먹인다.' },
};
export const DISH_ORDER = ['saltfish', 'boarstew', 'berryrice', 'herbfish'];

/** 틀린 조합. */
export const MUSH = { name: '먹을 수는 있는 것', full: 15 };

export const COOK_LINES = ['모닥불에 올렸다. 연기가 오른다.', '모닥불에 올렸다. 지글거린다.', '모닥불에 올렸다. 냄새가 번진다.'];
