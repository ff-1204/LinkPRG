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
      'f2-door': { floor: 1, pos: [3, 1], name: '큰 문 앞', kind: 'boss', ask: true, mon: 'gatekeeper', // ask: 싸우기 전에 어떻게 할지 고른다(문지기)
        exits: ['f2-vent', 'f3-stair'], text: '사람 키 세 배의 문. 그 앞에 쇠와 돌로 된 것이 서 있다. 이쪽을 보지 않는다. 문만 본다.' },
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
  // ── 흰마루의 얼음 종루 (WM-A10): 종루 안 다섯 층. 지금 폐허와 같은 틀이다. 위로 오른다(up). 안은 들판처럼 몸이 식는다(cold) ──
  // 방의 글은 시안에 없어 처음 값이다
  icetower: {
    id: 'icetower', name: '얼음 종루', from: 'underbell', start: 't1-door', up: true, cold: true,
    enterLabel: '종루로 올라간다', enterSay: '얼음 틈으로 난 문을 밀고 종루 안으로 들어갔다.',
    bossDown: '파수꾼이 얼음 조각으로 흩어졌다. 흩어지면서도 얼굴은 종 쪽을 보고 있었다.', openSay: '',
    floors: ['1층', '2층', '3층', '4층', '꼭대기'],
    rooms: {
      't1-door': { floor: 0, pos: [0, 0], name: '얼음 문 안', kind: 'hall', exits: ['t1-hall'], exit: true, text: '벽도 바닥도 얼음이다. 등 뒤의 문틈으로 눈빛이 든다. 위에서 아주 낮은 떨림이 내려온다.' },
      't1-hall': { floor: 0, pos: [1, 0], name: '고드름 처마 밑', kind: 'fight', mon: 'iciclespider', exits: ['t1-door', 't1-stair'], text: '처마 안쪽으로 고드름이 발처럼 드리워 있다. 그 가운데 몇은 마디가 있다.' },
      't1-stair': { floor: 0, pos: [2, 0], name: '도는 계단 밑', kind: 'hall', exits: ['t1-hall', 't2-step'], text: '돌계단이 벽을 따라 감겨 오른다. 단마다 얼음이 한 겹 덮였다.' },
      't2-step': { floor: 1, pos: [0, 0], name: '언 계단', kind: 'trap', exits: ['t1-stair', 't2-store', 't3-loft'], text: '계단이 거울처럼 얼었다. 난간은 떨어져 나가고 없다.',
        trap: { name: '미끄러운 단', dodge: { stat: 'agi', need: 22 }, disarm: { stat: 'wis', need: 20 }, dmg: 60, say: '발이 미끄러져 계단 아래까지 굴렀다.', okSay: '벽을 짚으며 한 단씩 디뎌 올랐다.', disarmSay: '칼등으로 단마다 얼음을 긁어 발 디딜 자리를 냈다.' } },
      't2-store': { floor: 1, pos: [1, 0], name: '종지기의 창고', kind: 'treasure', exits: ['t2-step'], text: '빗자루 스무 자루가 벽에 기대 서 있다. 모두 닳았다. 선반에 무언가 얼어붙어 있다.', loot: { items: [['icekey', 1], ['torch', 2], ['redpotion', 2]], silver: 120, say: '선반의 얼음을 깨고 얼음 낀 열쇠 하나와 횃불 2개, 붉은 물약 2병, 은화 120닢을 꺼냈다.' } },
      't3-loft': { floor: 2, pos: [0, 0], name: '들보 걸린 방', kind: 'fight', mon: 'snowowl', exits: ['t2-step', 't3-rest', 't4-door'], text: '굵은 들보가 방을 가로지른다. 들보 위에 흰 것이 앉아 있다. 소리가 없다.' },
      't3-rest': { floor: 2, pos: [1, 0], name: '종지기의 쪽방', kind: 'rest', exits: ['t3-loft'], text: '작은 화로와 담요 한 장. 벽에 빗금이 빼곡하다. 날을 센 자국 같다. 세다 만 데서 끊겨 있다.' },
      't4-door': { floor: 3, pos: [0, 0], name: '얼어붙은 문 앞', kind: 'door', exits: ['t3-loft', 't4-ropes'], text: '문이 문틀째 얼었다. 자물쇠 구멍에도 얼음이 찼다.',
        door: { name: '얼어붙은 문', pick: 10, force: { stat: 'str', need: 40 }, key: 'icekey', beyond: 't4-ropes' } },
      't4-ropes': { floor: 3, pos: [1, 0], name: '종 줄이 내려온 방', kind: 'fight', mon: 'iciclespider', exits: ['t4-door', 't5-bell'], text: '천장 구멍으로 굵은 줄이 내려와 있다. 줄도 얼었다. 삼십 년 동안 아무도 당기지 않았다.' },
      't5-bell': { floor: 4, pos: [0, 0], name: '얼린 종 앞', kind: 'boss', mon: 'bellwarden', exits: ['t4-ropes'], text: '종이 얼음 속에 통째로 들어 있다. 얼음은 맑아서 종의 무늬까지 보인다. 종은 울지 않는다. 그런데 손을 대면, 안에서 무언가 답하려다 마는 것이 느껴진다.' },
    },
  },
  // ── 소금벌의 종 조각 창고 (SB-A11): 창고 안 다섯 칸. 지금 폐허와 같은 틀이다. 장터 안이라 목이 마르지 않는다 ──
  // 방의 글은 시안에 없어 처음 값이다
  shardhouse: {
    id: 'shardhouse', name: '종 조각 창고', from: 'warehouse', start: 'd1-plank',
    enterLabel: '창고로 숨어든다', enterSay: '문지기가 조각을 쥐고 조는 틈에, 뒷벽의 헐거운 널을 밀고 들어갔다.',
    bossDown: '소금 기둥이 발끝부터 무너졌다. 내밀고 있던 손이 마지막으로 떨어졌다. 손바닥은 끝까지 위를 보고 있었다.', openSay: '',
    floors: ['첫째 칸', '둘째 칸', '셋째 칸', '넷째 칸', '맨 안쪽'],
    rooms: {
      'd1-plank': { floor: 0, pos: [0, 0], name: '헐거운 널 안', kind: 'hall', exits: ['d1-sacks'], exit: true, text: '소금 자루가 천장까지 쌓여 있다. 등 뒤의 널 틈으로 장터 소리가 가늘게 든다. 안쪽에서 쇠 두드리는 소리가 난다.' },
      'd1-sacks': { floor: 0, pos: [1, 0], name: '소금 자루 사이', kind: 'fight', mon: 'saltscorpion', exits: ['d1-plank', 'd2-scale'], text: '자루 하나가 터져 소금이 흘러 있다. 흐른 소금 위로 무언가 지나간 줄이 나 있다.' },
      'd2-scale': { floor: 1, pos: [0, 0], name: '큰 저울 앞', kind: 'trap', exits: ['d1-sacks', 'd2-ledger', 'd3-guard'], text: '길 한가운데 사람이 올라설 만한 저울이 놓여 있다. 한쪽 접시가 바닥에 닿아 있다. 돌아갈 틈이 없다.',
        trap: { name: '사람 다는 저울', dodge: { stat: 'agi', need: 32 }, disarm: { stat: 'wis', need: 28 }, dmg: 90, say: '접시를 밟자 추가 떨어졌다. 맞은편 접시가 올라오며 턱을 쳤다.', okSay: '접시가 기울기 전에 가장자리를 밟고 건너뛰었다.', disarmSay: '맞은편 접시에 소금 자루 하나를 올려 저울을 눌러 놓았다.' } },
      'd2-ledger': { floor: 1, pos: [1, 0], name: '장부 넣는 칸', kind: 'treasure', exits: ['d2-scale'], text: '장부가 벽 한 면이다. 장마다 이름과 값이 적혀 있다. 누가 무엇을 해냈는지가 아니라, 누가 얼마를 냈는지다.', loot: { items: [['shardkey', 1], ['waterpouch', 2], ['redpotion', 2]], silver: 240, say: '장부 뒤에서 셋째 자물쇠의 열쇠 하나와 물 주머니 2개, 붉은 물약 2병, 은화 240닢을 꺼냈다.' } },
      'd3-guard': { floor: 2, pos: [0, 0], name: '저울꾼의 자리', kind: 'fight', mon: 'weigher', exits: ['d2-scale', 'd3-cot', 'd4-lock'], text: '책상 하나에 저울 하나. 앉아 있던 사람이 고개를 든다. 접시 하나가 비어 있다.' },
      'd3-cot': { floor: 2, pos: [1, 0], name: '문지기의 쪽잠 자리', kind: 'rest', exits: ['d3-guard'], text: '자루를 깔아 만든 잠자리. 머리맡에 물 한 사발이 있다. 사발 밑에 값을 적은 쪽지가 눌려 있다.' },
      'd4-lock': { floor: 3, pos: [0, 0], name: '셋째 자물쇠 앞', kind: 'door', exits: ['d3-guard', 'd4-shelf'], text: '안쪽 문에 자물쇠가 하나 더 있다. 밖의 둘보다 크다. 쇠 두드리는 소리가 바로 이 너머다.',
        door: { name: '셋째 자물쇠', pick: 14, force: { stat: 'str', need: 56 }, key: 'shardkey', beyond: 'd4-shelf' } },
      'd4-shelf': { floor: 3, pos: [1, 0], name: '조각 선반', kind: 'fight', mon: 'weigher', exits: ['d4-lock', 'd5-pillar'], text: '선반마다 쇳조각이 하나씩 놓여 있다. 조각마다 값이 붙어 있다. 조각끼리 서로 부딪치려는 듯 떨고 있다. 그 소리였다.' },
      'd5-pillar': { floor: 4, pos: [0, 0], name: '소금 기둥 앞', kind: 'boss', mon: 'taxcollector', exits: ['d4-shelf'], text: '맨 안쪽은 천장이 높다. 조각 일곱이 놓일 받침이 둥글게 서 있고, 그 한가운데 소금 기둥이 서 있다.' },
    },
  },
  // ── 잿골의 식지 않는 가마 (AG-A10): 가마 안 다섯 칸. 지금 폐허와 같은 틀이다. 안은 들판처럼 열기가 듣는다(hot, AG-B3) ──
  // 방의 글은 시안에 없어 처음 값이다
  kiln: {
    id: 'kiln', name: '식지 않는 가마', from: 'moltenbrook', start: 'k1-mouth', hot: true,
    enterLabel: '가마로 들어간다', enterSay: '쇳물이 흘러나오는 가마 아가리로 몸을 굽혀 들어갔다. 손에 쥔 쇠가 금세 뜨거워진다.',
    bossDown: '망치가 자루째 부러졌다. 자루를 쥐고 있던 뜨거운 것은 흩어지고, 망치 머리만 모루 위에 떨어져 한 번 울렸다.', openSay: '',
    floors: ['첫째 칸', '둘째 칸', '셋째 칸', '넷째 칸', '맨 안쪽'],
    rooms: {
      'k1-mouth': { floor: 0, pos: [0, 0], name: '가마 아가리 안', kind: 'hall', exits: ['k1-flue'], exit: true, text: '벽돌이 유리처럼 녹아 번들거린다. 등 뒤의 아가리로 재 섞인 바람이 든다. 안쪽에서 쇠를 치는 소리가 난다. 한 번, 쉬고, 한 번.' },
      'k1-flue': { floor: 0, pos: [1, 0], name: '불길 지나는 굴', kind: 'fight', mon: 'sparkbat', exits: ['k1-mouth', 'k2-grate'], text: '천장의 구멍으로 불똥이 쏟아져 내린다. 바닥에 닿기 전에 몇은 날개를 편다.' },
      'k2-grate': { floor: 1, pos: [0, 0], name: '달군 쇠살 위', kind: 'trap', exits: ['k1-flue', 'k2-rack', 'k3-bench'], text: '바닥이 통째로 쇠살이다. 살 사이로 아래의 불이 보인다. 몇 가닥은 벌겋고 몇 가닥은 검다. 돌아갈 길이 없다.',
        trap: { name: '달군 쇠살', dodge: { stat: 'agi', need: 42 }, disarm: { stat: 'wis', need: 36 }, dmg: 130, say: '검은 살인 줄 알고 밟았다. 속은 벌겠다. 신발 바닥이 탔다.', okSay: '검은 살만 골라 디디며 건너뛰었다.', disarmSay: '불길이 숨 쉬는 박자를 세었다. 벌건 살이 식는 틈에 재를 뿌려 길을 냈다.' } },
      'k2-rack': { floor: 1, pos: [1, 0], name: '연장 걸이', kind: 'treasure', exits: ['k2-grate'], text: '벽에 집게와 정과 망치가 줄지어 걸려 있다. 자루마다 이름이 새겨져 있다. 이름 위에 줄이 그어진 것이 많다. 진 사람들의 것이다.', loot: { items: [['kilnkey', 1], ['whetstone', 2], ['redpotion', 2]], silver: 400, say: '걸이 밑에서 가마 문의 쇠지레 하나와 숫돌 2개, 붉은 물약 2병, 은화 400닢을 찾았다.' } },
      'k3-bench': { floor: 2, pos: [0, 0], name: '풀무꾼의 자리', kind: 'fight', mon: 'ashblade', exits: ['k2-grate', 'k3-nook', 'k4-bar'], text: '사람 키만 한 풀무가 벽에 박혀 있다. 그 자루를 밀던 사람이 손을 멈추고 돌아본다. 허리에 칼을 차고 있다.' },
      'k3-nook': { floor: 2, pos: [1, 0], name: '물통 놓인 구석', kind: 'rest', exits: ['k3-bench'], text: '담금질하던 물통 곁만 공기가 서늘하다. 통 가장자리에 누가 앉았던 자국이 반들반들하다.' },
      'k4-bar': { floor: 3, pos: [0, 0], name: '빗장 지른 쇠문 앞', kind: 'door', exits: ['k3-bench', 'k4-mold'], text: '쇠문에 빗장이 질러져 있다. 문이 달아 있어 손을 댈 수 없다. 쇠 치는 소리가 바로 이 너머다.',
        door: { name: '빗장 지른 쇠문', pick: 18, force: { stat: 'str', need: 72 }, key: 'kilnkey', beyond: 'k4-mold' } },
      'k4-mold': { floor: 3, pos: [1, 0], name: '거푸집 방', kind: 'fight', mon: 'moltencrab', exits: ['k4-bar', 'k5-anvil'], text: '바닥에 종 모양의 거푸집이 반쯤 묻혀 있다. 깨진 틈으로 쇳물이 아직 샌다. 샌 쇳물이 옆으로 걷는다.' },
      'k5-anvil': { floor: 4, pos: [0, 0], name: '첫 모루 앞', kind: 'boss', mon: 'bellhammer', exits: ['k4-mold'], text: '맨 안쪽은 불빛뿐이다. 한가운데 모루 하나가 놓여 있다. 그 위에서 망치가 혼자 오르내린다. 치는 것은 없다. 빈 모루를 친다.' },
    },
  },
  // ── 안개늪의 가라앉는 오솔길 (AN-A10): 늪 속으로 난 길 다섯 굽이. 지금 폐허와 같은 틀이다. 길이 하나라 안개에 길을 잃지는 않는다 ──
  // 방의 글은 시안에 없어 처음 값이다. 종지기는 먼저 치지 않는다(still): 종 곁에 서서 이끼를 걷을 수 있다 (AN-D 걷어 내는 길)
  sunkenpath: {
    id: 'sunkenpath', name: '가라앉는 오솔길', from: 'lampbridge', start: 'p1-end',
    enterLabel: '오솔길로 들어선다', enterSay: '다리 끝에서 널이 끊기고 오솔길이 시작된다. 발을 디딜 때마다 길이 조금씩 가라앉는다. 안개 속으로 들어섰다.',
    bossDown: '종지기가 종에 등을 기대고 주저앉았다. 몸을 덮은 이끼가 한 겹씩 흘러내린다. 이끼 낀 손이 마지막까지 종 줄을 쥐고 있다가, 놓았다.', openSay: '',
    floors: ['첫째 굽이', '둘째 굽이', '셋째 굽이', '넷째 굽이', '끝'],
    rooms: {
      'p1-end': { floor: 0, pos: [0, 0], name: '다리 끝', kind: 'hall', exits: ['p1-reeds'], exit: true, text: '등 뒤로 다리의 불빛이 흐리게 보인다. 앞은 발 하나 놓을 너비의 길이다. 길 양쪽은 물인지 땅인지 모를 것이다.' },
      'p1-reeds': { floor: 0, pos: [1, 0], name: '안개 고인 굽이', kind: 'fight', mon: 'mistleech', exits: ['p1-end', 'p2-sink'], text: '길이 한 번 꺾인다. 꺾인 자리에 안개가 고여 있다. 고인 안개가 발목 쪽으로 흘러온다.' },
      'p2-sink': { floor: 1, pos: [0, 0], name: '깔다 만 널', kind: 'trap', exits: ['p1-reeds', 'p2-boat', 'p3-post'], text: '누가 널을 깔다 말았다. 깐 데까지는 단단하고, 그다음부터는 널이 물 위에 떠 있기만 하다.',
        trap: { name: '뜬 널', dodge: { stat: 'agi', need: 52 }, disarm: { stat: 'wis', need: 44 }, dmg: 170, say: '널이 뒤집혔다. 허리까지 빠졌다가 기어 나왔다.', okSay: '널이 가라앉기 전에 다음 널로 건너뛰었다.', disarmSay: '널마다 밟아 보고, 뜬 것은 건져 단단한 데에 겹쳐 놓았다.' } },
      'p2-boat': { floor: 1, pos: [1, 0], name: '엎어진 나룻배', kind: 'treasure', exits: ['p2-sink'], text: '길옆에 나룻배 하나가 엎어져 있다. 바닥을 깁다 만 자국이 있다. 배 밑에 누가 짐을 두고 갔다.', loot: { items: [['mosskey', 1], ['lamp', 2], ['holywater', 1], ['redpotion', 2]], silver: 660, say: '배 밑에서 이끼 낀 열쇠 하나와 등불 2개, 성수 1병, 붉은 물약 2병, 은화 660닢을 꺼냈다.' } },
      'p3-post': { floor: 2, pos: [0, 0], name: '말뚝 선 굽이', kind: 'fight', mon: 'soakedscarecrow', exits: ['p2-sink', 'p3-hut', 'p4-gate'], text: '길가에 말뚝이 줄지어 박혀 있다. 길을 표시하려던 것이다. 여섯째에서 끊겼다. 일곱째 자리에 말뚝 아닌 것이 서 있다.' },
      'p3-hut': { floor: 2, pos: [1, 0], name: '짓다 만 움막', kind: 'rest', exits: ['p3-post'], text: '지붕을 반만 얹은 움막. 그래도 반쪽 밑은 말라 있다. 누가 종까지 가다 여기서 그만둔 모양이다.' },
      'p4-gate': { floor: 3, pos: [0, 0], name: '이끼 낀 사립문 앞', kind: 'door', exits: ['p3-post', 'p4-lights'], text: '사립문이 길을 막고 있다. 이끼가 문과 기둥을 한 덩이로 붙여 놓았다. 문 너머에서 불빛 하나가 왔다 갔다 한다.',
        door: { name: '이끼 낀 사립문', pick: 22, force: { stat: 'str', need: 88 }, key: 'mosskey', beyond: 'p4-lights' } },
      'p4-lights': { floor: 3, pos: [1, 0], name: '불빛 도는 굽이', kind: 'fight', mon: 'marshlight', exits: ['p4-gate', 'p5-bell'], text: '불빛이 길을 알려 준다. 세 갈래로. 둘은 물로 들어간다.' },
      'p5-bell': { floor: 4, pos: [0, 0], name: '이끼 덮인 종 앞', kind: 'boss', mon: 'mossbellman', still: true, exits: ['p4-lights'], text: '길이 끝나는 데에 종이 있다. 종각은 무너지고 종만 낮은 틀에 걸려 있다. 이끼가 종을 덮고, 종 줄을 덮고, 줄을 쥔 사람까지 덮었다. 그 사람은 움직이지 않는다. 숨은 쉰다.' },
    },
  },
  // ── 잠긴 도성의 잠긴 궁 (JD-A11): 궁 안 다섯 전각. 지금 폐허와 같은 틀에 숨이 더해진다(under). 방의 글은 시안에 없어 처음 값이다 ──
  // post: 교대를 기다리는 근위병이 혼자 선 자리. 들어서면 먼저 묻는다(교대를 알리거나, 싸우거나, 물러난다). 알린 자리는 다시 서지 않는다 (JD-D 풀어 주는 길)
  // vault: 임금의 하사품 상자가 쌓인 방. 상자는 보이고 열 수 있다 (JD-F4). air: 공기가 고인 쉼터라 쉬면 숨도 찬다
  sunkenpalace: {
    id: 'sunkenpalace', name: '잠긴 궁', from: 'palaceyard', start: 's1-gate', under: true,
    enterLabel: '궁으로 들어간다', enterSay: '물풀을 헤치고 궁 문을 지났다. 문짝은 없다. 문지방만 남았다. 안쪽에서 띠링이 겹겹이 밀려 나온다.',
    bossDown: '메아리가 한 겹씩 벗겨졌다. 겹마다 누군가의 이름이었다. 밥 먹은 사람, 걸은 사람, 눈을 뜬 사람. 마지막 한 겹이 벗겨지자 터진 종의 조각 하나만 바닥에 남았다.', openSay: '',
    floors: ['첫째 전각', '둘째 전각', '셋째 전각', '넷째 전각', '다섯째 전각'],
    rooms: {
      's1-gate': { floor: 0, pos: [0, 0], name: '문지방', kind: 'hall', exits: ['s1-post'], exit: true, text: '등 뒤로 뜰의 빛이 흐리게 든다. 위로는 물이고, 그 위가 하늘이다. 앞은 기둥이 늘어선 긴 마루다.' },
      's1-post': { floor: 0, pos: [1, 0], name: '첫째 전각의 마루', kind: 'fight', mon: 'sunkenguard', post: true, exits: ['s1-gate', 's2-hall'], text: '기둥 사이에 갑옷 하나가 서 있다. 창을 세우고 문 쪽을 본다. 발밑의 마루만 닳아 패었다.' },
      's2-hall': { floor: 1, pos: [0, 0], name: '둘째 전각의 회랑', kind: 'fight', mon: 'belljelly', exits: ['s1-post', 's2-air', 's2-store', 's2-post'], text: '회랑 천장에 종 모양의 것들이 붙어 있다. 숨을 쉬듯 부풀었다 줄어든다. 하나가 떨어져 나온다.' },
      's2-air': { floor: 1, pos: [1, -1], name: '공기 고인 다락', kind: 'rest', air: true, exits: ['s2-hall'], text: '다락 천장 밑에 공기가 한 뼘 고여 있다. 머리를 내밀면 숨을 쉴 수 있다. 서까래에 누가 손톱으로 날짜를 새기다 말았다.' },
      's2-store': { floor: 1, pos: [1, 1], name: '창고지기의 방', kind: 'treasure', exits: ['s2-hall'], text: '선반마다 열쇠 꾸러미가 걸려 있다. 다 삭았다. 청동 열쇠 하나만 멀쩡하다. 그 밑에 누가 주머니 몇 개를 두고 갔다.', loot: { items: [['palacekey', 1], ['airbag', 3], ['redpotion', 3]], silver: 1100, say: '선반에서 물먹은 궁 열쇠 하나와 공기 주머니 3개, 붉은 물약 3병, 은화 1,100닢을 챙겼다.' } },
      's2-post': { floor: 1, pos: [0, 1], name: '둘째 전각의 섬돌', kind: 'fight', mon: 'sunkenguard', post: true, exits: ['s2-hall', 's3-post'], text: '섬돌 맨 위에 갑옷이 서 있다. 투구 틈으로 물방울이 올라간다. 아래에서 위로.' },
      's3-post': { floor: 2, pos: [0, 0], name: '셋째 전각의 문간', kind: 'fight', mon: 'sunkenguard', post: true, exits: ['s2-post', 's3-vault', 's4-door'], text: '문간 양쪽에 창 걸이가 있다. 한쪽은 비었다. 다른 쪽에는 창을 쥔 갑옷이 그대로 서 있다.' },
      's3-vault': { floor: 2, pos: [1, 0], name: '하사품 곳간', kind: 'hall', vault: true, exits: ['s3-post'], text: '상자가 천장까지 쌓여 있다. 뚜껑마다 임금의 도장이 찍혔다. 나눠 주다 남은 것이다. 석 달 치가 그대로 있다.' },
      's4-door': { floor: 3, pos: [0, 0], name: '넷째 전각의 청동 문 앞', kind: 'door', exits: ['s3-post', 's4-post'], text: '청동 문이 닫혀 있다. 물속에서도 푸른빛이 그대로다. 문 너머에서 띠링이 더 크다.',
        door: { name: '청동 문', pick: 26, force: { stat: 'str', need: 104 }, key: 'palacekey', beyond: 's4-post' } },
      's4-post': { floor: 3, pos: [1, 0], name: '넷째 전각의 복도', kind: 'fight', mon: 'sunkenguard', post: true, exits: ['s4-door', 's5-post'], text: '복도가 좁아진다. 한가운데 갑옷이 섰다. 비켜 갈 틈이 없다. 검 끝이 바닥에 닿아 있다.' },
      's5-post': { floor: 4, pos: [0, 0], name: '다섯째 전각의 어전 앞', kind: 'fight', mon: 'sunkenguard', post: true, exits: ['s4-post', 's5-bell'], text: '어전 문 앞에 마지막 갑옷이 서 있다. 가슴에 검을 대고 있다. 맹세하던 자세 그대로다.' },
      's5-bell': { floor: 4, pos: [1, 0], name: '터진 종 앞', kind: 'boss', mon: 'bellecho', exits: ['s5-post'], text: '어전 한가운데 종이 있던 자리다. 종은 없다. 터진 조각들이 둥글게 흩어져 있고, 그 한가운데서 소리가 선다. 띠링. 띠링. 띠링. 모양이 있는 소리다.' },
    },
  },
  // ── 구름다리의 하늘 신전 (GD-A10): 신전 안 다섯 전. 지금 폐허와 같은 틀이다. 안에서는 바람이 불지 않는다 (GD-B3). 방의 글은 시안에 없어 처음 값이다 ──
  skytemple: {
    id: 'skytemple', name: '하늘 신전', from: 'templeyard', start: 't1-gap',
    enterLabel: '신전으로 들어간다', enterSay: '담이 무너진 데로 들어섰다. 사제만 드는 곳이다. 향 냄새가 사백 년 치 쌓여 있다. 바람이 멎었다.',
    bossDown: '대사제가 무릎을 꿇었다. 종채가 바닥을 굴렀다. 가면의 끈이 풀린다.', openSay: '',
    floors: ['문간 전', '향 전', '경 전', '가면 전', '종 전'],
    rooms: {
      't1-gap': { floor: 0, pos: [0, 0], name: '무너진 담 틈', kind: 'hall', exits: ['t1-hall'], exit: true, text: '등 뒤로 뜰의 바람 소리가 들린다. 안쪽은 바람 한 점 없다. 촛불이 곧게 선다.' },
      't1-hall': { floor: 0, pos: [1, 0], name: '문간 전의 마루', kind: 'fight', mon: 'stonemonk', exits: ['t1-gap', 't2-incense'], text: '긴 마루 양쪽으로 돌 수도승이 줄지어 앉았다. 맨 끝의 하나가 고개를 든다. 무릎에서 돌가루가 떨어진다.' },
      't2-incense': { floor: 1, pos: [0, 0], name: '향 전', kind: 'fight', mon: 'goldmask', exits: ['t1-hall', 't2-cell', 't2-store', 't3-scripture'], text: '향로가 천장까지 쌓였다. 연기 속에 금빛 가면이 떠 있다. 연기가 가면을 피해 흐른다.' },
      't2-cell': { floor: 1, pos: [1, -1], name: '견습 사제의 방', kind: 'rest', exits: ['t2-incense'], text: '방석이 일곱 장이다. 닳은 것은 한 장뿐이다. 벽에 누가 손톱으로 작게 썼다. "오늘도 못 들음." 그 밑에 같은 글씨가 줄줄이 내려간다.' },
      't2-store': { floor: 1, pos: [1, 1], name: '공양 창고', kind: 'treasure', exits: ['t2-incense'], text: '사백 년 치 공양이 쌓여 있다. 반은 썩었다. 선반 끝에 열쇠 하나가 걸려 있고, 그 밑에 누가 병 몇 개를 숨겨 두었다.', loot: { items: [['templekey', 1], ['deepholy', 2], ['redpotion', 3]], silver: 1900, say: '선반에서 신전 안문 열쇠 하나와 깊은 성수 2병, 붉은 물약 3병, 은화 1,900닢을 챙겼다.' } },
      't3-scripture': { floor: 2, pos: [0, 0], name: '경 전', kind: 'fight', mon: 'stonemonk', exits: ['t2-incense', 't4-door'], text: '경을 새긴 돌판이 벽을 덮었다. 그 앞에 앉은 수도승이 손가락으로 글자를 따라간다. 사백 년째 같은 줄이다. 손가락이 멈춘다.' },
      't4-door': { floor: 3, pos: [0, 0], name: '금칠한 안문 앞', kind: 'door', exits: ['t3-scripture', 't4-masks'], text: '안문이다. 바깥문처럼 금칠을 했다. 여기는 손때가 없다. 드나든 사람이 없어서다.',
        door: { name: '금칠한 안문', pick: 29, force: { stat: 'str', need: 124 }, key: 'templekey', beyond: 't4-masks' } },
      't4-masks': { floor: 3, pos: [1, 0], name: '가면 전', kind: 'fight', mon: 'goldmask', exits: ['t4-door', 't5-bell'], text: '벽마다 가면이 걸려 있다. 앞선 대사제들의 가면이다. 열 개. 열한 번째 못은 비었다. 하나가 벽에서 내려온다.' },
      't5-bell': { floor: 4, pos: [0, 0], name: '모신 종 앞', kind: 'boss', mon: 'bellpriest', exits: ['t4-masks'], text: '맨 안쪽 전이다. 종이 있다. 작다. 금칠을 너무 여러 번 해서 종인지 금덩이인지 모르겠다. 그 앞에 가면 쓴 사람이 등을 보이고 앉아 있다.' },
    },
  },
  // ── 별못의 별 떨어진 자리 (BM-A10): 구덩이 아래 다섯 층. 지금 폐허와 같은 틀이다. 안에서도 읽힌다 (BM-B3). 방의 글은 시안에 없어 처음 값이다 ──
  starpit: {
    id: 'starpit', name: '별 떨어진 자리', from: 'starfield', start: 'k1-rim',
    enterLabel: '구덩이로 내려간다', enterSay: '구덩이 턱에서 밧줄을 잡고 내려섰다. 흙이 유리처럼 굳어 있다. 밑에서 올라오는 울음이 한 걸음마다 또렷해진다.',
    bossDown: '조각이 바닥에 떨어졌다. 울음이 멎었다. 손바닥만 한 쇳조각이다. 아직 따뜻하다.', openSay: '',
    floors: ['구덩이 턱', '그을린 층', '유리 층', '울음 층', '바닥'],
    rooms: {
      'k1-rim': { floor: 0, pos: [0, 0], name: '구덩이 턱', kind: 'hall', exits: ['k1-slope'], exit: true, text: '머리 위로 하늘이 둥글게 보인다. 발밑은 비탈이다. 누가 박아 둔 말뚝에 밧줄이 매여 있다. 말뚝마다 이름이 새겨져 있다. 내려갔다 올라온 사람들의 이름이다.' },
      'k1-slope': { floor: 0, pos: [1, 0], name: '미끄러운 비탈', kind: 'fight', mon: 'starshard', exits: ['k1-rim', 'k2-scorch'], text: '비탈에 돌이 박혀 있다. 돌이 아니다. 식지 않았다. 하나가 금이 가며 떠오른다.' },
      'k2-scorch': { floor: 1, pos: [0, 0], name: '그을린 층', kind: 'fight', mon: 'voidecho', exits: ['k1-slope', 'k2-nook', 'k3-glass'], text: '벽이 온통 검다. 소리를 내 보았다. 돌아오지 않는다. 돌아오지 않는 것이 이쪽으로 걸어온다.' },
      'k2-nook': { floor: 1, pos: [1, -1], name: '누가 앉았던 자리', kind: 'rest', exits: ['k2-scorch'], text: '벽이 움푹 들어간 데에 방석 두 장이 놓여 있다. 한 장은 일하는 사람 것이고 한 장은 보는 사람 것이다. 여기까지 내려와서도 둘이 앉았던 모양이다.' },
      'k3-glass': { floor: 2, pos: [0, 0], name: '유리 층', kind: 'fight', mon: 'starshard', exits: ['k2-scorch', 'k3-cache', 'k4-cry'], text: '흙이 녹았다 굳어 유리가 되었다. 바닥에 내가 비친다. 비친 내가 한 박자 먼저 고개를 든다. 그 뒤에서 조각 하나가 떠오른다.' },
      'k3-cache': { floor: 2, pos: [1, 1], name: '유리에 묻힌 궤', kind: 'treasure', exits: ['k3-glass'], text: '유리 속에 궤 하나가 반쯤 묻혀 있다. 종루에 있던 것이 별과 함께 떨어진 것이다. 뚜껑은 열려 있다.', loot: { items: [['starholy', 2], ['redpotion', 3], ['bellshard', 1]], silver: 3100, say: '궤에서 별빛 성수 2병과 붉은 물약 3병, 종 조각 하나, 은화 3,100닢을 챙겼다.' } },
      'k4-cry': { floor: 3, pos: [0, 0], name: '울음 층', kind: 'fight', mon: 'voidecho', exits: ['k3-glass', 'k5-bottom'], text: '울음이 벽마다 부딪혀 돌아온다. 그 가운데 돌아오지 않는 자리가 하나 있다. 그 자리가 움직인다.' },
      'k5-bottom': { floor: 4, pos: [0, 0], name: '바닥', kind: 'boss', mon: 'lastshard', exits: ['k4-cry'], text: '구덩이의 바닥이다. 별은 없다. 다 타고 없다. 별이 깬 것만 남았다. 쇳조각 하나가 허공에서 운다. 곁에 방석은 없다. 여기는 아무도 앉아 준 적이 없다.' },
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
