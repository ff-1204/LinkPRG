// 세력 넷과 성향 (T29~T33). 한쪽이 오르면 맞수는 내린다. 옳고 그름을 두지 않는다.

export const FACTIONS = {
  miners: { id: 'miners', name: '광부 조합', rival: 'merchants', say: '캐는 사람들. 광맥은 캔 사람의 것이라고 믿는다.' },
  merchants: { id: 'merchants', name: '상단', rival: 'miners', say: '파는 사람들. 광맥은 값을 치른 사람의 것이라고 믿는다.' },
  temple: { id: 'temple', name: '신전', rival: 'alley', say: '종소리를 신의 목소리라 가르친다.' },
  alley: { id: 'alley', name: '뒷골목', rival: 'temple', say: '신전이 못 본 척하는 사람들이 서로를 돌본다.' },
};
export const FACTION_ORDER = ['miners', 'merchants', 'temple', 'alley'];

/** 다섯 단계와, 그 아래의 '미움' (T32). */
export const STANDINGS = [
  { name: '미움', at: -Infinity },
  { name: '남', at: 0 },
  { name: '낯익음', at: 10 },
  { name: '단골', at: 30 },
  { name: '벗', at: 70 },
  { name: '한편', at: 150 },
];
export const HATED_BELOW = -10; // 이보다 낮으면 '미움'
export const FACTION_REGULAR = 3; // '단골'의 번호
/** 한쪽이 오를 때 맞수가 내리는 몫. */
export const RIVAL_RATE = 0.5;

/** 성향: 의로움(+)과 실리(−) 한 줄 (T33). */
export const LEANS = [
  { name: '실리를 따르는 이', at: -Infinity },
  { name: '실리 쪽', at: -6 },
  { name: '어느 쪽도 아닌 이', at: -2 },
  { name: '의로움 쪽', at: 3 },
  { name: '의로움을 따르는 이', at: 7 },
];
