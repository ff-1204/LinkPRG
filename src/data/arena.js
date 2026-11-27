// 겨루기 마당의 상대들 (AG-C). 이름과 버릇은 처음 값이다.
// 버릇은 구경으로만 알 수 있고(AG-C5), 상대는 정말 그 버릇대로 움직인다. 버릇이 걸리지 않는 수는 지금 "모험가와 싸우기"의 틀대로 고른다.

/** 겨루기 상대의 세기 (AG-C2, M23-4): 그 레벨 보통 몬스터의 생명력·공격력에 곱한다. 앞서는 "모험가와 싸우기"의 숫자(1.2·1.1)를 그대로 썼다. */
export const ARENA_FOE = { hp: 2.5, attack: 1.4 };

/** 버릇: say는 구경할 때 적히는 글({name}은 상대 이름). 규칙은 arenaIntent가 읽는다. */
export const HABITS = {
  third: '{name}은 세 번째 수마다 크게 휘두른다.',
  even: '{name}은 짝수 번째 수마다 크게 휘두른다.',
  openLight: '{name}은 첫 수를 늘 가볍게 벤다.',
  openHeavy: '{name}은 첫 수부터 크게 휘두른다.',
  afterRest: '{name}은 숨을 고른 다음에는 반드시 크게 휘두른다.',
  afterHeavy: '{name}은 크게 휘두른 다음에는 반드시 가볍게 벤다.',
  lowRest: '{name}은 몰리면 한 번 물러나 숨을 고른다.',
  noRest: '{name}은 숨을 고르지 않는다. 틈이 없다.',
  fourth: '{name}은 네 번째 수마다 숨을 고른다.',
};

/** 상대 여섯. habits: 앞의 것이 먼저 듣는다. 받침이 있는 이름은 '은', 없는 이름은 '는'으로 적는다(eun). */
export const ARENA_FOES = [
  { id: 'nail', name: '쇠못', eun: '은', habits: ['third', 'afterRest', 'openLight'] },
  { id: 'asheye', name: '잿눈', eun: '은', habits: ['openHeavy', 'afterHeavy', 'lowRest'] },
  { id: 'spark', name: '불티', eun: '는', habits: ['even', 'openLight', 'noRest'] },
  { id: 'anvilfoot', name: '모루발', eun: '은', habits: ['fourth', 'afterRest', 'openHeavy'] },
  { id: 'bellowhand', name: '풀무손', eun: '은', habits: ['lowRest', 'afterRest', 'third'] },
  { id: 'blackpot', name: '검은솥', eun: '은', habits: ['noRest', 'afterHeavy', 'openHeavy'] },
];
export const foeById = (id) => ARENA_FOES.find((f) => f.id === id);
export const habitSay = (foe, habit) => HABITS[habit].replace('{name}은', `${foe.name}${foe.eun}`);

/**
 * 버릇이 정하는 다음 수. 걸리는 버릇이 없으면 null(지금 틀대로 고른다).
 * @param a 싸움에 적어 둔 것 { foe, last(앞의 수), rested(몰려서 숨을 고른 적이 있는가) }
 * @param turn 몇 번째 수인가(1부터)
 * @param low 생명력이 절반 아래인가
 * @returns 'slash' | 'heavy' | 'breath' | null
 */
export function arenaIntent(a, turn, low) {
  const foe = foeById(a.foe);
  if (!foe) return null;
  for (const h of foe.habits) {
    if (h === 'openLight' && turn === 1) return 'slash';
    if (h === 'openHeavy' && turn === 1) return 'heavy';
    if (h === 'lowRest' && low && !a.rested) return 'breath';
    if (h === 'afterRest' && a.last === 'breath') return 'heavy';
    if (h === 'afterHeavy' && a.last === 'heavy') return 'slash';
    if (h === 'fourth' && turn % 4 === 0) return 'breath';
    if (h === 'third' && turn % 3 === 0) return 'heavy';
    if (h === 'even' && turn % 2 === 0) return 'heavy';
  }
  return null;
}
/** 숨을 고르지 않는 상대인가. */
export const neverRests = (a) => !!foeById(a.foe)?.habits.includes('noRest');
