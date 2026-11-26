// 상점 (E24, E28). 곳 id → 파는 것. 사는 것은 무엇이든 사 준다(퀘스트 물건 빼고).

export const SHOPS = {
  store: {
    keeper: '잡화점 할머니', keeperId: 'granny', hello: '필요한 건 선반에 다 있어요. 주운 건 저울에 올려놓고요.',
    sells: ['riceball', 'redpotion', 'berry', 'salt', 'waterpouch', 'torch'],
  },
  forge: {
    keeper: '대장간 주인', keeperId: 'smith', hello: '쇠는 안 속인다. 두드린 만큼 나온다.',
    sells: ['ironore', 'copperore', 'oakbranch', 'chisel'],
  },
  tailor: {
    keeper: '재봉사', keeperId: 'tailor', hello: '치수부터 재고. 옷은 몸을 따라가는 거야.',
    sells: ['trainwear', 'sandals', 'boarhide'],
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
