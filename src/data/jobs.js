// 직업 (T4~T9, N4-3, N4-4, N5). 기본 직업 다섯은 레벨 5에 고른다. 한 번뿐이다.
// 스킬 효과 말(규칙이 읽는다):
//   dmg(피해 배율) · stat('str'|'agi'|'wis' 무엇으로 치나) · pierce(방어 무시) · crit(치명 확률 더하기) · hits(몇 번)
//   guard(이번 턴 받는 피해를 이만큼 줄임) · counter(돌진을 막으면 되받아침)
//   heal(지혜 × 이만큼 회복) · cleanse(상태이상을 지움) · ward({ cut, turns } 몇 턴 동안 받는 피해 줄임)
//   stun(적이 몇 턴 못 움직임) · weaken({ cut, turns } 적 공격력 줄임) · burn(적에게 몇 턴 동안 매 턴 피해) · flee(반드시 달아남)
//   first(싸움의 첫 턴이면 피해 배율) · again(방금 한 공격을 한 번 더)

export const JOB_LEVEL = 5;
export const JOB_XP = 1.5; // 직업에 맞는 숙련도는 1.5배 빨리 오른다 (T5)
export const SKILL_LEVELS = [5, 10, 15, 20];

export const JOBS = {
  warrior: {
    id: 'warrior', name: '전사', role: '앞줄에서 막고 때린다', fast: ['strike'], next: '기사 / 광전사', gear: 'oldshield',
    skills: [
      { id: 'shieldup', name: '방패 올리기', mp: 3, say: '방패를 올렸다.', text: '이번 턴 받는 피해 −70%. 돌진은 막고 되받아친다', guard: 0.7, counter: true },
      { id: 'cleave', name: '내려찍기', mp: 6, say: '온 힘으로 내려찍었다.', text: '힘으로 1.7배 피해', dmg: 1.7, stat: 'str' },
      { id: 'brace', name: '버티기', mp: 6, say: '발을 땅에 박았다.', text: '적의 공격 세 번을 40% 덜 받는다', ward: { cut: 0.4, turns: 3 } },
      { id: 'roar', name: '함성', mp: 8, say: '배에서 끌어올려 소리쳤다.', text: '한 턴 못 움직이게 하고, 그 뒤 적의 공격 세 번이 30% 약해진다', weaken: { cut: 0.3, turns: 3 }, stun: 1 },
    ],
  },
  archer: {
    id: 'archer', name: '궁수', role: '뒷줄에서 약점을 노린다', fast: ['gathering'], next: '명사수 / 길잡이', gear: 'shortbow',
    skills: [
      { id: 'aim', name: '겨냥 쏘기', mp: 3, say: '숨을 멈추고 쏘았다.', text: '민첩으로 1.2배 피해. 급소 확률 +40%p', dmg: 1.2, stat: 'agi', crit: 0.4 },
      { id: 'twin', name: '두 발 쏘기', mp: 5, say: '화살 둘을 잇달아 메겼다.', text: '민첩으로 0.8배 피해를 두 번', dmg: 0.8, stat: 'agi', hits: 2 },
      { id: 'pin', name: '발 묶기', mp: 6, say: '발등을 노려 쏘았다.', text: '민첩으로 0.8배 피해. 적이 한 턴 못 움직인다', dmg: 0.8, stat: 'agi', stun: 1 },
      { id: 'pierce', name: '꿰뚫기', mp: 9, say: '가죽의 틈을 보았다.', text: '민첩으로 1.6배 피해. 방어를 무시한다', dmg: 1.6, stat: 'agi', pierce: true },
    ],
  },
  mage: {
    id: 'mage', name: '마법사', role: '속성 마법으로 여럿을 친다', fast: ['appraise'], next: '원소술사 / 부름꾼', gear: 'ashwand',
    skills: [
      { id: 'ember', element: '불', name: '불씨', mp: 4, say: '손끝에서 불씨가 튀었다.', text: '지혜로 2배 피해(방어 무시). 세 턴 동안 탄다', dmg: 2.0, stat: 'wis', pierce: true, burn: 3 },
      { id: 'frost', element: '물', name: '얼음 못', mp: 6, say: '공기가 얼어붙었다.', text: '지혜로 1.8배 피해(방어 무시). 적이 한 턴 못 움직인다', dmg: 1.8, stat: 'wis', pierce: true, stun: 1 },
      { id: 'veil', name: '안개 장막', mp: 6, say: '몸 둘레에 안개가 섰다.', text: '적의 공격 세 번을 50% 덜 받는다', ward: { cut: 0.5, turns: 3 } },
      { id: 'bolt', element: '바람', name: '벼락', mp: 12, say: '하늘이 한 번 찢어졌다.', text: '지혜로 3.5배 피해(방어 무시)', dmg: 3.5, stat: 'wis', pierce: true },
    ],
  },
  priest: {
    id: 'priest', name: '사제', role: '고치고 지킨다', fast: ['cooking'], next: '치유사 / 수호 사제', gear: 'prayerbeads',
    skills: [
      { id: 'lay', name: '손 얹기', mp: 4, say: '상처에 손을 얹었다.', text: '생명력을 지혜 × 3만큼 채운다', heal: 3 },
      { id: 'wash', name: '씻어 내기', mp: 4, say: '맑은 물이 스쳤다.', text: '걸린 상태이상을 모두 지우고 생명력을 지혜만큼 채운다', cleanse: true, heal: 1 },
      { id: 'bless', name: '가호', mp: 7, say: '등 뒤가 따뜻해졌다.', text: '적의 공격 네 번을 40% 덜 받는다', ward: { cut: 0.4, turns: 4 } },
      { id: 'rebuke', element: '빛', name: '꾸짖기', mp: 8, say: '또렷한 목소리로 꾸짖었다.', text: '지혜로 2배 피해(방어 무시). 적의 공격 세 번이 30% 약해진다', dmg: 2.0, stat: 'wis', pierce: true, weaken: { cut: 0.3, turns: 3 } },
    ],
  },
  rogue: {
    id: 'rogue', name: '도적', role: '먼저 치고, 따고, 숨는다', fast: ['lockpick'], next: '그림자 / 도굴꾼', gear: 'thinknife',
    skills: [
      { id: 'backstab', name: '급소 찌르기', mp: 3, say: '빈틈으로 파고들었다.', text: '민첩으로 1.3배 피해. 싸움의 첫 턴이면 2.2배', dmg: 1.3, stat: 'agi', first: 2.2 },
      { id: 'smoke', name: '연막', mp: 5, say: '연막을 터뜨렸다.', text: '반드시 달아난다', flee: true },
      { id: 'trip', name: '다리 걸기', mp: 5, say: '발목을 걷어찼다.', text: '민첩으로 0.7배 피해. 적이 한 턴 못 움직인다', dmg: 0.7, stat: 'agi', stun: 1 },
      { id: 'flurry', name: '난도질', mp: 9, say: '칼이 세 번 번쩍였다.', text: '민첩으로 0.7배 피해를 세 번. 급소 확률 +15%p', dmg: 0.7, stat: 'agi', hits: 3, crit: 0.15 },
    ],
  },
};
export const JOB_ORDER = ['warrior', 'archer', 'mage', 'priest', 'rogue'];

/**
 * 히든 직업 (T9, N5). 계통도에 없다. 조건을 채우면 한 번 제안이 오고, 거절하면 다시 오지 않는다.
 * 받으면 기본 직업 다섯은 고를 수 없다(이미 골랐으면 그때 한 번 갈아탄다).
 */
export const HIDDEN_JOBS = {
  oneway: {
    id: 'oneway', name: '한길꾼', why: '한 가지 일을 끝까지 했고, 교관의 부탁을 끝냈습니다',
    offer: '"허수아비 앞에 삼백 번 선 놈은 네가 처음이다." 교관이 낡은 띠 하나를 내민다. "이건 직업이 아니다. 버릇이다. 받겠나."',
    gain: '같은 공격을 이어서 할수록 피해가 5%씩 쌓인다(열 번까지). 모든 숙련도가 같은 일을 거듭할 때 10% 더 오른다',
    lose: '기본 직업 다섯과 그 스킬을 고를 수 없다',
    fastAll: 1.1, streak: 0.05,
    skills: [
      { id: 'oncemore', name: '한 번 더', mp: 3, say: '숨도 쉬지 않고 한 번 더 쳤다.', text: '힘으로 1.1배 피해. 이어 치던 것이 끊기지 않는다', dmg: 1.1, stat: 'str', again: true },
      { id: 'samespot', name: '같은 자리', mp: 6, say: '아까 친 바로 그 자리를 쳤다.', text: '힘으로 1.4배 피해. 방어를 무시한다', dmg: 1.4, stat: 'str', pierce: true },
      { id: 'unmoved', name: '꿈쩍 않기', mp: 6, say: '한 발도 물러서지 않았다.', text: '적의 공격 네 번을 40% 덜 받는다', ward: { cut: 0.4, turns: 4 } },
      { id: 'thousand', name: '천 번째', mp: 12, say: '천 번을 친 사람의 한 번이었다.', text: '힘으로 3배 피해', dmg: 3.0, stat: 'str' },
    ],
  },
  handlight: {
    id: 'handlight', name: '손빛', why: '손으로 만들고 깎은 것이 쌓였고, 버려진 공방의 모루에 새겨진 이름들을 읽었습니다',
    offer: '모루의 빈 줄이 따뜻하다. 누가 귓가에 묻는 것 같다. "네 이름을 여기에 새기겠느냐. 싸우는 것은 그만두고."',
    gain: '만드는 모든 것의 높은 등급 확률이 오르고(밀기 +0.25), 만든 것의 내구도 +20%',
    lose: '기본 직업 다섯과 그 스킬을 고를 수 없다. 싸움 스킬이 없다',
    push: 0.25, dur: 1.2,
    skills: [],
  },
  nameless: {
    id: 'nameless', name: '무명객', why: '레벨 30이 되도록 아무 직업도 고르지 않았습니다',
    offer: '아무도 묻지 않는다. 다만 어느 날 문득 안다. 고르지 않은 것도 고른 것이었다는 걸.',
    gain: '모든 숙련도가 1.25배 빨리 오른다. 레벨이 오를 때 스탯 점수를 하나 더 받는다',
    lose: '기본 직업 다섯과 그 스킬을 고를 수 없다',
    fastAll: 1.25, extraPoint: 1,
    skills: [
      { id: 'anyhow', name: '되는 대로', mp: 4, say: '배운 적 없는 몸짓으로 쳤다.', text: '가장 높은 스탯으로 1.5배 피해', dmg: 1.5, stat: 'best' },
    ],
  },
};
export const HIDDEN_JOB_ORDER = ['oneway', 'handlight', 'nameless'];
export const NAMELESS_LEVEL = 30;

export function jobDef(id) {
  return JOBS[id] || HIDDEN_JOBS[id] || null;
}

/**
 * 2차 전직 (T8). 레벨 20, 소리재의 장인 거리에서. 둘 가운데 하나. 한 번뿐이다.
 * 효과 말: hp(최대 생명력) · guard(막는 스킬이 더 줄이는 몫) · rage(생명력 절반 아래에서 피해 배율) · crit · flee · weak(약점 배율)
 *          friend(동료가 치는 힘 배율) · heal(고치는 힘 배율) · ward(감싸는 횟수 더하기) · first(첫 턴 피해 배율) · pick(자물쇠 따기 더하기)
 */
export const ADVANCE_LEVEL = 20;
export const ADVANCED = {
  knight: { from: 'warrior', name: '기사', text: '최대 생명력 +40. 막는 스킬이 피해를 10%p 더 줄인다', hp: 40, guard: 0.1 },
  berserker: { from: 'warrior', name: '광전사', text: '생명력이 절반 아래일 때 주는 피해 +25%', rage: 1.25 },
  marksman: { from: 'archer', name: '명사수', text: '급소를 맞힐 확률 +12%p', crit: 0.12 },
  pathfinder: { from: 'archer', name: '길잡이', text: '달아날 확률 +25%p. 가는 길에 습격당하지 않는다', flee: 0.25, noAmbush: true },
  elementalist: { from: 'mage', name: '원소술사', text: '약점을 찔렀을 때 1.5배가 아니라 1.9배', weak: 1.9 },
  summoner: { from: 'mage', name: '부름꾼', text: '동료가 치는 힘 +40%', friend: 1.4 },
  healer: { from: 'priest', name: '치유사', text: '내가 고치는 힘 +50%', heal: 1.5 },
  warden: { from: 'priest', name: '수호 사제', text: '감싸는 스킬이 한 번 더 듣는다', ward: 1 },
  shadow: { from: 'rogue', name: '그림자', text: '싸움의 첫 턴에 주는 피해 +50%', first: 1.5 },
  graverobber: { from: 'rogue', name: '도굴꾼', text: '자물쇠 따기 +25%p', pick: 0.25 },
};
