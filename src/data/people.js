// 마을 사람 (E26~E28, T14). 좋아하는 것·싫어하는 것과 속 스탯은 겪어 봐야 도감에 적힌다.
// stats: 눈썰미(eye, 속임에 맞섬) · 배짱(guts, 위협에 맞섬) · 고집(will, 설득에 맞섬)

/** 친밀도 다섯 단계 (E26)와 그 문턱, 그리고 값이 깎이는 몫 (E25). */
export const BONDS = [
  { name: '남', at: 0, cut: 0 },
  { name: '낯익은 사이', at: 10, cut: 0.05 },
  { name: '단골', at: 30, cut: 0.10 },
  { name: '벗', at: 70, cut: 0.15 },
  { name: '가족 같은 사이', at: 150, cut: 0.20 },
];
export const REGULAR = 2; // '단골'의 번호

export const GIFT = { like: 10, plain: 2, dislike: -5 };
export const TALK_POINT = 1; // 하루에 한 번, 이야기를 들으면

export const PEOPLE = {
  instructor: {
    id: 'instructor', name: '교관', place: 'training', stats: { eye: 12, guts: 16, will: 15 },
    likes: ['boarmeat', 'wolffang'], dislikes: ['berry'],
    hello: ['뭐냐.', '또 왔나.', '왔나. 허수아비는 저기 있다.', '왔구나. 오늘은 뭘 칠 텐가.', '네가 오면 훈련소가 조용해져서 좋다.'],
    talk: ['검은 팔로 치는 게 아니다. 발로 친다.', '허수아비를 우습게 보는 놈은 멧돼지한테 진다.', '서쪽 숲 멧돼지는 뒷발로 땅을 긁으면 온다. 그때 막아라.', '옛날엔 여기 종소리가 더 크게 들렸다고들 하지.'],
  },
  smith: {
    id: 'smith', name: '대장간 주인', place: 'forge', stats: { eye: 14, guts: 14, will: 12 },
    likes: ['copperore', 'boarmeat'], dislikes: ['crucian'],
    hello: ['쇠 살 거면 저쪽.', '또 왔나. 화덕은 비었다.', '왔나. 오늘 쇠가 좋아.', '어서 와. 자네 망치는 저기 걸어 놨네.', '왔냐. 밥은 먹었고?'],
    talk: ['쇠는 식기 전에 쳐야 한다. 사람도 그렇고.', '구리는 무르지만 거짓말을 안 한다.', '폐허에서 밤마다 쇳소리가 난다는데, 누가 두드리는 건지.', '좋은 검은 열두 번째 망치질에서 정해진다.'],
  },
  chef: {
    id: 'chef', name: '주방장', place: 'kitchen', stats: { eye: 13, guts: 13, will: 11 },
    likes: ['eel', 'salt'], dislikes: ['batwing'],
    hello: ['배고파?', '또 왔네. 솥 하나 비었어.', '왔어. 오늘은 뭘 끓여 볼까.', '어서 와. 자네 몫 국 한 그릇 떠 놨어.', '왔구나. 앉아, 간 좀 봐 줘.'],
    talk: ['소금은 마지막에. 처음부터 넣으면 고기가 질겨져.', '신전 빵은 새벽마다 내가 구워. 반죽은 밤새 재우고.', '같은 재료라도 누가 솥을 젓느냐에 따라 맛이 달라.', '나루 장어는 비싸도 값을 해.'],
  },
  artmaster: {
    id: 'artmaster', name: '협회장', place: 'artguild', stats: { eye: 17, guts: 9, will: 14 },
    likes: ['oakbranch', 'wolffang'], dislikes: ['boarmeat'],
    hello: ['구경 왔나.', '또 왔군. 오늘은 무엇을 깎을 텐가.', '왔나. 벽에 새 작품이 하나 걸렸네.', '어서 오게. 자네 자리는 늘 비워 두지.', '왔군. 자네 손을 보면 오늘 무엇이 나올지 알겠어.'],
    talk: ['작품은 깎은 사람보다 오래 남네.', '경매에서 붙는 값은 그 물건이 걸어온 길이야.', '반지는 작아서 거짓말을 못 하지. 흠 하나가 다 보여.', '광장 받침대에 세운 것은 마을 모두의 것이 되네.'],
  },
  tailor: {
    id: 'tailor', name: '재봉사', place: 'tailor', stats: { eye: 15, guts: 10, will: 13 },
    likes: ['boarhide', 'berry'], dislikes: ['batwing'],
    hello: ['치수 재러 왔어?', '또 왔네. 실밥 터진 데는 없고?', '왔어. 오늘은 가죽이 잘 들어.', '어서 와. 자네 자리 비워 뒀어.', '왔구나. 앉아, 소매부터 봐 줄게.'],
    talk: ['옷은 몸을 따라 늘어나고 줄어들어. 꿰맨 자리만 보면 누가 지었는지 알지.', '멧돼지 가죽은 억세도 오래가.', '바늘은 서두르면 손가락을 찔러.', '폐허에서 나온 천 조각을 본 적 있어. 지금은 아무도 그렇게 못 짜.'],
  },
  granny: {
    id: 'granny', name: '잡화점 할머니', place: 'artguild', stats: { eye: 16, guts: 9, will: 13 },
    likes: ['crucian', 'herb'], dislikes: ['batwing'],
    hello: ['필요한 건 선반에 다 있어요.', '아이고, 또 왔네.', '왔어? 오늘은 뭐가 필요할까.', '어서 와. 차 한잔 하고 가.', '우리 강아지 왔구나. 밥은 먹었니.'],
    talk: ['영감이 살았을 땐 아침마다 강에 나갔지. 붕어를 그렇게 좋아했어.', '약초는 바위틈 것이 제일이야.', '박쥐 날개는 가져오지 마. 보기만 해도 소름이 돋아.', '새벽 강에는 사람 말고 다른 것도 낚시를 한다더라.'],
  },
  keeper: {
    id: 'keeper', name: '주점 주인', place: 'tavern', stats: { eye: 13, guts: 12, will: 10 },
    likes: ['boarmeat', 'berry'], dislikes: ['ironore'],
    hello: ['자리는 아무 데나.', '또 보네. 뭐 마실 텐가.', '어, 왔나. 늘 앉던 자리 비었네.', '왔구먼. 한 잔은 내가 사지.', '자네 왔나. 문 닫고 얘기나 하세.'],
    talk: ['폐허에서 밤마다 소리가 난다네. 들은 사람이 한둘이 아니야.', '외상은 사람을 보고 주는 걸세.', '보관함 삯은 맡긴 날만 받네. 그게 내 장사야.', '옛날엔 큰일을 한 사람한테 종이 울렸다지. 요즘은 뭐, 다들 듣는다더군.'],
  },
  priest: {
    id: 'priest', name: '신전지기', place: 'temple', stats: { eye: 11, guts: 10, will: 17 },
    likes: ['herb', 'redpotion'], dislikes: ['wolffang'],
    hello: ['조용히.', '또 다쳤나.', '왔군. 오늘은 걸어서 왔네.', '어서 오게. 초 하나 켜 두었네.', '자네가 오면 종소리가 맑아지는 것 같네.'],
    talk: ['쓰러진 자리에 둔 것은 하루를 기다려 주네. 그 이상은 아니야.', '종소리가 어디서 나는지 묻는 사람은 드물지.', '쉬는 것도 일일세.', '약초는 늘 모자라네. 다치는 사람은 늘 넘치고.', '경매장 수수료가 들어온 날은 빵을 넉넉히 굽지.'],
  },
  foreman: {
    id: 'foreman', name: '조합장', place: 'mine', stats: { eye: 13, guts: 17, will: 16 },
    likes: ['ironore', 'riceball'], dislikes: ['redpotion'],
    hello: ['갱도는 조합원만 들어간다.', '또 왔나. 곡괭이는 챙겼고?', '왔나. 오늘은 삼 번 갱이 좋아.', '어서 오게. 자네 자리는 비워 놨네.', '왔나, 우리 식구.'],
    talk: ['광맥은 캔 사람의 것이야. 종이 쪼가리 든 사람의 것이 아니고.', '상단 놈들은 값만 알지 돌을 몰라.', '깊은 데서 우는 쇠가 나온다는 말이 있지. 본 사람은 없고.', '곡괭이는 어깨로 치는 게 아니야. 허리로 치는 거지.'],
  },
  miru: {
    id: 'miru', name: '견습 사제 미루', place: 'tavern', stats: { eye: 9, guts: 7, will: 11 },
    likes: ['berry', 'herb'], dislikes: ['wolffang'],
    hello: ['아, 안녕하세요.', '또 뵙네요.', '오셨어요? 여기 앉으세요.', '기다렸어요. 오늘은 어디 다녀오셨어요?', '오셨네요. 오늘 들은 종소리 얘기 해 드릴게요.'],
    talk: ['신전에서는 종소리가 신의 목소리래요. 그런데 왜 폐허 쪽에서 들릴까요.', '저는 아직 손 얹는 것밖에 못 해요.', '산열매를 좋아해요. 신전에서는 단 걸 안 주거든요.', '밖에 나가 보고 싶어요. 혼자서는 무섭고요.'],
  },
  ferryman: {
    id: 'ferryman', name: '늙은 뱃사공', place: 'dock', stats: { eye: 15, guts: 12, will: 13 },
    likes: ['eel', 'riceball'], dislikes: ['pearl'],
    hello: ['어디서 왔나.', '또 보네, 윗마을 양반.', '왔나. 오늘 물살이 순해.', '어서 오게. 배는 저기 매 놨네.', '자네 왔나. 노는 자네가 잡게.'],
    talk: ['이 강 바닥에는 낚시꾼 하나가 살아. 사람은 아니고.', '상단이 온 뒤로 뱃삯이 세 번 올랐지.', '저 가라앉은 배는 광맥 임자가 타고 가던 배라더군.', '요즘은 좋은 일이 있어도 한참 뒤에야 종소리가 난다고들 해.'],
  },
  fishwife: {
    id: 'fishwife', name: '어시장 아주머니', place: 'fishmarket', stats: { eye: 17, guts: 14, will: 12 },
    likes: ['salt', 'herb'], dislikes: ['crucian'],
    hello: ['살 거야 말 거야.', '또 왔네. 오늘은 장어가 좋아.', '왔어? 덤 하나 얹어 줄게.', '어서 와. 제일 좋은 건 뒤에 빼놨어.', '우리 조카 왔네. 밥 먹고 가.'],
    talk: ['값은 물때 따라가. 나도 아침에 알아.', '붕어는 가져오지 마. 여기선 그런 건 미끼야.', '상단 지부 사람들은 생선 눈을 못 봐.', '다리 밑은 밤에만 가. 낮에는 가 봐야 돌뿐이야.'],
  },
  agent: {
    id: 'agent', name: '상단 대리인', place: 'branch', stats: { eye: 18, guts: 11, will: 16 },
    likes: ['pearl', 'copperore'], dislikes: ['ironore'],
    hello: ['용건만.', '또 오셨군요. 용건은.', '오셨습니까. 차를 내오지요.', '어서 오십시오. 장부는 덮어 두지요.', '오셨군요. 문을 닫으라 이르겠습니다.'],
    talk: ['광맥은 값을 치른 사람의 것입니다. 그게 질서지요.', '조합은 캐기만 하지 팔 줄을 모릅니다.', '울림쇠라는 쇠가 있답니다. 두드리면 스스로 운다지요. 값을 매길 수 없는 물건입니다.', '진주가 있으면 가져오십시오. 값은 잘 쳐 드립니다.'],
  },
  shipwright: {
    id: 'shipwright', name: '배 목수', place: 'shipyard', stats: { eye: 13, guts: 15, will: 14 },
    likes: ['oakbranch', 'tar'], dislikes: ['salt'],
    hello: ['만지지 마.', '또 왔나. 구경은 공짜야.', '왔나. 대패 좀 잡아 볼 텐가.', '어서 오게. 자네 배 자리는 저기야.', '왔나. 오늘은 같이 못질하세.'],
    talk: ['배는 참나무 스무 개, 역청 다섯, 돛천 둘이면 한 척 나와. 품삯은 은화 백.', '가라앉은 배까지는 노 저어 반나절이야.', '소금은 가져오지 마. 못이 삭아.', '나무는 결대로 깎는 거야. 사람도 그렇고.'],
  },
  innkeeper: {
    id: 'innkeeper', name: '주막 주인', place: 'inn', stats: { eye: 14, guts: 13, will: 11 },
    likes: ['eel', 'boarmeat'], dislikes: ['tar'],
    hello: ['빈자리 앉아.', '또 왔구먼. 늘 먹던 걸로?', '왔나. 국 데워 놨네.', '어서 오게. 윗방 비워 놨어.', '자네 왔나. 오늘은 내가 한 잔 받지.'],
    talk: ['보관함은 마을마다 따로일세. 윗마을에 맡긴 건 윗마을에 있지.', '다리 밑 사람들은 신전이 못 본 척하는 사람들이야.', '뱃사람들은 종소리가 늦게 들리면 물때가 바뀐 줄 알아.', '상단 대리인은 웃을 때가 제일 무서워.'],
  },
  shrinekeeper: {
    id: 'shrinekeeper', name: '사당지기', place: 'shrine', stats: { eye: 12, guts: 9, will: 18 },
    likes: ['herb', 'pearl'], dislikes: ['eel'],
    hello: ['초는 저기 있소.', '또 오셨소.', '오셨소. 오늘은 강이 조용하오.', '어서 오시오. 자리 하나 봐 두었소.', '오셨구려. 종 고리를 같이 닦읍시다.'],
    talk: ['이 사당에도 종이 있었소. 금이 가서 내렸지. 윗물 어딘가의 큰 종에 금이 간 해였다 하오.', '바치는 것은 값이 아니라 횟수요.', '큰 신전은 소리재에 있소. 여기는 잊힌 곳이오.', '종소리가 신의 목소리라면, 요즘 신은 말이 늦소.'],
  },
  eye: {
    id: 'eye', name: '다리 밑의 눈', place: 'underbridge', stats: { eye: 19, guts: 13, will: 12 },
    likes: ['riceball', 'redpotion'], dislikes: ['pearl'],
    hello: ['…', '또 왔군.', '왔나. 앉아.', '어서 와. 등불 줄여.', '왔구나. 여긴 네 자리도 있어.'],
    talk: ['신전이 못 본 척하는 사람들이 여기 모여. 우리는 서로를 봐.', '윗마을 헌금함 아이, 어떻게 됐는지 알아. 다 알아.', '잊는 물은 싸지 않아. 잊는다는 게 원래 그래.', '소리재 뒷골목은 낯이 익어야 들여보내 줘.'],
  },
  trader: {
    id: 'trader', name: '큰 시장 상인', place: 'bigmarket', stats: { eye: 18, guts: 14, will: 15 },
    likes: ['pearl', 'sailcloth'], dislikes: ['berry'],
    hello: ['살 거 아니면 비키시오.', '또 오셨소.', '오셨소. 오늘 들어온 게 좋소.', '어서 오시오. 뒤에 따로 빼 둔 게 있소.', '오셨구려. 값은 됐고, 차나 한잔.'],
    talk: ['경매 단에서는 하루에 집 한 채 값이 오가오.', '요즘 손님들이 그러오. 큰일을 해도 알림이 한참 뒤에 온다고.', '상단 본점이 이 시장 위층이오.', '종루에 종이 걸려 있던 때를 본 사람은 이제 없소.'],
  },
  master: {
    id: 'master', name: '장인 우두머리', place: 'craftrow', stats: { eye: 17, guts: 16, will: 18 },
    likes: ['ironore', 'copperore'], dislikes: ['redpotion'],
    hello: ['구경은 저쪽.', '또 왔나.', '왔나. 손 좀 보자.', '어서 오게. 자네 자리 하나 내지.', '왔나. 오늘은 내가 배우겠네.'],
    talk: ['한 길을 스무 해 걸은 사람만 갈림길을 고를 자격이 있네. 자네들 말로는 레벨 이십이지.', '약속의 종은 이 거리 사람들 손으로 지었네. 울림쇠를 열두 번씩, 천 사람이.', '갈림길에서 고른 것은 못 물리네. 그래서 갈림길이지.', '종에 금이 간 건 쇠 탓이 아닐세. 쇠는 약속을 못 어겨.'],
  },
  clerk: {
    id: 'clerk', name: '회관 접수원', place: 'guild', stats: { eye: 15, guts: 12, will: 13 },
    likes: ['riceball', 'redpotion'], dislikes: ['torch'],
    hello: ['쪽지는 벽에서 떼세요.', '또 오셨네요.', '오셨어요. 새 쪽지 붙었어요.', '어서 오세요. 좋은 건 따로 빼놨어요.', '오셨네요! 다들 기다렸어요.'],
    talk: ['여기 의뢰는 난이도 C부터예요. 윗마을 것과는 달라요.', '용병은 여기서도 구해요. 하루 은화 육십.', '고갯길 곰은 일어서면 막으세요. 접수대에 그렇게 적혀 있어요.', '요즘 의뢰 끝냈는데 알림이 안 떴다는 사람이 많아요.'],
  },
  librarian: {
    id: 'librarian', name: '서고지기', place: 'archive', stats: { eye: 19, guts: 8, will: 17 },
    likes: ['herb', 'pearl'], dislikes: ['torch'],
    hello: ['조용히.', '또 오셨군요.', '오셨군요. 어제 보던 선반은 저쪽입니다.', '어서 오십시오. 사다리를 잡아 드리지요.', '오셨군요. 잠긴 서가의 열쇠를 드리지요.'],
    talk: ['종지기들의 기록은 흩어져 있습니다. 한 권에 다 적은 사람이 없어요.', '불은 가져오지 마십시오.', '찾는 것은 대개 열두 번째쯤 뒤진 선반에 있지요.', '옛 기록에는 띠링이라는 말이 없습니다. "답"이라고만 적혀 있지요.'],
  },
  highpriest: {
    id: 'highpriest', name: '대사제', place: 'grandtemple', stats: { eye: 14, guts: 13, will: 20 },
    likes: ['herb', 'pearl'], dislikes: ['forgetwater'],
    hello: ['기도는 저쪽에서.', '또 왔군.', '왔군. 앉게.', '어서 오게. 차를 내오라 하지.', '왔군. 자네에게는 숨길 것이 없네.'],
    talk: ['종소리는 신의 목소리일세. 그렇게 가르쳐 왔네.', '…그렇게 가르쳐 왔지. 종루에 종이 없는데도.', '견습 가운데 묻는 아이가 하나 있었네. 종소리가 어디서 나느냐고.', '신전은 답을 주는 곳이 아니라 물음을 간직하는 곳일지도 모르네.'],
  },
  heir: {
    id: 'heir', name: '종루지기 여울', place: 'belltower', stats: { eye: 13, guts: 11, will: 14 },
    likes: ['riceball', 'herb'], dislikes: ['pearl'],
    hello: ['올라가면 안 돼요.', '또 오셨네요.', '오셨어요. 오늘은 들보를 닦았어요.', '어서 오세요. 위에서 보면 고개가 다 보여요.', '오셨네요. 할머니 얘기 더 해 드릴게요.'],
    talk: ['저는 그냥 쓸어요. 할머니도, 할머니의 할머니도 여길 쓸었대요.', '종이 없는데 왜 종루를 지키느냐고들 물어요.', '할머니가 그랬어요. 종은 내려간 게 아니라 숨은 거라고.', '산열매 주먹밥 좋아해요. 위에서 먹으면 맛있어요.'],
  },
  hostess: {
    id: 'hostess', name: '여인숙 주인', place: 'innrow', stats: { eye: 16, guts: 13, will: 12 },
    likes: ['eel', 'salt'], dislikes: ['tar'],
    hello: ['방은 위층.', '또 왔네.', '왔어? 늘 쓰던 방 비었어.', '어서 와. 이불 새로 깔았어.', '왔구나. 밥부터 먹어.'],
    talk: ['보관함은 여기도 있어. 마을마다 따로인 건 알지?', '뒷골목은 아무나 못 들어가. 낯이 익어야 해.', '손님들이 그래. 요즘 알림 안 뜨지 않느냐고.', '종루지기 아이는 저 위에서 혼자 밥을 먹어.'],
  },
  elder: {
    id: 'elder', name: '뒷골목 어른', place: 'backalley', stats: { eye: 20, guts: 17, will: 15 },
    likes: ['riceball', 'eel'], dislikes: ['pearl'],
    hello: ['…', '또 왔군.', '왔나. 앉지.', '어서 와. 문 닫아.', '왔구나. 넌 우리 사람이야.'],
    talk: ['신전이 못 본 척하는 사람들이 여기 살아. 종은 우리한테도 울려. 그게 이상했지.', '다리 밑의 눈은 내 조카야.', '큰일을 해야 종이 울린다고? 여기서는 하루를 넘긴 것만으로 울린 적이 있어.', '종에 금이 간 뒤로, 우리 같은 사람들한테 먼저 안 울리기 시작했어.'],
  },
  // 퀘스트가 끝나면 떠난다(until).
  trapped: {
    id: 'trapped', name: '갇힌 이', place: 'ruins', until: 'trapped', stats: { eye: 10, guts: 8, will: 9 },
    likes: [], dislikes: [],
    hello: ['거기… 누구 있소?', '거기… 누구 있소?', '거기… 누구 있소?', '거기… 누구 있소?', '거기… 누구 있소?'],
    talk: ['어젯밤 소리를 따라 들어왔소. 망치 소리 같았는데… 사람은 없었소.', '다리에 감각이 없소.'],
  },
};

/** 사람마다 내 이름을 부르는 꼴 (Z39): [낯익은 사이·단골, 벗·가족 같은 사이]. 뜻은 core/social.js의 callName을 본다. */
export const CALLS = {
  instructor: ['dot', 'ya'], smith: ['comma', 'ya'], tailor: ['comma', 'jane'], artmaster: ['comma', 'jane'], chef: ['comma', 'ya'], granny: ['comma', 'uri'], keeper: ['comma', 'jane'], miru: ['ssi', 'ssi!'],
  priest: ['comma', 'jane'], foreman: ['comma', 'uri'], ferryman: ['comma', 'ya'], fishwife: ['comma', 'uri'], agent: ['nim', 'nim'],
  shipwright: ['comma', 'ya'], innkeeper: ['comma', 'jane'], shrinekeeper: ['yangban', 'yangban'], eye: ['dot', 'yadot'], trader: ['yangban', 'yangban'],
  master: ['comma', 'jane'], clerk: ['nim', 'ssi!'], librarian: ['nim', 'nim'], highpriest: ['comma', 'jane'], heir: ['ssi', 'ssi!'],
  hostess: ['comma', 'ya'], elder: ['dot', 'yadot'],
};

export const PEOPLE_ORDER = ['instructor', 'smith', 'tailor', 'artmaster', 'chef', 'granny', 'keeper', 'miru', 'priest', 'foreman', 'trapped', 'ferryman', 'fishwife', 'agent', 'shipwright', 'innkeeper', 'shrinekeeper', 'eye', 'trader', 'master', 'clerk', 'librarian', 'highpriest', 'heir', 'hostess', 'elder'];

export function personById(id) {
  const p = PEOPLE[id];
  if (!p) throw new Error('모르는 사람: ' + id);
  return p;
}

/** 명성 단계 (마을마다 따로). 값이 깎이는 몫과 사람들의 첫마디가 달라진다. */
export const FAME = [
  { name: '뜨내기', at: 0, cut: 0, hello: '' },
  { name: '얼굴을 아는 이', at: 10, cut: 0.02, hello: '요즘 자주 보이네.' },
  { name: '이름을 아는 이', at: 30, cut: 0.04, hello: '아, 그 사람이구먼.' },
  { name: '마을이 아는 이', at: 80, cut: 0.06, hello: '자네 얘기는 들었네.' },
  { name: '마을의 자랑', at: 200, cut: 0.08, hello: '이 마을에 자네 모르는 사람이 없지.' },
];

/**
 * 칭호 (G3-1, G3-2). 하나만 달고 마을에서만 바꾼다.
 * cut: 값이 깎이는 몫. answers: 이 칭호가 여는 대답의 이름표 (T12)
 */
export const TITLES = {
  regular: { name: '마을의 단골', effect: '시작 마을에서 사는 값 −5%', cut: 0.05, hint: '가게 사람들이 얼굴만 보고 값을 깎아 주는 이가 있다더라.' },
  scarecrow: { name: '허수아비의 벗', effect: '같은 일을 거듭할 때 숙련도 +2%', hint: '교관이 딱 한 번 웃었다는데, 누구 때문이었는지.' },
  maker: { name: '이름을 새긴 이', effect: '만든 것을 팔 때 값 +10%', hint: '칼자루 밑의 이름을 보고 값을 더 쳐 주는 상인이 있다.' },
  survivor: { name: '세 번 일어난 이', effect: '쉴 때 생명력 회복 +10%p', hint: '신전지기가 얼굴을 외운 사람이 있다더라.' },
  neighbor: { name: '이웃', effect: '이야기를 들을 때 친밀도 +1 더', hint: '마을에서 한 사람 몫을 한 이를 그렇게 부른다.' },
  assassin: { name: '암살자', effect: '들판의 기척이 모험가일 확률 +30%p', hint: '경매장에 드물게 검은 가면이 나온다더라. 값이 터무니없다고.' },
  legend: { name: '전설을 두드린 자', effect: '만든 것의 내구도 +10%', hint: '쇠가 스스로 우는 날이 있다고, 대장장이들은 말한다.' },
  helper: { name: '손 내민 이', effect: '설득 판정 +5%', hint: '돌 밑에서 나온 사람이 은인의 이름을 찾고 있다더라.' },
};
