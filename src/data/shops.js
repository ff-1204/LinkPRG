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
    sells: ['redpotion', 'waterpouch', 'torch', 'riceball', 'salt', 'ironore', 'copperore', 'sailcloth', 'steel', 'bearhide'], // 강철과 곰 가죽 (LV-F2)
  },
  backalley: {
    keeper: '뒷골목 어른', keeperId: 'elder', hello: '낯이 익으니 들인 거야. 본 건 잊고, 산 건 가져가.',
    sells: ['forgetwater', 'ruinkey', 'redpotion'],
  },
  // 흰마루의 언못 (WM-A4, WM-A6). 그 단계 설계도의 쇠는 대장간에서, 가죽과 요리 재료는 움막에서 판다
  frostforge: {
    keeper: '서리 대장장이', keeperId: 'frostsmith', hello: '불이 작아. 그래서 오래 두드려. 살 거면 골라.',
    sells: ['frostiron', 'oakbranch', 'ironore', 'torch'],
  },
  hunterhut: {
    keeper: '늙은 사냥꾼', keeperId: 'oldhunter', hello: '가죽은 저쪽, 먹을 건 이쪽. 횃불은 꼭 챙겨 나가.',
    sells: ['whitefur', 'icemeat', 'torch', 'salt', 'herb', 'redpotion', 'riceball'],
  },
  // 소금벌의 저울목 (SB-A3, SB-A4, SB-A7, SB-C1). 사는 값도 파는 값도 날마다 바뀐다(market). 쇠는 대장간에서, 껍질과 먹을 것은 마당에서 판다
  scaleyard: {
    keeper: '좌판 임자', keeperId: 'stallowner', hello: '값은 판에 적힌 대로요. 내일은 또 다르오.', daily: true, market: true,
    sells: ['scorpshell', 'wormmeat', 'saltsteel', 'whitefur', 'frostiron', 'herb', 'salt', 'waterpouch', 'riceball', 'redpotion'],
  },
  saltforge: {
    keeper: '소금 대장장이', keeperId: 'saltsmith', hello: '쇠는 저울에 올려. 값은 오늘 값이야.', daily: true, market: true,
    sells: ['saltsteel', 'oakbranch', 'ironore', 'wolffang'],
  },
  saltshrine: {
    keeper: '사당지기', keeperId: 'saltpriest', hello: '향값은 통에 넣으시고, 약은 이쪽입니다.', daily: true, market: true,
    sells: ['holywater', 'redpotion', 'herb'],
  },
  // 잿골의 가마골 (AG-A4, AG-A7). 쇠와 숫돌은 큰 대장간에서, 비늘과 먹을 것은 비늘 가게에서 판다. 숫돌은 여기서만 판다 (AG-F2)
  bigforge: {
    keeper: '큰 대장간 주인', keeperId: 'ashmaster', hello: '이름패 없는 사람한테도 쇠는 팔아. 두드려 주지는 않아.',
    sells: ['ashiron', 'oakbranch', 'ironore', 'wolffang', 'whetstone'],
  },
  scaleshop: {
    keeper: '비늘 가게 주인', keeperId: 'scaler', hello: '쇠는 저 산 밑에서 못 버텨. 비늘은 버텨. 골라 봐.',
    sells: ['lizardscale', 'crabmeat', 'boarhide', 'herb', 'salt', 'redpotion', 'riceball'],
  },
  // 안개늪의 뜬마을 (AN-A3, AN-A4, AN-A5). 등불과 표식 끈은 등불 다리에서만 판다. 쇠도 다리에서, 실과 먹을 것은 오두막에서, 성수는 사당에서 판다
  lampbridge: {
    keeper: '등불지기 여울', keeperId: 'yeoul', hello: '등불은 아흔, 끈은 마흔. 깎아 달라는 말은 하다 마세요.',
    sells: ['lamp', 'marker', 'mossiron', 'oakbranch', 'ironore', 'wolffang', 'redpotion', 'riceball'],
  },
  herbhut: {
    keeper: '약초꾼 수련', keeperId: 'suryeon', hello: '마른 건 이쪽, 말리다 만 건 저쪽이에요.',
    sells: ['mistthread', 'toadleg', 'herb', 'salt', 'boarhide'],
  },
  // 뗏목 대장간 (M24-1): 다른 구간의 대장간처럼 그 단계의 쇠와 자루·덧댈 것을 판다
  raftforge: {
    keeper: '대장장이 느루', keeperId: 'raftsmith', hello: '이끼쇠는 저쪽이에요. 녹은 닦다 말았어요. 닦아도 또 끼거든요.',
    sells: ['mossiron', 'oakbranch', 'ironore', 'wolffang'],
  },
  marshshrine: {
    keeper: '늪 사당지기', keeperId: 'marshpriest', hello: '성수는 독에서 떠 드릴게요. 값은 통에 넣으세요.',
    sells: ['holywater', 'redpotion', 'herb'],
  },
  // 잠긴 도성의 지붕마을 (JD-A5, JD-A6, JD-A7). 쇠는 대장간에서, 공기 주머니와 가죽·먹을 것은 조합에서, 깊은 성수는 사당에서 판다
  bronzeforge: {
    keeper: '청동 대장장이', keeperId: 'bronzesmith', hello: '건진 청동이야. 한 번 종이었던 것도 섞였어. 골라.',
    sells: ['oldbronze', 'oakbranch', 'ironore', 'wolffang'],
  },
  divers: {
    keeper: '조합장 한별', keeperId: 'hanbyeol', hello: '주머니는 백스물. 숨은 깎아 주는 게 아니야.',
    sells: ['airbag', 'scalehide', 'jellycurd', 'herb', 'salt', 'redpotion', 'riceball'],
  },
  watershrine: {
    keeper: '물가 사당지기', keeperId: 'waterpriest', hello: '깊은 데서 길은 물입니다. 값은 독 옆에 두세요.',
    sells: ['deepholy', 'holywater', 'redpotion', 'herb'],
  },
  // 구름다리의 다릿목 (GD-A3, GD-A4, GD-A5). 다리 장터는 온 지역의 물건이 지나가는 곳이라 사는 값도 파는 값도 날마다 바뀐다(market)
  bridgemarket: {
    keeper: '장터 어른', keeperId: 'marketelder', hello: '값은 판에 있어. 아랫동네 것도, 윗동네 것도. 내일은 또 달라.', daily: true, market: true,
    sells: ['cloudsilver', 'goatwool', 'goatmeat', 'oldbronze', 'scalehide', 'mossiron', 'ashiron', 'saltsteel', 'deepholy', 'herb', 'salt', 'redpotion', 'riceball'],
  },
  silverforge: {
    keeper: '은 대장장이', keeperId: 'silversmith', hello: '구름은이야. 저울에 올려도 눈금이 잘 안 움직여. 그래도 값은 받아.',
    sells: ['cloudsilver', 'oakbranch', 'ironore', 'wolffang'],
  },
  goathut: {
    keeper: '염소치기 어른', keeperId: 'goatherd', hello: '털은 오늘 깎은 거야. 고기는 벼랑에서 떨어진 놈이고.',
    sells: ['goatwool', 'goatmeat', 'herb', 'salt', 'redpotion', 'riceball'],
  },
  // 별못의 맞울 (BM-A4, BM-A5, BM-A6). 못가 사당이 별빛 성수를 판다 (BM-H6)
  starforge: {
    keeper: '별 대장장이', keeperId: 'starsmith', hello: '별쇠야. 낮에 보면 그냥 돌이지. 밤에 다시 봐.',
    sells: ['starmetal', 'oakbranch', 'ironore', 'wolffang'],
  },
  silkhouse: {
    keeper: '비단 집 주인', keeperId: 'silkhost', hello: '비단은 오늘 뽑은 거예요. 가루는 나방이 두고 간 거고요.',
    sells: ['mothsilk', 'stardust', 'herb', 'salt', 'redpotion', 'riceball'],
  },
  pondshrine: {
    keeper: '못가 사당지기', keeperId: 'pondpriest', hello: '틀 아래에서 길은 물입니다. 종은 없어도 물은 맑습니다.',
    sells: ['starholy', 'deepholy', 'holywater', 'redpotion', 'herb'],
  },
  // 처음 모루의 일곱 천막 (CM-A3): 천막마다 그 고장의 것을 판다. 첫쇠와 그림자 가죽은 팔지 않는다(산에서 캔다)
  seventents: {
    keeper: '천막의 사람들', hello: '천막마다 그 고장에서 지고 올라온 것이 놓여 있다. 값은 아래에서와 같다.',
    sells: ['starmetal', 'mothsilk', 'cloudsilver', 'goatwool', 'oldbronze', 'scalehide', 'mossiron', 'ashiron', 'saltsteel', 'frostiron', 'oakbranch', 'wolffang', 'starholy', 'herb', 'salt', 'redpotion', 'riceball'],
  },
  // 다리 밑: 밤에만 열린다 (H3-2)
  underbridge: {
    keeper: '다리 밑의 눈', keeperId: 'eye', hello: '…뭘 찾나. 여기 있는 건 낮에는 없는 것들이야.',
    sells: ['forgetwater', 'redpotion', 'torch'],
  },
};
/** 날마다 바뀌는 값의 폭: 0.6배에서 1.5배. */
export const DAILY_SWING = [0.6, 0.9];
/** 저울목의 값 (SB-C1): 날마다 0.7배에서 1.3배. 제값에서 한 푼(10%)도 안 벌어진 날은 제값 그대로다. 사는 값과 파는 값이 같이 움직인다. */
export const MARKET_SWING = [0.7, 0.6];
export const MARKET_FLAT = 0.1;
/** 시세판에 적히는 것 (SB-C2). */
export const MARKET_GOODS = ['scorpshell', 'saltsteel', 'wormmeat', 'whitefur', 'frostiron', 'herb', 'salt', 'waterpouch', 'oakbranch', 'ironore', 'redpotion'];
/** 곳마다의 시세판 (GD-A3): 다리 장터의 판에는 그 장터가 파는 것이 적힌다. 없는 곳은 저울 마당의 것. */
export const MARKET_GOODS_AT = { bridgemarket: ['cloudsilver', 'goatwool', 'goatmeat', 'oldbronze', 'scalehide', 'mossiron', 'ashiron', 'saltsteel', 'deepholy', 'herb', 'salt', 'redpotion'] };
