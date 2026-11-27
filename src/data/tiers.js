// 3~10단계의 재료·장비·설계도·요리·몬스터 (LV-C, LV-F, LV-H). 아직 그 지역(곳)이 없어 게임 안에서는 닿지 않는다.
// 지역을 낼 때(M15~M22) 곳과 사냥터에 잇는다. 이름과 글은 사용자가 읽고 확정하기 전의 처음 값이다.
// 숫자는 구간 자료(bands.js)에서 나온다. 이 파일은 다른 자료 파일을 부르지 않는다(물건·설계도 파일이 이 파일을 부른다).

import { BANDS, foodRate, BOSS, normalAt } from './bands.js?v=2134347';

/** metal·hide·meat: [id, 이름, 한 줄]. sword·shield·body: 시안이 따로 이름 붙인 승급작 (LV-F). dish: [id, 이름, 버프 이름, 귀띔]. */
export const TIERS = [
  { n: 3, metal: ['frostiron', '서릿쇠 덩이', '입김이 닿으면 하얗게 서리는 쇠.'], hide: ['whitefur', '흰털 가죽', '눈밭에 놓으면 보이지 않는다.'], meat: ['icemeat', '얼음 멧돼지 고기', '칼이 잘 들어가지 않을 만큼 얼어 있다.'], dish: ['snowpot', '눈밭 전골', '녹은 손끝', '눈을 녹인 물에 고기를 넣고 뚜껑을 덮어 오래 둬.'] },
  { n: 4, metal: ['saltsteel', '소금강 덩이', '소금기가 밴 강철. 녹이 슬지 않는다.'], hide: ['scorpshell', '전갈 껍질', '두드리면 쇳소리가 난다.'], meat: ['wormmeat', '갯지렁이 살', '말리면 짭짤한 포가 된다.'], shield: '저울꾼의 방패', dish: ['saltgrill', '소금벌 구이', '짠 숨', '소금 바닥에 그대로 올려 구워. 소금은 치지 마.'] },
  { n: 5, metal: ['ashiron', '잿쇠 덩이', '식어도 속에 불빛이 남아 있다.'], hide: ['lizardscale', '도마뱀 비늘', '불똥이 튀어도 그을리지 않는다.'], meat: ['crabmeat', '쇳물 게살', '껍데기째 달궈야 익는다.'], dish: ['embercrab', '잿불 게 구이', '달궈진 속', '식지 않는 재에 묻어 뒀다가 껍데기가 울면 꺼내.'] },
  { n: 6, metal: ['mossiron', '이끼쇠 덩이', '늪에서 건진 쇠. 푸른빛이 돈다.'], hide: ['mistthread', '안개실', '젖어도 무거워지지 않는 실.'], meat: ['toadleg', '두꺼비 다리', '독을 빼려면 세 번 삶는다.'], body: '안개실 옷', dish: ['marshbrew', '늪 약탕', '맑아진 눈', '세 번 삶고 세 번 버려. 네 번째 물만 마셔.'] },
  { n: 7, metal: ['oldbronze', '옛 청동 덩이', '가라앉은 도성의 문에서 떼어 낸 청동.'], hide: ['scalehide', '비늘 가죽', '물속에서 더 부드러워진다.'], meat: ['jellycurd', '해파리 묵', '씹으면 작은 종소리가 나는 것 같다.'], sword: '근위병의 창', dish: ['scalesteam', '비늘 찜', '깊은 숨통', '물 밑에서 건진 것은 물로만 익혀.'] },
  { n: 8, metal: ['cloudsilver', '구름은 덩이', '손에 쥐면 무게가 없는 것 같다.'], hide: ['goatwool', '염소털', '벼랑 바람을 막아 준다.'], meat: ['goatmeat', '구름 염소 고기', '높은 데서 자라 질기다.'], dish: ['goatporridge', '염소젖 죽', '가벼운 몸', '젖이 끓어 넘치기 직전에 불에서 내려.'] },
  { n: 9, metal: ['starmetal', '별쇠 덩이', '떨어진 별의 속. 어두운 데서 빛난다.'], hide: ['mothsilk', '나방 비단', '빛을 받으면 무늬가 바뀐다.'], meat: ['stardust', '별가루', '혀에 닿으면 차갑다.'], dish: ['starcake', '별가루 떡', '또렷한 손', '못의 물로 반죽해. 다른 물로는 뭉쳐지지 않아.'] },
  { n: 10, metal: ['firstiron', '첫쇠 덩이', '첫 종을 짓고 남은 쇠.'], hide: ['shadowhide', '그림자 가죽', '약속의 그림자에서 벗겨 낸 것. 만져지는 것이 이상하다.'], meat: ['anvilsalt', '모루 소금', '식은 쇳물에서 긁어낸 소금.'], dish: ['anviltable', '모루 밥상', '끝까지 가는 힘', '가진 것을 다 넣어. 여기까지 온 사람의 밥이야.'] },
];
export const tierByNo = (n) => TIERS.find((t) => t.n === n);
const short = (name) => name.replace(/ 덩이$/, '');
/** 받침에 맞춰 "와/과"를 붙인다. */
const wa = (word) => word + ((word.charCodeAt(word.length - 1) - 0xac00) % 28 ? '과' : '와');
const r = Math.round;
/** 그 단계 기도 구슬의 공격력: 그 단계 검의 이만큼 (M24-3. 계산 도구로 재서 사제가 전사의 10%p 안에 들게 잡았다). 1~20의 기도 구슬(방어력 2)은 그대로다. */
export const BEADS = 0.5;

/** 그 단계의 장비 열한 가지(열 가지에 사제의 기도 구슬, M24-3): [키, 자리, 이름, 공격, 방어, 직업, 그림, 값의 몫(하루 벌이 대비)]. */
function gearRows(t) {
  const b = BANDS[t.n - 1], m = short(t.metal[1]), h = t.hide[1];
  const W = b.weapon, A = b.armor;
  const off = r(A * 0.22), head = r(A * 0.16), hand = r(A * 0.06), feet = r(A * 0.16), body = A - off - head - hand - feet;
  return [
    ['sword', 'weapon', t.sword || `${m} 검`, W, 0, null, null, 1.1],
    ['bow', 'weapon', `${m} 촉 활`, r(W * 0.58), 0, 'archer', 'item-bow', 0.55],
    ['knife', 'weapon', `${m} 단검`, r(W * 0.5), 0, 'rogue', 'item-knife', 0.5],
    ['wand', 'weapon', `${m} 고리 지팡이`, r(W * 0.9), 0, 'mage', 'item-wand', 0.55], // 검의 0.9배 (M23-2. 앞서는 0.3배였다: 마법사가 전사보다 한 판에 15~20%p 더 잃었다)
    ['shield', 'off', t.shield || `${m} 방패`, 0, off, 'warrior', 'item-shield', 0.55],
    ['helm', 'head', `${m} 투구`, 0, head, null, 'item-ore', 0.7],
    ['armor', 'body', t.body || `${m} 갑옷`, 0, body, null, 'item-cloth', 1.8],
    ['gloves', 'hand', `${h} 장갑`, 1, hand, null, 'item-hide', 0.4],
    ['boots', 'feet', `${h} 장화`, 0, feet, null, 'item-sandal', 0.6],
    ['ring', 'ring', `${m} 반지`, r(W / 12), r(A / 11), null, 'item-ore', 0.8],
    ['beads', 'ring', `${m} 기도 구슬`, r(W * BEADS), 0, 'priest', 'item-beads', 0.5], // 사제의 윗단계 기도 구슬 (M24-3): 반지 자리, 공격력만 준다
  ];
}
const gid = (t, key) => `${t.metal[0]}_${key}`;

/** 물건: 재료 셋, 장비 열하나, 음식 하나. */
export function tierItems() {
  const out = {};
  for (const t of TIERS) {
    const b = BANDS[t.n - 1];
    out[t.metal[0]] = { name: t.metal[1], kind: 'material', tier: t.n, weight: 1, icon: 'item-ore', price: b.perKill, desc: t.metal[2] };
    out[t.hide[0]] = { name: t.hide[1], kind: 'material', tier: t.n, weight: 2, icon: 'item-hide', price: b.perKill * 2, desc: t.hide[2] };
    out[t.meat[0]] = { name: t.meat[1], kind: 'material', tier: t.n, weight: 1, icon: 'item-meat', price: b.perKill, desc: t.meat[2] };
    for (const [key, slot, name, attack, defense, job, icon, share] of gearRows(t)) {
      out[gid(t, key)] = {
        name, kind: 'gear', slot, tier: t.n, ...(attack ? { attack } : {}), ...(defense ? { defense } : {}), dur: 80 + t.n * 20, weight: slot === 'body' ? 7 : slot === 'ring' || slot === 'hand' ? 0 : 3,
        price: r((b.day * share) / 10) * 10, ...(job ? { job } : {}), ...(icon ? { icon } : { gradeIcon: 'sword' }), ...(key === 'gloves' || key === 'boots' ? { hideOf: t.hide[0] } : {}), // hideOf: 그 가죽으로 지은 것(흰털 가죽이면 털옷, WM-B3)
        desc: `${wa(short(t.metal[1]))} ${t.hide[1]}의 단계에서 짓는 ${name}.${job ? ` ${{ archer: '궁수', rogue: '도적', mage: '마법사', warrior: '전사', priest: '사제' }[job]}만 쓴다.` : ''}`,
      };
    }
    const rate = r(foodRate(t.n) * 100);
    out[`dish_${t.dish[0]}`] = { name: t.dish[1], kind: 'eat', tier: t.n, weight: 1, icon: 'item-meat', price: r(b.day * 0.1), eat: { full: 70, dish: t.dish[0], ...(t.n === 3 ? { warm: 40 } : {}), ...(t.n === 4 ? { salty: 1 } : {}) }, desc: `먹으면 ${t.dish[2]}(공격력·방어력 +${rate}%).${t.n === 3 ? ' 뜨거워서 식은 몸이 풀린다(체온 +40).' : ''}${t.n === 4 ? ' 짜서 소금벌에서는 물이 한 모금 더 준다.' : ''}` };
  }
  // 윗단계 성수 (LV-H2): 깊은 성수는 61부터, 별빛 성수는 81부터. 지금 성수(5%)보다 센 가호를 건다
  // 사는 값은 지금 성수(레벨 × 6)처럼 레벨을 따라 오른다 (Z102): 깊은 성수 × 9, 별빛 성수 × 12. price는 되팔 때의 바탕값이다
  out.deepholy = { name: '깊은 성수', kind: 'eat', tier: 7, weight: 1, icon: 'item-water', price: 130, perLevel: 9, eat: { grace: 0.09, shadow: true }, desc: '잠긴 종루의 물로 축복한 성수. 마시면 죽음의 그림자가 걷히고 더 깊은 가호(공격력·방어력 +9%)가 두 때 동안 붙는다. 값은 레벨 × 9.' };
  out.starholy = { name: '별빛 성수', kind: 'eat', tier: 9, weight: 1, icon: 'item-water', price: 380, perLevel: 12, eat: { grace: 0.11, shadow: true }, desc: '별못의 물로 축복한 성수. 마시면 죽음의 그림자가 걷히고 별빛 가호(공격력·방어력 +11%)가 두 때 동안 붙는다. 값은 레벨 × 12.' };
  return out;
}

/** 요리: 단계마다 하나. 비율로 붙는다 (LV-H1). 그 단계 요리의 승급작이다. */
export function tierDishes() {
  const out = {};
  for (const t of TIERS) {
    const rate = foodRate(t.n);
    out[t.dish[0]] = { lv: (t.n - 1) * 4 + 2, ...(t.n < 10 ? { promo: true } : {}), name: t.dish[1], needs: [t.meat[0], 'herb', 'salt'], full: 70, buff: { name: t.dish[2], text: `공격력·방어력 +${r(rate * 100)}%`, rate, phases: 3 }, hint: `주방장: ${t.dish[3]}` };
  }
  return out;
}

/**
 * 설계도. 단계의 제작 레벨 넷(4n−3 ~ 4n)에 나눠 놓는다. 승급작: 대장은 검(시안이 방패·갑옷이라 한 단계는 그것), 재봉은 장화(6단계는 안개실 옷), 세공은 반지.
 * @returns {{ smith: object[], sew: object[], jewel: object[], cook: object[] }} 갈래마다 순서대로
 */
export function tierRecipes() {
  const out = { smith: [], sew: [], jewel: [], cook: [] };
  const SMITH_PROMO = { 4: 'shield', 5: 'armor', 8: 'armor' }; // 그 밖은 검
  for (const t of TIERS) {
    const base = (t.n - 1) * 4, M = t.metal[0], H = t.hide[0], m = short(t.metal[1]);
    const names = Object.fromEntries(gearRows(t).map((row) => [row[0], row[2]]));
    const mk = (key, lv, hits, needs, say, extra = {}) => ({ id: gid(t, key), name: names[key], makes: gid(t, key), difficulty: base + lv, hits, lv: base + lv, needs, say, ...extra });
    const sewBody = !!t.body; // 6단계: 몸통 옷을 꿰맨다
    const smithPromo = SMITH_PROMO[t.n] && !(sewBody && SMITH_PROMO[t.n] === 'armor') ? SMITH_PROMO[t.n] : 'sword';
    const smith = [
      mk('helm', 1, 14 + t.n, [{ id: M, n: 4 }], `${m}판을 둥글게 편다.`),
      mk('wand', 1, 12 + t.n, [{ id: 'oakbranch', n: 3 }, { id: M, n: 2 }], `자루 끝에 ${m} 고리를 건다. 마법사가 쓴다.`),
      mk('knife', 2, 12 + t.n, [{ id: M, n: 3 }, { id: 'oakbranch', n: 1 }], `${m} 날을 얇게 벼린다. 도적이 쓴다.`),
      mk('bow', 2, 12 + t.n, [{ id: 'oakbranch', n: 4 }, { id: H, n: 1 }, { id: M, n: 1 }], `활 끝에 ${m} 촉을 물린다. 궁수가 쓴다.`),
      mk('sword', 3, 16 + t.n, [{ id: M, n: 6 }, { id: 'oakbranch', n: 1 }], `${m}를 접고 두드리기를 거듭한다.`),
      mk('shield', 3, 14 + t.n, [{ id: 'oakbranch', n: 4 }, { id: M, n: 3 }], `나무판에 ${m}판을 덧댄다. 전사가 쓴다.`),
    ];
    if (!sewBody) smith.push(mk('armor', 4, 20 + t.n, [{ id: H, n: 4 }, { id: M, n: 6 }], `${t.hide[1]} 위에 ${m} 비늘을 한 장씩 엮는다.`));
    for (const x of smith) { x.skill = 'smithing'; x.branch = 'smith'; if (x.id === gid(t, smithPromo) && t.n < 10) x.promo = true; }
    const sew = [
      mk('gloves', 1, 10 + t.n, [{ id: H, n: 1 }], `${t.hide[1]}을 손 모양으로 꿰맨다.`),
      mk('boots', 2, 14 + t.n, [{ id: H, n: 3 }], `${t.hide[1]}로 밑창을 세 겹 댄다.`),
    ];
    if (sewBody) sew.push(mk('armor', 4, 20 + t.n, [{ id: H, n: 8 }, { id: M, n: 2 }], `${t.hide[1]}을 겹겹이 짜서 몸에 맞춘다.`));
    // 공기 주머니 (JD-B3): 비늘 가죽 둘로 직접 꿰맨다. 장비가 아니라 등급이 없다(plain)
    if (t.n === 7) sew.push({ id: 'airbag', name: '공기 주머니', makes: 'airbag', difficulty: base + 1, hits: 10 + t.n, lv: base + 1, needs: [{ id: H, n: 2 }], say: '비늘 가죽 두 장을 맞대어 꿰매고 공기를 불어 넣는다.', plain: true });
    for (const x of sew) { x.skill = 'leather'; x.branch = 'sew'; x.sew = true; if (x.id === gid(t, sewBody ? 'armor' : 'boots') && t.n < 10) x.promo = true; }
    const ring = mk('ring', 2, 12 + t.n, [{ id: M, n: 3 }, { id: 'wolffang', n: 2 }], `${m}를 가늘게 뽑아 세 번 감는다.`);
    Object.assign(ring, { skill: 'sculpting', branch: 'jewel', sew: true, jewel: true, ...(t.n < 10 ? { promo: true } : {}) });
    // 그 단계의 기도 구슬 (M24-3): 세공으로 꿴다. 승급작이 아니다
    const beads = mk('beads', 1, 10 + t.n, [{ id: 'oakbranch', n: 2 }, { id: M, n: 2 }], `참나무 구슬 사이에 ${m} 구슬을 꿴다. 사제가 쓴다.`);
    Object.assign(beads, { skill: 'sculpting', branch: 'jewel', sew: true, jewel: true });
    const cook = { id: `cook_${t.dish[0]}`, name: t.dish[1], makes: `dish_${t.dish[0]}`, dish: t.dish[0], skill: 'cooking', difficulty: base + 2, hits: 12 + t.n, sew: true, cook: true, branch: 'cook', lv: base + 2, needs: [{ id: t.meat[0], n: 1 }, { id: 'herb', n: 2 }, { id: 'salt', n: 1 }], say: t.dish[3], ...(t.n < 10 ? { promo: true } : {}) };
    out.smith.push(...smith); out.sew.push(...sew); out.jewel.push(beads, ring); out.cook.push(cook);
  }
  return out;
}

// ── 몬스터 (LV-C3~C10): 구간마다 보통 몬스터 넷(처음 모루는 셋). 우두머리는 지역을 낼 때 넣는다 ──
// [id, 이름, 레벨, 속성, 나타날 때 글, [치기 이름, 낌새, 맞았을 때], [모아 치기 이름, 낌새, 맞았을 때], 상태이상(없으면 null)]
const ROWS = [
  ['frostfox', '서리 여우', 21, '바람', '눈 위에 발자국이 없다. 꼬리 끝만 보였다 사라진다.', ['물기', '여우가 눈 속으로 몸을 묻는다.', '눈 속에서 튀어나온 이빨이 발목을 물었다.'], ['목 노리기', '여우의 꼬리가 멈춘다.', '흰 것이 눈앞을 스쳤다. 목덜미가 뜨겁다.'], null],
  ['snowowl', '눈 올빼미', 23, '바람', '소리가 없다. 그림자가 눈밭을 건너온다.', ['발톱', '올빼미가 고개를 돌린다. 끝까지 돌린다.', '발톱이 어깨에 박혔다.'], ['소리 없는 덮침', '올빼미가 가지에서 사라졌다.', '등 뒤에서 온 무게에 무릎이 꺾였다.'], ['fear', 2, 0.4]],
  ['iceboar', '얼음 멧돼지', 25, '물', '엄니에 고드름이 달렸다. 콧김이 얼어 떨어진다.', ['들이받기', '멧돼지가 얼음을 긁는다.', '언 엄니가 갈비뼈를 쳤다.'], ['미끄러져 오기', '멧돼지가 빙판 끝까지 물러난다.', '얼음을 타고 온 것이 온몸을 덮쳤다.'], null],
  ['iciclespider', '고드름 거미', 27, '물', '종루 처마의 고드름 하나가 다리를 편다.', ['찌르기', '거미가 앞다리를 든다.', '고드름 같은 다리가 팔을 꿰었다.'], ['떨어지기', '거미가 처마 위로 올라간다.', '위에서 떨어진 것이 어깨에 박혔다.'], ['bleed', 3, 0.5]],
  ['saltscorpion', '소금 전갈', 31, '땅', '소금 바닥이 갈라진다. 꼬리가 먼저 나온다.', ['집게', '전갈이 집게를 벌린다.', '집게가 정강이를 물었다.'], ['꼬리 침', '전갈의 꼬리가 등 뒤로 넘어온다.', '침이 박힌 자리가 타는 것 같다.'], ['bleed', 3, 0.5]],
  ['dryworm', '마른 갯지렁이', 33, '땅', '말라붙은 바닥 밑에서 무언가 길게 지나간다.', ['휘감기', '바닥이 불룩 솟는다.', '마른 몸통이 다리를 감아 조였다.'], ['삼키기', '발밑이 둥글게 꺼진다.', '바닥이 입을 벌렸다. 허리까지 물렸다.'], null],
  ['saltcrow', '소금 까마귀', 35, '바람', '깃털에 소금이 하얗게 앉았다. 눈만 검다.', ['쪼기', '까마귀가 고개를 갸웃한다.', '부리가 이마를 찍었다.'], ['떼로 덮기', '까마귀가 한 번 운다. 멀리서 답이 온다.', '검은 것이 한꺼번에 내려앉았다.'], ['fear', 2, 0.4]],
  ['weigher', '떠도는 저울꾼', 38, '어둠', '저울을 든 사람이 길을 막는다. 접시 하나가 비어 있다.', ['저울추', '저울꾼이 추를 손에 감는다.', '추가 턱을 올려쳤다.'], ['값 매기기', '저울꾼이 이쪽을 접시에 올려 본다.', '"모자라군." 무언가 빠져나간 것처럼 힘이 풀렸다.'], null],
  ['ashlizard', '잿빛 도마뱀', 41, '불', '재 더미가 눈을 뜬다.', ['꼬리 치기', '도마뱀이 몸을 튼다.', '달궈진 꼬리가 옆구리를 쳤다.'], ['불 뱉기', '도마뱀의 목이 붉어진다.', '뜨거운 숨이 얼굴을 덮었다.'], null],
  ['sparkbat', '불똥 박쥐', 43, '불', '가마 굴뚝에서 불똥이 쏟아진다. 불똥마다 날개가 있다.', ['스치기', '불똥 하나가 멈춘다.', '뜨거운 날개가 뺨을 그었다.'], ['떼 지어 내리기', '불똥들이 한데 모인다.', '불비가 쏟아졌다.'], null],
  ['moltencrab', '쇳물 게', 46, '불', '쇳물 웅덩이가 옆으로 걷는다.', ['집게', '게가 집게를 쳐든다.', '달군 집게가 팔을 물었다.'], ['쇳물 끼얹기', '게가 웅덩이에 집게를 담근다.', '쇳물이 다리에 튀었다.'], ['bleed', 3, 0.4]],
  ['ashblade', '재투성이 검꾼', 48, '불', '진 사람이다. 풀무를 밀다 말고 칼을 든다.', ['내려치기', '검꾼이 칼을 어깨에 멘다.', '무딘 날이 어깨를 찍었다.'], ['이기고 싶은 칼', '검꾼이 이를 문다. 눈이 종루 쪽을 본다.', '온 무게가 실린 칼이 떨어졌다.'], null],
  ['mosstoad', '이끼 두꺼비', 51, '땅', '돌인 줄 알고 밟았다. 돌이 숨을 쉰다.', ['혀', '두꺼비의 목이 부푼다.', '끈적한 혀가 손목을 휘감아 당겼다.'], ['덮쳐 앉기', '두꺼비가 몸을 웅크린다.', '이끼 낀 무게가 가슴에 내려앉았다.'], null],
  ['mistleech', '안개 거머리', 53, '물', '안개가 발목에 붙는다. 떼어지지 않는다.', ['빨기', '안개가 한곳으로 뭉친다.', '따끔했다. 힘이 조금 빠져나갔다.'], ['온몸에 붙기', '안개가 허리까지 차오른다.', '어디가 물렸는지 모른다. 전부 물렸다.'], ['bleed', 3, 0.6]],
  ['soakedscarecrow', '물먹은 허수아비', 56, '어둠', '허수아비가 늪에 반쯤 잠겨 있다. 누가 수없이 쳤던 자국이 있다.', ['팔 휘두르기', '허수아비의 팔이 천천히 올라간다.', '젖은 팔이 머리를 쳤다.'], ['그만둔 것들', '허수아비가 고개를 든다. 얼굴이 없다.', '하다 만 일들이 한꺼번에 떠올랐다. 무릎이 풀렸다.'], ['fear', 2, 0.6]],
  ['marshlight', '늪 등불', 58, '어둠', '불빛이 길을 알려 준다. 길이 아닌 쪽으로.', ['홀리기', '불빛이 가까워진다.', '따라가다 발이 빠졌다.'], ['꺼지기', '불빛이 한 번 깜빡인다.', '캄캄하다. 그리고 무언가 잡아당겼다.'], ['fear', 2, 0.5]],
  ['soakedgate', '물먹은 문지기', 61, '물', '문은 없는데 문지기가 서 있다. 창끝에서 물이 떨어진다.', ['찌르기', '문지기가 창을 고쳐 잡는다.', '녹슨 창끝이 옆구리를 찔렀다.'], ['막아서기', '문지기가 창을 가로로 든다.', '창대가 가슴을 밀어 벽에 박았다.'], null],
  ['scalehound', '비늘 사냥개', 63, '물', '물속에서 짖는 소리가 난다. 둘이다.', ['물기', '사냥개가 물살을 가른다.', '비늘 돋은 주둥이가 팔을 물었다.'], ['둘이 한꺼번에', '두 마리가 양쪽으로 갈라선다.', '앞을 막는 사이 뒤에서 물렸다.'], ['bleed', 3, 0.5]],
  ['belljelly', '종소리 해파리', 66, '물', '종 모양의 것이 떠 있다. 안에서 무언가 울린다.', ['촉수', '해파리가 촉수를 늘어뜨린다.', '닿은 자리가 저리다.'], ['울림', '해파리의 몸이 부푼다.', '귀가 아니라 뼈가 울렸다.'], ['fear', 2, 0.5]],
  ['sunkenguard', '가라앉은 근위병', 68, '어둠', '갑옷 안에 물뿐이다. 그래도 맹세는 남아 있다.', ['베기', '근위병이 검을 뽑는다. 물이 쏟아진다.', '물 먹은 검이 무겁게 떨어졌다.'], ['맹세의 일격', '근위병이 검을 가슴에 댄다.', '사십 년을 벼른 한 칼이었다.'], null],
  ['cloudgoat', '구름 염소', 71, '바람', '벼랑에 붙어 선 것이 이쪽을 내려다본다.', ['뿔', '염소가 고개를 숙인다.', '뿔이 배를 받았다.'], ['밀어 떨어뜨리기', '염소가 벼랑 쪽으로 돌아선다.', '받힌 채로 다리 끝까지 밀렸다.'], null],
  ['windknot', '바람 매듭', 73, '바람', '바람이 한자리에서 맴돈다. 풀리지 않는다.', ['채찍 바람', '매듭이 조여든다.', '바람이 뺨을 갈랐다.'], ['풀려나기', '매듭이 한 올 풀린다.', '묶여 있던 바람이 전부 쏟아졌다.'], null],
  ['stonemonk', '돌 수도승', 76, '땅', '기도하는 석상이 눈을 뜬다. 무릎에서 돌가루가 떨어진다.', ['주먹', '수도승이 합장을 푼다.', '돌 주먹이 가슴을 쳤다.'], ['절', '수도승이 깊이 몸을 숙인다.', '이마가 정수리에 떨어졌다.'], null],
  ['goldmask', '금빛 가면', 78, '빛', '가면만 떠 있다. 뒤에 얼굴이 없다.', ['빛', '가면의 눈이 밝아진다.', '눈이 멀 것 같다. 무언가 베고 지나갔다.'], ['심판', '가면이 이쪽을 똑바로 본다.', '"듣지 못한 자." 그 말이 칼처럼 들어왔다.'], ['fear', 2, 0.5]],
  ['starmoth', '별가루 나방', 81, '빛', '날개에서 가루가 떨어진다. 떨어진 자리가 빛난다.', ['가루', '나방이 날개를 턴다.', '가루가 닿은 살갗이 따갑다.'], ['빛 모으기', '나방이 못 위에서 멈춘다.', '별 하나가 통째로 떨어진 것 같았다.'], null],
  ['pondmirror', '못의 거울상', 83, '물', '물에 비친 내가 먼저 움직인다.', ['같은 칼', '거울상이 내 자세를 따라 한다.', '내가 치려던 그대로 맞았다.'], ['한 수 앞', '거울상이 웃는다. 나는 웃지 않았다.', '막으려던 곳이 아니라 그 옆이었다.'], null],
  ['starshard', '떨어진 별 조각', 86, '빛', '돌인 줄 알았다. 식지 않은 돌이다.', ['튀는 조각', '조각에 금이 간다.', '뜨거운 파편이 살에 박혔다.'], ['다시 떨어지기', '조각이 떠오른다.', '하늘에서 한 번 더 떨어졌다.'], ['bleed', 3, 0.4]],
  ['voidecho', '답 없는 메아리', 88, '어둠', '불렀는데 답이 없다. 답이 없는 것이 다가온다.', ['되돌려주기', '메아리가 숨을 죽인다.', '내가 낸 소리가 주먹이 되어 돌아왔다.'], ['침묵', '모든 소리가 멎는다.', '아무도 보지 않았다는 생각이 들었다. 팔이 내려갔다.'], ['fear', 2, 0.6]],
  ['coldmelt', '식은 쇳물', 91, '땅', '굳다 만 쇳물이 틀을 찾아 긴다.', ['덮기', '쇳물이 솟는다.', '무거운 것이 다리를 덮고 굳었다.'], ['틀에 붓기', '쇳물이 이쪽 모양을 본뜬다.', '온몸이 틀에 갇힌 것 같았다.'], null],
  ['promiseshadow', '약속의 그림자', 94, '어둠', '지키지 않은 약속이 서 있다. 내 것인지는 모르겠다.', ['손 내밀기', '그림자가 손을 편다.', '잡힌 손목이 얼음 같다.'], ['"끝까지 한다고 했잖아"', '그림자가 입을 연다.', '그 말이 가장 아팠다.'], ['fear', 2, 0.6]],
  ['firsthand', '첫 장인의 손', 97, '빛', '모루 위에 손 하나가 놓여 있다. 망치를 쥔다.', ['망치', '손이 망치를 든다.', '벼리듯이 맞았다. 정확하고 무겁다.'], ['마지막 망치질', '손이 망치를 높이 든다. 오래 든다.', '종을 짓던 그 한 번이었다.'], null],
];
const DROP_PLAN = [['hide', 'metal'], ['meat'], ['hide', 'meat'], ['metal', 'hide']]; // 구간 안에서 차례로. 몬스터가 셋뿐인 구간에서도 재료 셋이 다 나오게

// ── 우두머리 (LV-C3~, LV-I3). 지역을 낼 때 하나씩 넣는다. 글은 처음 값이다 ──
const BOSS_ROWS = [
  { id: 'bellwarden', name: '잠든 종의 파수꾼', level: 30, element: '물', drops: ['metal', 'hide'],
    intro: '종을 감싼 얼음에서 사람 꼴 하나가 떨어져 나온다. 눈을 뜨지 않는다. 감은 채로 이쪽을 향해 선다.',
    moves: [
      { id: 'hit', name: '얼음 주먹', kind: 'hit', power: 1, tell: '파수꾼이 주먹을 쥔다. 손가락 사이로 성에가 핀다.', say: '얼음 주먹이 가슴을 쳤다. 숨이 하얗게 터진다.', w: 3 },
      { id: 'charge', name: '재우는 품', kind: 'charge', power: 1.9, tell: '파수꾼이 두 팔을 벌린다. 둘레의 공기가 얼어 든다.', say: '찬 품이 온몸을 감쌌다. 졸음 같은 것이 뼈까지 들어온다.', w: 2 },
      { id: 'doze', name: '도로 잠들기', kind: 'wait', power: 0, tell: '파수꾼의 고개가 천천히 떨어진다.', say: '파수꾼이 선 채로 잠깐 잠들었다. 삼십 년을 그렇게 서 있었다.', w: 2 },
    ] },
  // 소금벌 (SB-A11): 종 조각 창고의 맨 안쪽. 값을 걷으러 다니던 사람이 소금 기둥이 되었다
  { id: 'taxcollector', name: '소금 기둥의 징수인', level: 40, element: '땅', drops: ['metal', 'hide'],
    intro: '선반 사이에 소금 기둥 하나가 서 있다. 사람 꼴이다. 한 손은 장부를 끼고, 한 손은 이쪽으로 내밀고 있다. 손바닥이 위를 본다.',
    moves: [
      { id: 'hit', name: '걷어 가기', kind: 'hit', power: 1, tell: '징수인이 내민 손을 오므린다.', say: '소금 손이 어깨를 움켜쥐고 뜯어 갔다. 무언가 걷힌 것 같다.', w: 3 },
      { id: 'charge', name: '밀린 셈', kind: 'charge', power: 1.9, tell: '징수인이 장부를 편다. 소금 가루가 쏟아진다.', say: '밀린 것이 한꺼번에 떨어졌다. 무릎이 바닥에 닿았다.', w: 2 },
      { id: 'count', name: '셈 맞추기', kind: 'wait', power: 0, tell: '징수인이 손가락을 하나씩 꼽는다.', say: '징수인이 셈을 다시 한다. 맞지 않는 모양이다. 처음부터 다시 꼽는다.', w: 2 },
    ] },
  // 잿골 (AG-A10): 식지 않는 가마의 맨 안쪽. 종을 녹여 검으로 벼린 그 망치가 아직 친다
  { id: 'bellhammer', name: '벼린 종의 망치', level: 50, element: '불', drops: ['metal', 'hide'],
    intro: '모루 위의 망치가 멈춘다. 쥔 사람이 없다. 자루 둘레의 뜨거운 공기가 팔 모양으로 일렁인다. 망치 머리가 천천히 이쪽으로 돈다.',
    moves: [
      { id: 'hit', name: '벼리기', kind: 'hit', power: 1, tell: '망치가 어깨 높이로 올라간다.', say: '망치가 쇠를 치듯이 내려왔다. 맞은 자리가 벌겋게 단다.', w: 3 },
      { id: 'charge', name: '이긴 쇠만 남긴다', kind: 'charge', power: 1.9, tell: '망치가 머리 위까지 올라가 멈춘다. 가마의 불이 한꺼번에 밝아진다.', say: '가마의 열이 다 실린 한 번이었다. 무릎이 바닥에 닿았다.', w: 2 },
      { id: 'quench', name: '담금질', kind: 'wait', power: 0, tell: '망치가 물통 쪽으로 기운다.', say: '망치가 제 머리를 물통에 담근다. 김이 오른다. 그동안은 치지 않는다.', w: 2 },
    ] },
  // 안개늪 (AN-A10): 가라앉는 오솔길의 끝. 종 곁을 떠나지 않다가 종과 한 몸이 된 마지막 종지기
  { id: 'mossbellman', name: '이끼 덮인 종지기', level: 60, element: '땅', drops: ['metal', 'hide'], curseSay: '종지기의 이끼가 살갗에 옮겨 붙었다.',
    intro: '종지기가 종에서 몸을 뗀다. 이끼가 실처럼 늘어나다 끊어진다. 얼굴은 보이지 않는다. 종 줄을 쥔 손만 그대로다.',
    moves: [
      { id: 'hit', name: '종 줄', kind: 'hit', power: 1, tell: '종지기가 줄을 손에 한 번 더 감는다.', say: '젖은 종 줄이 채찍처럼 어깨를 감았다 풀렸다.', w: 3 },
      { id: 'charge', name: '울리지 않는 종', kind: 'charge', power: 1.9, tell: '종지기가 종을 두 팔로 민다. 종이 뒤로 한껏 물러난다.', say: '돌아온 종이 온몸을 쳤다. 소리는 나지 않았다. 이끼가 소리를 다 먹었다.', w: 2 },
      { id: 'nod', name: '졸음', kind: 'wait', power: 0, tell: '종지기의 고개가 종 쪽으로 기운다.', say: '종지기가 종에 이마를 대고 잠깐 존다. 아무도 오지 않던 날들처럼.', w: 2 },
    ] },
  // 잠긴 도성 (JD-A11): 잠긴 궁의 맨 안쪽. 터진 종의 메아리가 아직 운다. 아무에게나, 끝없이. gifted: 연 하사품 상자마다 5%씩 세진다 (JD-D, 화면에 나오지 않는다)
  { id: 'bellecho', name: '늘 울리던 종의 메아리', level: 70, element: '물', drops: ['metal', 'hide'], gifted: true,
    intro: '소리가 이쪽을 향한다. 띠링. 아무것도 하지 않았는데 울린다. 띠링. 숨을 쉬었다고 울린다. 소리가 겹칠 때마다 물이 무거워진다.',
    moves: [
      { id: 'hit', name: '겹친 띠링', kind: 'hit', power: 1, tell: '메아리가 한 박자 빨라진다.', say: '띠링이 열 겹으로 몸을 때렸다. 무엇을 잘했다는 소리인지 모르겠다.', w: 3 },
      { id: 'charge', name: '모두에게 울린다', kind: 'charge', power: 1.9, tell: '소리가 멎는다. 물이 숨을 죽인다. 터진 조각들이 한꺼번에 떤다.', say: '석 달 치의 띠링이 한꺼번에 왔다. 귀가 아니라 가슴이 터질 것 같다.', w: 2 },
      { id: 'fade', name: '되울림', kind: 'wait', power: 0, tell: '메아리가 벽 쪽으로 물러난다.', say: '메아리가 벽에 닿아 흩어졌다가 다시 모인다. 그동안은 울리지 않는다.', w: 2 },
    ] },
  // 구름다리 (GD-A10): 하늘 신전의 맨 안쪽 전. 종을 신으로 모신 대사제. 사십 년을 듣지 못했다. 글은 처음 값이다
  { id: 'bellpriest', name: '모신 종의 대사제', level: 80, element: '빛', drops: ['metal', 'hide'],
    intro: '가면 쓴 사람이 종 앞에서 천천히 돌아앉는다. 다른 가면들과 다르다. 이 가면은 숨을 쉰다. "닦지 않은 귀로 여기까지 왔는가."',
    moves: [
      { id: 'hit', name: '훈계', kind: 'hit', power: 1, tell: '대사제가 종채를 든다.', say: '종채가 어깨를 쳤다. "기도가 모자라다."', w: 3 },
      { id: 'charge', name: '신의 목소리', kind: 'charge', power: 1.9, tell: '대사제가 두 팔을 벌리고 종 쪽으로 돌아선다. 무언가를 기다린다.', say: '종이 울리지 않자 대사제가 직접 소리쳤다. 그 소리가 온몸을 쳤다. 사십 년 치의 목이었다.', w: 2 },
      { id: 'listen', name: '귀 기울이기', kind: 'wait', power: 0, tell: '대사제가 종에 귀를 댄다.', say: '대사제가 종에 귀를 대고 가만히 있다. 아무 소리도 나지 않는다. 가면 밑으로 숨이 샌다.', w: 2 },
    ] },
  // 별못 (BM-A10): 별 떨어진 자리의 바닥. 깨진 종의 마지막 조각이 삼대째 혼자 운다. 글은 처음 값이다
  { id: 'lastshard', name: '깨진 종의 마지막 조각', level: 90, element: '빛', drops: ['metal', 'hide'],
    intro: '구덩이 바닥 한가운데 쇳조각 하나가 떠 있다. 손바닥만 하다. 운다. 가락이 있는 울음이다. 다가서자 울음이 이쪽을 향한다. 화난 소리는 아니다. 들어 달라는 소리다.',
    moves: [
      { id: 'hit', name: '울음', kind: 'hit', power: 1, tell: '조각이 가늘게 떤다.', say: '울음이 몸을 뚫고 지나갔다. 귀가 아니라 가슴이 아프다.', w: 3 },
      { id: 'charge', name: '갈라지는 소리', kind: 'charge', power: 1.9, tell: '조각에 금이 하나 더 간다. 울음이 뚝 끊긴다.', say: '종이 깨지던 날의 소리가 한꺼번에 터졌다. 무릎이 바닥에 닿았다.', w: 2 },
      { id: 'hush', name: '숨 고르기', kind: 'wait', power: 0, tell: '조각이 천천히 내려앉는다.', say: '조각이 바닥에 닿아 잠깐 조용하다. 삼대를 울었으니 숨이 찰 것이다.', w: 2 },
    ] },
  // 처음 모루 (CM-A8): 모루 위. 쓰러뜨리는 것이 아니라 끝까지 짓는 싸움이다 (CM-D). build: 생명력(식은 껍질)이 0이 되어도 쓰러지지 않는다
  // 다섯 턴마다 큰 공격을 하고 (CM-D5), 그 사이는 틈이다. 낌새와 맞았을 때의 글은 처음 값이다
  { id: 'unbuiltbell', name: '지어지지 않은 종', level: 100, element: '불', drops: ['metal', 'hide'], build: true,
    intro: '모루 위에 쇳물이 솟는다. 종의 모양을 하려다 무너지고, 다시 솟는다. 아직 누구의 약속도 아닌 것이 화를 낸다.',
    moves: [
      { id: 'charge', name: '무너지는 쇳물', kind: 'charge', power: 1.9, tell: '쇳물이 종의 꼴로 높이 솟는다. 버티지 못하고 이쪽으로 기운다.', say: '쇳물이 한꺼번에 무너져 덮쳤다. 지어 놓은 데가 식어 주저앉는다.', w: 1 },
      { id: 'seethe', name: '솟았다 무너지기', kind: 'wait', power: 0, tell: '쇳물이 끓는다. 꼴을 찾고 있다.', say: '쇳물이 솟다가 제풀에 내려앉았다. 틈이다.', w: 4 },
    ] },
];
/** 안개늪의 몬스터에게 맞아 저주가 앉을 때 앞에 붙는 한 줄 (AN-B1). 허수아비의 것만 시안의 글이다. */
const CURSE_SAY = { mosstoad: '이끼 두꺼비의 혀가 닿은 자리가 검게 식었다.', mistleech: '안개 거머리가 붙었던 자리에 안개가 남았다.', soakedscarecrow: '물먹은 허수아비의 손이 스쳤다.', marshlight: '늪 등불의 빛이 살갗에 남아 꺼지지 않는다.' };
/** 우두머리: 그 레벨 보통 몬스터의 생명력 4배, 공격력 1.25배 (LV-I3). */
export function tierBosses(xp) {
  const out = {};
  for (const r of BOSS_ROWS) {
    const n = normalAt(r.level), b = BANDS[Math.ceil(r.level / 10) - 1], t = tierByNo(b.n);
    out[r.id] = { boss: true, band: b.n, element: r.element, name: r.name, level: r.level, hp: n.hp * BOSS.hp, attack: Math.round(n.attack * BOSS.attack), defense: n.defense, agi: Math.round(10 + r.level * 0.6), xp: xp(r.level) * BOSS.xp, intro: r.intro, moves: r.moves, drops: r.drops.map((k) => ({ id: t[k][0], p: 1 })), ...(r.curseSay ? { curseSay: r.curseSay } : {}), ...(r.gifted ? { gifted: true } : {}), ...(r.build ? { build: true } : {}) };
  }
  return out;
}

/** 몬스터: 구간 자료의 가운데 값을 레벨에 따라 위아래로 벌린다 (LV-I2). xp(level): 그 레벨 한 마리의 경험치. 보통 공격의 배율은 구간 자료의 mon.hit이다 (M23-1). */
export function tierMonsters(xp) {
  const out = {};
  const seenInBand = {};
  for (const [id, name, level, element, intro, hit, charge, status] of ROWS) {
    const b = BANDS[Math.ceil(level / 10) - 1], t = tierByNo(b.n);
    const f = 1 + (level - (b.n * 10 - 5)) * 0.04;
    const i = (seenInBand[b.n] = (seenInBand[b.n] || 0) + 1) - 1;
    const st = status ? { status: { id: status[0], turns: status[1], chance: status[2] } } : {};
    out[id] = {
      band: b.n, element, name, level, ...(CURSE_SAY[id] ? { curseSay: CURSE_SAY[id] } : {}),
      hp: r(b.mon.hp * f), attack: r(b.mon.attack * f), defense: r(b.mon.defense * f), agi: r(10 + level * 0.6), xp: xp(level), intro,
      moves: [
        { id: 'hit', name: hit[0], kind: 'hit', power: b.mon.hit || 1, tell: hit[1], say: hit[2], ...(charge && !status ? {} : st), w: 3 },
        { id: 'charge', name: charge[0], kind: 'charge', power: 1.9, tell: charge[1], say: charge[2], w: 1 },
      ],
      drops: DROP_PLAN[i % DROP_PLAN.length].map((k) => ({ id: t[k][0], p: k === 'metal' ? 0.35 : 0.6 })),
    };
  }
  return out;
}
