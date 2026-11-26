// 퀘스트 네 갈래의 글과 꼴 (Q1~Q4, E19~E23, S1). 글은 사용자가 읽고 고치는 자리다.
// 효과 말: bond [[사람, 점수]] · fame · silver · xp · take/give [[물건, 개수]] · title [id, 까닭] · set(이 퀘스트의 표시) · lean(+의로움/−실리)

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
  spider1: { faction: ['miners', 10], rank: 'B', name: '돌거미 1마리', by: '광부 조합', kind: 'hunt', mon: 'spider', n: 1, silver: 90, xp: 320, fame: 9, minLevel: 7, say: '바위인 줄 알고 앉았다가 셋이 다쳤다.' },
};

// ── 서브 퀘스트 ───────────────────────────────────────────
/**
 * appear: { bond: [사람, 단계] } | { fame: n } | { main: 끝낸 장 }  — 모두 채워야 나타난다
 * steps: 차례로. goal이 있으면 채워질 때 저절로 넘어가고, choices가 있으면 골라야 넘어간다.
 * choice: { id, label, need?, check?, free?(출신·칭호가 여는 대답), when?(앞에서 세운 표시), ok/fail(효과), say/failSay, end?(결말 이름) }
 */
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
};
export const SUB_ORDER = ['rod', 'ledger', 'trapped', 'vein', 'alms', 'lode'];

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
};
export const HIDDEN_ORDER = ['favor', 'riverbed'];

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
};
