// 던전 (T15~T19, T22, T23). 층과 방. 지나온 방만 지도에 그려진다.
// 방 종류 여섯: 싸움(fight), 함정(trap), 잠긴 문(door), 보물(treasure), 쉼터(rest), 우두머리(boss). 그 밖은 지나는 길(hall).
// pos: 지도에 그릴 자리 [가로, 세로]. exits: 갈 수 있는 방.

/** 속성 여섯 (T23): 물 > 불 > 바람 > 땅 > 물, 빛 ↔ 어둠. 약점 1.5배, 버티는 속성 절반. */
export const ELEMENTS = ['물', '불', '바람', '땅', '빛', '어둠'];
export const BEATS = { 물: '불', 불: '바람', 바람: '땅', 땅: '물', 빛: '어둠', 어둠: '빛' };
export const WEAK_MULT = 1.5;
export const RESIST_MULT = 0.5;

export const DUNGEONS = {
  ruins: {
    id: 'ruins', name: '폐허', from: 'ruins', start: 'f1-gate',
    floors: ['지하 1층', '지하 2층', '지하 3층'],
    rooms: {
      // ── 지하 1층 ──
      'f1-gate': { floor: 0, pos: [0, 1], name: '돌문 안', kind: 'hall', exits: ['f1-hall'], exit: true, text: '계단이 끝나는 곳. 등 뒤로 바깥 빛이 조금 든다. 앞은 어둡다.' },
      'f1-hall': { floor: 0, pos: [1, 1], name: '긴 복도', kind: 'trap', exits: ['f1-gate', 'f1-forge', 'f1-store'], text: '바닥 돌 몇 개가 다른 것보다 조금 솟아 있다.',
        trap: { name: '꺼지는 바닥', dodge: { stat: 'agi', need: 11 }, disarm: { stat: 'wis', need: 10 }, dmg: 18, say: '발밑이 꺼지며 쇠꼬챙이가 솟았다.', okSay: '솟은 돌을 건너뛰었다. 등 뒤에서 바닥이 꺼졌다 닫힌다.', disarmSay: '솟은 돌 밑의 쐐기를 뽑았다. 이제 밟아도 꺼지지 않는다.' } },
      'f1-forge': { floor: 0, pos: [1, 0], name: '식은 화덕방', kind: 'fight', mon: 'spider', exits: ['f1-hall', 'f1-nook'], text: '벽을 따라 화덕이 줄지어 있다. 재는 돌처럼 굳었다.' },
      'f1-nook': { floor: 0, pos: [2, 0], name: '연장 벽장', kind: 'treasure', exits: ['f1-forge'], text: '벽장 문이 반쯤 떨어져 있다.', loot: { items: [['ironore', 4], ['redpotion', 1], ['ruinkey', 1]], silver: 25, say: '벽장 안에서 철광석 4개와 붉은 물약 하나, 은화 25닢, 그리고 못에 걸린 녹슨 열쇠 하나를 찾았다.' } },
      'f1-store': { floor: 0, pos: [2, 1], name: '쇠문 앞', kind: 'door', exits: ['f1-hall', 'f1-watch'], text: '녹슨 쇠문이 길을 막고 있다. 자물쇠는 주먹만 하다.',
        door: { name: '녹슨 쇠문', pick: 2, force: { stat: 'str', need: 15 }, key: 'ruinkey', beyond: 'f1-watch' } },
      'f1-watch': { floor: 0, pos: [3, 1], name: '망보는 방', kind: 'fight', mon: 'bat', exits: ['f1-store', 'f1-rest', 'f1-stair'], text: '천장이 높다. 위에서 무언가 부스럭거린다.' },
      'f1-rest': { floor: 0, pos: [3, 0], name: '마른 샘터', kind: 'rest', exits: ['f1-watch'], text: '말라붙은 샘 옆에 누가 피웠던 모닥불 자리가 있다. 바람이 들지 않는다.' },
      'f1-stair': { floor: 0, pos: [4, 1], name: '내려가는 계단', kind: 'hall', exits: ['f1-watch', 'f2-land'], text: '계단이 아래로 감겨 내려간다. 아래에서 쇠 우는 소리가 올라온다.' },
      // ── 지하 2층 ──
      'f2-land': { floor: 1, pos: [0, 1], name: '층계참', kind: 'hall', exits: ['f1-stair', 'f2-row'], text: '벽에 이름들이 새겨져 있다. 위층 모루에 있던 이름들과 같다.' },
      'f2-row': { floor: 1, pos: [1, 1], name: '모루가 늘어선 방', kind: 'fight', mon: 'spider', exits: ['f2-land', 'f2-vent', 'f2-chest'], text: '모루 스무 개가 두 줄로 놓여 있다. 그 사이에 바위 같은 것이 웅크리고 있다.' },
      'f2-chest': { floor: 1, pos: [1, 0], name: '쇳물 창고', kind: 'treasure', exits: ['f2-row'], text: '굳은 쇳물이 틀째로 쌓여 있다.', loot: { items: [['copperore', 5], ['ruinkey', 1]], silver: 40, say: '틀 사이에서 구리 광석 5개와 은화 40닢, 그리고 녹슨 열쇠 하나를 찾았다.' } },
      'f2-vent': { floor: 1, pos: [2, 1], name: '바람구멍 복도', kind: 'trap', exits: ['f2-row', 'f2-rest', 'f2-door'], text: '벽의 구멍마다 뜨거운 바람이 새어 나온다.',
        trap: { name: '뜨거운 바람', dodge: { stat: 'agi', need: 13 }, disarm: { stat: 'wis', need: 12 }, dmg: 24, say: '구멍에서 뜨거운 김이 뿜어져 나왔다.', okSay: '김이 멎는 틈을 세어 달려 지났다.', disarmSay: '구멍을 돌조각으로 막았다. 김이 다른 데로 샌다.' } },
      'f2-rest': { floor: 1, pos: [2, 0], name: '숙직실', kind: 'rest', exits: ['f2-vent'], text: '돌 침상 넷이 있다. 하나에는 누가 방금까지 누워 있던 것처럼 먼지가 없다.' },
      'f2-door': { floor: 1, pos: [3, 1], name: '큰 문 앞', kind: 'boss', mon: 'gatekeeper', exits: ['f2-vent', 'f3-stair'], text: '사람 키 세 배의 문. 그 앞에 쇠와 돌로 된 것이 서 있다. 이쪽을 보지 않는다. 문만 본다.' },
      // ── 지하 3층 ──
      'f3-stair': { floor: 2, pos: [0, 0], name: '문 너머 계단', kind: 'hall', exits: ['f2-door', 'f3-hall'], text: '계단 벽이 미세하게 떨린다. 소리가 가깝다.' },
      'f3-hall': { floor: 2, pos: [1, 0], name: '울리는 복도', kind: 'fight', mon: 'bat', exits: ['f3-stair', 'f3-bell'], text: '발소리가 세 번씩 되돌아온다.' },
      'f3-bell': { floor: 2, pos: [2, 0], name: '종이 있는 방', kind: 'bell', exits: ['f3-hall'], text: '방 한가운데, 집채만 한 종이 매달려 있다. 허리에 금이 가 있다. 아무도 치지 않는데 혼자 운다. 띠링, 하고.' },
    },
  },
  ship: {
    id: 'ship', name: '가라앉은 배', from: 'dock', start: 's-deck', needFlag: 'boat', needSay: '배가 있어야 갈 수 있습니다',
    floors: ['갑판', '선실'],
    rooms: {
      's-deck': { floor: 0, pos: [0, 0], name: '기운 갑판', kind: 'hall', exits: ['s-mast'], exit: true, text: '배 한 척이 모로 누워 반쯤 잠겨 있다. 내 배를 난간에 묶었다.' },
      's-mast': { floor: 0, pos: [1, 0], name: '부러진 돛대 밑', kind: 'fight', mon: 'drowned', exits: ['s-deck', 's-hatch'], text: '돛대가 갑판을 가로질러 누워 있다. 그 밑 물웅덩이가 흔들린다.' },
      's-hatch': { floor: 0, pos: [2, 0], name: '짐칸 뚜껑', kind: 'door', exits: ['s-mast', 's-hold'], text: '짐칸으로 내려가는 뚜껑에 쇠사슬이 감겨 있다.',
        door: { name: '쇠사슬 감긴 뚜껑', pick: 6, force: { stat: 'str', need: 22 }, key: 'ruinkey', beyond: 's-hold' } },
      's-hold': { floor: 1, pos: [0, 0], name: '물 찬 짐칸', kind: 'trap', exits: ['s-hatch', 's-cabin', 's-chest'], text: '허리까지 물이 찼다. 궤짝들이 떠다닌다. 바닥이 보이지 않는다.',
        trap: { name: '꺼진 바닥판', dodge: { stat: 'agi', need: 17 }, disarm: { stat: 'wis', need: 15 }, dmg: 30, say: '바닥판이 꺼지며 물속으로 빨려 들었다.', okSay: '떠다니는 궤짝을 밟고 건넜다.', disarmSay: '물결을 보고 꺼진 자리를 알아냈다. 벽을 따라 돌았다.' } },
      's-chest': { floor: 1, pos: [0, 1], name: '잠긴 궤짝들', kind: 'treasure', exits: ['s-hold'], text: '물에 잠기지 않은 선반에 궤짝 셋이 묶여 있다.', loot: { items: [['pearl', 2], ['sailcloth', 2], ['redpotion', 2]], silver: 150, say: '궤짝에서 강 진주 2알과 돛천 2필, 붉은 물약 2병, 은화 150닢을 찾았다.' } },
      's-cabin': { floor: 1, pos: [1, 0], name: '선장실', kind: 'fight', mon: 'drowned', exits: ['s-hold', 's-desk'], text: '문이 떨어져 나간 방. 의자 하나가 벽을 보고 있다. 누가 앉아 있다.' },
      's-desk': { floor: 1, pos: [2, 0], name: '선장의 책상', kind: 'treasure', exits: ['s-cabin'], text: '책상 서랍 하나만 물이 들지 않았다. 밀랍으로 봉해 놓았다.', loot: { items: [['deed', 1]], silver: 0, say: '서랍에서 밀랍에 싼 종이 한 장을 찾았다. 광맥의 옛 증서다.' } },
    },
  },
};

/** 쉼터에서 한 번 쉴 때 돌아오는 몫 (T19). */
export const REST_HEAL = 0.5;

/** 우두머리 앞에서 할 수 있는 일 (메인 2장의 길, S1). */
export const KEEPER = {
  nights: 3, // 숨은 길: 곁에서 사흘 밤을 같이 지킨다
  mend: { skill: ['smithing', 9], items: [['ironore', 10]] },
  sneak: { stat: 'agi', need: 16 },
};
