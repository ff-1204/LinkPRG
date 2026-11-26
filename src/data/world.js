// 가상 유저와 세계 (N6, Q1-4, F08). 혼자 하는 게임이지만 온라인 게임 속에 있는 것처럼 보이게 한다.
// 가상 유저는 씨앗과 날짜로 셈한다(저장하지 않는다). 그래서 같은 씨앗이면 같은 세계다.

/** 이름: 앞말 × 뒷말. 삼백 명 남짓. */
export const NAME_HEAD = ['밤', '쇠', '은', '달', '무쇠', '감자', '새벽', '모과', '졸린', '빨간', '구름', '도토리', '칼', '느린', '반딧', '소금', '물', '참새', '고등', '눈'];
export const NAME_TAIL = ['비노', '망치', '여우', '팽이', '할멈', '도리', '세시', '차', '곰', '장화', '과자', '묵', '국수', '우체통', '불'];
export const USER_COUNT = NAME_HEAD.length * NAME_TAIL.length; // 300

/** 성향: 무엇을 주로 하는 사람인가. 날마다 자라는 빠르기가 다르다. */
export const STYLES = {
  fighter: { name: '싸우는 사람', level: 0.55, craft: 0.05, art: 0.0, fame: 0.5 },
  maker: { name: '만드는 사람', level: 0.25, craft: 0.9, art: 0.05, fame: 0.6 },
  carver: { name: '깎는 사람', level: 0.2, craft: 0.1, art: 0.5, fame: 0.7 },
  walker: { name: '돌아다니는 사람', level: 0.4, craft: 0.1, art: 0.05, fame: 0.9 },
  idler: { name: '구경하는 사람', level: 0.12, craft: 0.02, art: 0.02, fame: 0.15 },
};
export const STYLE_ORDER = ['fighter', 'fighter', 'maker', 'carver', 'walker', 'walker', 'idler', 'idler', 'idler', 'maker'];

/** 랭킹 다섯 (N6-4). */
export const RANKS = [
  { id: 'level', name: '레벨' },
  { id: 'craft', name: '제작' },
  { id: 'art', name: '예술' },
  { id: 'fame', name: '명성' },
  { id: 'first', name: '최초 발견' },
];
export const RANK_AROUND = 2; // 내 순위 위아래로 몇 줄 (N6-5)

/**
 * 세계 최초로 칠 것들. by: 가상 유저가 스스로 찾아내는 날의 범위 [가장 이른 날, 가장 늦은 날].
 * 내가 그날보다 먼저 찾으면 내 이름으로, 아니면 그 유저의 이름으로 공지가 뜬다 (Q1-4, N6-6).
 * say: 공지 글. 히든의 이름은 찾은 사람의 공지에만 나온다.
 */
export const FIRSTS = {
  // what + name + verb로 공지 글을 만든다. name이 히든의 이름이면, 내가 아직 못 찾은 동안은 화면에 '???'로 나온다.
  'stat:endure': { by: [9, 16], what: '히든 스탯', name: '인내', verb: '세계에서 처음 얻었습니다' },
  'stat:craft': { by: [14, 24], what: '히든 스탯', name: '손재주', verb: '세계에서 처음 얻었습니다' },
  'stat:art': { by: [16, 28], what: '히든 스탯', name: '예술', verb: '세계에서 처음 얻었습니다' },
  'stat:kind': { by: [20, 34], what: '히든 스탯', name: '친화', verb: '세계에서 처음 얻었습니다' },
  'hq:favor': { by: [18, 30], what: '히든 퀘스트', name: '교관의 부탁', verb: '세계에서 처음 찾았습니다' },
  'hq:riverbed': { by: [30, 50], what: '히든 퀘스트', name: '강바닥의 낚시꾼', verb: '세계에서 처음 찾았습니다' },
  'job:oneway': { by: [26, 40], what: '히든 직업', name: '한길꾼', verb: '세계에서 처음 얻었습니다' },
  'craft:legend': { by: [12, 22], what: '', name: '', verb: '전설 장비를 세계에서 처음 만들었습니다' },
  'work:great': { by: [22, 36], what: '', name: '', verb: '대작을 세계에서 처음 깎았습니다' },
  'boss:gatekeeper': { by: [24, 38], what: '', name: '', verb: "'폐허의 문지기'를 세계에서 처음 넘었습니다" },
};

/** 가상 유저의 나날: 세계 공지에 섞여 뜨는 흔한 일들 (N6-6). {who}와 {n}이 채워진다. */
export const DAILY_NEWS = [
  "'{who}'님이 레벨 {n}이 되었습니다",
  "'{who}'님이 고급 등급 철검을 만들었습니다",
  "'{who}'님이 수작 토끼상을 깎았습니다",
  "'{who}'님이 서쪽 숲에서 성난 멧돼지를 쓰러뜨렸습니다",
  "'{who}'님이 광산에서 구리 맥을 찾았습니다",
  "'{who}'님이 의뢰 {n}개를 끝냈습니다",
];

/** 소문 (F08-03). 내 행동이 소문이 되고, 히든의 귀띔이 섞인다. 귀띔에는 숫자와 이름을 적지 않는다 (Q4-5). */
export const RUMORS_ABOUT_ME = [
  { id: 'fishdays', when: { streak: ['fish', 3] }, text: '매일 아침 낚시하는 사람이 있다더라. 사흘 내리 강가에 서 있었대.' },
  { id: 'scarecrow', when: { act: ['strike', 300] }, text: '훈련소 허수아비를 터뜨린 사람이 있다던데. 교관이 웃었다는 말도 있고.' },
  { id: 'statue', when: { statue: true }, text: '광장 받침대에 누가 조각을 올려놨더라. 아침마다 그 앞에 사람이 모여.' },
  { id: 'legend', when: { first: 'craft:legend' }, text: '대장간에서 전설이 나왔대. 자루 밑에 이름이 새겨져 있다더라.' },
  { id: 'falls', when: { falls: 3 }, text: '신전지기가 얼굴을 외운 사람이 있대. 벌써 세 번째라나.' },
  { id: 'keeper', when: { keeper: true }, text: '폐허의 큰 문이 열렸다는 말이 돈다. 누가 열었는지는 말이 다 달라.' },
  { id: 'minedays', when: { streak: ['mine', 3] }, text: '광산에서 사흘째 나오지 않는 사람이 있다더라. 조합원도 아닌데.' },
  { id: 'hitrun', when: { hitRun: true }, text: '들판에서 덤불 뒤에 숨었다가 사람을 치고 달아난 자가 있다. 이름이 \'{name}\'이라던가.' },
];
export const RUMORS_HINT = [
  { stat: 'endure', text: '같은 일만 죽어라 하는 사람한테는 뭔가 붙는다더라. 미련한 건지 대단한 건지.' },
  { stat: 'kind', text: '덫에 걸린 짐승을 풀어 주고 다니는 사람은 짐승이 먼저 알아본대.' },
  { stat: 'stealth', text: '덮치기 전에 한참 지켜보는 사냥꾼이 오래 산다더라.' },
  { stat: 'grit', text: '굶어 본 사람이 굶주림을 덜 탄대. 일부러 굶는 건 미친 짓이지만.' },
  { stat: 'charm', text: '마을 사람들 얼굴을 다 아는 사람은 말이 잘 통한대.' },
  { stat: 'luck', text: '귀한 걸 자꾸 줍는 사람은 다음에도 줍는다더라. 운도 쌓이나 봐.' },
  { stat: 'faith', text: '신전에 뭘 바치는 사람은 덜 앓는대.' },
  { stat: 'nerve', text: '저보다 큰 놈한테 덤벼서 이겨 본 사람은 겁이 없어진다더라.' },
];
export const RUMORS_WORLD = [
  '폐허에서 밤마다 소리가 난다. 망치 소리 같다는 사람도 있고, 종소리 같다는 사람도 있다.',
  '강 아래 나루에서 올라온 뱃사람이 그러는데, 거기도 요즘 알림이 이상하게 늦게 뜬대.',
  '새벽 강에는 사람 말고 다른 것도 낚시를 한다더라.',
  '대장간 주인이 그러는데, 쇠는 열두 번째 망치질에서 정해진대.',
];

// ── 경매장 (N6-1 ~ N6-3) ──
export const AUCTION_FEE = 0.05;
export const AUCTION_DAYS = [1, 3];
/** 가상 유저가 내놓는 물건의 풀. w: 나올 몫. */
/**
 * 경매장의 오늘 물건 (Z66): 게임 안의 물건에서 날마다 골라 하급·중급·상급으로 나눠 내놓는다.
 * 하급은 일반, 중급은 고급, 상급은 희귀(열에 하나는 영웅). 장비는 칸에 맞는 등급으로 나온다.
 * 상급은 사흘에 한 번쯤 비어 있다.
 */
export const LOT_TIERS = [
  { id: 'low', name: '하급', grade: 0, n: 5 },
  { id: 'mid', name: '중급', grade: 1, n: 3 },
  { id: 'high', name: '상급', grade: 2, n: 1, chance: 2 / 3, top: 0.1 },
];
/** 경매에 나오지 않는 것: 하나뿐이거나 열쇠·정체 모를 것. (퀘스트 물건·팔 수 없는 것·값 없는 것은 저절로 빠진다) */
export const LOT_GEAR_MIN = 20; // 중급·상급에 나오는 장비의 바탕 값 하한
export const LOT_SKIP = ['mistrod', 'ruinkey', 'oddknife', 'carverknife', 'assassinmask'];
/** 암살자의 가면 (Z88): 날마다 이 확률로 상급 칸에 은화 5000에 나온다. 그 값을 부르면 다른 사람에게 뺏기지 않는다. */
export const MASK_LOT = { id: 'assassinmask', chance: 0.08, price: 5000 };
/** 시작가: 제값의 60~100% (사용자 요청으로 조금 올림. 전에는 50~90%) */
export const LOT_ASK = { from: 0.6, span: 0.4 };
export const BID_SAYS = ['이건 내 거', '어 싸다', '올립니다', '양보 못 함', 'ㅎㅎ 받고 더', '이 가격이면 삼', '누구 작품이지?', '자루에 이름 있네', '끝까지 간다'];
