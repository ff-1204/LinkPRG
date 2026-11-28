// 출신의 옛 인연 (Z28). 뿌리마다 한 번, 지난날과 이어지는 작은 사건이 일어난다.
// state.flags.memory: 없음 → 'carry'(물건을 들고 있음, 쇠의 사람) → 'done'

import { pushLine, ding } from './log.js?v=0cf2820';
import { addItem, countOf, takeById } from './inventory.js?v=0cf2820';
import { rootOf } from '../data/origins.js?v=0cf2820';
import { addPoints, rememberHint } from './social.js?v=0cf2820';

const done = (state) => state.flags.memory === 'done';
const journal = (state, text, note) => state.journal.push({ day: state.day, phase: state.phase, place: state.place, text, note });

/**
 * 한 일이 끝난 뒤에 부른다. t: 한 일의 종류, action: 한 일.
 * 쇠의 사람은 정을 주워 대장간 주인에게 가져가야 끝난다(그 끝은 social.talk가 본다).
 */
export function memoryHook(state, events, t, action) {
  if (done(state) || state.battle || state.choice || state.dungeon) return;
  const root = rootOf(state.origin);
  const actId = t === 'act' ? action.id : null;
  if (root === 'smithboy' && !state.flags.memory && state.place === 'mine' && actId === 'mine' && (state.counters.act.mine || 0) >= 15 && state.day >= 2) {
    pushLine(state, events, { k: 'room', text: '곡괭이 끝에 쇠붙이가 걸렸다. 녹슨 정 하나. 손잡이에 이름이 새겨져 있다.' });
    pushLine(state, events, { k: 'me', text: '이름을 읽었다. 대장간 영감님의 이름이다.' });
    addItem(state, 'oldchisel', 1);
    state.flags.memory = 'carry';
    ding(state, events, { level: 2, kind: 'memory', title: '옛 인연: 이름이 새겨진 정', body: '대장간에 가져가 보자.' });
    events.push({ type: 'bag' });
  } else if (root === 'farmer' && state.place === 'forest' && (actId === 'explore' || actId === 'gather') && state.day >= 2) {
    pushLine(state, events, { k: 'room', text: '숲 어귀에서 한 농부가 쓰러진 울타리를 붙들고 쩔쩔맨다.' });
    pushLine(state, events, { k: 'me', text: '말없이 기둥을 받쳐 주었다. 둘이 하니 금방이다. 밭에서 하던 일이다.' });
    pushLine(state, events, { k: 'npc', who: '농부', text: '고맙소. 우리 밭 산열매요. 많이는 못 주오.' });
    addItem(state, 'berry', 6);
    finish(state, events, '비 오는 날의 밭', '숲 어귀에서 울타리를 같이 세웠다. 밭 냄새가 났다.');
  } else if (root === 'hunter' && state.place === 'forest' && actId === 'explore' && state.day >= 3) {
    pushLine(state, events, { k: 'room', text: '풀숲에 낯익은 매듭의 덫이 놓여 있다. 여우 한 마리가 걸려 있다.' });
    pushLine(state, events, { k: 'me', text: '스승의 매듭이다. 풀어 주었다. 여우가 한참 따라오다가 사라졌다.' });
    pushLine(state, events, { k: 'room', text: '돌아보니 여우가 있던 자리에 산열매 세 알이 놓여 있다.' });
    state.counters.kind = (state.counters.kind || 0) + 2;
    addItem(state, 'berry', 3);
    finish(state, events, '옛 스승의 덫', '스승의 매듭을 풀었다. 스승은 짐승을 잡으려고 덫을 놓은 게 아니었는지도 모른다.');
  } else if (root === 'bard' && state.place === 'inn' && (t === 'move' || t === 'travel')) {
    pushLine(state, events, { k: 'room', text: '주막 구석에서 누가 노래를 흥얼거린다. 내가 부르던 노래다.' });
    pushLine(state, events, { k: 'me', text: '따라 불렀다. 주막이 조용해졌다가, 뱃사람 몇이 따라 불렀다.' });
    pushLine(state, events, { k: 'npc', who: '주막 주인', text: '그 노래, 내 할아버지가 부르던 거야. 마지막 줄이 "종 없는 종루에 바람만 운다"지. 어디서 배웠나.' });
    addPoints(state, events, 'innkeeper', 30);
    rememberHint(state, '주막 주인', '옛 노래의 마지막 줄: 종 없는 종루에 바람만 운다.', 4);
    finish(state, events, '같은 노래', '나루 주막에서 내 노래를 들었다. 노래는 나보다 먼저 이 길을 지나갔다.');
  } else if (root === 'fallen' && state.place === 'bigmarket' && (t === 'move' || t === 'travel')) {
    pushLine(state, events, { k: 'room', text: '경매 단에 낯익은 인장이 찍힌 문서가 올라와 있다. 우리 집안의 빚 문서다.' });
    state.choice = { kind: 'memory', id: 'debtpaper' };
    events.push({ type: 'choice' });
  } else if (root === 'orphan' && state.place === 'temple' && actId === 'pray' && state.day >= 2) {
    pushLine(state, events, { k: 'room', text: '무릎을 꿇은 자리의 마루가 삐걱거린다. 어릴 때 숨겨 둔 상자가 그 아래 있다.' });
    pushLine(state, events, { k: 'me', text: '상자를 열었다. 어릴 적 그린 그림 한 장. 종소리를 그린 것이다. 둥근 것이 아니라, 쇠 같은 것을 그렸다.' });
    pushLine(state, events, { k: 'npc', who: '신전지기', text: '…이건 신의 목소리가 아니야. 쇠의 소리지. 네가 그렇게 들었구나.' });
    addItem(state, 'bellpicture', 1);
    rememberHint(state, '신전지기', '어릴 적 그린 종소리 그림을 보고: 신의 목소리가 아니라 쇠의 소리다.', 2);
    finish(state, events, '마루 밑의 상자', '마루 밑에서 어릴 적 그림을 찾았다. 그때 나는 무엇을 들었던 걸까.');
  }
}

function finish(state, events, title, text) {
  state.flags.memory = 'done';
  journal(state, text, `옛 인연: ${title}`);
  ding(state, events, { level: 2, kind: 'memory', title: `옛 인연: ${title}`, body: '지난날과 이어진 일이 있었습니다.' });
  events.push({ type: 'bag' });
}

/** 쇠의 사람: 정을 들고 대장간 주인과 이야기하면 끝난다. 끝났으면 true. */
export function smithMemory(state, events, id) {
  if (id !== 'smith' || state.flags.memory !== 'carry' || countOf(state, 'oldchisel') < 1) return false;
  takeById(state, 'oldchisel', 1);
  pushLine(state, events, { k: 'me', text: '녹슨 정을 내밀었다.' });
  pushLine(state, events, { k: 'npc', who: '대장간 주인', text: '…이걸 어디서. 젊을 때 광산 깊은 데서 잃어버린 거다. 울림쇠를 캐러 들어갔다가.' });
  pushLine(state, events, { k: 'npc', who: '대장간 주인', text: '그 쇠는 두드리면 한참을 울었지. 그 소리를 다시 듣고 싶어서 대장장이가 됐어.' });
  addPoints(state, events, 'smith', 15);
  rememberHint(state, '대장간 주인', '젊을 때 광산 깊은 곳에서 울림쇠를 캤다. 두드리면 한참을 울었다.', 3);
  finish(state, events, '이름이 새겨진 정', '영감님께 정을 돌려드렸다. 영감님이 처음으로 젊을 적 이야기를 했다.');
  return true;
}

/** 이름 있는 사람: 경매 단의 빚 문서를 어떻게 할지. */
export function memoryChoiceView(state) {
  return {
    kind: 'memory', title: '옛 인연: 빚 문서', side: '이름 있는 사람',
    text: '우리 집안의 빚 문서가 경매에 올라왔다. 사들이면 상단이 집안 이름을 다시 믿을 것이다. 찢어 버리면 그 빚에 묶인 뒷골목 사람들이 풀려난다.',
    note: '어느 쪽을 골라도 다시는 나오지 않습니다.',
    options: [
      { id: 'buy', label: '은화 30에 사들인다', go: true, disabled: state.silver < 30, why: state.silver < 30 ? '은화가 모자란다' : '' },
      { id: 'tear', label: '빼내어 찢어 버린다' },
      { id: 'leave', label: '못 본 척 지나간다' },
    ],
  };
}

export function chooseMemory(state, events, id) {
  if (!state.choice || state.choice.kind !== 'memory') throw new Error('정할 것이 없습니다');
  if (!['buy', 'tear', 'leave'].includes(id)) throw new Error('모르는 선택입니다');
  if (id === 'buy' && state.silver < 30) throw new Error('은화가 모자랍니다');
  state.choice = null;
  if (id === 'buy') {
    state.silver -= 30;
    pushLine(state, events, { k: 'me', text: '은화 30을 내고 문서를 사들였다. 인장 위에 내 이름을 적었다.' });
    addPoints(state, events, 'agent', 10);
    addPoints(state, events, 'trader', 10);
    finish(state, events, '빚 문서', '집안의 빚 문서를 사들였다. 이름을 되찾는 데에도 값이 든다.');
  } else if (id === 'tear') {
    pushLine(state, events, { k: 'me', text: '문서를 빼내어 찢었다. 상인들이 소리를 질렀다. 뒷골목 쪽에서 누가 웃었다.' });
    addPoints(state, events, 'elder', 10);
    addPoints(state, events, 'eye', 10);
    finish(state, events, '빚 문서', '집안의 빚 문서를 찢었다. 이름은 잃었지만 누군가는 풀려났다.');
  } else {
    pushLine(state, events, { k: 'me', text: '못 본 척 지나갔다. 인장이 등 뒤에서 오래 따라왔다.' });
    finish(state, events, '빚 문서', '집안의 빚 문서를 보고도 지나쳤다. 아직은 그 이름을 짊어질 때가 아니다.');
  }
}
