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
    monsters: [{ id: 'rockhawk', w: 5 }, { id: 'passbear', w: 5 }],
    finds: [{ id: 'herb', n: 4, say: '벼랑 틈에서 약초 4포기를 캤다.' }, { id: 'copperore', n: 4, say: '굴러떨어진 바위에서 구리 광석 4개를 떼었다.' }],
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
};
