// 퀘스트 네 갈래의 글과 꼴 (Q1~Q4, E19~E23, S1). 글은 사용자가 읽고 고치는 자리다.
// 효과 말: bond [[사람, 점수]] · fame · silver · xp · take/give [[물건, 개수]] · title [id, 까닭] · set(이 퀘스트의 표시) · lean(+의로움/−실리)

import { MAIN13, ANVIL_ENDS, ANVIL_END_ORDER } from './anvil.js?v=81955bc';

// ── 의뢰 (게시판) ─────────────────────────────────────────
export const JOB_LIMIT = 3;
export const JOB_DAYS = 3;
export const BOARD_SIZE = 3;

/** kind: bring(물건을 가져온다) | hunt(괴물을 잡는다). daily면 날마다 다시 붙는다 (E23). */
export const JOBS = {
  herb5: { faction: ['temple', 3], rank: 'E', name: '하급 약초 5포기', by: '신전지기', kind: 'bring', item: 'herb', n: 5, silver: 14, xp: 30, fame: 2, minLevel: 1, daily: true, say: '다친 사람은 날마다 온다네.' },
  hide3: { faction: ['merchants', 4], rank: 'E', name: '멧돼지 가죽 3장', by: '가죽 장인', kind: 'bring', item: 'boarhide', n: 3, silver: 34, xp: 60, fame: 3, minLevel: 1, say: '겨울 장화를 지어야 하오.' },
  branch8: { rank: 'E', name: '참나무 가지 8개', by: '대장간 주인', kind: 'bring', item: 'oakbranch', n: 8, silver: 14, xp: 25, fame: 2, minLevel: 1, say: '망치 자루가 다 닳았다.' },
  rat3: { faction: ['alley', 3], rank: 'E', name: '들쥐 3마리', by: '주점 주인', kind: 'hunt', mon: 'rat', n: 3, silver: 16, xp: 40, fame: 2, minLevel: 1, say: '창고 자루를 죄다 쏠아 놨네.' },
  fish4: { rank: 'E', name: '붕어 4마리', by: '잡화점 할머니', kind: 'bring', item: 'crucian', n: 4, silver: 14, xp: 30, fame: 2, minLevel: 1, say: '저녁 찬거리가 없어서.' },
  wolf2: { rank: 'D', name: '숲 늑대 2마리', by: '나무꾼', kind: 'hunt', mon: 'wolf', n: 2, silver: 32, xp: 90, fame: 4, minLevel: 3, say: '나무하러 못 들어가고 있소.' },
  ore10: { faction: ['miners', 5], rank: 'D', name: '철광석 10개', by: '대장간 주인', kind: 'bring', item: 'ironore', n: 10, silver: 36, xp: 60, fame: 3, minLevel: 3, say: '쇠가 떨어졌다. 급하다.' },
  fang3: { faction: ['merchants', 5], rank: 'D', name: '늑대 송곳니 3개', by: '약재상', kind: 'bring', item: 'wolffang', n: 3, silver: 40, xp: 80, fame: 4, minLevel: 3, say: '갈아서 약에 쓴다오.' },
  bat3: { faction: ['miners', 8], rank: 'C', name: '동굴 박쥐 3마리', by: '광부', kind: 'hunt', mon: 'bat', n: 3, silver: 60, xp: 220, fame: 6, minLevel: 5, say: '갱도에서 등불을 못 켜겠네.' },
  snake3: { at: 'guild', rank: 'C', name: '갈대 뱀 3마리', by: '나루 뱃사람들', kind: 'hunt', mon: 'reedsnake', n: 3, silver: 180, xp: 700, fame: 8, minLevel: 9, daily: true, say: '갈대밭 뱃길을 못 지나가오.' },
  toad2: { at: 'guild', rank: 'C', name: '늪 두꺼비 2마리', by: '약재상', kind: 'hunt', mon: 'mudtoad', n: 2, silver: 160, xp: 600, fame: 7, minLevel: 9, faction: ['merchants', 6], say: '기름이 약이 된다오.' },
  eel8: { at: 'guild', rank: 'C', name: '장어 8마리', by: '여인숙 주인', kind: 'bring', item: 'eel', n: 8, silver: 120, xp: 400, fame: 6, minLevel: 9, say: '고개 넘어온 손님들 보양을 시켜야지.' },
  hawk3: { at: 'guild', rank: 'B', name: '바위 매 3마리', by: '모험가 회관', kind: 'hunt', mon: 'rockhawk', n: 3, silver: 420, xp: 2200, fame: 14, minLevel: 15, say: '고갯길 짐꾼이 넷이나 채였다.' },
  bear1: { at: 'guild', rank: 'B', name: '고개 곰 1마리', by: '모험가 회관', kind: 'hunt', mon: 'passbear', n: 1, silver: 380, xp: 1800, fame: 14, minLevel: 15, say: '고갯마루 돌무더기 옆에 자리를 잡았다.' },
  drowned2: { at: 'guild', rank: 'A', name: '가라앉은 뱃사람 2', where: '가라앉은 배 안에서 사냥', by: '상단 본점', kind: 'hunt', mon: 'drowned', n: 2, silver: 500, xp: 2400, fame: 18, minLevel: 12, faction: ['merchants', 10], say: '가라앉은 배의 짐을 건져야 하오.' },
  pearl3: { at: 'guild', rank: 'A', name: '강 진주 3알', where: '가라앉은 배 안, 갈대밭의 희귀한 발견', by: '큰 신전', kind: 'bring', item: 'pearl', n: 3, silver: 600, xp: 1500, fame: 16, minLevel: 12, faction: ['temple', 10], say: '제단에 올릴 것이네.' },
  // 흰마루 사냥꾼 움막의 게시판 (WM-A6). 삯은 이 구간 벌이에 맞춘다. 가져오는 일의 삯은 사서 채우는 값보다 적다
  fox3: { at: 'hut', rank: 'B', name: '서리 여우 3마리', by: '늙은 사냥꾼', kind: 'hunt', mon: 'frostfox', n: 3, silver: 240, xp: 2000, fame: 10, minLevel: 21, daily: true, say: '덫마다 미끼만 빼 간다.' },
  owl2: { at: 'hut', rank: 'B', name: '눈 올빼미 2마리', by: '주막 할멈', kind: 'hunt', mon: 'snowowl', n: 2, silver: 260, xp: 2400, fame: 10, minLevel: 21, say: '밤마다 지붕에 앉아. 아이들이 잠을 못 자.' },
  fur5: { at: 'hut', rank: 'B', name: '흰털 가죽 5장', by: '늙은 사냥꾼', kind: 'bring', item: 'whitefur', n: 5, silver: 200, xp: 1600, fame: 8, minLevel: 21, say: '겨울이 길어. 장갑이 모자라.' },
  iron6: { at: 'hut', rank: 'B', name: '서릿쇠 덩이 6개', by: '서리 대장장이', kind: 'bring', item: 'frostiron', n: 6, silver: 120, xp: 1500, fame: 8, minLevel: 21, say: '호수까지 나갈 사람이 없어.' },
  iceboar2: { at: 'hut', rank: 'A', name: '얼음 멧돼지 2마리', by: '얼음 낚시꾼', kind: 'hunt', mon: 'iceboar', n: 2, silver: 320, xp: 3000, fame: 12, minLevel: 23, say: '호수 쪽 구멍을 엄니로 다 깨 놨어.' },
  // 저울목의 용병 막사 (SB-A6). 가져오는 의뢰의 삯은 가장 싼 날 사서 채우는 값보다 적다. 글은 처음 값이다
  scorp3: { at: 'barracks', rank: 'B', name: '소금 전갈 3마리', by: '막사 대장', kind: 'hunt', mon: 'saltscorpion', n: 3, silver: 400, xp: 3600, fame: 10, minLevel: 31, daily: true, say: '수레 바퀴 밑에서 자꾸 나온다.' },
  worm2: { at: 'barracks', rank: 'B', name: '마른 갯지렁이 2마리', by: '소금 수레꾼', kind: 'hunt', mon: 'dryworm', n: 2, silver: 420, xp: 4000, fame: 10, minLevel: 31, say: '수레가 통째로 꺼졌어요.' },
  shell5: { at: 'barracks', rank: 'B', name: '전갈 껍질 5장', by: '소금 대장장이', kind: 'bring', item: 'scorpshell', n: 5, silver: 240, xp: 3000, fame: 8, minLevel: 31, say: '방패에 덧댈 게 모자라.' },
  salt6: { at: 'barracks', rank: 'B', name: '소금강 덩이 6개', by: '좌판 임자', kind: 'bring', item: 'saltsteel', n: 6, silver: 140, xp: 2600, fame: 8, minLevel: 31, say: '좌판이 비었소.' },
  crow2: { at: 'barracks', rank: 'A', name: '소금 까마귀 2마리', by: '우물 주인', kind: 'hunt', mon: 'saltcrow', n: 2, silver: 520, xp: 5000, fame: 12, minLevel: 33, say: '두레박 줄을 자꾸 쪼아 놔.' },
  weigher2: { at: 'barracks', rank: 'A', name: '떠도는 저울꾼 2명', by: '막사 대장', kind: 'hunt', mon: 'weigher', n: 2, silver: 640, xp: 6000, fame: 14, minLevel: 35, say: '상단을 나와 뱃길을 막는 것들이다. 달아 보려 들면 치워라.' },
  // 가마골 풀무 골목의 게시판 (AG-A5). 가져오는 의뢰의 삯은 사서 채우는 값보다 적다. 글은 처음 값이다
  lizard3: { at: 'bellows', rank: 'B', name: '잿빛 도마뱀 3마리', by: '굴뚝지기', kind: 'hunt', mon: 'ashlizard', n: 3, silver: 660, xp: 6000, fame: 10, minLevel: 41, daily: true, say: '굴뚝 밑동에 자꾸 알을 낳아.' },
  sparkbat2: { at: 'bellows', rank: 'B', name: '불똥 박쥐 2마리', by: '잿물 주막 주인', kind: 'hunt', mon: 'sparkbat', n: 2, silver: 700, xp: 6600, fame: 10, minLevel: 41, say: '지붕에 앉으면 짚이 타.' },
  scale5: { at: 'bellows', rank: 'B', name: '도마뱀 비늘 5장', by: '비늘 가게 주인', kind: 'bring', item: 'lizardscale', n: 5, silver: 400, xp: 5000, fame: 8, minLevel: 41, say: '풀무꾼들 앞치마를 새로 지어야 해.' },
  ash6: { at: 'bellows', rank: 'B', name: '잿쇠 덩이 6개', by: '풀무꾼 솔', kind: 'bring', item: 'ashiron', n: 6, silver: 230, xp: 4400, fame: 8, minLevel: 41, say: '작은 가마 테를 다시 둘러야 해. 큰 대장간은 우리한테 안 팔아.' },
  crab2: { at: 'bellows', rank: 'A', name: '쇳물 게 2마리', by: '풀무꾼 다래', kind: 'hunt', mon: 'moltencrab', n: 2, silver: 860, xp: 8200, fame: 12, minLevel: 43, say: '물길에 올라와서 풀무 가죽을 다 집어 놨어.' },
  ashblade2: { at: 'bellows', rank: 'A', name: '재투성이 검꾼 2명', by: '심판 노을', kind: 'hunt', mon: 'ashblade', n: 2, silver: 1060, xp: 10000, fame: 14, minLevel: 45, say: '마당 밖에서 칼을 드는 건 겨루기가 아니오. 말려 주시오.' },
  // 뜬마을 등불 다리의 게시판 (AN-A3). 가져오는 의뢰의 삯은 사서 채우는 값보다 적다. 글은 처음 값이다
  toad3: { at: 'lamp', rank: 'B', name: '이끼 두꺼비 3마리', by: '밧줄지기', kind: 'hunt', mon: 'mosstoad', n: 3, silver: 1100, xp: 10000, fame: 10, minLevel: 51, daily: true, say: '배 맬 말뚝인 줄 알고 줄을 걸었더니 뛰어요.' },
  leech2: { at: 'lamp', rank: 'B', name: '안개 거머리 2마리', by: '늪 사당지기', kind: 'hunt', mon: 'mistleech', n: 2, silver: 1160, xp: 11000, fame: 10, minLevel: 51, say: '사당 문턱까지 올라와요. 기도하다 물려요.' },
  thread5: { at: 'lamp', rank: 'B', name: '안개실 5타래', by: '약초꾼 수련', kind: 'bring', item: 'mistthread', n: 5, silver: 660, xp: 8400, fame: 8, minLevel: 51, say: '소매를 마저 지으려고요. 이번에는요.' },
  moss6: { at: 'lamp', rank: 'B', name: '이끼쇠 덩이 6개', by: '등불지기 여울', kind: 'bring', item: 'mossiron', n: 6, silver: 380, xp: 7400, fame: 8, minLevel: 51, say: '등불 걸쇠가 다 삭았어요.' },
  scare2: { at: 'lamp', rank: 'A', name: '물먹은 허수아비 2', by: '물 위 주막 주인', kind: 'hunt', mon: 'soakedscarecrow', n: 2, silver: 1420, xp: 13600, fame: 12, minLevel: 53, say: '밤마다 창밖에 서 있어. 손님이 잠을 못 자.' },
  light2: { at: 'lamp', rank: 'A', name: '늪 등불 2', by: '등불지기 여울', kind: 'hunt', mon: 'marshlight', n: 2, silver: 1750, xp: 16600, fame: 14, minLevel: 55, say: '내 등불인 줄 알고 따라간 사람이 셋이에요.' },
  // 지붕마을의 게시판 둘 (JD-A4, JD-A6): 근위 막사는 사냥, 잠수꾼 조합은 건져 오는 일. 가져오는 의뢰의 삯은 사서 채우는 값보다 적다. 글은 처음 값이다
  gate3: { at: 'guard', rank: 'B', name: '물먹은 문지기 3', by: '늙은 근위병', kind: 'hunt', mon: 'soakedgate', n: 3, silver: 1800, xp: 16000, fame: 10, minLevel: 61, daily: true, say: '문도 없는 데를 막고 섰소. 잠수꾼들이 돌아서 다니오.' },
  hound2: { at: 'guard', rank: 'B', name: '비늘 사냥개 2', by: '선창지기', kind: 'hunt', mon: 'scalehound', n: 2, silver: 1900, xp: 17000, fame: 10, minLevel: 61, say: '올라오는 사람 발목을 물어. 둘이서.' },
  jelly2: { at: 'guard', rank: 'A', name: '종소리 해파리 2', by: '물가 사당지기', kind: 'hunt', mon: 'belljelly', n: 2, silver: 2300, xp: 22000, fame: 12, minLevel: 63, say: '두레박에 딸려 올라와요. 독 속에서 울어요.' },
  sguard2: { at: 'guard', rank: 'A', name: '가라앉은 근위병 2', by: '늙은 근위병', kind: 'hunt', mon: 'sunkenguard', n: 2, silver: 2850, xp: 27000, fame: 14, minLevel: 65, say: '뜰까지 나온 이들이오. 쉬게 해 주시오. 우리 손으로는 못 하겠소.' },
  bronze6: { at: 'divers', rank: 'B', name: '옛 청동 덩이 6개', by: '청동 대장장이', kind: 'bring', item: 'oldbronze', n: 6, silver: 620, xp: 12000, fame: 8, minLevel: 61, say: '널 받칠 띠쇠가 모자라.' },
  scalehide5: { at: 'divers', rank: 'B', name: '비늘 가죽 5장', by: '조합장 한별', kind: 'bring', item: 'scalehide', n: 5, silver: 1080, xp: 13600, fame: 8, minLevel: 61, say: '주머니 꿰맬 가죽이 떨어졌어. 숨이 걸린 일이야.' },
  curd4: { at: 'divers', rank: 'B', name: '해파리 묵 4덩이', by: '뱃집 주막 주인', kind: 'bring', item: 'jellycurd', n: 4, silver: 430, xp: 11000, fame: 8, minLevel: 63, say: '찜에 넣을 게 없어. 손님은 느는데.' },
  // 염소치기 움막의 게시판 (GD-A5): 사냥 넷과 가져오는 일 셋. 가져오는 의뢰의 삯은 사서 채우는 값보다 적다. 글은 처음 값이다
  goat3: { at: 'goat', rank: 'B', name: '구름 염소 3', by: '염소치기 어른', kind: 'hunt', mon: 'cloudgoat', n: 3, silver: 3000, xp: 24000, fame: 10, minLevel: 71, daily: true, say: '무리에서 떨어져 나간 놈들이야. 우리 염소를 벼랑으로 몰아.' },
  knot2: { at: 'goat', rank: 'B', name: '바람 매듭 2', by: '다리지기', kind: 'hunt', mon: 'windknot', n: 2, silver: 3100, xp: 26000, fame: 10, minLevel: 71, say: '다리 난간에 감겨서 안 풀려. 밧줄이 쓸려.' },
  monk2: { at: 'goat', rank: 'A', name: '돌 수도승 2', by: '견습 사제 새벽', kind: 'hunt', mon: 'stonemonk', n: 2, silver: 3800, xp: 33000, fame: 12, minLevel: 73, say: '뜰에서 기도하던 분들이… 일어나서 걸어 다녀요.' },
  mask2: { at: 'goat', rank: 'A', name: '금빛 가면 2', by: '문지기 사제 고요', kind: 'hunt', mon: 'goldmask', n: 2, silver: 4700, xp: 40000, fame: 14, minLevel: 75, say: '뜰의 가면들이 순례자를 가려 세우오. 신전이 시킨 일이 아니오.' },
  silver6: { at: 'goat', rank: 'B', name: '구름은 덩이 6개', by: '은 대장장이', kind: 'bring', item: 'cloudsilver', n: 6, silver: 1020, xp: 18000, fame: 8, minLevel: 71, say: '바람 구멍에 댈 살이 모자라.' },
  wool5: { at: 'goat', rank: 'B', name: '염소털 5뭉치', by: '염소치기 어른', kind: 'bring', item: 'goatwool', n: 5, silver: 1780, xp: 20000, fame: 8, minLevel: 71, say: '북 가죽 조일 끈이 떨어졌어.' },
  meat4: { at: 'goat', rank: 'B', name: '구름 염소 고기 4덩이', by: '숙소지기', kind: 'bring', item: 'goatmeat', n: 4, silver: 710, xp: 16500, fame: 8, minLevel: 73, say: '죽에 넣을 고기가 없어. 순례자는 느는데.' },
  // 답하는 마당의 게시판 (BM-A3): 사냥 넷과 가져오는 일 셋. 가져오는 의뢰의 삯은 사서 채우는 값보다 적다. 글은 처음 값이다
  moth3: { at: 'pond', rank: 'A', name: '별가루 나방 3', by: '비단 집 주인', kind: 'hunt', mon: 'starmoth', n: 3, silver: 4900, xp: 36000, fame: 10, minLevel: 81, daily: true, say: '고치를 치는 나방 말고, 사람한테 가루를 터는 놈들이에요.' },
  mirror2: { at: 'pond', rank: 'A', name: '못의 거울상 2', by: '마당지기 다온', kind: 'hunt', mon: 'pondmirror', n: 2, silver: 5100, xp: 39000, fame: 10, minLevel: 81, say: '물가에서 애들을 따라 해. 애들은 그게 저를 봐 주는 건 줄 알아.' },
  shardmon2: { at: 'pond', rank: 'A', name: '떨어진 별 조각 2', by: '별 대장장이', kind: 'hunt', mon: 'starshard', n: 2, silver: 6300, xp: 50000, fame: 12, minLevel: 83, say: '식지도 않은 게 굴러다녀. 벌에 쇠 주우러 못 나가.' },
  echo2: { at: 'pond', rank: 'A', name: '답 없는 메아리 2', by: '못가 사당지기', kind: 'hunt', mon: 'voidecho', n: 2, silver: 7700, xp: 60000, fame: 14, minLevel: 85, say: '그것 곁에 있다 오면 사람들이 며칠 말을 안 합니다. 봤다는 말도요.' },
  starmetal6: { at: 'pond', rank: 'A', name: '별쇠 덩이 6개', by: '별 대장장이', kind: 'bring', item: 'starmetal', n: 6, silver: 1660, xp: 27000, fame: 8, minLevel: 81, say: '밤은 긴데 두드릴 쇠가 없어.' },
  silk5: { at: 'pond', rank: 'A', name: '나방 비단 5필', by: '비단 집 주인', kind: 'bring', item: 'mothsilk', n: 5, silver: 2900, xp: 30000, fame: 8, minLevel: 81, say: '길손들 덧옷 지을 게 떨어졌어요.' },
  dust4: { at: 'pond', rank: 'A', name: '별가루 4줌', by: '못가 주막 주인', kind: 'bring', item: 'stardust', n: 4, silver: 1160, xp: 25000, fame: 8, minLevel: 83, say: '떡 반죽에 넣을 가루가 없어. 밤참 찾는 사람은 많은데.' },
  icespider2: { at: 'hut', rank: 'A', name: '고드름 거미 2마리', by: '종지기 한솔', kind: 'hunt', mon: 'iciclespider', n: 2, silver: 380, xp: 3600, fame: 14, minLevel: 25, say: '처마에 붙은 것들이 눈 쓰는 데 떨어진다.' },
  spider1: { faction: ['miners', 10], rank: 'B', name: '돌거미 1마리', by: '광부 조합', kind: 'hunt', mon: 'spider', n: 1, silver: 90, xp: 320, fame: 9, minLevel: 7, say: '바위인 줄 알고 앉았다가 셋이 다쳤다.' },
};

// ── 서브 퀘스트 ───────────────────────────────────────────
/**
 * appear: { bond: [사람, 단계] } | { fame: n } | { main: 끝낸 장 }  — 모두 채워야 나타난다
 * steps: 차례로. goal이 있으면 채워질 때 저절로 넘어가고, choices가 있으면 골라야 넘어간다.
 * choice: { id, label, need?, check?, free?(출신·칭호가 여는 대답), when?(앞에서 세운 표시), ok/fail(효과), say/failSay, end?(결말 이름) }
 */
/** 서브 "장인들의 연장" (LV-E10, M24-2): 지나온 일곱 고장의 쇠와 고장마다 모을 수. */
export const TOOL_METALS = ['frostiron', 'saltsteel', 'ashiron', 'mossiron', 'oldbronze', 'cloudsilver', 'starmetal'];
export const TOOL_METAL_N = 7;
export const SUBS = {
  rod: {
    id: 'rod', name: '할머니의 낚싯대', giver: 'granny', appear: { bond: ['granny', 1] }, appearSay: '잡화점 할머니와 낯익은 사이가 되면',
    offer: '영감이 쓰던 낚싯대가 있었어. 장마 때 강에 떠내려갔지 뭐야. 낚시터 바닥 어디 걸려 있을 텐데… 늙은이가 뭘 하겠어.',
    more: true,
    steps: [
      { id: 'find', text: '강가 낚시터에서 낚시를 하다 보면 걸려 올라올지도 모른다.', goal: { item: 'oldrod' } },
      { id: 'end', at: 'artguild', text: '건져 올린 낚싯대를 들고 예술협회의 잡화점 할머니에게 간다.', choices: [
        { id: 'return', label: '돌려준다', end: '돌려주었다',
          say: '할머니는 낚싯대를 한참 쓰다듬었다. "이 마디, 영감이 감은 거야." 그러고는 물약 값을 받지 않았다.',
          ok: { take: [['oldrod', 1]], bond: [['granny', 25]], fame: 5, give: [['redpotion', 1]], title: ['regular', '할머니의 낚싯대를 돌려주었습니다'] } },
        { id: 'keep', label: '내가 써도 되겠느냐고 묻는다', check: { kind: 'persuade', npc: 'granny' }, end: '내가 쓰기로 했다',
          say: '"…그래, 벽에 걸려 있는 것보다 물에 드리우는 게 낫지." 할머니는 웃었지만 눈은 낚싯대를 따라왔다.',
          failSay: '"그건 안 돼." 할머니의 목소리가 처음으로 딱딱했다.',
          ok: { take: [['oldrod', 1]], give: [['grannyrod', 1]], bond: [['granny', -5]] }, fail: { bond: [['granny', -3]] } },
        { id: 'mend', label: '고쳐서 돌려준다', need: { items: [['oakbranch', 2]], skill: ['fishing', 4] }, needSay: '참나무 가지 2개, 낚시 초급 5 이상', end: '고쳐서 돌려주었다',
          say: '갈라진 마디를 참나무로 덧대고 줄을 새로 감았다. 할머니는 아무 말도 못 하고 낚싯대를 강 쪽으로 한 번 휘둘러 보았다. "영감은 새벽에 나갔어. 늘 저 버드나무 밑에 섰지."',
          ok: { take: [['oldrod', 1], ['oakbranch', 2]], bond: [['granny', 40]], fame: 8, title: ['regular', '할머니의 낚싯대를 고쳐서 돌려주었습니다'], set: 'mended' } },
      ] },
    ],
  },
  ledger: {
    id: 'ledger', name: '주점의 외상 장부', giver: 'keeper', appear: { bond: ['keeper', 1] }, appearSay: '주점 주인과 낯익은 사이가 되면',
    offer: '대장간 주인이 달아 놓은 술값이 은화 30일세. 내가 가면 싸움이 나니, 자네가 좀 받아다 주게.',
    steps: [
      { id: 'ask', at: 'forge', text: '대장간 주인에게 외상값 은화 30을 받아 온다.', choices: [
        { id: 'persuade', label: '좋게 말한다', check: { kind: 'persuade', npc: 'smith' }, say: '"…알았네. 그 사람도 장사지." 대장간 주인이 은화 30을 세어 주었다.', failSay: '"술값은 내가 알아서 갚네." 말이 통하지 않는다.', ok: { set: 'got' }, fail: {} },
        { id: 'threat', label: '으름장을 놓는다', check: { kind: 'threat', npc: 'smith' }, say: '대장간 주인은 한참 노려보다가 은화 자루를 던졌다.', failSay: '"망치 든 사람한테 그러는 거 아니야." 꿈쩍도 않는다.', ok: { set: 'got', bond: [['smith', -15]], lean: -1 }, fail: { bond: [['smith', -8]] } },
        { id: 'trick', label: '주점이 문을 닫는다고 둘러댄다', check: { kind: 'trick', npc: 'smith' }, say: '"뭐? 그럼 어디서 마시나." 대장간 주인이 허둥지둥 은화를 꺼냈다.', failSay: '"어제도 열었던데." 눈을 가늘게 뜬다.', ok: { set: 'got', bond: [['smith', -5]], lean: -1 }, fail: { bond: [['smith', -5]] } },
        { id: 'errand', label: '쇠를 만지던 시절 얘기를 꺼낸다', free: { origin: 'smithboy', why: '출신: 쇠의 사람' }, say: '"네가 술 받아 오던 놈이었지." 대장간 주인이 껄껄 웃으며 은화를 내주었다.', ok: { set: 'got', bond: [['smith', 5]] } },
        { id: 'pay', label: '내 돈으로 대신 낸다 (은화 30)', need: { silver: 30 }, needSay: '은화 30', say: '말없이 내 주머니에서 은화 30을 꺼내 따로 싸 두었다. 대장간 주인은 모른다.', ok: { silver: -30, set: 'paid', lean: 1 } },
        { id: 'tear', label: '장부의 그 쪽을 찢어 버린다', end: '장부를 찢었다', say: '"없던 일로 하지요." 대장간 주인이 눈을 크게 떴다. 주점 주인이 알면 좋아하지 않을 것이다.', ok: { bond: [['smith', 20], ['keeper', -15]], fame: 2 } },
      ] },
      { id: 'back', at: 'tavern', text: '주점 주인에게 돌아간다.', choices: [
        { id: 'give', label: '받아 온 은화를 건넨다', when: 'got', end: '받아다 주었다', say: '"허, 진짜 받아 왔구먼." 주점 주인이 수고비로 은화 10을 밀어 주었다.', ok: { silver: 10, bond: [['keeper', 20]], fame: 4 } },
        { id: 'pocket', label: '못 받았다고 하고 내가 갖는다', when: 'got', end: '가로챘다', say: '"그럴 줄 알았네." 주점 주인은 한숨을 쉬었다. 주머니가 묵직하다.', ok: { silver: 30, bond: [['keeper', -10]], lean: -2 } },
        { id: 'say', label: '받아 왔다고 하고 건넨다', when: 'paid', end: '대신 내고 말하지 않았다', say: '"허, 진짜 받아 왔구먼." 두 사람은 다음 날부터 다시 인사를 한다.', ok: { bond: [['keeper', 20], ['smith', 5]], fame: 4, lean: 1 } },
        { id: 'truth', label: '내가 냈다고 말한다', when: 'paid', end: '대신 내고 말했다', say: '주점 주인은 한참 말이 없었다. "…자네 같은 사람한테 외상을 줘야 하는 건데." 은화 30을 도로 밀어 준다.', ok: { silver: 30, bond: [['keeper', 25], ['smith', 10]], fame: 6, lean: 1 } },
      ] },
    ],
  },
  trapped: {
    id: 'trapped', name: '폐허 입구의 갇힌 이', giver: 'trapped', appear: { main: 1 }, appearSay: '폐허 입구에 가면',
    offer: '거기… 누구 있소? 다리가 돌에 끼었소. 어젯밤 소리를 따라 들어왔다가… 제발.',
    steps: [
      { id: 'free', at: 'ruins', text: '무너진 돌 밑에 다리가 낀 사람이 있다.', choices: [
        { id: 'lift', label: '돌을 들어 올린다', check: { kind: 'lift', need: 15 }, end: '꺼내 주었다', say: '이를 악물고 돌을 들었다. 사람이 다리를 빼냈다. "이 은혜는… 나루에 오면 꼭 찾으시오."', failSay: '돌이 꿈쩍도 하지 않는다. 손바닥만 벗겨졌다.', ok: { fame: 10, title: ['helper', '폐허 입구에서 갇힌 이를 꺼내 주었습니다'], set: 'saved', lean: 1 }, fail: { hp: -6 } },
        { id: 'lever', label: '참나무 가지로 지렛대를 만든다', need: { items: [['oakbranch', 3]] }, needSay: '참나무 가지 3개', end: '꺼내 주었다', say: '가지 셋을 겹쳐 돌 밑에 넣고 눌렀다. 돌이 한 뼘 들렸다. "이 은혜는… 나루에 오면 꼭 찾으시오."', ok: { take: [['oakbranch', 3]], fame: 10, title: ['helper', '폐허 입구에서 갇힌 이를 꺼내 주었습니다'], set: 'saved', lean: 1 } },
        { id: 'price', label: '값을 부르고 꺼내 준다', need: { items: [['oakbranch', 3]] }, needSay: '참나무 가지 3개', end: '값을 받고 꺼내 주었다', say: '"…은화 40. 가진 게 그것뿐이오." 가지로 돌을 들어 주고 은화를 받았다. 그 사람은 인사 없이 절뚝이며 갔다.', ok: { take: [['oakbranch', 3]], silver: 40, fame: -3, set: 'saved', lean: -2 } },
        { id: 'leave', label: '못 본 척 지나간다', end: '지나쳤다', say: '소리를 등지고 걸었다. 한참 뒤까지 돌 긁는 소리가 들렸다.', ok: { lean: -1 } },
      ] },
    ],
  },
  // 세력 사이의 일 (T29~T31). 고르기 전에 결과가 보이고, 양쪽과 다 단골이어야 열리는 셋째 길이 있다.
  vein: {
    id: 'vein', name: '광맥 다툼의 앞 이야기', giver: 'foreman', appear: { level: 5 }, appearSay: '레벨 5가 되어 광산의 조합장을 만나면',
    offer: '상단에서 사람이 왔네. 새로 터진 맥을 종이 한 장으로 사겠다는군. 저기 갱도 앞에 서 있는 저 양반이야. 자네는 어느 쪽 사람인가.',
    steps: [
      { id: 'side', at: 'mine', text: '갱도 앞에서 조합장과 상단 대리인이 맞서 있다.', choices: [
        { id: 'miners', label: '조합장 편에 선다', end: '조합 편에 섰다', say: '"캔 사람의 것이지요." 조합장이 어깨를 툭 친다. 상단 대리인은 장부를 덮고 돌아섰다. 돌아서며 이쪽 얼굴을 한 번 본다.', ok: { faction: [['miners', 30]], lean: 1, xp: 120 } },
        { id: 'merchants', label: '상단 대리인 편에 선다', end: '상단 편에 섰다', say: '"값을 치른 사람의 것이지요." 대리인이 은화 자루를 건넨다. 광부들이 곡괭이를 내려놓고 이쪽을 본다.', ok: { faction: [['merchants', 30]], lean: -1, silver: 60, xp: 120 } },
        { id: 'both', label: '둘을 한자리에 앉힌다', need: { factions: [['miners', 3], ['merchants', 3]] }, needSay: '광부 조합과 상단 양쪽 모두와 단골 이상', end: '둘을 한자리에 앉혔다', say: '갱도 앞 돌 위에 셋이 앉았다. 캐는 몫과 파는 몫을 돌바닥에 그어 나눴다. 둘 다 웃지는 않았지만 둘 다 일어서지도 않았다.', ok: { faction: [['miners', 15], ['merchants', 15]], fame: 10, xp: 200, flat: true } },
        { id: 'none', label: '끼어들지 않는다', end: '끼어들지 않았다', say: '"저는 지나가는 사람입니다." 둘 다 코웃음을 쳤지만, 둘 다 붙잡지는 않았다.', ok: {} },
      ] },
    ],
  },
  alms: {
    id: 'alms', name: '신전과 뒷골목', giver: 'priest', appear: { bond: ['priest', 1] }, appearSay: '신전지기와 낯익은 사이가 되면',
    offer: '헌금함이 밤마다 조금씩 비네. 누군지는 알아. 뒷골목 아이일세. 잡아서 본을 보여야 한다는 사람도 있고… 자네가 한번 봐 주겠나.',
    steps: [
      { id: 'catch', at: 'temple', text: '밤의 신전에서 헌금함 곁을 지킨다. 아이 하나가 손을 넣다 눈이 마주쳤다.', choices: [
        { id: 'temple', label: '신전지기에게 데려간다', end: '신전에 알렸다', say: '아이는 울지 않았다. 신전지기는 한숨을 쉬고 아이에게 마당 쓰는 일을 시켰다. 다음 날부터 뒷골목 사람들이 길에서 눈을 피한다.', ok: { faction: [['temple', 30]], lean: 1, xp: 100 } },
        { id: 'alley', label: '모른 척 보내 준다', end: '아이를 보내 주었다', say: '고개를 돌렸다. 발소리가 멀어졌다. 다음 날 문 앞에 누가 삶은 감자 둘을 두고 갔다. 신전지기는 아무것도 묻지 않았지만 눈이 오래 머물렀다.', ok: { faction: [['alley', 30]], lean: -1, give: [['riceball', 2]], xp: 100 } },
        { id: 'both', label: '아이를 신전 심부름꾼으로 들이자고 한다', need: { factions: [['temple', 3], ['alley', 3]] }, needSay: '신전과 뒷골목 양쪽 모두와 단골 이상', end: '아이가 신전에서 일하게 되었다', say: '신전지기와 뒷골목 어른을 한자리에 불렀다. 아이는 아침마다 초를 갈고, 저녁에는 남은 떡을 골목으로 가져간다. 헌금함은 더 비지 않았다.', ok: { faction: [['temple', 15], ['alley', 15]], fame: 10, xp: 200, flat: true } },
        { id: 'none', label: '끼어들지 않는다', end: '끼어들지 않았다', say: '"제가 정할 일이 아닙니다." 신전지기는 고개를 끄덕였다. 헌금함은 여전히 조금씩 빈다.', ok: {} },
      ] },
    ],
  },
  // 메인 3장의 갈림. 상단 대리인 앞에서 정한다. 어느 길이든 고르기 전에 결과가 보인다.
  lode: {
    id: 'lode', name: '광맥의 주인', giver: 'agent', appear: { main: 2 }, appearSay: '메인 2장을 끝내고 나루의 상단 지부에 가면',
    offer: '울림쇠 광맥 말씀이군요. 조합은 캔 사람의 것이라 하고, 저희는 값을 치른 사람의 것이라 합니다. 종을 고치시겠다고요. 그러려면 이 다툼이 먼저 끝나야겠지요. 어느 쪽에 서시겠습니까.',
    steps: [
      { id: 'side', at: 'branch', text: '울림쇠 광맥이 누구 손에 남을지 정한다.', choices: [
        { id: 'miners', label: '조합의 것이라고 못 박는다', need: { factions: [['miners', 3]] }, needSay: "광부 조합과 '단골' 이상", end: '조합 편에 섰다', say: '"조합장이 보증하는 사람이군요." 대리인은 장부를 덮었다. "이번에는 물러나지요. 이번에는."', ok: { faction: [['miners', 30]], lean: 1, set: 'miners', main: 'miners' } },
        { id: 'merchants', label: '상단이 사는 것이 옳다고 한다', need: { factions: [['merchants', 3]] }, needSay: "상단과 '단골' 이상", end: '상단 편에 섰다', say: '"현명하십니다." 대리인이 처음으로 웃었다. 계약서에 도장이 찍혔다. 광부들은 이제 품삯을 받고 캔다.', ok: { faction: [['merchants', 30]], lean: -1, silver: 300, set: 'merchants', main: 'merchants' } },
        { id: 'both', label: '조합장을 불러 둘을 한자리에 앉힌다', need: { factions: [['miners', 3], ['merchants', 3]] }, needSay: "광부 조합과 상단 양쪽 모두와 '단골' 이상", end: '둘을 한자리에 앉혔다', say: '사흘을 앉아 있었다. 캐는 몫과 파는 몫, 그리고 종에 쓸 몫을 따로 떼었다. 둘 다 도장을 찍었다.', ok: { faction: [['miners', 20], ['merchants', 20]], fame: 20, flat: true, set: 'both', main: 'both' } },
        { id: 'buy', label: '내가 사겠다고 한다 (은화 3000)', need: { silver: 3000 }, needSay: '은화 3000', end: '광맥을 샀다', say: '은화 자루 셋을 탁자에 올렸다. 대리인도, 뒤늦게 달려온 조합장도 말이 없었다. 광맥은 이제 내 것이다.', ok: { silver: -3000, set: 'buy', main: 'buy' } },
        { id: 'deed', label: '강바닥에서 건진 옛 증서를 내민다', free: { item: 'deed', why: '광맥의 옛 증서' }, end: '옛 임자의 뜻을 전했다', say: '대리인이 증서를 세 번 읽었다. "…캐는 사람 모두에게." 그는 한참 뒤에 말했다. "이건 저희가 살 수 있는 물건이 아니군요." 광맥은 누구의 것도 아니게 되었다. 그래서 모두의 것이 되었다.', ok: { take: [['deed', 1]], faction: [['miners', 15], ['merchants', 5]], fame: 30, flat: true, set: 'hidden', main: 'hidden' } },
      ] },
    ],
  },
  // ── 흰마루의 서브 둘 (WM-D6, WM-D7, LV-E3). 줄거리는 시안의 것이고 대사는 처음 값이다 ──
  icehole: {
    id: 'icehole', name: '얼음 구멍의 임자', giver: 'icefisher', appear: {}, appearSay: '얼음 낚시터의 낚시꾼을 만나면',
    offer: '저 가운데 구멍 보이나. 물길이 모이는 자리야. 우리 집 말뚝이 먼저 박혔는데, 아랫집은 제 할아비가 먼저 뚫었다고 해. 삼 년째 서로 말을 안 해. 자네는 남이니 좀 봐 주게.',
    steps: [
      { id: 'hole', at: 'icehole', text: '좋은 구멍 하나를 두고 두 집이 삼 년째 말을 안 한다. 누구 구멍인지 가려 주거나, 둘이 같이 쓸 만큼 큰 고기를 낚아 보인다.', choices: [
        { id: 'judge', label: '말뚝과 얼음 자국을 살펴 누구 구멍인지 가려 준다', check: { kind: 'persuade', npc: 'icefisher' }, end: '임자를 가려 주었다',
          say: '말뚝 밑의 얼음을 긁어 보았다. 아랫집 말뚝 자국이 한 겹 더 깊다. "…그래, 내가 틀렸나 보네." 낚시꾼은 제 말뚝을 뽑아 옆 구멍으로 옮겼다. 아랫집 사람이 삼 년 만에 고개를 끄덕였다.',
          failSay: '"남이 뭘 알아." 두 집 다 등을 돌렸다.',
          ok: { fame: 8, bond: [['icefisher', 15]], xp: 1500 }, fail: { bond: [['icefisher', -3]] } },
        { id: 'bigfish', label: '둘이 같이 쓸 만큼 큰 고기를 낚아 보인다', need: { items: [['silverfish', 3]] }, needSay: '얼음 밑 은어 3마리', end: '같이 쓰게 했다',
          say: '팔뚝만 한 은어 세 마리를 그 구멍 옆 얼음에 눕혔다. "이 구멍에서 이런 게 나온다고?" 두 집 사람이 한 구멍을 들여다보았다. 그날 저녁, 말뚝 둘이 한 구멍 양쪽에 나란히 박혔다.',
          ok: { take: [['silverfish', 3]], fame: 15, bond: [['icefisher', 30]], xp: 3000, silver: 150 } },
        { id: 'none', label: '끼어들지 않는다', end: '끼어들지 않았다', say: '"남의 집 일입니다." 낚시꾼은 어깨를 으쓱하고 줄을 다시 내렸다.', ok: {} },
      ] },
    ],
  },
  winter: {
    id: 'winter', name: '굶는 겨울', giver: 'oldhunter', appear: {}, appearSay: '사냥꾼 움막의 늙은 사냥꾼을 만나면',
    offer: '눈밭에 나갈 사람이 없어. 서까래에 걸어 둔 고기가 다 떨어졌네. 얼음 멧돼지 고기 열 덩이만 있으면 이 겨울은 넘겨. …부탁하네.',
    steps: [
      { id: 'bring', at: 'hunterhut', text: '눈밭에 나갈 사람이 없어 움막의 고기가 떨어졌다. 얼음 멧돼지 고기 열을 날라 준다.', choices: [
        { id: 'give', label: '고기 열 덩이를 서까래에 걸어 준다', need: { items: [['icemeat', 10]] }, needSay: '얼음 멧돼지 고기 10', end: '고기를 날라 주었다',
          say: '언 고기를 하나씩 서까래에 걸었다. 열 덩이가 걸리자 움막이 조금 좁아 보였다. "삯은 못 줘. 대신 이 겨울에 굶는 집은 없을 거야."',
          ok: { take: [['icemeat', 10]], fame: 15, bond: [['oldhunter', 30]], xp: 3000, lean: 1 } },
        { id: 'sell', label: '값을 받고 넘긴다', need: { items: [['icemeat', 10]] }, needSay: '얼음 멧돼지 고기 10', end: '값을 받고 넘겼다',
          say: '"…그래, 자네도 목숨 걸고 잡은 거지." 늙은 사냥꾼이 움막의 은화를 긁어모아 내놓았다.',
          ok: { take: [['icemeat', 10]], silver: 260, bond: [['oldhunter', 5]], xp: 1500, lean: -1 } },
      ] },
    ],
  },
  // ── 소금벌의 서브 둘 (SB-F6, SB-F7, LV-E4). 줄거리는 시안의 것이고 대사는 처음 값이다 ──
  fakeding: {
    id: 'fakeding', name: '가짜 띠링 감정', giver: 'stallowner', appear: {}, appearSay: '저울 마당의 좌판 임자를 만나면',
    offer: '저기 다섯 사람 보이오? 오늘 아침 다섯이 한꺼번에 띠링을 들었다 하오. 넷은 조각을 쥐고 있었소. 하나는 빈손이었다는데, 누군지 아무도 모르오. 가려낼 수 있겠소? 나는 그 한 사람한테만 외상을 주고 싶소.',
    steps: [
      { id: 'tell', at: 'scaleyard', text: '장터 사람 다섯 가운데 누가 조각 없이 띠링을 들은 사람인지 가려낸다. 감정 숙련도가 쓰인다.', choices: [
        { id: 'eye', label: '다섯 사람의 손을 살펴 가려낸다', need: { skill: ['appraise', 10] }, needSay: '감정 숙련도 중급 2', end: '빈손을 가려냈다',
          say: '다섯 사람의 손을 차례로 보았다. 넷은 손바닥에 조각 모서리 자국이 났다. 하나는 손끝이 갈라지고 굳은살이 박였다. 소금 자루를 삼백 번 묶은 손이다. "저 사람이오." 좌판 임자가 그 사람을 불러 장부에 이름을 적었다.',
          ok: { fame: 15, bond: [['stallowner', 30]], xp: 5000, silver: 300 } },
        { id: 'ask', label: '다섯에게 무엇을 하다 들었는지 묻는다', check: { kind: 'trick', npc: 'stallowner' }, end: '말로 가려냈다',
          say: '넷은 "그냥 쥐고 있었지"라고 했다. 하나는 한참 생각하다 "자루를 묶고 있었는데… 몇 번째였더라"라고 했다. 세고 있던 사람이다. "저 사람이오."',
          failSay: '다섯이 다 그럴듯하게 말했다. 누구도 가려내지 못했다. 좌판 임자가 혀를 찼다.',
          ok: { fame: 8, bond: [['stallowner', 15]], xp: 3000 }, fail: { bond: [['stallowner', -3]] } },
        { id: 'none', label: '가려서 무엇 하느냐고 한다', end: '가리지 않았다', say: '"소리는 다 같았다면서요." 좌판 임자는 대꾸하지 않고 저울을 닦았다.', ok: {} },
      ] },
    ],
  },
  backpay: {
    id: 'backpay', name: '떼인 삯', giver: 'captain', appear: {}, appearSay: '용병 막사의 대장을 만나면',
    offer: '기둥의 금 석 줄 보이나. 석 달 치다. 넷이 못 받았어. 대리인은 삯 대신 조각을 주겠다는데, 칼잡이가 그걸 받으면 칼을 놓아야지. 자네가 말 좀 해 보게. 우리 말은 안 들어.',
    steps: [
      { id: 'pay', at: 'warehouse', text: '막사의 칼잡이 넷이 석 달 치 삯을 못 받았다. 대리인에게 받아 내거나, 내 은화로 대신 치른다.', choices: [
        { id: 'persuade', label: '대리인에게 삯을 치르라고 말한다', check: { kind: 'persuade', npc: 'yugyeom' }, end: '삯을 받아 냈다',
          say: '"조각은 값을 치러야 울린다면서요. 칼도 그렇습니다." 유겸은 한참 장부를 넘기다 은화 자루 넷을 내놓았다. "…셈은 셈이오."',
          failSay: '"삯은 조각으로 치르겠다고 이미 말했소." 유겸은 장부를 덮었다.',
          ok: { fame: 15, bond: [['captain', 30]], xp: 5000 }, fail: { bond: [['yugyeom', -3]] } },
        { id: 'threat', label: '칼잡이들이 떠나면 창고는 누가 지키느냐고 으른다', check: { kind: 'threat', npc: 'yugyeom' }, end: '삯을 받아 냈다',
          say: '"문지기 둘이 졸고 있더군요. 넷이 떠나면 저 자물쇠는 누가 봅니까." 유겸의 눈이 창고 문으로 갔다. 은화 자루 넷이 나왔다.',
          failSay: '"떠나라 하시오. 칼잡이는 삯만 주면 또 오오." 유겸은 웃었다.',
          ok: { fame: 10, bond: [['captain', 25]], xp: 5000, lean: -1 }, fail: { bond: [['yugyeom', -3]] } },
        { id: 'mine', label: '내 은화로 대신 치른다', need: { silver: 1200 }, needSay: '은화 1,200', end: '대신 치렀다',
          say: '은화 천이백을 넷으로 나눠 막사에 보냈다. 대장이 기둥의 금 석 줄을 칼등으로 긁어 지웠다. "자네 돈인 줄 다 알아. 그래도 삯은 삯이지. 받겠네."',
          ok: { silver: -1200, fame: 20, bond: [['captain', 40]], xp: 6000, lean: 1 } },
      ] },
    ],
  },
  // ── 잿골의 서브 (AG-D6, AG-D7, AG-C3, LV-E5). 줄거리는 시안의 것이고 대사는 처음 값이다 ──
  // goal.pumpDays: [날 수, 하루 몫] 풀무 골목에서 하루 몫을 채운 날을 센다. 효과 말 flag: 표시를 세운다. blade: 내 직업의 잿쇠 무기를 그 등급으로 지어 준다
  bellowsarm: {
    id: 'bellowsarm', name: '풀무꾼의 팔', giver: 'darae', appear: {}, appearSay: '풀무 골목의 풀무꾼 다래를 만나면',
    offer: '어깨가 나갔어. 자루가 안 밀려. 사흘만 쉬면 된다는데, 사흘 동안 내 불은 누가 불어. 모루 셋이 내 풀무에 달려 있어. …하루 서른 번이야. 사흘만 대신 밀어 줘.',
    steps: [
      { id: 'pump', text: '다래의 어깨가 나갔다. 사흘 동안 풀무 골목에서 풀무질을 대신 해 준다(하루 서른 번).', goal: { pumpDays: [3, 30] } },
      { id: 'end', at: 'bellowsrow', text: '사흘을 채웠다. 풀무 골목의 다래에게 간다.', choices: [
        { id: 'learn', label: '풀무 요령을 배운다', end: '사흘을 대신 밀고 요령을 배웠다',
          say: '다래가 성한 팔로 내 손을 자루 위에 고쳐 얹었다. "밀 때 숨을 뱉지 마. 당길 때 뱉어. 불이 네 숨을 따라와." 한 번 밀어 보았다. 벽 너머 모루 소리가 반 박자 길어졌다. "그거야. 이십 년 걸려 안 건데, 사흘 민 사람한테 주네."',
          ok: { bond: [['darae', 30]], fame: 15, xp: 8000, flag: 'bellowsKnack' } },
        { id: 'none', label: '요령은 됐다고 하고 자루를 돌려준다', end: '사흘을 대신 밀었다',
          say: '"배울 게 있어서 민 게 아닙니다." 다래는 한참 자루를 쥐고 서 있었다. "…사흘 동안 내 모루에서 나온 검이 넷이야. 그중에 이긴 검이 있으면, 그건 네가 분 불이야. 아무도 안 세겠지만."',
          ok: { bond: [['darae', 45]], fame: 15, xp: 8000, lean: 1 } },
      ] },
    ],
  },
  coldkiln: {
    id: 'coldkiln', name: '식은 가마', giver: 'b_sol', appear: {}, appearSay: '풀무 골목의 풀무꾼 솔을 만나면',
    offer: '골목 끝 작은 가마가 꺼졌어. 우리 숟가락 고치는 가마야. 큰 대장간 불씨는 못 얻어. 이름패가 없으니까. 쇳물 내에 식지 않은 재가 있어. 캐다 보면 나와. 다섯 줌이면 돼. 들고 오는 동안 식으면 그냥 재니까, 퍼 담았으면 곧장 와.',
    steps: [
      { id: 'carry', at: 'bellowsrow', text: '골목 끝의 작은 가마가 꺼졌다. 쇳물 내에서 캐기를 하며 식지 않은 재 다섯 줌을 퍼 담아, 식기 전에 풀무 골목으로 나른다. 가는 동안 식으면 처음부터다.', choices: [
        { id: 'pour', label: '식지 않은 재를 작은 가마에 붓는다', need: { items: [['hotash', 5]] }, needSay: '식지 않은 재 5줌', end: '불씨를 살렸다',
          say: '재 다섯 줌을 가마 바닥에 붓고 풀무를 한 번 밀었다. 붉은 것이 번졌다. 솔이 숟가락 하나를 불에 넣었다 꺼내 두드렸다. 작고 맑은 소리가 났다. 검이 우는 소리는 아니다. 골목 사람들이 문을 열고 내다보았다.',
          ok: { take: [['hotash', 5]], bond: [['b_sol', 30]], fame: 15, xp: 8000, silver: 300 } },
        { id: 'none', label: '내 일이 아니라고 한다', end: '끼어들지 않았다', say: '"그래. 네 가마가 아니지." 솔은 식은 가마 앞에 도로 앉았다.', ok: {} },
      ] },
    ],
  },
  // 겨루기에서 열 번 이기면 큰 대장간의 주인이 먼저 나선다 (AG-C3). 그 전에는 어디에도 없다 (AG-F4)
  ownblade: {
    id: 'ownblade', name: '이긴 자의 무기', giver: 'ashmaster', appear: { duelWins: 10 }, appearSay: '',
    offer: '열 번 이겼다지. 노을한테 들었어. 이름패 하나 깎아 놨다. 이제 네 무기는 내가 지어 주지. 삼십 년 동안 이긴 사람 것만 지었어. 쇠하고 품삯만 가져와.',
    steps: [
      { id: 'forge', at: 'bigforge', text: '큰 대장간의 주인이 내 무기를 지어 주겠다고 나섰다.', choices: [
        { id: 'make', label: '쇠와 품삯을 대고 지어 달라고 한다', need: { items: [['ashiron', 6], ['oakbranch', 1]], silver: 770 }, needSay: '잿쇠 덩이 6개, 참나무 가지 1개, 품삯 은화 770', end: '주인이 지어 주었다',
          say: '주인은 말없이 사흘 치 일을 한나절에 했다. 풀무 골목 쪽 벽이 내내 벌겠다. 건네받은 무기의 자루 밑에 이름패와 같은 글씨로 내 이름이 새겨져 있다. 주인의 이름은 없다.',
          ok: { take: [['ashiron', 6], ['oakbranch', 1]], silver: -770, blade: 2, bond: [['ashmaster', 20]], fame: 10 } },
        { id: 'self', label: '이름패만 받고 내 손으로 짓겠다고 한다', end: '내 손으로 짓기로 했다',
          say: '"…이긴 사람이 그 말을 한 건 처음이야." 주인은 이름패를 빈 모루에 걸었다. "그럼 저 모루는 네 거야. 내가 쳐 준 검으로 이긴 놈들은 제 손으로 뭘 지어 본 적이 없어. 넌 뭐가 나오는지 보자."',
          ok: { bond: [['ashmaster', 40]], fame: 20, xp: 10000 } },
      ] },
    ],
  },
  // ── 안개늪의 서브 둘 (AN-D6, AN-D7, LV-E6). 줄거리는 시안의 것이고 대사는 처음 값이다 ──
  lostlamps: {
    id: 'lostlamps', name: '길 잃은 등불', giver: 'yeoul', appear: {}, appearSay: '등불 다리의 등불지기 여울을 만나면',
    offer: '다리 기둥에 꺼진 자리가 여섯이에요. 다 붙으면 이끼 밭까지는 불빛이 닿아요. 거기선 아무도 길을 안 잃겠죠. 붙이다 말았어요. 세 번이나요. 자리마다 등불 하나가 들어요. 댁이 해 볼래요?',
    steps: [
      { id: 'light', at: 'lampbridge', text: '등불 다리의 꺼진 등불 여섯 자리에 불을 다시 붙인다. 자리마다 등불 하나가 든다. 다 붙이면 이끼 밭에서는 길을 잃지 않는다.', choices: [
        { id: 'light', label: '여섯 자리에 등불을 하나씩 건다', need: { items: [['lamp', 6]] }, needSay: '등불 6개', end: '여섯 자리에 불을 붙였다',
          say: '기둥마다 올라 등불을 걸었다. 여섯째가 붙자 다리 끝에서 이끼 밭까지 불빛이 한 줄로 이어졌다. 여울이 한참 올려다보았다. "다 붙은 걸 처음 봐요. 열두 개가 이렇게 생겼구나."',
          ok: { take: [['lamp', 6]], bond: [['yeoul', 30]], fame: 15, xp: 12000, flag: 'lampsLit' } },
        { id: 'none', label: '내 일이 아니라고 한다', end: '끼어들지 않았다', say: '"그래요. 나도 내 일인데 안 했으니까." 여울은 꺼진 자리를 올려다보다 말았다.', ok: {} },
      ] },
    ],
  },
  herbledger: {
    id: 'herbledger', name: '약초꾼의 제자', giver: 'suryeon', appear: {}, appearSay: '약초꾼 오두막의 수련을 만나면',
    offer: '장부 보이죠. 반쯤 쓴 거. 안개늪 약초가 다섯 가지 빠졌어요. 물이끼, 두꺼비풀, 늪 박하는 이끼 밭에서 캐면 나오고, 등불 버섯하고 안개꽃은 가라앉는 숲을 뒤지면 있어요. 하나씩만 가져와요. 댁이 채워 줘요. 내가 하면 또 하다 말아요.',
    steps: [
      { id: 'show', at: 'herbhut', text: '수련이 반쯤 쓴 약초 장부를 대신 채운다. 안개늪의 약초 다섯 가지(물이끼, 두꺼비풀, 늪 박하, 등불 버섯, 안개꽃)를 캐서 보인다.', choices: [
        { id: 'fill', label: '다섯 가지를 보이고 장부를 채운다', need: { items: [['marshmoss', 1], ['toadgrass', 1], ['mistmint', 1], ['lampshroom', 1], ['fogbloom', 1]] }, needSay: '물이끼, 두꺼비풀, 늪 박하, 등불 버섯, 안개꽃 하나씩', end: '장부를 끝까지 채웠다',
          say: '다섯 가지를 탁자에 놓고 장부의 빈 쪽을 채웠다. 마지막 줄을 쓰고 덮자 수련이 장부를 도로 펴서 끝 쪽을 한참 보았다. "끝이 이렇게 생겼네요." 그러고는 솥을 올렸다. "약탕은 넷째 물을 따를 때 솥을 기울이지 말고 국자로 떠요. 그러면 한 그릇이 더 나와요. 이건 내가 끝까지 해 본 거예요."',
          ok: { take: [['marshmoss', 1], ['toadgrass', 1], ['mistmint', 1], ['lampshroom', 1], ['fogbloom', 1]], bond: [['suryeon', 30]], fame: 15, xp: 12000, flag: 'brewKnack' } },
        { id: 'none', label: '내 일이 아니라고 한다', end: '끼어들지 않았다', say: '"그래요. 장부는 어디 안 가요." 수련은 붓을 씻다 말았다.', ok: {} },
      ] },
    ],
  },
  // ── 잠긴 도성의 서브 둘 (JD-D6, JD-D7, LV-E7). 줄거리는 시안의 것이고 대사는 처음 값이다 ──
  wetledger: {
    id: 'wetledger', name: '젖은 족보', giver: 'pierman', appear: {}, appearSay: '지붕마을 선창의 선창지기를 만나면',
    offer: '우리 성이 뭔지 아는 사람이 여기 없어. 할아버지 때 다 두고 올라왔거든. 족보는 저 아래 집 궤 속에 있어. 잠긴 거리에서 캐다 보면 궤가 나올 거야. 다섯 집 것만 건져다 주게. 삯은 못 줘. 성은 삯으로 사는 게 아니라서.',
    steps: [
      { id: 'bring', at: 'roofgate', text: '잠긴 거리의 집 다섯 채에서 족보를 건져 온다. 캐기로 찾는다.', choices: [
        { id: 'give', label: '젖은 족보 다섯 권을 건넨다', need: { items: [['wetledger', 5]] }, needSay: '젖은 족보 5권', end: '다섯 집의 성을 찾아 주었다',
          say: '선창지기가 족보를 널 위에 펴 말렸다. 사람들이 모여들어 번진 글씨를 손가락으로 짚었다. "여기. 이게 우리야." 누가 제 성을 소리 내어 읽었다. 처음 불러 보는 이름처럼.',
          ok: { take: [['wetledger', 5]], bond: [['pierman', 30]], fame: 18, xp: 18000 } },
        { id: 'none', label: '내 일이 아니라고 한다', end: '끼어들지 않았다', say: '"그렇지. 남의 성이니까." 선창지기는 밧줄을 도로 감았다.', ok: {} },
      ] },
    ],
  },
  lastpatrol: {
    id: 'lastpatrol', name: '근위병의 마지막 순찰', giver: 'parang', appear: {}, appearSay: '근위 막사의 창잡이 파랑을 만나면',
    offer: '청이 하나 있소. 증조부가 밤마다 돌던 길이 있소. 잠긴 거리를 한 바퀴. 나는 한 번도 끝까지 못 돌았소. 숨이 세 번은 들어야 하는 길이라. 밤에, 나를 데리고 내려가 주시오. 댁이 걷는 만큼 나도 걷겠소.',
    steps: [
      { id: 'walk', text: '밤에 파랑과 함께 잠긴 거리로 내려가 순찰 길을 끝까지 돈다. 예순 걸음이다(숨을 세 번 채워야 하는 길이).', goal: { count: ['patrol', 60] } },
      { id: 'back', at: 'guardpost', text: '근위 막사의 파랑에게 돌아간다.', choices: [
        { id: 'done', label: '순찰이 끝났다고 말한다', end: '마지막 순찰을 끝까지 돌았다',
          say: '파랑이 창을 벽에 세웠다. 오래 서 있었다. "증조부는 마지막 밤에 반만 돌았소. 물이 들어와서. 나머지 반을 오늘 돌았소." 그는 창대에 새긴 금 하나를 손톱으로 지웠다. "이제 교대요."',
          ok: { bond: [['parang', 40]], fame: 18, xp: 20000 } },
      ] },
    ],
  },
  // ── 구름다리의 서브 둘 (GD-E6, GD-E7, LV-E8). 줄거리는 시안의 것이고 대사는 처음 값이다 ──
  bridgemenders: {
    id: 'bridgemenders', name: '다리 고치는 이들', giver: 'bridgeman', appear: {}, appearSay: '다릿목 어귀의 다리지기를 만나면',
    offer: '널이 삭았어. 사백 년을 밟았으니. 신전은 문에 금칠할 은은 있어도 널 갈 은은 없대. 구름은 덩이 서른이면 띠쇠를 새로 두르고, 염소털 스물이면 밧줄을 새로 꼬아. 대 주겠나. 삯은 없어. 대신 다리가 자네를 기억할 거야.',
    steps: [
      { id: 'bring', at: 'bridgegate', text: '구름은 덩이 서른과 염소털 스물을 다리지기에게 대 준다.', choices: [
        { id: 'give', label: '구름은 덩이 서른과 염소털 스물을 건넨다', need: { items: [['cloudsilver', 30], ['goatwool', 20]] }, needSay: '구름은 덩이 30개, 염소털 20뭉치', end: '다리의 널을 새로 깔았다',
          say: '다리지기와 짐꾼 여섯이 밤새 널을 갈았다. 아침에 첫 순례자가 건넜다. 널이 울지 않았다. 다리지기가 난간을 두드렸다. "옆바람이 불어도 이제 발이 안 밀려. 벼랑길 쪽 널까지 다 갈았으니까."',
          ok: { take: [['cloudsilver', 30], ['goatwool', 20]], bond: [['bridgeman', 30]], fame: 18, xp: 26000, flag: 'planksFixed' } },
        { id: 'none', label: '내 일이 아니라고 한다', end: '끼어들지 않았다', say: '"그렇지. 건너기만 하는 사람이 더 많아." 다리지기는 삭은 널에 금을 하나 더 그었다.', ok: {} },
      ] },
    ],
  },
  novicedoubt: {
    id: 'novicedoubt', name: '견습 사제의 의심', giver: 'novice', appear: {}, appearSay: '신전 문 앞의 견습 사제 새벽을 만나면',
    offer: '(작게) 저, 부탁이 있어요. 움막 어른이 그러는데 염소는 쉰 번 몰면 길이 든대요. 끝이 있는 일이에요. 저는 끝이 있는 일을 한 번도 안 해 봤어요. 같이 몰아 주실래요? 혼자서는 문 앞을 못 떠나겠어요.',
    steps: [
      { id: 'herd', text: '염소치기 움막에서 새벽과 함께 염소를 친다. 쉰 번이다.', goal: { count: ['herd', 50] } },
      { id: 'back', at: 'templedoor', text: '신전 문 앞의 새벽에게 돌아간다.', choices: [
        { id: 'done', label: '쉰 번을 다 몰았다고 말한다', end: '염소 쉰 번을 끝까지 몰았다',
          say: '새벽이 방석을 개어 문 옆에 놓았다. "쉰 번째 염소를 우리에 넣었을 때요. 울렸어요. 띠링, 하고. 문 안이 아니라 제 귀 바로 옆에서요." 그는 금칠한 문을 한 번 돌아보았다. "저 문은 여섯 해 동안 한 번도 안 그랬는데."',
          ok: { bond: [['novice', 40]], fame: 18, xp: 28000 } },
      ] },
    ],
  },
  // ── 별못의 서브 둘 (BM-E6, BM-E7, LV-E9). 줄거리는 시안의 것이고 대사는 처음 값이다 ──
  relay: {
    id: 'relay', name: '서로 답하는 마을', giver: 'daon', appear: {}, appearSay: '맞울 어귀의 마당지기 다온을 만나면',
    offer: '심부름 하나 해 줄래. 말 한마디야. 별 대장장이한테 가서 전해. "오늘 밤 불 넣는 거, 내가 보러 갈게." 그럼 그 사람이 다음 사람한테 줄 말을 줄 거야. 다섯 사람을 돌아서 나한테 오면 끝이야. 하나만 지켜. 받은 말은 그날 안에 건네. 하루 묵은 말은 말이 아니야. 묵으면 준 사람한테 가서 다시 받아.',
    steps: [
      { id: 'pass', text: '말을 다섯 사람에게 차례로 잇는다: 별 대장장이, 비단 집 주인, 못가 사당지기, 못가 주막 주인, 그물 깁는 달래. 받은 날 안에 다음 사람에게 건넨다. 날을 넘기면 말을 준 사람에게 다시 받는다.', goal: { count: ['relay', 5] } },
      { id: 'back', at: 'echogate', text: '맞울 어귀의 다온에게 돌아간다.', choices: [
        { id: 'done', label: '말이 한 바퀴 돌았다고 전한다', end: '말을 한 바퀴 이었다',
          say: '"달래 할멈이 뭐래?" 전했다. 그물은 내일 아침에 다 기울 거라고, 그때 와서 보라고. 다온이 웃었다. "그 말 하려고 다섯 집을 돈 거야. 누가 누구 일을 보러 갈지, 날마다 이렇게 정해. 종이 있을 땐 필요 없던 일이지. 귀찮아. 그래도 덕분에 하루에 다섯 번은 서로 얼굴을 봐."',
          ok: { bond: [['daon', 40], ['dallae', 10]], fame: 18, xp: 36000 } },
      ] },
    ],
  },
  shardkid: {
    id: 'shardkid', name: '조각을 줍는 아이', giver: 'sol', appear: {}, appearSay: '맞울 어귀의 조각 줍는 솔을 만나면',
    offer: '저, 부탁이 있어요. 벌에 조각이 스무 개쯤 더 있어요. 세어 봤어요. 그런데 주우려고 엎드리면 뒤가 안 보여요. 메아리가 와도 몰라요. 제가 줍는 동안 뒤에 서 있어 줄래요? 용병 아저씨들처럼요. 삯은 못 줘요. 대신 다 주우면 조각을 나눠 줄게요.',
    steps: [
      { id: 'guard', text: '별 떨어진 벌에서 솔이 종 조각을 줍는 동안 곁을 지킨다. 스무 조각이다. 덤비는 것은 내가 막는다.', goal: { count: ['guard', 20] } },
      { id: 'back', at: 'echogate', text: '맞울 어귀의 솔에게 돌아간다.', choices: [
        { id: 'done', label: '스무 조각을 다 주웠다고 말한다', end: '솔이 스무 조각을 줍는 동안 곁을 지켰다',
          say: '솔이 자루를 쏟았다. 스무 조각이 서로 부딪혀 가늘게 떤다. 솔은 일곱 개를 세어 이쪽으로 밀었다. "이건 아저씨 거예요. 제가 엎드려 있는 동안 아저씨가 서 있었으니까요. 저는 조각을 봤고, 아저씨는 저를 봤어요." 그러고는 조금 작게 덧붙였다. "할머니가 그러는데, 일곱이면 작은 종 일곱은 된대요."',
          ok: { give: [['bellshard', 7]], bond: [['sol', 40]], fame: 18, xp: 38000 } },
      ] },
    ],
  },
  // ── 처음 모루의 서브 (LV-E10, M24-2). 화면 시안이 없어 가져오는 서브의 꼴 그대로다. 줄거리와 대사는 처음 값이다 ──
  // 12장을 끝내야 야영지에 닿으므로 그 전에는 어디에도 나오지 않는다. 쇠는 고장마다 일곱 덩이(TOOL_METALS)
  mastertools: {
    id: 'mastertools', name: '장인들의 연장', giver: 'toolkeeper', appear: { main: 12 }, appearSay: '모루 아래 야영지의 연장지기를 만나면',
    offer: '이 궤 보이나. 첫 종을 지은 일곱 장인의 연장이 들었던 궤야. 열어 보면 자루뿐이지. 머리는 사백 년 동안 다 삭았어. 망치는 서릿쇠, 집게는 소금강, 정은 잿쇠, 줄은 이끼쇠, 국자는 옛 청동, 풀무 꼭지는 구름은, 모루 받침은 별쇠였어. 제 고장 쇠로 지어야 제 소리가 나. 고장마다 일곱 덩이씩이야. 모아서 식은 가마터로 가져오게. 자루는 내가 다 깎아 놨어.',
    steps: [
      { id: 'bring', at: 'firstkiln', text: '지나온 일곱 고장의 쇠(서릿쇠, 소금강, 잿쇠, 이끼쇠, 옛 청동, 구름은, 별쇠 덩이)를 일곱 덩이씩 모아 식은 가마터로 가져간다. 일곱 장인의 연장을 다시 짓는다.', choices: [
        { id: 'forge', label: '일곱 고장의 쇠를 가마에 넣고 연장 일곱을 다시 짓는다', need: { items: TOOL_METALS.map((id) => [id, TOOL_METAL_N]) }, needSay: '서릿쇠·소금강·잿쇠·이끼쇠·옛 청동·구름은·별쇠 덩이 7개씩', end: '일곱 장인의 연장을 다시 지었다',
          say: '가마에 불을 넣고 쇠를 고장 차례로 넣었다. 연장지기가 깎아 둔 자루를 하나씩 건넸다. 망치, 집게, 정, 줄, 국자, 풀무 꼭지, 모루 받침. 일곱째를 식히자 가마 바닥에 눌어붙어 있던 것이 녹아 흘러나왔다. 첫 종을 짓고 남은 쇠다. 연장지기가 궤를 닫았다. "연장은 내가 지킬게. 그건 자네 거야. 사백 년을 기다린 쇠니까, 꼭대기에 들고 갈 것에 쓰게."',
          ok: { take: TOOL_METALS.map((id) => [id, TOOL_METAL_N]), give: [['firstiron', 7]], bond: [['toolkeeper', 30]], fame: 20, xp: 48000 } },
        { id: 'none', label: '내 일이 아니라고 한다', end: '끼어들지 않았다', say: '식은 가마를 한 번 들여다보고 돌아섰다. 궤 속의 자루들은 머리 없이 그대로다.', ok: {} },
      ] },
    ],
  },
};
export const SUB_ORDER = ['rod', 'ledger', 'trapped', 'vein', 'alms', 'lode', 'icehole', 'winter', 'fakeding', 'backpay', 'bellowsarm', 'coldkiln', 'ownblade', 'lostlamps', 'herbledger', 'wetledger', 'lastpatrol', 'bridgemenders', 'novicedoubt', 'relay', 'shardkid', 'mastertools'];

/** 돌 들기 같은, 사람이 아닌 것과의 판정: 스탯과 필요한 값. */
export const STAT_CHECKS = { lift: { name: '힘쓰기', stat: 'str', mine: '힘' } };

// ── 히든 퀘스트 ───────────────────────────────────────────
/** 나타나는 꼴 넷(Q4-4): 끈기 · 이어짐 · 때와 곳 · 거절. 찾기 전에는 어디에도 표시가 없다. */
export const HIDDENS = {
  favor: {
    id: 'favor', name: '교관의 부탁', kind: '끈기',
    why: '허수아비 앞을 끝까지 떠나지 않았습니다',
    offer: '"이런 녀석은 처음 본다." 교관이 처음으로 똑바로 본다. "서쪽 숲에 성난 멧돼지가 있다. 내 다리를 이렇게 만든 놈이지. 네가 잡아 와라. 허수아비 말고, 살아 있는 걸 쳐 봐라."',
    steps: [
      { id: 'boar', text: '서쪽 숲에서 성난 멧돼지를 쓰러뜨린다.', goal: { win: ['boar', 1] } },
      { id: 'back', text: '훈련소의 교관에게 돌아가 말을 건다.', goal: { talk: 'instructor' } },
    ],
    done: '"잡았군." 교관이 목검 하나를 내민다. 손잡이에 손자국이 하나뿐이다. "내가 쓰던 거다. 허수아비는 이제 네 것이다."',
    reward: { xp: 300, fame: 6, bond: [['instructor', 30]], title: ['scarecrow', '교관의 부탁을 끝냈습니다'], main: 'hidden' },
  },
  riverbed: {
    id: 'riverbed', name: '강바닥의 낚시꾼', kind: '이어짐',
    why: '고쳐서 돌려준 낚싯대의 주인이 아침마다 서던 자리에, 아침에 섰습니다',
    offer: '찌 옆으로 찌가 하나 더 떠오른다. 줄도, 대도 보이지 않는다. 물속에서 누군가 나란히 낚시를 하고 있다. 버드나무 그림자가 사람 꼴로 흔들린다.',
    steps: [
      { id: 'dawn', text: '아침의 강가에서 낚싯대를 열 번 던진다. 옆의 찌가 사라지지 않게.', goal: { count: ['dawnfish', 10] } },
    ],
    done: '열 번째에 옆의 찌가 쑥 들어갔다. 물 위로 낡은 낚싯대 하나가 떠올라 손에 닿았다. 할머니가 쓰다듬던 그 마디 감은 솜씨다. 물속의 그림자가 고개를 숙이고 흩어졌다.',
    reward: { xp: 200, give: [['mistrod', 1]], bond: [['granny', 20]] },
  },
  // 흰마루의 히든 (LV-E3): 종루 앞에서 밤을 서른 번 새운다. 조건은 화면 어디에도 나오지 않는다. 글은 처음 값이다
  bellnight: {
    id: 'bellnight', name: '삼십 년 만의 한 번', kind: '끈기',
    why: '모두가 일찍 자는 마을에서, 종루 앞의 밤을 끝까지 지켰습니다',
    offer: '또 아침이다. 눈을 쓸러 나온 한솔이 빗자루를 멈춘다. "…너, 밤마다 여기 있었지. 나 말고 이 앞에서 밤을 샌 사람은 삼십 년 만에 네가 처음이야." 그가 얼음을 본다. "저 안에서 뭐가 들리던가. 나는 이제 귀가 어두워서."',
    steps: [
      { id: 'tell', text: '종루 아래의 종지기 한솔에게, 밤새 얼음 속에서 들은 것을 말해 준다.', goal: { talk: 'hansol' } },
    ],
    done: '"한 번이요. 그 많은 밤 동안 딱 한 번, 안에서 무언가 답하려다 말았어요." 한솔은 오래 말이 없었다. "…삼십 년 만의 한 번이군. 그럼 아직 살아 있는 거야." 그가 빗자루를 내밀었다. 손잡이가 손 모양대로 패어 있다.',
    reward: { xp: 4000, fame: 10, bond: [['hansol', 40]] },
  },
  // 소금벌의 히든 (LV-E4): 장터에서 한 번도 값을 깎지 않고 백 번 판다. 조건은 화면 어디에도 나오지 않는다. 글은 처음 값이다
  noprice: {
    id: 'noprice', name: '값을 매기지 않는 사람', kind: '끈기',
    why: '값이 날마다 바뀌는 장터에서, 한 번도 값을 깎지 않고 팔았습니다',
    offer: '좌판 앞에 저울꾼 누리가 서 있다. 분필을 쥔 채다. "당신 좌판을 백 번 보았소. 판의 값이 뛰어도, 떨어져도, 당신 물건에는 처음 붙은 값이 그대로였소. 깎아 내놓는 것도 못 보았소." 그가 분필을 내려다본다. "그건 값이 아니오. 나는 그걸 뭐라고 적어야 할지 모르겠소."',
    steps: [
      { id: 'tell', text: '저울 마당의 저울꾼 누리에게, 내 물건에 붙은 것이 무엇인지 말해 준다.', goal: { talk: 'w_nuri' } },
    ],
    done: '"값은 사는 사람이 매기는 거지요. 내가 붙인 건 값이 아니라, 이걸 지은 날입니다." 누리는 시세판 맨 아래, 아무것도 적지 않던 자리에 줄을 하나 긋고 그 옆을 비워 두었다. "여긴 지우지 않겠소."',
    reward: { xp: 8000, fame: 20, bond: [['w_nuri', 40], ['stallowner', 20]] },
  },
  // 잿골의 히든 (LV-E5): 같은 우두머리에게 열 번 지고 다시 선다. 조건은 화면 어디에도 나오지 않는다. 글은 처음 값이다
  cameback: {
    id: 'cameback', name: '지고도 다시 온 사람', kind: '끈기',
    why: '이긴 것만 세는 골짜기에서, 지고도 다시 그 앞에 섰습니다',
    offer: '가마 아가리 앞에 다시 섰다. 등 뒤에서 누가 숨을 고른다. 풀무꾼 여름이다. 골목에서부터 따라온 모양이다. "세어 봤어. 너, 저 안에서 진 게 한두 번이 아니지. 그러고 또 왔네." 여름이 제 손바닥을 내려다본다. "이 골짜기는 이긴 수만 세. 진 수는 내가 세. 골목으로 와. 보여 줄 게 있어."',
    steps: [
      { id: 'tell', text: '풀무 골목의 풀무꾼 여름에게 간다.', goal: { talk: 'b_yeoreum' } },
    ],
    done: '여름이 제 집 문설주를 가리켰다. 칼금이 빼곡하다. "내가 진 수야. 그 옆에 네 것도 그어 놨어." 여름은 내 줄 끝의 빈자리에 칼끝을 대고 멈췄다. "여기는 비워 둘게. 이기든 지든, 네가 또 가면 그을 거야. 누가 세고 있다는 것만 알고 가."',
    reward: { xp: 12000, fame: 20, bond: [['b_yeoreum', 40]] },
  },
  // 안개늪의 히든 (LV-E6): 종의 이끼를 손으로 천 번 걷는다. 조건은 화면 어디에도 나오지 않는다. 글은 처음 값이다
  mossleaf: {
    id: 'mossleaf', name: '이끼 한 장', kind: '끈기',
    why: '아무도 끝까지 하지 않는 마을에서, 종의 이끼를 끝까지 걷었습니다',
    offer: '방금 걷은 이끼가 여느 것과 다르다. 손바닥만 한 이끼 한 장. 뒤집으니 종의 무늬가 그대로 찍혀 있다. 걷어도 걷어도 다시 돋던 자리에, 이번에는 아무것도 돋지 않는다. 종의 맨살이 처음으로 마른다.',
    steps: [
      { id: 'tell', text: '약초꾼 오두막의 수련에게 이끼 한 장을 보여 준다.', goal: { talk: 'suryeon' } },
    ],
    done: '수련이 이끼를 받아 장부 사이에 끼웠다. "이건 약초가 아니에요. 그런데 적어 둘게요. 누가, 몇 번을 걷었는지." 붓이 멈추지 않고 끝까지 갔다. "…나도 뭐 하나 끝까지 해 볼까 봐요. 소매부터요."',
    reward: { xp: 18000, fame: 20, bond: [['suryeon', 40]] },
  },
  // 잠긴 도성의 히든 (LV-E7): 임금의 하사품 상자를 하나도 열지 않고 10장을 끝낸다. 조건은 화면 어디에도 나오지 않는다. 글은 처음 값이다
  ungifted: {
    id: 'ungifted', name: '받지 않은 사람', kind: '절제',
    why: '거저 주는 상자를 끝까지 열지 않았습니다',
    offer: '물 위로 올라오는데 상자 하나가 따라 떠올랐다. 뚜껑이 저절로 열려 있다. 비었다. 처음부터 비어 있던 것처럼. 바닥에 글씨가 있다. 임금의 것이 아니다. 더 오래된 손이다. "받지 않은 이에게만 보인다."',
    steps: [
      { id: 'tell', text: '잠수꾼 조합의 한별에게 빈 상자를 보여 준다.', goal: { talk: 'hanbyeol' } },
    ],
    done: '한별이 빈 상자를 오래 들여다보았다. "우리가 안 연 건 무서워서야. 넌 달라. 넌 필요가 없었던 거지." 그는 상자를 벽의 제일 높은 못에 걸었다. 열리지 않은 상자들 위에. "이건 팔지 않을게. 누가 물으면 말해 줄 거야. 한 사람은 제 손으로 다 건졌다고."',
    reward: { xp: 26000, fame: 20, bond: [['hanbyeol', 40]] },
  },
  // 구름다리의 히든 (LV-E8): 답이 없는 기도를 삼백 번 올린다. 스스로 듣는 길로 11장을 끝내기 전의 기도만 센다. 조건은 화면 어디에도 나오지 않는다. 글은 처음 값이다
  unheard: {
    id: 'unheard', name: '듣지 못한 기도', kind: '끈기',
    why: '답이 없는 기도를 끝까지 올렸습니다',
    offer: '기도를 올렸다. 답은 없다. 이번에도 없었다. 무릎을 펴고 일어서는데, 옆자리의 노인이 내가 꿇었던 자리를 가리킨다. 돌이 패어 있다. 내 무릎 모양으로.',
    steps: [
      { id: 'tell', text: '신전 문 앞의 견습 사제 새벽에게 팬 자리를 보여 준다.', goal: { talk: 'novice' } },
    ],
    done: '새벽이 팬 자리를 손바닥으로 쓸었다. "답이 없는데도요? 끝까지요?" 그는 오래 말이 없었다. "…그럼 저 문 안에서 사백 년 동안 기다린 건 답이 아니라 이거였나 봐요. 답이 없어도 끝까지 하는 사람." 그는 제 방석을 그 자리 옆에 놓았다.',
    reward: { xp: 34000, fame: 20, bond: [['novice', 40]] },
  },
  // 별못의 히든 (LV-E9): 마을 사람 일곱의 일을 모두(사람마다 셋) 끝까지 지켜보고 답해 준다. 조건은 화면 어디에도 나오지 않는다. 글은 처음 값이다
  // 처음 모루 (LV-E10): 일곱 지역의 숨은 이야기를 모두 푼 사람이 모루 앞에 섰을 때. 조건은 화면에 나오지 않는다. 글은 처음 값이다
  eighth: {
    id: 'eighth', name: '여덟 번째 망치질', kind: '이어짐',
    why: '일곱 곳에서 아무도 시키지 않은 일을 끝까지 했습니다',
    offer: '모루 곁의 망치를 내려다보았다. 자루에 손자국이 일곱 겹으로 패어 있다. 장인 일곱의 것이다. 여덟째 자리가 비어 있다. 손을 대 보았다. 꼭 맞았다. 아래에서 누가 올려다보는 것 같아 돌아보았다. 야영지의 천막 일곱에 불이 켜져 있었다.',
    steps: [
      { id: 'build', text: '모루 앞에서 망치를 들고, 지어지지 않은 종을 끝까지 짓는다.', goal: { win: ['unbuiltbell', 1] } },
    ],
    done: '망치 자루의 여덟째 자리에 내 손자국이 남았다. 얕다. 사백 년 뒤에는 깊어져 있을 것이다. 누가 그 위에 손을 대 볼 것이다.',
    reward: { xp: 60000, fame: 30 },
  },
  myding: {
    id: 'myding', name: '내가 울린 띠링', kind: '끈기',
    why: '마당의 일을 하나도 빼지 않고 끝까지 지켜보았습니다',
    offer: '"봤어"라고 말하고 나자 마당이 조용해졌다. 일곱 사람이 모두 손을 놓고 있다. 할 일이 없어서가 아니다. 다 했고, 다 보였기 때문이다. 그때 소리가 났다. 띠링. 종은 없다. 내 귓속도 아니다. 일곱 사람이 한꺼번에 이쪽을 돌아보았다. 그들도 들은 것이다.',
    steps: [
      { id: 'tell', text: '맞울 어귀의 마당지기 다온에게, 마당에서 난 소리를 말해 준다.', goal: { talk: 'daon' } },
    ],
    done: '다온은 웃지도 않고 한참 서 있었다. "삼대 동안 그 소리를 낸 사람이 없었어. 우린 말만 했지. 넌 끝까지 봤고, 그래서 네 말이 울린 거야. 종이 한 게 아니야. 네가 울린 거야." 그는 못가의 빈 틀을 돌아보았다. "저건 이제 안 치워도 되겠다. 빈 게 아니니까."',
    reward: { xp: 44000, fame: 20, bond: [['daon', 40]] },
  },
};
export const HIDDEN_ORDER = ['favor', 'riverbed', 'bellnight', 'noprice', 'cameback', 'mossleaf', 'ungifted', 'unheard', 'myding', 'eighth'];
/** 종의 이끼 (AN-D): 걷어 내는 길에 드는 수와, 히든 "이끼 한 장"이 나타나는 수(화면에 내보내지 않는다). */
export const MOSS = { peel: 500, hidden: 1000, dungeon: 'sunkenpath', room: 'p5-bell', mon: 'mossbellman' };
export const MOSS_LINES = {
  peel: ['이끼를 한 줌 걷었다.', '이끼를 걷었다. 손톱 밑이 푸르다.', '이끼를 걷었다. 밑에서 또 이끼가 나온다.', '이끼를 걷었다. 종의 무늬가 손끝에 닿았다 사라진다.'],
  half: '종의 절반이 드러났다. 먼저 걷은 자리에는 벌써 엷게 이끼가 돈다. 그래도 걷은 만큼은 드러나 있다.',
  fight: '이끼를 걷던 손을 멈추고 무기를 들었다.',
};
/** 히든 "지고도 다시 온 사람"이 나타나는, 같은 우두머리에게 진 수. 화면에 내보내지 않는다. */
export const BOSS_LOSSES = 10;
/** 히든 "값을 매기지 않는 사람"이 나타나는, 깎지 않고 판 수. 화면에 내보내지 않는다. */
export const FAIR_SALES = 100;
/** 히든 "삼십 년 만의 한 번"이 나타나는 밤의 수. 화면에 내보내지 않는다. */
export const BELL_NIGHTS = 30;

// ── 메인 퀘스트 ───────────────────────────────────────────
/** 길은 미리 다 보인다(숨은 길만 빼고). 하나만 끝내면 장이 끝난다 (Q2). */
export const MAIN = {
  1: {
    name: '이름 없는 자',
    text: '시작 마을의 뜨내기다. 무엇으로든 한 사람 몫을 하면 이름으로 불리게 된다. 밤마다 폐허에서 소리가 난다는 이야기가 들린다.',
    paths: [
      { id: 'fight', name: '싸우는 길', text: '레벨 5가 되어 직업을 얻는다', called: '싸움꾼' },
      { id: 'craft', name: '만드는 길', text: '희귀 등급 이상을 만들어 마을 사람에게 판다', called: '손 좋은 이' },
      { id: 'sculpt', name: '깎는 길', text: '걸작을 광장에 세운다', called: '깎는 이' },
      { id: 'friend', name: '사귀는 길', text: '마을 사람 셋과 단골이 된다', called: '이웃' },
      { id: 'work', name: '벌이의 길', text: '의뢰 열 개를 끝낸다', called: '일꾼' },
    ],
    hidden: { id: 'hidden', name: '한길', text: '허수아비만 치다 교관의 부탁을 끝냈다', called: '허수아비 치던 이' },
    done: '누군가 이름을 불렀다. 돌아보니 마을 사람이다. 뜨내기가 아니라 이름으로. 그날 밤, 폐허 쪽에서 나는 소리가 처음으로 또렷하게 들렸다.',
    opens: ['ruins'], xp: 250,
  },
  2: {
    name: '폐허의 소리',
    text: '폐허는 옛 장인들의 공방이었다. 지하 2층의 큰 문 앞에 문지기가 서 있다. 그 아래에서 소리가 난다.',
    paths: [
      { id: 'beat', name: '쓰러뜨리는 길', text: '문지기를 쓰러뜨린다', called: '문을 부순 이' },
      { id: 'tell', name: '알리는 길', text: '주인의 죽음을 말로 알린다', called: '소식을 전한 이' },
      { id: 'mend', name: '고치는 길', text: '부서진 곳을 고쳐 준다', called: '쇠를 아는 이' },
      { id: 'sneak', name: '숨는 길', text: '밤에 몰래 지나간다', called: '그림자 밟는 이' },
    ],
    hidden: { id: 'hidden', name: '같이 지킨 길', text: '문지기 곁에서 사흘 밤을 같이 지켰다', called: '문지기의 벗' },
    opens: ['dock'], xp: 600, done: '금이 간 종 앞에 섰다. 종은 아무도 치지 않는데 운다. 누가 무언가를 끝까지 해낼 때마다, 여기서. 그 소리가 땅 위에서는 "띠링" 하고 들렸던 것이다. 금은 허리를 반쯤 돌았다.',
  },
  3: {
    name: '광맥의 주인',
    text: '금이 간 종을 고치려면 울림쇠가 있어야 한다. 울림쇠 광맥을 두고 광부 조합과 상단이 다툰다. 상단 쪽 사람은 나루의 지부에 있다.',
    paths: [
      { id: 'miners', name: '조합의 길', text: '광부 조합과 단골이 되어 조합 편에 선다', called: '캐는 이들의 벗' },
      { id: 'merchants', name: '상단의 길', text: '상단과 단골이 되어 상단 편에 선다', called: '값을 아는 이' },
      { id: 'both', name: '한자리의 길', text: '양쪽 모두와 단골이 되어 둘을 한자리에 앉힌다', called: '자리를 놓은 이' },
      { id: 'buy', name: '사들이는 길', text: '은화 삼천으로 내가 광맥을 산다', called: '광맥의 임자' },
    ],
    hidden: { id: 'hidden', name: '옛 임자의 길', text: '강바닥에서 광맥의 옛 증서를 건져 내보였다', called: '증서를 건진 이' },
    done: '광맥의 일이 매듭지어졌다. 누구 손에 남았든, 울림쇠는 이제 캐낼 수 있다. 종을 지은 곳은 고개 너머 소리재라고 한다.',
    opens: ['bigmarket'], xp: 1200,
  },
  4: {
    name: '흐려지는 띠링',
    text: '종의 금이 벌어진다. 세계 곳곳에서 띠링이 늦게 울리거나 흐리게 울린다. 띠링이 무엇인지, 종이 왜 폐허 밑에 숨었는지를 알아야 한다. 서두르지 않아도 된다. 더 나빠지지는 않는다.',
    paths: [
      { id: 'archive', name: '기록의 길', text: '소리재 서고에서 종지기들의 기록을 찾아 맞춘다', called: '기록을 맞춘 이' },
      { id: 'heir', name: '핏줄의 길', text: '마지막 종지기의 후손과 단골이 되어 이야기를 듣는다', called: '이야기를 들은 이' },
      { id: 'keeper', name: '문지기의 길', text: '살아 있는 문지기에게 돌아가 묻는다', called: '문지기에게 물은 이' },
      { id: 'bell', name: '종의 길', text: '종 앞에 서서 직접 묻는다', called: '종에게 물은 이' },
    ],
    hidden: { id: 'hidden', name: '종이 먼저 말을 건 길', text: '히든 스탯 다섯을 지닌 채 종 앞에 섰다', called: '종이 알아본 이' },
    done: '알았다. 옛날, 재주 있는 사람들이 알아주는 이 없이 죽어 갔다. 종지기들은 울림쇠로 종을 짓고 약속했다. "누구든 무언가를 끝까지 해내면, 이 종이 대신 답하겠다." 띠링은 그 답이다. 히든이 숨어 있는 것은, 알아주기를 바라고 한 일에는 종이 답하지 않기 때문이다. 종은 천 년을 답하다 금이 갔다. 이제 곧 멈춘다.',
    opens: [], xp: 2000,
  },
  5: {
    name: '마지막 울림',
    text: '종은 곧 멈춘다. 폐허 맨 아래층, 종 앞에 서면 고를 수 있다. 지금까지 무엇으로 살아왔는지가 고를 수 있는 끝을 정한다. 서두르지 않아도 된다.',
    paths: [
      { id: 'mend', name: '잇는다', text: '울림쇠로 새 종을 짓는다. 대장 달인이거나 대장장이여야 하고, 울림쇠 광맥에 닿아야 한다', called: '종을 이은 이' },
      { id: 'free', name: '푼다', text: '종을 녹여 모두에게 나눈다. 누구나 고를 수 있다', called: '종을 푼 이' },
      { id: 'keep', name: '맡는다', text: '내가 종지기가 된다. 히든 직업이 있거나 히든 스탯을 다섯 지녀야 하고, 문지기가 살아 있어야 한다', called: '종지기' },
    ],
    hidden: { id: 'hidden', name: '서로 답한다', text: '종이 멈추는 날, 사람들이 직접 말했다', called: '모두가 본 이' },
    done: '그리고 다음 날이 왔다. 세계는 이어진다.', opens: [], xp: 0,
  },
  // ── 2부 일곱 메아리. 6장 얼린 종 (LV-D6, WM-D). 글은 시안의 것이고, 길마다 부르는 이름은 처음 값이다 ──
  // 길마다 끝 글(done)이 다르다. roads: 길만 먼저 열리는 곳(소금벌은 M16에서 낸다)
  6: {
    name: '얼린 종',
    text: '언못의 종은 삼십 년째 얼음 속에 있다. 종지기가 얼렸다. 종이 답할 때마다 닳는다는 것을 알고, 닳지 않게 재운 것이다. 그 뒤로 이 마을에서는 누구도 띠링을 듣지 못했고, 누구도 끝까지 하지 않는다.',
    paths: [
      { id: 'beat', name: '쓰러뜨리는 길', text: '얼음 종루 맨 위의 파수꾼을 쓰러뜨린다', called: '얼음을 깬 이',
        done: '얼음이 금 가는 소리가 종루를 타고 내려갔다. 종이 한 번 울었다. 삼십 년 만이었다. 아래에서 누가 울기 시작했다.' },
      { id: 'fish', name: '끝까지 하는 길', text: '얼음 구멍 낚시를 달인까지 올린다. 종이 스스로 깬다', called: '종을 깨운 낚시꾼',
        done: '띠링. 얼음 구멍 위에서 울린 소리가 종루까지 갔다가 돌아왔다. 종이 답한 것이다. 얼음 속에서, 깨우지도 않았는데.' },
      { id: 'talk', name: '말하는 길', text: "종지기와 '가족 같은' 사이가 되어 설득한다", called: '종지기의 벗',
        done: '한솔이 빗자루를 세워 놓았다. "네 말이 맞아. 안 쓰면 닳지는 않지. 그런데 그건 종이 아니야." 그가 얼음에 손을 댔다.' },
    ],
    done: '', opens: [], roads: ['saltflat'], roadSay: '소금벌로 내려가는 길이 열렸습니다.', xp: 5000,
  },
  // ── 7장 팔린 종 (LV-D7, SB-F). 글은 시안의 것이고, 길마다 부르는 이름은 처음 값이다. roads: 잿골은 M17에서 낸다 ──
  7: {
    name: '팔린 종',
    text: '저울목의 종은 쪼개졌다. 상단이 조각을 하나씩 판다. 조각을 쥔 사람은 무엇을 하든 띠링을 듣는다. 값만 치르면. 장터에서는 누가 정말 해낸 사람인지 아무도 가리지 못한다.',
    paths: [
      { id: 'raid', name: '터는 길', text: '종 조각 창고의 징수인을 쓰러뜨리고 조각을 거둔다', called: '창고를 턴 이',
        done: '조각들이 자루 안에서 서로를 찾아 붙었다. 금이 간 채로, 그래도 종이었다. 장터의 띠링이 한꺼번에 멎었다. 사람들이 빈 손을 내려다보았다.' },
      { id: 'buy', name: '사 모으는 길', text: '조각 일곱을 제값(하나에 은화 4,000)에 사서 다시 잇는다', called: '일곱 조각을 산 이',
        done: '일곱째 조각의 값을 치르자 유겸이 처음으로 웃지 않았다. "다 사 가는 사람은 처음이오. 이제 뭘 팔라는 거요." 조각들이 손안에서 맞물렸다.' },
      { id: 'turn', name: '돌려세우는 길', text: "떠도는 저울꾼 다섯과 '단골' 사이가 되어 상단을 떠나게 한다", called: '저울을 내려놓게 한 이',
        done: '저울꾼 다섯이 저울을 창고 앞에 내려놓았다. "달 것이 없더이다. 해낸 것에는 눈금이 없소." 문지기가 자물쇠를 풀었다.' },
    ],
    done: '', opens: [], roads: ['ashroad'], roadSay: '잿골로 가는 길이 열렸습니다.', xp: 9000,
  },
  // ── 8장 벼린 종 (LV-D8, AG-D). 글은 시안의 것이고, 길마다 부르는 이름은 처음 값이다. roads: 안개늪은 M18에서 낸다 ──
  8: {
    name: '벼린 종',
    text: '가마골 사람들은 종을 녹여 검을 지었다. 검은 마당의 높은 대에 걸려 있고, 누가 이길 때만 운다. 진 사람은 풀무 골목으로 내려가 평생 남의 불을 분다. 끝까지 한 것은 셈에 들지 않는다. 이긴 것만 든다.',
    paths: [
      { id: 'beat', name: '꺾는 길', text: '식지 않는 가마의 망치를 쓰러뜨린다', called: '망치를 꺾은 이',
        done: '망치가 부러지자 가마의 불이 처음으로 낮아졌다. 마당의 검이 대에서 떨어져 땅에 꽂혔다. 한 번 울고, 금이 갔다. 금 사이로 종의 빛이 보였다.' },
      { id: 'forge', name: '지어 보이는 길', text: '영웅 등급 이상의 잿쇠 무기를 지어 대에 건다', called: '대에 검을 건 이',
        done: '내가 지은 것을 대에 걸자 옛 검이 먼저 울었다. 이긴 사람이 없는데. 대장간 주인이 망치를 내려놓았다. "저건 누굴 이긴 게 아닌데. 끝까지 두드린 거지."' },
      { id: 'quench', name: '불을 끄는 길', text: "풀무 골목 다섯 사람과 '단골' 사이가 되고 풀무질을 삼백 번 한다", called: '불을 끈 이',
        done: '풀무 골목의 풀무가 한꺼번에 멎었다. 열두 모루의 불이 식었다. 마당이 조용해지자 다래가 풀무 자루를 한 번 더 밀었다. 그러자 검이 울었다. 이십 년 만에, 그 사람을 위해서.' },
    ],
    done: '', opens: [], roads: ['marshroad'], roadSay: '안개늪으로 내려가는 길이 열렸습니다.', xp: 14000,
  },
  // ── 9장 잊힌 종 (LV-D9, AN-D). 글은 시안의 것이고, 길마다 부르는 이름은 처음 값이다. roads: 잠긴 도성은 M19에서 낸다 ──
  9: {
    name: '잊힌 종',
    text: '뜬마을의 종은 아무도 숨기지 않았다. 아무도 팔지 않았고 아무도 녹이지 않았다. 그냥 울 일이 없었다. 이 마을에서는 무엇이든 하다가 만다. 종은 늪 속 오솔길 끝에서 이끼에 덮였고, 마지막 종지기는 종 곁을 떠나지 않다가 종과 한 몸이 되었다.',
    paths: [
      { id: 'rest', name: '쉬게 하는 길', text: '오솔길 끝의 종지기를 쓰러뜨려 쉬게 한다', called: '종지기를 쉬게 한 이',
        done: '이끼가 흘러내리자 그 아래 사람의 얼굴이 있었다. 눈을 뜨고 있었다. "누가… 왔나." 그리고 종에 기댄 채 눈을 감았다. 종이 아주 낮게 한 번 울었다. 고맙다는 소리 같았다.' },
      { id: 'peel', name: '걷어 내는 길', text: '종의 이끼를 손으로 오백 번 걷는다', called: '이끼를 걷은 이',
        done: '오백 번째 이끼를 걷자 종의 맨살이 드러났다. 띠링. 종이 답했다. 이 마을에서 처음으로, 끝까지 한 사람에게.' },
      { id: 'teach', name: '가르치는 길', text: '견습 하나의 손을 끝(5단계)까지 키운다', called: '끝을 가르친 이',
        done: '보리가 마지막 망치질을 하고 고개를 들었다. "다 됐어요. …이게 다 된 거예요?" 그때 늪 어딘가에서 종이 울었다. 뜬마을 사람들이 모두 문을 열고 나왔다.' },
    ],
    done: '', opens: [], roads: ['sunkenroad'], roadSay: '잠긴 도성으로 가는 물길이 열렸습니다.', xp: 20000,
  },
  // ── 10장 늘 울리던 종 (LV-D10, JD-D). 글은 시안의 것이고, 길마다 부르는 이름은 처음 값이다. roads: 구름다리는 M20에서 낸다 ──
  10: {
    name: '늘 울리던 종',
    text: '이 도성의 임금은 백성을 아꼈다. 그래서 종에게 시켰다. 누구에게나, 날마다, 무엇을 하든 울라고. 아침에 눈만 떠도 띠링이 왔다. 석 달 만에 종이 터졌고, 터진 자리로 물이 들어왔다. 물 아래에서는 아직도 그 메아리가 운다. 아무에게나, 끝없이.',
    paths: [
      { id: 'quiet', name: '잠재우는 길', text: '잠긴 궁 맨 안쪽의 메아리를 쓰러뜨린다', called: '메아리를 잠재운 이',
        done: '메아리가 흩어지자 물속이 처음으로 조용해졌다. 너무 조용해서 내 숨소리가 들렸다. 위에서 누가 종루의 빈 고리를 한 번 쳤다. 띵. 그것으로 충분했다.' },
      { id: 'rebuild', name: '다시 짓는 길', text: '옛 청동 덩이 이백과 근위병의 창(승급작)을 종루에 바친다', called: '작은 종을 지은 이',
        done: '이백 번째 청동을 올리자 대장장이가 쇳물을 부었다. 작은 종이었다. 옛것의 반의반도 안 됐다. "이건 아무에게나 안 울어." 그가 말했다. "그래야 종이지."' },
      { id: 'relieve', name: '풀어 주는 길', text: '가라앉은 근위병 다섯에게 교대를 알린다(설득 판정)', called: '교대를 알린 이',
        done: '다섯째 근위병이 검을 내렸다. 갑옷 안의 물이 빠져나갔다. "교대… 왔는가. 오래… 걸렸군." 물 아래의 띠링이 하나씩 꺼졌다. 지킬 것이 없어지자 메아리도 갈 데가 없었다.' },
    ],
    done: '', opens: [], roads: ['cloudroad'], roadSay: '구름다리로 오르는 길이 열렸습니다.', xp: 28000,
  },
  // ── 11장 모신 종 (LV-D11, GD-E). 글은 시안의 것이고, 길마다 부르는 이름은 처음 값이다. roads: 별못은 M21에서 낸다. 끝내면 일행이 셋이 된다 (GD-H6) ──
  // unknown: 그 표(flags)가 서기 전에는 퀘스트 창에 "???"로 보이는 길 (GD-G5)
  11: {
    name: '모신 종',
    text: '구름다리의 사제들은 종을 신이라 부른다. 금칠한 문 안에 모셔 두고, 닦은 귀에만 들린다고 가르친다. 문밖의 사람들은 평생 기도하며 들리기를 기다린다. 아랫마을 미루의 신전이 여기서 갈라져 나왔다.',
    paths: [
      { id: 'beat', name: '쓰러뜨리는 길', text: '하늘 신전 맨 안쪽의 대사제를 쓰러뜨린다', called: '가면을 벗긴 이',
        done: '대사제의 가면이 떨어졌다. 그 뒤에 지친 얼굴이 있었다. "나도… 못 들었네. 사십 년을." 문이 저절로 열렸다. 종소리가 다리 끝까지 흘러 나갔고, 무릎 꿇은 사람들이 고개를 들었다.' },
      { id: 'hear', name: '스스로 듣는 길', text: '기도 숙련도를 달인까지 올린다. 문밖에서 종이 답한다', called: '문밖에서 들은 이',
        done: '띠링. 문밖에서, 문지기의 눈앞에서 울렸다. 고요가 입을 벌렸다. "문이 닫혀 있는데." 닫힌 문은 아무것도 막지 못하고 있었다. 처음부터.' },
      { id: 'open', name: '함께 여는 길', text: "미루를 동료로 데려와, '가족 같은' 사이로 문 앞에 선다", called: '문을 열어 둔 이', unknown: 'hadMiru',
        done: '미루가 문에 손을 댔다. "신의 목소리가 아니었어요. 그래도 저는 여기 있을래요. 듣고 싶은 사람이 들을 수 있게, 문을 열어 두는 사람으로." 문이 열렸다.' },
    ],
    done: '', opens: [], roads: ['pondroad'], roadSay: '별못으로 내려가는 길이 열렸습니다. 이제 동료를 셋까지 둡니다.', xp: 38000,
  },
  // ── 12장 깨진 종 (LV-D12, BM-E). 글은 시안의 것이고, 길마다 부르는 이름은 처음 값이다. roads: 처음 모루는 M22에서 낸다 ──
  12: {
    name: '깨진 종',
    text: '별이 떨어져 종을 깼다. 누구 탓도 아니었다. 맞울 사람들은 종을 다시 짓지 않았다. 대신 서로를 보기로 했다. 누가 끝까지 하면 곁의 사람이 말한다. "봤어." 그것으로 삼대를 살았다. 조각은 아직 구덩이 바닥에서 혼자 운다.',
    paths: [
      { id: 'gather', name: '거두는 길', text: '별 떨어진 자리 바닥의 마지막 조각을 쓰러뜨려 거둔다', called: '조각을 거둔 이',
        done: '조각은 싸우는 내내 울었다. 쓰러지자 울음이 멎었고, 손바닥만 한 쇳조각이 남았다. 들고 올라오자 다온이 한참 보았다. "혼자 울고 있었구나. 삼대를." 그는 그것을 못가의 빈 틀에 올려놓았다.' },
      { id: 'share', name: '나누는 길', text: '종 조각 일곱으로 작은 종 일곱을 지어 집집에 건다(세공)', called: '작은 종을 나눈 이',
        done: '일곱째 종을 처마에 걸자 집집의 작은 종이 한꺼번에 흔들렸다. 소리는 작았다. 옆집까지만 들렸다. "딱 좋네." 달래가 말했다. "옆집에서 들으면 됐지."' },
      { id: 'leave', name: '그대로 두는 길', text: '마을 사람 일곱의 일을 한 번씩 끝까지 보고 답해 준다', called: '봤다고 답한 이',
        done: '일곱 사람에게 답하고 나자, 마당의 모든 사람이 일손을 멈추고 이쪽을 보았다. 다온이 말했다. "봤어. 네가 한 거. 일곱 번 다." 구덩이 아래의 조각이 그날 처음으로 울음을 그쳤다.' },
    ],
    done: '', opens: [], roads: ['anvilroad'], roadSay: '처음 모루로 가는 길이 열렸습니다.', xp: 50000,
  },
};
/** 12장의 길을 여는 표. */
export const ANVIL_ROAD = 'anvilroad';
// ── 3부 처음 모루. 13장 두 번째 약속 (LV-D13, CM-D). 글은 시안의 것이다. 푸는 길 대신 할 일 셋(steps)이 보이고, 끝(paths)은 종을 다 지은 뒤에 고른다 ──
MAIN[13] = {
  name: MAIN13.name, text: MAIN13.text, steps: MAIN13.steps,
  paths: ANVIL_END_ORDER.map((id) => ({ id, name: ANVIL_ENDS[id].name, text: ANVIL_ENDS[id].text, called: ANVIL_ENDS[id].called })),
  hidden: { id: 'eight', name: ANVIL_ENDS.eight.name, text: '마지막 망치질 앞에서 일곱 사람이 올라왔다', called: ANVIL_ENDS.eight.called },
  done: '그리고 다음 날이 왔다. 산은 그대로 있고, 세계는 이어진다.', opens: [], xp: 64000,
};
/**
 * 12장의 숫자 (BM-E). bells: 집집에 걸 작은 종. people: 답해 줄 사람의 수. hangAt: 종을 거는 자리.
 * relay: 서브 "서로 답하는 마을"의 말이 도는 차례(다온 → 다섯 사람 → 다온). guard: 서브 "조각을 줍는 아이"의 조각 수와 그 자리, 한 번에 덤빌 확률.
 */
export const SHARDS = { dungeon: 'starpit', mon: 'lastshard', bells: 7, bell: 'smallbell', shard: 'bellshard', people: 7, hangAt: 'echogate', relayQuest: 'relay', relayFrom: 'daon', relay: ['starsmith', 'silkhost', 'pondpriest', 'pondhost', 'dallae'], guardQuest: 'shardkid', guard: 20, guardAt: 'starfield', guardRisk: 0.3 };
export const SHARD_LINES = {
  hang: ['작은 종 하나를 처마 끝에 걸었다. 바람이 건드리자 한 번 울었다. 옆집 문이 열렸다.', '사다리를 옮겨 다음 집 처마에 종을 걸었다. 안에서 누가 고개를 내밀고 끄덕였다.', '종을 걸고 내려오자 그 집 아이가 줄을 한 번 당겨 보았다. 작게 울었다.', '처마에 종을 걸었다. 못 건너편에서 먼저 건 종이 따라 울었다.'],
  // 서브 "서로 답하는 마을": 건네받은 사람이 다음 사람에게 줄 말을 준다
  relay: {
    starsmith: '"다온이 보러 온다고? 그럼 오늘은 별쇠 검이다." 대장장이가 숯을 고른다. "비단 집에 전해. 모루 덮을 천이 삭았다고. 한 필만 보내 달라고."',
    silkhost: '"한 필이요? 두 필 보낼게요. 불똥에 금방 타니까." 주인이 솥을 젓다 말고 말했다. "사당에 전해 줘요. 고치 삶을 물이 모자라요. 틀 아래 물을 한 동이만 쓰겠다고요."',
    pondpriest: '"쓰십시오. 못물은 누구 것도 아닙니다." 사당지기가 두레박을 내밀었다. "주막에 전해 주십시오. 오늘 밤 기도는 제가 끝까지 올릴 테니, 누가 와서 좀 봐 달라고요."',
    pondhost: '"내가 가지. 떡 한 판 싸 들고." 주막 주인이 창밖을 본다. "마당의 달래 할멈한테 전해. 주막 그물 다 떨어졌다고. 깁던 거 언제 되느냐고."',
    dallae: '"그물? 내일 아침이면 다 기워." 달래가 바늘을 멈추지 않고 말했다. "다온한테 전해. 내일 아침에 와서 보라고. 마지막 코는 누가 봐야 해."',
  },
  relayLate: '말을 꺼내다 멈췄다. 하루를 묵힌 말이다. 여기서는 그런 말을 받지 않는다. 준 사람에게 가서 오늘 말로 다시 받아야 한다.',
  relayAgain: '"묵혔구나. 괜찮아, 다시 줄게. 오늘 안에 건네."',
  guard: ['솔이 엎드려 누운 풀을 헤친다. 등 뒤에 서서 벌을 둘러보았다.', '솔이 조각 하나를 집어 자루에 넣었다. 조각이 자루 속에서 떤다.', '솔이 구덩이 턱까지 기어갔다. 한 걸음 뒤에서 따라 섰다.', '솔이 돌아보았다. 서 있는 것을 확인하고 다시 엎드린다.'],
  guardHalf: '절반이다. 솔이 자루를 들어 보인다. "아저씨가 있으니까 뒤를 안 봐도 돼요. 그러니까 두 배로 주워요."',
  guardDone: '스무 번째 조각이 자루에 들어갔다. 솔이 일어나 무릎을 털었다. "다 주웠어요. 세어 봐요. 아니, 봤으니까 안 세도 돼요."',
  trouble: '솔이 허리를 굽힌 사이 무언가 다가온다. 그 앞을 막아섰다.',
};
/** 내가 별못에서 무언가를 끝까지 했을 때 마을 사람이 해 주는 말 (BM-D5). 첫 줄은 1부 숨은 끝의 말이다. [누가, 글] */
export const SAW_SAY = [
  ['daon', '봤어. 네가 한 거.'],
  ['dallae', '봤어. 끝까지 하더라.'],
  ['hangyeol', '봤어. 처음부터 끝까지.'],
  ['seulgi', '봤어. 마지막 한 번까지.'],
  ['pondhost', '봤어. 창으로 다 보여.'],
  ['starsmith', '봤어. 네 손으로 한 거.'],
];
/** 10장의 길을 여는 표와, 열린 뒤 다음 지역이 나오기 전까지 퀘스트 창에 덧붙는 말. */
export const CLOUD_ROAD = 'cloudroad';
export const CLOUD_ROAD_SAY = '구름다리로 오르는 길은 열렸다. 그 위의 이야기는 아직 쓰이지 않았다.';
/** 11장의 길을 여는 표와, 열린 뒤 다음 지역이 나오기 전까지 퀘스트 창에 덧붙는 말. */
export const POND_ROAD = 'pondroad';
export const POND_ROAD_SAY = '별못으로 내려가는 길은 열렸다. 그 아래의 이야기는 아직 쓰이지 않았다.';
/**
 * 11장의 숫자 (GD-E). door: 문 앞. with: 함께 여는 길의 동료. herd: 서브 "견습 사제의 의심"의 염소 치기 수와 그 자리.
 * prayers: 히든 "듣지 못한 기도"가 나타나는 기도 수(화면에 내보내지 않는다). prayAt: 그 기도를 세는 자리.
 */
export const PRIEST = { dungeon: 'skytemple', mon: 'bellpriest', door: 'templedoor', with: 'miru', herd: 50, herdAt: 'goathut', herdQuest: 'novicedoubt', prayers: 300, prayAt: ['templedoor', 'templeyard'] };
export const PRIEST_LINES = {
  stand: '미루와 나란히 금칠한 문 앞에 섰다. 무릎은 꿇지 않았다.',
  herd: ['새벽과 나란히 염소를 벼랑 쪽 풀밭으로 몰았다.', '뒤처진 놈을 새벽이 안아 올렸다. 사제복에 털이 묻는다.', '막대기로 바위를 두드렸다. 염소들이 한 줄로 선다.', '새벽이 휘파람을 불었다. 서툴다. 염소 두 마리가 돌아본다.'],
  herdHalf: '절반이다. 새벽이 소매를 걷었다. "기도는 몇 번째인지 세어 본 적이 없어요. 이건 세어져요."',
  herdDone: '쉰 번째 염소가 우리로 들어갔다. 새벽이 빗장을 걸다 말고 멈췄다. 귀에 손을 댄다. 한참 그러고 서 있었다.',
};
/** 문지기 사제 고요, 견습 사제 새벽과 처음 만날 때 (GD-E1). [누가, 글]. me는 내 말이다 */
export const GOYO_FIRST = [
  ['goyo', '종은 신이오. 신의 소리는 닦은 귀에만 들리오. 그대는 몇 해를 닦았소.'],
  ['me', '아래에서는 허수아비만 쳐도 들렸다고 했다.'],
  ['goyo', '그건 메아리요. 참된 소리는 이 안에 있소. 우리는 사백 년을 닦았소.'],
  ['novice', '(작게) …저는 한 번도 못 들었어요. 말하면 안 되는데.'],
];
/** 조합장 한별과 처음 만날 때 (JD-D1). [갈래, 글] */
export const HANBYEOL_FIRST = [
  ['npc', '할머니의 할머니 때 얘기야. 눈만 떠도 울렸대. 밥 먹었다고 울리고, 걸었다고 울리고.'],
  ['npc', '좋았겠지, 처음엔. 그런데 다 울리면 뭐가 울린 건지 모르잖아. 사람들이 아무것도 안 하게 됐대.'],
  ['me', '아래에 상자가 많더라고 했다.'],
  ['npc', '임금의 하사품이야. 그냥 가지라고 둔 거. 열면 좋은 게 나와. …우린 안 열어.'],
];
/**
 * 10장의 숫자 (JD-D). bronze: 종루에 바칠 옛 청동 덩이. spear: 같이 바칠 승급작(근위병의 창, 내 손으로 지은 것). posts: 교대를 알릴 근위병의 수.
 * patrol: 서브 "근위병의 마지막 순찰"의 걸음 수. ledgers: 서브 "젖은 족보"의 권수와, 캐기 한 번에 궤가 나올 확률.
 */
export const ECHO = { dungeon: 'sunkenpalace', mon: 'bellecho', bronze: 200, metal: 'oldbronze', spear: 'oldbronze_sword', posts: 5, stubborn: 15, patrol: 60, patrolAt: 'sunkenstreet', patrolWith: 'parang', ledger: 'wetledger', ledgers: 5, ledgerRate: 0.3, ledgerAt: 'sunkenstreet', ledgerQuest: 'wetledger', patrolQuest: 'lastpatrol', altar: 'belltop' };
export const ECHO_LINES = {
  bronze: '옛 청동 덩이를 빈 고리 밑에 쌓았다.',
  spear: '내 손으로 지은 창을 청동 더미 위에 얹었다. 창날이 고리를 가리킨다.',
  relieve: '"교대요. 내려와도 되오. 임금은 없고, 지킬 문도 없소."',
  relieved: ['근위병이 검을 내렸다. 갑옷 안의 물이 천천히 빠져나간다. 투구가 한 번 끄덕였다.', '근위병이 검을 섬돌에 눕혔다. 갑옷이 주저앉았다. 안에는 물뿐이었다.'],
  refused: '근위병은 듣지 않는다. 검을 뽑는다. 맹세가 귀보다 깊다.',
  patrol: ['파랑과 나란히 처마 밑을 걸었다.', '골목 하나를 돌았다. 파랑이 문마다 창끝으로 한 번씩 두드린다.', '파랑이 등불 걸던 자리를 올려다본다. 걸음은 멈추지 않는다.', '네거리를 건넜다. 파랑이 낮게 걸음을 센다.'],
  patrolHalf: '길의 절반이다. 파랑이 멈추지 않고 말했다. "증조부는 여기까지였소."',
  patrolDone: '처음 내려선 자리로 돌아왔다. 한 바퀴다. 파랑이 창을 세우고 섰다. "끝까지 돌았소."',
  ledger: '담 밑에서 궤 하나가 나왔다. 젖은 족보 한 권을 건졌다.',
};
/** 9장의 길을 여는 표와, 열린 뒤 다음 지역이 나오기 전까지 퀘스트 창에 덧붙는 말. */
export const SUNKEN_ROAD = 'sunkenroad';
export const SUNKEN_ROAD_SAY = '잠긴 도성으로 가는 물길은 열렸다. 그 아래의 이야기는 아직 쓰이지 않았다.';
/** 약초꾼 수련과 처음 만날 때 (AN-D1). [갈래, 글] */
export const SURYEON_FIRST = [
  ['npc', '저것들? 다 내가 하던 거예요. 하다 보면 안개가 끼고, 안개가 끼면 내일 하지 싶고.'],
  ['npc', '여기선 다 그래요. 끝까지 한 사람을 본 적이 없으니까 끝이 어떻게 생겼는지도 몰라요.'],
  ['me', '종은 어디 있느냐고 물었다.'],
  ['npc', '종이요? …있었죠, 아마.'],
];
/** 8장의 길을 여는 표와, 열린 뒤 다음 지역이 나오기 전까지 퀘스트 창에 덧붙는 말. */
export const MARSH_ROAD = 'marshroad';
export const MARSH_ROAD_SAY = '안개늪으로 내려가는 길은 열렸다. 그 아래의 이야기는 아직 쓰이지 않았다.';
/** 불을 끄는 길에 드는 풀무질 (AG-D). 풀무 골목에서 민 것만 센다. */
export const QUENCH_PUMPS = 300;
/** 지어 보이는 길 (AG-D): 대에 걸 무기의 등급(영웅)과 단계(잿쇠). */
export const HANG = { grade: 3, tier: 5 };
/** 풀무꾼 다래와 처음 만날 때 (AG-D1). [갈래, 글] */
export const DARAE_FIRST = [
  ['npc', '마당에서 왔어? 나도 거기 섰었어. 딱 한 번 졌지.'],
  ['npc', '풀무질은 내가 이 골짜기에서 제일 잘해. 이십 년 했으니까. 그런데 그건 안 울려. 저 검은 이긴 것만 세거든.'],
  ['me', '풀무 자루를 잡아 보았다.'],
];
/** 대에 걸 때와 풀무를 멈출 때 내가 하는 말 (처음 값). */
export const HANG_SAY = '높은 대에 올라, 내 손으로 지은 것을 옛 검 곁에 걸었다. 둘레가 웅성거린다. 겨루지도 않은 사람이 대에 올랐다고.';
export const QUENCH_SAY = '풀무꾼 다섯과 눈을 맞추고 자루에서 손을 뗐다. 삼백 번을 같이 민 손들이 한꺼번에 멈췄다.';
/** 식은 가마 (AG-D7): 처음 퍼 담은 재가 식기까지의 걸음, 퍼 담을 줌 수, 재가 나는 곳. */
export const EMBER = { moves: 15, n: 5, place: 'moltenbrook', item: 'hotash', quest: 'coldkiln' };
export const EMBER_LINES = { scoop: '벌건 재 한 줌을 같이 퍼 담았다.', cold: '퍼 담은 재가 식었다. 붉은 빛이 꺼졌다. 처음부터 다시 퍼 담아야 한다.' };
/** 풀무 요령 (AG-D6): 풀무질로 오르는 대장 숙련도의 배수. */
export const BELLOWS_KNACK = 1.5;
/** 7장의 길을 여는 표와, 열린 뒤 다음 지역이 나오기 전까지 퀘스트 창에 덧붙는 말. */
export const ASH_ROAD = 'ashroad';
export const ASH_ROAD_SAY = '잿골로 가는 길은 열렸다. 그 너머의 이야기는 아직 쓰이지 않았다.';
/** 조각 하나의 값과 조각의 수 (SB-F, SB-J6). */
export const SHARD = { price: 4000, n: 7 };
/** 상단 대리인 유겸과 처음 만날 때 (SB-F1). [갈래, 글]. 쥐어 본 조각의 띠링은 대화방의 한 줄일 뿐, 기록에 남지 않는다 */
export const YUGYEOM_FIRST = [
  ['npc', '조각 보러 오셨소? 하나 쥐어 보시오. 값은 그다음에.'],
  ['sys', '띠링! 조각을 쥐었습니다.'],
  ['me', '아무것도 하지 않았는데 울렸다.'],
  ['npc', '좋지 않소? 삼백 번 칠 것 없이. 우리는 사람들 고생을 덜어 주는 거요.'],
];
/** 조각을 살 때와 저울꾼들을 돌려세울 때 내가 하는 말 (처음 값). */
export const SHARD_SAY = '값을 치르고 조각 하나를 받았다. 쥐자마자 울린다. 아무것도 하지 않았는데.';
export const TURN_SAY = '저울꾼 다섯을 창고 앞에 불러 모았다. "당신들이 단 것 가운데, 내가 한 일이 하나라도 있었습니까."';
/** 6장의 길을 여는 표와, 열린 뒤 다음 지역이 나오기 전까지 퀘스트 창에 덧붙는 말. */
export const SALT_ROAD = 'saltflat';
export const SALT_ROAD_SAY = '소금벌로 내려가는 길은 열렸다. 그 아래의 이야기는 아직 쓰이지 않았다.';
/** 종지기 한솔과 처음 만날 때 (WM-D1). [갈래, 글] */
export const HANSOL_FIRST = [
  ['npc', '깨우러 왔나. 다들 그 말부터 하지.'],
  ['npc', '저건 답할 때마다 닳아. 네가 듣는 그 소리 하나에 얼마가 깎이는지 아나. 나는 아끼는 거야.'],
  ['me', '삼십 년 동안 아무도 못 들었다고 했다.'],
  ['npc', '못 들어도 살아. 봐라, 다들 살잖아. 일찍 자고.'],
];
/** 말하는 길에서 내가 하는 말 (처음 값). */
export const PERSUADE_SAY = '빗자루를 같이 쥐고 말했다. "아끼면 닳지 않겠지요. 그런데 삼십 년 동안 아무도 못 들었으면, 그건 누구의 종입니까."';
