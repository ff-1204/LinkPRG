// 괴물 (E2, E5~E8, R2-2). 다음 행동은 늘 미리 보인다.
// move.kind: hit(그냥 침) · charge(돌진류: 방어하면 막고 반격) · wait(틈)
// move.status: 맞으면 걸리는 상태이상 { id, turns, chance }

export const STATUS = {
  bleed: { name: '출혈', per: 3, say: '매 턴 3 피해를 입습니다' },
  poison: { name: '중독', per: 2, say: '매 턴 2 피해를 입습니다' },
  burn: { name: '화상', per: 4, say: '매 턴 4 피해를 입습니다' },
  stun: { name: '기절', per: 0, say: '움직일 수 없습니다' },
  fear: { name: '공포', per: 0, say: '공격력이 30% 줄어듭니다' },
};

export const MONSTERS = {
  rat: {
    element: '땅', name: '들쥐', level: 2, hp: 24, attack: 9, defense: 2, agi: 11, xp: 30,
    intro: '덤불에서 들쥐가 튀어나왔다.',
    moves: [
      { id: 'bite', name: '물기', kind: 'hit', power: 1, tell: '들쥐가 이를 드러낸다.', say: '들쥐가 발목을 물었다.', w: 3 },
      { id: 'scurry', name: '숨 고르기', kind: 'wait', power: 0, tell: '들쥐가 뒤로 물러나 눈치를 본다.', say: '들쥐가 제자리를 맴돈다.', w: 1 },
    ],
    drops: [{ id: 'herb', p: 0.3 }],
  },
  wolf: {
    element: '바람', name: '숲 늑대', level: 4, hp: 44, attack: 14, defense: 5, agi: 13, xp: 80,
    intro: '나무 사이에서 늑대가 걸어 나온다.',
    moves: [
      { id: 'bite', name: '물어뜯기', kind: 'hit', power: 1, tell: '늑대가 몸을 낮춘다.', say: '늑대가 팔을 물어뜯었다.', status: { id: 'bleed', turns: 3, chance: 0.4 }, w: 3 },
      { id: 'lunge', name: '덮치기', kind: 'charge', power: 1.8, tell: '늑대가 뒷다리에 힘을 모은다.', say: '늑대가 덮쳤다.', w: 2 },
      { id: 'howl', name: '울부짖기', kind: 'wait', power: 0, tell: '늑대가 고개를 든다.', say: '늑대가 길게 울었다. 등골이 서늘하다.', status: { id: 'fear', turns: 2, chance: 0.5 }, w: 1 },
    ],
    drops: [{ id: 'wolffang', p: 0.6 }],
  },
  boar: {
    element: '땅', name: '성난 멧돼지', level: 5, hp: 60, attack: 16, defense: 7, agi: 8, xp: 120,
    intro: '성난 멧돼지가 콧김을 뿜으며 나타났다.',
    moves: [
      { id: 'gore', name: '들이받기', kind: 'hit', power: 1, tell: '멧돼지가 고개를 숙인다.', say: '멧돼지가 엄니로 들이받았다.', status: { id: 'bleed', turns: 3, chance: 0.35 }, w: 3 },
      { id: 'charge', name: '돌진', kind: 'charge', power: 2.2, tell: '멧돼지가 뒷발로 땅을 긁는다.', say: '멧돼지가 돌진했다.', w: 2 },
    ],
    drops: [{ id: 'boarhide', p: 0.7 }, { id: 'boarmeat', p: 0.5 }],
  },
  bat: {
    element: '어둠', name: '동굴 박쥐', level: 5, hp: 38, attack: 15, defense: 3, agi: 16, xp: 100,
    intro: '천장에서 박쥐가 내리꽂힌다.',
    moves: [
      { id: 'swoop', name: '내리꽂기', kind: 'hit', power: 1, tell: '박쥐가 천장으로 솟구친다.', say: '박쥐가 얼굴을 할퀴었다.', w: 3 },
      { id: 'screech', name: '비명', kind: 'wait', power: 0, tell: '박쥐가 입을 벌린다.', say: '박쥐가 귀를 찢는 소리를 냈다.', status: { id: 'stun', turns: 1, chance: 0.35 }, w: 1 },
    ],
    drops: [{ id: 'batwing', p: 0.7 }],
  },
  spider: {
    element: '땅', name: '돌거미', level: 7, hp: 70, attack: 19, defense: 10, agi: 9, xp: 190,
    intro: '바위인 줄 알았던 것이 다리를 편다.',
    moves: [
      { id: 'fang', name: '독니', kind: 'hit', power: 1, tell: '돌거미가 앞다리를 든다.', say: '돌거미가 독니를 박았다.', status: { id: 'poison', turns: 5, chance: 0.5 }, w: 3 },
      { id: 'crush', name: '덮쳐 누르기', kind: 'charge', power: 2, tell: '돌거미가 몸을 웅크린다.', say: '돌거미가 온몸으로 덮쳤다.', w: 2 },
    ],
    drops: [{ id: 'copperore', p: 0.6 }, { id: 'ironore', p: 0.6 }],
  },
  crab: {
    element: '물', name: '강 게', level: 3, hp: 34, attack: 11, defense: 8, agi: 6, xp: 50,
    intro: '물가의 돌이 옆으로 걷기 시작한다.',
    moves: [
      { id: 'pinch', name: '집게질', kind: 'hit', power: 1, tell: '게가 집게를 벌린다.', say: '게가 손가락을 집었다.', w: 3 },
      { id: 'shell', name: '웅크리기', kind: 'wait', power: 0, tell: '게가 다리를 오므린다.', say: '게가 껍데기 속으로 숨었다.', w: 1 },
    ],
    drops: [{ id: 'crucian', p: 0.4 }],
  },
  reedsnake: {
    element: '물', name: '갈대 뱀', level: 10, hp: 90, attack: 26, defense: 9, agi: 17, xp: 380,
    intro: '갈대가 한 줄로 눕는다. 그 끝에서 뱀 머리가 선다.',
    moves: [
      { id: 'bite', name: '물기', kind: 'hit', power: 1, tell: '뱀이 목을 뒤로 젖힌다.', say: '뱀이 종아리를 물었다.', status: { id: 'poison', turns: 4, chance: 0.5 }, w: 3 },
      { id: 'coil', name: '휘감기', kind: 'charge', power: 1.9, tell: '뱀이 몸을 둥글게 만다.', say: '뱀이 온몸을 휘감아 조였다.', w: 2 },
    ],
    drops: [{ id: 'eel', p: 0.5 }, { id: 'herb', p: 0.5 }],
  },
  mudtoad: {
    element: '땅', name: '늪 두꺼비', level: 11, hp: 130, attack: 24, defense: 14, agi: 6, xp: 420,
    intro: '진흙 덩이가 눈을 뜬다.',
    moves: [
      { id: 'tongue', name: '혀 채찍', kind: 'hit', power: 1, tell: '두꺼비가 입을 조금 벌린다.', say: '끈적한 혀가 후려쳤다.', w: 3 },
      { id: 'gulp', name: '삼키기', kind: 'charge', power: 2.2, tell: '두꺼비가 볼을 크게 부풀린다.', say: '두꺼비가 통째로 삼켰다 뱉었다.', w: 2 },
      { id: 'sink', name: '가라앉기', kind: 'wait', power: 0, tell: '두꺼비가 진흙 속으로 몸을 낮춘다.', say: '두꺼비가 눈만 내놓고 가라앉았다.', w: 1 },
    ],
    drops: [{ id: 'tar', p: 0.5 }],
  },
  drowned: {
    element: '어둠', name: '가라앉은 뱃사람', level: 13, hp: 150, attack: 30, defense: 12, agi: 10, xp: 560,
    intro: '물 찬 선실에서 누가 일어선다. 발이 바닥에 닿지 않는다.',
    moves: [
      { id: 'hook', name: '갈고리', kind: 'hit', power: 1, tell: '뱃사람이 녹슨 갈고리를 든다.', say: '갈고리가 어깨를 찍었다.', status: { id: 'bleed', turns: 3, chance: 0.4 }, w: 3 },
      { id: 'drag', name: '끌어내리기', kind: 'charge', power: 2.0, tell: '뱃사람이 두 팔을 벌리고 다가온다.', say: '찬 팔이 물속으로 끌어내렸다.', w: 2 },
      { id: 'moan', name: '뱃노래', kind: 'wait', power: 0, tell: '뱃사람이 입을 연다. 물이 쏟아진다.', say: '물 먹은 뱃노래가 선실을 채웠다.', status: { id: 'fear', turns: 2, chance: 0.5 }, w: 1 },
    ],
    drops: [{ id: 'sailcloth', p: 0.4 }, { id: 'pearl', p: 0.15 }],
  },
  rockhawk: {
    element: '바람', name: '바위 매', level: 16, hp: 170, attack: 38, defense: 12, agi: 24, xp: 900,
    intro: '그림자가 먼저 온다. 그다음 바람, 그다음 발톱.',
    moves: [
      { id: 'talon', name: '발톱', kind: 'hit', power: 1, tell: '매가 날개를 접는다.', say: '발톱이 어깨를 그었다.', status: { id: 'bleed', turns: 3, chance: 0.4 }, w: 3 },
      { id: 'dive', name: '내리꽂기', kind: 'charge', power: 2.0, tell: '매가 까마득히 솟구친다.', say: '매가 돌처럼 내리꽂혔다.', w: 2 },
    ],
    drops: [{ id: 'batwing', p: 0.6 }],
  },
  passbear: {
    element: '땅', name: '고개 곰', level: 18, hp: 280, attack: 42, defense: 20, agi: 9, xp: 1200,
    intro: '바위인 줄 알았던 것이 일어선다. 일어서도 일어서도 끝이 없다.',
    moves: [
      { id: 'swipe', name: '앞발', kind: 'hit', power: 1, tell: '곰이 앞발을 든다.', say: '앞발이 몸통을 쳤다.', w: 3 },
      { id: 'maul', name: '덮쳐 누르기', kind: 'charge', power: 2.3, tell: '곰이 두 발로 일어선다.', say: '곰이 온 무게로 덮쳤다.', w: 2 },
      { id: 'roar', name: '포효', kind: 'wait', power: 0, tell: '곰이 숨을 크게 들이쉰다.', say: '포효가 고개를 울렸다.', status: { id: 'fear', turns: 2, chance: 0.6 }, w: 1 },
    ],
    drops: [{ id: 'bearhide', p: 0.7 }, { id: 'bearmeat', p: 0.6 }, { id: 'boarmeat', p: 0.4 }],
  },
  // 고개 너머로 사람을 따라오는 늑대 (LV-C2). 19~20을 메운다
  guidewolf: {
    element: '바람', name: '길잡이 늑대', level: 20, hp: 300, attack: 46, defense: 17, agi: 26, xp: 1500,
    intro: '앞서 걷던 것이 돌아본다. 길을 알려 주는 줄 알았는데, 무리가 있는 쪽으로 데려가고 있었다.',
    moves: [
      { id: 'snap', name: '물어뜯기', kind: 'hit', power: 1, tell: '늑대가 몸을 낮춘다.', say: '이빨이 팔뚝에 박혔다.', status: { id: 'bleed', turns: 3, chance: 0.4 }, w: 3 },
      { id: 'lunge', name: '목덜미 노리기', kind: 'charge', power: 2.1, tell: '늑대가 뒤로 한 걸음 물러난다.', say: '늑대가 목덜미로 뛰어올랐다.', w: 2 },
      { id: 'howl', name: '부르는 소리', kind: 'wait', power: 0, tell: '늑대가 고개를 든다.', say: '긴 울음이 고개를 넘어갔다. 멀리서 답이 왔다.', status: { id: 'fear', turns: 2, chance: 0.4 }, w: 1 },
    ],
    drops: [{ id: 'wolffang', p: 0.8 }, { id: 'steel', p: 0.25 }],
  },
  // 우두머리 (T22). 국면이 바뀌면 속성과 하는 짓이 달라진다. at: 생명력이 이 몫 아래로 내려가면 그 국면이 된다.
  gatekeeper: {
    boss: true, element: '땅', name: '폐허의 문지기', level: 9, hp: 260, attack: 21, defense: 9, agi: 7, xp: 600,
    intro: '문지기가 천천히 돌아선다. 쇠 관절이 운다.',
    moves: [
      { id: 'slam', name: '내려치기', kind: 'hit', power: 1, tell: '문지기가 쇠 팔을 든다.', say: '쇠 팔이 내려찍었다.', w: 3 },
      { id: 'sweep', name: '쓸어 치기', kind: 'charge', power: 1.9, tell: '문지기가 몸을 비튼다. 팔이 크게 뒤로 간다.', say: '쇠 팔이 방을 쓸었다.', w: 2 },
      { id: 'still', name: '문을 돌아본다', kind: 'wait', power: 0, tell: '문지기가 고개를 문 쪽으로 돌린다.', say: '문지기가 문이 닫혀 있는지 본다.', w: 1 },
    ],
    phases: [
      { at: 0.5, element: '불', attack: 24, say: '문지기의 가슴께에서 붉은 빛이 샌다. 식었던 화덕에 불이 붙었다. 쇠가 달아오른다.',
        moves: [
          { id: 'slam', name: '달군 팔', kind: 'hit', power: 1.1, tell: '문지기가 붉게 단 팔을 든다.', say: '달군 팔이 내려찍었다.', status: { id: 'burn', turns: 2, chance: 0.5 }, w: 3 },
          { id: 'breath', name: '불 숨', kind: 'charge', power: 2.1, tell: '문지기의 가슴이 부풀고, 틈마다 불빛이 샌다.', say: '불길이 방을 메웠다.', w: 3 },
        ] },
      { at: 0.2, element: '불', attack: 27, say: '문지기의 한쪽 다리가 꺾였다. 그래도 문 앞을 떠나지 않는다.',
        moves: [
          { id: 'flail', name: '마구 휘두르기', kind: 'hit', power: 1.2, tell: '문지기가 닥치는 대로 팔을 휘두르려 한다.', say: '쇠 팔이 아무 데나 내리쳤다.', w: 3 },
          { id: 'breath', name: '불 숨', kind: 'charge', power: 2.1, tell: '문지기의 가슴이 부풀고, 틈마다 불빛이 샌다.', say: '불길이 방을 메웠다.', w: 2 },
          { id: 'still', name: '문을 돌아본다', kind: 'wait', power: 0, tell: '문지기가 고개를 문 쪽으로 돌린다.', say: '문지기가 문이 닫혀 있는지 본다.', w: 1 },
        ] },
    ],
    drops: [{ id: 'ironore', p: 1 }, { id: 'copperore', p: 1 }],
  },
};

export function monsterDef(id) {
  const m = MONSTERS[id];
  if (!m) throw new Error('모르는 괴물: ' + id);
  return m;
}

// 21~100의 보통 몬스터 (LV-C3~C10). 사냥터에 잇기 전이라 아직 만나지 않는다
import { tierMonsters, tierBosses } from './tiers.js?v=25a8527';
import { monsterXp } from './bands.js?v=25a8527';
import { xpToNext } from '../core/level.js?v=25a8527';
Object.assign(MONSTERS, tierMonsters((level) => monsterXp(level, xpToNext)), tierBosses((level) => monsterXp(level, xpToNext)));
