// 동료 (T20, T21, T25~T28, H1-1~H1-4). 파티는 나와 동료 둘까지.
// 동료는 방침대로 스스로 움직인다. 바라는 것을 세 번 거스르면 떠난다.

export const PARTY_MAX = 2;
export const CROSS_LIMIT = 3;
export const MERC_FEE = 60; // 용병은 하루 은화 60
export const ROLE_BONUS = 0.05; // 막는 사람·때리는 사람·고치는 사람이 고루 있으면 모든 판정 +5% (T26)
export const GUARD_RATE = 0.7; // '나를 먼저'인 앞줄 동료가 대신 맞아 줄 확률

export const ROLES = { guard: '막는 사람', striker: '때리는 사람', healer: '고치는 사람' };
export const ROWS = { front: '앞줄', back: '뒷줄' };

/** 방침. 이름과 수는 역할마다 다르다 (H1-2). */
export const PLANS = {
  healer: [
    { id: 'half', name: '절반 아래면 치유', text: '내 생명력이 절반 아래일 때만 고친다. 아니면 조금 거든다' },
    { id: 'healonly', name: '치유만', text: '고칠 것이 있으면 늘 고친다. 치지 않는다' },
    { id: 'mefirst', name: '나를 먼저', text: '내 생명력이 조금만 줄어도 고친다' },
    { id: 'auto', name: '알아서', text: '스스로 정한다. 사이가 좋을수록 잘한다' },
  ],
  guard: [
    { id: 'mefirst', name: '나를 먼저', text: '내가 맞을 것을 대신 맞아 준다' },
    { id: 'together', name: '같이 친다', text: '막지 않고 함께 친다' },
    { id: 'hold', name: '뒤에서 기다린다', text: '싸움에 끼지 않는다. 맞지도 않는다' },
    { id: 'auto', name: '알아서', text: '스스로 정한다. 사이가 좋을수록 잘한다' },
  ],
  striker: [
    { id: 'together', name: '같이 친다', text: '턴마다 친다' },
    { id: 'finish', name: '끝만 낸다', text: '적의 생명력이 삼분의 일 아래일 때만 친다' },
    { id: 'hold', name: '뒤에서 기다린다', text: '싸움에 끼지 않는다. 맞지도 않는다' },
    { id: 'auto', name: '알아서', text: '스스로 정한다. 사이가 좋을수록 잘한다' },
  ],
};

/**
 * 동료의 바탕. hates: 무엇을 거스르는 것으로 치는가
 *   greed(실리 쪽 선택을 했을 때) · hungry(굶은 채 하루를 넘겼을 때) · unpaid(삯을 못 냈을 때. 바로 떠난다) · flee(싸움에서 달아났을 때)
 */
export const COMPANIONS = {
  miru: {
    id: 'miru', name: '미루', what: '견습 사제', way: 'person', person: 'miru', role: 'healer', row: 'back',
    hp: 60, attack: 5, heal: 16, element: '빛',
    wants: '다친 사람을 두고 가지 않는 것', hates: 'greed', hateSay: '미루가 한참 말이 없다. "…그건 아니잖아요."',
    join: '"저, 저도 가도 돼요? 신전에서는 종소리가 어디서 나는지 아무도 안 알려 줘요."', leave: '"저는 여기까지만 갈게요." 미루가 고개를 숙이고 돌아섰다.',
  },
  gaon: {
    id: 'gaon', name: '가온', what: '용병', way: 'merc', role: 'striker', row: 'front',
    hp: 110, attack: 16, element: '땅',
    wants: '날마다 삯을 받는 것', hates: 'unpaid', hateSay: '',
    join: '"하루 은화 육십. 선불은 아니고, 날이 바뀔 때 받겠소."', leave: '"삯이 없으면 칼도 없소." 가온이 짐을 챙겨 떠났다.',
  },
  stonerabbit: {
    id: 'stonerabbit', name: '돌토끼', what: '생명을 얻은 조각', way: 'work', role: 'guard', row: 'front',
    hp: 80, attack: 8, element: '땅',
    wants: '만든 이가 굶지 않는 것', hates: 'hungry', hateSay: '돌토끼가 내 빈 밥그릇을 한참 들여다본다.',
    join: '나무였던 것이 눈을 깜빡인다. 귀를 한 번 털고, 발치에 와서 앉는다.', leave: '돌토끼가 숲 쪽으로 뛰어갔다. 뒤돌아보지 않았다.',
  },
  woodboar: {
    id: 'woodboar', name: '나무 멧돼지', what: '생명을 얻은 조각', way: 'work', role: 'striker', row: 'front',
    hp: 100, attack: 14, element: '땅',
    wants: '싸움에서 등을 보이지 않는 것', hates: 'flee', hateSay: '나무 멧돼지가 콧김을 뿜으며 땅을 긁는다.',
    join: '나무 엄니가 번쩍 들린다. 콧김이 한 번 나온다.', leave: '나무 멧돼지가 등을 돌리고 숲으로 들어갔다.',
  },
  woodwolf: {
    id: 'woodwolf', name: '나무 늑대', what: '생명을 얻은 조각', way: 'work', role: 'striker', row: 'front',
    hp: 90, attack: 15, element: '바람',
    wants: '싸움에서 등을 보이지 않는 것', hates: 'flee', hateSay: '나무 늑대가 낮게 으르렁거린다.',
    join: '나무 귀가 쫑긋 선다. 길게 한 번 운다.', leave: '나무 늑대가 한 번 울고 숲으로 사라졌다.',
  },
};
