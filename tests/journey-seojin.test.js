// 여정 테스트: 01 서진의 1~4단계 (로드맵 M1-17).
// 출신 고르기 → 300번 치기 → 잡담 → 인내 창 → 상태창.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { passPhase } from './_time.js';
import { createGame, dispatch, scarecrowStage, whenLabel, skillLabel } from '../src/core/game.js';
import { hiddenSlots, foundCount, HIDDEN_TOTAL } from '../src/core/hidden.js';
import { originById } from '../src/data/origins.js';

test('서진: 퇴근 뒤, 허수아비 앞에서 (1~4단계)', () => {
  // 1. 출신 "대장간 심부름꾼"을 고르고 시작 점수 5를 나눈 뒤 이름을 정하면 광장에 선다
  const s = createGame({ name: '서진', origin: 'smithboy', spent: { str: 1, agi: 2, con: 2 }, seed: 'journey-01' });
  assert.equal(originById(s.origin).name, '대장간 심부름꾼');
  assert.equal(s.place, 'plaza');
  assert.equal(s.unspent, 0);
  assert.equal(whenLabel(s), '1일째 아침');

  // 2. 훈련소로 가 "치기"를 누르고 또 누른다. 유저들이 "그거 아무것도 안 나와요"라고 떠든다
  dispatch(s, { type: 'move', to: 'training' });
  const all = [];
  for (let i = 0; i < 300; i++) { if (s.phase === 2) passPhase(s); all.push(...dispatch(s, { type: 'act', id: 'strike' })); } // 밤이 되면 자고, 아침에 다시 선다
  const lines = all.filter((e) => e.type === 'line').map((e) => e.line);
  assert.ok(lines.some((l) => l.k === 'user' && l.text.includes('아무것도 안 나와요')));
  assert.equal(s.counters.act.strike, 300);

  // 3. 300번째에 허수아비가 터지고 시스템 창이 뜬다. 대화방에도 한 줄이 남는다
  assert.equal(scarecrowStage(s), 3);
  const dings = all.filter((e) => e.type === 'ding').map((e) => e.ding);
  // 치기 100번에 단련(Z119)이 먼저 생기고, 300번째에 인내가 생긴다
  assert.equal(dings.find((d) => d.level === 3).big, '단련 +1');
  const endure = dings.find((d) => d.big === '인내 +1');
  assert.ok(endure);
  assert.ok(lines.some((l) => l.k === 'ding' && l.text === "띠링! 새로운 스탯 '인내'가 생겼습니다"));
  assert.ok(endure.context.length > 0, '지난 알림에서 다시 볼 수 있게 그때의 대화방이 같이 남는다');

  // 4. 상태에서 새로 생긴 히든 스탯을 보고, 나머지 열한 칸이 "???"인 것을 확인한다
  const slots = hiddenSlots(s);
  assert.equal(foundCount(s), 2, '단련과 인내 (Z119)');
  assert.equal(slots.filter((x) => !x.found).length, HIDDEN_TOTAL - 2);
  assert.deepEqual(slots.filter((x) => x.found).map((x) => x.name).sort(), ['단련', '인내']);
  assert.equal(skillLabel(s, 'strike'), '초급 7');
  assert.equal(skillLabel(s, 'fishing'), '안 해 봄');

  // 일지에 그날이 남는다
  assert.ok(s.journal.some((j) => j.note === '인내를 얻은 날'));
  // 하루에 다 한 것이 아니다. 사흘쯤 걸린다
  assert.ok(s.day >= 2, `${s.day}일째`);
});
