// 스킬 진화 (N4-1, N4-2). 숙련도가 중급이 되면 갈래 둘 가운데 하나를 고른다.
// 갈래마다 얻는 것과 잃는 것이 함께 있다. 나중에 골라도 된다.
// 효과 값은 규칙이 읽는다: dmg(피해 배율), crit(치명 확률 더하기), miss(허탕 확률 더하기),
// weight(그 물건이 나올 몫의 배율), xp(숙련도 오름 배율), ticks(걸리는 때 더하기), double(둘씩 얻을 확률),
// push(제작 등급 밀기 더하기), dur(만든 것의 내구도 배율)

export const EVOLVE_AT = 9; // 중급 1

export const EVOLVE = {
  strike: [
    { id: 'heavy', name: '무겁게 치기', gain: '주는 피해 +10%', lose: '급소를 맞힐 확률 −2%p', dmg: 1.10, crit: -0.02 },
    { id: 'quick', name: '빠르게 치기', gain: '급소를 맞힐 확률 +5%p', lose: '주는 피해 −5%', dmg: 0.95, crit: 0.05 },
  ],
  mining: [
    { id: 'vein', name: '맥 읽기', gain: '구리 광석이 두 배로 자주 나온다', lose: '허탕이 5%p 늘어난다', weight: { copperore: 2 }, miss: 0.05 },
    { id: 'steady', name: '끈질긴 곡괭이', gain: '허탕이 10%p 줄어든다', lose: '채광 숙련도가 10% 천천히 오른다', miss: -0.10, xp: 0.9 },
  ],
  gathering: [
    { id: 'herbeye', name: '약초 눈', gain: '약초가 두 배로 자주 나온다', lose: '참나무 가지가 절반만 나온다', weight: { herb: 2, oakbranch: 0.5 } },
    { id: 'fasthand', name: '빠른 손', gain: '허탕이 10%p 줄어든다', lose: '약초가 절반만 나온다', miss: -0.10, weight: { herb: 0.5 } },
  ],
  fishing: [
    { id: 'patient', name: '기다리는 낚시', gain: '허탕이 15%p 줄어든다', lose: '한 번 던지는 데 때가 더 걸린다', miss: -0.15, ticks: 1 },
    { id: 'small', name: '잔챙이 낚시', gain: '열 번에 세 번은 두 마리가 올라온다', lose: '허탕이 10%p 늘어난다', double: 0.3, miss: 0.10 },
  ],
  smithing: [
    { id: 'edge', name: '날 벼리기', gain: '높은 등급이 조금 더 잘 뜬다', lose: '만든 것의 내구도 −20%', push: 0.10, dur: 0.8 },
    { id: 'lasting', name: '오래 가는 쇠', gain: '만든 것의 내구도 +30%', lose: '높은 등급이 조금 덜 뜬다', push: -0.03, dur: 1.3 },
  ],
};

/** 갈래를 되돌리는 귀한 물건 (N4-2). */
export const FORGET_ITEM = 'forgetwater';
