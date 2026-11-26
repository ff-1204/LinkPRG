// 물건 (G1, R2-4, X2). 등급은 글자로도 적는다. 그림은 꾸밈이다.

export const GRADES = ['일반', '고급', '희귀', '영웅', '전설'];
/** 등급에 따른 능력치 배율. 같은 설계도라도 등급이 높으면 세다. */
export const GRADE_MULT = [1, 1.3, 1.75, 2.3, 3];

/** 장비 칸 여덟 (G1-1). 장신구는 두 칸이다. */
export const EQUIP_SLOTS = [
  { id: 'weapon', name: '무기' }, { id: 'off', name: '보조' }, { id: 'head', name: '머리' }, { id: 'body', name: '몸' },
  { id: 'hand', name: '손' }, { id: 'feet', name: '신발' }, { id: 'ring1', name: '장신구' }, { id: 'ring2', name: '장신구' },
];

/** 가방의 갈래 여섯 (G1-4). */
export const BAG_TABS = [
  { id: 'all', name: '모두' }, { id: 'gear', name: '장비' }, { id: 'material', name: '재료' },
  { id: 'eat', name: '소비' }, { id: 'quest', name: '퀘스트' }, { id: 'etc', name: '기타' },
];

/**
 * kind: gear | material | eat | quest | etc
 * slot: 장비일 때 차는 칸 (장신구는 'ring')
 * icon: art/pixel/out/<icon>.png. 무기는 등급에 따라 <icon>-<등급 번호+1>.
 */
export const ITEMS = {
  woodsword: { name: '낡은 목검', kind: 'gear', slot: 'weapon', attack: 6, dur: 60, weight: 3, price: 5, icon: 'item-woodsword', maker: '훈련소 비품', desc: '허수아비를 치라고 내주는 목검. 손잡이가 여러 사람의 손 모양대로 패었다.' },
  coppersword: { name: '구리 검', kind: 'gear', slot: 'weapon', attack: 10, dur: 50, weight: 3, price: 40, gradeIcon: 'sword', desc: '무른 구리를 두드려 만든 검. 날이 쉽게 무뎌진다.' },
  // 도구: 차지 않고 가방에 둔다. 쓸 때마다 닳는다
  chisel: { name: '조각칼', kind: 'gear', tool: true, dur: 120, weight: 1, price: 30, icon: 'item-unknown', desc: '나무를 깎는 칼. 가방에 있어야 조각을 할 수 있다. 칼질 한 번에 조금씩 닳는다.' },
  ironsword: { name: '철검', kind: 'gear', slot: 'weapon', attack: 14, dur: 80, weight: 4, price: 70, gradeIcon: 'sword', desc: '쇠를 두드려 편 검. 등급이 높을수록 날빛이 다르다.' },
  oldchisel: { name: '이름이 새겨진 정', kind: 'quest', weight: 1, icon: 'item-knife', price: 0, desc: '광산 깊은 곳에서 주운 녹슨 정. 손잡이에 대장간 영감님의 이름이 새겨져 있다.' },
  bellpicture: { name: '종소리 그림', kind: 'etc', weight: 0, icon: 'item-cloth', price: 0, nosell: true, desc: '어릴 적 신전 마루 밑에 숨겨 둔 그림. 종소리를 쇠처럼 그렸다.' },
  oldshield: { name: '낡은 방패', kind: 'gear', slot: 'off', defense: 4, dur: 60, weight: 4, price: 30, job: 'warrior', icon: 'item-shield', desc: '가장자리가 찌그러진 나무 방패. 전사만 쓴다.' },
  shortbow: { name: '짧은 활', kind: 'gear', slot: 'weapon', attack: 8, dur: 50, weight: 2, price: 36, job: 'archer', icon: 'item-bow', desc: '숲에서 쓰기 좋은 짧은 활. 궁수만 쓴다.' },
  ashwand: { name: '물푸레 지팡이', kind: 'gear', slot: 'weapon', attack: 4, dur: 50, weight: 2, price: 36, job: 'mage', icon: 'item-wand', desc: '끝에 노란 돌이 박힌 지팡이. 마법사만 쓴다.' },
  copperring: { name: '구리 반지', kind: 'gear', slot: 'ring', defense: 1, dur: 80, weight: 0, price: 20, icon: 'item-beads', desc: '구리를 둥글게 감은 반지. 손가락이 조금 든든하다.' },
  fangring: { name: '송곳니 반지', kind: 'gear', slot: 'ring', attack: 2, dur: 70, weight: 0, price: 40, icon: 'item-fang', desc: '늑대 송곳니를 구리에 물린 반지. 주먹이 사나워진다.' },
  ironring: { name: '철 반지', kind: 'gear', slot: 'ring', attack: 1, defense: 2, dur: 100, weight: 0, price: 60, icon: 'item-ore', desc: '두꺼운 쇠고리에 송곳니 하나를 박았다.' },
  prayerbeads: { name: '기도 구슬', kind: 'gear', slot: 'ring', defense: 2, dur: 80, weight: 0, price: 30, job: 'priest', icon: 'item-beads', desc: '손때 묻은 나무 구슬. 사제만 쓴다.' },
  thinknife: { name: '얇은 칼', kind: 'gear', slot: 'weapon', attack: 7, dur: 45, weight: 1, price: 32, job: 'rogue', icon: 'item-knife', desc: '소매에 들어가는 칼. 도적만 쓴다.' },
  trainwear: { name: '훈련복', kind: 'gear', slot: 'body', defense: 2, dur: 40, weight: 3, price: 8, icon: 'item-cloth', desc: '질긴 무명옷. 무릎에 덧댄 자국이 있다.' },
  leatherboots: { name: '가죽 장화', kind: 'gear', slot: 'feet', defense: 3, dur: 60, weight: 1, price: 40, icon: 'item-sandal', desc: '무두질한 가죽을 꿰매 지은 장화. 발목까지 감싼다.' },
  leathervest: { name: '가죽 조끼', kind: 'gear', slot: 'body', defense: 5, dur: 70, weight: 3, price: 60, icon: 'item-cloth', desc: '가죽 두 겹을 꿰맨 조끼. 움직이기 편하다.' },
  leatherarmor: { name: '가죽 갑옷', kind: 'gear', slot: 'body', defense: 8, dur: 100, weight: 5, price: 110, icon: 'item-cloth', desc: '가죽 겹 사이에 쇠 징을 박았다. 무겁지만 단단하다.' },
  sandals: { name: '짚신', kind: 'gear', slot: 'feet', defense: 1, dur: 30, weight: 1, price: 3, icon: 'item-sandal', desc: '금방 닳지만 금방 삼는다.' },
  ironore: { name: '철광석', kind: 'material', weight: 1, icon: 'item-ore', price: 4, desc: '붉은 녹이 슨 돌. 녹이면 쇠가 된다.' },
  copperore: { name: '구리 광석', kind: 'material', weight: 1, icon: 'item-copper', price: 6, desc: '푸르스름한 얼룩이 박힌 돌.' },
  oakbranch: { name: '참나무 가지', kind: 'material', weight: 1, icon: 'item-branch', price: 2, desc: '단단하고 곧다. 자루로도, 깎을 거리로도 좋다.' },
  herb: { name: '하급 약초', kind: 'material', weight: 0, icon: 'item-herb', price: 3, eat: { hp: 15 }, desc: '씹으면 쓰다. 상처에 붙이면 조금 낫다. 생명력 +15. 요리 재료로도 쓴다.' },
  boarhide: { name: '멧돼지 가죽', kind: 'material', weight: 2, icon: 'item-hide', price: 12, desc: '털이 억세다.' },
  boarmeat: { name: '멧돼지 고기', kind: 'material', weight: 2, icon: 'item-meat', price: 8, desc: '날로는 못 먹는다. 구워야 한다.' },
  batwing: { name: '박쥐 날개', kind: 'material', weight: 0, icon: 'item-wing', price: 5, desc: '얇고 질기다.' },
  wolffang: { name: '늑대 송곳니', kind: 'material', weight: 0, icon: 'item-fang', price: 9, desc: '손가락만 한 이빨.' },
  crucian: { name: '붕어', kind: 'material', weight: 1, icon: 'item-fish', price: 3, desc: '손바닥만 한 민물고기. 구워야 먹는다.' },
  waterpouch: { name: '물 주머니', kind: 'eat', weight: 1, icon: 'item-water', price: 8, throw: { element: '물', dmg: 16 }, desc: '싸움에서 던진다. 물 속성으로 16 피해. 불에 약한 것에게는 더 아프다.' },
  torch: { name: '횃불', kind: 'eat', weight: 1, icon: 'item-branch', price: 6, throw: { element: '불', dmg: 16 }, desc: '싸움에서 휘두른다. 불 속성으로 16 피해.' },
  ruinkey: { name: '녹슨 열쇠', kind: 'etc', weight: 0, icon: 'item-unknown', price: 1, desc: '폐허 어딘가의 문에 맞을 것 같다.' },
  eel: { name: '장어', kind: 'material', weight: 1, icon: 'item-fish', price: 9, desc: '미끄럽고 힘이 세다. 나루에서만 난다.' },
  tar: { name: '역청', kind: 'material', weight: 1, icon: 'item-ore', price: 7, desc: '배 밑에 바르는 끈적한 검은 것. 나루에서만 판다.' },
  sailcloth: { name: '돛천', kind: 'material', weight: 2, icon: 'item-cloth', price: 22, desc: '질긴 삼베를 겹쳐 기운 천. 나루에서만 판다.' },
  pearl: { name: '강 진주', kind: 'etc', grade: 2, weight: 0, icon: 'item-unknown', price: 120, desc: '민물조개에서 나온 흐린 진주. 상단이 좋아한다.' },
  deed: { name: '광맥의 옛 증서', kind: 'quest', weight: 0, icon: 'item-unknown', desc: '물에 불어 글씨가 번졌다. 울림쇠 광맥의 첫 임자 이름과, 그가 광맥을 "캐는 사람 모두"에게 남긴다는 말이 적혀 있다.' },
  salt: { name: '소금', kind: 'material', weight: 0, icon: 'item-rice', price: 2, desc: '굵은 소금 한 줌. 굽는 것에 뿌린다.' },
  berry: { name: '산열매', kind: 'eat', weight: 0, icon: 'item-berry', price: 1, eat: { full: 10 }, desc: '시고 달다. 포만감 +10, 생명력 +5.' },
  bread: { name: '신전의 빵', kind: 'eat', weight: 1, icon: 'item-rice', price: 0, nosell: true, eat: { full: 20 }, desc: '신전에서 날마다 하나씩 나눠 주는 딱딱한 빵. 포만감 +20, 생명력 +10. 팔 수는 없다.' },
  riceball: { name: '주먹밥', kind: 'eat', weight: 1, icon: 'item-rice', price: 5, eat: { full: 30 }, desc: '소금만 친 주먹밥. 포만감 +30, 생명력 +15.' },
  holywater: { name: '성수', kind: 'eat', weight: 1, icon: 'item-water', price: 60, perLevel: 6, eat: { grace: true }, desc: '신전에서 축복한 물. 마시면 신의 가호(공격력·방어력 +5%)가 두 때 동안 붙는다. 값은 레벨 × 6.' },
  redpotion: { name: '붉은 물약', kind: 'eat', grade: 1, weight: 1, icon: 'item-potion', price: 20, eat: { hpPct: 40 }, desc: '최대 생명력의 40%를 채운다.' },
  forgetwater: { name: '잊는 물', kind: 'etc', grade: 3, weight: 1, icon: 'item-water', price: 400, desc: '마시면 손에 익은 갈래 하나를 잊는다. 다시 고를 수 있게 된다. 아주 귀하다.' },
  oldrod: { name: '진흙투성이 낚싯대', kind: 'quest', weight: 1, icon: 'item-branch', desc: '강바닥에서 건져 올렸다. 손잡이 마디에 실이 곱게 감겨 있다.' },
  grannyrod: { name: '영감님의 낚싯대', kind: 'etc', grade: 1, weight: 1, icon: 'item-branch', price: 30, desc: '오래 쓴 대나무 낚싯대. 가방에 있으면 낚시의 허탕이 10%p 줄어든다.' },
  mistrod: { name: '물안개 낚싯대', kind: 'etc', grade: 3, weight: 1, icon: 'item-branch', price: 300, desc: '물속의 누군가가 건네준 낚싯대. 가방에 있으면 낚시의 허탕이 20%p 줄어든다. 세상에 하나뿐이다.' },
  oddknife: { name: '이름 모를 조각칼', kind: 'etc', weight: 1, icon: 'item-unknown', unknown: true, knownAs: 'carverknife', desc: '날에 무언가 새겨져 있는데 읽을 수 없다. 나무는 잘 깎인다. 아무리 써도 닳지 않는다.' },
  carverknife: { name: '깎는 이의 칼', kind: 'etc', weight: 1, icon: 'item-unknown', desc: '날에 "깎는 이의 칼"이라 새겨져 있다. 오래전 이름난 조각가가 쓰던 칼이다. 나무가 잘 깎이고, 아무리 써도 닳지 않는다.' },
};

export function itemDef(id) {
  const d = ITEMS[id];
  if (!d) throw new Error('모르는 물건: ' + id);
  return d;
}

export function gradeName(grade) {
  return GRADES[grade ?? 0];
}
