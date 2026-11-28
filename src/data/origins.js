// 출신 쉰넷 (T1~T3, Z25, Z120). 바꿀 수 없다. 출신마다 숫자 하나와 대화 하나.

export const START_POINTS = 5;
export const BASE_STATS = { str: 10, agi: 9, con: 10, wis: 7 };
export const STAT_NAMES = { str: '힘', agi: '민첩', con: '체력', wis: '지혜' };
export const STAT_USES = { str: '공격력, 무게', agi: '선공, 회피, 기척', con: '생명력, 방어력', wis: '마나, 스킬 위력, 상태이상 내성' };

/**
 * 뿌리 여섯 (Z25). 같은 뿌리의 출신은 사람들이 대하는 말과 퀘스트에서 열리는 대답, 일지의 첫 글을 함께 쓴다.
 * flags: 그 뿌리의 출신이면 누구나 갖는 것.
 */
export const ROOTS = {
  smithboy: { name: '쇠의 사람', talk: '대장장이들이 먼저 말을 건다.', flags: {} },
  farmer: { name: '땅의 사람', talk: '마을 사람들이 편하게 대한다.', flags: {} },
  hunter: { name: '숲의 사람', talk: '숲의 짐승 약점 하나를 안다.', flags: { knowsBoar: true } },
  bard: { name: '길의 사람', talk: '주점에서 공짜 술을 얻는다.', flags: {} },
  fallen: { name: '이름 있는 사람', talk: '옛 이름을 아는 사람이 있다. 좋게든 나쁘게든.', flags: { oldName: true } },
  orphan: { name: '신전의 사람', talk: "신전 평판 '낯익음'으로 시작.", flags: { templeKnown: true } },
};

/** 출신의 등급. 장비의 등급과 이름이 같다. weight: 한 가지가 뽑힐 몫(높을수록 흔하다). */
export const ORIGIN_GRADES = [
  { name: '일반', weight: 10 }, { name: '고급', weight: 6 }, { name: '희귀', weight: 3 }, { name: '영웅', weight: 1.5 }, { name: '전설', weight: 0.5 },
];

// [id, 뿌리, 등급, 이름, 스탯, 덤(글), 지난날, 그 밖(skills·silver·items·flags)]
const RAW = [
  // 쇠의 사람
  ['smithboy', 'smithboy', 0, '대장간 심부름꾼', { str: 1 }, '대장 숙련도 초급 2로 시작', '대장간에서 풀무질과 심부름으로 자랐다. 쇠 냄새가 익숙하고, 망치 소리에 박자를 맞출 줄 안다. 직업은 아직 없다.', { skills: { smithing: 1 } }],
  ['charcoal', 'smithboy', 0, '숯쟁이', { con: 2 }, '피로가 더디게 쌓인다', '산속 가마 옆에서 사흘씩 불을 지켰다. 졸음을 참는 법은 누구에게 배운 것이 아니다.', { flags: { slowTire: true } }],
  ['minerkid', 'smithboy', 1, '부지런한 광부의 자식', { str: 2 }, '채광 숙련도 초급 2로 시작', '갱도 어귀에서 아버지의 등불을 기다리며 자랐다. 돌을 보면 어디를 쳐야 갈라지는지가 먼저 보인다.', { skills: { mining: 1 } }],
  ['farrier', 'smithboy', 1, '믿음직한 편자공의 조수', { str: 1, con: 1 }, '장비를 고치는 값이 절반', '말굽에 편자를 대며 자랐다. 닳은 쇠를 버리지 않고 다시 쓰는 법을 안다.', { flags: { cheapRepair: true } }],
  ['tinker', 'smithboy', 2, '솜씨 좋은 떠돌이 땜장이', { str: 2, wis: 1 }, '대장 숙련도 초급 4, 은화 50으로 시작', '솥과 냄비를 지고 마을마다 돌았다. 남의 집 부엌에서 쇠를 고치며 손도 말도 늘었다.', { skills: { smithing: 3 }, silver: 50 }],
  // 땅의 사람
  ['farmer', 'farmer', 0, '농부의 자식', { con: 2 }, '포만감이 천천히 줄어든다', '밭에서 자랐다. 해 뜨면 일어나고 배고프면 먹는 것밖에 모른다. 그게 얼마나 큰 재주인지는 아직 모른다.', { flags: { slowHunger: true } }],
  ['miller', 'farmer', 0, '방앗간 일꾼', { str: 1, con: 1 }, '주먹밥 다섯 개로 시작', '물레방아 도는 소리 속에서 자루를 날랐다. 떠나는 날 주인이 밥을 싸 주었다.', { items: [['riceball', 5]] }],
  ['woodcutter', 'farmer', 1, '부지런한 나무꾼', { str: 2 }, '참나무 가지 여섯 개, 채집 숙련도 초급 2로 시작', '도끼 한 자루로 겨울 땔감을 댔다. 어느 나무가 곧고 어느 나무가 속이 비었는지 두드려 보면 안다.', { skills: { gathering: 1 }, items: [['oakbranch', 6]] }],
  ['shepherd', 'farmer', 1, '믿음직한 양치기', { agi: 1, con: 1 }, '짐승이 덜 덤빈다', '언덕에서 양 떼와 여름을 났다. 늑대가 오기 전의 바람을 안다.', { flags: { calmBeasts: true } }],
  ['herbkid', 'farmer', 2, '눈썰미 좋은 약초꾼의 아이', { wis: 2, con: 1 }, '채집 숙련도 초급 4, 먹고 마시는 것의 효과가 크다', '할머니의 바구니를 들고 산을 탔다. 쓴 풀과 독한 풀을 혀로 가려낸다.', { skills: { gathering: 3 }, flags: { foodPlus: true } }],
  // 숲의 사람
  ['hunter', 'hunter', 0, '사냥꾼의 조수', { agi: 2 }, '기척을 더 잘 알아챈다', '사냥꾼 뒤를 따라 숲을 다녔다. 발소리를 죽이는 법과, 바람이 어느 쪽에서 부는지 읽는 법을 배웠다.', { flags: { keenSense: true } }],
  ['fowler', 'hunter', 0, '새잡이', { agi: 1 }, '기척을 더 잘 알아채고 도망이 쉽다', '갈대밭에 엎드려 새를 기다렸다. 숨을 참는 것과, 틀렸을 때 재빨리 물러나는 것을 배웠다.', { flags: { keenSense: true, fleeEasy: true } }],
  ['tanner', 'hunter', 1, '야무진 무두장이', { con: 1, agi: 1 }, '가죽을 팔 때 값을 더 받는다', '가죽을 벗기고 무두질하며 자랐다. 좋은 가죽과 상한 가죽을 손끝으로 안다.', { flags: { hideSeller: true } }],
  ['trapper', 'hunter', 2, '솜씨 좋은 덫놓이', { agi: 2, wis: 1 }, '먼저 덮칠 때 더 아프게 친다', '짐승이 다니는 길에 덫을 놓았다. 기다리는 쪽이 이긴다는 것을 일찍 알았다.', { flags: { pounceBonus: true } }],
  ['warden', 'hunter', 3, '이름난 숲지기의 아이', { agi: 3, con: 1 }, '기척을 더 잘 알아채고, 길에서 습격당하지 않는다', '숲지기의 오두막에서 태어났다. 짐승들은 이 아이의 냄새를 숲의 것으로 안다.', { flags: { keenSense: true, noAmbush: true } }],
  // 길의 사람
  ['bard', 'bard', 0, '떠돌이 악사', {}, '설득 판정 +10%, 소문을 하나 더 듣는다', '류트 하나 메고 마을을 떠돌았다. 노래는 그저 그렇지만 사람 마음을 여는 말은 안다.', { flags: { persuade10: true, extraRumor: true } }],
  ['porter', 'bard', 0, '짐꾼', { str: 1, con: 1 }, '무게 한도 +5', '남의 짐을 지고 고개를 넘었다. 무거운 것을 오래 드는 요령은 허리가 안다.', { flags: { carry5: true } }],
  ['ferrykid', 'bard', 1, '야무진 뱃사공의 아이', { con: 1, agi: 1 }, '낚시 숙련도 초급 2로 시작', '나룻배 위에서 걸음마를 뗐다. 손님을 기다리는 동안에는 늘 낚싯줄을 드리웠다.', { skills: { fishing: 1 } }],
  ['quack', 'bard', 1, '넉살 좋은 약장수의 조수', { wis: 2 }, '속임 판정 +10%, 붉은 물약 둘로 시작', '장터에서 만병통치약을 팔았다. 약이 듣는지는 몰라도 말이 듣는다는 것은 안다.', { items: [['redpotion', 2]], flags: { trick10: true } }],
  ['tumbler', 'bard', 2, '재주 많은 곡예단 막내', { agi: 3 }, '피하기가 10% 더 잘된다', '천막 아래에서 줄을 탔다. 떨어지는 법부터 배웠고, 그다음에 떨어지지 않는 법을 배웠다.', { flags: { dodge10: true } }],
  // 이름 있는 사람
  ['shopkid', 'fallen', 0, '가게 집 막내', { wis: 1 }, '은화 40으로 시작, 사는 값이 조금 싸다', '저울 옆에서 자랐다. 값을 깎는 말과 깎이지 않는 말을 귀로 익혔다.', { silver: 40, flags: { cheapBuy: true } }],
  ['debtor', 'fallen', 0, '빚에 쫓기는 이', { agi: 1, wis: 1 }, '도망이 쉽다. 은화 없이 시작', '집안의 빚을 물려받았다. 문 두드리는 소리만 들어도 뒷문이 어디인지부터 본다.', { flags: { fleeEasy: true } }],
  ['fallen', 'fallen', 1, '꿋꿋한 몰락 가문의 아이', { wis: 2 }, '은화 100으로 시작', '한때는 이름만 대면 문이 열리던 집안이었다. 지금 남은 것은 글 읽는 버릇과 은화 한 줌뿐이다.', { silver: 100 }],
  ['clerk', 'fallen', 2, '눈썰미 좋은 서기 견습', { wis: 3 }, '감정 숙련도 초급 4로 시작', '남의 장부를 베끼며 자랐다. 숫자가 맞지 않는 곳은 읽기 전에 눈에 걸린다.', { skills: { appraise: 3 } }],
  ['squire', 'fallen', 3, '이름난 기사의 종자', { str: 2, con: 2 }, '낡은 방패를 들고, 막기 숙련도 초급 3으로 시작', '기사의 갑옷을 닦고 방패를 들어 주었다. 기사는 떠났고 방패만 남았다.', { bond: { text: '방패 막기가 피해를 10%p 더 줄인다', fx: { guard: { shieldup: 0.1 } } }, skills: { guard: 2 }, items: [['oldshield', 1]], flags: { anyShield: true } }],
  // 신전의 사람
  ['orphan', 'orphan', 0, '신전 고아', {}, '쓰러졌을 때 두고 오는 돈이 절반', '신전 마루에서 자랐다. 종소리에 일어나고 종소리에 잠들었다. 그 소리가 어디서 나는지는 한 번도 묻지 않았다.', { flags: { halfDrop: true } }],
  ['gravekeeper', 'orphan', 0, '묘지기', { con: 2 }, '기도로 그림자가 빨리 걷힌다', '신전 뒤뜰의 무덤을 돌보았다. 쓰러진 이들 곁에서 일어나는 법을 배웠다.', { flags: { weakFast: true } }],
  ['pilgrim', 'orphan', 1, '부지런한 순례자', { con: 1, wis: 1 }, '신전의 빵을 하루에 둘 받는다', '신전에서 신전으로 걸었다. 어느 문을 두드리면 빵이 나오는지 안다.', { flags: { bread2: true } }],
  ['scribe', 'orphan', 2, '솜씨 좋은 필경 견습', { wis: 3 }, '서고에서 감정 숙련도가 두 배로 오른다', '신전의 책을 베껴 썼다. 뜻을 모르는 글자도 틀리지 않고 옮길 수 있다.', { flags: { fastSearch: true } }],
  ['ringerkid', 'orphan', 4, '회귀자의 후예', { str: 1, agi: 1, con: 1, wis: 2 }, '모든 숙련도가 5% 빨리 오른다', '윗대 어른 가운데 한 사람이 같은 생을 두 번 살았다는 이야기가 집안에 내려온다. 처음 해 보는 일인데 손이 먼저 안다.', { flags: { allSkill5: true } }],
  // ── 직업과 이어진 출신 (Z120): 전설 다섯, 영웅 열, 희귀 여섯, 고급 셋. job: 어울리는 직업, bond: 그 직업을 고르면 열리는 인연(전설·영웅) ──
  ['shieldheir', 'fallen', 4, '방패잡이의 후예', { str: 3, con: 2 }, '낡은 방패를 들고, 막기 숙련도 초급 5로 시작', '윗대 어른은 성문이 무너질 때 끝까지 서 있던 방패잡이다. 집안에 내려오는 방패에 그 자국이 남았다.', { skills: { guard: 4 }, items: [['oldshield', 1]], flags: { anyShield: true }, bond: { text: '힘의 주 스탯 보너스가 10마다 +3%', fx: { mainRate: 3 } } }],
  ['whitesnow', 'hunter', 4, '하얀 눈의 후예', { agi: 4, wis: 1 }, '기척을 더 잘 알아채고, 먼저 알아챌 확률이 더 높다', '흰 눈밭에서 대대로 사냥해 온 집안이다. 눈 위에 남은 발자국 하나로 무엇이 언제 지나갔는지 읽는다. 열 살에 눈보라 속에서 날아가는 참새를 맞혔다는 말이 돈다.', { flags: { keenSense: true, senseBonus: 0.1 }, bond: { text: '급소 확률 +8%p, 조준 사격 마나 −1', fx: { crit: 0.08, mp: { aim: -1 } } } }],
  ['emberkeeper', 'smithboy', 4, '불씨지기의 후예', { wis: 4, con: 1 }, '잿골의 열기에 장비가 덜 닳는다', '꺼지지 않는 불씨를 대대로 지켜 온 집안이다. 아기 때 화로에 손을 넣었는데 데지 않았고, 그 뒤로 손끝이 늘 따뜻하다.', { flags: { heatGuard: 0.3 }, bond: { text: '화염구와 얼음 창이 처음부터 열리고, 불 속성 피해 +15%', fx: { open: ['ember', 'frost'], fire: 1.15 } } }],
  ['miraclekid', 'orphan', 4, '기적을 본 아이', { wis: 3, con: 2 }, '드문 운이 따르고, 기도 숙련도 초급 3으로 시작', '죽어 가던 사람이 일어나는 것을 보았다. 아무도 믿지 않았지만 아이는 기억한다.', { skills: { pray: 2 }, flags: { startRare: 10 }, bond: { text: '치유의 치유 +20%', fx: { heal: { lay: 1.2 } } } }],
  ['shadowking', 'bard', 4, '그림자 왕의 후예', { agi: 3, str: 1, wis: 1 }, "자물쇠 숙련도 초급 5, 뒷골목과 '낯익음'으로 시작", '옛날 뒷골목에는 얼굴을 본 사람이 없는 우두머리가 있었다. 사람들은 그를 그림자 왕이라 불렀다. 지금도 골목마다 인사를 하는 얼굴이 있지만, 다들 눈은 피한다.', { skills: { lockpick: 4 }, flags: { alleyKnown: true }, bond: { text: '싸움의 첫 턴 피해 +20%, 연막탄 마나 −2', fx: { first: 1.2, mp: { smoke: -2 } } } }],
  ['mercboy', 'bard', 3, '이름난 용병단 막내', { str: 2, con: 2 }, '용병 삯 −20%', '형들 틈에서 컸다. 밥은 늘 마지막에 먹었고, 덕분에 빨리 먹는다.', { flags: { mercCut: 0.2 }, bond: { text: '전투 함성이 적의 공격을 40% 약하게 한다(원래 30%)', fx: { weaken: { roar: 0.4 } } } }],
  ['minewatch', 'smithboy', 3, '손꼽히는 광산 경비', { con: 3, str: 1 }, '최대 생명력 +20', '갱도 입구를 십 년 지켰다. 무너지는 소리를 먼저 듣는다.', { flags: { hpPlus: 20 } }],
  ['falconer', 'hunter', 3, '이름난 매사냥꾼', { agi: 3, con: 1 }, '짐승을 잡으면 가죽이 한 장 더 나올 때가 있다', '매를 부르는 휘파람을 안다. 매보다 먼저 사냥감을 본다.', { flags: { extraHide: 0.25 }, bond: { text: '연속 사격의 급소 확률 +10%p', fx: { skillCrit: { twin: 0.1 } } } }],
  ['scout', 'farmer', 3, '손꼽히는 국경 척후', { agi: 2, con: 2 }, '길에서 습격당할 확률이 절반', '밭 사이 경계석을 따라 걸으며 자랐다. 발소리가 없다.', { flags: { ambushHalf: true }, bond: { text: '달아날 확률 +15%p', fx: { flee: 0.15 } } }],
  ['archivist', 'fallen', 3, '이름난 서고지기의 손주', { wis: 3, agi: 1 }, '최대 마나 +10, 감정 숙련도 초급 3으로 시작', '책 냄새를 맡으며 잠들었다. 주문보다 목차를 먼저 외웠다.', { skills: { appraise: 2 }, flags: { mpPlus: 10 }, bond: { text: '낙뢰 마나 −2', fx: { mp: { bolt: -2 } } } }],
  ['mistreader', 'farmer', 3, '손꼽히는 안개 읽는 이', { wis: 3, con: 1 }, '상태이상에 10% 덜 걸린다', '안개가 오는 쪽을 맞힌다. 어른들은 그 아이에게 날씨를 물었다.', { flags: { resist: 0.1 }, bond: { text: '마나 방벽이 한 번 더 막는다', fx: { ward: { veil: 1 } } } }],
  ['guide', 'bard', 3, '이름난 순례길 안내인', { wis: 2, con: 2 }, '기도 숙련도 초급 4, 신전의 빵을 하루에 둘 받는다', '먼 신전까지 사람들을 데려다주었다. 돌아오는 길은 늘 혼자였다.', { skills: { pray: 3 }, flags: { bread2: true }, bond: { text: '신성 가호가 한 번 더 막는다', fx: { ward: { bless: 1 } } } }],
  ['apothecary', 'farmer', 3, '이름난 약방 할머니의 손주', { wis: 2, con: 2 }, '물약과 약초로 채우는 생명력 +30%', '약초 이름보다 아픈 사람 얼굴을 먼저 외웠다.', { flags: { potionPlus: 1.3 }, bond: { text: '정화가 지혜 × 2만큼 채운다', fx: { heal: { wash: 2 } } } }],
  ['pickpocket', 'orphan', 3, '손꼽히는 소매치기', { agi: 3, wis: 1 }, '자물쇠 숙련도 초급 4로 시작', '신전 앞 인파에서 컸다. 손이 먼저 움직이는 버릇을 고치는 중이다.', { skills: { lockpick: 3 }, bond: { text: '다리 후리기 마나 −2', fx: { mp: { trip: -2 } } } }],
  ['smuggler', 'bard', 3, '이름난 밀수 뱃사람', { agi: 2, str: 1, con: 1 }, '무게 한도 +10, 도망이 쉽다', '밤 뱃길만 다녔다. 등불 없이 노를 젓는다.', { flags: { carryPlus: 10, fleeEasy: true }, bond: { text: '칼춤의 급소 확률 +10%p', fx: { skillCrit: { flurry: 0.1 } } } }],
  ['armorer', 'smithboy', 2, '솜씨 좋은 갑옷장이의 조수', { str: 2, con: 1 }, '막기 숙련도 초급 3으로 시작', '갑옷 이음매에 기름을 먹이며 자랐다. 어디가 먼저 찢어지는지 안다.', { skills: { guard: 2 } }],
  ['bowyer', 'hunter', 2, '눈썰미 좋은 활 깎는 이', { agi: 2, wis: 1 }, '채집 숙련도 초급 3, 참나무 가지 넷으로 시작', '곧은 가지를 고르는 눈으로 컸다. 활대를 휘어 보면 몇 번 쏘고 부러질지 안다.', { skills: { gathering: 2 }, items: [['oakbranch', 4]] }],
  ['conjurer', 'bard', 2, '재주 많은 마술사 견습', { wis: 3 }, '최대 마나 +5', '장터에서 손바닥 위의 불을 보여 주던 이를 따라다녔다. 속임수인 줄 알면서도 따라 했다.', { flags: { mpPlus: 5 } }],
  ['midwife', 'farmer', 2, '솜씨 좋은 산파의 조수', { wis: 2, con: 1 }, '약초로 채우는 생명력 +20%', '아이가 나는 집마다 불려 갔다. 피 냄새에 놀라지 않는다.', { flags: { herbPlus: 1.2 } }],
  ['locksmith', 'smithboy', 2, '눈썰미 좋은 열쇠공의 조수', { agi: 2, wis: 1 }, '자물쇠 숙련도 초급 4로 시작', '열쇠를 잃어버린 집마다 불려 갔다. 남의 문을 여는 손이 빠르다.', { skills: { lockpick: 3 } }],
  ['cookhand', 'farmer', 2, '솜씨 좋은 요리사의 조수', { con: 2, wis: 1 }, '요리 숙련도 초급 4로 시작', '큰 부엌에서 칼질부터 배웠다. 간을 보지 않아도 냄새로 안다.', { skills: { cooking: 3 } }],
  ['seer', 'bard', 1, '야무진 점술가의 조수', { wis: 2 }, '감정 숙련도 초급 2로 시작', '별과 패를 읽던 점술가 곁에서 자랐다. 손님 얼굴이 먼저 답을 말한다는 것을 배웠다.', { skills: { appraise: 1 } }],
  ['courier', 'bard', 1, '부지런한 우편 심부름꾼', { agi: 1, con: 1 }, '피로가 더디게 쌓인다', '편지 자루를 메고 마을과 마을 사이를 뛰었다. 지름길을 많이 안다.', { flags: { slowTire: true } }],
  ['innhand', 'farmer', 1, '믿음직한 주막 일꾼', { con: 2 }, '주먹밥 셋, 요리 숙련도 초급 2로 시작', '주막 부엌과 마구간을 오가며 컸다. 밤늦게 온 손님에게도 웃는 법을 안다.', { items: [['riceball', 3]], skills: { cooking: 1 } }],
];

/** 어울리는 직업 (Z120). 등급마다 직업 다섯이 같은 수(전설 1, 그 밖 2)를 갖고, 나머지는 어느 직업과도 묶이지 않는다. */
export const ORIGIN_JOBS = {
  warrior: ['smithboy', 'porter', 'minerkid', 'farrier', 'tinker', 'armorer', 'squire', 'mercboy', 'shieldheir'],
  archer: ['hunter', 'fowler', 'woodcutter', 'tanner', 'trapper', 'bowyer', 'falconer', 'scout', 'whitesnow'],
  mage: ['shopkid', 'charcoal', 'fallen', 'seer', 'clerk', 'conjurer', 'archivist', 'mistreader', 'emberkeeper'],
  priest: ['orphan', 'gravekeeper', 'pilgrim', 'shepherd', 'herbkid', 'midwife', 'guide', 'apothecary', 'miraclekid'],
  rogue: ['debtor', 'bard', 'ferrykid', 'quack', 'tumbler', 'locksmith', 'pickpocket', 'smuggler', 'shadowking'],
};
const jobOfOrigin = (id) => Object.keys(ORIGIN_JOBS).find((j) => ORIGIN_JOBS[j].includes(id)) || null;

const STAT_KO = { str: '힘', agi: '민첩', con: '체력', wis: '지혜' };
export const ORIGINS = RAW.map(([id, root, grade, name, stats, perk, story, more = {}]) => {
  const statText = Object.entries(stats).map(([k, v]) => `${STAT_KO[k]} +${v}`).join(', ');
  return {
    id, root, grade, name, stats, perk, story,
    number: `${statText ? statText + '. ' : ''}${perk}.`,
    talk: ROOTS[root].talk,
    skills: more.skills || {}, silver: more.silver || 0, items: more.items || [],
    flags: { ...ROOTS[root].flags, ...(more.flags || {}) },
    job: jobOfOrigin(id), // 어울리는 직업 (Z120)
    bond: more.bond || null, // 그 직업을 고르면 열리는 인연 (Z120)
  };
});

/** 처음 서른 가지일 때 등급마다의 수. 등급의 몫은 이 수로 정했다. */
export const GRADE_BASE = [12, 9, 6, 2, 1];

/** 뿌리의 이름. */
export const rootOf = (originId) => { const o = ORIGINS.find((x) => x.id === originId); return o ? o.root : null; };

/**
 * 패 다섯 장을 깐다 (Z25). 같은 글(seedText)이면 늘 같은 패가 나온다. 서로 다른 다섯 가지이고, 등급이 높을수록 드물다.
 * 돌려주는 것은 출신 id 다섯 개.
 */
export function dealOrigins(seedText, n = 5) {
  let h = 2166136261;
  for (const ch of String(seedText)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const next = () => { h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0; h ^= h >>> 16; h = (h + 0x9e3779b9) >>> 0; return h / 4294967296; };
  // 출신이 늘어도 등급마다 나오는 확률은 지킨다 (Z120): 같은 등급끼리 그 등급의 몫을 나눠 갖는다
  const per = ORIGIN_GRADES.map((g, i) => (g.weight * GRADE_BASE[i]) / Math.max(1, ORIGINS.filter((o) => o.grade === i).length));
  const pool = ORIGINS.map((o) => ({ id: o.id, w: per[o.grade] }));
  const out = [];
  while (out.length < n && pool.length) {
    let r = next() * pool.reduce((a, x) => a + x.w, 0);
    let i = 0;
    for (; i < pool.length - 1; i++) { r -= pool[i].w; if (r < 0) break; }
    out.push(pool.splice(i, 1)[0].id);
  }
  return out;
}

export function originById(id) {
  return ORIGINS.find((o) => o.id === id) || null;
}

/** 출신과 나눈 점수로 시작 스탯을 만든다. 점수가 맞지 않으면 까닭을 던진다. */
/** 주사위 (Z22): 네 스탯의 합은 늘 같다. 어떻게 나뉘느냐만 굴릴 때마다 달라진다. */
export const DICE_TOTAL = Object.values(BASE_STATS).reduce((a, b) => a + b, 0) + START_POINTS; // 41
export const DICE_MIN = 4; // 한 스탯의 가장 낮은 값
export const DICE_FREE_AT = 100; // 이만큼 굴린 사람은 눈을 손으로 옮길 수 있다

/**
 * 주사위를 한 번 굴린다. 같은 글(seedText)이면 늘 같은 눈이 나온다.
 * 넷을 모두 가장 낮은 값에서 시작해, 남은 점수를 하나씩 아무 스탯에나 던져 넣는다.
 */
export function rollDice(seedText) {
  let h = 2166136261;
  for (const ch of String(seedText)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const keys = Object.keys(BASE_STATS);
  const out = Object.fromEntries(keys.map((k) => [k, DICE_MIN]));
  for (let left = DICE_TOTAL - DICE_MIN * keys.length; left > 0; left--) {
    h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0;
    out[keys[h % keys.length]] += 1;
  }
  return out;
}

export function buildStats(originId, spent, rolled = null) {
  const origin = originById(originId);
  if (!origin) throw new Error('모르는 출신: ' + originId);
  if (rolled) {
    const keys = Object.keys(BASE_STATS);
    if (!keys.every((k) => Number.isInteger(rolled[k]) && rolled[k] >= DICE_MIN) || keys.reduce((a, k) => a + rolled[k], 0) !== DICE_TOTAL) throw new Error('주사위 눈이 맞지 않습니다');
    return { stats: Object.fromEntries(keys.map((k) => [k, rolled[k] + (origin.stats[k] || 0)])), unspent: 0 };
  }
  const total = Object.values(spent || {}).reduce((a, b) => a + b, 0);
  if (total > START_POINTS) throw new Error(`시작 점수는 ${START_POINTS}까지입니다 (받은 값: ${total})`);
  const stats = {};
  for (const key of Object.keys(BASE_STATS)) {
    const add = (spent && spent[key]) || 0;
    if (!Number.isInteger(add) || add < 0) throw new Error('점수는 0 이상의 정수여야 합니다');
    stats[key] = BASE_STATS[key] + (origin.stats[key] || 0) + add;
  }
  return { stats, unspent: START_POINTS - total };
}
