// 곳과, 그곳에서 할 수 있는 일. M1에는 시작 마을의 광장과 훈련소만 있다.

export const PHASES = ['아침', '낮', '밤'];
export const PHASE_TICKS = 50; // 한 때(아침·낮·밤)에 할 수 있는 행동 수
export const MOVE_TICKS = 5;

export const PLACES = {
  plaza: {
    id: 'plaza', name: '광장', town: '시작 마을', danger: '안전',
    room: '분수 옆에 빈 받침대가 하나 있다. 사람들이 오가며 이쪽을 힐끗 본다.',
    strip: { day: 'strip-plaza-empty', night: 'strip-plaza-empty' },
    stripAlt: '광장. 집 둘, 나무, 분수, 그리고 빈 받침대',
    users: [9, 12, 3],
    board: 'plaza',
    actions: ['look', 'board', 'rest'],
    suggest: [
      { text: '훈련소에 가서 허수아비를 쳐 본다', go: 'training' },
      { text: '광장을 둘러본다', act: 'look' },
    ],
  },
  training: {
    id: 'training', name: '훈련소', town: '시작 마을', danger: '안전',
    room: '낡은 허수아비가 줄지어 서 있다. 교관이 팔짱을 끼고 지켜본다.',
    strip: { day: 'strip-train-day', night: 'strip-train-night' },
    stripAlt: '훈련소. 오두막과 허수아비 셋, 나무 둘',
    users: [5, 4, 1],
    actions: ['strike', 'talk', 'rest'],
  },
  temple: {
    id: 'temple', name: '신전', town: '시작 마을', danger: '안전',
    room: '향 냄새가 난다. 높은 창으로 빛이 들고, 어디선가 종소리 같은 것이 길게 울린다.',
    strip: { day: 'strip-temple-day', night: 'strip-temple-night' },
    stripAlt: '신전. 돌기둥과 높은 창, 작은 종탑',
    users: [3, 4, 1],
    actions: ['pray', 'blessing', 'heal', 'bread', 'shop', 'talk', 'rest'],
  },
  forge: {
    id: 'forge', name: '대장간', town: '시작 마을', danger: '안전',
    room: '화덕이 벌겋다. 모루 옆에 망치가 놓여 있고, 주인은 풀무 너머로 이쪽을 본다.',
    strip: { day: 'strip-forge-day', night: 'strip-forge-night' },
    stripAlt: '대장간. 굴뚝에서 불티가 오르는 집과 모루',
    users: [4, 6, 2],
    actions: ['craft', 'bellows', 'shop', 'talk'],
  },
  // 예술협회 (Z80): 조각, 세공(반지), 경매장. 광장에서 옮겨 왔다. 작품은 그대로 광장 받침대에 세운다
  artguild: {
    id: 'artguild', name: '예술협회', town: '시작 마을', danger: '안전', auction: true,
    room: '천장이 높은 돌집. 벽마다 조각과 그림이 걸려 있고, 안쪽 탁자에서는 누군가 작은 반지를 다듬고 있다. 경매 게시판 앞에 사람들이 모여 있다.',
    strip: { day: 'strip-plaza-empty', night: 'strip-plaza-empty' },
    stripAlt: '예술협회. 집 둘, 나무, 분수',
    users: [6, 9, 2],
    actions: ['sculpt', 'jewel', 'auction', 'talk'],
  },
  // 의류점 (Z74): 가죽과 천을 다룬다. 바느질, 몸·발 장비 손질, 실 잣기
  tailor: {
    id: 'tailor', name: '의류점', town: '시작 마을', danger: '안전',
    room: '무두질한 가죽 냄새와 밀랍 냄새가 섞여 있다. 벽에 장화와 조끼가 걸려 있고, 재봉사는 바늘을 입에 문 채 이쪽을 본다.',
    strip: { day: 'strip-store-day', night: 'strip-store-night' },
    stripAlt: '의류점. 민트색 지붕의 가게와 나무 상자들',
    users: [3, 5, 1],
    actions: ['sew', 'spin', 'shop', 'talk'],
  },
  store: {
    id: 'store', name: '잡화점', town: '시작 마을', danger: '안전',
    room: '선반마다 물건이 빼곡하다. 저울 옆에서 주인이 장부를 넘긴다.',
    strip: { day: 'strip-store-day', night: 'strip-store-night' },
    stripAlt: '잡화점. 민트색 지붕의 가게와 나무 상자들',
    users: [5, 7, 1],
    actions: ['shop', 'sort', 'talk'],
  },
  tavern: {
    id: 'tavern', name: '주점', town: '시작 마을', danger: '안전', storage: true, merc: true,
    room: '나무 탁자에 잔 자국이 겹겹이다. 안쪽 벽에 자물쇠 달린 보관함이 줄지어 있다.',
    strip: { day: 'strip-tavern-day', night: 'strip-tavern-night' },
    stripAlt: '주점. 간판이 걸린 집과 술통 둘',
    users: [3, 6, 9],
    actions: ['room', 'storage', 'talk', 'rumor', 'rest'],
  },
  // 마을 밖. town이 저마다 달라서 방 목록으로는 못 가고, 지도로 길을 나서야 한다 (N7).
  forest: {
    id: 'forest', name: '서쪽 숲', town: '서쪽 숲', wild: true, danger: '낮음', levels: '3~6',
    room: '나무가 빽빽하다. 발밑에서 낙엽이 부서지고, 멀리서 무언가 운다.',
    strip: { day: 'strip-forest-day', night: 'strip-forest-night' },
    stripAlt: '서쪽 숲. 굵은 나무들과 덤불, 좁은 오솔길',
    users: [3, 4, 1],
    actions: ['explore', 'gather', 'rest'],
  },
  mine: {
    id: 'mine', name: '광산', town: '광산', wild: true, danger: '보통', levels: '5~8',
    room: '갱도 입구에서 찬 바람이 올라온다. 곡괭이 소리가 드문드문 울린다.',
    strip: { day: 'strip-mine-day', night: 'strip-mine-night' },
    stripAlt: '광산. 버팀목을 댄 갱도 입구와 광차',
    users: [4, 5, 2],
    actions: ['explore', 'mine', 'talk', 'rest'],
  },
  river: {
    id: 'river', name: '강가 낚시터', town: '강가 낚시터', wild: true, danger: '낮음', levels: '3',
    room: '물이 느리게 흐른다. 낚싯대 몇 개가 물가에 꽂혀 있다.',
    strip: { day: 'strip-river-day', night: 'strip-river-night' },
    stripAlt: '강가 낚시터. 갈대와 얕은 물, 낚싯대',
    users: [3, 3, 0], fire: true,
    actions: ['explore', 'fish', 'cook', 'rest'],
  },
  // 메인 퀘스트 1장이 끝나야 길이 난다 (Q1-3).
  ruins: {
    id: 'ruins', name: '폐허 입구', town: '폐허 입구', wild: true, locked: true, danger: '보통', levels: '6~9',
    lockSay: '밤마다 소리가 난다는 곳. 뜨내기에게는 길을 알려 주지 않는다',
    room: '무너진 돌문 너머로 계단이 내려간다. 바람도 없는데 어디선가 쇠 우는 소리가 난다.',
    strip: { day: 'strip-ruins-day', night: 'strip-ruins-night' },
    stripAlt: '폐허 입구. 부러진 돌기둥들과 어두운 돌문',
    users: [2, 2, 1],
    actions: ['explore', 'talk', 'rest'],
  },
  // ── 옆 마을 나루 (H3). 메인 2장이 끝나야 길이 난다. 명성은 0에서 다시 시작한다. ──
  dock: {
    id: 'dock', name: '나루터', town: '나루', danger: '안전', locked: true, lockSay: '강 아래 어딘가에 큰 나루가 있다고 한다. 뱃길을 아는 사람이 없다',
    room: '넓은 강에 배 여남은 척이 묶여 있다. 뱃사람들이 짐을 부리며 소리친다. 물비린내가 난다.',
    strip: { day: 'strip-dock-day', night: 'strip-dock-night' }, stripAlt: '나루터. 긴 나무 잔교와 돛 내린 배 둘',
    users: [14, 18, 6], actions: ['rowing', 'talk', 'rest'],
  },
  fishmarket: {
    id: 'fishmarket', name: '어시장', town: '나루', danger: '안전',
    room: '좌판마다 물 좋은 것이 누워 있다. 값을 외치는 소리가 날마다 다르다.',
    strip: { day: 'strip-market-day', night: 'strip-market-night' }, stripAlt: '어시장. 차양 친 좌판 셋과 생선 궤짝',
    users: [16, 22, 2], actions: ['shop', 'gut', 'talk'],
  },
  branch: {
    id: 'branch', name: '상단 지부', town: '나루', danger: '안전',
    room: '장부가 벽을 메웠다. 저울이 셋, 주판이 다섯. 사람들은 낮은 목소리로만 말한다.',
    strip: { day: 'strip-store-day', night: 'strip-store-night' }, stripAlt: '상단 지부. 민트색 지붕의 큰 집과 나무 상자들',
    users: [8, 10, 3], actions: ['haul', 'talk'],
  },
  shipyard: {
    id: 'shipyard', name: '배 짓는 곳', town: '나루', danger: '안전',
    room: '갈비뼈만 선 배 한 척이 받침목 위에 누워 있다. 역청 끓는 냄새가 난다.',
    strip: { day: 'strip-forge-day', night: 'strip-forge-night' }, stripAlt: '배 짓는 곳. 굴뚝에서 김이 오르는 집과 작업대',
    users: [5, 7, 1], actions: ['plane', 'boat', 'talk'],
  },
  inn: {
    id: 'inn', name: '뱃사람 주막', town: '나루', danger: '안전', storage: true,
    room: '천장에 그물과 노가 걸려 있다. 구석마다 젖은 사람들이 앉아 있다.',
    strip: { day: 'strip-tavern-day', night: 'strip-tavern-night' }, stripAlt: '뱃사람 주막. 간판이 걸린 집과 술통 둘',
    users: [6, 9, 15], actions: ['room', 'storage', 'talk', 'rumor', 'rest'],
  },
  shrine: {
    id: 'shrine', name: '작은 사당', town: '나루', danger: '안전',
    room: '강을 보고 선 돌 사당. 초 몇 자루가 바람에 눕는다. 종은 없고, 종 걸던 고리만 있다.',
    strip: { day: 'strip-temple-day', night: 'strip-temple-night' }, stripAlt: '작은 사당. 돌기둥과 작은 탑',
    users: [2, 3, 1], actions: ['pray', 'blessing', 'heal', 'offer', 'talk', 'rest'],
  },
  underbridge: {
    id: 'underbridge', name: '다리 밑', town: '나루', danger: '안전', nightOnly: true,
    room: '다리 그늘에 등불 하나. 낮에는 아무것도 없던 자리에 좌판이 깔려 있다. 얼굴을 가린 사람들이 눈으로만 인사한다.',
    strip: { day: 'strip-bridge-night', night: 'strip-bridge-night' }, stripAlt: '다리 밑. 돌다리의 그늘과 등불 하나',
    users: [0, 0, 7], actions: ['shop', 'sort', 'talk'],
  },
  // ── 도시 소리재 (H4). 메인 3장이 끝나야 길이 난다. 동네 셋. ──
  bigmarket: {
    id: 'bigmarket', name: '큰 시장', town: '소리재', part: '가운뎃동네', danger: '안전', locked: true, auction: true, lockSay: '고개 너머에 큰 도시가 있다고 한다. 종을 지은 곳이라고',
    room: '사람이 강물처럼 흐른다. 가게가 삼 층으로 쌓였고, 한가운데 경매 단이 있다. 아무도 뜨내기를 돌아보지 않는다.',
    strip: { day: 'strip-market-day', night: 'strip-market-night' }, stripAlt: '큰 시장. 차양 친 좌판 셋과 궤짝',
    users: [38, 52, 20], actions: ['shop', 'sort', 'auction', 'talk'],
  },
  craftrow: {
    id: 'craftrow', name: '장인 거리', town: '소리재', part: '가운뎃동네', danger: '안전',
    room: '골목 양쪽에서 망치, 대패, 물레 소리가 엇갈린다. 간판마다 옛 장인의 이름이 새겨져 있다.',
    strip: { day: 'strip-forge-day', night: 'strip-forge-night' }, stripAlt: '장인 거리. 굴뚝에서 불티가 오르는 집과 모루',
    users: [18, 24, 6], actions: ['craft', 'bellows', 'advance', 'talk'],
  },
  guild: {
    id: 'guild', name: '모험가 회관', town: '소리재', part: '가운뎃동네', danger: '안전', board: 'guild', merc: true,
    room: '벽 하나가 통째로 게시판이다. 쪽지에 적힌 숫자가 윗마을과 자릿수부터 다르다.',
    strip: { day: 'strip-tavern-day', night: 'strip-tavern-night' }, stripAlt: '모험가 회관. 간판이 걸린 큰 집과 통 둘',
    users: [22, 30, 14], actions: ['spar', 'board', 'talk'],
  },
  archive: {
    id: 'archive', name: '서고', town: '소리재', part: '윗동네', danger: '안전',
    room: '천장까지 책이다. 사다리가 레일 위를 구른다. 먼지에서 오래된 종이 냄새가 난다.',
    strip: { day: 'strip-temple-day', night: 'strip-temple-night' }, stripAlt: '서고. 돌기둥과 높은 창',
    users: [6, 9, 2], actions: ['search', 'talk'],
  },
  grandtemple: {
    id: 'grandtemple', name: '큰 신전', town: '소리재', part: '윗동네', danger: '안전',
    room: '기둥이 숲 같다. 여기서는 종소리를 신의 목소리라 가르친다. 하지만 이 신전에도 종은 없다.',
    strip: { day: 'strip-temple-day', night: 'strip-temple-night' }, stripAlt: '큰 신전. 돌기둥과 높은 창, 작은 탑',
    users: [12, 16, 5], actions: ['pray', 'blessing', 'heal', 'bread', 'offer', 'talk', 'rest'],
  },
  belltower: {
    id: 'belltower', name: '종루', town: '소리재', part: '윗동네', danger: '안전',
    room: '도시 한가운데, 종이 없는 종루가 서 있다. 종 걸던 들보만 하늘을 가로지른다. 옛 종지기들이 약속의 종을 지은 곳이다.',
    strip: { day: 'strip-belltower-day', night: 'strip-belltower-night' }, stripAlt: '종루. 높은 돌탑 꼭대기에 종 없이 들보만 걸려 있다',
    users: [8, 10, 3], actions: ['stairs', 'talk'],
  },
  innrow: {
    id: 'innrow', name: '여인숙 골목', town: '소리재', part: '아랫동네', danger: '안전', storage: true,
    room: '좁은 골목에 등불이 층층이 걸렸다. 창마다 다른 고장 말소리가 샌다.',
    strip: { day: 'strip-tavern-day', night: 'strip-tavern-night' }, stripAlt: '여인숙 골목. 간판이 걸린 집과 통 둘',
    users: [10, 14, 26], actions: ['room', 'storage', 'talk', 'rumor', 'rest'],
  },
  backalley: {
    id: 'backalley', name: '뒷골목', town: '소리재', part: '아랫동네', danger: '안전', needFaction: ['alley', 2],
    room: '빨랫줄이 하늘을 가린다. 문마다 누가 내다본다. 낯선 얼굴에는 길이 막히고, 낯익은 얼굴에는 문이 열린다.',
    strip: { day: 'strip-bridge-night', night: 'strip-bridge-night' }, stripAlt: '뒷골목. 돌다리 그늘과 등불 하나',
    users: [4, 5, 12], actions: ['shop', 'haul', 'talk'],
  },
  pass: {
    id: 'pass', name: '고갯길', town: '고갯길', wild: true, locked: true, opensWith: 'bigmarket', lockSay: '고개로 오르는 길을 아는 사람이 없다', danger: '높음', levels: '15~20', near: '소리재',
    room: '바위 사이로 길이 실처럼 이어진다. 바람이 사람을 민다. 아래는 보이지 않는다.',
    strip: { day: 'strip-pass-day', night: 'strip-pass-night' }, stripAlt: '고갯길. 뾰족한 바위 봉우리 사이의 좁은 길',
    users: [3, 4, 1], actions: ['explore', 'rest'],
  },
  reeds: {
    id: 'reeds', name: '갈대밭', town: '갈대밭', wild: true, locked: true, opensWith: 'dock', lockSay: '강 아래로 내려가는 길을 아는 사람이 없다', danger: '보통', levels: '9~12', near: '나루',
    room: '갈대가 키를 넘는다. 발밑이 질다. 어디선가 물 튀는 소리가 난다.',
    strip: { day: 'strip-reeds-day', night: 'strip-reeds-night' }, stripAlt: '갈대밭. 키 큰 갈대와 얕은 물',
    users: [4, 5, 2], actions: ['explore', 'gather', 'rest'],
  },
};

/** 마을들. gate: 마을로 들어올 때 닿는 곳. order: 방 목록의 차례. */
export const TOWNS = {
  '시작 마을': { gate: 'plaza', order: ['plaza', 'training', 'forge', 'tailor', 'artguild', 'store', 'tavern', 'temple'] },
  나루: { gate: 'dock', order: ['dock', 'fishmarket', 'branch', 'shipyard', 'inn', 'shrine', 'underbridge'] },
  소리재: { gate: 'bigmarket', order: ['bigmarket', 'craftrow', 'guild', 'archive', 'grandtemple', 'belltower', 'innrow', 'backalley'] },
};
export const TOWN_NAMES = ['시작 마을', '나루', '소리재'];
export const TOWN_ORDER = TOWNS['시작 마을'].order;
export const WILD_ORDER = ['forest', 'river', 'mine', 'ruins', 'reeds', 'pass'];
export const isGate = (id) => Object.values(TOWNS).some((t) => t.gate === id);
/** 마을로 돌아올 때 닿는 곳. */
export const TOWN_GATE = 'plaza';

/** 행동 정의. skill이 있으면 숙련도가 오른다. difficulty는 대상이 요구하는 등급 번호. */
export const ACTIONS = {
  strike: { id: 'strike', label: '치기', skill: 'strike', difficulty: 0, ticks: 1 },
  look: { id: 'look', label: '둘러보기', ticks: 1 },
  rest: { id: 'rest', label: '쉬기', ticks: 0, rest: true },
  talk: { id: 'talk', label: '말 걸기', ticks: 0, open: 'talk' },
  board: { id: 'board', label: '게시판', ticks: 0, open: 'board' },
  auction: { id: 'auction', label: '경매장', ticks: 0, open: 'auction' },
  rumor: { id: 'rumor', label: '소문 게시판', ticks: 0, open: 'rumor' },
  sculpt: { id: 'sculpt', label: '조각', ticks: 0, open: 'sculpt' },
  cook: { id: 'cook', label: '요리', ticks: 0, open: 'cook' },
  advance: { id: 'advance', label: '2차 전직', ticks: 0, open: 'advance' },
  // 곳마다 하는 일 (Z23): 훈련소의 치기처럼, 한 번 누르면 한 번 하고 그 숙련도가 오른다. 어려움은 그곳(level)이 정한다
  bellows: { id: 'bellows', label: '풀무질', skill: 'smithing', ticks: 1, chore: true, teach: true },
  spin: { id: 'spin', label: '실 잣기', skill: 'leather', ticks: 1, chore: true, teach: true },
  sort: { id: 'sort', label: '물건 살피기', skill: 'appraise', ticks: 1, chore: true },
  pray: { id: 'pray', label: '기도', skill: 'pray', ticks: 1, chore: true },
  rowing: { id: 'rowing', label: '노 젓기', skill: 'stamina', ticks: 1, chore: true, teach: true },
  gut: { id: 'gut', label: '생선 손질', skill: 'cooking', ticks: 1, chore: true, teach: true },
  haul: { id: 'haul', label: '짐 나르기', skill: 'haul', ticks: 1, chore: true, teach: true },
  plane: { id: 'plane', label: '대패질', skill: 'sculpting', ticks: 1, chore: true, teach: true },
  spar: { id: 'spar', label: '대련', skill: 'guard', ticks: 1, chore: true, teach: true },
  stairs: { id: 'stairs', label: '계단 오르기', skill: 'stamina', ticks: 1, chore: true },
  bread: { id: 'bread', label: '빵 받기', ticks: 1, special: 'bread', service: true },
  heal: { id: 'heal', label: '치료받기', ticks: 2, special: 'heal', service: true }, // 신전·사당: 하루 한 번 공짜로 상처를 돌본다. 낮에만 (Z50)
  blessing: { id: 'blessing', label: '축복받기', ticks: 0, special: 'blessing', service: true }, // 신전·사당: 그림자가 있으면 걷고, 없으면 가호를 받는다 (Z43)
  room: { id: 'room', label: '방 빌리기', ticks: 0, special: 'room', service: true }, // 주점·주막·여인숙: 값을 내고 제대로 잔다. 낮에도 된다 // 신전에서 하루에 하나
  search: { id: 'search', label: '기록을 찾는다', ticks: 5, special: 'search' },
  boat: { id: 'boat', label: '배를 짓는다', ticks: 0, open: 'boat' },
  offer: { id: 'offer', label: '바친다', ticks: 0, open: 'offer' },
  craft: { id: 'craft', label: '만들기', ticks: 0, open: 'craft' },
  sew: { id: 'sew', label: '바느질', ticks: 0, open: 'sew' },
  jewel: { id: 'jewel', label: '세공', ticks: 0, open: 'jewel' },
  shop: { id: 'shop', label: '상점', ticks: 0, open: 'shop' },
  storage: { id: 'storage', label: '보관함', ticks: 0, open: 'storage' },
  explore: { id: 'explore', label: '탐색', ticks: 3, wild: 'explore' },
  gather: { id: 'gather', label: '채집', ticks: 2, wild: 'gather', skill: 'gathering' },
  mine: { id: 'mine', label: '채광', ticks: 2, wild: 'gather', skill: 'mining' },
  fish: { id: 'fish', label: '낚시', ticks: 2, wild: 'gather', skill: 'fishing' },
};

export function placeById(id) {
  const p = PLACES[id];
  if (!p) throw new Error('모르는 곳: ' + id);
  return p;
}
