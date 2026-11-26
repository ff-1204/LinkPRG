// 상점 (E24, E28). 곳 id → 파는 것. 사는 것은 무엇이든 사 준다(퀘스트 물건 빼고).

export const SHOPS = {
  forge: {
    keeper: '대장간 주인', keeperId: 'smith', hello: '쇠는 안 속인다. 두드린 만큼 나온다.',
    sells: ['ironore', 'copperore', 'oakbranch', 'batwing', 'boarhide', 'sailcloth', 'chisel', 'torch', 'trainwear'], // 쇠와 나무, 몸통 옷감 (Z81, Z84, Z86)
  },
  tailor: {
    keeper: '재봉사', keeperId: 'tailor', hello: '치수부터 재고. 옷은 몸을 따라가는 거야.',
    sells: ['boarhide', 'sandals', 'herb', 'waterpouch'], // 손·발의 가죽 (Z81, Z84, Z86)
  },
  // 예술협회 (Z81, Z82): 잡화점 할머니가 선반을 옮겨 왔다. 잡화와 조각·세공 재료를 함께 판다
  artguild: {
    keeper: '잡화점 할머니', keeperId: 'granny', hello: '먹을 건 주방에, 약은 신전에 넘겼어. 여긴 깎고 다듬는 데 쓰는 것만. 주운 건 저울에 올려놓고.',
    sells: ['oakbranch', 'copperore', 'ironore', 'wolffang', 'chisel'], // 조각·세공 재료 (Z84)
  },
  // 공용주방 (Z83): 요리 재료. 붕어와 장어는 낚아 와야 한다
  kitchen: {
    keeper: '주방장', keeperId: 'chef', hello: '솥은 비었어. 재료만 가져와. 없으면 여기서 사고.',
    sells: ['salt', 'herb', 'berry', 'riceball', 'boarmeat'],
  },
  // 신전 (Z77): 물약·약초·성수(가지고 다니는 축복)
  temple: {
    keeper: '신전지기', keeperId: 'priest', hello: '다친 데가 있으면 먼저 말하게. 약은 그다음이야.',
    sells: ['redpotion', 'herb', 'holywater'],
  },
  // 나루의 어시장: 값이 날마다 바뀐다 (H3-5)
  fishmarket: {
    keeper: '어시장 아주머니', keeperId: 'fishwife', hello: '오늘 물이 좋아. 값은 묻지 말고, 내일은 또 달라.', daily: true,
    sells: ['crucian', 'eel', 'salt', 'tar', 'sailcloth'],
  },
  bigmarket: {
    keeper: '큰 시장 상인', keeperId: 'trader', hello: '윗마을에서 오셨소? 여기 값은 좀 세오. 대신 없는 게 없지.',
    sells: ['redpotion', 'waterpouch', 'torch', 'riceball', 'salt', 'ironore', 'copperore', 'sailcloth'],
  },
  backalley: {
    keeper: '뒷골목 어른', keeperId: 'elder', hello: '낯이 익으니 들인 거야. 본 건 잊고, 산 건 가져가.',
    sells: ['forgetwater', 'ruinkey', 'redpotion'],
  },
  // 다리 밑: 밤에만 열린다 (H3-2)
  underbridge: {
    keeper: '다리 밑의 눈', keeperId: 'eye', hello: '…뭘 찾나. 여기 있는 건 낮에는 없는 것들이야.',
    sells: ['forgetwater', 'redpotion', 'torch'],
  },
};
/** 날마다 바뀌는 값의 폭: 0.6배에서 1.5배. */
export const DAILY_SWING = [0.6, 0.9];
