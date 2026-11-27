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
  ironhelm: { name: '쇠 투구', kind: 'gear', slot: 'head', defense: 3, dur: 90, weight: 2, price: 50, icon: 'item-ore', desc: '쇠판을 두드려 둥글게 편 투구. 머리를 감싼다.' },
  leathergloves: { name: '가죽 장갑', kind: 'gear', slot: 'hand', attack: 1, defense: 1, dur: 60, weight: 0, price: 30, icon: 'item-hide', desc: '손바닥에 덧댄 가죽이 손잡이를 놓치지 않게 한다.' },
  leatherboots: { name: '가죽 장화', kind: 'gear', slot: 'feet', defense: 3, dur: 60, weight: 1, price: 40, icon: 'item-sandal', desc: '무두질한 가죽을 꿰매 지은 장화. 발목까지 감싼다.' },
  leathervest: { name: '가죽 조끼', kind: 'gear', slot: 'body', defense: 5, dur: 70, weight: 3, price: 60, icon: 'item-cloth', desc: '가죽 두 겹을 꿰맨 조끼. 움직이기 편하다.' },
  leatherarmor: { name: '가죽 갑옷', kind: 'gear', slot: 'body', defense: 8, dur: 100, weight: 5, price: 110, icon: 'item-cloth', desc: '가죽 겹 사이에 쇠 징을 박았다. 무겁지만 단단하다.' },
  sandals: { name: '짚신', kind: 'gear', slot: 'feet', defense: 1, dur: 30, weight: 1, price: 3, icon: 'item-sandal', desc: '금방 닳지만 금방 삼는다.' },
  // 2단계: 강철과 곰 가죽 (LV-F2, 11~20). 무기 24, 방어구 합 32
  steelsword: { name: '강철 검', kind: 'gear', slot: 'weapon', tier: 2, attack: 24, dur: 110, weight: 4, price: 190, gradeIcon: 'sword', desc: '쇠를 접어 두드린 검. 날이 쉽게 무뎌지지 않는다.' },
  longbow: { name: '긴 활', kind: 'gear', slot: 'weapon', tier: 2, attack: 14, dur: 70, weight: 2, price: 100, job: 'archer', icon: 'item-bow', desc: '고갯바람을 뚫는 긴 활. 궁수만 쓴다.' },
  steelknife: { name: '강철 단검', kind: 'gear', slot: 'weapon', tier: 2, attack: 12, dur: 65, weight: 1, price: 90, job: 'rogue', icon: 'item-knife', desc: '손바닥만 한 날. 도적만 쓴다.' },
  steelwand: { name: '강철 고리 지팡이', kind: 'gear', slot: 'weapon', tier: 2, attack: 7, dur: 70, weight: 2, price: 100, job: 'mage', icon: 'item-wand', desc: '끝에 강철 고리 셋을 건 지팡이. 마법사만 쓴다.' },
  steelshield: { name: '강철 방패', kind: 'gear', slot: 'off', tier: 2, defense: 7, dur: 90, weight: 5, price: 90, job: 'warrior', icon: 'item-shield', desc: '강철판을 덧댄 방패. 전사만 쓴다.' },
  steelhelm: { name: '강철 투구', kind: 'gear', slot: 'head', tier: 2, defense: 5, dur: 120, weight: 2, price: 120, icon: 'item-ore', desc: '이마에 띠를 두른 투구.' },
  steelarmor: { name: '강철 갑옷', kind: 'gear', slot: 'body', tier: 2, defense: 13, dur: 140, weight: 7, price: 300, icon: 'item-cloth', desc: '곰 가죽 위에 강철 비늘을 겹쳐 엮었다. 대장 2단계의 승급작이다.' },
  beargloves: { name: '곰 가죽 장갑', kind: 'gear', slot: 'hand', tier: 2, attack: 1, defense: 2, dur: 80, weight: 0, price: 70, icon: 'item-hide', desc: '두꺼운 가죽이 손등을 덮는다.' },
  bearboots: { name: '곰 가죽 장화', kind: 'gear', slot: 'feet', tier: 2, defense: 5, dur: 90, weight: 1, price: 100, icon: 'item-sandal', desc: '고갯길 돌밭에도 미끄러지지 않는다.' },
  steelring: { name: '강철 반지', kind: 'gear', slot: 'ring', tier: 2, attack: 2, defense: 3, dur: 130, weight: 0, price: 140, icon: 'item-ore', desc: '강철을 가늘게 뽑아 세 번 감았다.' },
  steel: { name: '강철 덩이', kind: 'material', tier: 2, weight: 1, icon: 'item-ore', price: 14, desc: '쇠를 여러 번 접어 두드린 덩이. 고갯길 너머 대장간에서 쓴다.' },
  bearhide: { name: '곰 가죽', kind: 'material', tier: 2, weight: 3, icon: 'item-hide', price: 26, desc: '손가락이 묻힐 만큼 털이 깊다.' },
  bearmeat: { name: '곰 고기', kind: 'material', tier: 2, weight: 2, icon: 'item-meat', price: 14, desc: '기름이 두껍다. 오래 끓여야 한다.' },
  dish_bearstew: { name: '곰 고기 전골', kind: 'eat', tier: 2, weight: 1, icon: 'item-meat', price: 60, eat: { full: 75, dish: 'bearstew' }, desc: '기름이 뜬 뜨거운 전골. 먹으면 곰의 속(최대 생명력 +40, 공격력 +5).' },
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
  emptypouch: { name: '빈 물 주머니', kind: 'material', weight: 0, icon: 'item-water', price: 2, desc: '물을 다 마신 주머니. 우물에서 다시 채운다.' }, // 소금벌 (SB-B3): 마신 주머니는 비고, 우물에서 다시 찬다
  torch: { name: '횃불', kind: 'eat', weight: 1, icon: 'item-branch', price: 6, throw: { element: '불', dmg: 16 }, desc: '싸움에서 휘두른다. 불 속성으로 16 피해.' },
  assassinmask: { name: '암살자의 가면', kind: 'etc', weight: 0, icon: 'item-unknown', price: 5000, desc: '눈구멍만 뚫린 검은 가면. 손에 넣으면 칭호 "암살자"가 생긴다.' },
  shardkey: { name: '셋째 자물쇠의 열쇠', kind: 'etc', weight: 0, icon: 'item-unknown', price: 1, desc: '종 조각 창고 안쪽 문에 맞을 것 같다. 꼬리표에 값이 적혀 있다.' },
  icekey: { name: '얼음 낀 열쇠', kind: 'etc', weight: 0, icon: 'item-unknown', price: 1, desc: '얼음 종루 어딘가의 문에 맞을 것 같다. 손에 쥐면 시리다.' },
  ruinkey: { name: '녹슨 열쇠', kind: 'etc', weight: 0, icon: 'item-unknown', price: 1, desc: '폐허 어딘가의 문에 맞을 것 같다.' },
  // 잿골 (AG-B3): 쇠 장비 하나의 내구도 +20. 큰 대장간에서만 판다. 한 번 쓰면 없어진다
  whetstone: { name: '숫돌', kind: 'etc', weight: 1, icon: 'item-ore', price: 60, whet: 20, desc: '손바닥만 한 거친 돌. 찬 쇠 장비 가운데 가장 많이 닳은 것 하나의 내구도를 20 되살린다. 한 번 쓰면 닳아 없어진다.' },
  // 안개늪 (AN-B3): 등불과 표식 끈은 등불 다리에서만 판다. 약초 다섯 가지는 약초꾼의 장부(AN-D7)에 들어갈 것들이다
  lamp: { name: '등불', kind: 'etc', weight: 1, icon: 'item-branch', price: 90, lamp: 60, desc: '기름 먹인 심지를 단 작은 등. 안개늪의 들판에서 켜면 예순 번 움직이는 동안 길을 잃지 않는다. 다 타면 없어진다.' },
  marker: { name: '표식 끈', kind: 'etc', weight: 0, icon: 'item-cloth', price: 40, desc: '눈에 띄게 물들인 끈. 안개늪의 사냥터에 한 번에 하나씩 묶는다. 열 개를 묶은 곳에서는 다시 길을 잃지 않는다.' },
  mosskey: { name: '이끼 낀 열쇠', kind: 'etc', weight: 1, icon: 'item-unknown', price: 1, desc: '가라앉는 오솔길의 사립문에 맞을 것 같다. 이끼를 긁어내도 다시 돋는다.' },
  marshmoss: { name: '물이끼', kind: 'material', weight: 0, icon: 'item-herb', price: 12, desc: '쥐면 물이 한 줌 나온다. 상처에 대면 시원하다.' },
  toadgrass: { name: '두꺼비풀', kind: 'material', weight: 0, icon: 'item-herb', price: 12, desc: '두꺼비가 앉았던 자리에만 난다. 잎이 우툴두툴하다.' },
  mistmint: { name: '늪 박하', kind: 'material', weight: 0, icon: 'item-herb', price: 16, desc: '씹으면 코끝의 안개가 걷히는 것 같다.' },
  lampshroom: { name: '등불 버섯', kind: 'material', weight: 0, icon: 'item-herb', price: 16, desc: '어두운 데서 흐리게 빛난다. 길을 밝힐 만큼은 아니다.' },
  fogbloom: { name: '안개꽃', kind: 'material', weight: 0, icon: 'item-herb', price: 16, desc: '안개 속에서만 핀다. 꺾어 들고 나오면 반나절 만에 진다고 하는데, 아직 피어 있다.' },
  // 잠긴 도성 (JD-B3): 공기 주머니는 잠수꾼 조합에서 팔고, 비늘 가죽 둘로 직접 꿰맬 수도 있다. 물 아래에서만 쓴다
  airbag: { name: '공기 주머니', kind: 'eat', weight: 1, icon: 'item-water', price: 120, eat: { air: 10 }, desc: '비늘 가죽을 꿰매 공기를 채운 주머니. 물 아래에서 물면 숨이 10 돌아온다. 싸우는 중에도 쓴다. 한 번 쓰면 없어진다.' },
  palacekey: { name: '물먹은 궁 열쇠', kind: 'etc', weight: 1, icon: 'item-unknown', price: 1, desc: '잠긴 궁 넷째 전각의 문에 맞을 것 같다. 청동이라 삭지 않았다.' },
  // 구름다리 (GD-A10): 하늘 신전의 안문 열쇠
  templekey: { name: '신전 안문 열쇠', kind: 'etc', weight: 1, icon: 'item-unknown', price: 1, desc: '하늘 신전 넷째 전의 금칠한 안문에 맞을 것 같다. 손때가 없다.' },
  // 별못 (BM-E, BM-F): 종 조각은 별 떨어진 벌에서 나고, 작은 종은 그것으로 세공한다. 둘 다 팔거나 버릴 수 없다
  bellshard: { name: '종 조각', kind: 'quest', weight: 1, icon: 'item-ore', desc: '별이 종을 깼을 때 튄 조각. 쥐면 조금 떤다. 혼자서는 울지 못한다.' },
  smallbell: { name: '작은 종', kind: 'quest', weight: 1, icon: 'item-ore', desc: '종 조각 하나를 다듬어 지은 종. 소리가 작다. 옆집까지만 들린다.' },
  wetledger: { name: '젖은 족보', kind: 'quest', weight: 1, icon: 'item-cloth', desc: '잠긴 거리의 어느 집 궤에서 건진 족보. 먹이 번졌지만 성은 읽힌다.' },
  kilnkey: { name: '가마 문의 쇠지레', kind: 'etc', weight: 1, icon: 'item-unknown', price: 1, desc: '식지 않는 가마 안쪽 문의 빗장에 맞을 것 같다. 쥐는 데만 식어 있다.' },
  hotash: { name: '식지 않은 재', kind: 'quest', weight: 1, icon: 'item-ore', desc: '쇳물 내에서 퍼 담은 재. 속이 아직 붉다. 식기 전에 날라야 한다.' },
  eel: { name: '장어', kind: 'material', weight: 1, icon: 'item-fish', price: 9, desc: '미끄럽고 힘이 세다. 나루에서만 난다.' },
  tar: { name: '역청', kind: 'material', weight: 1, icon: 'item-ore', price: 7, desc: '배 밑에 바르는 끈적한 검은 것. 나루에서만 판다.' },
  sailcloth: { name: '돛천', kind: 'material', weight: 2, icon: 'item-cloth', price: 22, desc: '질긴 삼베를 겹쳐 기운 천. 나루에서만 판다.' },
  pearl: { name: '강 진주', kind: 'etc', grade: 2, weight: 0, icon: 'item-unknown', price: 120, desc: '민물조개에서 나온 흐린 진주. 상단이 좋아한다.' },
  deed: { name: '광맥의 옛 증서', kind: 'quest', weight: 0, icon: 'item-unknown', desc: '물에 불어 글씨가 번졌다. 울림쇠 광맥의 첫 임자 이름과, 그가 광맥을 "캐는 사람 모두"에게 남긴다는 말이 적혀 있다.' },
  salt: { name: '소금', kind: 'material', weight: 0, icon: 'item-rice', price: 2, desc: '굵은 소금 한 줌. 굽는 것에 뿌린다.' },
  berry: { name: '산열매', kind: 'eat', weight: 0, icon: 'item-berry', price: 1, eat: { full: 10 }, desc: '시고 달다. 포만감 +10, 생명력 +5.' },
  bread: { name: '신전의 빵', kind: 'eat', weight: 1, icon: 'item-rice', price: 0, nosell: true, eat: { full: 20 }, desc: '경매장 수수료로 사 온 밀가루를 주방장이 구워 날마다 하나씩 나눠 주는 딱딱한 빵. 포만감 +20, 생명력 +10. 팔 수는 없다.' },
  riceball: { name: '주먹밥', kind: 'eat', weight: 1, icon: 'item-rice', price: 5, eat: { full: 30 }, desc: '소금만 친 주먹밥. 포만감 +30, 생명력 +15.' },
  holywater: { name: '성수', kind: 'eat', weight: 1, icon: 'item-water', price: 60, perLevel: 6, eat: { grace: true, shadow: true }, desc: '신전에서 축복한 물. 마시면 죽음의 그림자가 모두 걷히고, 신의 가호(공격력·방어력 +5%)가 두 때 동안 붙는다. 값은 레벨 × 6.' },
  // 공용주방에서 만든 음식 (Z83): 가방에 담겼다가 먹으면 그 음식의 힘이 붙는다
  dish_saltfish: { name: '소금 붕어 구이', kind: 'eat', weight: 1, icon: 'item-fish', price: 12, eat: { full: 45, dish: 'saltfish' }, desc: '그릇에 담아 온 구이. 먹으면 든든한 속(최대 생명력 +15).' },
  dish_berryrice: { name: '산열매 주먹밥', kind: 'eat', weight: 1, icon: 'item-rice', price: 10, eat: { full: 50, dish: 'berryrice' }, desc: '열매를 박은 주먹밥. 먹으면 가벼운 발(방어력 +2).' },
  dish_boarstew: { name: '멧돼지 약초 찜', kind: 'eat', weight: 2, icon: 'item-meat', price: 22, eat: { full: 70, dish: 'boarstew' }, desc: '뚜껑 덮은 찜. 먹으면 뜨거운 피(공격력 +4).' },
  dish_herbfish: { name: '약초 붕어 탕', kind: 'eat', weight: 1, icon: 'item-fish', price: 16, eat: { full: 40, dish: 'herbfish' }, desc: '맑은 탕. 먹으면 맑은 정신(숙련도 오름 +5%).' },
  dish_eelsoup: { name: '장어 소금 국', kind: 'eat', weight: 1, icon: 'item-fish', price: 30, eat: { full: 60, dish: 'eelsoup' }, desc: '진한 국. 먹으면 깊은 숨(최대 생명력 +25).' },
  dish_boarskewer: { name: '멧돼지 산열매 꼬치', kind: 'eat', weight: 1, icon: 'item-meat', price: 26, eat: { full: 55, dish: 'boarskewer' }, desc: '단내 나는 꼬치. 먹으면 사나운 입맛(공격력 +3, 방어력 +1).' },
  // 흰마루 (WM-B3, WM-F4): 식은 몸일 때만 얼음 구멍에서 문다. 잡아 보기 전에는 도감에 이름이 없다
  silverfish: { name: '얼음 밑 은어', kind: 'material', tier: 3, weight: 1, icon: 'item-fish', price: 66, desc: '얼음 바로 밑에 붙어 다니는 은빛 고기. 몸이 더운 사람의 줄에는 물지 않는다.' },
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

// 3~10단계의 재료·장비·음식 (LV-F3~F10). 그 지역을 낼 때까지는 게임 안에서 닿지 않는다
import { tierItems } from './tiers.js?v=a145911';
Object.assign(ITEMS, tierItems());
