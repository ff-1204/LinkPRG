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
      { id: 'cleave', kind: 'atk', name: '강타', mp: 6, say: '온 힘으로 내려찍었다.', text: '힘으로 1.7배 피해', dmg: 1.7, stat: 'str' },
      { id: 'shieldup', kind: 'job', name: '방패 막기', mp: 3, say: '방패를 올렸다.', text: '이번 턴 받는 피해 −70%. 돌진은 막고 되받아친다', guard: 0.7, counter: true },
      { id: 'brace', kind: 'job', name: '철벽', mp: 6, say: '발을 땅에 박았다.', text: '적의 공격 세 번을 40% 덜 받는다', ward: { cut: 0.4, turns: 3 } },
      { id: 'roar', kind: 'job', name: '전투 함성', mp: 8, say: '배에서 끌어올려 소리쳤다.', text: '한 턴 못 움직이게 하고, 그 뒤 적의 공격 세 번이 30% 약해진다', weaken: { cut: 0.3, turns: 3 }, stun: 1 },
    ],
  },
  archer: {
    id: 'archer', name: '궁수', role: '뒷줄에서 약점을 노린다', fast: ['gathering'], next: '명사수 / 길잡이', gear: 'shortbow',
    skills: [
      { id: 'aim', kind: 'atk', name: '조준 사격', mp: 3, say: '숨을 멈추고 쏘았다.', text: '민첩으로 1.2배 피해. 급소 확률 +40%p', dmg: 1.2, stat: 'agi', crit: 0.4 },
      { id: 'twin', kind: 'atk', name: '연속 사격', mp: 5, say: '화살 둘을 잇달아 메겼다.', text: '민첩으로 0.8배 피해를 두 번', dmg: 0.8, stat: 'agi', hits: 2 },
      { id: 'pierce', kind: 'atk', name: '관통 화살', mp: 9, say: '가죽의 틈을 보았다.', text: '민첩으로 1.6배 피해. 방어를 무시한다', dmg: 1.6, stat: 'agi', pierce: true },
      { id: 'pin', kind: 'job', name: '속박 화살', mp: 6, say: '발등을 노려 쏘았다.', text: '민첩으로 0.8배 피해. 적이 한 턴 못 움직인다', dmg: 0.8, stat: 'agi', stun: 1 },
    ],
  },
  mage: {
    id: 'mage', name: '마법사', role: '속성 마법으로 여럿을 친다', fast: ['appraise'], next: '원소술사 / 부름꾼', gear: 'ashwand',
    skills: [
      { id: 'ember', kind: 'atk', element: '불', name: '화염구', mp: 4, say: '손끝에서 불씨가 튀었다.', text: '지혜로 2배 피해(방어 무시). 세 턴 동안 탄다', dmg: 2.0, stat: 'wis', pierce: true, burn: 3 },
      { id: 'frost', kind: 'atk', element: '물', name: '얼음 창', mp: 6, say: '공기가 얼어붙었다.', text: '지혜로 1.8배 피해(방어 무시). 적이 한 턴 못 움직인다', dmg: 1.8, stat: 'wis', pierce: true, stun: 1 },
      { id: 'bolt', kind: 'atk', element: '바람', name: '낙뢰', mp: 12, say: '하늘이 한 번 찢어졌다.', text: '지혜로 3.5배 피해(방어 무시)', dmg: 3.5, stat: 'wis', pierce: true },
      { id: 'veil', kind: 'job', name: '마나 방벽', mp: 6, say: '몸 둘레에 안개가 섰다.', text: '적의 공격 세 번을 50% 덜 받는다', ward: { cut: 0.5, turns: 3 } },
    ],
  },
  priest: {
    id: 'priest', name: '사제', role: '고치고 지킨다', fast: ['cooking'], next: '치유사 / 수호 사제', gear: 'prayerbeads',
    skills: [
      { id: 'rebuke', kind: 'atk', element: '빛', name: '성광', mp: 8, say: '또렷한 목소리로 꾸짖었다.', text: '지혜로 2배 피해(방어 무시). 적의 공격 세 번이 30% 약해진다', dmg: 2.0, stat: 'wis', pierce: true, weaken: { cut: 0.3, turns: 3 } },
      { id: 'lay', kind: 'job', name: '치유', mp: 4, say: '상처에 손을 얹었다.', text: '생명력을 지혜 × 3만큼 채운다', heal: 3 },
      { id: 'wash', kind: 'job', name: '정화', mp: 4, say: '맑은 물이 스쳤다.', text: '걸린 상태이상을 모두 지우고 생명력을 지혜만큼 채운다', cleanse: true, heal: 1 },
      { id: 'bless', kind: 'job', name: '신성 가호', mp: 7, say: '등 뒤가 따뜻해졌다.', text: '적의 공격 네 번을 40% 덜 받는다', ward: { cut: 0.4, turns: 4 } },
    ],
  },
  rogue: {
    id: 'rogue', name: '도적', role: '먼저 치고, 따고, 숨는다', fast: ['lockpick'], next: '그림자 / 도굴꾼', gear: 'thinknife',
    skills: [
      { id: 'backstab', kind: 'atk', name: '암습', mp: 3, say: '빈틈으로 파고들었다.', text: '민첩으로 1.3배 피해. 싸움의 첫 턴이면 2.2배', dmg: 1.3, stat: 'agi', first: 2.2 },
      { id: 'flurry', kind: 'atk', name: '칼춤', mp: 9, say: '칼이 세 번 번쩍였다.', text: '민첩으로 0.7배 피해를 세 번. 급소 확률 +15%p', dmg: 0.7, stat: 'agi', hits: 3, crit: 0.15 },
      { id: 'smoke', kind: 'job', name: '연막탄', mp: 5, say: '연막을 터뜨렸다.', text: '반드시 달아난다', flee: true },
      { id: 'trip', kind: 'job', name: '다리 후리기', mp: 5, say: '발목을 걷어찼다.', text: '민첩으로 0.7배 피해. 적이 한 턴 못 움직인다', dmg: 0.7, stat: 'agi', stun: 1 },
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

/**
 * 3차(레벨 50)와 4차(레벨 80) 전직 (Z126). 2차 직업마다 하나씩 이어지고 갈림은 없다. 2차를 한 장인 거리에서 한다.
 * 3차: 공격 스킬 하나와 늘 붙는 효과(pas). 4차: 공격 스킬 하나와 궁극(ult, 한 싸움에 한 번).
 * pas의 말: hp(최대 생명력 더하기) · guard(막기 더하기) · rage(곱하기) · critMult(급소 배율) · sense(먼저 알아챔 더하기) · weak(약점 배율 더하기) · friend · heal · first(곱하기) · wardCut(감싸기 더하기) · dropUp(전리품 확률 곱하기)
 */
export const TIER_LEVEL = { 3: 50, 4: 80 };
export const TIER3 = {
  knight: { name: '성문 기사', pasName: '굳은 성문', pasText: '최대 생명력 +80. 막는 스킬이 피해를 10%p 더 줄인다', pas: { hp: 80, guard: 0.1 }, skills: [{ id: 'gatebash', kind: 'atk', name: '성문 강타', mp: 12, say: '성문을 들이받듯 밀어붙였다.', text: '힘으로 2.2배 피해. 적이 한 턴 못 움직인다', dmg: 2.2, stat: 'str', stun: 1 }] },
  berserker: { name: '피의 전사', pasName: '끓는 피', pasText: '생명력이 절반 아래일 때 넣는 피해 +25% 더', pas: { rage: 1.25 }, skills: [{ id: 'bloodwhirl', kind: 'atk', name: '피의 회오리', mp: 12, say: '몸을 돌려 세 번 베었다.', text: '힘으로 1.1배 피해를 세 번', dmg: 1.1, stat: 'str', hits: 3 }] },
  marksman: { name: '매의 눈', pasName: '급소 사냥', pasText: '급소에 맞으면 1.5배가 아니라 1.8배', pas: { critMult: 1.8 }, skills: [{ id: 'piercingeye', kind: 'atk', name: '꿰뚫는 눈', mp: 13, say: '빈틈이 보였다. 거기로.', text: '민첩으로 2.8배 피해. 방어를 무시한다', dmg: 2.8, stat: 'agi', pierce: true }] },
  pathfinder: { name: '숲의 추적자', pasName: '먼저 본다', pasText: '들판에서 먼저 알아챌 확률 +15%p', pas: { sense: 0.15 }, skills: [{ id: 'trackshot', kind: 'atk', name: '추적 사격', mp: 12, say: '발자국을 따라 쏘았다.', text: '민첩으로 0.9배 피해를 네 번', dmg: 0.9, stat: 'agi', hits: 4 }] },
  elementalist: { name: '원소 대가', pasName: '원소의 눈', pasText: '약점을 찔렀을 때 배율 +0.2', pas: { weak: 0.2 }, skills: [{ id: 'tristorm', kind: 'atk', name: '삼원소 폭풍', mp: 16, say: '불과 물과 바람이 차례로 몰아쳤다.', text: '불·물·바람으로 지혜 1.4배 피해를 한 번씩(방어 무시)', dmg: 1.4, stat: 'wis', pierce: true, elements: ['불', '물', '바람'] }] },
  summoner: { name: '정령술사', pasName: '정령의 벗', pasText: '동료가 치는 힘 +20% 더', pas: { friend: 1.2 }, skills: [{ id: 'spirithost', kind: 'atk', name: '정령 군단', mp: 15, say: '정령 셋이 줄지어 날아갔다.', text: '지혜로 1.2배 피해를 세 번(방어 무시)', dmg: 1.2, stat: 'wis', pierce: true, hits: 3 }] },
  healer: { name: '성자', pasName: '자비', pasText: '내가 고치는 힘 +30% 더', pas: { heal: 1.3 }, skills: [{ id: 'holyflame', kind: 'atk', element: '빛', name: '성스러운 불꽃', mp: 14, say: '손바닥 위에 흰 불이 섰다.', text: '지혜로 3배 피해(방어 무시, 빛)', dmg: 3.0, stat: 'wis', pierce: true }] },
  warden: { name: '성벽 사제', pasName: '두터운 가호', pasText: '감싸는 스킬이 덜 받게 하는 몫 +10%p', pas: { wardCut: 0.1 }, skills: [{ id: 'retribution', kind: 'atk', element: '빛', name: '응징', mp: 13, say: '받은 것을 그대로 돌려주었다.', text: '지혜로 2.5배 피해(방어 무시). 적의 공격 세 번이 40% 약해진다', dmg: 2.5, stat: 'wis', pierce: true, weaken: { cut: 0.4, turns: 3 } }] },
  shadow: { name: '밤의 칼날', pasName: '어둠 속 첫수', pasText: '싸움의 첫 턴에 넣는 피해 +30% 더', pas: { first: 1.3 }, skills: [{ id: 'nightdance', kind: 'atk', name: '밤의 난무', mp: 13, say: '칼이 네 번 번쩍였다.', text: '민첩으로 1배 피해를 네 번', dmg: 1.0, stat: 'agi', hits: 4 }] },
  graverobber: { name: '보물 사냥꾼', pasName: '보물 냄새', pasText: '전리품이 나올 확률 +10%', pas: { dropUp: 1.1 }, skills: [{ id: 'goldblade', kind: 'atk', name: '황금 칼날', mp: 12, say: '칼끝이 주머니를 스쳤다.', text: '민첩으로 2.2배 피해. 맞히면 은화를 조금 줍는다', dmg: 2.2, stat: 'agi', coin: true }] },
};
export const TIER4 = {
  knight: { name: '수호 기사단장', skills: [{ id: 'ordercharge', kind: 'atk', name: '기사단 돌격', mp: 18, say: '온몸을 실어 돌격했다.', text: '힘으로 3배 피해', dmg: 3.0, stat: 'str' }, { id: 'unbroken', kind: 'ult', name: '불굴', mp: 15, say: '무릎이 꺾이지 않았다.', text: '세 턴 동안 받는 피해 −90%. 한 싸움에 한 번', ward: { cut: 0.9, turns: 3 }, once: true }] },
  berserker: { name: '전쟁 군주', skills: [{ id: 'ruin', kind: 'atk', name: '파멸의 일격', mp: 20, say: '모든 것을 한 번에 내리쳤다.', text: '힘으로 3.5배 피해', dmg: 3.5, stat: 'str' }, { id: 'lastroar', kind: 'ult', name: '최후의 함성', mp: 10, say: '피를 토하며 소리쳤다.', text: '세 턴 동안 쓰러지지 않고(생명력 1에서 버틴다) 넣는 피해 +50%. 한 싸움에 한 번', undying: 3, buff: { dmg: 1.5, turns: 3 }, once: true }] },
  marksman: { name: '천리안', skills: [{ id: 'skysplit', kind: 'atk', name: '하늘 가르기', mp: 20, say: '화살이 하늘을 둘로 갈랐다.', text: '민첩으로 4배 피해', dmg: 4.0, stat: 'agi' }, { id: 'nevermiss', kind: 'ult', name: '백발백중', mp: 15, say: '보이는 것은 다 맞는다.', text: '세 턴 동안 모든 공격이 급소에 맞는다. 한 싸움에 한 번', sureTurns: 3, once: true }] },
  pathfinder: { name: '바람의 인도자', skills: [{ id: 'stormarrow', kind: 'atk', name: '폭풍 화살', mp: 18, say: '바람에 화살 여섯을 실었다.', text: '민첩으로 0.8배 피해를 여섯 번', dmg: 0.8, stat: 'agi', hits: 6 }, { id: 'windpath', kind: 'ult', name: '바람의 길', mp: 12, say: '바람이 길을 열었다.', text: '나와 동료의 생명력을 30% 채우고 반드시 달아난다. 한 싸움에 한 번', partyPct: 0.3, flee: true, once: true }] },
  elementalist: { name: '원소의 현자', skills: [{ id: 'elemcollapse', kind: 'atk', name: '원소 붕괴', mp: 24, say: '원소가 안쪽으로 무너졌다.', text: '지혜로 5배 피해(방어 무시)', dmg: 5.0, stat: 'wis', pierce: true }, { id: 'elemfree', kind: 'ult', name: '원소 해방', mp: 0, say: '원소가 마나 없이 대답했다.', text: '세 턴 동안 스킬에 마나가 들지 않는다. 한 싸움에 한 번', freeMp: 3, once: true }] },
  summoner: { name: '정령왕의 벗', skills: [{ id: 'kingbreath', kind: 'atk', name: '정령왕의 숨결', mp: 22, say: '큰 숨결이 쓸고 지나갔다.', text: '지혜로 4배 피해(방어 무시)', dmg: 4.0, stat: 'wis', pierce: true }, { id: 'kingcome', kind: 'ult', name: '정령왕 강림', mp: 20, say: '정령의 왕이 곁에 내려섰다.', text: '세 턴 동안 정령이 함께 친다(턴마다 지혜 2배). 한 싸움에 한 번', spirit: 3, once: true }] },
  healer: { name: '기적의 손', skills: [{ id: 'heavenwrath', kind: 'atk', element: '빛', name: '천벌', mp: 20, say: '하늘에서 빛이 내리꽂혔다.', text: '지혜로 4배 피해(방어 무시, 빛)', dmg: 4.0, stat: 'wis', pierce: true }, { id: 'miracle', kind: 'ult', name: '기적', mp: 20, say: '모두의 상처가 한꺼번에 닫혔다.', text: '나와 동료의 생명력·마나를 모두 채우고 상태이상을 지운다. 한 싸움에 한 번', miracle: true, once: true }] },
  warden: { name: '종의 수호자', skills: [{ id: 'bellring', kind: 'atk', element: '빛', name: '종의 울림', mp: 20, say: '어디선가 종이 크게 울렸다.', text: '지혜로 3.5배 피해(방어 무시). 적이 한 턴 못 움직인다', dmg: 3.5, stat: 'wis', pierce: true, stun: 1 }, { id: 'bellward', kind: 'ult', name: '종의 가호', mp: 18, say: '종소리가 몸을 감쌌다.', text: '세 턴 동안 적의 공격에 피해를 받지 않는다. 한 싸움에 한 번', ward: { cut: 1, turns: 3 }, once: true }] },
  shadow: { name: '밤의 주인', skills: [{ id: 'execute', kind: 'atk', name: '그림자 처형', mp: 20, say: '그림자가 목을 감았다.', text: '민첩으로 4배 피해. 적의 생명력이 30% 아래면 6배', dmg: 4.0, stat: 'agi', execute: { below: 0.3, dmg: 6 } }, { id: 'twinshadow', kind: 'ult', name: '그림자 분신', mp: 15, say: '그림자가 하나 더 일어섰다.', text: '세 턴 동안 모든 공격이 두 번 들어간다. 한 싸움에 한 번', twin: 3, once: true }] },
  graverobber: { name: '황금 손', skills: [{ id: 'greedblade', kind: 'atk', name: '탐욕의 칼', mp: 18, say: '가진 것을 다 내놓으라는 칼이었다.', text: '민첩으로 3배 피해', dmg: 3.0, stat: 'agi' }, { id: 'treasure', kind: 'ult', name: '보물 찾기', mp: 10, say: '이 싸움 끝에 무엇이 남을지 보였다.', text: '이 싸움을 이기면 전리품을 세 번 굴린다. 한 싸움에 한 번', loot: 2, once: true }] },
};
/** 장착할 수 있는 스킬 칸 (Z127). */
export const SKILL_SLOTS = 3;

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
  knight: { from: 'warrior', name: '기사', text: '최대 생명력 +40. 막는 스킬이 피해를 10%p 더 줄인다', hp: 40, guard: 0.1, skills: [{ id: 'shieldbash', kind: 'atk', name: '방패 강타', mp: 7, say: '방패 모서리로 들이받았다.', text: '힘으로 1.4배 피해. 적이 한 턴 못 움직인다', dmg: 1.4, stat: 'str', stun: 1 }, { id: 'guardstance', kind: 'job', name: '수호 태세', mp: 8, say: '방패를 땅에 박고 섰다.', text: '적의 공격 네 번을 50% 덜 받는다', ward: { cut: 0.5, turns: 4 } }] },
  berserker: { from: 'warrior', name: '광전사', text: '생명력이 절반 아래일 때 주는 피해 +25%', rage: 1.25, skills: [{ id: 'frenzy', kind: 'atk', name: '광란의 연타', mp: 9, say: '숨도 쉬지 않고 휘둘렀다.', text: '힘으로 0.8배 피해를 세 번', dmg: 0.8, stat: 'str', hits: 3 }, { id: 'bloodrage', kind: 'job', name: '피의 광기', mp: 0, say: '제 피를 보고 웃었다.', text: '생명력 15%를 내고, 세 턴 동안 넣는 피해 +40%', selfCost: 0.15, buff: { dmg: 1.4, turns: 3 } }] },
  marksman: { from: 'archer', name: '명사수', text: '급소를 맞힐 확률 +12%p', crit: 0.12, skills: [{ id: 'snipe', kind: 'atk', name: '필살 저격', mp: 11, say: '숨을 멈추고 한 점을 보았다.', text: '민첩으로 2.6배 피해. 급소 확률 +30%p', dmg: 2.6, stat: 'agi', crit: 0.3 }, { id: 'focusshot', kind: 'job', name: '집중', mp: 5, say: '화살 끝이 흔들리지 않는다.', text: '다음 공격이 반드시 급소에 맞는다', sure: 1 }] },
  pathfinder: { from: 'archer', name: '길잡이', text: '달아날 확률 +25%p. 가는 길에 습격당하지 않는다', flee: 0.25, noAmbush: true, skills: [{ id: 'arrowrain', kind: 'atk', name: '화살 비', mp: 9, say: '하늘로 화살을 흩뿌렸다.', text: '민첩으로 0.6배 피해를 네 번', dmg: 0.6, stat: 'agi', hits: 4 }, { id: 'windstep', kind: 'job', name: '바람 걸음', mp: 6, say: '바람이 부는 쪽으로 몸을 실었다.', text: '세 턴 동안 적의 공격을 25% 확률로 피한다', dodge: { p: 0.25, turns: 3 } }] },
  elementalist: { from: 'mage', name: '원소술사', text: '약점을 찔렀을 때 1.5배가 아니라 1.9배', weak: 1.9, skills: [{ id: 'elemburst', kind: 'atk', name: '원소 폭발', mp: 14, say: '네 원소가 한 점에서 터졌다.', text: '지혜로 3배 피해(방어 무시). 적의 약점 속성으로 친다', dmg: 3.0, stat: 'wis', pierce: true, weakElem: true }, { id: 'manaflow', kind: 'job', name: '마나 순환', mp: 0, say: '흩어진 마나를 다시 모았다.', text: '마나를 최대의 25% 채운다. 한 싸움에 한 번', mpBack: 0.25, once: true }] },
  summoner: { from: 'mage', name: '부름꾼', text: '동료가 치는 힘 +40%', friend: 1.4, skills: [{ id: 'spiritcall', kind: 'atk', name: '정령 소환', mp: 11, say: '작은 정령 둘이 튀어나왔다.', text: '지혜로 1.6배 피해를 두 번(방어 무시)', dmg: 1.6, stat: 'wis', pierce: true, hits: 2 }, { id: 'spiritward', kind: 'job', name: '정령의 가호', mp: 8, say: '정령이 일행 둘레를 돌았다.', text: '동료들의 생명력을 지혜 × 2만큼 채운다', partyHeal: 2 }] },
  healer: { from: 'priest', name: '치유사', text: '내가 고치는 힘 +50%', heal: 1.5, skills: [{ id: 'lightspear', kind: 'atk', element: '빛', name: '빛의 창', mp: 9, say: '빛이 창이 되어 날아갔다.', text: '지혜로 2.2배 피해(방어 무시, 빛)', dmg: 2.2, stat: 'wis', pierce: true }, { id: 'greatheal', kind: 'job', name: '대치유', mp: 10, say: '두 손을 펴 일행을 감쌌다.', text: '생명력을 지혜 × 6만큼 채우고, 동료도 그 절반', heal: 6, partyHeal: 3 }] },
  warden: { from: 'priest', name: '수호 사제', text: '감싸는 스킬이 한 번 더 듣는다', ward: 1, skills: [{ id: 'judgment', kind: 'atk', element: '빛', name: '심판', mp: 9, say: '높은 목소리로 심판을 내렸다.', text: '지혜로 1.8배 피해(방어 무시). 적의 공격 세 번이 40% 약해진다', dmg: 1.8, stat: 'wis', pierce: true, weaken: { cut: 0.4, turns: 3 } }, { id: 'sanctuary', kind: 'job', name: '성역', mp: 10, say: '발밑에 빛의 원이 섰다.', text: '적의 공격 다섯 번을 50% 덜 받는다', ward: { cut: 0.5, turns: 5 } }] },
  shadow: { from: 'rogue', name: '그림자', text: '싸움의 첫 턴에 주는 피해 +50%', first: 1.5, skills: [{ id: 'shadowstrike', kind: 'atk', name: '그림자 습격', mp: 9, say: '그림자에서 칼이 나왔다.', text: '민첩으로 2배 피해. 싸움의 첫 턴이면 3.5배', dmg: 2.0, stat: 'agi', first: 3.5 }, { id: 'lurk', kind: 'job', name: '잠복', mp: 7, say: '숨을 죽이고 그늘에 녹았다.', text: '두 턴 동안 적의 공격에 맞지 않는다', vanish: 2 }] },
  graverobber: { from: 'rogue', name: '도굴꾼', text: '자물쇠 따기 +25%p', pick: 0.25, skills: [{ id: 'poisonblade', kind: 'atk', name: '독칼', mp: 6, say: '칼날에 독을 발랐다.', text: '민첩으로 1배 피해. 세 턴 동안 독이 돈다', dmg: 1.0, stat: 'agi', poison: 3 }, { id: 'plunder', kind: 'job', name: '약탈', mp: 5, say: '쓰러뜨리면 무엇을 챙길지 먼저 보았다.', text: '이 싸움을 이기면 전리품을 한 번 더 굴린다', loot: 1 }] },
};
