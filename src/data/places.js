// 곳과, 그곳에서 할 수 있는 일. M1에는 시작 마을의 광장과 훈련소만 있다.

export const PHASES = ['아침', '낮', '밤'];
export const PHASE_TICKS = 50; // 한 때(아침·낮·밤)에 할 수 있는 행동 수
export const MOVE_TICKS = 5;

export const PLACES = {
  plaza: {
    id: 'plaza', name: '광장', town: '시작 마을', danger: '안전',
    room: '분수를 둘러 받침대 셋이 서 있다. 사람들이 오가며 이쪽을 힐끗 본다.',
    strip: { day: 'strip-plaza-empty', night: 'strip-plaza-empty' },
    stripAlt: '광장. 집 둘, 나무, 분수, 그리고 빈 받침대',
    users: [9, 12, 3],
    board: 'plaza',
    actions: ['look', 'board', 'exhibit', 'rest'], // 3번 칸: 전시 (Z95)
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
    users: [5, 4, 1], merc: true, // 용병은 훈련소에서 교관이 소개한다 (Z94)
    actions: ['strike', 'merc', 'talk', 'rest'],
  },
  temple: {
    id: 'temple', name: '신전', town: '시작 마을', danger: '안전', auction: true,
    room: '향 냄새가 난다. 높은 창으로 빛이 들고, 어디선가 종소리 같은 것이 길게 울린다. 문 옆 회랑에 경매 게시판이 걸려 있고, 그 앞에 사람들이 모여 있다.',
    strip: { day: 'strip-temple-day', night: 'strip-temple-night' },
    stripAlt: '신전. 돌기둥과 높은 창, 작은 종탑',
    users: [3, 4, 1],
    actions: ['pray', 'heal', 'shop', 'auction', 'talk', 'rest'], // 축복받기는 없앴다(그림자는 성수와 기도로 걷는다). 빵은 공용주방에서 (Z92). 경매장은 예술협회에서 옮겨 왔다 (Z99)
  },
  forge: {
    id: 'forge', name: '대장간', town: '시작 마을', danger: '안전',
    room: '화덕이 벌겋다. 모루 옆에 망치가 놓여 있고, 주인은 풀무 너머로 이쪽을 본다.',
    strip: { day: 'strip-forge-day', night: 'strip-forge-night' },
    stripAlt: '대장간. 굴뚝에서 불티가 오르는 집과 모루',
    users: [4, 6, 2],
    actions: ['craft', 'bellows', 'shop', 'talk'],
  },
  // 예술협회 (Z80): 조각, 세공(반지). 경매장은 신전으로 옮겼다 (Z99). 작품은 그대로 광장 받침대에 세운다
  artguild: {
    id: 'artguild', name: '예술협회', town: '시작 마을', danger: '안전',
    room: '천장이 높은 돌집. 벽마다 조각과 그림이 걸려 있고, 안쪽 탁자에서는 누군가 작은 반지를 다듬고 있다. 문 옆에는 잡화점 할머니가 저울과 선반을 옮겨 놓고 앉아 있다.',
    strip: { day: 'strip-plaza-empty', night: 'strip-plaza-empty' },
    stripAlt: '예술협회. 집 둘, 나무, 분수',
    users: [6, 9, 2],
    actions: ['jewel', 'sort', 'shop', 'sculpt', 'talk'], // 칸 순서: 세공·물건 살피기·상점·조각 (Z92, 경매장은 신전으로 Z99) // 잡화점의 상점·물건 살피기·할머니가 옮겨 왔다 (Z82)
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
  // 공용주방 (Z83): 누구나 쓰는 주방. 요리한 음식은 가방에 담긴다. 신전의 빵도 여기서 굽는다
  kitchen: {
    id: 'kitchen', name: '공용주방', town: '시작 마을', danger: '안전', kitchen: true,
    room: '긴 아궁이 셋에 솥이 걸려 있다. 아무나 와서 쓰고 가는 곳이라 냄비마다 손잡이가 닳았다. 구석에서는 신전에 보낼 빵 반죽이 부풀고 있다.',
    strip: { day: 'strip-tavern-day', night: 'strip-tavern-night' },
    stripAlt: '공용주방. 간판이 걸린 집과 통 둘',
    users: [4, 7, 2],
    actions: ['cook', 'trim', 'shop', 'bread', 'talk'], // 4번 칸: 빵 받기 (Z92)
  },
  tavern: {
    id: 'tavern', name: '주점', town: '시작 마을', danger: '안전', storage: true, // 용병 고용은 훈련소로 옮겼다 (Z94)
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
    users: [22, 30, 14], actions: ['spar', 'board', 'merc', 'talk'], // 용병 칸은 훈련소와 같은 창 (Z94)
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
  // ── 흰마루 (WM-A, 레벨 21~30). 1부의 끝을 본 뒤에야 길이 난다. 그 전에는 지도에도 나오지 않는다(secret, WM-F1). 거점 마을은 언못 ──
  icegate: {
    id: 'icegate', name: '언못 어귀', town: '언못', band: 3, danger: '안전', locked: true, secret: true, lockSay: '',
    room: '얼어붙은 못가에 집 여남은 채가 모여 있다. 굴뚝 연기가 낮게 깔리고, 문마다 눈을 쓸어 낸 자국이 있다.',
    strip: { day: 'strip-icepond-day', night: 'strip-icepond-night' }, stripAlt: '언못 어귀. 눈 덮인 지붕의 집들과 얼어붙은 못',
    users: [6, 8, 2], actions: ['look', 'talk', 'rest'],
  },
  icehole: {
    id: 'icehole', name: '얼음 낚시터', town: '언못', band: 3, danger: '안전', open: true, // open: 못 위라 몸이 데워지지 않는다 (WM-B3)
    room: '못 한가운데 얼음에 구멍들이 뚫려 있다. 구멍마다 말뚝이 하나씩 박혀 있고, 말뚝마다 임자의 표시가 새겨져 있다.',
    strip: { day: 'strip-icepond-day', night: 'strip-icepond-night' }, stripAlt: '얼음 낚시터. 얼어붙은 못과 얼음 구멍, 눈 덮인 집들',
    users: [4, 5, 1], actions: ['fish', 'talk'],
  },
  frostforge: {
    id: 'frostforge', name: '서리 대장간', town: '언못', band: 3, danger: '안전',
    room: '불을 크게 피우지 못해 화덕이 어둡다. 쇠를 차게 두드리는 소리가 짧고 맑다. 모루에 서리가 앉아 있다.',
    strip: { day: 'strip-forge-day', night: 'strip-forge-night' }, stripAlt: '서리 대장간. 굴뚝이 선 집과 모루',
    users: [3, 4, 1], actions: ['craft', 'shop', 'mend', 'plus', 'talk'],
  },
  hearth: {
    id: 'hearth', name: '화롯방 주막', town: '언못', band: 3, danger: '안전', storage: true, kitchen: true, roomFee: 30, // 방 값은 이 구간 벌이에 맞춘다 (WM-C1)
    room: '방 한가운데 화로가 있다. 벽을 따라 사람들이 둘러앉아 말없이 손을 쬔다.',
    strip: { day: 'strip-tavern-day', night: 'strip-tavern-night' }, stripAlt: '화롯방 주막. 간판이 걸린 집과 통 둘',
    users: [8, 10, 14], actions: ['room', 'storage', 'cook', 'rumor', 'talk'],
  },
  hunterhut: {
    id: 'hunterhut', name: '사냥꾼 움막', town: '언못', band: 3, danger: '안전', board: 'hut', merc: true,
    room: '서까래에 덫과 가죽이 걸려 있다. 한쪽 벽이 게시판이고, 그 밑에 창 든 사람 몇이 앉아 일거리를 기다린다.',
    strip: { day: 'strip-store-day', night: 'strip-store-night' }, stripAlt: '사냥꾼 움막. 낮은 지붕의 집과 나무 상자들',
    users: [5, 6, 2], actions: ['board', 'merc', 'sew', 'shop', 'talk'],
  },
  underbell: {
    id: 'underbell', name: '종루 아래', town: '언못', band: 3, danger: '안전',
    room: '종루가 통째로 얼음에 싸여 있다. 얼음 속에 종의 그림자가 비친다. 노인 하나가 문 앞의 눈을 쓴다.',
    strip: { day: 'strip-icetower-day', night: 'strip-icetower-night' }, stripAlt: '종루 아래. 얼음에 싸인 높은 종루와 그 속에 비치는 종',
    users: [2, 2, 1], actions: ['look', 'talk', 'pray'],
  },
  snowfield: {
    id: 'snowfield', name: '눈밭', town: '눈밭', band: 3, wild: true, cold: true, locked: true, secret: true, opensWith: 'icegate', lockSay: '', danger: '보통', levels: '21~24', near: '언못',
    room: '눈이 무릎까지 온다. 바람이 한 방향으로만 분다. 발자국은 내 것뿐이다.',
    strip: { day: 'strip-snow-day', night: 'strip-snow-night' }, stripAlt: '눈밭. 눈 덮인 언덕과 눈을 인 나무 몇 그루',
    users: [3, 4, 1], actions: ['explore', 'torch', 'rest'],
  },
  icelake: {
    id: 'icelake', name: '언 호수', town: '언 호수', band: 3, wild: true, cold: true, locked: true, secret: true, opensWith: 'icegate', lockSay: '', danger: '높음', levels: '25~28', near: '언못',
    room: '호수가 바닥까지 얼었다. 얼음 속에 검푸른 쇳덩이가 박혀 있고, 그 위를 무언가의 엄니가 긁고 간 자국이 길게 나 있다.',
    strip: { day: 'strip-icelake-day', night: 'strip-icelake-night' }, stripAlt: '언 호수. 금 간 얼음판과 솟은 얼음 기둥들',
    users: [2, 3, 1], actions: ['explore', 'dig', 'torch'],
  },
  // ── 소금벌 (SB-A, 레벨 31~40). 6장을 끝낸 뒤에야 길이 난다. 그 전에는 지도에도 나오지 않는다(secret, SB-I1). 거점 마을은 저울목 ──
  saltgate: {
    id: 'saltgate', name: '저울목 어귀', town: '저울목', band: 4, danger: '안전', locked: true, secret: true, opensWith: 'saltflat', lockSay: '',
    room: '말라붙은 바다 한가운데 장터가 서 있다. 소금 수레가 줄지어 들어오고, 천막마다 저울이 하나씩 걸려 있다.',
    strip: { day: 'strip-saltmarket-day', night: 'strip-saltmarket-night' }, stripAlt: '저울목 어귀. 줄지어 선 천막 좌판과 소금 자루',
    users: [8, 12, 5], actions: ['look', 'talk', 'rest'],
  },
  scaleyard: {
    id: 'scaleyard', name: '저울 마당', town: '저울목', band: 4, danger: '안전', market: true,
    room: '장터 한복판에 사람 키만 한 시세판이 서 있다. 분필 글씨가 날마다 지워지고 다시 적힌다. 좌판들 사이에 빈 좌판 하나가 임자를 기다린다.',
    strip: { day: 'strip-saltmarket-day', night: 'strip-saltmarket-night' }, stripAlt: '저울 마당. 줄지어 선 천막 좌판과 소금 자루',
    users: [10, 16, 6], actions: ['prices', 'shop', 'stall', 'auction', 'talk'],
  },
  saltforge: {
    id: 'saltforge', name: '소금 대장간', town: '저울목', band: 4, danger: '안전',
    room: '달군 쇠를 소금물 통에 담근다. 김이 오를 때마다 짠 내가 난다. 벽에 걸린 연장마다 흰 소금꽃이 피었다.',
    strip: { day: 'strip-forge-day', night: 'strip-forge-night' }, stripAlt: '소금 대장간. 굴뚝이 선 집과 모루',
    users: [4, 6, 2], actions: ['craft', 'shop', 'mend', 'plus', 'talk'],
  },
  wellinn: {
    id: 'wellinn', name: '우물가 주막', town: '저울목', band: 4, danger: '안전', storage: true, kitchen: true, roomFee: 50, // 방 값은 이 구간 벌이에 맞춘다 (SB-J5)
    room: '마당 한가운데 장터에 하나뿐인 우물이 있다. 두레박 옆에 돈 통이 놓여 있다. 물을 긷는 사람마다 동전 소리를 낸다.',
    strip: { day: 'strip-tavern-day', night: 'strip-tavern-night' }, stripAlt: '우물가 주막. 간판이 걸린 집과 통 둘',
    users: [8, 11, 12], actions: ['room', 'well', 'storage', 'cook', 'talk'],
  },
  barracks: {
    id: 'barracks', name: '용병 막사', town: '저울목', band: 4, danger: '안전', board: 'barracks', merc: true,
    room: '천막 안에 칼잡이들이 칼을 깔고 앉아 있다. 기둥에 일거리 쪽지가 붙어 있고, 그 옆에 밀린 삯을 적은 금이 석 줄 그어져 있다.',
    strip: { day: 'strip-store-day', night: 'strip-store-night' }, stripAlt: '용병 막사. 낮은 지붕의 집과 나무 상자들',
    users: [6, 7, 4], actions: ['board', 'merc', 'sew', 'talk'],
  },
  saltshrine: {
    id: 'saltshrine', name: '작은 사당', town: '저울목', band: 4, danger: '안전',
    room: '상단이 지어 준 사당이다. 문 옆에 향값 통이 있다. 향값을 내면 누구나 든다. 안은 뜻밖에 조용하다.',
    strip: { day: 'strip-temple-day', night: 'strip-temple-night' }, stripAlt: '작은 사당. 종루가 선 흰 건물',
    users: [3, 4, 2], actions: ['pray', 'shop', 'reborn', 'talk'],
  },
  warehouse: {
    id: 'warehouse', name: '상단 창고 앞', town: '저울목', band: 4, danger: '안전',
    room: '창고 문에 자물쇠가 셋 걸려 있다. 안에서 누가 쇠를 두드리는 것 같은 소리가 가늘게 난다.',
    strip: { day: 'strip-warehouse-day', night: 'strip-warehouse-night' }, stripAlt: '상단 창고 앞. 자물쇠가 걸린 큰 창고와 문지기 둘',
    users: [2, 3, 1], actions: ['look', 'talk'],
  },
  saltfloor: {
    id: 'saltfloor', name: '소금 바닥', town: '소금 바닥', band: 4, wild: true, dry: true, well: true, locked: true, secret: true, opensWith: 'saltflat', lockSay: '', danger: '보통', levels: '31~34', near: '저울목',
    room: '흰 바닥이 끝없이 갈라져 있다. 햇빛이 아래에서도 올라온다. 입술이 먼저 마른다.',
    strip: { day: 'strip-saltfloor-day', night: 'strip-saltfloor-night' }, stripAlt: '소금 바닥. 거북등처럼 갈라진 흰 바닥과 소금 기둥',
    users: [4, 5, 1], actions: ['explore', 'dig', 'drink'],
  },
  drychannel: {
    id: 'drychannel', name: '마른 뱃길', town: '마른 뱃길', band: 4, wild: true, dry: true, well: true, locked: true, secret: true, opensWith: 'saltflat', lockSay: '', danger: '높음', levels: '35~38', near: '저울목',
    room: '물이 흐르던 골에 배들이 엎어져 있다. 돛대마다 까마귀가 앉았다. 뱃바닥 그늘에만 바람이 든다.',
    strip: { day: 'strip-drychannel-day', night: 'strip-drychannel-night' }, stripAlt: '마른 뱃길. 마른 골에 엎어진 배들과 부러진 돛대',
    users: [2, 3, 1], actions: ['explore', 'drink', 'rest'],
  },
  // ── 잿골 (AG-A, 레벨 41~50). 7장을 끝낸 뒤에야 길이 난다. 그 전에는 지도에도 나오지 않는다(secret, AG-F1). 거점 마을은 가마골 ──
  // hot: 열기가 듣는 들판 (AG-B3). anyone: 배우지 않아도 그곳의 일을 한다(풀무 골목은 진 사람 누구나 풀무를 민다)
  kilngate: {
    id: 'kilngate', name: '가마골 어귀', town: '가마골', band: 5, danger: '안전', locked: true, secret: true, opensWith: 'ashroad', lockSay: '',
    room: '불 뿜는 산 아래 골짜기에 굴뚝이 빽빽하다. 굴뚝마다 연기가 오르고, 재가 눈처럼 내려 지붕마다 잿빛으로 쌓인다.',
    strip: { day: 'strip-kilntown-day', night: 'strip-kilntown-night' }, stripAlt: '가마골 어귀. 연기 오르는 굴뚝들과 재 쌓인 지붕',
    users: [7, 10, 4], actions: ['look', 'talk', 'rest'],
  },
  arena: {
    id: 'arena', name: '겨루기 마당', town: '가마골', band: 5, danger: '안전',
    room: '둥근 마당 둘레에 사람들이 빽빽하다. 높은 대에 검 한 자루가 걸려 있다. 누가 이길 때마다 그 검이 운다.',
    strip: { day: 'strip-arena-day', night: 'strip-arena-night' }, stripAlt: '겨루기 마당. 둥근 마당과 높은 대에 걸린 검 한 자루',
    users: [12, 18, 6], actions: ['duel', 'watch', 'talk'],
  },
  bigforge: {
    id: 'bigforge', name: '큰 대장간', town: '가마골', band: 5, danger: '안전',
    room: '모루 열둘이 두 줄로 놓였다. 모루마다 이름패가 걸려 있다. 마당에서 이긴 사람들의 이름이다. 이름패 없는 쇠는 여기서 두드리지 않는다.',
    strip: { day: 'strip-forge-day', night: 'strip-forge-night' }, stripAlt: '큰 대장간. 굴뚝이 선 집과 모루',
    users: [6, 8, 2], actions: ['craft', 'shop', 'mend', 'plus', 'talk'],
  },
  bellowsrow: {
    id: 'bellowsrow', name: '풀무 골목', town: '가마골', band: 5, danger: '안전', board: 'bellows', anyone: true,
    room: '좁은 골목에 풀무 소리만 난다. 문마다 풀무 자루가 하나씩 서 있다. 아무도 고개를 들지 않는다.',
    strip: { day: 'strip-kilntown-day', night: 'strip-kilntown-night' }, stripAlt: '풀무 골목. 연기 오르는 굴뚝들과 재 쌓인 지붕',
    users: [5, 6, 8], actions: ['bellows', 'talk', 'board'],
  },
  ashinn: {
    id: 'ashinn', name: '잿물 주막', town: '가마골', band: 5, danger: '안전', storage: true, kitchen: true, roomFee: 80, // 방 값은 이 구간 벌이에 맞춘다 (AG-G5)
    room: '재를 걸러 낸 물로 밥을 짓는다. 방 한가운데 바닥에 줄이 하나 그어져 있다. 줄 안쪽은 이긴 사람의 자리, 바깥쪽은 진 사람의 자리다.',
    strip: { day: 'strip-tavern-day', night: 'strip-tavern-night' }, stripAlt: '잿물 주막. 간판이 걸린 집과 통 둘',
    users: [8, 10, 14], actions: ['room', 'storage', 'cook', 'rumor', 'talk'],
  },
  scaleshop: {
    id: 'scaleshop', name: '비늘 가게', town: '가마골', band: 5, danger: '안전', merc: true,
    room: '도마뱀 비늘이 발처럼 줄줄이 드리워 있다. 주인은 비늘을 한 장씩 꿰어 옷을 짓는다. 불똥이 튀어도 그을리지 않는 옷이다.',
    strip: { day: 'strip-store-day', night: 'strip-store-night' }, stripAlt: '비늘 가게. 낮은 지붕의 집과 나무 상자들',
    users: [4, 5, 2], actions: ['sew', 'shop', 'merc', 'talk'],
  },
  ashslope: {
    id: 'ashslope', name: '재 비탈', town: '재 비탈', band: 5, wild: true, hot: true, locked: true, secret: true, opensWith: 'ashroad', lockSay: '', danger: '보통', levels: '41~44', near: '가마골',
    room: '재가 발목까지 쌓였다. 밟으면 속이 아직 붉다. 손에 쥔 쇠가 저 혼자 따뜻해진다.',
    strip: { day: 'strip-ashslope-day', night: 'strip-ashslope-night' }, stripAlt: '재 비탈. 재 덮인 비탈과 타다 남은 나무 그루터기',
    users: [4, 5, 1], actions: ['explore', 'dig', 'whet', 'rest'],
  },
  moltenbrook: {
    id: 'moltenbrook', name: '쇳물 내', town: '쇳물 내', band: 5, wild: true, hot: true, locked: true, secret: true, opensWith: 'ashroad', lockSay: '', danger: '높음', levels: '45~48', near: '가마골',
    room: '산에서 내려온 쇳물이 개울처럼 흐르다 굳는다. 굳은 자리마다 검붉은 덩이가 박혀 있다. 물길 위쪽, 산허리에 가마 아가리 하나가 벌겋게 열려 있다.',
    strip: { day: 'strip-moltenbrook-day', night: 'strip-moltenbrook-night' }, stripAlt: '쇳물 내. 벌건 쇳물이 흐르는 내와 산허리의 가마 아가리',
    users: [2, 3, 1], actions: ['explore', 'dig', 'whet', 'rest'],
  },
  // ── 안개늪 (AN-A, 레벨 51~60). 8장을 끝낸 뒤에야 길이 난다. 그 전에는 지도에도 나오지 않는다(secret, AN-F1). 거점 마을은 뜬마을 ──
  // fog: 안개가 듣는 들판 (AN-B3). knot: 표식 끈을 묶는 곳. 방 글은 약초꾼 오두막과 가라앉는 숲만 시안의 것이고 나머지는 처음 값이다
  floatgate: {
    id: 'floatgate', name: '뜬마을 나루', town: '뜬마을', band: 6, danger: '안전', locked: true, secret: true, opensWith: 'marshroad', lockSay: '',
    room: '물 위에 오두막들이 떠 있다. 오두막마다 밧줄로 서로 묶여 있어, 하나가 흔들리면 다 같이 흔들린다. 묶인 나룻배 몇 척에 이끼가 끼었다.',
    strip: { day: 'strip-floattown-day', night: 'strip-floattown-night' }, stripAlt: '뜬마을 나루. 물 위에 떠서 밧줄로 묶인 오두막들과 나룻배',
    users: [5, 7, 3], actions: ['look', 'talk', 'rest'],
  },
  lampbridge: {
    id: 'lampbridge', name: '등불 다리', town: '뜬마을', band: 6, danger: '안전', board: 'lamp',
    room: '마을에서 늪 쪽으로 널다리가 뻗어 있다. 기둥마다 등불 자리가 있는데 반은 꺼져 있다. 다리 끝은 안개 속으로 들어가 보이지 않는다.',
    strip: { day: 'strip-lampbridge-day', night: 'strip-lampbridge-night' }, stripAlt: '등불 다리. 늪으로 뻗은 널다리와 기둥마다 걸린 등불, 반은 꺼져 있다',
    users: [4, 5, 2], actions: ['shop', 'board', 'talk'],
  },
  herbhut: {
    id: 'herbhut', name: '약초꾼 오두막', town: '뜬마을', band: 6, danger: '안전', kitchen: true,
    room: '천장에 약초가 가득 매달려 있다. 구석에 반쯤 짠 바구니, 반쯤 깎은 노, 반쯤 쓴 장부가 쌓여 있다.',
    strip: { day: 'strip-store-day', night: 'strip-store-night' }, stripAlt: '약초꾼 오두막. 낮은 지붕의 집과 나무 상자들',
    users: [3, 4, 1], actions: ['sew', 'shop', 'cook', 'talk'],
  },
  // 뗏목 대장간 (M24-1, AN-A11): 공방을 사기 전에도 이끼쇠 장비를 짓고 고치고 강화하는 곳. 방 글은 처음 값이다
  raftforge: {
    id: 'raftforge', name: '뗏목 대장간', town: '뜬마을', band: 6, danger: '안전',
    room: '뗏목 하나에 화덕과 모루만 올려놓았다. 불을 세게 때면 뗏목이 가라앉아, 풀무질은 늘 하다 만다. 말뚝에 날을 세우다 만 낫이 줄지어 걸려 있다.',
    strip: { day: 'strip-forge-day', night: 'strip-forge-night' }, stripAlt: '뗏목 대장간. 굴뚝이 선 집과 모루',
    users: [2, 3, 1], actions: ['craft', 'shop', 'mend', 'plus', 'talk'],
  },
  marshshrine: {
    id: 'marshshrine', name: '늪 사당', town: '뜬마을', band: 6, danger: '안전',
    room: '사당이 물에 반쯤 잠겨 있다. 문 앞에 성수 독이 놓여 있고, 독 뚜껑에 이끼가 앉았다. 제단의 초는 켜다 만 것이 많다.',
    strip: { day: 'strip-temple-day', night: 'strip-temple-night' }, stripAlt: '늪 사당. 종루가 선 흰 건물',
    users: [2, 3, 1], actions: ['pray', 'shop', 'reborn', 'talk'],
  },
  // 사기 전에는 방 글과 "둘러보기"만 있다 (AN-F3). 산 뒤에는 "공방"이 생기고, 남아 있던 모루와 물레를 쓴다(AN-C5: 내가 공방에서 같은 것을 만들면 견습의 손이 두 배로 는다)
  emptyshop: {
    id: 'emptyshop', name: '빈 공방', town: '뜬마을', band: 6, danger: '안전',
    room: '모루와 물레가 그대로 남은 빈집이다. 모루 위에 치다 만 쇠가 식어 있고, 물레에는 잣다 만 실이 걸려 있다. 주인은 하다 말고 떠났다고 한다.',
    strip: { day: 'strip-forge-day', night: 'strip-forge-night' }, stripAlt: '빈 공방. 굴뚝이 선 집과 모루',
    users: [1, 1, 0], actions: ['look', 'workshop', 'craft', 'sew'],
  },
  floatinn: {
    id: 'floatinn', name: '물 위 주막', town: '뜬마을', band: 6, danger: '안전', storage: true, merc: true, roomFee: 130, // 방 값은 이 구간 벌이에 맞춘다 (AN-G5)
    room: '바닥 틈으로 물이 보인다. 다들 느리게 말하고 일찍 일어선다. 탁자마다 마시다 만 잔이 놓여 있다.',
    strip: { day: 'strip-tavern-day', night: 'strip-tavern-night' }, stripAlt: '물 위 주막. 간판이 걸린 집과 통 둘',
    users: [6, 8, 9], actions: ['room', 'storage', 'rumor', 'merc', 'talk'],
  },
  mossfield: {
    id: 'mossfield', name: '이끼 밭', town: '이끼 밭', band: 6, wild: true, fog: true, locked: true, secret: true, opensWith: 'marshroad', lockSay: '', danger: '보통', levels: '51~54', near: '뜬마을',
    room: '이끼가 발목까지 덮였다. 돌인지 이끼인지 모를 것들이 드문드문 솟아 있다. 안개가 낮게 깔려 발밑이 잘 보이지 않는다.',
    strip: { day: 'strip-mossfield-day', night: 'strip-mossfield-night' }, stripAlt: '이끼 밭. 이끼 덮인 둔덕과 낮게 깔린 안개',
    users: [3, 4, 1], actions: ['explore', 'dig', 'lamp', 'holy', 'rest'],
  },
  sunkenwood: {
    id: 'sunkenwood', name: '가라앉는 숲', town: '가라앉는 숲', band: 6, wild: true, fog: true, knot: true, locked: true, secret: true, opensWith: 'marshroad', lockSay: '', danger: '높음', levels: '55~58', near: '뜬마을',
    room: '나무들이 허리까지 물에 잠겨 있다. 안개가 한 걸음 앞을 가린다. 어디선가 불빛 하나가 따라온다.',
    strip: { day: 'strip-sunkenwood-day', night: 'strip-sunkenwood-night' }, stripAlt: '가라앉는 숲. 물에 잠긴 나무들과 안개 속의 불빛 하나',
    users: [2, 3, 1], actions: ['explore', 'knot', 'lamp', 'holy', 'rest'],
  },
  // ── 잠긴 도성 (JD-A, 레벨 61~70). 9장을 끝낸 뒤에야 물길이 난다. 그 전에는 지도에도 나오지 않는다(secret, JD-F1). 거점 마을은 지붕마을 ──
  // under: 물 아래 (JD-B3). 숨이 닳고, 짝이 온다. 방 글은 잠수꾼 조합과 잠긴 거리만 시안의 것이고 나머지는 처음 값이다
  roofgate: {
    id: 'roofgate', name: '지붕마을 선창', town: '지붕마을', band: 7, danger: '안전', locked: true, secret: true, opensWith: 'sunkenroad', lockSay: '',
    room: '물 위로 남은 기와지붕들 사이에 널을 깔아 마을을 지었다. 널 틈으로 내려다보면 옛 거리가 그대로 있다. 간판도, 수레도. 물결이 처마를 핥는다.',
    strip: { day: 'strip-rooftown-day', night: 'strip-rooftown-night' }, stripAlt: '지붕마을 선창. 물 위로 남은 기와지붕들과 그 사이에 깐 널, 묶인 배',
    users: [5, 7, 3], actions: ['look', 'talk', 'rest'],
  },
  belltop: {
    id: 'belltop', name: '종루 꼭대기', town: '지붕마을', band: 7, danger: '안전',
    room: '도성 종루의 맨 위 한 층만 물 위에 있다. 종이 걸렸던 고리가 비어 있다. 고리 밑으로 계단이 물속으로 내려간다.',
    strip: { day: 'strip-belltop-day', night: 'strip-belltop-night' }, stripAlt: '종루 꼭대기. 물 위로 솟은 종루의 맨 위층과 빈 고리',
    users: [2, 3, 1], actions: ['look', 'pray', 'talk'],
  },
  guardpost: {
    id: 'guardpost', name: '근위 막사', town: '지붕마을', band: 7, danger: '안전', board: 'guard', merc: true,
    room: '옛 근위병의 후손들이 벽을 따라 앉아 창을 닦는다. 창끝에 녹이 슬 틈이 없다. 삯을 받고 물 아래까지 따라간다.',
    strip: { day: 'strip-store-day', night: 'strip-store-night' }, stripAlt: '근위 막사. 낮은 지붕의 집과 나무 상자들',
    users: [5, 6, 3], actions: ['merc', 'board', 'talk'],
  },
  bronzeforge: {
    id: 'bronzeforge', name: '청동 대장간', town: '지붕마을', band: 7, danger: '안전',
    room: '건져 올린 청동이 문짝째, 기둥째 쌓여 있다. 그것을 다시 녹인다. 쇳물이 옛 빛깔 그대로 푸르다.',
    strip: { day: 'strip-forge-day', night: 'strip-forge-night' }, stripAlt: '청동 대장간. 굴뚝이 선 집과 모루',
    users: [3, 4, 1], actions: ['craft', 'shop', 'mend', 'plus', 'talk'],
  },
  divers: {
    id: 'divers', name: '잠수꾼 조합', town: '지붕마을', band: 7, danger: '안전', board: 'divers',
    room: '벽마다 건져 올린 것들이 걸려 있다. 깨진 그릇, 녹슨 열쇠, 그리고 뚜껑이 열리지 않은 상자들.',
    strip: { day: 'strip-store-day', night: 'strip-store-night' }, stripAlt: '잠수꾼 조합. 낮은 지붕의 집과 나무 상자들',
    users: [4, 5, 2], actions: ['shop', 'sew', 'board', 'talk'],
  },
  watershrine: {
    id: 'watershrine', name: '물가 사당', town: '지붕마을', band: 7, danger: '안전',
    room: '잠긴 종루 쪽으로 난 물가에 사당이 있다. 두레박으로 그 물을 길어 축복한다. 독마다 물이 유난히 맑고 깊다.',
    strip: { day: 'strip-temple-day', night: 'strip-temple-night' }, stripAlt: '물가 사당. 종루가 선 흰 건물',
    users: [2, 3, 1], actions: ['pray', 'shop', 'reborn', 'talk'],
  },
  boatinn: {
    id: 'boatinn', name: '뱃집 주막', town: '지붕마을', band: 7, danger: '안전', storage: true, kitchen: true, roomFee: 210, // 방 값은 이 구간 벌이에 맞춘다 (JD-G6)
    room: '배 세 척을 묶어 지은 집이다. 밤새 흔들린다. 손님들은 흔들리는 대로 잔을 든다.',
    strip: { day: 'strip-tavern-day', night: 'strip-tavern-night' }, stripAlt: '뱃집 주막. 간판이 걸린 집과 통 둘',
    users: [6, 8, 9], actions: ['room', 'storage', 'cook', 'rumor', 'talk'],
  },
  sunkenstreet: {
    id: 'sunkenstreet', name: '잠긴 거리', town: '잠긴 거리', band: 7, wild: true, under: true, locked: true, secret: true, opensWith: 'sunkenroad', lockSay: '', danger: '높음', levels: '61~64', near: '지붕마을',
    room: '기와지붕 아래로 내려서자 거리가 그대로 있다. 간판, 수레, 열린 문. 모든 것이 천천히 흔들린다.',
    strip: { day: 'strip-sunkenstreet-day', night: 'strip-sunkenstreet-night' }, stripAlt: '잠긴 거리. 물 아래의 기와집들과 흔들리는 물풀, 위에서 내려오는 빛줄기',
    users: [2, 3, 1], actions: ['explore', 'dig', 'surface', 'airbag'],
  },
  palaceyard: {
    id: 'palaceyard', name: '잠긴 궁 뜰', town: '잠긴 궁 뜰', band: 7, wild: true, under: true, locked: true, secret: true, opensWith: 'sunkenroad', lockSay: '', danger: '높음', levels: '65~68', near: '지붕마을',
    room: '궁의 담이 물풀에 덮였다. 뜰에 섬돌이 줄지어 있고, 그 위로 종 모양의 것들이 떠다닌다. 어디선가 띠링이 겹쳐 울린다.',
    strip: { day: 'strip-palaceyard-day', night: 'strip-palaceyard-night' }, stripAlt: '잠긴 궁 뜰. 물 아래의 궁 문과 섬돌, 떠다니는 종 모양의 것들',
    users: [1, 2, 1], actions: ['explore', 'dig', 'surface', 'airbag'],
  },
  // ── 구름다리 (GD-A, 레벨 71~80). 10장을 끝낸 뒤에야 산길이 난다. 그 전에는 지도에도 나오지 않는다(secret, GD-G1). 거점 마을은 다릿목 ──
  // windy: 바람이 부는 곳 (GD-B3). 방 글은 신전 문 앞과 벼랑길만 시안의 것이고 나머지는 처음 값이다
  bridgegate: {
    id: 'bridgegate', name: '다릿목 어귀', town: '다릿목', band: 8, danger: '안전', locked: true, secret: true, opensWith: 'cloudroad', lockSay: '',
    room: '두 산 사이에 긴 다리가 걸려 있다. 여기가 이쪽 끝이다. 순례자들이 줄지어 오르고, 짐꾼들이 줄지어 내려간다. 다리 밑은 구름이다.',
    strip: { day: 'strip-bridgegate-day', night: 'strip-bridgegate-night' }, stripAlt: '다릿목 어귀. 두 산 사이에 걸린 긴 다리와 그 밑의 구름',
    users: [5, 7, 3], actions: ['look', 'talk', 'rest'],
  },
  bridgemarket: {
    id: 'bridgemarket', name: '다리 장터', town: '다릿목', band: 8, danger: '안전', market: true, auction: true,
    room: '다리 위에 좌판이 늘어섰다. 온 지역의 물건이 여기를 지나간다. 짐꾼들이 등짐을 지고 좌판 사이를 오간다. 널이 발밑에서 조금씩 운다.',
    strip: { day: 'strip-bridgegate-day', night: 'strip-bridgegate-night' }, stripAlt: '다리 장터. 두 산 사이에 걸린 긴 다리와 그 밑의 구름',
    users: [8, 10, 4], actions: ['prices', 'shop', 'auction', 'caravan', 'talk'],
  },
  silverforge: {
    id: 'silverforge', name: '은 대장간', town: '다릿목', band: 8, danger: '안전',
    room: '풀무에 사람이 없다. 벼랑 쪽으로 낸 바람 구멍이 풀무를 돌린다. 모루 위의 구름은은 두드려도 소리가 높고 가볍다.',
    strip: { day: 'strip-forge-day', night: 'strip-forge-night' }, stripAlt: '은 대장간. 굴뚝이 선 집과 모루',
    users: [3, 4, 1], actions: ['craft', 'shop', 'mend', 'plus', 'talk'],
  },
  goathut: {
    id: 'goathut', name: '염소치기 움막', town: '다릿목', band: 8, danger: '안전', board: 'goat', merc: true,
    room: '벼랑에 붙여 지은 움막이다. 안에서는 염소털을 잣고, 밖에서는 북 치는 이들이 가죽을 말린다. 물레 소리와 북소리가 박자가 맞는다.',
    strip: { day: 'strip-store-day', night: 'strip-store-night' }, stripAlt: '염소치기 움막. 낮은 지붕의 집과 나무 상자들',
    users: [4, 5, 2], actions: ['sew', 'shop', 'merc', 'board', 'talk'],
  },
  templedoor: {
    id: 'templedoor', name: '신전 문 앞', town: '다릿목', band: 8, danger: '안전',
    room: '금칠한 문 앞에 사람들이 무릎을 꿇고 있다. 문은 닫혀 있다. 안에서 무언가 울리는 것 같기도 하고, 바람 소리 같기도 하다.',
    strip: { day: 'strip-temple-day', night: 'strip-temple-night' }, stripAlt: '신전 문 앞. 종루가 선 흰 건물',
    users: [6, 8, 5], actions: ['pray', 'talk', 'look'],
  },
  pilgriminn: {
    id: 'pilgriminn', name: '순례자 숙소', town: '다릿목', band: 8, danger: '안전', storage: true, kitchen: true, roomFee: 350, // 방 값은 이 구간 벌이에 맞춘다 (GD-H7)
    room: '긴 방에 자리가 쉰이다. 자리마다 담요 한 장과 나무 베개 하나. 밤새 누군가 낮게 기도한다. 아무도 시끄럽다고 하지 않는다.',
    strip: { day: 'strip-tavern-day', night: 'strip-tavern-night' }, stripAlt: '순례자 숙소. 간판이 걸린 집과 통 둘',
    users: [6, 8, 9], actions: ['room', 'storage', 'cook', 'rumor', 'talk'],
  },
  cliffroad: {
    id: 'cliffroad', name: '벼랑길', town: '벼랑길', band: 8, wild: true, windy: true, locked: true, secret: true, opensWith: 'cloudroad', lockSay: '', danger: '높음', levels: '71~74', near: '다릿목',
    room: '한쪽은 바위, 한쪽은 구름이다. 길은 사람 하나 폭이다.',
    strip: { day: 'strip-cliffroad-day', night: 'strip-cliffroad-night' }, stripAlt: '벼랑길. 바위 벼랑에 붙은 좁은 길과 바람에 날리는 깃발, 발밑의 구름',
    users: [2, 3, 1], actions: ['explore', 'dig', 'flag', 'rest'],
  },
  templeyard: {
    id: 'templeyard', name: '신전 뜰', town: '신전 뜰', band: 8, wild: true, windy: true, locked: true, secret: true, opensWith: 'cloudroad', lockSay: '', danger: '높음', levels: '75~78', near: '다릿목',
    room: '신전 담 안쪽의 넓은 뜰이다. 돌로 깎은 수도승들이 줄지어 앉아 있다. 몇은 깎은 것이 아니다. 금빛 가면 하나가 처마 밑에서 이쪽을 본다.',
    strip: { day: 'strip-templeyard-day', night: 'strip-templeyard-night' }, stripAlt: '신전 뜰. 금빛 지붕의 신전과 줄지어 앉은 돌 수도승들',
    users: [1, 2, 1], actions: ['explore', 'dig', 'pray'],
  },
  // ── 별못 (BM-A, 레벨 81~90). 11장을 끝낸 뒤에야 내려가는 길이 난다. 그 전에는 지도에도 나오지 않는다(secret, BM-G1). 거점 마을은 맞울 ──
  // mirror: 읽히는 곳 (BM-B3). 방 글은 맞울 어귀·답하는 마당·못 둘레만 시안의 것이고 나머지는 처음 값이다
  echogate: {
    id: 'echogate', name: '맞울 어귀', town: '맞울', band: 9, danger: '안전', locked: true, secret: true, opensWith: 'pondroad', lockSay: '',
    room: '둥근 못을 둘러 집들이 서 있다. 물빛이 밤에도 밝다. 집마다 문이 열려 있다.',
    strip: { day: 'strip-echogate-day', night: 'strip-echogate-night' }, stripAlt: '맞울 어귀. 둥근 못과 그 둘레에 선 집들, 문마다 새어 나오는 불빛',
    users: [3, 4, 3], actions: ['look', 'talk', 'rest'],
  },
  answeryard: {
    id: 'answeryard', name: '답하는 마당', town: '맞울', band: 9, danger: '안전', board: 'pond',
    room: '마당 여기저기서 사람들이 제 일을 한다. 그물 깁는 이, 돌 쌓는 이, 글씨 쓰는 아이. 곁에 꼭 한 사람씩 앉아 보고 있다.',
    strip: { day: 'strip-echogate-day', night: 'strip-echogate-night' }, stripAlt: '답하는 마당. 둥근 못과 그 둘레에 선 집들, 문마다 새어 나오는 불빛',
    users: [4, 5, 2], actions: ['witness', 'board', 'talk'],
  },
  starforge: {
    id: 'starforge', name: '별 대장간', town: '맞울', band: 9, danger: '안전',
    room: '밤에만 불을 땐다. 별쇠는 어두워야 빛을 보고 두드릴 수 있다. 모루 곁에 걸상이 하나 더 놓여 있다. 보는 사람이 앉는 자리다.',
    strip: { day: 'strip-forge-day', night: 'strip-forge-night' }, stripAlt: '별 대장간. 굴뚝이 선 집과 모루',
    users: [2, 2, 3], actions: ['craft', 'shop', 'mend', 'plus', 'talk'],
  },
  silkhouse: {
    id: 'silkhouse', name: '비단 집', town: '맞울', band: 9, danger: '안전', merc: true,
    room: '솥에서 나방 고치를 삶는다. 김 속에서 실이 한 올씩 올라온다. 안채에는 길손을 지켜 주는 이들이 묵는다.',
    strip: { day: 'strip-store-day', night: 'strip-store-night' }, stripAlt: '비단 집. 낮은 지붕의 집과 나무 상자들',
    users: [3, 4, 2], actions: ['sew', 'shop', 'merc', 'talk'],
  },
  pondshrine: {
    id: 'pondshrine', name: '못가 사당', town: '맞울', band: 9, danger: '안전',
    room: '종이 걸렸던 자리에 빈 틀만 있다. 틀 아래로 못물이 든다. 사당지기가 그 물을 길어 축복한다.',
    strip: { day: 'strip-temple-day', night: 'strip-temple-night' }, stripAlt: '못가 사당. 종루가 선 흰 건물',
    users: [2, 3, 2], actions: ['pray', 'shop', 'reborn', 'talk'],
  },
  pondinn: {
    id: 'pondinn', name: '못가 주막', town: '맞울', band: 9, danger: '안전', storage: true, kitchen: true, roomFee: 570, // 방 값은 이 구간 벌이에 맞춘다 (BM-H6)
    room: '창이 모두 못 쪽으로 나 있다. 밤새 누가 누구에게 "봤어"라고 말하는 소리가 난다. 낮은 소리다. 잠을 깨우지는 않는다.',
    strip: { day: 'strip-tavern-day', night: 'strip-tavern-night' }, stripAlt: '못가 주막. 간판이 걸린 집과 통 둘',
    users: [5, 6, 8], actions: ['room', 'storage', 'cook', 'rumor', 'talk'],
  },
  pondside: {
    id: 'pondside', name: '못 둘레', town: '못 둘레', band: 9, wild: true, mirror: true, locked: true, secret: true, opensWith: 'pondroad', lockSay: '', danger: '높음', levels: '81~84', near: '맞울',
    room: '못물에 비친 내가 먼저 움직인다. 나는 아직 움직이지 않았다.',
    strip: { day: 'strip-pondside-day', night: 'strip-pondside-night' }, stripAlt: '못 둘레. 밝은 못물과 물가의 갈대, 물 위를 나는 나방들',
    users: [2, 3, 2], actions: ['explore', 'dig', 'rest'],
  },
  starfield: {
    id: 'starfield', name: '별 떨어진 벌', town: '별 떨어진 벌', band: 9, wild: true, mirror: true, locked: true, secret: true, opensWith: 'pondroad', lockSay: '', danger: '높음', levels: '85~88', near: '맞울',
    room: '풀이 모두 한쪽으로 누워 있다. 그 한가운데가 꺼졌다. 구덩이 밑에서 가는 소리가 올라온다. 우는 소리 같다.',
    strip: { day: 'strip-starfield-day', night: 'strip-starfield-night' }, stripAlt: '별 떨어진 벌. 한쪽으로 누운 풀밭과 한가운데의 구덩이, 흩어진 별 조각들',
    users: [1, 2, 1], actions: ['explore', 'dig', 'rest'],
  },
  // ── 처음 모루 (CM-A, 레벨 91~100). 12장을 끝낸 뒤에야 오르는 길이 난다. 그 전에는 지도에도 나오지 않는다(secret, CM-G1). 마을도 던전도 없다 ──
  // forge: 벼리며 싸우는 곳 (CM-B3). 방 글은 시안의 것이고(일곱 천막·장인의 길은 처음 값), 띠 그림의 글은 처음 값이다
  anvilcamp: {
    id: 'anvilcamp', name: '모루 아래 야영지', town: '모루 아래 야영지', band: 10, danger: '안전', locked: true, secret: true, opensWith: 'anvilroad', lockSay: '', storage: true, fire: true,
    room: '마을이 없다. 산 아래 평평한 터에 천막 몇 채와 모닥불 하나. 여기까지 온 사람이 지은 것이다.',
    strip: { day: 'strip-anvilcamp-day', night: 'strip-anvilcamp-night' }, stripAlt: '모루 아래 야영지. 바위산 아래의 천막 몇 채와 모닥불 하나',
    users: [1, 2, 2], actions: ['look', 'rest', 'cook', 'storage'],
  },
  seventents: {
    id: 'seventents', name: '일곱 천막', town: '모루 아래 야영지', band: 10, danger: '안전', merc: true,
    room: '천막 일곱 채가 모닥불을 둘러 서 있다. 지나온 일곱 곳에서 사람들이 올라와 있다. 천막마다 그 고장의 물건이 조금씩 놓여 있다.',
    strip: { day: 'strip-anvilcamp-day', night: 'strip-anvilcamp-night' }, stripAlt: '일곱 천막. 바위산 아래의 천막 몇 채와 모닥불 하나',
    users: [1, 1, 1], actions: ['talk', 'shop', 'merc'],
  },
  firstkiln: {
    id: 'firstkiln', name: '식은 가마터', town: '모루 아래 야영지', band: 10, danger: '안전',
    room: '첫 종을 지은 가마다. 사백 년 식어 있었다. 불을 넣으면 첫쇠를 다룬다.',
    strip: { day: 'strip-forge-day', night: 'strip-forge-night' }, stripAlt: '식은 가마터. 굴뚝이 선 집과 모루',
    users: [0, 1, 0], actions: ['craft', 'mend', 'plus', 'sew'],
  },
  anvilfront: {
    id: 'anvilfront', name: '모루 앞', town: '모루 아래 야영지', band: 10, danger: '안전', forge: true,
    room: '산꼭대기의 너른 바위다. 한가운데 사람 키만 한 모루. 그 위에 아무것도 없다.',
    strip: { day: 'strip-anvilfront-day', night: 'strip-anvilfront-night' }, stripAlt: '모루 앞. 산꼭대기의 너른 바위와 그 한가운데 놓인 빈 모루, 곁에 놓인 망치',
    users: [0, 1, 0], actions: ['look', 'pray'],
  },
  meltgully: {
    id: 'meltgully', name: '쇳물 골', town: '쇳물 골', band: 10, wild: true, forge: true, locked: true, secret: true, opensWith: 'anvilroad', lockSay: '', danger: '높음', levels: '91~94', near: '모루 아래 야영지',
    room: '굳다 만 쇳물이 골을 따라 흐른다. 흐르다 멈추고, 이쪽 모양을 본뜬다.',
    strip: { day: 'strip-meltgully-day', night: 'strip-meltgully-night' }, stripAlt: '쇳물 골. 바위 골짜기를 따라 굳다 만 쇳물이 흐르는 길',
    users: [0, 1, 1], actions: ['explore', 'dig', 'rest'],
  },
  masterroad: {
    id: 'masterroad', name: '장인의 길', town: '장인의 길', band: 10, wild: true, forge: true, locked: true, secret: true, opensWith: 'anvilroad', lockSay: '', danger: '높음', levels: '95~97', near: '모루 아래 야영지',
    room: '꼭대기로 오르는 돌계단이다. 디딤돌마다 손자국이 패어 있다. 계단 가운데 손 하나가 망치를 쥐고 놓여 있다.',
    strip: { day: 'strip-meltgully-day', night: 'strip-meltgully-night' }, stripAlt: '장인의 길. 바위 골짜기를 따라 굳다 만 쇳물이 흐르는 길',
    users: [0, 1, 0], actions: ['explore', 'dig', 'rest'],
  },
};

/** 마을들. gate: 마을로 들어올 때 닿는 곳. order: 방 목록의 차례. */
export const TOWNS = {
  '시작 마을': { gate: 'plaza', order: ['plaza', 'training', 'forge', 'tailor', 'artguild', 'kitchen', 'tavern', 'temple'] },
  나루: { gate: 'dock', order: ['dock', 'fishmarket', 'branch', 'shipyard', 'inn', 'shrine', 'underbridge'] },
  소리재: { gate: 'bigmarket', order: ['bigmarket', 'craftrow', 'guild', 'archive', 'grandtemple', 'belltower', 'innrow', 'backalley'] },
  언못: { gate: 'icegate', order: ['icegate', 'icehole', 'frostforge', 'hearth', 'hunterhut', 'underbell'] },
  저울목: { gate: 'saltgate', order: ['saltgate', 'scaleyard', 'saltforge', 'wellinn', 'barracks', 'saltshrine', 'warehouse'] },
  가마골: { gate: 'kilngate', order: ['kilngate', 'arena', 'bigforge', 'bellowsrow', 'ashinn', 'scaleshop'] },
  뜬마을: { gate: 'floatgate', order: ['floatgate', 'lampbridge', 'herbhut', 'raftforge', 'marshshrine', 'emptyshop', 'floatinn'] },
  지붕마을: { gate: 'roofgate', order: ['roofgate', 'belltop', 'guardpost', 'bronzeforge', 'divers', 'watershrine', 'boatinn'] },
  다릿목: { gate: 'bridgegate', order: ['bridgegate', 'bridgemarket', 'silverforge', 'goathut', 'templedoor', 'pilgriminn'] },
  맞울: { gate: 'echogate', order: ['echogate', 'answeryard', 'starforge', 'silkhouse', 'pondshrine', 'pondinn'] },
  '모루 아래 야영지': { gate: 'anvilcamp', order: ['anvilcamp', 'seventents', 'firstkiln', 'anvilfront'] },
};
export const TOWN_NAMES = ['시작 마을', '나루', '소리재', '언못', '저울목', '가마골', '뜬마을', '지붕마을', '다릿목', '맞울', '모루 아래 야영지'];
export const TOWN_ORDER = TOWNS['시작 마을'].order;
export const WILD_ORDER = ['forest', 'river', 'mine', 'ruins', 'reeds', 'pass', 'snowfield', 'icelake', 'saltfloor', 'drychannel', 'ashslope', 'moltenbrook', 'mossfield', 'sunkenwood', 'sunkenstreet', 'palaceyard', 'cliffroad', 'templeyard', 'pondside', 'starfield', 'meltgully', 'masterroad'];
/** 흰마루로 가는 길을 여는 표 (WM-A1). 1부의 끝을 본 밤에 열린다. */
export const WHITE_GATE = 'icegate';
/** 소금벌로 가는 길을 여는 표와 그 어귀 (SB-A1). 6장을 끝내면 열린다. */
export const SALT_ROAD = 'saltflat';
export const SALT_GATE = 'saltgate';
/** 잿골로 가는 길을 여는 표와 그 어귀 (AG-A1). 7장을 끝내면 열린다. */
export const ASH_ROAD = 'ashroad';
export const ASH_GATE = 'kilngate';
/** 안개늪으로 가는 길을 여는 표와 그 어귀 (AN-A1). 8장을 끝내면 열린다. */
export const MARSH_ROAD = 'marshroad';
export const MARSH_GATE = 'floatgate';
/** 잠긴 도성으로 가는 물길을 여는 표와 그 어귀 (JD-A1). 9장을 끝내면 열린다. */
export const SUNKEN_ROAD = 'sunkenroad';
export const SUNKEN_GATE = 'roofgate';
/** 구름다리로 오르는 산길을 여는 표와 그 어귀 (GD-A1). 10장을 끝내면 열린다. 하루 길이다. */
export const CLOUD_ROAD = 'cloudroad';
export const CLOUD_GATE = 'bridgegate';
/** 별못으로 내려가는 길을 여는 표와 그 어귀 (BM-A1). 11장을 끝내면 열린다. 하루 길이다. */
export const POND_ROAD = 'pondroad';
export const POND_GATE = 'echogate';
/** 처음 모루로 오르는 길을 여는 표와 그 어귀 (CM-A1). 12장을 끝내면 열린다. 이틀 길이다. */
export const ANVIL_ROAD = 'anvilroad';
export const ANVIL_GATE = 'anvilcamp';
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
  merc: { id: 'merc', label: '용병', ticks: 0, open: 'merc' },
  mend: { id: 'mend', label: '고치기', ticks: 0, open: 'gear' }, // 서리 대장간 (WM-A4): 장비 창을 연다. 고치고 강화하는 것은 그 창에서 한 번씩
  plus: { id: 'plus', label: '강화', ticks: 0, open: 'gear' },
  torch: { id: 'torch', label: '횃불', ticks: 0, special: 'torch', service: true }, // 흰마루 들판 (WM-B3): 켜면 60번 움직이는 동안 식는 속도가 절반
  exhibit: { id: 'exhibit', label: '전시', ticks: 0, open: 'exhibit' },
  // 곳마다 하는 일 (Z23): 훈련소의 치기처럼, 한 번 누르면 한 번 하고 그 숙련도가 오른다. 어려움은 그곳(level)이 정한다
  bellows: { id: 'bellows', label: '풀무질', skill: 'smithing', ticks: 1, chore: true, teach: true },
  spin: { id: 'spin', label: '실 잣기', skill: 'leather', ticks: 1, chore: true, teach: true },
  trim: { id: 'trim', label: '재료 다듬기', skill: 'cooking', ticks: 1, chore: true, teach: true },
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
  dig: { id: 'dig', label: '캐기', ticks: 2, wild: 'gather', skill: 'mining' }, // 언 호수 (WM-A9): 얼음에 박힌 서릿쇠를 캔다
  // ── 소금벌 (SB-A, SB-H) ──
  prices: { id: 'prices', label: '시세판', ticks: 0, open: 'prices' },
  stall: { id: 'stall', label: '가게', ticks: 0, open: 'stall' }, // 좌판을 사기 전에는 칸이 없다 (SB-I3)
  reborn: { id: 'reborn', label: '다시 태어나기', ticks: 0, open: 'reborn' }, // 7장을 끝내기 전에는 칸이 없다 (SB-I4)
  well: { id: 'well', label: '물 채우기', ticks: 0, special: 'well', service: true }, // 우물가 주막: 은화 5에 가득 (SB-B3)
  drink: { id: 'drink', label: '물 마시기', ticks: 0, special: 'drink', service: true }, // 소금벌 들판: 물 주머니로 다섯 모금. 옛 우물을 찾은 곳에서는 "물 채우기"가 된다
  // ── 잿골 (AG-A, AG-E) ──
  whet: { id: 'whet', label: '숫돌', ticks: 0, special: 'whet', service: true }, // 잿골 들판: 가장 많이 닳은 쇠 장비 하나의 내구도 +20 (AG-B3)
  duel: { id: 'duel', label: '겨루기', ticks: 0, special: 'duel', service: true }, // 겨루기 마당: 하루에 한 번 (AG-C1)
  watch: { id: 'watch', label: '구경', ticks: 2, special: 'watch', service: true }, // 한 번 볼 때마다 그날 상대의 버릇 하나 (AG-C5)
  // ── 안개늪 (AN-A, AN-E) ──
  lamp: { id: 'lamp', label: '등불', ticks: 0, special: 'lamp', service: true }, // 안개늪 들판: 켜면 60번 움직이는 동안 길을 잃지 않는다 (AN-B3)
  knot: { id: 'knot', label: '표식 묶기', ticks: 1, special: 'knot', service: true }, // 가라앉는 숲: 한 번에 하나. 열 개를 묶으면 영영 길을 잃지 않는다 (AN-B3)
  holy: { id: 'holy', label: '성수', ticks: 0, special: 'holy', service: true }, // 저주가 앉았을 때만 칸이 생긴다 (AN-B1)
  workshop: { id: 'workshop', label: '공방', ticks: 0, open: 'workshop' }, // 빈 공방을 사기 전에는 칸이 없다 (AN-F3)
  // ── 잠긴 도성 (JD-A, JD-E) ──
  surface: { id: 'surface', label: '숨 쉬기', ticks: 1, special: 'surface', service: true }, // 물 위로 올라가 선창으로 돌아온다. 숨이 가득 찬다 (JD-B3)
  airbag: { id: 'airbag', label: '공기 주머니', ticks: 0, special: 'airbag', service: true }, // 물 아래에서 숨 +10 (JD-B3)
  // ── 구름다리 (GD-A, GD-F) ──
  flag: { id: 'flag', label: '깃발 보기', ticks: 0, special: 'flag', service: true }, // 벼랑길: 다음 때의 바람을 안다 (GD-B2)
  caravan: { id: 'caravan', label: '상단', ticks: 0, open: 'caravan' }, // 상단 깃발을 사기 전에는 칸이 없다 (GD-G3)
  // ── 별못 (BM-A, BM-F) ──
  witness: { id: 'witness', label: '지켜보기', ticks: 1, special: 'witness', service: true }, // 답하는 마당: 한 번 누르면 한 번 지켜본다. 일로 치지 않는다 (BM-D4)
};

export function placeById(id) {
  const p = PLACES[id];
  if (!p) throw new Error('모르는 곳: ' + id);
  return p;
}
