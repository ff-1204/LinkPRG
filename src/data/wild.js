// 마을 밖 (R1-9, R2-3, E1~E4, N7). 탐색 한 번마다 다섯 가지 가운데 하나가 일어난다.

/** 위험도마다 탐색에서 전투가 날 확률과, 가는 길에 습격당할 확률. */
export const DANGER = {
  안전: { battle: 0, ambush: 0, rank: 0 },
  낮음: { battle: 0.30, ambush: 0.05, rank: 1 },
  보통: { battle: 0.45, ambush: 0.15, rank: 2 },
  높음: { battle: 0.60, ambush: 0.30, rank: 3 },
};
export const DANGER_UP = { 안전: '안전', 낮음: '보통', 보통: '높음', 높음: '높음' };

/** 전투가 아닐 때 나머지 넷의 몫 (25 : 15 : 10 : 5). */
export const OTHER_WEIGHTS = { find: 25, incident: 15, meet: 10, rare: 5 };

export const TRAVEL_TICKS = 25; // 반나절
export const EXPLORE_TICKS = 3;
export const GATHER_TICKS = 2;
export const TENSION_STEP = 0.10;
export const TENSION_MAX = 4;
export const CALM_AFTER_BATTLE = 2;

/**
 * 사냥터. monsters의 w는 나올 몫.
 * gather: 여기서 할 수 있는 모으기 { action, skill, difficulty, drops:[{id,w}], miss(허탕 확률), say:[글] }
 */
export const WILDS = {
  forest: {
    monsters: [{ id: 'rat', w: 3 }, { id: 'wolf', w: 3 }, { id: 'boar', w: 4 }],
    finds: [{ id: 'oakbranch', n: 2, say: '참나무 가지 2개를 주웠다.' }, { id: 'berry', n: 3, say: '산열매 3개를 땄다.' }, { id: 'herb', n: 1, say: '바위틈에서 약초 하나를 캤다.' }, { animal: 'rabbit', say: '덤불에서 산토끼 한 마리가 튀어나와 이쪽을 한 번 보고 달아났다. 귀가 길고 뒷다리가 굵다.' }],
    rare: { id: 'oddknife', say: '썩은 그루터기 속에서 녹슨 조각칼을 찾았다. 날에 무언가 새겨져 있다.' },
    gather: {
      action: 'gather', label: '채집', skill: 'gathering', difficulty: 2, miss: 0.15,
      drops: [{ id: 'oakbranch', w: 5 }, { id: 'berry', w: 3 }, { id: 'herb', w: 2 }],
      say: ['덤불을 헤쳤다.', '나무 밑동을 살폈다.', '낙엽을 들춰 보았다.', '가지를 꺾었다.'],
      missSay: '쓸 만한 것이 없다.',
    },
    meets: ['안쪽에 멧돼지 있어요. 레벨 5쯤 되면 잡을 만해요.', '여기 늑대는 울기 전에 때리세요', '숲에서 조각칼 주웠다는 사람 봤음'],
  },
  mine: {
    monsters: [{ id: 'bat', w: 6 }, { id: 'spider', w: 4 }],
    finds: [{ id: 'ironore', n: 2, say: '무너진 벽에서 철광석 2개를 주웠다.' }, { id: 'copperore', n: 1, say: '버려진 수레에서 구리 광석 하나를 찾았다.' }],
    rare: { id: 'copperore', n: 5, say: '아무도 손대지 않은 구리 맥을 찾았다. 구리 광석 5개.' },
    gather: {
      action: 'mine', label: '채광', skill: 'mining', difficulty: 3, miss: 0.2,
      drops: [{ id: 'ironore', w: 8 }, { id: 'copperore', w: 2 }],
      say: ['곡괭이를 내리쳤다. 돌가루가 튄다.', '곡괭이를 내리쳤다. 손이 울린다.', '곡괭이로 바위틈을 벌렸다.', '곡괭이를 내리쳤다. 불꽃이 인다.'],
      missSay: '돌만 부서졌다.',
    },
    meets: ['박쥐가 입 벌리면 귀 막으세요. 기절함', '깊은 데는 조합원만 들여보내요', '거미는 웅크리면 바로 막으세요'],
  },
  ruins: {
    monsters: [{ id: 'spider', w: 5 }, { id: 'bat', w: 5 }],
    finds: [{ id: 'ironore', n: 3, say: '부서진 모루 곁에서 철광석 3개를 주웠다.' }, { id: 'herb', n: 2, say: '돌 틈에 핀 약초 2포기를 캤다.' }],
    rare: { id: 'redpotion', n: 2, say: '무너진 선반 밑에서 먼지 쌓인 붉은 물약 2병을 찾았다.' },
    meets: ['밤에는 여기 오지 마세요. 소리가 진짜 나요', '안쪽 문은 아직 아무도 못 열었대요', '여기 옛날에 공방이었다던데'],
  },
  pass: {
    monsters: [{ id: 'rockhawk', w: 4 }, { id: 'passbear', w: 4 }, { id: 'guidewolf', w: 2 }],
    finds: [{ id: 'herb', n: 4, say: '벼랑 틈에서 약초 4포기를 캤다.' }, { id: 'copperore', n: 4, say: '굴러떨어진 바위에서 구리 광석 4개를 떼었다.' }, { id: 'steel', n: 2, say: '부서진 수레 밑에서 강철 덩이 2개를 찾았다. 소리재로 가던 짐이다.' }],
    rare: { id: 'forgetwater', say: '바위 샘에 작은 병 하나가 잠겨 있다. 누가 두고 간 잊는 물이다.' },
    meets: ['곰이 일어서면 막으세요. 안 막으면 한 방입니다', '매는 땅 속성 공격이 잘 안 먹혀요', '고개 넘으면 소리재예요. 종 없는 종루가 보일 겁니다'],
  },
  reeds: {
    monsters: [{ id: 'reedsnake', w: 5 }, { id: 'mudtoad', w: 5 }],
    finds: [{ id: 'eel', n: 1, say: '진흙 구멍에서 장어 한 마리를 움켜쥐었다.' }, { id: 'herb', n: 3, say: '물가에서 약초 3포기를 캤다.' }],
    rare: { id: 'pearl', say: '죽은 조개를 벌리자 진주 한 알이 굴러 나왔다.' },
    gather: {
      action: 'gather', label: '채집', skill: 'gathering', difficulty: 6, miss: 0.2,
      drops: [{ id: 'herb', w: 4 }, { id: 'eel', w: 2 }, { id: 'oakbranch', w: 2 }],
      say: ['갈대를 헤쳤다.', '진흙을 뒤졌다.', '물풀을 걷어 올렸다.', '갈대 뿌리를 캤다.'],
      missSay: '진흙만 묻었다.',
    },
    meets: ['두꺼비가 볼을 부풀리면 막으세요. 삼킵니다', '뱀은 불에 약해요. 횃불 들고 오세요', '저 너머 가라앉은 배에는 배 없이 못 가요'],
  },
  river: {
    monsters: [{ id: 'crab', w: 1 }],
    finds: [{ id: 'crucian', n: 1, say: '얕은 물에 갇힌 붕어 한 마리를 건졌다.' }, { id: 'herb', n: 1, say: '물가에서 약초 하나를 캤다.' }],
    rare: { id: 'redpotion', say: '떠내려온 봇짐에서 붉은 물약 하나를 찾았다.' },
    gather: {
      action: 'fish', label: '낚시', skill: 'fishing', difficulty: 1, miss: 0.35,
      drops: [{ id: 'crucian', w: 1 }],
      say: ['낚싯대를 던졌다. 찌가 흔들린다.', '낚싯대를 던졌다. 물결이 번진다.', '낚싯대를 던졌다. 잠자리가 찌에 앉는다.', '낚싯대를 던졌다. 줄이 팽팽해진다.'],
      missSay: '미끼만 떼였다.',
    },
    meets: ['새벽엔 여기 아무도 없어요', '낚시 중급 되면 뭐 고르라고 뜸', '할머니가 생선 좋아하신대요'],
  },
  // ── 흰마루 (WM-A8, WM-A9). 몬스터와 재료는 tiers.js의 3단계 ──
  snowfield: {
    monsters: [{ id: 'frostfox', w: 6 }, { id: 'snowowl', w: 4 }],
    finds: [{ id: 'whitefur', n: 1, say: '눈 밑에서 흰털 가죽 조각을 주웠다.' }, { id: 'herb', n: 2, say: '눈을 걷어 내고 언 약초 2포기를 캤다.' }, { id: 'oakbranch', n: 2, say: '눈에 꺾인 가지 2개를 주웠다.' }],
    rare: { id: 'whitefur', n: 3, say: '눈에 묻힌 덫에 흰털 가죽 3장이 그대로 걸려 있다. 놓은 사람은 돌아오지 못한 모양이다.' },
    meets: ['여기 밤에는 횃불 없이 못 버텨요. 주막 가서 전골 드세요', '여우는 꼬리가 멈추면 막으세요', '체온 60 밑으로 가면 금방 지쳐요. 그 전에 돌아가요'],
  },
  icelake: {
    monsters: [{ id: 'iceboar', w: 6 }, { id: 'iciclespider', w: 4 }],
    finds: [{ id: 'frostiron', n: 1, say: '얼음 위에 떨어져 나온 서릿쇠 덩이 하나를 주웠다.' }, { id: 'icemeat', n: 1, say: '얼음에 갇힌 멧돼지 고기 한 덩이를 떼어 냈다.' }],
    rare: { id: 'frostiron', n: 4, say: '얼음이 갈라진 틈에 서릿쇠 맥이 드러나 있다. 서릿쇠 덩이 4개.' },
    gather: {
      action: 'dig', label: '캐기', skill: 'mining', difficulty: 22, miss: 0.25,
      drops: [{ id: 'frostiron', w: 8 }, { id: 'ironore', w: 2 }],
      say: ['곡괭이로 얼음을 찍었다. 얼음 가루가 튄다.', '곡괭이를 내리쳤다. 손이 저리다.', '얼음에 박힌 쇳덩이 둘레를 팠다.', '곡괭이를 내리쳤다. 얼음이 길게 금 간다.'],
      missSay: '얼음만 깨졌다.',
    },
    meets: ['멧돼지가 빙판 끝까지 물러나면 막으세요. 미끄러져 옵니다', '거미는 물 속성이라 횃불을 휘둘러도 잘 안 먹혀요', '서릿쇠는 여기서 캐는 게 제일 싸요'],
  },
  // ── 소금벌 (SB-A9, SB-A10). 몬스터와 재료는 tiers.js의 4단계. 사냥터마다 옛 우물이 하나 숨어 있다(well, SB-B3) ──
  saltfloor: {
    monsters: [{ id: 'saltscorpion', w: 6 }, { id: 'dryworm', w: 4 }],
    finds: [{ id: 'saltsteel', n: 2, say: '굳은 소금 밑에서 소금강 덩이 2개를 떼어 냈다.' }, { id: 'salt', n: 3, say: '갈라진 틈에서 굵은 소금 3줌을 긁어모았다.' }, { id: 'scorpshell', n: 1, say: '허물 벗은 전갈 껍질 하나를 주웠다.' }],
    rare: { id: 'scorpshell', n: 3, say: '소금에 묻힌 수레 밑에서 전갈 껍질 3장을 찾았다. 값을 매긴 꼬리표가 그대로 달려 있다.' },
    gather: {
      action: 'dig', label: '캐기', skill: 'mining', difficulty: 32, miss: 0.25,
      drops: [{ id: 'saltsteel', w: 6 }, { id: 'salt', w: 4 }],
      say: ['곡괭이로 소금 껍질을 찍었다. 흰 가루가 튄다.', '곡괭이를 내리쳤다. 바닥이 거북등처럼 갈라진다.', '소금 밑의 검은 덩이 둘레를 팠다.', '곡괭이를 내리쳤다. 입안이 짜다.'],
      missSay: '소금만 부서졌다.',
    },
    meets: ['물은 열 걸음에 한 모금씩 줄어요. 주머니 꼭 챙기세요', '전갈 꼬리가 등 뒤로 넘어오면 막으세요', '구이 먹으면 힘은 나는데 목이 더 말라요'],
    well: { say: '소금 기둥 그늘에 옛 우물이 있다. 지도에 적어 두었다.', sub: '옛 우물' },
  },
  drychannel: {
    monsters: [{ id: 'saltcrow', w: 6 }, { id: 'weigher', w: 4 }],
    finds: [{ id: 'saltsteel', n: 1, say: '뱃머리에 박혀 있던 소금강 덩이 하나를 뽑았다.' }, { id: 'oakbranch', n: 2, say: '부서진 노에서 쓸 만한 나무 2개를 골랐다.' }, { id: 'wormmeat', n: 1, say: '배 밑 그늘에 말라붙은 갯지렁이 살 한 토막을 떼어 냈다.' }],
    rare: { id: 'saltsteel', n: 4, say: '엎어진 배의 닻이 통째로 소금강이다. 소금강 덩이 4개.' },
    meets: ['저울꾼이 접시에 올려 보면 막으세요. 힘이 쭉 빠져요', '까마귀가 한 번 울면 떼로 와요', '배 밑을 잘 뒤져 보세요. 옛날 뱃사람들 우물이 있다던데'],
    well: { say: '배 밑에 옛 우물이 있다. 지도에 적어 두었다.', sub: '옛 우물' },
  },
  // ── 잿골 (AG-A8, AG-A9). 몬스터와 재료는 tiers.js의 5단계. 글은 시안의 발견 글 하나를 빼고 처음 값이다 ──
  ashslope: {
    monsters: [{ id: 'ashlizard', w: 6 }, { id: 'sparkbat', w: 4 }],
    finds: [{ id: 'lizardscale', n: 3, say: '재 속에서 도마뱀 비늘 3장을 주웠다.' }, { id: 'herb', n: 2, say: '재를 걷어 내고 그을린 약초 2포기를 캤다.' }, { id: 'oakbranch', n: 2, say: '타다 남은 그루터기에서 쓸 만한 가지 2개를 골랐다.' }],
    rare: { id: 'lizardscale', n: 5, say: '도마뱀이 허물을 벗은 자리를 찾았다. 도마뱀 비늘 5장이 통째로 남아 있다.' },
    gather: {
      action: 'dig', label: '캐기', skill: 'mining', difficulty: 42, miss: 0.25,
      drops: [{ id: 'ironore', w: 4 }, { id: 'ashiron', w: 3 }, { id: 'copperore', w: 3 }],
      say: ['곡괭이로 재 더미를 헤쳤다. 속이 아직 붉다.', '곡괭이를 내리쳤다. 재가 눈처럼 날린다.', '재 밑의 굳은 덩이 둘레를 팠다.', '곡괭이를 내리쳤다. 자루가 뜨뜻하다.'],
      missSay: '재만 날렸다.',
    },
    meets: ['쇠 무기 들고 오래 있지 마세요. 여기선 두 배로 닳아요', '도마뱀 목이 붉어지면 막으세요. 불을 뱉어요', '숫돌은 큰 대장간에서 팔아요. 세 개는 들고 나오세요'],
  },
  moltenbrook: {
    monsters: [{ id: 'moltencrab', w: 6 }, { id: 'ashblade', w: 4 }],
    finds: [{ id: 'ashiron', n: 2, say: '굳은 쇳물 가장자리에서 잿쇠 덩이 2개를 떼어 냈다.' }, { id: 'crabmeat', n: 1, say: '식은 웅덩이에 뒤집힌 게에서 게살 한 덩이를 발랐다.' }, { id: 'oakbranch', n: 2, say: '누가 버리고 간 풀무 자루에서 쓸 만한 나무 2개를 골랐다.' }],
    rare: { id: 'ashiron', n: 4, say: '쇳물이 굳으며 생긴 맥이 통째로 드러나 있다. 잿쇠 덩이 4개.' },
    gather: {
      action: 'dig', label: '캐기', skill: 'mining', difficulty: 46, miss: 0.25,
      drops: [{ id: 'ashiron', w: 7 }, { id: 'ironore', w: 3 }],
      say: ['곡괭이로 굳은 쇳물을 찍었다. 불티가 튄다.', '곡괭이를 내리쳤다. 속에서 붉은빛이 샌다.', '검붉은 덩이 둘레를 팠다.', '곡괭이를 내리쳤다. 손바닥이 뜨겁다.'],
      missSay: '껍데기만 깨졌다.',
    },
    meets: ['게가 웅덩이에 집게를 담그면 막으세요. 쇳물을 끼얹어요', '검꾼들은 마당에서 진 사람들이래요. 풀무 밀다 말고 나온 거예요', '여기서 이기면 무기가 달아요. 식기 전에 큰 대장간으로 가세요'],
  },
  // ── 안개늪 (AN-A8, AN-A9). 몬스터와 재료는 tiers.js의 6단계. 글은 처음 값이다. 약초 다섯 가지는 "약초꾼의 제자"(AN-D7)가 찾는 것이다 ──
  mossfield: {
    monsters: [{ id: 'mosstoad', w: 6 }, { id: 'mistleech', w: 4 }],
    finds: [{ id: 'mossiron', n: 2, say: '이끼를 걷어 내고 이끼쇠 덩이 2개를 건졌다.' }, { id: 'toadleg', n: 1, say: '누가 덫에서 빼다 만 두꺼비 다리 하나를 주웠다.' }, { id: 'herb', n: 2, say: '물가에서 약초 2포기를 캤다.' }],
    rare: { id: 'mossiron', n: 4, say: '가라앉은 수레가 통째로 이끼쇠가 되어 있다. 이끼쇠 덩이 4개.' },
    gather: {
      action: 'dig', label: '캐기', skill: 'mining', difficulty: 52, miss: 0.25,
      drops: [{ id: 'mossiron', w: 5 }, { id: 'marshmoss', w: 2 }, { id: 'toadgrass', w: 2 }, { id: 'mistmint', w: 1 }],
      say: ['이끼를 들추고 밑을 팠다. 물이 고인다.', '곡괭이를 내리쳤다. 푸른 덩이가 비친다.', '이끼 뿌리 사이를 헤집었다.', '곡괭이를 내리쳤다. 진흙이 무릎까지 튄다.'],
      missSay: '이끼만 한 움큼 뜯겼다.',
    },
    meets: ['등불 없이 뒤지면 길 잃어요. 반나절이 그냥 가요', '두꺼비가 몸을 웅크리면 막으세요. 덮쳐 앉아요', '맞다 보면 저주가 앉아요. 성수 한 병은 꼭 들고 다니세요'],
  },
  sunkenwood: {
    monsters: [{ id: 'soakedscarecrow', w: 6 }, { id: 'marshlight', w: 4 }],
    finds: [{ id: 'mistthread', n: 1, say: '가지에 걸린 안개실 한 타래를 걷었다.' }, { id: 'lampshroom', n: 1, say: '물에 잠긴 밑동에서 등불 버섯 하나를 땄다. 어두운 데서 흐리게 빛난다.' }, { id: 'fogbloom', n: 1, say: '안개 속에서만 피는 안개꽃 한 송이를 꺾었다.' }, { id: 'oakbranch', n: 2, say: '물 위로 나온 가지 2개를 꺾었다.' }],
    rare: { id: 'mistthread', n: 3, say: '누가 잣다 만 물레가 나무에 걸려 있다. 안개실 3타래가 그대로 감겨 있다.' },
    meets: ['끈 열 개 묶으면 여기선 다시는 길 안 잃어요. 저는 일곱 개째예요', '허수아비가 고개를 들면 막으세요. 무릎이 풀려요', '따라오는 불빛은 따라가지 마세요. 등불지기 등불이 아니에요'],
  },
  // ── 잠긴 도성 (JD-A9, JD-A10). 몬스터와 재료는 tiers.js의 7단계. 글은 처음 값이다. 물 아래라 캐는 동안에도 덤빈다 (JD-C4) ──
  sunkenstreet: {
    monsters: [{ id: 'soakedgate', w: 6 }, { id: 'scalehound', w: 4 }],
    finds: [{ id: 'oldbronze', n: 2, say: '가게 문짝에서 옛 청동 덩이 2개를 떼어 냈다.' }, { id: 'scalehide', n: 1, say: '수레 밑에 벗어 놓은 비늘 가죽 한 장을 주웠다.' }, { id: 'oakbranch', n: 2, say: '썩지 않은 서까래에서 참나무 가지 2개를 뜯었다.' }],
    rare: { id: 'oldbronze', n: 4, say: '기울어진 종 가게다. 팔다 남은 작은 종들이 그대로 걸려 있다. 옛 청동 덩이 4개.' },
    gather: {
      action: 'dig', label: '캐기', skill: 'mining', difficulty: 62, miss: 0.25,
      drops: [{ id: 'oldbronze', w: 6 }, { id: 'scalehide', w: 2 }, { id: 'ironore', w: 1 }],
      say: ['무너진 담 밑에서 청동을 캤다.', '곡괭이를 내리쳤다. 물이 흐려진다.', '대문의 돌쩌귀를 비틀어 뗐다.', '곡괭이를 내리쳤다. 푸른 녹이 일어난다.'],
      missSay: '기왓장만 부서졌다.',
    },
    meets: ['문지기는 꼭 둘이에요. 하나 잡았다고 숨 돌리면 안 돼요', '숨이 다섯 남으면 올라가세요. 싸움이 붙으면 못 올라가요', '상자는 열지 마세요. 조합 사람들이 왜 안 여는지 생각해 봐요'],
  },
  palaceyard: {
    monsters: [{ id: 'belljelly', w: 5 }, { id: 'sunkenguard', w: 5 }],
    finds: [{ id: 'jellycurd', n: 1, say: '섬돌에 붙은 해파리 묵 한 덩이를 떼었다.' }, { id: 'oldbronze', n: 2, say: '궁 문의 고리에서 옛 청동 덩이 2개를 떼어 냈다.' }, { id: 'scalehide', n: 1, say: '물풀에 걸린 비늘 가죽 한 장을 걷었다.' }],
    rare: { id: 'jellycurd', n: 3, say: '수라간 솥에 해파리들이 들어앉았다 굳었다. 해파리 묵 3덩이.' },
    gather: {
      action: 'dig', label: '캐기', skill: 'mining', difficulty: 66, miss: 0.25,
      drops: [{ id: 'oldbronze', w: 5 }, { id: 'jellycurd', w: 3 }, { id: 'scalehide', w: 2 }],
      say: ['섬돌 틈을 팠다.', '곡괭이를 내리쳤다. 청동 못이 드러난다.', '기둥 밑동의 띠쇠를 벗겼다.', '곡괭이를 내리쳤다. 물속에서 띠링이 한 번 흔들린다.'],
      missSay: '물풀만 한 움큼 뜯겼다.',
    },
    meets: ['해파리 몸이 부풀면 막으세요. 뼈가 울려요', '근위병은 사람이었대요. 맹세를 못 풀어서 저러고 있대요', '궁 안은 전각이 다섯이에요. 전각마다 하나씩 서 있어요'],
  },
  // ── 구름다리 (GD-A8, GD-A9). 몬스터와 재료는 tiers.js의 8단계. 글은 처음 값이다(벼랑길의 첫 한마디만 시안의 것, GD-B2) ──
  cliffroad: {
    monsters: [{ id: 'cloudgoat', w: 6 }, { id: 'windknot', w: 4 }],
    finds: [{ id: 'goatwool', n: 1, say: '가시덤불에 걸린 염소털 한 뭉치를 걷었다.' }, { id: 'goatmeat', n: 1, say: '벼랑에서 떨어진 염소다. 구름 염소 고기 한 덩이를 발라냈다.' }, { id: 'oakbranch', n: 2, say: '바위틈에 뿌리 내린 참나무에서 가지 2개를 꺾었다.' }],
    rare: { id: 'goatwool', n: 3, say: '염소들이 몸을 비비고 간 바위다. 염소털 3뭉치가 붙어 있다.' },
    gather: {
      action: 'dig', label: '캐기', skill: 'mining', difficulty: 72, miss: 0.25,
      drops: [{ id: 'cloudsilver', w: 4 }, { id: 'goatwool', w: 4 }, { id: 'ironore', w: 1 }],
      say: ['바위 턱을 쪼았다. 흰 줄이 드러난다.', '곡괭이를 내리쳤다. 돌 조각이 구름 속으로 떨어진다.', '바위틈에 낀 털 뭉치를 파냈다.', '곡괭이를 내리쳤다. 소리가 한참 뒤에 돌아온다.'],
      missSay: '돌만 굴러떨어졌다. 바닥에 닿는 소리가 나지 않는다.',
    },
    meets: ['옆바람 불 땐 모아 치기 무조건 막으세요. 안 막으면 밀려요', '깃발 꼭 보고 다녀요. 다음 바람이 뭔지 알면 반은 이긴 거예요', '뒷바람 부는 날은 그냥 몰아쳐요. 두 번씩 들어가요'],
  },
  templeyard: {
    monsters: [{ id: 'stonemonk', w: 5 }, { id: 'goldmask', w: 5 }],
    finds: [{ id: 'cloudsilver', n: 2, say: '깨진 향로에서 구름은 덩이 2개를 떼어 냈다.' }, { id: 'goatwool', n: 1, say: '순례자가 두고 간 방석에서 염소털 한 뭉치를 뜯었다.' }, { id: 'herb', n: 2, say: '섬돌 틈에 약초가 났다. 2개를 캤다.' }],
    rare: { id: 'cloudsilver', n: 4, say: '쓰러진 석상의 속이 비어 있다. 누가 구름은을 숨겨 두었다. 구름은 덩이 4개.' },
    gather: {
      action: 'dig', label: '캐기', skill: 'mining', difficulty: 76, miss: 0.25,
      drops: [{ id: 'cloudsilver', w: 6 }, { id: 'ironore', w: 2 }, { id: 'goatwool', w: 1 }],
      say: ['뜰의 깨진 판석을 들췄다.', '곡괭이를 내리쳤다. 은빛 가루가 인다.', '석상 받침의 띠를 벗겼다.', '곡괭이를 내리쳤다. 문 안에서 무언가 한 번 울린 것 같다.'],
      missSay: '판석만 깨졌다.',
    },
    meets: ['가면이 똑바로 보면 막으세요. 맞으면 다리가 굳어요', '맞바람 부는 날엔 활이 안 나가요. 저는 그런 날 그냥 캐요', '신전 안은 전이 다섯이래요. 맨 안쪽에 대사제가 있고요'],
  },
  // ── 별못 (BM-A8, BM-A9). 몬스터와 재료는 tiers.js의 9단계. 글은 처음 값이다(못 둘레의 첫 한마디만 시안의 것, BM-B1) ──
  pondside: {
    monsters: [{ id: 'starmoth', w: 6 }, { id: 'pondmirror', w: 4 }],
    finds: [{ id: 'mothsilk', n: 1, say: '갈대에 걸린 빈 고치를 풀었다. 나방 비단 한 필이 나왔다.' }, { id: 'stardust', n: 2, say: '물가 돌 위에 가루가 앉아 있다. 별가루 2줌을 쓸어 담았다.' }, { id: 'herb', n: 2, say: '못가에 약초가 났다. 2개를 캤다.' }],
    rare: { id: 'mothsilk', n: 3, say: '나방들이 한꺼번에 날아오른 자리다. 고치가 그대로 남았다. 나방 비단 3필.' },
    gather: {
      action: 'dig', label: '캐기', skill: 'mining', difficulty: 82, miss: 0.25,
      drops: [{ id: 'stardust', w: 5 }, { id: 'mothsilk', w: 3 }, { id: 'starmetal', w: 2 }],
      say: ['물가의 진흙을 팠다. 가루가 섞여 반짝인다.', '곡괭이를 내리쳤다. 못물에 비친 내가 한 박자 먼저 내리쳤다.', '갈대 뿌리 밑을 헤쳤다.', '곡괭이를 내리쳤다. 물 위의 나방들이 흩어졌다 모인다.'],
      missSay: '진흙만 한 삽 나왔다.',
    },
    meets: ['같은 것만 누르면 안 돼요. 막기 한 번 섞으세요', '거울상은 장비 좋을수록 세요. 저는 반지 빼고 싸워 봤는데, 그럼 저도 약해지더라고요', '읽히기 전에 끝내면 손이 더 빨리 늘어요. 진짜예요'],
  },
  starfield: {
    monsters: [{ id: 'starshard', w: 5 }, { id: 'voidecho', w: 5 }],
    finds: [{ id: 'starmetal', n: 2, say: '누운 풀 사이에 식은 조각이 있다. 별쇠 덩이 2개를 주웠다.' }, { id: 'stardust', n: 1, say: '구덩이 턱에서 별가루 한 줌을 쓸었다.' }, { id: 'oakbranch', n: 2, say: '그을린 참나무에서 성한 가지 2개를 꺾었다.' }],
    rare: { id: 'starmetal', n: 4, say: '큰 조각 하나가 반쯤 묻혀 있다. 아직 따뜻하다. 별쇠 덩이 4개를 떼어 냈다.' },
    gather: {
      action: 'dig', label: '캐기', skill: 'mining', difficulty: 86, miss: 0.25,
      drops: [{ id: 'starmetal', w: 6 }, { id: 'stardust', w: 2 }, { id: 'ironore', w: 1 }, { id: 'bellshard', w: 1 }],
      say: ['그을린 흙을 팠다. 속에서 빛이 샌다.', '곡괭이를 내리쳤다. 쇳소리가 났다. 돌이 아니다.', '누운 풀을 걷고 그 밑을 팠다.', '곡괭이를 내리쳤다. 구덩이 밑의 소리가 잠깐 멎었다.'],
      missSay: '그을린 흙뿐이다.',
    },
    meets: ['메아리가 조용해지면 막으세요. 맞으면 팔에 힘이 빠져요', '별 조각이 떠오르면 큰 게 와요. 그때만 막고 나머지는 섞어요', '구덩이 밑은 다섯 층이래요. 바닥에서 뭐가 운대요'],
  },
  // ── 처음 모루 (CM-A6, CM-A7). 몬스터와 재료는 tiers.js의 10단계. 글은 처음 값이다(끝물의 한마디만 시안의 것, CM-B2) ──
  meltgully: {
    monsters: [{ id: 'coldmelt', w: 6 }, { id: 'promiseshadow', w: 4 }],
    finds: [{ id: 'firstiron', n: 1, say: '굳은 쇳물 틈에 쇳덩이가 박혀 있다. 첫쇠 덩이 하나를 떼어 냈다.' }, { id: 'anvilsalt', n: 2, say: '식은 쇳물 겉에 흰 것이 피었다. 모루 소금 2줌을 긁었다.' }, { id: 'herb', n: 1, say: '바위틈에 풀 한 포기가 났다. 약초 1개를 뜯었다.' }],
    rare: { id: 'firstiron', n: 3, say: '골이 꺾이는 데 쇳물이 고였다 굳었다. 첫쇠 덩이 3개가 한 덩어리로 나왔다.' },
    gather: {
      action: 'dig', label: '캐기', skill: 'mining', difficulty: 92, miss: 0.25,
      drops: [{ id: 'firstiron', w: 6 }, { id: 'anvilsalt', w: 3 }, { id: 'ironore', w: 1 }],
      say: ['굳은 쇳물을 곡괭이로 쪼았다. 속이 아직 검붉다.', '곡괭이를 내리쳤다. 사백 년 전의 쇠가 종소리 비슷한 것을 낸다.', '골 바닥의 쇳물 껍질을 들췄다.', '곡괭이를 내리쳤다. 골 위쪽에서 무언가 따라 내리친 것 같다.'],
      missSay: '껍질만 부서졌다.',
    },
    meets: ['큰 거 올 땐 막고, 틈일 때 두드려요. 대장간이랑 똑같아요', '그림자가 입을 열면 막으세요. 그 말 들으면 손에 힘이 풀려요', '벼림 열둘 채우고 이기면 날이 안 상해요. 해 보면 알아요'],
  },
  masterroad: {
    monsters: [{ id: 'firsthand', w: 10 }],
    finds: [{ id: 'shadowhide', n: 1, say: '디딤돌 밑에 그림자가 눌어붙어 있다. 그림자 가죽 한 장을 벗겼다.' }, { id: 'firstiron', n: 2, say: '계단 턱에 누가 쇠를 괴어 놓았다. 첫쇠 덩이 2개.' }, { id: 'anvilsalt', n: 1, say: '손자국에 흰 것이 고였다. 모루 소금 한 줌.' }],
    rare: { id: 'shadowhide', n: 3, say: '계단참에 그림자 셋이 겹쳐 누워 있다. 임자가 없다. 그림자 가죽 3장을 걷었다.' },
    gather: {
      action: 'dig', label: '캐기', skill: 'mining', difficulty: 96, miss: 0.25,
      drops: [{ id: 'firstiron', w: 4 }, { id: 'shadowhide', w: 3 }, { id: 'anvilsalt', w: 2 }],
      say: ['디딤돌 틈을 팠다. 쇳가루가 섞여 나온다.', '곡괭이를 내리쳤다. 계단 전체가 한 번 울렸다.', '손자국이 팬 돌을 들췄다.', '곡괭이를 내리쳤다. 위에서 망치 소리가 한 번 답했다.'],
      missSay: '돌가루만 날렸다.',
    },
    meets: ['손이 망치를 오래 들면 막아요. 그건 종 짓던 한 번이래요', '저 위가 모루예요. 아흔다섯은 돼야 망치가 들린대요', '여기까지 온 사람 몇 없어요. 저도 겨우 왔어요'],
  },
  // 얼음 낚시터 (WM-A3): 마을 안이라 괴물이 없다. 식은 몸일 때만 얼음 밑 은어가 문다 (cold, WM-B3)
  icehole: {
    gather: {
      action: 'fish', label: '낚시', skill: 'fishing', difficulty: 27, miss: 0.4,
      drops: [{ id: 'crucian', w: 6 }, { id: 'silverfish', w: 4, cold: true }],
      say: ['얼음 구멍에 줄을 내렸다. 물이 검다.', '줄을 내렸다. 구멍 가장자리가 다시 언다.', '줄을 내렸다. 손끝으로 떨림을 기다린다.', '줄을 내렸다. 얼음 밑에서 무언가 스친다.'],
      missSay: '미끼만 얼었다.',
    },
  },
};

/**
 * 사건 (선택지가 있는 일). 선택의 결과는 effect로 적는다.
 * effect: { counter?, item?:{id,n}, hp?, full?, silver?, say }
 */
/** 먹잇감 냄새 (Z64): 돕지 않고 지나친 짐승을 노리는 포식자. 탐색 SCENT_TRIES번 안에 반드시 오고, 한 번 싸우거나 하루(세 때)가 지나면 사라진다. */
export const SCENT_TRIES = 3;
export const SCENT_PHASES = 3;
export const HUNGRY = { hp: 1.5, attack: 1.5, xp: 2 };

export const INCIDENTS = {
  forest: [
    { id: 'fox', text: '덫에 걸린 여우가 낑낑댄다. 이쪽을 보고 몸을 웅크린다.', options: [
      { id: 'free', label: '덫을 풀어 준다', effect: { counter: 'kind', say: '덫을 풀어 주었다. 여우가 한참 돌아보다 사라진다.' } },
      { id: 'feed', label: '먹을 것을 놓아 두고 풀어 준다', need: { item: 'berry' }, effect: { counter: 'kind', counterN: 2, take: 'berry', say: '산열매를 놓아 두고 덫을 풀었다. 여우가 열매를 물고 달아난다.' } },
      { id: 'leave', label: '그냥 지나간다', effect: { scent: 'wolf', say: '모른 척 지나갔다. 낑낑대는 소리가 한참 따라온다.' } },
    ] },
    { id: 'tree', text: '쓰러진 고목 밑에 무언가 깔려 반짝인다.', options: [
      { id: 'reach', label: '손을 넣어 꺼낸다', effect: { silver: 6, hp: -4, say: '가시에 긁히며 은화 6닢을 꺼냈다.' } },
      { id: 'leave', label: '그만둔다', effect: { say: '손을 넣기엔 틈이 좁다. 그만두었다.' } },
    ] },
  ],
  mine: [
    { id: 'cart', text: '버려진 광차에 누가 두고 간 봇짐이 있다. 주인은 보이지 않는다.', options: [
      { id: 'take', label: '가져간다', effect: { item: { id: 'riceball', n: 2 }, say: '봇짐에서 주먹밥 2개를 챙겼다. 뒤가 조금 켕긴다.' } },
      { id: 'leave', label: '그대로 둔다', effect: { say: '주인이 찾으러 올 것이다. 그대로 두었다.' } },
    ] },
    { id: 'batlings', text: '바닥에 떨어진 새끼 박쥐가 버둥거린다.', options: [
      { id: 'lift', label: '천장 틈에 올려 준다', effect: { counter: 'kind', say: '손바닥에 올려 틈에 넣어 주었다. 어미가 내려와 물고 간다.' } },
      { id: 'leave', label: '지나간다', effect: { scent: 'spider', say: '내 일이 아니다. 지나갔다.' } },
    ] },
  ],
  ruins: [
    { id: 'anvil', text: '쓰러진 모루에 누가 새긴 이름들이 빼곡하다. 맨 아래 한 줄이 비어 있다.', options: [
      { id: 'read', label: '이름들을 소리 내어 읽는다', effect: { flag: 'readAnvil', say: '하나씩 읽었다. 읽을 때마다 어디선가 쇠가 작게 울린 것 같다.' } },
      { id: 'leave', label: '지나간다', effect: { say: '남의 이름이다. 지나갔다.' } },
    ] },
  ],
  pass: [
    { id: 'cairn', text: '고갯마루에 돌무더기가 있다. 지나는 사람마다 돌 하나를 얹는 곳이다.', options: [
      { id: 'add', label: '돌 하나를 얹는다', effect: { counter: 'offer', say: '돌 하나를 골라 맨 위에 얹었다. 바람이 잠깐 멎은 것 같다.' } },
      { id: 'leave', label: '지나간다', effect: { say: '갈 길이 멀다. 지나갔다.' } },
    ] },
  ],
  reeds: [
    { id: 'nest', text: '갈대 사이에 물새 둥지가 있다. 알이 셋. 어미는 보이지 않는다.', options: [
      { id: 'cover', label: '갈대를 덮어 가려 준다', effect: { counter: 'kind', say: '갈대를 꺾어 둥지를 가렸다. 멀리서 어미 새가 운다.' } },
      { id: 'take', label: '알을 가져간다', effect: { item: { id: 'berry', n: 3 }, scent: 'reedsnake', say: '알 대신 둥지 곁의 열매만 챙겼다. 알은 차마 못 집었다.' } },
      { id: 'leave', label: '지나간다', effect: { scent: 'reedsnake', say: '모른 척 지나갔다.' } },
    ] },
  ],
  river: [
    { id: 'net', text: '낡은 그물에 물새 한 마리가 엉켜 있다.', options: [
      { id: 'cut', label: '그물을 끊어 준다', effect: { counter: 'kind', say: '그물을 끊었다. 물새가 물을 차고 날아오른다.' } },
      { id: 'leave', label: '지나간다', effect: { scent: 'reedsnake', say: '그물 주인의 것이다. 지나갔다.' } },
    ] },
  ],
  snowfield: [
    { id: 'owlet', text: '눈 위에 올빼미 새끼 한 마리가 떨어져 있다. 날개 한쪽에 얼음이 엉겨 있다.', options: [
      { id: 'warm', label: '품에 넣어 얼음을 녹여 준다', effect: { counter: 'kind', say: '품에 넣고 한참 서 있었다. 얼음이 녹자 새끼는 가지 위로 올라갔다.' } },
      { id: 'leave', label: '지나간다', effect: { scent: 'frostfox', say: '갈 길이 멀다. 지나갔다.' } },
    ] },
    { id: 'sled', text: '눈에 반쯤 묻힌 썰매가 있다. 짐을 묶은 끈이 얼어 있다. 끌던 사람의 발자국은 없다.', options: [
      { id: 'open', label: '끈을 끊고 짐을 본다', effect: { item: { id: 'torch', n: 2 }, say: '짐 속에서 횃불 2개를 찾았다. 나머지는 얼어 쓸 수 없다.' } },
      { id: 'leave', label: '그대로 둔다', effect: { say: '주인이 찾으러 올지도 모른다. 그대로 두었다.' } },
    ] },
  ],
  saltfloor: [
    { id: 'cart', text: '소금 수레 하나가 바퀴가 빠진 채 서 있다. 수레꾼이 그늘도 없이 앉아 입술을 핥는다.', options: [
      { id: 'share', label: '물 한 모금을 나눠 준다', effect: { counter: 'kind', water: -1, say: '물 한 모금을 건넸다. 수레꾼은 값을 물으려다 말았다.' } },
      { id: 'leave', label: '지나간다', effect: { say: '내 물도 넉넉하지 않다. 지나갔다.' } },
    ] },
  ],
  drychannel: [
    { id: 'hull', text: '엎어진 배 안에서 긁는 소리가 난다. 까마귀 한 마리가 널빤지 틈에 끼어 있다.', options: [
      { id: 'free', label: '널빤지를 들어 빼 준다', effect: { counter: 'kind', say: '널빤지를 들었다. 까마귀는 소금을 털고 돛대 위로 올라갔다.' } },
      { id: 'leave', label: '지나간다', effect: { scent: 'saltcrow', say: '쪼일 것 같다. 지나갔다.' } },
    ] },
  ],
  ashslope: [
    { id: 'hatchling', text: '재 더미에서 갓 깬 도마뱀 새끼가 버둥거린다. 등에 식은 재가 굳어 붙었다.', options: [
      { id: 'brush', label: '굳은 재를 털어 준다', effect: { counter: 'kind', say: '손끝으로 재를 떼어 냈다. 새끼는 붉은 재 속으로 파고들었다.' } },
      { id: 'leave', label: '지나간다', effect: { scent: 'ashlizard', say: '어미가 근처에 있을 것이다. 지나갔다.' } },
    ] },
    { id: 'pack', text: '재에 반쯤 묻힌 봇짐이 있다. 끈에 풀무 골목의 표시가 묶여 있다.', options: [
      { id: 'open', label: '끈을 풀어 본다', effect: { item: { id: 'riceball', n: 2 }, say: '식은 주먹밥 2개가 들어 있다. 마당에 서러 가던 사람의 점심이었을 것이다.' } },
      { id: 'leave', label: '그대로 둔다', effect: { say: '찾으러 올지도 모른다. 그대로 두었다.' } },
    ] },
  ],
  moltenbrook: [
    { id: 'stuck', text: '굳어 가는 쇳물에 검 한 자루가 꽂혀 있다. 자루에 이름이 새겨져 있다. 마당에서 진 사람의 것이다.', options: [
      { id: 'pull', label: '뽑아서 물가에 눕혀 둔다', effect: { counter: 'kind', hp: -10, say: '손이 데었지만 검을 뽑아 돌 위에 눕혔다. 임자가 찾으러 오면 볼 것이다.' } },
      { id: 'leave', label: '지나간다', effect: { say: '남의 검이다. 지나갔다.' } },
    ] },
  ],
  mossfield: [
    { id: 'trap', text: '이끼 밑에 덫이 있다. 누가 놓다 말아서 반만 벌어져 있다. 두꺼비 새끼 한 마리가 그 사이에 끼었다.', options: [
      { id: 'free', label: '덫을 벌려 빼 준다', effect: { counter: 'kind', say: '덫을 벌렸다. 새끼는 이끼 속으로 들어가 돌이 되었다.' } },
      { id: 'leave', label: '지나간다', effect: { scent: 'mosstoad', say: '남의 덫이다. 지나갔다.' } },
    ] },
  ],
  sunkenwood: [
    { id: 'knots', text: '나무에 낡은 표식 끈이 묶여 있다. 셋. 넷째 나무에는 묶다 만 끈이 늘어져 있다.', options: [
      { id: 'tie', label: '늘어진 끈을 마저 묶어 준다', effect: { counter: 'kind', say: '끈을 당겨 마저 묶었다. 누군지 모를 사람의 넷째 매듭이 됐다.' } },
      { id: 'leave', label: '지나간다', effect: { say: '내 끈이 아니다. 지나갔다.' } },
    ] },
  ],
  // 잠긴 도성 (JD-D, JD-F4): 임금의 하사품 상자는 보이고 열 수 있다(chest). 곳마다 넷뿐이다. 열면 무엇이 달라지는지는 어디에도 나오지 않는다
  sunkenstreet: [
    { id: 'chest', chest: true, text: '집집마다 문 앞에 상자가 하나씩 놓여 있다. 뚜껑에 임금의 도장이 찍혀 있다. 임금의 하사품이다. 잠겨 있지 않다.', options: [
      { id: 'open', label: '상자를 연다', effect: { chest: true, say: '뚜껑을 들었다. 안쪽에 글씨가 있다. "받아라. 아무것도 하지 않아도 된다."' } },
      { id: 'leave', label: '지나간다', effect: { say: '손대지 않고 지나갔다. 상자는 다음 사람을 기다린다.' } },
    ] },
    { id: 'sign', text: '가게 간판 하나가 사슬 한 줄에 매달려 흔들린다. 떨어지면 아래 수레를 덮칠 것이다. 수레 안에 무언가 웅크리고 있다.', options: [
      { id: 'hold', label: '간판을 받쳐 내려놓는다', effect: { counter: 'kind', say: '간판을 안아 내려놓았다. 수레 안의 것은 비늘 돋은 강아지였다. 물살을 가르고 사라졌다.' } },
      { id: 'leave', label: '지나간다', effect: { scent: 'scalehound', say: '남의 가게다. 지나갔다.' } },
    ] },
  ],
  palaceyard: [
    { id: 'chest', chest: true, text: '섬돌마다 상자가 하나씩 놓여 있다. 받으러 온 사람들이 줄을 섰던 자리다. 임금의 하사품이다. 뚜껑이 조금 들려 있다.', options: [
      { id: 'open', label: '상자를 연다', effect: { chest: true, say: '뚜껑을 들었다. 안쪽에 글씨가 있다. "받아라. 아무것도 하지 않아도 된다."' } },
      { id: 'leave', label: '지나간다', effect: { say: '손대지 않고 지나갔다. 줄 섰던 자리의 발자국이 섬돌에 패어 있다.' } },
    ] },
    { id: 'helm', text: '섬돌 위에 투구 하나가 놓여 있다. 안에 물뿐이다. 누가 교대를 기다리다 벗어 둔 것 같다.', options: [
      { id: 'bow', label: '투구를 바로 놓고 고개를 숙인다', effect: { counter: 'kind', say: '투구를 궁 쪽으로 돌려 바로 놓았다. 고개를 숙였다. 물속의 띠링이 잠깐 잦아든 것 같다.' } },
      { id: 'leave', label: '지나간다', effect: { say: '내 것이 아니다. 지나갔다.' } },
    ] },
  ],
  // 구름다리 (GD-A8, GD-A9). 글은 처음 값이다
  cliffroad: [
    { id: 'kid', text: '새끼 염소 한 마리가 바위 턱에 끼어 운다. 어미는 보이지 않는다. 턱 아래는 구름이다.', options: [
      { id: 'pull', label: '엎드려 끌어 올린다', effect: { counter: 'kind', say: '배를 깔고 손을 뻗어 뒷다리를 잡았다. 올려놓자마자 벼랑을 뛰어 올라갔다. 돌아보지 않았다.' } },
      { id: 'leave', label: '지나간다', effect: { scent: 'cloudgoat', say: '어미가 올 것이다. 지나갔다.' } },
    ] },
    { id: 'flagpole', text: '바람 깃발 하나가 깃대에 감겨 있다. 풀지 않으면 다음 사람이 바람을 못 읽는다.', options: [
      { id: 'untie', label: '깃발을 풀어 준다', effect: { counter: 'kind', say: '깃대를 타고 올라 감긴 것을 풀었다. 깃발이 펴지며 바람 쪽을 가리켰다.' } },
      { id: 'leave', label: '지나간다', effect: { say: '내 깃발이 아니다. 지나갔다.' } },
    ] },
  ],
  templeyard: [
    { id: 'kneeler', text: '뜰 구석에 순례자 하나가 무릎을 꿇은 채 굳어 있다. 돌은 아니다. 너무 오래 꿇어서 일어나지 못하는 것이다.', options: [
      { id: 'lift', label: '부축해 일으킨다', effect: { counter: 'kind', say: '겨드랑이를 받쳐 일으켰다. 무릎에서 소리가 났다. "…아직 못 들었는데." 그는 그 말만 했다.' } },
      { id: 'leave', label: '지나간다', effect: { say: '기도를 끊을 수는 없다. 지나갔다.' } },
    ] },
    { id: 'plate', text: '석상 앞의 은화 접시가 바람에 엎어졌다. 순례자들이 두고 간 은화가 판석 틈으로 굴러간다.', options: [
      { id: 'gather', label: '주워 접시에 도로 담는다', effect: { counter: 'kind', say: '한 닢씩 주워 접시에 담았다. 접시를 석상 무릎 위에 올려놓았다. 바람이 닿지 않는 자리다.' } },
      { id: 'leave', label: '지나간다', effect: { say: '내 은화가 아니다. 지나갔다.' } },
    ] },
  ],
  // 별못 (BM-A8, BM-A9). 글은 처음 값이다
  pondside: [
    { id: 'reflection', text: '못가에 아이 하나가 앉아 물에 돌을 던진다. 물수제비가 세 번 뜨고 가라앉는다. 아이가 둘레를 본다. 본 사람이 없다.', options: [
      { id: 'saw', label: '봤다고 말해 준다', effect: { counter: 'kind', say: '"세 번 떴어. 봤어." 아이가 고개를 끄덕이고 돌을 하나 더 집었다. 이번에는 이쪽을 한 번 보고 던졌다.' } },
      { id: 'leave', label: '지나간다', effect: { say: '갈 길이 멀다. 지나갔다.' } },
    ] },
    { id: 'cocoon', text: '갈대에 걸린 고치 하나가 물 쪽으로 기울었다. 안에서 무언가 움직인다. 떨어지면 젖는다.', options: [
      { id: 'tie', label: '갈대에 다시 묶어 준다', effect: { counter: 'kind', say: '갈대 두 줄기를 꼬아 고치를 받쳤다. 안에서 움직이던 것이 잠잠해졌다.' } },
      { id: 'leave', label: '지나간다', effect: { scent: 'starmoth', say: '내 고치가 아니다. 지나갔다.' } },
    ] },
  ],
  // 처음 모루 (CM-A6, CM-A7). 글은 처음 값이다
  meltgully: [
    { id: 'mold', text: '골 바닥에 쇳물이 사람 꼴로 굳어 있다. 엎드린 꼴이다. 손이 무언가를 쥐려다 만 채다.', options: [
      { id: 'cover', label: '돌을 쌓아 덮어 준다', effect: { counter: 'kind', say: '돌을 주워 하나씩 얹었다. 다 덮자 골의 쇳물이 그 둘레를 비켜 흘렀다.' } },
      { id: 'leave', label: '지나간다', effect: { say: '누구였는지 알 길이 없다. 지나갔다.' } },
    ] },
    { id: 'chisel', text: '바위에 누가 글자를 새기다 말았다. "누구든 끝까지" 다음이 없다. 정 자국이 얕다.', options: [
      { id: 'read', label: '끝까지 소리 내어 읽는다', effect: { counter: 'kind', say: '"누구든 끝까지 해내면." 뒤는 내가 아는 대로 읽었다. 골 어딘가에서 쇠가 한 번 떨었다.' } },
      { id: 'leave', label: '지나간다', effect: { say: '새기다 만 글이다. 지나갔다.' } },
    ] },
  ],
  masterroad: [
    { id: 'step', text: '디딤돌 하나가 빠져 계단이 끊겼다. 빠진 돌은 벼랑 턱에 걸려 있다. 손자국이 팬 돌이다.', options: [
      { id: 'set', label: '끌어 올려 제자리에 놓는다', effect: { counter: 'kind', say: '돌을 끌어 올려 제자리에 맞췄다. 손자국에 내 손을 대 보았다. 조금 컸다.' } },
      { id: 'leave', label: '건너뛰어 간다', effect: { say: '한 칸쯤은 뛰면 된다. 지나갔다.' } },
    ] },
  ],
  starfield: [
    { id: 'marker', text: '누운 풀 사이에 돌무더기가 있다. 별이 떨어진 날 여기 서 있던 사람의 자리라고 새겨져 있다. 돌 몇 개가 굴러 내렸다.', options: [
      { id: 'stack', label: '굴러 내린 돌을 다시 쌓는다', effect: { counter: 'kind', say: '돌을 하나씩 주워 올렸다. 맨 위에 납작한 것을 얹었다. 새긴 글이 다시 가려지지 않는다.' } },
      { id: 'leave', label: '지나간다', effect: { say: '내 돌이 아니다. 지나갔다.' } },
    ] },
    { id: 'hum', text: '구덩이 턱에 귀를 대면 밑에서 우는 소리가 또렷하다. 한 가락이다. 삼대째 같은 가락이라고들 한다.', options: [
      { id: 'listen', label: '끝까지 들어 준다', effect: { counter: 'kind', say: '가락이 한 바퀴 돌 때까지 엎드려 들었다. 끝에서 소리가 조금 떨렸다. 들은 것을 아는 것처럼.' } },
      { id: 'leave', label: '지나간다', effect: { say: '오래 들을 소리가 아니다. 지나갔다.' } },
    ] },
  ],
  icelake: [
    { id: 'crack', text: '발밑에서 얼음이 길게 운다. 금이 이쪽으로 달려온다.', options: [
      { id: 'flat', label: '엎드려 기어 나간다', effect: { say: '배를 깔고 기었다. 금은 한 뼘 옆에서 멎었다.' } },
      { id: 'run', label: '뛰어 벗어난다', effect: { hp: -12, say: '뛰다가 미끄러져 어깨로 떨어졌다. 그래도 빠지지는 않았다.' } },
    ] },
  ],
};

/**
 * 잘못 덮친 모험가를 마저 친다 (Z72). 상대는 그 들판에서 가장 센 짐승만큼이다.
 * 이기면 가진 것(장비와 은화)을 빼앗고 살인의 추억(이틀)이 붙는다. 본 사람이 없어 소문은 나지 않는다.
 * 지면 죽는다. 싸우다 달아나면 살아남은 상대가 소문을 낸다(명성 −fame). 치료비가 모자라도 고를 수 있다.
 */
export const DUEL = { hp: 1.2, attack: 1.1, xp: 2, silver: [20, 40], gear: [1, 2], fame: 20 };
export const DUEL_MOVES = [
  { id: 'slash', name: '베기', kind: 'hit', power: 1, tell: '상대가 검을 고쳐 쥔다.', say: '상대가 검을 휘둘렀다.', status: { id: 'bleed', turns: 2, chance: 0.25 }, w: 3 },
  { id: 'heavy', name: '내려치기', kind: 'charge', power: 2.1, tell: '상대가 검을 머리 위로 치켜든다.', say: '상대가 힘껏 내려쳤다.', w: 2 },
  { id: 'breath', name: '숨 고르기', kind: 'wait', power: 0, tell: '상대가 다친 어깨를 감싸 쥐고 숨을 고른다.', say: '상대가 숨을 골랐다.', w: 1 },
];

/**
 * 도적 (Z90): 지닌 은화와 찬 장비의 값(눈에 띄는 정도)이 클수록 들판의 기척이 도적일 확률이 오른다.
 * 500부터, 1000마다 1%p, 많아야 25%. 세기도 1000마다 레벨 +1.
 */
export const BANDIT = { from: 500, per: 1000, rate: 0.01, cap: 0.25, pay: 0.10, lose: 0.30, hp: 0.15, attack: 0.08, xp: 2, silver: [40, 80] };
export const BANDIT_FEEL = [
  { at: 0, text: '눈에 띄지 않는다' },
  { at: 500, text: '조금 눈에 띈다' },
  { at: 3000, text: '주머니가 두둑해 보인다' },
  { at: 10000, text: '멀리서도 보인다' },
];
export const BANDIT_NAMES = ['검은 손', '외눈', '빈 자루', '고갯마루', '마른 늑대', '쇠갈퀴'];
export const BANDIT_MOVES = [
  { id: 'stab', name: '찌르기', kind: 'hit', power: 1, tell: '도적이 칼끝을 낮춘다.', say: '도적이 찔러 왔다.', w: 3 },
  { id: 'ambush', name: '기습', kind: 'charge', power: 2.2, tell: '도적이 옆으로 돌아 들어온다.', say: '도적이 옆구리를 노리고 덮쳤다.', w: 2 },
  { id: 'pick', name: '주머니 털기', kind: 'hit', power: 0.6, steal: 0.02, tell: '도적의 눈이 허리춤을 본다.', say: '도적의 손이 허리춤을 스쳤다.', w: 1 },
];
