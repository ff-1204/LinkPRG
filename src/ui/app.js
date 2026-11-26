// 화면 본체. 규칙(core)을 불러 상태를 고치고, 상태를 그린다.
// 시안 번호: 화면 틀 D1~D6, 캐릭터 만들기 T1~T3, 상태·스킬 창 G2, 저장·설정 G4, 도움말 H2, 그림 X1·X3.

import { h, pixel, fill, add } from './dom.js?v=d58cb06';
import { createWindows } from './windows.js?v=d58cb06';
import { loadSettings, saveSettings, applySettings, SETTING_GROUPS } from './settings.js?v=d58cb06';
import { playDing } from './sound.js?v=d58cb06';
import { HELP } from './help.js?v=d58cb06';
import {
  createGame, dispatch, usersHere, whenLabel, isNight, scarecrowStage, DING_LEVELS,
  slotsNow, mapView, bodyView, clockOf, enemyView, choiceView, craftView,
} from '../core/game.js?v=d58cb06';
import { recipeList } from '../core/craft.js?v=d58cb06';
import { SEW_ORDER } from '../data/recipes.js?v=d58cb06';
import { evolveView, pendingEvolves, branchOf } from '../core/evolve.js?v=d58cb06';
import { shopView, storeView } from '../core/trade.js?v=d58cb06';
import { peopleHere, bondName, helloOf, spokeToday, titleView, peopleDex, fameOf, fameRank } from '../core/social.js?v=d58cb06';
import { offersOf, subView, boardView, jobsView, questBook, mainView, hiddenView } from '../core/quests.js?v=d58cb06';
import { SUBS } from '../data/quests.js?v=d58cb06';
import { jobChoices, jobName, skillsNow, canChooseJob, hiddenJobTraces, advanceView } from '../core/jobs.js?v=d58cb06';
import { factionView, leanName } from '../core/factions.js?v=d58cb06';
import { sculptMenu, sculptView, worksView, statueOf } from '../core/sculpt.js?v=d58cb06';
import { cookMenu } from '../core/cook.js?v=d58cb06';
import { buffRows } from '../core/buffs.js?v=d58cb06';
import { partyView } from '../core/party.js?v=d58cb06';
import { WORK_GRADES } from '../data/works.js?v=d58cb06';
import { REGULAR, BONDS } from '../data/people.js?v=d58cb06';
import { bondOf } from '../core/social.js?v=d58cb06';
import { MERC_FEE, PARTY_MAX } from '../data/companions.js?v=d58cb06';
import { roomView, dungeonMap } from '../core/dungeon.js?v=d58cb06';
import { noticesView, ranking, rumorsView, sinceLast, markSeen } from '../core/world.js?v=d58cb06';
import { auctionView } from '../core/auction.js?v=d58cb06';
import { RANKS } from '../data/world.js?v=d58cb06';
import { townRooms, BOAT_NEEDS, BOAT_FEE, OFFER_FEE, countOf, regenRate } from '../core/game.js?v=d58cb06';
import { townOf } from '../core/social.js?v=d58cb06';
import { DUNGEONS } from '../data/dungeon.js?v=d58cb06';
import { FAME, TITLES, PEOPLE } from '../data/people.js?v=d58cb06';
import { RECIPES } from '../data/recipes.js?v=d58cb06';
import { ITEMS } from '../data/items.js?v=d58cb06';
import { GRADES } from '../data/items.js?v=d58cb06';
import { bagView, tabCounts, previewEquip, iconOf, itemPower, itemWeight, slotFor, equipWeight } from '../core/inventory.js?v=d58cb06';
import { BAG_TABS, EQUIP_SLOTS, itemDef, gradeName } from '../data/items.js?v=d58cb06';
import { monsterDef } from '../data/monsters.js?v=d58cb06';
import { originById, dealOrigins, ROOTS, ORIGIN_GRADES, STAT_NAMES, STAT_USES, rollDice, DICE_TOTAL, DICE_MIN, DICE_FREE_AT } from '../data/origins.js?v=d58cb06';
import { placeById, PLACES, TOWN_ORDER, PHASES, ACTIONS, PHASE_TICKS } from '../data/places.js?v=d58cb06';
import { SKILL_NAMES, gradeLabel, progress, skillEffect } from '../core/skills.js?v=d58cb06';
import { hiddenSlots, foundCount, hiddenTotal, hiddenById } from '../core/hidden.js?v=d58cb06';
import { rebirthCarry, rebirthLoss } from '../core/rebirth.js?v=d58cb06';
import { createCloud } from './cloud.js?v=d58cb06';
import { mailView, unreadMail } from '../core/mail.js?v=d58cb06';
import { shadowView, BLESSERS } from '../core/fall.js?v=d58cb06';
import { ringView, afterText } from '../core/ending.js?v=d58cb06';
import { derived, formula, valueOf } from '../core/derived.js?v=d58cb06';
import { saveTo, loadFrom, listSlots, clearSlot, exportText, importText, shouldAutosave, revOf, SaveConflict } from '../core/save.js?v=d58cb06';
import { createPressGuard, keyDecision, slotIndex } from '../core/press.js?v=d58cb06';
import { createAssist, assistable } from '../core/assist.js?v=d58cb06';
import { STANCES, stanceOf, wisResist } from '../core/battle.js?v=d58cb06';
import { gearName, optionLines, maxDur, repairCost, enhanceView } from '../core/gear.js?v=d58cb06';
import { guildView, DONATE } from '../core/guild.js?v=d58cb06';
import { DRINK_HOSTS } from '../core/social.js?v=d58cb06';
import { TEACHERS, learnableHere, KNOWN_BOND } from '../core/work.js?v=d58cb06';
import { rootOf } from '../data/origins.js?v=d58cb06';
import { recordError, readErrors, clearErrors } from '../core/errors.js?v=d58cb06';
import { ro, iGa, waGwa, eulReul, eunNeun } from '../core/ko.js?v=d58cb06';

const SCARECROW_ALT = ['멀쩡한 허수아비', '짚이 빠지기 시작한 허수아비', '한쪽으로 기운 허수아비', '터져서 짚이 흩날리는 허수아비'];
const SCARECROW_SAY = ['아직 멀쩡하다', '짚이 빠지기 시작했다', '한쪽으로 기울었다', '터졌다. 기둥만 남았다'];
const WORK_NAMES = { smith: '대장장이' };
const JOB_NAMES = { warrior: '전사', archer: '궁수', mage: '마법사', priest: '사제', rogue: '도적' };
const SLOT_COUNT_UI = 5;
const COOL_MS = 6000; // 망치질 사이가 이보다 길면 쇠가 식는다
const LOG_SHOWN = 120;

export function start(root, storage = globalThis.localStorage) {
  let settings = loadSettings(storage);
  applySettings(settings);
  let game = null;
  let slot = 0;
  let tab = 'journal';
  const guard = createPressGuard();
  const wins = createWindows(document.body);
  const refs = {};
  // 구글 드라이브 (Z44): 로그인했으면 저장이 드라이브에도 남는다
  let settingsRerender = null;
  let titleSyncedAt = 0;
  const safeSession = (() => { try { return globalThis.sessionStorage; } catch { return { getItem: () => null, setItem() {}, removeItem() {} }; } })();
  const cloud = createCloud({ storage, session: safeSession, onChange: () => {
    settingsRerender?.();
    if (game && refs.nav) { drawNav(); drawTabs(); }
    if (!game && root.querySelector('main.title') && !wins.isOpen()) showTitle();
  } });

  const fail = (error, where) => { recordError(storage, error, where); console.error(error); };
  globalThis.addEventListener?.('error', (e) => recordError(storage, e.error || e.message, 'window'));
  globalThis.addEventListener?.('unhandledrejection', (e) => recordError(storage, e.reason, 'promise'));

  // ── 처음 화면 ──────────────────────────────────────────
  /** 저장과 설정 옆의 동그라미: 초록은 드라이브와 맞춰지는 중, 빨강은 안 맞춰짐(로그인 안 함, 풀림, 오류). 글로도 읽힌다 */
  function syncDot() {
    const on = cloud.status === 'on' || cloud.status === 'busy';
    const text = on ? '드라이브와 맞춰짐' : cloud.status === 'off' ? '드라이브에 올리지 않음' : '드라이브와 안 맞춰짐';
    return h('span', { class: `syncdot ${on ? 'on' : 'off'}`, title: text }, h('span', { class: 'sr' }, `, ${text}`));
  }

  function showTitle() {
    game = null;
    if (cloud.status === 'on' && Date.now() - titleSyncedAt > 15000) { titleSyncedAt = Date.now(); cloud.refresh(); }
    const slots = listSlots(storage);
    const used = slots.filter((s) => !s.empty && !s.broken).sort((a, b) => b.savedAt - a.savedAt);
    const firstEmpty = slots.find((s) => s.empty);
    const list = h('div', { class: 'slots', 'aria-label': '저장 칸' }, slots.map((s) => slotRow(s, used[0]?.slot === s.slot)));
    fill(root,h('main', { class: 'title' },
      // 꾸밈 그림: 같은 숲의 낮과 밤. 알려 주는 것이 없어 대체 글은 비운다. 그림을 끄면 나오지 않는다
      settings.art && !settings.stripFolded ? h('div', { class: 'titlebg', 'aria-hidden': 'true', style: "background-image:url('art/pixel/out/strip-plaza.png')" }) : null,
      h('h1', {}, 'LinkPRG'),
      h('p', { class: 'tag' }, '이 세계에서는 무언가를 끝까지 해낸 사람에게 종소리가 들린다.'),
      // 읽을 수 없는 칸을 묻지 않고 덮어쓰지 않도록, "시작"은 늘 빈 칸으로 간다.
      used.length || !firstEmpty ? null : h('button', { class: 'btn go', type: 'button', style: 'min-width:12rem;font-size:1.1rem', 'data-autofocus': true, onclick: () => showCreate(firstEmpty.slot) }, '시작'),
      list,
      h('div', { class: 'row-btns' },
        h('button', { class: 'btn', type: 'button', onclick: openSettings }, '설정'),
        h('button', { class: 'btn', type: 'button', onclick: () => openHelp() }, '도움말'))));
    (root.querySelector('[data-autofocus]') || root.querySelector('button'))?.focus();
  }

  function slotRow(s, latest) {
    const offer = s.empty ? cloud.offerOf(s.slot) : null;
    if (offer) {
      return h('div', { class: 'slot' },
        h('span', {}, h('b', {}, offer.name), `, 레벨 ${offer.level}`, h('br'), h('span', { class: 'muted', style: 'font-size:.88rem' }, `드라이브에만 있음. ${offer.when}`)),
        h('div', { class: 'row-btns' },
          h('button', { class: 'btn go', type: 'button', onclick: () => { cloud.take(s.slot); showTitle(); } }, '드라이브에서 받기'),
          h('button', { class: 'btn', type: 'button', onclick: () => showCreate(s.slot) }, '새로 시작')));
    }
    if (s.empty) {
      return h('div', { class: 'slot empty' },
        h('span', { class: 'muted' }, `${s.slot + 1}번 칸. 비어 있음`),
        h('div', { class: 'row-btns' },
          h('button', { class: 'btn', type: 'button', onclick: () => showCreate(s.slot) }, '새로 시작'),
          h('button', { class: 'btn', type: 'button', onclick: () => importInto(s.slot) }, '파일에서 가져오기')));
    }
    if (s.broken) {
      return h('div', { class: 'slot' },
        h('span', {}, `${s.slot + 1}번 칸. 읽을 수 없음: ${s.error}`),
        h('div', { class: 'row-btns' },
          h('button', { class: 'btn', type: 'button', onclick: () => exportSlot(s.slot, `${s.slot + 1}번칸`) }, '파일로 내보내기'),
          h('button', { class: 'btn', type: 'button', onclick: () => confirmClear(s) }, '이 칸 지우기')));
    }
    return h('div', { class: `slot ${latest ? 'main' : ''}` },
      h('span', {}, h('b', {}, s.name), `, ${s.job}, 레벨 ${s.level}`, cloud.has(s.slot) ? h('span', { class: 'cloudtag' }, '드라이브에도 있음') : null, h('br'), h('span', { class: 'muted', style: 'font-size:.88rem' }, `${s.when}, ${PLACES[s.place]?.name || ''}. ${ago(s.savedAt)}`)),
      h('div', { class: 'row-btns' },
        h('button', { class: `btn ${latest ? 'go' : ''}`, type: 'button', 'data-autofocus': latest || null, onclick: () => resume(s.slot) }, '이어 하기')));
  }

  function ago(at) {
    const min = Math.round((Date.now() - at) / 60000);
    if (min < 1) return '방금 저장됨';
    if (min < 60) return `${min}분 전`;
    if (min < 60 * 24) return `${Math.round(min / 60)}시간 전`;
    return `${Math.round(min / 60 / 24)}일 전`;
  }

  /** 캐릭터 지우기: 경고를 두 번 묻는다. 두 번 다 초점은 "그만둔다"에 간다 */
  function deleteCharacter() {
    const who = { slot, name: game.name, level: game.level, when: whenLabel(game) };
    const synced = cloud.has(who.slot);
    wins.open({
      title: '캐릭터를 지울까요?', render(body, { close }) {
        add(body,
          h('p', {}, `${eulReul(who.name)} 지웁니다(레벨 ${who.level}, ${who.when}). 레벨, 물건, 사람들과의 사이가 모두 사라집니다.`),
          h('div', { class: 'row-btns' },
            h('button', { class: 'btn', type: 'button', 'data-autofocus': true, onclick: close }, '그만둔다'),
            h('button', { class: 'btn', type: 'button', onclick: () => { close(); secondWarning(); } }, '지운다')));
      },
    });
    function secondWarning() {
      wins.open({
        title: '정말로 지웁니까?', dark: true, render(body, { close }) {
          add(body,
            h('p', { class: 'warn' }, `한 번 더 묻습니다. 지운 ${eunNeun(who.name)} 되돌릴 수 없습니다. 되감는 저장도 없습니다.${synced ? ' 구글 드라이브에 남은 것도 함께 지워집니다.' : ''}`),
            h('div', { class: 'row-btns' },
              h('button', { class: 'btn go', type: 'button', 'data-autofocus': true, onclick: close }, '그만둔다'),
              h('button', { class: 'btn', type: 'button', onclick: () => { clearSlot(storage, who.slot); cloud.removed(who.slot); close(); showTitle(); } }, '영영 지운다')));
        },
      });
    }
  }

  function confirmClear(s) {
    wins.open({
      title: '이 칸을 지울까요?', render(body, { close }) {
        add(body,
          h('p', {}, s.broken ? `${s.slot + 1}번 칸의 저장을 지웁니다.` : `${s.name} (레벨 ${s.level}, ${s.when})의 저장을 지웁니다. 되돌릴 수 없습니다.`),
          h('div', { class: 'row-btns' },
            h('button', { class: 'btn', type: 'button', 'data-autofocus': true, onclick: close }, '취소'),
            h('button', { class: 'btn go', type: 'button', onclick: () => { clearSlot(storage, s.slot); cloud.removed(s.slot); close(); showTitle(); } }, '삭제')));
      },
    });
  }

  function exportSlot(n, name) {
    try {
      const blob = new Blob([exportText(storage, n)], { type: 'application/json' });
      const a = h('a', { href: URL.createObjectURL(blob), download: `띠링-${name}.json` });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e) { fail(e, 'export'); notice('내보내지 못했습니다', e.message); }
  }

  function importInto(n) {
    const input = h('input', { type: 'file', accept: '.json,application/json', hidden: true });
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      try { importText(storage, n, await file.text()); showTitle(); }
      catch (e) { fail(e, 'import'); notice('가져오지 못했습니다', e.message); }
      input.remove();
    });
    input.addEventListener('cancel', () => input.remove());
    document.body.append(input); input.click();
  }

  function notice(title, text) {
    wins.open({ title, over: true, render(body, { close }) { add(body,h('p', {}, text), h('button', { class: 'btn go', type: 'button', 'data-autofocus': true, onclick: close }, '확인')); } });
  }

  function resume(n) {
    try {
      const loaded = loadFrom(storage, n);
      if (!loaded) return showTitle();
      game = loaded; slot = n; saveRev = revOf(storage, n);
      if (game.flags?.mustRebirth) showCreate(n, rebirthCarry(game)); else showGame();
      openSince();
    } catch (e) { fail(e, 'load'); game = null; showTitle(); notice('이어 할 수 없습니다', e.message); }
  }

  // ── 캐릭터 만들기 (T1~T3) ───────────────────────────────
  function showCreate(n, carry = null) {
    // 출신은 엎어진 패 다섯 장 가운데 한 장을 뒤집어 정한다 (Z25). 뒤집기 전에는 무엇인지, 어떤 등급인지 알 수 없다
    const salt = Date.now();
    const hand = dealOrigins(`${salt}|deal`); // 이 화면에서 깔린 패. 다시 깔지 않는다
    const flipped = new Set(); // 뒤집어 본 패. 다섯 장 모두 뒤집어 볼 수 있다
    let origin = null; // 고른 패(마지막으로 누른 것)
    // 스탯은 주사위로 정한다. 마음에 들 때까지 몇 번이든 굴린다
    let rolls = 0; // 단추를 누른 횟수. 처음 주어진 눈은 세지 않는다
    let rolled = rollDice(`${salt}|${rolls}`);
    let pool = 0; // 백 번 굴린 뒤: 스탯에서 덜어 내 아직 다시 넣지 않은 점수
    let name = '';
    let error = '';
    // 다시 그린 뒤 같은 단추로 초점을 돌려준다. 그 단추가 꺼졌으면 켜져 있는 다른 단추로.
    const refocus = (label) => {
      const el = root.querySelector(`[aria-label^="${label}"]`);
      (el && !el.disabled ? el : root.querySelector('.hand button:not([disabled]), .namebox input'))?.focus();
    };
    const draw = () => {
      const o = origin ? originById(origin) : { stats: {}, story: '', grade: 0, root: null };
      const stats = Object.fromEntries(Object.keys(STAT_NAMES).map((k) => [k, rolled[k] + (o.stats[k] || 0) + (carry?.toughGained[k] || 0)]));
      const bonus = Object.values(o.stats || {}).reduce((a, b) => a + b, 0); // 출신이 더해 준 스탯. 합계에 넣어 보여 준다
      const free = rolls >= DICE_FREE_AT; // 끝까지 굴린 사람은 손으로 옮긴다
      fill(root,h('div', { class: 'create' },
        h('main', {},
          carry ? pastPanel(carry) : null,
          h('h1', {}, '당신은 어떤 사람이었습니까'),
          h('p', { class: 'muted', style: 'max-width:40rem' }, '패를 뒤집어 보고 한 장을 고르십시오. 고른 것이 당신의 지난날입니다. 시작할 때의 작은 차이와, 사람들이 당신을 대하는 첫마디를 정합니다.'),
          h('div', { class: 'hand', role: 'group', 'aria-label': '출신 패 다섯 장' }, hand.map((id, i) => {
            const x = originById(id);
            const up = flipped.has(id);
            const picked = origin === id;
            return h('button', { class: `card5 ${up ? `up og${x.grade}` : ''} ${picked ? 'picked' : ''}`, type: 'button', 'aria-pressed': String(picked), 'data-card': i, 'data-autofocus': i === 0 || null,
              'aria-label': up ? `${ORIGIN_GRADES[x.grade].name} ${x.name}${picked ? ', 고름' : ''}` : `${i + 1}번째 패, 뒤집기`,
              onclick: () => { if (!flipped.has(id) && x.grade >= 2) playDing(x.grade, settings.sound); flipped.add(id); origin = id; error = ''; draw(); root.querySelector(`[data-card="${i}"]`)?.focus(); } },
              up ? [picked ? h('span', { class: 'pick' }, '고름') : null, h('small', {}, ORIGIN_GRADES[x.grade].name), h('b', {}, x.name)] : h('span', { class: 'mark', 'aria-hidden': 'true' }, '?'));
          })),
          h('p', { class: 'muted', style: 'font-size:.9rem' }, flipped.size < 5 ? `다섯 장 모두 뒤집어 볼 수 있습니다. 마지막으로 누른 패가 당신의 출신이 됩니다. (${flipped.size} / 5)` : '다섯 장을 모두 보았습니다. 누른 패가 당신의 출신이 됩니다.'),
          origin
            ? h('div', { class: `origincard og${o.grade}`, role: 'status' },
              h('div', {}, h('span', { class: 'tagx' }, ORIGIN_GRADES[o.grade].name), ' ', h('span', { class: 'tagx plain' }, ROOTS[o.root].name)),
              h('b', { class: 'serif' }, o.name), h('span', {}, o.number), h('span', { class: 'muted' }, o.talk))
            : h('div', { class: 'origincard wait' }, '패를 뒤집으면 여기에 나옵니다.'),
          h('p', { class: 'err', role: 'alert' }, error),
          h('div', { class: 'namebox' },
            h('label', {}, '이름', h('input', { type: 'text', maxlength: 12, value: name, autocomplete: 'off', oninput: (e) => { name = e.target.value; } })),
            h('button', { class: 'btn', type: 'button', onclick: showTitle }, '돌아가기'),
            h('button', { class: 'btn go', type: 'button', style: 'min-height:3.1rem;padding:0 2rem;font-size:1.05rem', onclick: () => {
              try { if (!origin) throw new Error('패를 뒤집어 한 장을 골라 주세요'); if (pool > 0) throw new Error(`남은 점수 ${pool}점을 스탯에 넣어 주세요`); game = createGame({ name, origin, rolled, carry }); slot = n; saveRev = saveTo(storage, slot, game); showGame(); }
              catch (e) { error = e.message; draw(); root.querySelector('.namebox input')?.focus(); }
            } }, '시작 마을로'))),
        h('aside', {},
          h('div', { style: 'display:flex;justify-content:space-between;align-items:baseline' },
            h('h2', { class: 'serif', style: 'font-size:1.4rem' }, '시작 스탯'),
            h('span', {}, `합계 ${DICE_TOTAL + bonus}${bonus ? ` (출신 +${bonus})` : ''}${free ? `, 남은 점수 ${pool}` : ''}`)),
          Object.keys(STAT_NAMES).map((key) => h('div', { class: 'statline' },
            h('span', {}, h('b', {}, STAT_NAMES[key]), ` ${stats[key]}${o.stats[key] ? `(+${o.stats[key]})` : ''} `, h('span', { class: 'muted', style: 'font-size:.88rem' }, STAT_USES[key])),
            free ? h('button', { class: 'pm', type: 'button', 'aria-label': `${STAT_NAMES[key]} 내리기`, disabled: rolled[key] <= DICE_MIN, onclick: () => { rolled = { ...rolled, [key]: rolled[key] - 1 }; pool += 1; draw(); refocus(`${STAT_NAMES[key]} 내리기`); } }, '−') : null,
            free ? h('button', { class: 'pm', type: 'button', 'aria-label': `${STAT_NAMES[key]} 올리기`, disabled: pool <= 0, onclick: () => { rolled = { ...rolled, [key]: rolled[key] + 1 }; pool -= 1; draw(); refocus(`${STAT_NAMES[key]} 올리기`); } }, '+') : null,
          )),
          h('button', { class: 'btn go', type: 'button', 'data-press': true, disabled: free, 'aria-label': `주사위 굴리기. 지금 힘 ${stats.str}, 민첩 ${stats.agi}, 체력 ${stats.con}, 지혜 ${stats.wis}`, style: 'min-height:3rem;margin:.6rem 0', onclick: () => { rolls += 1; rolled = rollDice(`${salt}|${rolls}`); pool = 0; if (rolls === DICE_FREE_AT) error = ''; draw(); if (rolls >= DICE_FREE_AT) root.querySelector('.create .pm:not([disabled])')?.focus(); else refocus('주사위'); } }, '주사위 굴리기'),
          free ? h('p', { class: 'serif', role: 'status', style: 'color:var(--cinnamon)' }, '주사위가 닳았다. 더는 구르지 않는다. 이제 눈을 손으로 옮긴다. −로 덜어 +로 넣는다.') : null,
          free ? null : h('p', { class: 'muted', style: 'font-size:.85rem' }, `주사위의 합은 늘 ${DICE_TOTAL}이다. 어떻게 나뉘느냐만 달라진다.${bonus ? ' 출신이 준 것은 그 위에 더해진다.' : ''}`),
          h('span', { class: 'h' }, '이 사람은'),
          h('p', { class: 'serif', style: 'font-size:1.05rem;line-height:1.8' }, origin ? o.story : '아직 패를 뒤집지 않았다.'),
          h('p', { class: 'muted', style: 'margin-top:auto;font-size:.88rem' }, '직업은 레벨 5에 고릅니다. 지금은 누구나 무직입니다.'))));
    };
    draw();
    root.querySelector('.hand button')?.focus();
  }

  /** 환생하는 사람에게 보이는 지난 삶에서 가져온 것 (Z32). */
  function pastPanel(carry) {
    const found = Object.entries(carry.hidden).map(([id, x]) => `${hiddenById(id)?.name} ${x.value}`);
    const raised = Object.entries(carry.toughGained).filter(([, v]) => v > 0).map(([k, v]) => `${STAT_NAMES[k]} +${v}`);
    return h('section', { class: 'pastlife', 'aria-label': '지난 삶에서 가져온 것' },
      h('h2', { class: 'serif' }, `지난 삶에서 가져온 것 (${carry.lives}번째 삶)`),
      found.length ? h('div', { class: 'rowx' }, h('span', {}, '히든 스탯'), h('b', {}, found.join(', '))) : null,
      raised.length ? h('div', { class: 'rowx' }, h('span', {}, '다시 일어선 몸'), h('b', {}, `${raised.join(', ')} (주사위 위에 더해진다)`)) : null,
      carry.titles.length ? h('div', { class: 'rowx' }, h('span', {}, '칭호'), h('span', {}, carry.titles.map((t) => TITLES[t.id]?.name || t.id).join(', '))) : null,
      h('div', { class: 'rowx' }, h('span', {}, '도감'), h('span', {}, '그대로 남는다')),
      Object.keys(carry.bank || {}).length ? h('div', { class: 'rowx' }, h('span', {}, '보관함'), h('b', {}, `${Object.entries(carry.bank).map(([t, b]) => `${t} 은화 ${b.silver}${b.items.length ? `, 물건 ${b.items.length}가지` : ''}`).join(' / ')} (그 마을 보관함에서 찾는다)`)) : null,
      Object.keys(carry.skills || {}).length ? h('div', { class: 'rowx' }, h('span', {}, '숙련도'), h('span', {}, `${Object.keys(carry.skills).map((id) => SKILL_NAMES[id] || id).join(', ')}: 쌓은 것의 5%`)) : null,
      carry.pastLives.map((p) => h('div', { class: 'rowx' }, h('span', {}, '지난 삶'), h('span', {}, `'${p.name}' — ${p.job || '무직'}, 레벨 ${p.level}, ${p.day}일째에 쓰러졌다`))));
  }

  /** 휴대폰 아래 탭의 작은 그림. 꾸밈이라 읽지 않는다 (글자가 같이 있다). */
  const SVGNS = 'http://www.w3.org/2000/svg';
  const ICONS = {
    chat: ['M4 5h16v11H9l-5 4z'],
    place: ['M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z', 'M12 7.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z'],
    bag: ['M5 8h14l-1 12H6z', 'M9 8V6a3 3 0 0 1 6 0v2'],
    book: ['M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z', 'M5 17a3 3 0 0 1 3-3h11'],
    menu: ['M4 7h16M4 12h16M4 17h16'],
  };
  function svgIcon(name) {
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true');
    for (const d of ICONS[name]) { const p = document.createElementNS(SVGNS, 'path'); p.setAttribute('d', d); svg.append(p); }
    return svg;
  }

  // ── 게임 화면 (D1~D6) ───────────────────────────────────
  function showGame() {
    refs.nav = h('nav', { class: 'nav', 'aria-label': '장소' });
    refs.strip = h('div', { class: 'strip' });
    refs.hd = h('header', { class: 'hd' });
    refs.log = h('div', { class: 'log', role: 'log', 'aria-live': 'polite', 'aria-label': '대화방', tabindex: '0' });
    refs.suggest = h('div', {});
    refs.body = h('div', { class: 'bodybar', role: 'group', 'aria-label': '몸 상태' });
    refs.mstats = h('div', { class: 'mstats', role: 'group', 'aria-label': '몸 상태' }); // 휴대폰: 한 줄 네 칸
    refs.mtabs = h('nav', { class: 'mtabs', 'aria-label': '아래 탭' }); // 휴대폰: 아래 탭 다섯 칸
    refs.topbar = h('header', { class: 'topbar', 'aria-label': '메뉴' }); // 넓은 화면: 맨 위 메뉴 띠 (PC 시안 A)
    refs.fight = h('div', { role: 'status', 'aria-label': '싸움' });
    refs.slots = h('nav', { class: 'b5', 'aria-label': '단축 칸' });
    refs.sr = h('div', { class: 'sr', role: 'alert', 'aria-live': 'assertive' }); // 띠링은 바로 읽힌다
    refs.assist = h('div', { class: 'assistline', role: 'status' });
    // 좁은 화면(휴대폰)에서는 방 목록과 책을 위의 단추로 여닫는다 (N8-1)
    const toggle = (cls, other) => () => { refs.game.classList.remove(other); const on = refs.game.classList.toggle(cls); drawTabs(); refs.mNav.setAttribute('aria-expanded', String(refs.game.classList.contains('nav-open'))); refs.mBook.setAttribute('aria-expanded', String(refs.game.classList.contains('book-open'))); if (on) (cls === 'nav-open' ? refs.nav : refs.tabs).querySelector('button')?.focus(); };
    refs.mNav = h('button', { class: 'btn', type: 'button', 'aria-expanded': 'false', onclick: toggle('nav-open', 'book-open') }, '방 목록');
    refs.mBook = h('button', { class: 'btn', type: 'button', 'aria-expanded': 'false', onclick: toggle('book-open', 'nav-open') }, '모험 일지');
    refs.shade = h('button', { class: 'shade', type: 'button', 'aria-label': '닫기', onclick: closeDrawers });
    refs.tabs = h('div', { class: 'tabs', role: 'tablist', 'aria-label': '모험 일지' });
    refs.menu = h('nav', { class: 'cmenu', 'aria-label': '캐릭터' });
    refs.pg = h('div', { class: 'pg', role: 'tabpanel' });
    refs.game = h('div', { class: 'game' },
      refs.topbar,
      refs.nav,
      h('main', { class: 'room' }, h('div', { class: 'mbar' }, refs.mNav, h('button', { class: 'btn', type: 'button', onclick: () => openBag('all') }, '가방'), refs.mBook), refs.hd, refs.body, refs.mstats, h('div', { class: 'logwrap' }, refs.strip, refs.log), refs.suggest, refs.fight, refs.assist, refs.slots, refs.mtabs, refs.sr),
      h('aside', { class: 'book', 'aria-label': '모험 일지' }, refs.menu, refs.tabs, refs.pg),
      refs.shade);
    fill(root, refs.game);
    assist = createAssist(settings.assist);
    refs.log.replaceChildren(...game.log.slice(-LOG_SHOWN).flatMap(lineNodes));
    drawAll();
    refs.log.scrollTop = refs.log.scrollHeight;
    refs.slots.querySelector('button:not([disabled])')?.focus();
  }

  /** 히든 스탯을 하나라도 얻었는가. 얻기 전에는 그런 것이 있다는 말도 화면에 내지 않는다. */
  const knowsHidden = () => !!game && foundCount(game) > 0;

  function closeDrawers() {
    if (!refs.game) return;
    queueMicrotask(() => drawTabs());
    const was = refs.game.classList.contains('nav-open') ? refs.mNav : refs.game.classList.contains('book-open') ? refs.mBook : null;
    refs.game.classList.remove('nav-open', 'book-open');
    if (was && (document.activeElement === document.body || refs.nav.contains(document.activeElement) || refs.pg.contains(document.activeElement) || refs.tabs.contains(document.activeElement) || document.activeElement === refs.shade)) was.focus();
    refs.mNav?.setAttribute('aria-expanded', 'false');
    refs.mBook?.setAttribute('aria-expanded', 'false');
  }

  /** 휴대폰 아래 탭 (시안 A): 대화방·장소·가방·일지·메뉴 */
  function drawTabs() {
    if (!refs.mtabs) return;
    const g = refs.game.classList;
    const which = g.contains('nav-open') ? 'place' : g.contains('book-open') ? 'book' : 'chat';
    const tabBtn = (id, label, onclick, extra) => h('button', { class: `mtab ${which === id ? 'on' : ''}`, type: 'button', 'aria-pressed': String(which === id), onclick }, svgIcon(id), h('span', {}, label), extra || null);
    const on = cloud.status === 'on' || cloud.status === 'busy';
    fill(refs.mtabs,
      tabBtn('chat', '대화방', () => { closeDrawers(); refs.slots?.querySelector('button:not([disabled])')?.focus(); }),
      tabBtn('place', '장소', () => refs.mNav.click()),
      tabBtn('bag', '가방', () => { closeDrawers(); openBag('all'); }),
      tabBtn('book', '일지', () => refs.mBook.click()),
      tabBtn('menu', '메뉴', () => { closeDrawers(); openMenu(); }, [h('span', { class: `syncdot ${on ? 'on' : 'off'}`, title: on ? '드라이브와 맞춰짐' : '드라이브와 안 맞춰짐' }, h('span', { class: 'sr' }, on ? ', 드라이브와 맞춰짐' : ', 드라이브와 안 맞춰짐')), unreadMail(game) ? h('b', { class: 'num mailnum', 'aria-label': `안 읽은 편지 ${unreadMail(game)}` }, unreadMail(game)) : null]));
  }

  /** 우편함 (Z59): 왼쪽 목록, 오른쪽 편지. 붙은 것은 "받기"를 눌러야 들어온다 */
  function openMail() {
    let pick = mailView(game)[0]?.id || null;
    wins.open({
      title: '우편함', size: 'wide', sheet: true,
      render(body, { rerender }) {
        const list = mailView(game);
        const m = list.find((x) => x.id === pick) || list[0];
        if (m && !m.read) { run({ type: 'mail', op: 'read', id: m.id }, true); drawTopbar(); drawTabs(); }
        if (!list.length) { add(body, h('p', { class: 'muted' }, '아직 온 편지가 없다.')); return; }
        add(body, h('div', { class: 'cols mailcols' },
          h('div', { class: 'mlist', role: 'group', 'aria-label': '편지' }, list.map((x) =>
            h('button', { class: `mitem ${x.id === m.id ? 'on' : ''} ${x.read ? '' : 'unread'}`, type: 'button', 'aria-pressed': String(x.id === m.id), onclick: () => { pick = x.id; rerender(); } },
              h('b', {}, x.title), h('small', {}, `${x.from} · ${x.day}일째`, x.gift && !x.taken ? h('span', { class: 'gifttag' }, x.gift) : null)))),
          h('article', { class: 'letter' },
            h('span', { class: 'muted', style: 'font-size:.85rem' }, `보낸 이: ${m.from} · ${m.day}일째`),
            h('h3', { class: 'serif' }, m.title),
            h('p', { class: 'serif' }, m.body),
            m.gift ? h('div', { class: 'attach' }, h('span', {}, '붙은 것: ', h('b', {}, m.gift)),
              h('button', { class: `btn ${m.taken ? '' : 'go'}`, type: 'button', disabled: m.taken, 'data-autofocus': !m.taken || null, onclick: () => { if (run({ type: 'mail', op: 'take', id: m.id }, true)) { drawTopbar(); drawTabs(); rerender(); } } }, m.taken ? '받았다' : '받기')) : null)));
      },
      onClose: () => { drawTopbar(); drawTabs(); refs.slots?.querySelector('button:not([disabled])')?.focus(); },
    });
  }

  /** 휴대폰 메뉴 판: 나머지 창을 한곳에 */
  function openMenu() {
    const busy = !!(game.battle || game.choice);
    const go = (fn) => (close) => () => { close(); fn(); };
    const items = [
      ['퀘스트', () => openQuests()], ['칭호', openTitles], ['우편함', openMail], ['장비', openGear], ['동료', openParty], ['작품', openWorks],
      ['알림 기록', openPast], ['공지와 랭킹', openWorld], ['길드', openGuild, busy], ['저장과 설정', openSettings], ['도움말', () => openHelp()],
    ];
    if (ringView(game)) items.splice(8, 0, ['지켜본다', openRing, busy]);
    wins.open({
      title: '메뉴', sheet: true,
      render(body, { close }) {
        add(body, h('div', { class: 'menugrid' }, items.map(([label, fn, off]) =>
          h('button', { class: 'btn', type: 'button', disabled: !!off, onclick: go(fn)(close) }, label, label === '저장과 설정' ? syncDot() : null, label === '우편함' && unreadMail(game) ? h('b', { class: 'num' }, unreadMail(game)) : null))));
      },
    });
  }

  function drawAll() { drawTabs(); drawNav(); drawStrip(); drawHeader(); drawBody(); drawSuggest(); drawFight(); drawForge(); drawCarve(); drawSlots(); drawBook(); }

  const meter = (label, now, max, cls = '') => h('span', { class: `meter ${cls}` },
    h('span', {}, `${label} `, h('b', {}, now), max != null ? ` / ${max}` : ''),
    h('i', { 'aria-hidden': 'true' }, h('i', { style: `width:${Math.max(0, Math.min(100, Math.round((now / (max ?? 100)) * 100)))}%` })));

  /** 휴대폰 몸 상태 (시안 A): 생명·포만·피로·경험 한 줄. 배고프면 포만 칸이 "먹기"가 된다 */
  function drawMobileStats(b) {
    if (!refs.mstats) return;
    const pct = (now, max) => `width:${Math.max(0, Math.min(100, Math.round((now / (max || 100)) * 100)))}%`;
    const toStatus = () => { tab = 'status'; drawBook(); if (!refs.game.classList.contains('book-open')) refs.mBook.click(); };
    const cell = (label, value, now, max, opts = {}) => h('button', { class: `mst ${opts.cls || ''}`, type: 'button', 'aria-label': opts.aria || `${label} ${value}`, onclick: opts.onclick || toStatus },
      h('span', {}, `${label} `, h('b', {}, value), opts.tail ? h('em', {}, opts.tail) : null), h('i', { 'aria-hidden': 'true' }, h('i', { style: pct(now, max) })));
    const hungry = b.hungry;
    fill(refs.mstats, h('div', { class: 'mcells' },
      cell('생명', b.hp, b.hp, b.maxHp, { cls: b.hp <= b.maxHp * 0.3 ? 'low' : '', aria: `생명력 ${b.hp} / ${b.maxHp}. 가방의 소비 열기`, onclick: () => openBag('eat') }),
      game.job ? cell('마나', b.mp, b.mp, b.maxMp, { aria: `마나 ${b.mp} / ${b.maxMp}` }) : null,
      cell('포만', b.full, b.full, 100, hungry ? { cls: 'low warn', tail: '먹기', aria: `포만감 ${b.full}. 배가 고프다. 먹을 것 열기`, onclick: () => openBag('eat') } : { aria: `포만감 ${b.full}. 가방의 소비 열기`, onclick: () => openBag('eat') }),
      cell('피로', b.tired, b.tired, 100, { cls: b.tiredOut ? 'low' : '', aria: `피로 ${b.tired}` }),
      cell('경험', `${Math.floor((b.xp / (b.xpNeed || 1)) * 100)}%`, b.xp, b.xpNeed, { aria: `경험치 ${b.xp} / ${b.xpNeed}` }),
      cell('무게', b.weight, b.weight, b.carry, { cls: `wt ${b.over ? 'low' : ''}`, tail: b.over ? '넘침' : null, aria: `무게 ${b.weight} / ${b.carry}`, onclick: () => openBag('all') })),
      b.shadow || b.status.length || b.sense ? h('div', { class: 'mtags' }, b.shadow ? h('span', { class: 'tagx' }, `그림자 ${b.shadow}겹`) : null, b.status.map((x) => h('span', { class: 'tagx' }, `${x.name} ${x.turns}턴`)), b.sense ? h('span', { class: 'tagx' }, `기척 ${b.sense}칸 / 5칸`) : null) : null);
  }

  function drawBody() {
    const b = bodyView(game);
    drawMobileStats(b);
    fill(refs.body,
      meter('생명력', b.hp, b.maxHp, b.hp <= b.maxHp * 0.3 ? 'low' : ''),
      game.job ? meter('마나', b.mp, b.maxMp) : null,
      meter('포만감', b.full, null, b.hungry ? 'low' : ''),
      meter('피로', b.tired, null, b.tiredOut ? 'low' : ''),
      meter('경험치', b.xp, b.xpNeed),
      h('span', { class: `meter ${b.over ? 'low' : ''}` }, h('span', {}, '무게 ', h('b', {}, b.weight), ` / ${b.carry}${b.over ? ' 넘침' : ''}`)),
      b.shadow ? h('span', { class: 'tagx' }, `그림자 ${b.shadow}겹`) : null,
      b.hungry ? h('span', { class: 'tagx' }, '굶주림') : null,
      b.tiredOut ? h('span', { class: 'tagx' }, '피로') : null,
      b.status.map((x) => h('span', { class: 'tagx' }, `${x.name} ${x.turns}턴`)),
      b.sense ? h('span', { class: 'meter' }, h('span', {}, `기척 ${b.sense}칸 / 5칸`), h('span', { class: 'pips', 'aria-hidden': 'true' }, [1, 2, 3, 4, 5].map((n) => h('i', { class: n <= b.sense ? 'on' : '' })))) : null);
  }

  function drawFight() {
    const e = enemyView(game);
    if (!e) { refs.fight.replaceChildren(); refs.fight.className = ''; return; }
    refs.fight.className = 'fight';
    fill(refs.fight,
      h('div', {}, h('b', {}, e.name), ` 레벨 ${e.level}, ${e.turn}턴째${e.element ? `, ${e.element} 속성` : ''}${e.stages ? `, 국면 ${e.stage} / ${e.stages}` : ''}`, e.fierce > 0 ? h('span', { class: 'fiercetag' }, `사나움 +${e.fierce}%`) : null),
      meter('적 생명력', e.hp, e.maxHp),
      e.next ? h('div', { class: 'next' }, h('span', { class: 'muted' }, '다음 행동 '), h('b', {}, e.next.name), `. ${e.next.tell} `, h('span', {}, e.hint)) : null);
  }

  function drawNav() {
    const place = placeById(game.place);
    const busy = !!(game.battle || game.choice);
    const rv = roomView(game);
    drawMenu(!!rv);
    if (rv) {
      fill(refs.nav,
        h('small', {}, '현재 위치'),
        h('button', { class: 'ch here', type: 'button', 'aria-current': 'page' }, rv.name),
        h('span', { class: 'note' }, `${rv.dungeon} ${rv.floor}. ${rv.kind}`),
        navMap(),
        h('small', {}, '이 방에서 갈 수 있는 곳'),
        rv.exits.map((x) => h('button', { class: 'ch exit', type: 'button', disabled: busy || !x.can, title: x.why || null, onclick: () => run({ type: 'room', to: x.id }) }, h('span', {}, x.dir ? h('b', { class: 'dir' }, x.dir) : null, `${x.name}${x.floor ? ` (${x.floor})` : ''}`), x.why ? h('small', { class: 'muted' }, ` ${x.why}`) : null)),
        rv.canLeave ? h('button', { class: 'ch', type: 'button', disabled: busy, onclick: () => run({ type: 'dungeon', op: 'leave' }) }, h('span', {}, '밖으로 나간다')) : null);
      return;
    }
    const danger = place.wild ? mapView(game).find((r) => r.id === place.id).danger : place.danger;
    fill(refs.nav,
      h('small', {}, '현재 위치'),
      h('button', { class: 'ch here', type: 'button', 'aria-current': 'page' }, place.name),
      h('span', { class: 'note' }, `위험도 ${danger}`),
      place.wild && mapView(game).find((r) => r.id === place.id).scent ? h('span', { class: 'note warnnote' }, '피 냄새가 남아 있다. 무언가 노리고 온다.') : null,
      game.battle ? h('span', { class: 'note warnnote', role: 'status' }, '싸우는 중에는 다른 곳으로 갈 수 없다. 이기거나 달아나야 한다.') : null,
      place.wild ? h('span', { class: 'note' }, `권장 레벨 ${place.levels}${isNight(game) ? '. 밤에는 위험도가 한 단계 오른다' : ''}`) : null,
      place.wild ? null : h('small', {}, place.town),
      townRooms(game).map((r, i, all) => [
        r.part && (i === 0 || all[i - 1].part !== r.part) ? h('small', { class: 'part' }, r.part) : null,
        h('button', { class: 'ch', type: 'button', disabled: busy || r.closed || r.here, 'aria-current': r.here ? 'location' : null, title: r.here ? '지금 여기 있다' : r.closed ? r.why : null, onclick: () => run({ type: 'move', to: r.id }) }, h('span', {}, r.name), r.closed ? h('small', { class: 'muted' }, ` ${r.why}`) : null)]),
      peopleHere(game).length ? h('small', {}, '여기 있는 사람') : null,
      peopleHere(game).map((p) => {
        const n = offersOf(game, p.id).length;
        return h('button', { class: 'ch', type: 'button', disabled: busy, 'aria-label': n ? `${p.name}, 줄 일이 ${n}개 있다` : p.name, onclick: () => openTalk(p.id) }, h('span', {}, p.name), n ? h('b', { class: 'num' }, n) : null);
      }),
      h('button', { class: 'ch mapbtn', type: 'button', disabled: busy, onclick: openMap }, h('span', {}, '세계 지도')));
  }

  /** 넓은 화면의 맨 위 메뉴 띠 (PC 시안 A): 메뉴는 여기 한 줄에. 설정·도움말은 오른쪽 끝 */
  function drawTopbar() {
    if (!refs.topbar) return;
    const busy = !!(game.battle || game.choice);
    const b = (label, onclick, opts = {}) => h('button', { class: `tb ${opts.key ? 'key' : ''}`, type: 'button', disabled: !!opts.off, onclick, 'aria-label': opts.num ? `${label} ${opts.num}` : null }, label, opts.num ? h('b', { class: 'num' }, opts.num) : null, opts.extra || null);
    const ring = ringView(game);
    fill(refs.topbar,
      h('span', { class: 'logo' }, 'LinkPRG'),
      h('nav', { class: 'tbmenu', 'aria-label': '캐릭터와 세계' },
        b('가방', () => openBag('all'), { key: true }), b('장비', openGear), b('퀘스트', () => openQuests()), b('칭호', openTitles),
        b('동료', openParty, { num: game.party.length || null }), b('작품', openWorks), b('우편함', openMail, { num: unreadMail(game) || null }),
        b('길드', openGuild, { off: busy, num: game.guild ? guildView(game).mine.rank : null }), b('공지와 랭킹', openWorld), b('알림 기록', openPast),
        ring ? b('지켜본다', openRing, { off: busy, num: ring.list.filter((x) => !x.done).length || null }) : null),
      h('div', { class: 'tbright' }, b('저장과 설정', openSettings, { extra: syncDot() }), b('도움말', () => openHelp())));
  }

  /** 책 위의 캐릭터 메뉴: 네 칸씩 두 줄. 던전 안에서는 가방·장비·동료·퀘스트만. */
  function drawMenu(inDungeon) {
    drawTopbar();
    const item = (label, onclick, num) => h('button', { class: 'cm', type: 'button', onclick, 'aria-label': num ? `${label} ${num}` : null }, label, num ? h('b', { class: 'num' }, num) : null);
    const party = game.party.length || null;
    fill(refs.menu, inDungeon
      ? [item('가방', () => openBag('all')), item('장비', openGear), item('동료', openParty, party), item('퀘스트', () => openQuests())]
      : [item('가방', () => openBag('all')), item('장비', openGear), item('작품', openWorks), item('동료', openParty, party), item('퀘스트', () => openQuests()), item('칭호', openTitles), item('알림 기록', openPast)]);
  }

  function drawStrip() {
    const place = placeById(game.place);
    if (!settings.art) { refs.strip.replaceChildren(); refs.strip.className = 'strip folded'; return; }
    const statue = game.place === 'plaza' ? statueOf(game) : null;
    // 받침대에 토끼상이 서 있으면 그 띠를 쓴다. 다른 조각은 글로 알린다(그림은 꾸밈이다).
    const name = statue && statue.art === 'rabbit' && !isNight(game) ? 'strip-plaza' : isNight(game) ? place.strip.night : place.strip.day;
    refs.strip.className = `strip ${settings.stripFolded ? 'folded' : ''}`;
    refs.strip.replaceChildren(
      settings.stripFolded ? null : pixel(name, '', 384, 96));
  }

  function drawHeader() {
    refs.hd.replaceChildren(
      h('h1', {}, roomView(game) ? `${roomView(game).floor}, ${roomView(game).name}` : placeById(game.place).name),
      h('span', {}, `${whenLabel(game)} ${clockOf(game)}, 여기 있는 유저 ${usersHere(game)}명`));
  }

  function drawSuggest() {
    const place = placeById(game.place);
    const first = game.day === 1 && game.phase === 0 && Object.keys(game.counters.act).length === 0;
    if (!place.suggest || !first) { refs.suggest.replaceChildren(); refs.suggest.className = ''; return; }
    refs.suggest.className = 'suggest';
    fill(refs.suggest,
      h('span', { class: 'muted' }, '무엇을 해도 좋아요. 이런 것부터 해 볼 수 있어요.'),
      h('div', { class: 'row-btns' }, place.suggest.map((sg) =>
        h('button', { class: 'btn', type: 'button', onclick: () => run(sg.go ? { type: 'move', to: sg.go } : { type: 'act', id: sg.act }) }, sg.text))));
  }

  function slotActions() {
    const list = slotsNow(game);
    return Array.from({ length: SLOT_COUNT_UI }, (_, i) => list[i] || null);
  }

  function drawSlots() {
    const focused = document.activeElement?.dataset?.slot;
    refs.slots.replaceChildren(...slotActions().map((s, i) => s
      ? h('button', { class: `sl ${i === 0 ? 'go' : ''} ${s.disabled ? 'none' : ''}`, type: 'button', disabled: !!s.disabled, title: s.why || null, 'data-slot': i, 'data-press': true, 'aria-keyshortcuts': String(i + 1),
        // 누르고 있기: 손가락이 닿은 동안 이어 누른다. 그 밖에는 한 번 누르면 한 번
        onpointerdown: (e) => { if (assist.mode === 'hold' && e.button === 0) { held = i; pressDown(i); } },
        onpointerup: () => releaseHold(i), onpointerleave: () => releaseHold(i), onpointercancel: () => releaseHold(i),
        // 누르고 있기에서 초점을 두고 Enter로 누른 것은 뗀 때를 알 수 없으니 한 번만 한다
        onclick: (e) => { if (assist.mode !== 'hold') return pressDown(i); if (e.detail === 0 && !wins.isOpen()) { assist.stop(); drawAssist(); press(i); } } }, h('span', {}, i + 1), s.label, s.disabled && s.why ? h('small', {}, s.why) : s.sub ? h('small', { class: 'slsub' }, s.sub) : null)
      : h('button', { class: 'sl none empty', type: 'button', disabled: true, 'data-slot': i }, h('span', {}, i + 1), h('b', {}, '비어 있음'))));
    if (focused != null) refs.slots.querySelector(`[data-slot="${focused}"]:not([disabled])`)?.focus();
  }

  // ── 대화방의 한 줄 ──
  function lineNodes(l) {
    if (l.k === 'me') return [h('div', { class: 'msg me' }, l.text)];
    if (l.k === 'user') return [h('span', { class: 'who' }, l.who), h('div', { class: 'msg' }, l.text)];
    if (l.k === 'npc') return [h('span', { class: 'who' }, l.who), h('div', { class: `msg npc ${l.tone === 'mint' ? 'mint' : ''}` }, l.text)];
    // 곳의 모습과 때의 흐름은 누가 한 말이 아니다. 이름표 없이 가운데에 작은 글로 보인다
    if (l.k === 'room') return l.who ? [h('span', { class: 'who' }, l.who), h('div', { class: 'msg room said' }, l.text)] : [h('div', { class: 'msg room' }, l.text)];
    if (l.k === 'intent') return [h('span', { class: 'who' }, '다음 행동'), h('div', { class: 'msg intent' }, h('b', {}, l.next), `. ${l.text}${l.hint ? ' ' + l.hint : ''}`)];
    if (l.k === 'sys' && l.who) return [h('span', { class: 'who' }, l.who), h('div', { class: 'msg sys' }, l.text)];
    if (l.k === 'ding') return [h('span', { class: 'who' }, '시스템'), h('div', { class: 'msg ding' }, h('small', {}, `${DING_LEVELS[l.level]}:`), l.text)];
    return [h('span', { class: 'who' }, '시스템'), h('div', { class: `msg sys ${l.tone || ''}` }, l.text)];
  }

  function appendLines(events) {
    const lines = events.filter((e) => e.type === 'line').map((e) => e.line);
    if (!lines.length) return;
    refs.log.append(...lines.flatMap(lineNodes));
    while (refs.log.childElementCount > LOG_SHOWN * 2) refs.log.firstElementChild.remove();
    refs.log.scrollTop = refs.log.scrollHeight;
  }

  // ── 행동 ──
  // ── 누르기 돕기 (H2-5 ~ H2-8) ──
  const shownFaint = new WeakSet();
  let assist = createAssist(settings.assist);
  let held = -1;
  let dinged = false;
  const whatOf = (sl) => (sl && sl.action ? JSON.stringify(sl.action) : ''); // 같은 칸에 다른 방·다른 물음이 놓이면 멈춘다

  /** 칸을 눌렀다. 돕기가 꺼져 있거나 이어 누를 만한 칸이 아니면 그냥 한 번. */
  function pressDown(i) {
    const sl = slotActions()[i];
    if (!sl || sl.disabled || wins.isOpen()) return;
    if (!assistable(sl, { battle: !!game.battle })) { assist.stop(); drawAssist(); return press(i); }
    if (assist.down(i, whatOf(sl), Date.now()).fire) press(i);
    drawAssist();
  }
  function releaseHold(i) {
    if (held !== i) return;
    held = -1;
    assist.up(i);
    drawAssist();
  }
  function drawAssist() {
    if (!refs.assist) return;
    const sl = assist.running ? slotActions()[assist.slot] : null;
    refs.assist.textContent = sl ? `누르기 돕기: '${sl.label}' ${assist.count}번째. ${assist.mode === 'hold' ? '떼면 멈춘다.' : '다시 누르면 멈춘다.'}` : '';
    refs.slots.querySelectorAll('.sl').forEach((b, k) => b.classList.toggle('auto', assist.running && k === assist.slot));
  }
  function askAssist() {
    wins.open({
      title: '누르기 돕기', notice: true,
      render(body, { close }) {
        add(body, h('p', {}, `스무 번을 이어서 했다. 이어 할까요?`),
          h('div', { class: 'row-btns' },
            h('button', { class: 'btn go', type: 'button', 'data-autofocus': true, onclick: () => { const go = assist.answer(true, Date.now()).fire; const at = assist.slot; close(); if (go) press(at); drawAssist(); } }, '계속'),
            h('button', { class: 'btn', type: 'button', onclick: () => { assist.answer(false, 0); close(); drawAssist(); } }, '중지')));
      },
      onClose: () => { if (assist.asking) assist.answer(false, 0); drawAssist(); refs.slots?.querySelector('button:not([disabled])')?.focus(); },
    });
  }
  setInterval(() => {
    if (!game || !refs.slots || !assist.running) return;
    const r = assist.tick(Date.now(), { what: whatOf(slotActions()[assist.slot]), blocked: (wins.isOpen() && !assist.asking) || !!game.battle, dinged }); // 싸움이 시작되면 멈춘다 (Z63)
    dinged = false;
    if (r.fire) press(assist.slot);
    if (r.ask) askAssist();
    drawAssist();
  }, 200);

  function press(i) {
    const s = slotActions()[i];
    if (!s || s.disabled || wins.isOpen()) return;
    if (s.open === 'bag') return openBag('eat');
    if (s.open === 'choice') return openChoice();
    if (s.open === 'skillpick') return openSkillPick();
    if (s.open === 'craft') return openCraft();
    if (s.open === 'sew') return openSew();
    if (s.open === 'talk') return openTalk();
    if (s.open === 'sculpt') return openSculpt();
    if (s.open === 'auction') return openAuction();
    if (s.open === 'boat') return openBoat();
    if (s.open === 'advance') return openAdvance();
    if (s.open === 'offer') return openOffer();
    if (s.open === 'rumor') return openRumors();
    if (s.open === 'cook') return openCook();
    if (s.open === 'board') return openBoard();
    if (s.open === 'shop') return openShop();
    if (s.open === 'storage') return openStore();
    if (s.confirm) return confirmQuit(s);
    if (s.hammer) {
      const now = Date.now();
      const late = lastHammer > 0 && now - lastHammer > COOL_MS;
      lastHammer = now;
      const ev = run({ type: 'hammer', late });
      if (!game?.craft || game.craft.cold || wins.isOpen()) lastHammer = 0;
      drawForge();
      return ev;
    }
    if (s.action.type === 'reheat') lastHammer = 0;
    const btn = refs.slots.querySelector(`[data-slot="${i}"]`);
    if (btn && !settings.calm) { btn.classList.add('hit'); setTimeout(() => btn.classList.remove('hit'), 90); }
    run(s.action);
    const art = refs.pg.querySelector('.artbox');
    if (art && !settings.calm) { art.classList.remove('shake'); void art.offsetWidth; art.classList.add('shake'); }
  }

  let lastHammer = 0;

  function confirmQuit(sl) {
    wins.open({
      title: '그만둘까요?', render(body, { close }) {
        add(body, h('p', {}, sl.confirm),
          h('div', { class: 'row-btns' },
            h('button', { class: 'btn', type: 'button', 'data-autofocus': true, onclick: close }, '계속 제작'),
            h('button', { class: 'btn go', type: 'button', onclick: () => { close(); lastHammer = 0; run(sl.action); } }, '그만두기')));
      },
    });
  }

  /** 싸움 칸 자리에 만드는 것의 모습을 보인다: 몇 번째인지, 식었는지, 지금대로면 나올 등급. */
  function drawForge() {
    const c = game && craftView(game);
    if (!c) { if (game && !game.battle && !game.sculpt) { refs.fight.replaceChildren(); refs.fight.className = ''; } return; }
    refs.fight.className = 'fight';
    if (c.kind === 'sew') {
      fill(refs.fight,
        h('div', { class: 'grow' },
          h('div', {}, h('b', {}, c.name), ` 땀 ${c.hits} / ${c.total}.`),
          h('div', { class: 'stitches', role: 'img', 'aria-label': `뜬 땀 ${c.hits}, 남은 땀 ${c.total - c.hits}` }, Array.from({ length: c.total }, (_, i) => h('span', { class: i < c.hits ? 'even' : '' }))),
          h('div', { class: 'muted', style: 'font-size:.85rem' }, '끝까지 뜨면 나올 등급: ', oddsText(c.odds))));
      return;
    }
    const art = c.cold ? ['forge-cold', '식어서 잿빛이 된 쇠'] : [`forge-${c.stage}`, ['붉게 단 쇳덩이', '길쭉해진 붉은 쇠', '검의 꼴이 잡힌 붉은 쇠'][c.stage - 1]];
    fill(refs.fight,
      settings.art ? pixel(art[0], art[1], 64, 64) : null,
      h('div', { class: 'grow' },
        h('div', {}, h('b', {}, c.name), ` 망치질 ${c.hits} / ${c.total}. `, c.cold ? h('b', { class: 'warn' }, '쇠가 식었다. 다시 달궈야 한다.') : `식기 전에 친 횟수 ${c.warm}.`),
        c.cold ? null : h('div', { class: 'cool', role: 'img', 'aria-label': `망치질 사이가 ${COOL_MS / 1000}초를 넘으면 쇠가 식는다` }, lastHammer ? h('i', { style: `animation-duration:${COOL_MS}ms` }) : h('i', { class: 'full' })),
        h('div', { class: 'muted', style: 'font-size:.85rem' }, `망치질 사이가 ${COOL_MS / 1000}초를 넘으면 식는다. 지금대로 끝까지 치면: `, oddsText(c.odds))));
  }
  function drawCarve() {
    const v = game && sculptView(game);
    if (!v) return;
    refs.fight.className = 'fight';
    const say = ['아직 나무토막이다', '모서리가 둥글어졌다', '머리와 몸통이 갈라져 보인다', '귀와 다리가 드러났다'][v.stage];
    fill(refs.fight,
      settings.art && v.art ? pixel(`${v.art}-${v.stage}`, `${v.name}상을 깎는 나무토막. ${say}`, 64, 64) : null,
      h('div', { class: 'grow' },
        h('div', {}, h('b', {}, `${v.name}상`), ` 칼질 ${v.cuts} / ${v.total}. ${say}.`),
        h('div', { class: 'muted', style: 'font-size:.85rem' }, '어떤 작품이 될지는 마지막 칼질에서 갈린다. 그 전에는 알 수 없다.')));
  }
  const oddsText = (odds) => odds.map((p, i) => `${GRADES[i]} ${p >= 10 ? Math.round(p) : p.toFixed(1)}%`).join(', ');

  function run(action, fromWindow = false) {
    if (!game) return;
    // 창이 떠 있으면 뒤 화면의 행동은 받지 않는다. 창 안에서 하는 일(점수 나누기, 가방, 지도, 고르기)만 예외다.
    if (wins.isOpen() && action.type !== 'spend' && !fromWindow) return;
    let events;
    try { events = dispatch(game, action, { chatter: settings.chatter }); }
    catch (e) { notice('할 수 없습니다', e.message); return null; } // 규칙이 거절한 것은 오류가 아니다
    appendLines(events);
    const moved = events.some((e) => e.type === 'move' || e.type === 'phase');
    if (events.some((e) => e.type === 'move' || e.type === 'room')) closeDrawers();
    if (moved || events.some((e) => e.type === 'statue')) drawStrip();
    drawNav(); drawSlots(); drawHeader(); drawBody(); drawFight(); drawForge(); drawCarve(); drawSuggest(); drawBook();
    const dings = events.filter((e) => e.type === 'ding').map((e) => e.ding).filter((d) => !d.silent && !d.voice);
    if (dings.length) playDing(Math.max(...dings.map((d) => d.level)), settings.sound);
    if (dings.length && refs.sr) refs.sr.textContent = dings.map((d) => `${DING_LEVELS[d.level]}: 띠링! ${d.title}`).join('. ');
    if (dings.some((d) => d.level >= settings.dingWin || d.kind) || events.some((e) => e.type === 'fall' || e.type === 'choice')) dinged = true;
    const fell = events.find((e) => e.type === 'fall');
    if (fell) openFall(fell.info);
    for (const d of dings) {
      if (d.kind === 'levelup') openLevelUp(d);
      else if (d.kind === 'legend' || d.kind === 'hiddenquest' || d.kind === 'main' || d.kind === 'hiddenjob' || d.kind === 'masterwork' || d.kind === 'first' || d.kind === 'ending') openDing(d, true);
      else if (d.level >= settings.dingWin) openDing(d);
    }
    if (events.some((e) => e.type === 'choice') && game.choice && !fromWindow) openChoice();
    for (const e of events) if (e.type === 'evolve' && pendingEvolves(game).includes(e.skill)) openEvolve(e.skill);
    // 레벨 5가 되면 직업 고르기 창이 한 번 뜬다. 닫아도 상태 탭에서 다시 열 수 있다 (N4-4)
    if (canChooseJob(game) && !game.jobAsked && !game.battle && !game.choice && !game.craft && !jobWinOpen) openJobs();
    // 되감는 저장이 없으려면 한 일마다 남아야 한다. 싸우다 창을 새로 열어도 무를 수 없다.
    autosave();
    if (!game) return null;
    keepFocus();
    return events;
  }

  /** 다시 그리다가 초점이 사라졌으면 첫 단축 칸으로 돌려준다. 키보드만 쓰는 사람이 길을 잃지 않게. */
  function keepFocus() {
    if (wins.isOpen() || !refs.slots) return;
    const a = document.activeElement;
    if (!a || a === document.body || !document.contains(a)) refs.slots.querySelector('button:not([disabled])')?.focus();
  }

  let saveRev = 0;
  let saveFailed = false;

  function autosave() {
    if (!game) return;
    try {
      saveRev = saveTo(storage, slot, game, Date.now(), saveRev);
      saveFailed = false;
      cloud.queue(slot);
    } catch (e) {
      if (e instanceof SaveConflict) {
        // 다른 창이 이 칸을 먼저 고쳤다. 옛 상태로 덮어쓰면 되감기가 되므로 여기서 멈춘다.
        game = null;
        showTitle();
        notice('다른 창에서 이어 하고 있습니다', '이 저장 칸을 다른 창에서 먼저 고쳤습니다. 이 창의 것은 저장하지 않았습니다. 처음 화면에서 다시 이어 하세요.');
        return;
      }
      fail(e, 'autosave');
      if (!saveFailed) {
        saveFailed = true;
        notice('저장하지 못했습니다', '이 기기의 저장 공간에 쓸 수 없습니다. "저장과 설정"에서 파일로 내보내 두세요. 까닭: ' + e.message);
      }
    }
  }

  // ── 띠링 창 (D3) ──
  function openDing(d, grand = false) {
    if (d.faint && !shownFaint.has(d)) {
      // 종의 금이 벌어진 동안은 띠링이 한 박자 늦게 온다. 움직임 줄이기를 켜도 늦기만 하고 흐려지지는 않는다
      shownFaint.add(d);
      setTimeout(() => { if (game) openDing(d, grand); }, 1400);
      return;
    }
    wins.open({
      title: d.big === d.title ? '띠링!' : `띠링! ${shortTitle(d)}`, honey: true, over: wins.isOpen(), notice: true, side: d.faint ? `${DING_LEVELS[d.level]} (늦게 왔다)` : DING_LEVELS[d.level], size: `${grand ? 'mid grand' : ''} ${d.faint && !settings.calm ? 'faint' : ''}`,
      render(body, { close }) {
        add(body,
          h('span', { class: 'big' }, d.big),
          grand ? h('span', { class: 'serif', style: 'font-size:1.15rem' }, d.title) : null,
          d.body ? h('span', {}, d.body) : null,
          d.reason ? h('span', { class: 'muted', style: 'font-size:.88rem' }, `얻은 까닭: ${d.reason}`) : null,
          h('button', { class: 'btn go', type: 'button', 'data-autofocus': true, style: 'min-height:3rem;font-size:1rem', onclick: close }, '확인'));
      },
      onClose: () => refs.slots?.querySelector('button:not([disabled])')?.focus(),
    });
  }
  // ── 레벨업 창 (E11, E12) ──
  function openLevelUp(d) {
    wins.open({
      title: '띠링! 레벨업', honey: true, over: wins.isOpen(), notice: true, side: DING_LEVELS[d.level],
      render(body, { close, rerender }) {
        add(body,
          h('span', { class: 'big' }, d.big),
          h('span', {}, '최대 생명력 +10.'),
          h('span', { class: 'h' }, `스탯 점수 (남은 점수 ${game.unspent})`),
          Object.keys(STAT_NAMES).map((key) => h('div', { class: 'statline' },
            h('span', {}, h('b', {}, STAT_NAMES[key]), ` ${game.stats[key]} `, h('span', { class: 'muted', style: 'font-size:.82rem' }, STAT_USES[key])),
            h('button', { class: 'pm', type: 'button', 'aria-label': `${STAT_NAMES[key]} 올리기`, disabled: game.unspent <= 0, onclick: () => { run({ type: 'spend', stat: key }); if (game) rerender(); } }, '+'))),
          knowsHidden() ? h('p', { class: 'muted', style: 'font-size:.85rem' }, '히든 스탯은 여기서 올릴 수 없다. 행동으로만 오른다.') : null,
          h('button', { class: 'btn go', type: 'button', 'data-autofocus': true, style: 'min-height:3rem;font-size:1rem', onclick: close }, game.unspent > 0 ? '나중에' : '확인'));
      },
      onClose: () => { drawBook(); refs.slots?.querySelector('button:not([disabled])')?.focus(); },
    });
  }

  // ── 쓰러짐 창 (E29~E32) ──
  function openFall(info) {
    wins.open({
      title: '쓰러졌다', dark: true, over: wins.isOpen(), notice: true,
      render(body, { close }) {
        const lost = [info.silver ? `은화 ${info.silver}` : null, ...info.items.map((x) => `${x.name} ${x.n}`)].filter(Boolean);
        const sh = info.shadow;
        if (info.fate === 'rebirth') {
          add(body,
            h('span', { class: 'big' }, '숨이 끊어졌다'),
            info.starved ? h('div', { class: 'rowx' }, h('span', {}, '까닭'), h('span', {}, '굶주림')) : null,
            h('p', { class: 'serif', style: 'font-size:1.05rem;line-height:1.8' }, '이번에는 신전에서 눈을 뜨지 못했다. 몸은 흙으로 돌아간다. 종은 네가 끝까지 해낸 것들을 기억한다. 그것만 안고 다시 태어난다.'),
            rebirthRows(),
            h('button', { class: 'btn go', type: 'button', 'data-autofocus': true, style: 'min-height:3rem;font-size:1rem', onclick: () => { const carry = rebirthCarry(game); wins.closeAll(); showCreate(slot, carry); } }, '다시 태어난다'));
          return;
        }
        add(body,
          h('span', { class: 'big' }, '신전에서 눈을 떴다'),
          info.starved ? h('div', { class: 'rowx' }, h('span', {}, '까닭'), h('span', {}, '굶주림')) : null,
          h('div', { class: 'rowx' }, h('span', {}, '두고 온 것'), h('span', {}, lost.length ? lost.join(', ') : '없음')),
          info.lostOld ? h('p', { class: 'warn' }, '먼저 두고 온 것은 이제 찾을 수 없다.') : null,
          info.keptOld ? h('p', {}, `먼저 ${PLACES[info.keptOld].name}에 두고 온 것은 아직 그 자리에 있다.`) : null,
          info.relicPlace ? h('p', {}, `두고 온 것은 ${PLACES[info.relicPlace].name}의 그 자리에 하루 동안 남는다. 찾으러 가면 되찾는다.`) : null,
          sh ? h('div', { class: 'rowx' }, h('span', {}, '죽음의 그림자'), h('span', {}, sh.from === sh.to ? `${sh.to}겹 (가장 짙다, 공격·방어 −${sh.cut}%)` : `${sh.from}겹 → ${sh.to}겹 (공격·방어 −${sh.cut}%)`)) : null,
          h('div', { class: 'rowx' }, h('span', {}, '쓰러진 횟수'), h('span', {}, `${game.falls}번째`)),
          info.tough ? [
            h('div', { class: 'rowx toughrow' }, h('span', {}, '다시 일어선 몸'), h('b', {}, Object.entries(info.tough.gained).map(([k, v]) => `${STAT_NAMES[k]} +${v.toFixed(2)}`).join(', '))),
            h('div', { class: 'rowx' }, h('span', {}, '쌓인 것'), h('span', {}, Object.entries(info.tough.acc).map(([k, v]) => `${STAT_NAMES[k]} ${v.toFixed(2)}`).join(' · '))),
            info.tough.raised.length ? h('p', {}, `쌓인 것이 차서 ${info.tough.raised.map((k) => `${STAT_NAMES[k]} +1`).join(', ')}.`) : null] : null,
          h('p', { class: 'muted', style: 'font-size:.88rem' }, '그림자는 신전에서 축복을 받거나 기도를 해서 걷어 낸다.'),
          h('button', { class: 'btn go', type: 'button', 'data-autofocus': true, style: 'min-height:3rem;font-size:1rem', onclick: close }, '일어나기'));
      },
      onClose: () => { if (game?.flags?.mustRebirth) return; refs.slots?.querySelector('button:not([disabled])')?.focus(); },
      noClose: info.fate === 'rebirth',
    });
  }

  // ── 환생: 가지고 가는 것과 내려놓는 것 (Z32) ──
  function rebirthRows() {
    const carry = rebirthCarry(game);
    const loss = rebirthLoss(game);
    {
      {
        const found = Object.entries(carry.hidden).map(([id, x]) => `${hiddenById(id)?.name} ${x.value}`);
        const raised = Object.entries(carry.toughGained).filter(([, v]) => v > 0).map(([k, v]) => `${STAT_NAMES[k]} +${v}`);
        return [
          h('span', { class: 'h' }, '가지고 가는 것'),
          found.length ? h('div', { class: 'rowx' }, h('span', {}, '히든 스탯'), h('span', {}, `${found.join(', ')} (지금 값 그대로)`)) : null,
          h('div', { class: 'rowx' }, h('span', {}, '다시 일어선 몸으로 오른 스탯'), h('span', {}, raised.length ? raised.join(', ') : '없음')),
          h('div', { class: 'rowx' }, h('span', {}, '칭호'), h('span', {}, carry.titles.length ? `${carry.titles.length}개 모두` : '없음')),
          h('div', { class: 'rowx' }, h('span', {}, '도감'), h('span', {}, '본 괴물·물건·곳·짐승·요리')),
          Object.keys(carry.skills || {}).length ? h('div', { class: 'rowx' }, h('span', {}, '숙련도'), h('span', {}, `${Object.keys(carry.skills).length}가지, 쌓은 것의 5%`)) : null,
          Object.keys(carry.bank || {}).length ? h('div', { class: 'rowx' }, h('span', {}, '보관함'), h('span', {}, Object.entries(carry.bank).map(([t, b]) => `${t} 은화 ${b.silver}${b.items.length ? `, 물건 ${b.items.length}가지` : ''}`).join(' / '))) : null,
          h('div', { class: 'rowx' }, h('span', {}, '환생한 횟수'), h('span', {}, `${carry.lives}번째 삶`)),
          h('span', { class: 'h' }, '내려놓는 것'),
          h('div', { class: 'rowx' }, h('span', {}, '레벨과 숙련도'), h('span', {}, `레벨 ${loss.level}, 숙련도 ${loss.skills}가지`)),
          h('div', { class: 'rowx' }, h('span', {}, '직업'), h('span', {}, loss.job || '무직')),
          h('div', { class: 'rowx' }, h('span', {}, '가진 것'), h('span', {}, `가방의 물건, 장비, 은화 ${loss.silver} (보관함은 남는다)`)),
          h('div', { class: 'rowx' }, h('span', {}, '사람'), h('span', {}, loss.guild ? '사람들과의 사이, 길드' : '사람들과의 사이')),
          h('div', { class: 'rowx' }, h('span', {}, '메인 이야기'), h('span', {}, `${loss.chapter}장까지의 진행`)),
          h('div', { class: 'rowx' }, h('span', {}, '죽음의 그림자'), h('span', {}, '걷힌다'))];
      }
    }
  }

  // ── 기척·사건 창 (E3) ──
  function openChoice() {
    wins.open({
      title: choiceView(game)?.title || '어떻게 할까', side: choiceView(game)?.side || '',
      render(body, { close, rerender }) {
        const v = choiceView(game);
        if (!v) { close(); return; }
        add(body,
          h('p', { class: 'serif', style: 'font-size:1.1rem;line-height:1.8' }, v.text),
          v.feel ? h('div', {}, `${v.feel.label}: `, h('span', { class: `feel f${v.feel.id}` }, v.feel.text)) : null,
          h('div', { class: 'col-btns' }, v.options.map((o, i) =>
            h('button', { class: `btn ${o.go ? 'go' : ''}`, type: 'button', disabled: !!o.disabled, 'data-autofocus': i === 0 || null, 'data-press': true,
              onclick: () => { const ev = run({ type: 'choose', id: o.id }, true); if (!ev) return; if (!game.choice) close(); else if (choiceView(game)?.title !== v.title || choiceView(game)?.side !== v.side) { close(); openChoice(); } else rerender(); } },
              o.label, o.sub ? h('small', { class: 'sub' }, o.sub) : null, o.disabled && o.why ? h('small', { class: 'muted' }, ` (${o.why})`) : null))),
          v.note ? h('p', { class: 'muted', style: 'font-size:.85rem' }, v.note) : null);
      },
      onClose: () => { drawSlots(); refs.slots?.querySelector('button:not([disabled])')?.focus(); },
    });
  }

  // ── 제작 창 (N1-1 ~ N1-3) ──
  function openCraft() {
    wins.open({
      title: '만들기', size: 'wide', side: '대장간의 화덕',
      render(body, { close }) {
        const list = recipeList(game);
        add(body,
          h('p', { class: 'muted', style: 'font-size:.9rem' }, `손으로 만든다. 한 자루에 망치질 열두 번. 망치질 사이가 ${COOL_MS / 1000}초를 넘으면 쇠가 식고, 식기 전에 많이 칠수록 높은 등급이 잘 뜬다. 그만두면 재료는 돌아오지 않는다.`),
          list.map((r) => h('div', { class: 'recipe' },
            h('div', { class: 'grow' },
              h('b', { class: 'serif', style: 'font-size:1.15rem' }, r.name), h('br'), h('span', {}, r.say),
              h('div', {}, '재료: ', r.needs.map((n, i) => [i ? ', ' : '', h('span', { class: n.have >= n.n ? '' : 'warn' }, `${n.name} ${n.have} / ${n.n}`)])),
              h('table', { class: 'odds' },
                h('caption', {}, '등급별 확률 (두드리기 전에 보인다)'),
                h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, ''), GRADES.map((g) => h('th', { scope: 'col' }, g)))),
                h('tbody', {},
                  h('tr', {}, h('th', { scope: 'row' }, '식히지 않고 다 치면'), r.best.map((p) => h('td', {}, `${p >= 10 ? Math.round(p) : p.toFixed(1)}%`))),
                  h('tr', {}, h('th', { scope: 'row' }, '칠 때마다 식히면'), r.worst.map((p) => h('td', {}, `${p >= 10 ? Math.round(p) : p.toFixed(1)}%`)))))),
            h('button', { class: 'btn go', type: 'button', disabled: !r.can, onclick: () => { close(); lastHammer = 0; run({ type: 'craft', recipe: r.id }); } }, r.can ? '제작' : '재료가 모자란다'))),
          h('p', { class: 'muted', style: 'font-size:.85rem' }, '확률을 움직이는 것: 만드는 숙련도, 재료의 품질, 식기 전에 친 횟수. 그리고 아직 모르는 무언가.'));
      },
      onClose: () => refs.slots?.querySelector('button:not([disabled])')?.focus(),
    });
  }

  // ── 바느질 창 (Z71) ──
  function openSew() {
    wins.open({
      title: '바느질', size: 'wide', side: '가죽 설계도',
      render(body, { close }) {
        const list = recipeList(game, SEW_ORDER);
        const pct = (p) => `${p >= 10 ? Math.round(p) : p.toFixed(1)}%`;
        add(body,
          h('p', { class: 'muted', style: 'font-size:.9rem' }, '멧돼지 가죽을 꿰매 짓는다. 한 번 누르면 한 땀. 가죽은 식지 않으니 서두를 것 없다. 그만두면 재료는 돌아오지 않는다.'),
          list.map((r) => h('div', { class: 'recipe' },
            h('div', { class: 'grow' },
              h('b', { class: 'serif', style: 'font-size:1.15rem' }, r.name), ` · 땀 ${r.hits}번`, h('br'), h('span', {}, r.say),
              h('div', {}, '재료: ', r.needs.map((n, i) => [i ? ', ' : '', h('span', { class: n.have >= n.n ? '' : 'warn' }, `${n.name} ${n.have} / ${n.n}`)])),
              h('table', { class: 'odds' },
                h('caption', {}, '등급별 확률 (꿰매기 전에 보인다)'),
                h('thead', {}, h('tr', {}, GRADES.map((g) => h('th', { scope: 'col' }, g)))),
                h('tbody', {}, h('tr', {}, r.best.map((p) => h('td', {}, pct(p))))))),
            h('button', { class: 'btn go', type: 'button', disabled: !r.can, onclick: () => { close(); run({ type: 'craft', recipe: r.id }); } }, r.can ? '제작' : '재료가 모자란다'))),
          h('p', { class: 'muted', style: 'font-size:.85rem' }, '확률을 움직이는 것: 가죽 숙련도, 가죽의 품질. 그리고 아직 모르는 무언가.'));
      },
      onClose: () => refs.slots?.querySelector('button:not([disabled])')?.focus(),
    });
  }

  // ── 스킬 진화 창 (N4-1, N4-2) ──
  function openEvolve(skillId) {
    wins.open({
      title: '갈림길', honey: true, size: 'mid', side: evolveView(game, skillId).name,
      render(body, { close }) {
        const v = evolveView(game, skillId);
        add(body,
          h('p', {}, v.chosen ? `${v.name}에서 고른 길` : `${iGa(v.name)} 중급에 닿았다. 갈래 둘 가운데 하나를 고른다. 얻는 것이 있으면 잃는 것도 있다.`),
          h('div', { class: 'cols' }, v.branches.map((b) => h('div', { class: `detail ${v.chosen === b.id ? 'picked' : ''}` },
            h('b', { class: 'serif', style: 'font-size:1.2rem' }, b.name),
            h('div', { class: 'rowx' }, h('span', {}, '얻는 것'), h('span', {}, b.gain)),
            h('div', { class: 'rowx' }, h('span', {}, '잃는 것'), h('span', {}, b.lose)),
            v.chosen ? (v.chosen === b.id ? h('span', { class: 'tagx' }, '고른 길') : null)
              : h('button', { class: 'btn go', type: 'button', disabled: !v.can, onclick: () => { if (run({ type: 'evolve', skill: skillId, branch: b.id }, true)) close(); } }, '선택')))),
          v.chosen ? h('p', { class: 'muted', style: 'font-size:.85rem' }, "되돌리려면 귀한 물건 '잊는 물'이 있어야 한다.") : h('button', { class: 'btn', type: 'button', 'data-autofocus': true, onclick: close }, '나중에'),
          v.chosen && game.bag.some((x) => x.id === 'forgetwater') ? h('button', { class: 'btn', type: 'button', onclick: () => { if (run({ type: 'forget', skill: skillId }, true)) close(); } }, '잊는 물을 마시고 다시 고른다') : null);
      },
      onClose: () => { drawBook(); refs.slots?.querySelector('button:not([disabled])')?.focus(); },
    });
  }

  // ── 상점 창 (E24, E25, E28) ──
  /** 사고팔기 전에 한 번 묻는다 (사용자 피드백: 팔다가 잘못 사는 일). 초점은 "그만둔다"에 간다 */
  function confirmTrade(text, yes, onYes) {
    wins.open({
      title: '확인', over: true,
      render(body, { close }) {
        add(body, h('p', {}, text),
          h('div', { class: 'row-btns' },
            h('button', { class: 'btn', type: 'button', 'data-autofocus': true, onclick: close }, '그만둔다'),
            h('button', { class: 'btn go', type: 'button', onclick: () => { onYes(); close(); } }, yes))); // 먼저 하고 닫는다: 닫히면 가려졌던 상점이 새 값으로 다시 그려진다
      },
    });
  }

  function openShop() {
    wins.open({
      title: '상점', size: 'wide', side: shopView(game)?.keeper || '',
      render(body, { rerender }) {
        const v = shopView(game);
        const act = (action) => { if (run(action, true)) rerender(); };
        const ask = (text, yes, action) => confirmTrade(text, yes, () => act(action));
        add(body,
          h('p', { class: 'serif' }, `"${v.hello}"`),
          v.daily ? h('p', { class: 'muted', style: 'font-size:.88rem' }, '이 시장의 값은 날마다 바뀐다.') : null,
          h('div', { class: 'rowx' }, h('span', {}, '보유 은화'), h('b', {}, game.silver)),
          h('div', { class: 'cols' },
            h('div', { style: 'display:flex;flex-direction:column;gap:4px;min-width:0' },
              h('span', { class: 'h', style: 'margin-top:0' }, '판매 목록'),
              v.goods.map((g) => h('div', { class: 'traderow' },
                h('span', { class: 'grow' }, h('b', {}, g.name), h('br'), h('small', { class: 'muted' }, g.desc)),
                h('span', {}, g.now < g.base ? [h('s', { 'aria-label': `원래 값 ${g.base}` }, g.base), ' '] : null, h('b', {}, `은화 ${g.now}`), g.now < g.base ? h('small', { class: 'muted' }, ` (${g.why})`) : null),
                h('button', { class: 'btn sm', type: 'button', 'aria-label': `${g.name} 하나 사기`, disabled: game.silver < g.now, onclick: () => ask(`${g.name} 하나를 은화 ${g.now}에 살까요? (가진 은화 ${game.silver})`, '산다', { type: 'buy', id: g.id }) }, '구매')))),
            h('div', { style: 'display:flex;flex-direction:column;gap:4px;min-width:0' },
              h('span', { class: 'h', style: 'margin-top:0' }, '내 가방 (팔면 값의 40%)'),
              v.mine.length ? h('div', { class: 'items' }, v.mine.map((m) => h('div', { class: 'traderow' },
                icon(m.item), h('span', { class: 'grow' }, h('b', {}, m.name), h('small', {}, ` ${m.grade}${m.n > 1 ? `, ${m.n}개` : ''}`)),
                h('span', {}, `하나에 ${m.each}`),
                h('button', { class: 'btn sm', type: 'button', 'aria-label': `${m.name} ${m.grade} 하나 팔기`, onclick: () => ask(`${m.name} 하나를 은화 ${m.each}에 팔까요?`, '판다', { type: 'sell', index: game.bag.indexOf(m.item), n: 1 }) }, '판매'),
                m.n > 1 ? h('button', { class: 'btn sm', type: 'button', 'aria-label': `${m.name} ${m.grade} ${m.n}개 모두 팔기`, onclick: () => ask(`${m.name} ${m.n}개를 모두 은화 ${m.each * m.n}에 팔까요?`, '모두 판다', { type: 'sell', index: game.bag.indexOf(m.item), n: m.item.n }) }, '모두') : null)))
                : h('p', { class: 'muted' }, '팔 것이 없다.'))));
      },
      onClose: () => refs.slots?.querySelector('button:not([disabled])')?.focus(),
    });
  }

  // ── 보관함 창 (H1-5, H1-6) ──
  function openStore() {
    wins.open({
      title: '보관함', size: 'wide', side: '주점',
      render(body, { rerender }) {
        const v = storeView(game);
        const act = (action) => { if (run(action, true)) rerender(); };
        const b = bodyView(game);
        const row = (item, n, label, one, all) => h('div', { class: 'traderow' },
          icon(item), h('span', { class: 'grow' }, h('b', {}, gearName(item)), h('small', {}, ` ${gradeName(item.grade)}${n > 1 ? `, ${n}개` : ''}`)),
          h('button', { class: 'btn sm', type: 'button', 'aria-label': `${gearName(item)} ${gradeName(item.grade)} 하나 ${label}`, onclick: one }, label),
          n > 1 ? h('button', { class: 'btn sm', type: 'button', 'aria-label': `${gearName(item)} ${gradeName(item.grade)} ${n}개 모두 ${label}`, onclick: all }, '모두') : null);
        add(body,
          h('p', { class: 'muted', style: 'font-size:.9rem' }, `맡긴 은화에는 날마다 1% 이자가 붙는다${v.interest ? ` (내일 +${v.interest})` : ''}. 물건을 맡긴 날만 삯 은화 ${v.fee}. 쓰러져도, 다시 태어나도 맡긴 것은 잃지 않는다. 보관함은 마을마다 따로다.`),
          v.debt ? h('p', { class: 'warn', role: 'alert' }, `밀린 보관 삯이 은화 ${v.debt} 있다. 찾을 때 먼저 치른다.`) : null,
          h('div', { class: 'cols' },
            h('div', { style: 'display:flex;flex-direction:column;gap:4px;min-width:0' },
              h('span', { class: 'h', style: 'margin-top:0' }, `가방 (무게 ${b.weight} / ${b.carry})`),
              game.bag.length ? h('div', { class: 'items' }, game.bag.map((item) => row(item, item.n, '맡기기',
                () => act({ type: 'deposit', index: game.bag.indexOf(item), n: 1 }), () => act({ type: 'deposit', index: game.bag.indexOf(item), n: item.n })))) : h('p', { class: 'muted' }, '가방이 비었다.'),
              h('div', { class: 'traderow' }, h('span', { class: 'grow' }, '가진 은화 ', h('b', {}, game.silver)),
                h('button', { class: 'btn sm', type: 'button', disabled: game.silver < 10, onclick: () => act({ type: 'deposit', silver: 10 }) }, '10개 맡기기'),
                h('button', { class: 'btn sm', type: 'button', disabled: game.silver < 1, onclick: () => act({ type: 'deposit', silver: game.silver }) }, '모두 맡기기'))),
            h('div', { style: 'display:flex;flex-direction:column;gap:4px;min-width:0' },
              h('span', { class: 'h', style: 'margin-top:0' }, `맡긴 것 (무게 ${v.weight} / ${v.cap})`),
              v.items.length ? h('div', { class: 'items' }, v.items.map((x) => row(x.item, x.n, '찾기',
                () => act({ type: 'withdraw', index: storeView(game).items.findIndex((y) => y.item === x.item), n: 1 }), () => act({ type: 'withdraw', index: storeView(game).items.findIndex((y) => y.item === x.item), n: x.item.n })))) : h('p', { class: 'muted' }, '맡긴 것이 없다.'),
              h('div', { class: 'traderow' }, h('span', { class: 'grow' }, '맡긴 은화 ', h('b', {}, v.silver)),
                h('button', { class: 'btn sm', type: 'button', disabled: v.silver < 10, onclick: () => act({ type: 'withdraw', silver: 10 }) }, '10개 찾기'),
                h('button', { class: 'btn sm', type: 'button', disabled: v.silver < 1, onclick: () => act({ type: 'withdraw', silver: v.silver }) }, '모두 찾기')))));
      },
      onClose: () => refs.slots?.querySelector('button:not([disabled])')?.focus(),
    });
  }

  // ── 세계 지도 (N7) ──
  function openMap() {
    wins.open({
      title: '세계 지도', size: 'mid',
      render(body, { close }) {
        const rows = mapView(game);
        const over = bodyView(game).over;
        add(body,
          h('p', { class: 'muted', style: 'font-size:.9rem' }, `길을 나서면 반나절이 걸린다.${over ? ' 지금은 짐이 무거워 더 걸린다.' : ''} 밤에는 마을 밖의 위험도가 한 단계 오른다.`),
          rows.map((r) => r.locked ? h('div', { class: 'maprow unk' }, h('div', { class: 'grow' }, h('b', {}, r.name), h('span', { class: 'tagx' }, '이름만 아는 곳'), h('br'), h('span', { class: 'muted', style: 'font-size:.88rem' }, r.lockSay))) : h('div', { class: `maprow ${r.here ? 'here' : ''}` },
            settings.art ? pixel(isNight(game) ? r.strip.night : r.strip.day, r.alt, 144, 36) : null,
            h('div', { class: 'grow' },
              h('b', {}, r.name), r.here ? h('span', { class: 'tagx' }, '지금 여기') : null, r.relic ? h('span', { class: 'tagx' }, '두고 온 것이 있다') : null, h('br'),
              h('span', { class: 'muted', style: 'font-size:.88rem' }, r.wild ? `위험도 ${r.danger}, 권장 레벨 ${r.levels}` : `마을. ${PLACES[r.id].name}${ro(PLACES[r.id].name).slice(PLACES[r.id].name.length)} 들어간다`),
              r.here ? null : h('span', { class: 'muted', style: 'font-size:.88rem' }, `. 가는 길 습격 ${r.ambush}%`)),
            r.here ? null : h('button', { class: 'btn', type: 'button', onclick: () => { close(); run({ type: 'travel', to: r.id }); } }, '이동'))),
          h('div', { class: 'maprow unk' }, h('div', { class: 'grow' }, h('b', {}, '???'), h('br'), h('span', { class: 'muted', style: 'font-size:.88rem' }, '아직 길을 모른다'))));
      },
    });
  }

  // ── 가방 (G1-4 ~ G1-7) ──
  let bagTab = 'all';
  let bagSort = 'new';
  const SORTS = [['new', '최신순'], ['grade', '등급'], ['weight', '무게'], ['name', '이름']];
  const gradeCls = (item) => `g${item.grade || 0}`;
  const icon = (item, size = 32) => (settings.art ? h('span', { class: `ico ${gradeCls(item)}` }, pixel(iconOf(item), `${gearName(item)} 그림`, size, size)) : null);
  const durText = (item) => (item.dur == null ? '' : `내구도 ${item.dur} / ${maxDur(item)}${item.dur === 0 ? ' (못 씀)' : item.dur < 10 ? ' (곧 못 씀)' : ''}`);

  /** 의뢰의 바로가기 (Z67) */
  const goBtns = (j) => (j.go?.length ? h('div', { class: 'row-btns' }, j.go.map((g) => h('button', { class: 'btn sm', type: 'button', disabled: !!(game.battle || game.choice) || game.place === g.id, 'aria-label': `${g.name}(으)로 바로가기`, onclick: () => { wins.closeAll(); run({ type: 'travel', to: g.id }); } }, j.go.length > 1 ? `바로가기: ${g.name}` : game.place === g.id ? '여기 있다' : '바로가기'))) : null);

  function openBag(startTab) {
    if (startTab) bagTab = startTab;
    let picked = null; // 고른 물건 (가방 속 그 물건 자체)
    wins.open({
      title: '가방', size: 'wide', sheet: true,
      render(body, { close, rerender }) {
        const b = bodyView(game);
        const counts = tabCounts(game);
        const list = bagView(game, bagTab, bagSort);
        if (picked && !game.bag.includes(picked)) picked = null;
        const fighting = !!game.battle;
        const left = h('div', { style: 'display:flex;flex-direction:column;gap:6px;min-width:0' },
          h('div', { class: 'row-btns', role: 'group', 'aria-label': '갈래' }, BAG_TABS.map((t) =>
            h('button', { class: `btn sm ${bagTab === t.id ? 'on' : ''}`, type: 'button', 'aria-pressed': String(bagTab === t.id), 'data-set': `tab:${t.id}`, onclick: () => { bagTab = t.id; rerender(); } }, `${t.name} ${counts[t.id]}`))),
          h('div', { class: 'row-btns', role: 'group', 'aria-label': '늘어놓기' }, SORTS.map(([id, name]) =>
            h('button', { class: `btn sm ${bagSort === id ? 'on' : ''}`, type: 'button', 'aria-pressed': String(bagSort === id), 'data-set': `sort:${id}`, onclick: () => { bagSort = id; rerender(); } }, name))),
          // 착용한 것 (Z68): 장비·모두 갈래의 맨 위에 "착용"을 붙여 보인다. 누르면 장비창
          ['gear', 'all'].includes(bagTab) ? EQUIP_SLOTS.filter((sl) => game.equip[sl.id]).map((sl) => {
            const item = game.equip[sl.id];
            return h('button', { class: 'it worn', type: 'button', 'aria-label': `${gearName(item)}, ${gradeName(item.grade)}, ${sl.name}에 착용. 장비창 열기`, onclick: () => { close(); openGear(); } },
              icon(item), h('span', { class: 'grow' }, h('b', {}, gearName(item)), h('small', {}, ` ${gradeName(item.grade)}`)), h('span', { class: 'tagx worntag' }, `착용 · ${sl.name}`), h('small', { class: 'muted' }, `무게 ${itemWeight(item)}`));
          }) : null,
          h('div', { class: 'items', role: 'group', 'aria-label': '물건' }, list.length ? list.map(({ item, def }) => {
            const row = h('button', { class: `it ${picked === item ? 'on' : ''}`, type: 'button', 'aria-pressed': String(picked === item), 'aria-label': `${def.name}, ${gradeName(item.grade)}${item.n > 1 ? `, ${item.n}개` : ''}`,
              onclick: () => { picked = item; rerender(); } },
              icon(item), h('span', { class: 'grow' }, h('b', {}, gearName(item)), h('small', {}, ` ${gradeName(item.grade)}`)), h('span', {}, item.n > 1 ? `${item.n}개` : ''), h('small', { class: 'muted' }, `무게 ${itemWeight(item)}`));
            // 먹을 것은 줄에서 바로 먹는다 (휴대폰 시안 A). 판을 닫지 않고 연달아 먹을 수 있다
            if (!def.eat || def.throw) return row;
            return h('div', { class: 'itrow' }, row, h('button', { class: 'btn sm go eatnow', type: 'button', 'aria-label': `${def.name} 먹기`, onclick: () => { const ev = run({ type: 'use', index: game.bag.indexOf(item) }, true); if (!ev) return; if (game.battle && ev.some((e) => e.type === 'battle' && e.phase !== 'start')) close(); else rerender(); } }, def.eat.full ? '먹기' : def.kind === 'material' ? '쓰기' : '마시기'));
          })
            : h('p', { class: 'muted' }, '이 갈래에는 아무것도 없다.')),
          h('div', { class: `rowx ${b.over ? 'warn' : ''}` }, h('span', {}, '가방 무게'), h('b', {}, `${b.weight} / ${b.carry}`)),
          b.over ? h('p', { class: 'warn', role: 'alert' }, '무게 한도를 넘겼다. 걸음이 더뎌지고 도망치기 어렵다.') : null);
        add(body, h('div', { class: 'cols' }, left, detail(picked, { rerender, close, fighting })));
      },
      onClose: () => refs.slots?.querySelector('button:not([disabled])')?.focus(),
    });
  }

  function detail(item, { rerender, close, fighting }) {
    if (!item) return h('div', { class: 'detail' }, h('p', { class: 'muted' }, fighting ? '싸우는 중이다. 먹을 것과 약을 쓰거나 무기를 바꾸면 한 턴이 간다.' : '물건을 고르면 여기에 자세히 보인다.'));
    const def = itemDef(item.id);
    const index = game.bag.indexOf(item);
    const p = itemPower(item);
    const pv = def.kind === 'gear' && !def.tool ? previewEquip(game, index) : null;
    // 굶주림·쇠약까지 넣은 셈으로 미리 본다
    const after = pv ? { ...game, equip: { ...game.equip, [pv.slot]: item } } : null;
    const act = (action) => { const ev = run(action, true); if (!ev) return; if (game.battle || ev.some((e) => e.type === 'fall' || (e.type === 'battle' && e.phase !== 'start'))) close(); else rerender(); };
    const swapOnly = fighting && pv && !['weapon', 'off'].includes(pv.slot);
    return h('div', { class: 'detail' },
      h('div', { style: 'display:flex;gap:10px;align-items:center' }, icon(item, 48), h('div', {}, h('b', { class: 'serif', style: 'font-size:1.25rem' }, gearName(item)), h('br'), h('span', {}, `등급 ${gradeName(item.grade)}${item.n > 1 ? `, ${item.n}개` : ''}`))),
      h('p', {}, def.desc),
      p.attack ? h('div', { class: 'rowx' }, h('span', {}, '공격'), item.dur === 0 ? h('b', { class: 'warn' }, `0 (원래 ${p.attack})`) : h('b', {}, p.attack)) : null,
      p.defense ? h('div', { class: 'rowx' }, h('span', {}, '방어'), item.dur === 0 ? h('b', { class: 'warn' }, `0 (원래 ${p.defense})`) : h('b', {}, p.defense)) : null,
      item.dur === 0 ? h('p', { class: 'warn', style: 'font-size:.9rem' }, '부서져서 장비 효과가 없다. 차고 있어도 스탯으로만 싸운다. 대장간에서 고치면 돌아온다.') : null,
      item.dur != null ? h('div', { class: `rowx ${item.dur < 10 ? 'warn' : ''}` }, h('span', {}, '내구도'), h('span', {}, durText(item).replace('내구도 ', ''))) : null,
      h('div', { class: 'rowx' }, h('span', {}, '무게'), h('span', {}, itemWeight(item))),
      optionLines(item).map((t) => h('div', { class: 'rowx honey' }, h('span', {}, '옵션'), h('span', {}, t))),
      item.maker ? h('div', { class: 'rowx' }, h('span', {}, '제작자'), h('span', {}, item.maker)) : null,
      forgeRows(item, { index }, act),
      def.job ? h('div', { class: 'rowx' }, h('span', {}, '착용 직업'), h('span', {}, JOB_NAMES[def.job] || def.job)) : null,
      pv ? [
        h('span', { class: 'h' }, `차면 달라지는 것 (${pv.slotName} 칸)`),
        h('div', { class: 'rowx' }, h('span', {}, '착용 중'), h('span', {}, pv.old ? `${pv.old.name}, 내구도 ${pv.old.dur} / ${pv.old.max}` : '없음')),
        pv.attack[0] !== pv.attack[1] ? h('div', { class: 'rowx' }, h('span', {}, '공격력'), h('b', {}, `${valueOf(game, 'attack')} → ${valueOf(after, 'attack')}`)) : null,
        pv.defense[0] !== pv.defense[1] ? h('div', { class: 'rowx' }, h('span', {}, '방어력'), h('b', {}, `${valueOf(game, 'defense')} → ${valueOf(after, 'defense')}`)) : null,
        h('div', { class: 'rowx' }, h('span', {}, '장비 무게'), h('span', {}, `${equipWeight(game)} → ${equipWeight(game) + pv.next.weight - (pv.old ? pv.old.weight : 0)}`)),
      ] : null,
      h('div', { class: 'row-btns', style: 'margin-top:8px' },
        pv ? h('button', { class: 'btn go', type: 'button', disabled: swapOnly, onclick: () => act({ type: 'equip', index }) }, fighting ? '바꿔 쥔다 (한 턴)' : '착용') : null,
        def.throw ? h('button', { class: 'btn go', type: 'button', disabled: !fighting, onclick: () => act({ type: 'use', index }) }, fighting ? '사용 (한 턴)' : '전투용') : null,
        def.eat ? h('button', { class: 'btn go', type: 'button', onclick: () => act({ type: 'use', index }) }, def.eat.hp ? (fighting ? '사용 (한 턴)' : '사용') : (fighting ? '사용 (한 턴)' : '사용')) : null,
        def.kind === 'quest' ? h('span', { class: 'muted' }, '퀘스트 물건은 버릴 수 없다.') : h('button', { class: 'btn', type: 'button', disabled: fighting, onclick: () => confirmDiscard(item) }, '버리기')),
      swapOnly ? h('p', { class: 'muted', style: 'font-size:.85rem' }, '싸우는 중에는 무기와 보조만 바꿀 수 있다.') : null,
      def.unknown ? h('p', { class: 'muted', style: 'font-size:.85rem' }, '무엇인지 알려면 감정이 필요하다.') : null);
  }

  /** 대장간에 있을 때 장비에 보이는 수리와 강화. 한 번 누르면 한 번. */
  function forgeRows(item, loc, doIt, small = false) {
    const def = itemDef(item.id);
    if (def.kind !== 'gear' || game.battle || !PLACES[game.place].actions.includes('craft')) return null;
    const cost = repairCost(game, item);
    const e = def.tool ? null : enhanceView(game, item);
    return h('div', { class: 'forgebox', style: small ? 'flex-basis:100%' : '' },
      small ? null : h('span', { class: 'h' }, '대장간'),
      h('div', { class: 'row-btns' },
        h('button', { class: 'btn sm', type: 'button', disabled: !cost || game.silver < cost, 'data-press': true, onclick: () => doIt({ type: 'repair', ...loc }) }, cost ? `수리 (은화 ${cost})` : '수리할 데 없음'),
        e && !e.max ? h('button', { class: 'btn sm go', type: 'button', disabled: !e.can, 'data-press': true, 'aria-label': `${gearName(item)} 강화. 성공 ${Math.round(e.chance * 100)}%`, onclick: () => doIt({ type: 'enhance', ...loc }) }, `강화 +${e.plus + 1} (${Math.round(e.chance * 100)}%)`) : null),
      e && !e.max ? h('small', { class: e.can ? 'muted' : 'warn' }, `드는 것: ${e.need.name} ${e.need.have} / ${e.need.n}, 은화 ${e.silver}. 실패하면 내구도가 깎인다${e.dropOnFail ? ', 강화도 하나 내려간다' : ''}.`) : e ? h('small', { class: 'muted' }, '더는 강화할 수 없다.') : null);
  }

  function confirmDiscard(item) {
    const def = itemDef(item.id);
    wins.open({
      title: '버릴까요?', over: true, render(body, { close }) {
        const go = (n) => { const i = game.bag.indexOf(item); if (i >= 0) run({ type: 'discard', index: i, n }, true); close(); };
        add(body,
          h('p', {}, `${def.name}${item.n > 1 ? ` ${item.n}개` : ''}. 버린 것은 되찾을 수 없다.`),
          h('div', { class: 'row-btns' },
            h('button', { class: 'btn', type: 'button', 'data-autofocus': true, onclick: close }, '취소'),
            h('button', { class: 'btn go', type: 'button', onclick: () => go(1) }, '1개 버리기'),
            item.n > 1 ? h('button', { class: 'btn go', type: 'button', onclick: () => go(item.n) }, `${item.n}개 모두 버리기`) : null));
      },
    });
  }

  // ── 장비창 (G1-1 ~ G1-3) ──
  function openGear() {
    wins.open({
      title: '장비창', size: 'mid',
      render(body, { rerender, close }) {
        const fighting = !!game.battle;
        add(body,
          EQUIP_SLOTS.map((sl) => {
            const item = game.equip[sl.id];
            return h('div', { class: 'gearrow' },
              h('span', { class: 'slotname' }, sl.name),
              item ? icon(item) : h('span', { class: 'ico empty', 'aria-hidden': 'true' }),
              item ? h('span', { class: 'grow' }, h('b', {}, gearName(item)), h('small', {}, ` ${gradeName(item.grade)}`), h('br'),
                h('small', { class: item.dur < 10 ? 'warn' : 'muted' }, `${item.dur === 0 ? '효과 없음' : [itemPower(item).attack ? `공격 ${itemPower(item).attack}` : '', itemPower(item).defense ? `방어 ${itemPower(item).defense}` : ''].filter(Boolean).join(', ')}. ${durText(item)}`))
                : h('span', { class: 'grow muted' }, '비어 있음'),
              item ? h('button', { class: 'btn sm', type: 'button', disabled: fighting, 'aria-label': `${gearName(item)} 벗기`, onclick: () => { if (run({ type: 'unequip', slot: sl.id }, true)) rerender(); } }, '해제') : null,
              item ? forgeRows(item, { slot: sl.id }, (a) => { if (run(a, true)) rerender(); }, true) : null);
          }),
          h('span', { class: 'h' }, '합계'),
          derived(game).filter((d) => d.id === 'attack' || d.id === 'defense').map((d) => h('div', { class: 'rowx' }, h('span', {}, d.name), h('span', {}, h('b', {}, d.value), h('small', { class: 'muted' }, ` = ${formula(d)}`)))),
          h('div', { class: 'rowx' }, h('span', {}, '장비 무게'), h('span', {}, equipWeight(game))),
          h('div', { class: 'row-btns', style: 'margin-top:8px' }, h('button', { class: 'btn', type: 'button', onclick: () => { close(); openBag('gear'); } }, '가방에서 장비 고르기')),
          fighting ? h('p', { class: 'muted', style: 'font-size:.85rem' }, '싸우는 중에는 벗을 수 없다. 무기와 보조는 가방에서 바꿔 쥘 수 있다.') : null);
      },
      onClose: () => refs.slots?.querySelector('button:not([disabled])')?.focus(),
    });
  }

  const shortTitle = (d) => (d.title.startsWith('새로운 스탯') ? '새로운 스탯' : '');

  // ── 책 (D5, D6) ──
  const TABS = [['journal', '일지'], ['status', '상태'], ['skill', '스킬'], ['book', '도감']];

  function drawBook() {
    // 책에 초점이 있었으면 다시 그린 뒤 같은 자리로 돌려준다.
    const a = document.activeElement;
    const inTabs = refs.tabs.contains(a);
    const pgText = refs.pg.contains(a) && a.tagName === 'BUTTON' ? a.textContent : null;
    refs.tabs.replaceChildren(...TABS.map(([id, label]) =>
      h('button', { class: 'tab', type: 'button', role: 'tab', 'aria-selected': String(tab === id), onclick: () => { tab = id; drawBook(); refs.tabs.querySelector('[aria-selected="true"]')?.focus(); } }, label)));
    refs.pg.setAttribute('aria-label', TABS.find((t) => t[0] === tab)[1]);
    const draw = { journal: pageJournal, status: pageStatus, skill: pageSkill, book: pageBook }[tab];
    fill(refs.pg, draw());
    if (inTabs) refs.tabs.querySelector('[aria-selected="true"]')?.focus();
    else if (pgText != null) ([...refs.pg.querySelectorAll('button')].find((b) => b.textContent === pgText) || refs.pg.querySelector('button'))?.focus();
  }

  const jobLine = () => `${game.name}, ${jobName(game)}, 레벨 ${game.level}`;

  function pageJournal() {
    const entries = game.journal.slice(-2);
    const found = hiddenSlots(game).filter((x) => x.found);
    const mv = mainView(game);
    const jobs = jobsView(game);
    return [
      h('button', { class: 'mainq', type: 'button', onclick: () => openQuests('main') },
        h('small', {}, game.ending ? '메인 퀘스트' : `메인 퀘스트 ${mv.chapter}장`), h('b', {}, mv.name || '다음 장을 기다린다'),
        mv.nearest ? h('span', {}, `가장 가까운 길: ${mv.nearest.name} (${mv.nearest.have} / ${mv.nearest.need})`) : h('span', {}, mv.paths.length ? '아직 닿는 길이 없다' : '')),
      dungeonFloors(),
      jobs.length ? [h('span', { class: 'h' }, `하고 있는 의뢰 (${jobs.length} / 3)`), jobs.map((j) => h('div', { class: 'rowx' }, h('span', {}, j.name), h('span', {}, `${j.have} / ${j.n}, ${j.left}일 남음`)))] : null,
      entries.map((j) => [
        h('span', { class: 'h' }, `${j.day}일째 ${PHASES[j.phase]}, ${PLACES[j.place].name}에서`),
        h('p', {}, j.text),
        j.note ? h('div', { class: 'stamp' }, j.note) : null,
      ]),
      h('span', { class: 'h' }, jobLine()),
      h('div', { class: 'rowx' }, h('span', {}, `힘 ${game.stats.str}, 민첩 ${game.stats.agi}`), h('span', {}, `체력 ${game.stats.con}, 지혜 ${game.stats.wis}`)),
      found.map((x) => h('div', { class: 'rowx honey' }, h('b', {}, x.name), h('b', {}, x.value))),
      topSkills(2).map(([id, s]) => h('div', { class: 'rowx' }, h('span', {}, SKILL_NAMES[id]), h('span', {}, gradeLabel(s.grade)))),
      knowsHidden() ? h('div', { class: 'rowx' }, h('span', { class: 'muted' }, '???'), h('span', { class: 'muted' }, '아직 찾지 못함')) : null,
      game.memo ? h('p', { class: 'memo' }, `귀퉁이 메모: ${game.memo}`) : null,
    ];
  }

  /** 던전 안 장소 판의 작은 지도: 지금 층에서 지나온 방, 지금 있는 방은 짙게. 글로도 "지금 ○층, ○○" (사용자 피드백) */
  function navMap() {
    const floors = game.dungeon ? dungeonMap(game) : null;
    const fl = floors?.find((f) => f.rooms.some((r) => r.here));
    if (!fl) return null;
    const minX = Math.min(...fl.rooms.map((r) => r.pos[0])), minY = Math.min(...fl.rooms.map((r) => r.pos[1]));
    const w = Math.max(...fl.rooms.map((r) => r.pos[0])) - minX + 1, hgt = Math.max(...fl.rooms.map((r) => r.pos[1])) - minY + 1;
    const here = fl.rooms.find((r) => r.here);
    return h('div', { class: 'navmap' },
      h('span', { class: 'note' }, `${fl.name} 지도 (지나온 방만, 위가 북쪽)`),
      settings.art ? h('div', { class: 'dmap', 'aria-hidden': 'true', style: `grid-template-columns:repeat(${w}, 1fr)` },
        Array.from({ length: w * hgt }, (_, i) => { const r = fl.rooms.find((x) => x.pos[0] - minX === i % w && x.pos[1] - minY === Math.floor(i / w)); return h('i', { class: r ? (r.here ? 'on here' : 'on') : '' }, r ? r.name.slice(0, 2) : ''); })) : null,
      h('span', { class: 'sr' }, `지금 ${fl.name}, ${here.name}. 지나온 방: ${fl.rooms.map((r) => r.name).join(', ')}`));
  }

  /** 지나온 방만 그려지는 지도. 칸은 꾸밈이고, 같은 내용이 글 목록으로도 나온다. */
  function dungeonFloors() {
    const id = game.dungeon?.id || Object.values(DUNGEONS).find((d) => d.from === game.place && game.dmem[d.id])?.id || null;
    const floors = id ? dungeonMap(game, id) : null;
    if (!floors || !floors.length) return null;
    return [
      h('span', { class: 'h' }, '지도 (지나온 방만)'),
      floors.map((fl) => {
        const w = Math.max(...fl.rooms.map((r) => r.pos[0])) + 1;
        const hgt = Math.max(...fl.rooms.map((r) => r.pos[1])) + 1;
        return [
          h('b', { style: 'font-size:.9rem' }, fl.name),
          settings.art ? h('div', { class: 'dmap', 'aria-hidden': 'true', style: `grid-template-columns:repeat(${w}, 1fr)` },
            Array.from({ length: w * hgt }, (_, i) => { const r = fl.rooms.find((x) => x.pos[0] === i % w && x.pos[1] === Math.floor(i / w)); return h('i', { class: r ? (r.here ? 'on here' : 'on') : '' }, r ? r.name.slice(0, 2) : ''); })) : null,
          h('p', { style: 'font-size:.88rem' }, fl.rooms.map((r) => (r.here ? `${r.name}(지금 여기)` : r.name)).join(', ')),
        ];
      }),
    ];
  }

  function topSkills(n) {
    return Object.entries(game.skills).sort((a, b) => b[1].grade - a[1].grade || b[1].uses - a[1].uses).slice(0, n);
  }

  function pageStatus() {
    const slots = hiddenSlots(game);
    const found = slots.filter((x) => x.found);
    const half = slots.filter((x) => !x.found && x.half).length;
    return [
      h('div', { style: 'display:flex;justify-content:space-between;align-items:baseline' }, h('b', { style: 'font-size:1.3rem' }, game.name), h('span', { class: 'muted', style: 'font-size:.88rem' }, `${jobName(game)}, 레벨 ${game.level}`)),
      h('div', { class: 'rowx' }, h('span', {}, '출신'), h('span', {}, originById(game.origin).name)),
      game.work ? h('div', { class: 'rowx' }, h('span', {}, '생산 직업'), h('span', {}, WORK_NAMES[game.work])) : null,
      h('div', { class: 'rowx' }, h('span', {}, '은화'), h('b', {}, game.silver)),
      canChooseJob(game) ? h('button', { class: 'btn sm on', type: 'button', style: 'align-self:flex-start;font-family:var(--sans)', onclick: openJobs }, '직업 고르기') : null,
      h('div', { class: 'rowx' }, h('span', {}, '칭호'), h('span', {}, game.title ? TITLES[game.title].name : '달지 않음')),
      h('div', { class: 'rowx' }, h('span', {}, `${townOf(game)}의 명성`), h('span', {}, `${FAME[fameRank(game)].name} (${fameOf(game)})`)),
      game.main.called ? h('div', { class: 'rowx' }, h('span', {}, '호칭'), h('span', {}, game.main.called)) : null,
      bodyRows(),
      h('span', { class: 'h' }, game.unspent > 0 ? `기본 스탯 (남은 점수 ${game.unspent})` : '기본 스탯'),
      h('div', { class: 'rowx' }, h('span', {}, `힘 ${game.stats.str}`), h('span', {}, `민첩 ${game.stats.agi}`)),
      h('div', { class: 'rowx' }, h('span', {}, `체력 ${game.stats.con}`), h('span', {}, `지혜 ${game.stats.wis}`)),
      knowsHidden() ? [h('span', { class: 'h' }, `히든 스탯 (${foundCount(game)} / ${hiddenTotal(game)}, 행동으로만)`),
      found.map((x) => h('div', { class: 'rowx honey' }, h('b', {}, x.name), h('b', {}, x.value))),
      half ? h('div', { class: 'rowx' }, h('span', { class: 'muted' }, '??? 무언가 쌓이고 있다'), h('span', { class: 'muted' }, `${half}칸`)) : null,
      h('div', { class: 'rowx' }, h('span', { class: 'muted' }, '???'), h('span', { class: 'muted' }, `${hiddenTotal(game) - found.length}칸을 아직 찾지 못함`))] : null,
      h('button', { class: 'btn', type: 'button', style: 'margin-top:8px;font-family:var(--sans)', onclick: openStatus }, '크게 보기'),
    ];
  }

  /** 적과 나의 상태 (E7), 몸 상태와 걸린 것 (G2-3), 기척 눈금 (E4). */
  function bodyRows() {
    const b = bodyView(game);
    const e = enemyView(game);
    return [
      e ? [
        h('span', { class: 'h' }, `싸우는 상대: ${e.name} (레벨 ${e.level})`),
        e.fierce > 0 ? h('div', { class: 'rowx' }, h('span', {}, '사나움'), h('b', {}, `+${e.fierce}%`)) : null,
        e.element ? h('div', { class: 'rowx' }, h('span', {}, '속성'), h('span', {}, `${e.element}${e.stages ? `. 국면 ${e.stage} / ${e.stages}` : ''}`)) : null,
        h('div', { class: 'rowx' }, h('span', {}, '적 생명력'), h('b', {}, `${e.hp} / ${e.maxHp}`)),
        e.next ? h('div', { class: 'rowx' }, h('span', {}, '다음 행동'), h('b', {}, e.next.name)) : null,
        e.next ? h('p', { class: 'muted', style: 'font-size:.9rem' }, `${e.next.tell} ${e.hint}`) : null,
      ] : null,
      h('span', { class: 'h' }, '몸 상태'),
      h('div', { class: 'rowx' }, h('span', {}, '생명력'), h('b', {}, `${b.hp} / ${b.maxHp}`)),
      h('div', { class: 'rowx' }, h('span', {}, '상태이상 내성'), h('span', {}, `${Math.round(wisResist(game) * 100)}% 덜 걸림 (지혜 ${game.stats.wis})${game.stats.wis >= 20 ? ', 걸려도 1턴 짧게' : ''}`)),
      h('div', { class: 'rowx' }, h('span', {}, '자연 회복'), h('span', {}, regenRate(game) ? `한 때에 약 ${Math.round(regenRate(game) * PHASE_TICKS * 100)}% (민첩 ${game.stats.agi}${b.hungry ? ', 배고파 절반' : ''})` : game.battle ? '싸우는 중에는 멈춘다' : '굶어서 멈췄다')),
      h('div', { class: 'rowx' }, h('span', {}, '마나'), h('span', {}, `${b.mp} / ${b.maxMp}`)),
      h('div', { class: 'rowx' }, h('span', {}, '포만감'), h('span', {}, `${b.full} / 100${b.hungry ? ' (굶주림)' : ''}`)),
      h('div', { class: 'rowx' }, h('span', {}, '경험치'), h('span', {}, `${b.xp} / ${b.xpNeed}`)),
      b.sense ? h('div', { class: 'rowx' }, h('span', {}, '기척 (조용할수록 싸움이 가깝다)'), h('span', {}, `${b.sense}칸 / 5칸`)) : null,
      b.shadow || b.hungry || b.status.length || buffRows(game).length ? h('span', { class: 'h' }, '걸린 효과') : null,
      buffRows(game).map((r) => h('div', { class: 'rowx' }, h('span', {}, `${r.kind}: ${r.name}`), h('span', {}, `${r.text}. ${r.until.day}일째 ${PHASES[r.until.phase]}까지`))),
      b.shadow ? h('div', { class: 'rowx' }, h('span', {}, `죽음의 그림자 ${b.shadow}겹`), h('span', {}, `공격·방어 −${shadowView(game).cut}%. 신전에서 축복을 받거나 기도로 걷어 낸다 (${shadowView(game).pray} / ${shadowView(game).need})`)) : null,
      b.hungry ? h('div', { class: 'rowx' }, h('span', {}, '굶주림'), h('span', {}, '먹으면 풀린다')) : null,
      b.status.map((x) => h('div', { class: 'rowx' }, h('span', {}, x.name), h('span', {}, `${x.turns}턴. ${x.say}`))),
    ];
  }

  function pageSkill() {
    const stage = scarecrowStage(game);
    const art = game.place === 'training' ? [
      settings.art ? h('div', { class: 'artbox' }, pixel(`scarecrow-${stage}`, SCARECROW_ALT[stage], 128, 160)) : null,
      h('b', { style: 'font-size:1.1rem' }, '훈련소의 허수아비'),
      h('div', { class: 'rowx' }, h('span', {}, '친 횟수'), h('span', {}, `${game.counters.act.strike || 0}번`)),
      h('div', { class: 'rowx' }, h('span', {}, '지금 모습'), h('span', {}, SCARECROW_SAY[stage])),
    ] : [];
    return [
      art,
      h('span', { class: 'h' }, '숙련도'),
      skillRows(),
      h('button', { class: 'btn', type: 'button', style: 'margin-top:8px;font-family:var(--sans)', onclick: openSkills }, '크게 보기'),
    ];
  }

  function skillRows() {
    const ids = Object.keys(game.skills).sort((a, b) => game.skills[b].grade - game.skills[a].grade || game.skills[b].uses - game.skills[a].uses);
    if (!ids.length) return [h('p', { class: 'muted', style: 'font-size:.95rem' }, '아직 해 본 일이 없다.')];
    return ids.map((id) => {
      const s = game.skills[id];
      const br = branchOf(game, id);
      const pend = pendingEvolves(game).includes(id);
      return [h('div', { class: 'sk' }, h('b', {}, SKILL_NAMES[id]),
        h('div', { class: 'bar', role: 'img', 'aria-label': `다음 단계까지 ${Math.round(progress(s) * 100)}%` }, h('i', { style: `width:${Math.round(progress(s) * 100)}%` })),
        h('span', {}, gradeLabel(s.grade)),
        skillEffect(id) ? h('span', { class: 'eff' }, skillEffect(id)) : null),
      br ? h('button', { class: 'btn sm', type: 'button', style: 'align-self:flex-start', onclick: () => openEvolve(id) }, `${SKILL_NAMES[id]}의 갈래: ${br.name}`) : null,
      pend ? h('button', { class: 'btn sm on', type: 'button', style: 'align-self:flex-start', onclick: () => openEvolve(id) }, `${SKILL_NAMES[id]}의 갈래 고르기`) : null];
    });
  }

  function pageBook() {
    const mons = Object.entries(game.dex.mon);
    return [
      h('span', { class: 'h', style: 'margin-top:0' }, '도감'),
      h('div', { class: 'rowx' }, h('span', {}, '만난 사람'), h('span', {}, peopleDex(game).length)),
      h('div', { class: 'rowx' }, h('span', {}, '마주친 괴물'), h('span', {}, mons.length)),
      h('div', { class: 'rowx' }, h('span', {}, '가져 본 물건'), h('span', {}, Object.keys(game.dex.items).length)),
      h('div', { class: 'rowx' }, h('span', {}, '가 본 곳'), h('span', {}, Object.keys(game.dex.places).length)),
      knowsHidden() ? h('div', { class: 'rowx' }, h('span', {}, '히든 스탯'), h('span', {}, `${foundCount(game)} / ${hiddenTotal(game)}`)) : null,
      h('button', { class: 'btn', type: 'button', style: 'margin-top:8px;font-family:var(--sans)', onclick: () => openDex() }, '크게 보기'),
    ];
  }

  // ── 조각 (N2) ──
  function openSculpt() {
    wins.open({
      title: '조각', size: 'mid', side: '광장의 볕 좋은 자리',
      render(body, { close }) {
        const m = sculptMenu(game);
        add(body,
          h('p', { class: 'muted', style: 'font-size:.9rem' }, `손으로 깎는다. 작품 하나에 칼질 ${m.cuts}번. 본 것만 깎을 수 있다. 어떤 작품이 될지는 마지막 칼질에서 갈린다. 그만두면 토막은 버려진다.`),
          h('div', {}, '깎을 거리: ', m.needs.map((n) => h('span', { class: n.have >= n.n ? '' : 'warn' }, `${n.name} ${n.have} / ${n.n}`))),
          h('div', { class: m.chisel ? '' : 'warn' }, m.chisel ? (m.chisel.dur == null ? `${m.chisel.name}: 닳지 않는다` : `${m.chisel.name} 내구도 ${m.chisel.dur}`) : '조각칼이 없다. 대장간에서 사거나 만든다.'),
          h('table', { class: 'odds' }, h('caption', {}, '작품 등급의 확률'),
            h('thead', {}, h('tr', {}, WORK_GRADES.map((g) => h('th', { scope: 'col' }, g)))),
            h('tbody', {}, h('tr', {}, m.odds.map((p) => h('td', {}, `${p >= 10 ? Math.round(p) : p.toFixed(1)}%`))))),
          h('span', { class: 'h' }, '주제'),
          m.subjects.length ? h('div', { class: 'col-btns' }, m.subjects.map((x, i) =>
            h('button', { class: 'btn', type: 'button', disabled: !m.can, 'data-autofocus': i === 0 || null, onclick: () => { close(); run({ type: 'sculpt', subject: x.id }); } }, x.name)))
            : h('p', { class: 'muted' }, '아직 깎을 만한 것을 본 적이 없다. 만나거나 잡아 본 것만 깎을 수 있다.'),
          m.can ? null : h('p', { class: 'warn' }, '깎을 거리가 모자란다.'));
      },
      onClose: () => refs.slots?.querySelector('button:not([disabled])')?.focus(),
    });
  }

  // ── 작품 (N2-2, N2-5) ──
  function openWorks() {
    let picked = null;
    wins.open({
      title: '작품', size: 'wide', side: `만든 것 ${game.works.length}점`,
      render(body, { rerender, close }) {
        const list = worksView(game);
        const sel = list.find((w) => w.no === picked) || null;
        const act = (action) => { const ev = run(action, true); if (!ev) return; if (game.choice) close(); else rerender(); };
        const here = peopleHere(game);
        add(body, h('div', { class: 'cols' },
          h('div', { class: 'items', style: 'max-height:24rem' }, list.length ? list.slice().reverse().map((w) =>
            h('button', { class: `it ${picked === w.no ? 'on' : ''}`, type: 'button', 'aria-pressed': String(picked === w.no), onclick: () => { picked = w.no; rerender(); } },
              h('span', { class: 'grow' }, h('b', {}, w.name), h('small', { class: 'muted' }, ` ${w.day}일째`)), h('small', {}, w.whereName)))
            : h('p', { class: 'muted' }, '아직 깎은 것이 없다. 광장에서 깎는다.')),
          sel ? h('div', { class: `detail ${sel.grade >= 3 ? 'glow' : ''}` },
            settings.art && sel.art ? h('span', { class: `ico ${sel.grade >= 3 ? 'g4' : ''}`, style: 'align-self:flex-start' }, pixel(sel.grade === 0 ? `${sel.art}-lump` : `${sel.art}-4`, sel.grade === 0 ? '뭉툭하게 깎인 덩어리' : `${sel.subjectName}상${sel.grade >= 3 ? '. 꿀빛으로 반짝인다' : ''}`, 96, 96)) : null,
            h('b', { class: 'serif', style: 'font-size:1.25rem' }, sel.name),
            h('div', { class: 'rowx' }, h('span', {}, '등급'), h('span', {}, sel.gradeName)),
            h('div', { class: 'rowx' }, h('span', {}, '현재 위치'), h('span', {}, sel.whereName)),
            sel.admire ? h('div', { class: 'rowx' }, h('span', {}, '감상하면'), h('span', {}, `${sel.admire} (하루)`)) : null,
            sel.held || sel.where === 'plaza' ? h('div', { class: 'col-btns', style: 'margin-top:6px' },
              h('button', { class: 'btn go', type: 'button', disabled: sel.where === 'plaza' && game.place !== 'plaza', onclick: () => act({ type: 'work', op: 'admire', no: sel.no }) }, '감상'),
              sel.held ? h('button', { class: 'btn', type: 'button', disabled: game.place !== 'plaza', onclick: () => act({ type: 'work', op: 'place', no: sel.no }) }, game.place === 'plaza' ? '광장에 전시' : '광장의 받침대에 세운다 (광장에서)') : null,
              sel.held ? here.filter((p) => p.id !== 'trapped').map((p) => h('button', { class: 'btn', type: 'button', onclick: () => act({ type: 'work', op: 'gift', no: sel.no, npc: p.id }) }, `${p.name}에게 선물`)) : null,
              sel.held ? h('button', { class: 'btn', type: 'button', disabled: placeById(game.place).wild, onclick: () => act({ type: 'work', op: 'sell', no: sel.no }) }, `판다 (은화 ${sel.price})`) : null,
              sel.held ? h('button', { class: 'btn', type: 'button', disabled: !sel.canAlive || game.party.length >= PARTY_MAX, onclick: () => act({ type: 'work', op: 'alive', no: sel.no }) }, sel.aliveLabel) : null,
              sel.held ? h('span', { class: 'muted', style: 'font-size:.85rem' }, '가방에 넣어 두어도 된다. 작품은 무게가 없다.') : null) : null)
            : h('div', { class: 'detail' }, h('p', { class: 'muted' }, '작품을 고르면 할 수 있는 일이 보인다.'))));
      },
      onClose: () => { drawStrip(); drawBook(); refs.slots?.querySelector('button:not([disabled])')?.focus(); },
    });
  }

  // ── 요리 (N3) ──
  function openCook() {
    let pot = [];
    wins.open({
      title: '요리', size: 'wide', side: '강가의 모닥불',
      render(body, { rerender }) {
        const m = cookMenu(game);
        pot = pot.filter((id, i) => m.ingredients.some((x) => x.id === id && x.have >= pot.slice(0, i + 1).filter((y) => y === id).length));
        const left = (id) => (m.ingredients.find((x) => x.id === id)?.have || 0) - pot.filter((y) => y === id).length;
        add(body,
          h('p', { class: 'muted', style: 'font-size:.9rem' }, `재료를 ${m.max}개까지 넣는다. 맞는 조합이면 레시피가 도감에 적힌다. 틀리면 먹을 수는 있는 것이 된다. 넣은 재료는 돌아오지 않는다. 음식의 힘은 한 번에 하나만 붙는다.`),
          h('div', { class: 'cols' },
            h('div', { style: 'display:flex;flex-direction:column;gap:6px;min-width:0' },
              h('span', { class: 'h', style: 'margin-top:0' }, '재료'),
              m.ingredients.length ? m.ingredients.map((x) => h('div', { class: 'traderow' }, h('span', { class: 'grow' }, h('b', {}, x.name), h('small', {}, ` ${left(x.id)}개 남음`)),
                h('button', { class: 'btn sm', type: 'button', 'aria-label': `${x.name} 넣기`, disabled: pot.length >= m.max || left(x.id) < 1, onclick: () => { pot.push(x.id); rerender(); } }, '넣기'))) : h('p', { class: 'muted' }, '넣을 만한 것이 없다.'),
              h('span', { class: 'h' }, `솥 (${pot.length} / ${m.max})`),
              h('p', {}, pot.length ? pot.map((id) => itemDef(id).name).join(', ') : '비어 있다'),
              h('div', { class: 'row-btns' },
                h('button', { class: 'btn go', type: 'button', disabled: !pot.length, onclick: () => { const ids = pot; pot = []; if (run({ type: 'cook', ids }, true)) rerender(); } }, '요리'),
                h('button', { class: 'btn', type: 'button', disabled: !pot.length, onclick: () => { pot = []; rerender(); } }, '꺼내기'))),
            h('div', { style: 'display:flex;flex-direction:column;gap:6px;min-width:0' },
              h('span', { class: 'h', style: 'margin-top:0' }, '찾은 레시피'),
              m.known.length ? m.known.map((d) => h('div', { class: 'card' }, h('b', {}, d.name), h('span', {}, `재료: ${d.needs.join(', ')}`), h('span', { class: 'muted' }, d.text))) : h('p', { class: 'muted' }, '아직 찾은 것이 없다.'),
              m.hints.length ? [h('span', { class: 'h' }, '들은 말'), m.hints.map((t) => h('p', { class: 'serif', style: 'font-size:.95rem' }, t))] : null,
              m.unknown ? h('p', { class: 'muted', style: 'font-size:.85rem' }, '아직 못 찾은 조합이 있다. 사람들 이야기에 귀띔이 섞여 있다.') : null,
              m.fails.length ? [h('span', { class: 'h' }, '틀렸던 조합'), m.fails.map((t) => h('div', { class: 'rowx' }, h('span', {}, t), h('span', { class: 'muted' }, '먹을 수는 있는 것')))] : null)));
      },
      onClose: () => { drawBody(); drawBook(); refs.slots?.querySelector('button:not([disabled])')?.focus(); },
    });
  }

  // ── 동료 창 (H1-1 ~ H1-4) ──
  function openParty() {
    let tabId = null;
    wins.open({
      title: '동료', size: 'mid',
      render(body, { rerender }) {
        const list = partyView(game);
        add(body, h('div', { class: 'rowx' }, h('span', {}, '파티'), h('span', {}, `${list.length} / ${PARTY_MAX}`)));
        if (!list.length) { add(body, h('p', {}, '함께 다니는 이가 없다.'), h('p', { class: 'muted' }, `동료를 얻는 길은 셋이다. 사이가 '${BONDS[REGULAR].name}' 이상인 사람에게 청하기, 주점에서 용병 구하기(하루 은화 ${MERC_FEE}), 그리고 하나 더.`)); return; }
        const c = list.find((x) => x.id === tabId) || list[0];
        tabId = c.id;
        const act = (action) => { if (run(action, true)) rerender(); };
        add(body,
          h('div', { class: 'row-btns', role: 'group', 'aria-label': '동료' }, list.map((x) => h('button', { class: `btn sm ${x.id === c.id ? 'on' : ''}`, type: 'button', 'aria-pressed': String(x.id === c.id), 'data-set': `c:${x.id}`, onclick: () => { tabId = x.id; rerender(); } }, x.name))),
          h('div', { style: 'display:flex;justify-content:space-between;align-items:baseline' }, h('b', { class: 'serif', style: 'font-size:1.3rem' }, c.name), h('span', {}, c.what)),
          h('div', { class: 'rowx' }, h('span', {}, '역할과 위치'), h('span', {}, `${c.role}, ${c.rowName}`)),
          h('div', { class: 'rowx' }, h('span', {}, '생명력'), h('b', {}, c.down ? '쓰러져 있다' : `${c.hp} / ${c.maxHp}`)),
          h('div', { class: 'rowx' }, h('span', {}, '속성'), h('span', {}, c.element)),
          h('div', { class: 'rowx' }, h('span', {}, c.heal ? '고치는 힘' : '치는 힘'), h('span', {}, c.heal || c.attack)),
          h('div', { class: 'rowx' }, h('span', {}, '친밀도'), h('span', {}, c.bondName)),
          c.fee ? h('div', { class: 'rowx' }, h('span', {}, '고용비'), h('span', {}, `하루 은화 ${c.fee}. 못 내면 떠난다`)) : null,
          h('div', { class: `rowx ${c.crossed ? 'warn' : ''}` }, h('span', {}, `바라는 것: ${c.wants}`), h('span', {}, `거스른 횟수 ${c.crossed} / ${c.limit}`)),
          h('span', { class: 'h' }, '방침 (싸우는 중에도 바꿀 수 있다)'),
          h('div', { class: 'col-btns', role: 'group', 'aria-label': '방침' }, c.plans.map((p) => h('button', { class: `btn ${c.plan === p.id ? 'on' : ''}`, type: 'button', 'aria-pressed': String(c.plan === p.id), 'data-set': `plan:${p.id}`, onclick: () => act({ type: 'party', op: 'plan', id: c.id, plan: p.id }) }, h('b', {}, p.name), h('small', {}, ` ${p.text}`)))),
          h('div', { class: 'row-btns', style: 'margin-top:8px' },
            c.canBack ? h('button', { class: 'btn sm', type: 'button', disabled: !!game.battle, onclick: () => act({ type: 'party', op: 'row', id: c.id, row: c.row === 'back' ? 'front' : 'back' }) }, c.row === 'back' ? '앞줄 배치' : '뒷줄 배치') : h('span', { class: 'muted', style: 'font-size:.85rem' }, '뒷줄에는 활·마법·치유를 하는 이만 선다.'),
            h('button', { class: 'btn sm', type: 'button', disabled: !!game.battle, onclick: () => confirmDismiss(c, rerender) }, '파티에서 내보내기')));
      },
      onClose: () => { drawNav(); refs.slots?.querySelector('button:not([disabled])')?.focus(); },
    });
  }

  function confirmDismiss(c) {
    wins.open({
      title: `${c.name}${waGwa(c.name)} 헤어질까요?`, over: true, render(body, { close }) {
        add(body, h('p', {}, '헤어지면 다시 얻기 어렵다.'),
          h('div', { class: 'row-btns' },
            h('button', { class: 'btn', type: 'button', 'data-autofocus': true, onclick: close }, '취소'),
            h('button', { class: 'btn go', type: 'button', onclick: () => { run({ type: 'party', op: 'dismiss', id: c.id }, true); close(); } }, '내보내기')));
      },
    });
  }

  // ── 지난번 이후 (F09-03) ──
  function openSince() {
    const v = sinceLast(game);
    const mv = mainView(game);
    const jobs = jobsView(game);
    wins.open({
      title: '지난번 이후', size: 'mid', side: whenLabel(game),
      render(body, { close }) {
        add(body,
          h('span', { class: 'h', style: 'margin-top:0' }, '하던 일'),
          h('div', { class: 'rowx' }, h('span', {}, '있는 곳'), h('span', {}, roomView(game) ? `${roomView(game).dungeon} ${roomView(game).floor}, ${roomView(game).name}` : placeById(game.place).name)),
          h('div', { class: 'rowx' }, h('span', {}, game.ending ? '메인 퀘스트' : `메인 퀘스트 ${mv.chapter}장`), h('span', {}, mv.nearest ? `${mv.name}. ${mv.nearest.name} ${mv.nearest.have} / ${mv.nearest.need}` : mv.name || '다음 장을 기다린다')),
          jobs.map((j) => h('div', { class: 'rowx' }, h('span', {}, `의뢰: ${j.name}`), h('span', {}, `${j.have} / ${j.n}, ${j.left}일 남음`))),
          game.battle ? h('p', { class: 'warn' }, '싸우는 중이었다.') : null,
          game.craft ? h('p', { class: 'warn' }, '쇠를 두드리던 중이었다. 쇠는 아직 뜨겁다.') : null,
          game.sculpt ? h('p', {}, '나무를 깎던 중이었다.') : null,
          game.choice ? h('p', { class: 'warn' }, '정해야 할 것이 있다. 단축 칸에 놓여 있다.') : null,
          h('span', { class: 'h' }, '그사이 일'),
          v.deals.map((t) => h('p', {}, `경매장: ${t}`)),
          v.notices.map((t) => h('p', {}, `세계 공지: ${t}`)),
          v.rumors.map((t) => h('p', { class: 'serif' }, `소문: ${t}`)),
          !v.deals.length && !v.notices.length && !v.rumors.length ? h('p', { class: 'muted' }, '지난번에 본 뒤로 새로 생긴 일은 없다.') : null,
          h('button', { class: 'btn go', type: 'button', 'data-autofocus': true, style: 'min-height:3rem;font-size:1rem', onclick: close }, '계속하기'));
      },
      onClose: () => { markSeen(game); autosave(); refs.slots?.querySelector('button:not([disabled])')?.focus(); if (game.choice && !game.battle) openChoice(); },
    });
  }

  // ── 세계 공지와 랭킹 (N6-4 ~ N6-6) ──
  function openWorld() {
    let wt = 'notice';
    wins.open({
      title: '세계', size: 'wide',
      render(body, { rerender }) {
        add(body, h('div', { class: 'row-btns', role: 'group', 'aria-label': '갈래' },
          [['notice', '세계 공지'], ...RANKS.map((r) => [r.id, `랭킹: ${r.name}`])].map(([id, name]) =>
            h('button', { class: `btn sm ${wt === id ? 'on' : ''}`, type: 'button', 'aria-pressed': String(wt === id), 'data-set': `w:${id}`, onclick: () => { wt = id; rerender(); } }, name))));
        if (wt === 'notice') {
          const list = noticesView(game);
          add(body, list.length ? h('div', { class: 'items', style: 'max-height:26rem' }, list.map((n) => h('div', { class: `rowx ${n.mine ? 'honey' : ''}` }, h('span', {}, n.first ? h('span', { class: 'tagx' }, '세계 최초') : null, ' ', n.text), h('span', { class: 'muted' }, `${n.day}일째`))))
            : h('p', { class: 'muted' }, '아직 올라온 공지가 없다. 날이 바뀌면 세계의 소식이 올라온다.'));
          return;
        }
        const v = ranking(game, wt);
        const row = (r) => h('tr', { class: r.me ? 'me' : '' }, h('td', {}, `${r.rank}위`), h('td', {}, r.me ? h('b', {}, `${r.name} (나)`) : r.name), h('td', {}, r.score));
        add(body,
          h('p', {}, `${v.name} 랭킹. ${v.total}명 가운데 나는 `, h('b', {}, `${v.myRank}위`), '.'),
          h('table', { class: 'odds rank' }, h('caption', {}, '상위 3위'), h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, '순위'), h('th', { scope: 'col' }, '이름'), h('th', { scope: 'col' }, v.name))), h('tbody', {}, v.top.map(row))),
          h('table', { class: 'odds rank' }, h('caption', {}, '내 주변 순위'), h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, '순위'), h('th', { scope: 'col' }, '이름'), h('th', { scope: 'col' }, v.name))), h('tbody', {}, v.around.map(row))));
      },
      onClose: () => refs.slots?.querySelector('button:not([disabled])')?.focus(),
    });
  }

  // ── 소문 게시판 (F08-03) ──
  function openRumors() {
    if (!run({ type: 'rumor' })) return;
    wins.open({
      title: '소문 게시판', size: 'mid', side: '주점의 벽',
      render(body) {
        const list = rumorsView(game);
        add(body,
          h('p', { class: 'muted', style: 'font-size:.9rem' }, '날마다 쪽지가 바뀐다. 믿거나 말거나. 들은 귀띔은 상태창의 그 칸에 적힌다.'),
          list.map((r) => h('div', { class: `card ${r.about === 'me' ? 'near' : ''}` },
            r.about === 'me' ? h('span', { class: 'tagx' }, '내 얘기 같다') : null,
            h('p', { class: 'serif' }, r.text))));
      },
      onClose: () => { drawBook(); refs.slots?.querySelector('button:not([disabled])')?.focus(); },
    });
  }

  // ── 경매장 (N6-1 ~ N6-3) ──
  const ATABS = [['mine', '내 판매'], ['lots', '경매 목록'], ['bids', '내 입찰'], ['history', '거래 내역']];
  function openAuction() {
    let at = 'lots';
    let tier = 'low'; // 오늘 물건의 하급·중급·상급 (Z66)
    let pick = null; // 올리려고 고른 가방 속 물건
    let start = 0;
    wins.open({
      title: '경매장', size: 'wide',
      render(body, { rerender }) {
        const v = auctionView(game);
        const act = (action) => { if (run(action, true)) { pick = null; rerender(); } };
        add(body,
          h('div', { class: 'row-btns', role: 'group', 'aria-label': '갈래' }, ATABS.map(([id, name]) => h('button', { class: `btn sm ${at === id ? 'on' : ''}`, type: 'button', 'aria-pressed': String(at === id), 'data-set': `a:${id}`, onclick: () => { at = id; rerender(); } }, `${name} ${v[id].length}`))),
          h('div', { class: 'rowx' }, h('span', {}, '보유 은화'), h('b', {}, game.silver)));
        if (at === 'mine') {
          const sel = v.sellable.find((x) => x.item === pick) || null;
          if (sel && !start) start = Math.max(1, Math.round(sel.fair * 0.6));
          add(body,
            v.mine.length ? v.mine.map((m) => h('div', { class: 'card' },
              h('div', {}, h('b', {}, m.name), h('small', { class: 'muted' }, ` 시작가 ${m.start}, ${m.left}일 남음`)),
              h('span', {}, m.top ? `지금 가장 높은 값: 은화 ${m.top}` : '아직 입찰이 없다'),
              m.bids.map((b) => h('span', { class: 'muted' }, `'${b.who}': 은화 ${b.amount}. "${b.say}"`)))) : h('p', { class: 'muted' }, '올린 것이 없다.'),
            h('span', { class: 'h' }, `올리기 (수수료 ${v.fee}%${v.feeWhy ? `, ${v.feeWhy}` : ''})`),
            sel ? h('div', { class: 'detail' },
              h('b', {}, sel.name), h('span', { class: 'muted' }, `가게에 팔면 은화 ${Math.max(1, Math.floor(sel.fair * 0.4))}쯤`),
              h('div', { class: 'traderow' }, h('span', { class: 'grow' }, '시작가 은화 ', h('b', {}, start)),
                h('button', { class: 'btn sm', type: 'button', 'aria-label': '시작가 10 내리기', disabled: start <= 10, onclick: () => { start -= 10; rerender(); } }, '−10'),
                h('button', { class: 'btn sm', type: 'button', 'aria-label': '시작가 1 내리기', disabled: start <= 1, onclick: () => { start -= 1; rerender(); } }, '−1'),
                h('button', { class: 'btn sm', type: 'button', 'aria-label': '시작가 1 올리기', onclick: () => { start += 1; rerender(); } }, '+1'),
                h('button', { class: 'btn sm', type: 'button', 'aria-label': '시작가 10 올리기', onclick: () => { start += 10; rerender(); } }, '+10')),
              h('div', { class: 'row-btns' },
                h('button', { class: 'btn go', type: 'button', onclick: () => { const st = start; start = 0; act({ type: 'auction', op: 'list', index: game.bag.indexOf(sel.item), start: st, days: 1 }); } }, '1일 등록'),
                h('button', { class: 'btn go', type: 'button', onclick: () => { const st = start; start = 0; act({ type: 'auction', op: 'list', index: game.bag.indexOf(sel.item), start: st, days: 3 }); } }, '3일 등록'),
                h('button', { class: 'btn', type: 'button', onclick: () => { pick = null; start = 0; rerender(); } }, '그만두기')))
              : (v.sellable.length ? h('div', { class: 'items' }, v.sellable.map((x) => h('button', { class: 'it', type: 'button', onclick: () => { pick = x.item; start = 0; rerender(); } }, icon(x.item), h('span', { class: 'grow' }, h('b', {}, x.name)), h('small', { class: 'muted' }, '등록할 물건 선택')))) : h('p', { class: 'muted' }, '올릴 만한 것이 가방에 없다.')));
        } else if (at === 'lots') {
          const count = (id) => v.lots.filter((l) => l.tier === id).length;
          add(body, h('p', { class: 'muted', style: 'font-size:.9rem' }, '오늘 나온 물건은 내일 끝난다. 부른 은화는 묶여 있다가, 다른 사람이 더 높이 부르면 돌아온다.'),
            h('div', { class: 'row-btns tierbtns', role: 'group', 'aria-label': '등급' }, v.tiers.map((t) => h('button', { class: `btn sm ${tier === t.id ? 'on' : ''}`, type: 'button', 'aria-pressed': String(tier === t.id), onclick: () => { tier = t.id; rerender(); } }, t.name, h('b', { class: 'num' }, count(t.id))))),
            count(tier) ? null : h('p', { class: 'muted' }, '오늘은 이 칸에 나온 물건이 없다.'),
            v.lots.filter((l) => l.tier === tier).map((l) => {
              const next = l.mine ? Math.ceil(l.mine * 1.1) + 1 : l.ask;
              return h('div', { class: 'card' },
                h('div', {}, h('b', {}, l.name), h('small', { class: 'muted' }, ` 올린 이 '${l.seller}'`)),
                h('span', { class: 'muted' }, l.desc),
                h('span', {}, l.mine ? `내가 부른 값: 은화 ${l.mine}` : `시작가: 은화 ${l.ask}`),
                h('button', { class: 'btn sm', type: 'button', 'aria-label': `${l.name}에 은화 ${next} 부르기`, disabled: game.silver < next - l.mine, onclick: () => act({ type: 'auction', op: 'bid', key: l.key, amount: next }) }, l.mine ? `은화 ${next} 상회 입찰` : `은화 ${next} 입찰`));
            }));
        } else if (at === 'bids') {
          add(body, v.bids.length ? v.bids.map((b) => h('div', { class: 'rowx' }, h('span', {}, b.name), h('span', {}, `은화 ${b.amount}, ${b.left}일 뒤 끝남`))) : h('p', { class: 'muted' }, '입찰한 것이 없다.'));
        } else {
          add(body, v.history.length ? v.history.map((x) => h('div', { class: 'rowx' }, h('span', {}, x.text), h('span', { class: 'muted' }, `${x.day}일째`))) : h('p', { class: 'muted' }, '지난 거래가 없다.'));
        }
      },
      onClose: () => { drawBook(); refs.slots?.querySelector('button:not([disabled])')?.focus(); },
    });
  }

  // ── 끝난 뒤의 일: 남의 끈기를 지켜보고 답해 준다 (M11-4, M11-5) ──
  function openRing() {
    wins.open({
      title: '지켜본다', size: 'mid', side: `지금까지 ${game.rung.total}번`,
      render(body, { rerender }) {
        const v = ringView(game);
        add(body,
          h('p', { class: 'serif' }, afterText(game)),
          h('p', { class: 'muted', style: 'font-size:.9rem' }, '오늘 눈에 띈 이들이다. 날마다 달라진다. 누구에게 답할지는 내가 정한다.'),
          v.list.map((x) => h('div', { class: `card ${x.done ? 'dim' : ''}` },
            h('b', {}, x.name), h('span', {}, x.what + '.'),
            h('button', { class: 'btn sm go', type: 'button', disabled: x.done, 'aria-label': `${x.name}: ${v.verb}`, onclick: () => { if (run({ type: 'ring', k: x.k }, true)) rerender(); } }, x.done ? '오늘은 답해 주었다' : v.verb))));
      },
      onClose: () => { drawNav(); refs.slots?.querySelector('button:not([disabled])')?.focus(); },
    });
  }

  // ── 길드 (Z21) ──
  function openGuild() {
    wins.open({
      title: '길드', size: 'wide', side: game.guild ? guildView(game).mine.name : '아직 든 곳이 없다',
      render(body, { rerender }) {
        const v = guildView(game);
        const act = (action) => { if (run(action, true)) rerender(); };
        const board = h('div', {}, h('span', { class: 'h', style: 'margin-top:0' }, '길드 순위'),
          v.board.map((x) => h('div', { class: `rowx ${x.mine ? 'honey' : ''}` }, h('span', {}, `${x.place}위 ${x.name}`), h('span', {}, x.score))));
        if (!v.mine) {
          add(body, h('div', { class: 'cols' },
            h('div', {},
              h('p', {}, '길드는 한 일을 본다. 싸우고, 만들고, 의뢰를 끝내고, 사람을 사귄 만큼 기여도가 쌓이고 계급이 오른다.'),
              v.can ? null : h('p', { class: 'warn' }, v.why),
              v.left ? h('p', { class: 'warn' }, '오늘 길드를 나왔다. 내일 다시 들어갈 수 있다.') : null,
              v.list.map((g, i) => h('div', { class: 'card' }, h('b', {}, g.name), h('span', {}, g.say), h('span', { class: 'muted' }, g.perk),
                h('button', { class: 'btn go', type: 'button', disabled: !v.can || v.left, 'data-autofocus': i === 0 || null, 'aria-label': `${g.name} 가입`, onclick: () => act({ type: 'guild', op: 'join', id: g.id }) }, '가입')))),
            board));
          return;
        }
        const m = v.mine;
        add(body, h('div', { class: 'cols' },
          h('div', {},
            h('b', { class: 'serif', style: 'font-size:1.4rem' }, m.name), h('p', {}, m.say),
            h('div', { class: 'rowx' }, h('span', {}, '계급'), h('b', {}, m.rank)),
            h('div', { class: 'rowx' }, h('span', {}, '기여도'), h('span', {}, m.next ? `${m.contrib} / ${m.next.at} (다음: ${m.next.name})` : `${m.contrib}`)),
            h('div', { class: 'rowx' }, h('span', {}, '길드의 덕'), h('span', {}, m.perk)),
            h('div', { class: 'rowx' }, h('span', {}, '가입'), h('span', {}, `${m.joined}일째`)),
            h('span', { class: 'h' }, '기여도가 쌓이는 일'),
            h('p', { class: 'muted', style: 'font-size:.9rem' }, '싸움에서 이김 1(이름난 개체 10), 만든 것 2(등급마다 +2), 강화 성공은 그 강화 수, 의뢰 끝냄 5, 대화와 선물 1. 길드의 성격에 맞는 일은 두 배.'),
            h('div', { class: 'row-btns' },
              h('button', { class: 'btn go', type: 'button', 'data-press': true, disabled: game.silver < DONATE.silver, onclick: () => act({ type: 'guild', op: 'donate' }) }, `헌납 (은화 ${DONATE.silver}, 기여 ${DONATE.contrib})`, game.silver < DONATE.silver ? h('small', {}, ' 은화가 모자란다') : null),
              h('button', { class: 'btn', type: 'button', onclick: () => act({ type: 'guild', op: 'leave' }) }, '탈퇴 (기여도를 잃는다)'))),
          board));
      },
      onClose: () => { drawNav(); refs.slots?.querySelector('button:not([disabled])')?.focus(); },
    });
  }

  // ── 2차 전직 (T8, H4-5) ──
  function openAdvance() {
    wins.open({
      title: '2차 전직', size: 'mid', side: '장인 거리',
      render(body, { close }) {
        const v = advanceView(game);
        add(body,
          h('p', {}, v.chosen ? `이미 ${v.chosen}의 길을 걷고 있다.` : `한 길을 오래 걸은 사람만 갈림길에 선다. 레벨 ${v.level}, 둘 가운데 하나. 되돌릴 수 없다.`),
          v.list.length ? h('div', { class: 'cols' }, v.list.map((a) => h('div', { class: 'detail' },
            h('b', { class: 'serif', style: 'font-size:1.2rem' }, a.name), h('span', {}, a.text),
            v.chosen ? null : h('button', { class: 'btn go', type: 'button', disabled: !v.can, onclick: () => { close(); run({ type: 'advance', id: a.id }); } }, '선택'))))
            : h('p', { class: 'muted' }, '기본 직업이 있어야 갈림길이 보인다.'),
          !v.can && !v.chosen ? h('p', { class: 'warn' }, v.why) : null);
      },
      onClose: () => refs.slots?.querySelector('button:not([disabled])')?.focus(),
    });
  }

  // ── 배 짓기와 바치기 (H3) ──
  function openBoat() {
    wins.open({
      title: '배를 짓는다', size: 'mid', side: '배 목수',
      render(body, { close }) {
        const lacks = BOAT_NEEDS.some(([id, n]) => countOf(game, id) < n) || game.silver < BOAT_FEE;
        add(body,
          game.flags.boat ? h('p', {}, '내 배는 나루터에 매여 있다.') : [
            h('p', {}, '배 한 척이 있으면 나루터에서 가라앉은 배까지 노를 저어 갈 수 있다.'),
            BOAT_NEEDS.map(([id, n]) => h('div', { class: `rowx ${countOf(game, id) < n ? 'warn' : ''}` }, h('span', {}, itemDef(id).name), h('span', {}, `${countOf(game, id)} / ${n}`))),
            h('div', { class: `rowx ${game.silver < BOAT_FEE ? 'warn' : ''}` }, h('span', {}, '품삯'), h('span', {}, `은화 ${game.silver} / ${BOAT_FEE}`)),
            h('button', { class: 'btn go', type: 'button', disabled: lacks, 'data-autofocus': true, onclick: () => { close(); run({ type: 'boat' }); } }, lacks ? '아직 모자란다' : '건조')]);
      },
      onClose: () => refs.slots?.querySelector('button:not([disabled])')?.focus(),
    });
  }

  function openOffer() {
    wins.open({
      title: '바친다', side: '작은 사당',
      render(body, { close }) {
        const done = game.flags.offeredDay === game.day;
        add(body,
          h('p', { class: 'serif' }, '초 한 자루를 사서 켠다. 바치는 것은 값이 아니라 횟수라고 한다.'),
          h('div', { class: 'rowx' }, h('span', {}, '초 값'), h('span', {}, `은화 ${OFFER_FEE}`)),
          h('button', { class: 'btn go', type: 'button', disabled: done || game.silver < OFFER_FEE, 'data-autofocus': true, onclick: () => { close(); run({ type: 'offer' }); } }, done ? '오늘은 이미 바쳤다' : '초를 켠다'));
      },
      onClose: () => refs.slots?.querySelector('button:not([disabled])')?.focus(),
    });
  }

  // ── 직업 고르기 (N4-3, N4-4) ──
  let jobWinOpen = false;
  function openJobs() {
    if (jobWinOpen || !canChooseJob(game)) return;
    jobWinOpen = true;
    let chosen = false;
    wins.open({
      title: '직업 고르기', size: 'wide', side: '레벨 5',
      render(body, { close }) {
        const list = jobChoices(game);
        add(body,
          h('p', {}, '다섯 가운데 하나를 고른다. 한 번 고르면 되돌릴 수 없다. 고르지 않아도 된다.'),
          h('div', { class: 'jobs' }, list.map((j) => h('div', { class: `card ${j.match ? 'near' : ''}` },
            h('div', {}, h('b', { class: 'serif', style: 'font-size:1.2rem' }, j.name), j.match ? h('span', { class: 'tagx' }, '내 숙련도와 맞음') : null),
            h('span', {}, j.role),
            h('span', {}, h('b', {}, `첫 스킬: ${j.first.name}`), `. ${j.first.text}`),
            h('span', {}, `빨리 오르는 숙련도: ${j.fastNow.join(', ')} (1.5배)`),
            h('span', { class: 'muted' }, `받는 것: ${j.gear}. 레벨 20의 갈림: ${j.next}`),
            h('button', { class: 'btn go', type: 'button', 'aria-label': `${j.name} 고르기`, onclick: () => confirmJob(j, () => { chosen = true; close(); }) }, '선택')))),
          h('button', { class: 'btn', type: 'button', 'data-autofocus': true, onclick: close }, '나중에'),
          h('p', { class: 'muted', style: 'font-size:.85rem' }, '닫아도 상태 탭에서 다시 열 수 있다. 끝까지 고르지 않고 가는 사람도 있다고 한다.'));
      },
      onClose: () => { jobWinOpen = false; if (!chosen && game && !game.jobAsked) run({ type: 'career', op: 'skip' }); drawBook(); refs.slots?.querySelector('button:not([disabled])')?.focus(); },
    });
  }

  function confirmJob(j, done) {
    wins.open({
      title: `${j.name}의 길로 갈까요?`, over: true, render(body, { close }) {
        add(body, h('p', {}, '직업은 한 번만 고른다. 되돌릴 수 없다.'),
          h('div', { class: 'row-btns' },
            h('button', { class: 'btn', type: 'button', 'data-autofocus': true, onclick: close }, '취소'),
            h('button', { class: 'btn go', type: 'button', onclick: () => { close(); if (run({ type: 'career', op: 'choose', id: j.id }, true)) done(); } }, `${j.name} 전직`)));
      },
    });
  }

  // ── 말 걸기 (E28, Q3-6, T10~T13) ──
  function openTalk(personId) {
    const here = peopleHere(game);
    if (!here.length) return;
    let who = personId || (here.length === 1 ? here[0].id : null);
    const greetNow = (id) => { run({ type: 'greet', npc: id }); return !game.choice && !wins.isOpen(); };
    if (who && !greetNow(who)) return; // 말을 걸자 다른 일이 벌어졌다(히든 퀘스트 같은)
    let giving = false;
    wins.open({
      title: '말 걸기', size: 'mid',
      render(body, { close, rerender }) {
        if (!who) {
          add(body, h('p', {}, '누구에게 말을 걸까.'), h('div', { class: 'col-btns' }, here.map((p, i) =>
            h('button', { class: 'btn', type: 'button', 'data-autofocus': i === 0 || null, onclick: () => { close(); openTalk(p.id); } }, p.name))));
          return;
        }
        if (!peopleHere(game).some((p) => p.id === who)) { add(body, h('p', {}, '그 사람은 이제 여기에 없다.'), h('button', { class: 'btn go', type: 'button', 'data-autofocus': true, onclick: close }, '확인')); return; }
        const p = PEOPLE[who];
        // 한 가지를 하면 창이 닫힌다. 한 일은 대화방에 적힌다
        const act = (action) => { const ev = run(action, true); if (!ev) return; close(); };
        const offers = offersOf(game, who);
        const mine = Object.keys(SUBS).map((id) => subView(game, id)).filter((v) => v && !v.done && v.step.here && v.step.choices.length);
        add(body,
          h('div', { style: 'display:flex;justify-content:space-between;align-items:baseline' }, h('b', { class: 'serif', style: 'font-size:1.3rem' }, p.name), h('span', {}, `친밀도: ${bondName(game, who)}`)),
          h('p', { class: 'serif' }, spokeToday(game, who) ? `"${helloOf(game, who)}"` : '…'),
          offers.map((id) => h('div', { class: 'detail' }, h('b', {}, `부탁이 있는 눈치다: ${SUBS[id].name}`), h('span', { class: 'muted' }, '서브 퀘스트. 받으면 퀘스트 창에 적힌다.'),
            h('button', { class: 'btn go', type: 'button', onclick: () => act({ type: 'quest', op: 'accept', id }) }, '수락'))),
          mine.map((v) => h('div', { class: 'detail' }, h('b', {}, v.name), h('span', {}, v.step.text), choiceButtons(v, act))),
          giving
            ? h('div', { class: 'detail' }, h('b', {}, '무엇을 건넬까'), h('span', { class: 'muted', style: 'font-size:.85rem' }, '좋아하는지 싫어하는지는 줘 봐야 안다. 알아낸 것은 도감에 적힌다.'),
              game.bag.filter((it) => itemDef(it.id).kind !== 'quest').length ? h('div', { class: 'items' }, game.bag.filter((it) => itemDef(it.id).kind !== 'quest').map((it) =>
                h('button', { class: 'it', type: 'button', onclick: () => { giving = false; act({ type: 'gift', npc: who, index: game.bag.indexOf(it) }); } }, icon(it), h('span', { class: 'grow' }, h('b', {}, gearName(it)), h('small', {}, ` ${gradeName(it.grade)}`)), h('span', {}, it.n > 1 ? `${it.n}개 중 하나` : ''))))
                : h('p', { class: 'muted' }, '건넬 것이 없다.'),
              h('button', { class: 'btn', type: 'button', onclick: () => { giving = false; rerender(); } }, '그만두기'))
            : [BLESSERS.includes(who) && game.shadow > 0 ? (() => {
              const v = shadowView(game);
              return h('div', { class: 'detail' }, h('b', {}, '축복'),
                h('span', { class: 'serif' }, '"그림자가 짙구먼. 돈으로 걷어 낼 수도 있고, 여기 앉아 오래 빌어도 걷히지."'),
                h('div', { class: 'rowx' }, h('span', {}, '죽음의 그림자'), h('b', {}, `${v.n}겹 · 공격·방어 −${v.cut}%`)),
                h('div', { class: 'rowx' }, h('span', {}, '축복 (모두 걷어 냄)'), h('span', {}, `은화 ${v.fee} = ${v.n}겹 × 레벨 ${game.level} × 5`)),
                h('div', { class: 'rowx' }, h('span', {}, '기도로 걷어 내기 (한 겹씩)'), h('span', {}, `다음 한 겹까지 기도 ${v.pray} / ${v.need}`)),
                h('div', { class: 'row-btns' },
                  h('button', { class: 'btn go', type: 'button', disabled: game.silver < v.fee, title: game.silver < v.fee ? '은화가 모자란다' : null, onclick: () => act({ type: 'bless', npc: who }) }, `은화 ${v.fee}을 바치고 축복을 받는다`),
                  h('button', { class: 'btn', type: 'button', onclick: () => { close(); refs.slots?.querySelector('[data-act="pray"], button')?.focus(); } }, '기도하러 간다')));
            })() : null,
            h('div', { class: 'row-btns' },
              h('button', { class: 'btn go', type: 'button', 'data-autofocus': spokeToday(game, who) || null, 'data-press': true, disabled: !spokeToday(game, who), title: spokeToday(game, who) ? null : '아직 말을 걸어오지 않았다', onclick: () => act({ type: 'talk', npc: who }) }, '대화'),
              h('button', { class: 'btn', type: 'button', onclick: () => { giving = true; rerender(); } }, '선물'),
              shopView(game) && shopView(game).keeper === p.name ? h('button', { class: 'btn', type: 'button', onclick: () => { close(); openShop(); } }, '상점') : null,
              who === 'miru' ? h('button', { class: 'btn', type: 'button', disabled: bondOf(game, 'miru') < REGULAR || game.party.length >= PARTY_MAX, title: bondOf(game, 'miru') < REGULAR ? `사이가 '${BONDS[REGULAR].name}' 이상이어야 한다` : null, onclick: () => act({ type: 'party', op: 'ask', npc: 'miru' }) }, bondOf(game, 'miru') < REGULAR ? `영입 ('${BONDS[REGULAR].name}'부터)` : '영입') : null,
              TEACHERS[game.place] === who && learnableHere(game).length ? h('button', { class: 'btn', type: 'button', disabled: bondOf(game, who) < KNOWN_BOND, title: bondOf(game, who) < KNOWN_BOND ? '낯익은 사이부터 청할 수 있다' : null, onclick: () => act({ type: 'learn', npc: who }) }, bondOf(game, who) < KNOWN_BOND ? `${ACTIONS[learnableHere(game)[0]].label}을 거들고 싶다 (낯익은 사이부터)` : `${ACTIONS[learnableHere(game)[0]].label}을 거들게 해 달라고 청한다`) : null,
              rootOf(game.origin) === 'bard' && DRINK_HOSTS.includes(who) ? h('button', { class: 'btn', type: 'button', disabled: game.flags.drinkDay === game.day, title: game.flags.drinkDay === game.day ? '오늘은 이미 얻어 마셨다' : null, onclick: () => act({ type: 'drink', npc: who }) }, game.flags.drinkDay === game.day ? '오늘은 이미 한 잔' : '한 잔 얻어 마신다') : null,
              who === 'keeper' && !game.party.some((c) => c.id === 'gaon') ? h('button', { class: 'btn', type: 'button', disabled: game.silver < MERC_FEE || game.party.length >= PARTY_MAX, onclick: () => act({ type: 'party', op: 'hire' }) }, `용병 고용 (하루 은화 ${MERC_FEE})`) : null)],
          spokeToday(game, who) ? null : h('p', { class: 'muted', style: 'font-size:.88rem' }, '아직 말을 걸어오지 않았다. 이곳에서 할 일을 하다 보면 먼저 말을 건다.'),
          h('div', { class: 'talklog', 'aria-live': 'polite' }, game.log.slice(-3).map((l) => h('p', { class: 'muted', style: 'font-size:.9rem' }, l.who ? `${l.who}: ${l.text}` : l.text))));
      },
      onClose: () => { drawNav(); refs.slots?.querySelector('button:not([disabled])')?.focus(); },
    });
  }

  /** 퀘스트의 선택지 단추들. 확률·조건·출신이 여는 대답이 고르기 전에 보인다 (T12, T13, Q3-2). */
  function choiceButtons(v, act) {
    return h('div', { class: 'col-btns' }, v.step.choices.map((c) =>
      h('button', { class: 'btn', type: 'button', disabled: !c.can, 'data-press': true, onclick: () => act({ type: 'quest', op: 'choose', id: v.id, choice: c.id }) },
        c.label,
        c.chance != null ? h('small', {}, ` (${c.check} 판정, 성공 ${c.chance}%)`) : null,
        c.free ? h('small', { class: 'mintx' }, ` (${c.free}. 판정 없이 통한다)`) : null,
        c.need && c.can ? h('small', {}, ` (${c.need})`) : null,
        c.fx ? h('small', { class: 'fx' }, ` 결과: ${c.fx}`) : null,
        !c.can && c.why ? h('small', {}, ` (${c.why})`) : null)));
  }

  // ── 게시판 (E19~E23) ──
  function openBoard() {
    wins.open({
      title: '의뢰 게시판', size: 'wide', side: `끝낸 의뢰 ${game.jobsDone}개`,
      render(body, { rerender }) {
        const act = (action) => { if (run(action, true)) rerender(); };
        const cards = boardView(game);
        const mine = jobsView(game);
        add(body,
          h('p', { class: 'muted', style: 'font-size:.9rem' }, '의뢰는 세 개까지 받는다. 받은 날부터 사흘 안에 끝내야 한다. 게시판은 날마다 바뀐다.'),
          h('div', { class: 'cols' },
            h('div', { style: 'display:flex;flex-direction:column;gap:6px;min-width:0' },
              h('span', { class: 'h', style: 'margin-top:0' }, '오늘 붙은 것'),
              cards.length ? cards.map((c) => h('div', { class: `card ${c.can ? '' : 'dim'}` },
                h('div', {}, h('span', { class: 'tagx' }, `난이도 ${c.rank}`), ' ', h('b', {}, c.name), c.daily ? h('span', { class: 'tagx' }, '날마다') : null),
                h('span', {}, `${c.by}: "${c.say}"`),
                c.where ? h('span', {}, `어디서: ${c.where}`) : null,
                h('span', {}, `보상: 은화 ${c.silver}, 경험치 ${c.xp}, 명성 ${c.fame}`),
                c.can ? h('button', { class: 'btn sm', type: 'button', 'aria-label': `${c.name} 받기`, onclick: () => act({ type: 'job', op: 'accept', id: c.id }) }, '수락') : h('span', { class: 'warn' }, c.why)))
                : h('p', { class: 'muted' }, '오늘 붙은 것은 다 가져갔다.')),
            h('div', { style: 'display:flex;flex-direction:column;gap:6px;min-width:0' },
              h('span', { class: 'h', style: 'margin-top:0' }, `하고 있는 것 (${mine.length} / 3)`),
              mine.length ? mine.map((j) => h('div', { class: `card ${j.ready ? 'done' : ''}` },
                h('div', {}, h('span', { class: 'tagx' }, `난이도 ${j.rank}`), ' ', h('b', {}, j.name), j.ready ? h('span', { class: 'tagx donetag' }, '완료') : null),
                j.where ? h('span', {}, `어디서: ${j.where}`) : null,
                goBtns(j),
                h('span', {}, `${j.have} / ${j.n}. ${j.left >= 0 ? `${j.left}일 남음` : '기한이 지났다'}`),
                h('div', { class: 'row-btns' },
                  h('button', { class: 'btn sm go', type: 'button', disabled: !j.ready, 'aria-label': `${j.name} 끝내기`, onclick: () => act({ type: 'job', op: 'finish', id: j.id }) }, j.ready ? '완료 보고' : '아직 모자란다'),
                  h('button', { class: 'btn sm', type: 'button', 'aria-label': `${j.name} 그만두기`, onclick: () => act({ type: 'job', op: 'drop', id: j.id }) }, '그만두기'))))
                : h('p', { class: 'muted' }, '받은 의뢰가 없다.'))));
      },
      onClose: () => { drawBook(); refs.slots?.querySelector('button:not([disabled])')?.focus(); },
    });
  }

  // ── 퀘스트 창 (Q3) ──
  const QTABS = [['main', '메인'], ['subs', '서브'], ['jobs', '의뢰'], ['hidden', '히든'], ['done', '완료']];
  function openQuests(startTab = 'main') {
    let qt = startTab;
    wins.open({
      title: '퀘스트', size: 'wide',
      render(body, { rerender, close }) {
        const q = questBook(game);
        const act = (action) => { const ev = run(action, true); if (!ev) return; if (game.choice || game.battle) close(); else rerender(); };
        const count = { main: 1, subs: q.subs.length, jobs: q.jobs.length, hidden: q.hidden.length, done: q.done.length };
        add(body, h('div', { class: 'row-btns', role: 'group', 'aria-label': '갈래' }, QTABS.map(([id, name]) =>
          h('button', { class: `btn sm ${qt === id ? 'on' : ''}`, type: 'button', 'aria-pressed': String(qt === id), 'data-set': `q:${id}`, onclick: () => { qt = id; rerender(); } }, id === 'main' ? name : `${name} ${count[id]}`))));
        if (qt === 'main') {
          const m = q.main;
          add(body,
            h('b', { class: 'serif', style: 'font-size:1.4rem' }, m.name ? `${m.chapter}장. ${m.name}` : '다음 장'),
            h('p', { class: 'serif' }, m.text),
            m.paths.length ? h('span', { class: 'h' }, '길 (하나만 끝내면 장이 끝난다)') : null,
            m.paths.map((p) => h('div', { class: `card ${p.closed ? 'dim' : ''} ${m.nearest && m.nearest.id === p.id ? 'near' : ''}` },
              h('div', {}, h('b', {}, p.name), m.nearest && m.nearest.id === p.id ? h('span', { class: 'tagx' }, '가장 가깝다') : null),
              h('span', {}, p.text),
              p.closed ? h('span', { class: 'muted' }, p.closed) : h('span', {}, `${p.have} / ${p.need}`))),
            m.paths.length ? h('p', { class: 'muted', style: 'font-size:.85rem' }, '적히지 않은 길이 하나 더 있다고들 한다.') : null,
            m.called ? h('div', { class: 'rowx' }, h('span', {}, '호칭'), h('b', {}, m.called)) : null,
            h('span', { class: 'h' }, '들은 말'),
            (game.lore?.hints || []).length
              ? h('div', { class: 'items', style: 'max-height:16rem' }, game.lore.hints.slice().reverse().map((x) => h('div', { class: 'rowx' }, h('span', { class: 'serif' }, `"${x.text}"`), h('small', { class: 'muted', style: 'white-space:nowrap' }, `${x.who}, ${x.ch}장`))))
              : h('p', { class: 'muted', style: 'font-size:.9rem' }, '아직 들은 말이 없다. 사람들의 이야기를 들으면 이야기의 실마리가 여기에 모인다.'));
        } else if (qt === 'subs') {
          add(body, q.subs.length ? q.subs.map((v) => h('div', { class: 'card' },
            h('div', {}, h('b', { class: 'serif', style: 'font-size:1.15rem' }, v.name), h('small', { class: 'muted' }, ` 준 사람: ${v.giver}`)),
            h('span', {}, v.step.text), v.step.goal ? h('span', {}, v.step.goal) : null,
            v.step.choices.length ? (v.step.here ? choiceButtons(v, act) : h('span', { class: 'muted' }, `${v.step.at}에서 정한다`)) : null,
            v.ends.length && !(v.step.choices.length && v.step.here) ? [h('span', { class: 'h' }, '마지막 갈림 (미리 보인다)'), v.ends.map((e) => h('div', { class: 'rowx' }, h('span', {}, e.label), h('span', { class: 'muted' }, e.need || e.free || '조건 없음')))] : null,
            v.more ? h('p', { class: 'muted', style: 'font-size:.85rem' }, '이 이야기의 끝에 무언가 더 있을지도 모른다.') : null))
            : h('p', { class: 'muted' }, '받은 서브 퀘스트가 없다. 줄 일이 있는 사람은 방 목록의 이름 옆에 숫자가 뜬다.'));
        } else if (qt === 'jobs') {
          add(body, q.jobs.length ? q.jobs.map((j) => h('div', { class: `card ${j.ready ? 'done' : ''}` }, h('div', {}, h('span', { class: 'tagx' }, `난이도 ${j.rank}`), ' ', h('b', {}, j.name), j.ready ? h('span', { class: 'tagx donetag' }, '완료') : null), h('span', {}, j.what), j.ready ? h('span', { class: 'good' }, '다 모았다. 의뢰 게시판에 알리면 끝난다.') : [j.where ? h('span', {}, `어디서: ${j.where}`) : null, goBtns(j)], h('span', {}, `${j.have} / ${j.n}. ${j.left}일 남음. 보상: 은화 ${j.silver}, 경험치 ${j.xp}, 명성 ${j.fame}`)))
            : h('p', { class: 'muted' }, '받은 의뢰가 없다. 광장의 게시판에서 받는다.'), h('div', { class: 'rowx' }, h('span', {}, '지금까지 끝낸 의뢰'), h('b', {}, q.jobsDone)));
        } else if (qt === 'hidden') {
          add(body, q.hidden.length ? q.hidden.map((x) => h('div', { class: 'card mint' }, h('b', { class: 'serif', style: 'font-size:1.15rem' }, x.name), h('span', {}, `찾은 까닭: ${x.why}`), x.step ? [h('span', {}, x.step.text), x.step.goal ? h('span', {}, x.step.goal) : null] : h('span', {}, '받을지 정해야 한다.')))
            : h('p', { class: 'muted' }, '찾아낸 것이 없다.'));
        } else {
          add(body, q.done.length ? q.done.map((x) => h('div', { class: `rowx ${x.mint ? 'mintrow' : ''}` }, h('span', {}, h('span', { class: 'tagx' }, x.kind), ' ', x.name), h('span', {}, x.how)))
            : h('p', { class: 'muted' }, '아직 끝낸 것이 없다.'));
        }
      },
      onClose: () => { drawBook(); refs.slots?.querySelector('button:not([disabled])')?.focus(); },
    });
  }

  // ── 칭호창 (G3-1, G3-2) ──
  function openTitles() {
    wins.open({
      title: '칭호', size: 'mid',
      render(body, { rerender }) {
        const list = titleView(game);
        const inTown = !placeById(game.place).wild;
        const act = (action) => { if (run(action, true)) rerender(); };
        add(body,
          h('p', { class: 'muted', style: 'font-size:.9rem' }, `얻은 칭호의 효과는 모두 늘 붙는다. 다는 것은 이름 앞에 보이는 하나뿐이고, 마을에서만 바꾼다.${inTown ? '' : ' 지금은 마을 밖이라 바꿀 수 없다.'}`),
          list.map((t) => t.got
            ? h('div', { class: `card ${t.worn ? 'near' : ''}` },
              h('div', {}, h('b', { class: 'serif', style: 'font-size:1.15rem' }, t.name), t.worn ? h('span', { class: 'tagx' }, '달고 있다') : null),
              h('span', {}, t.effect), h('span', { class: 'muted' }, `얻은 까닭: ${t.why} (${t.day}일째)`),
              h('button', { class: 'btn sm', type: 'button', disabled: !inTown, 'aria-label': t.worn ? `${t.name} 떼기` : `${t.name} 달기`, onclick: () => act({ type: 'title', id: t.worn ? null : t.id }) }, t.worn ? '해제' : '장착'))
            : h('div', { class: 'card dim' }, h('b', {}, '???'), h('span', {}, `귀띔: ${t.hint}`))));
      },
      onClose: () => { drawBook(); refs.slots?.querySelector('button:not([disabled])')?.focus(); },
    });
  }

  // ── 도감 (G3-3 ~ G3-6, X2-4 ~ X2-6) ──
  const DTABS = [['people', '사람'], ['mon', '괴물'], ['item', '물건'], ['recipe', '레시피'], ['place', '장소'], ['stat', '히든 스탯'], ['hq', '히든 퀘스트'], ['job', '직업'], ['first', '최초 발견']];
  const MON_ART = { boar: ['boar', 'boar-shadow'] };
  function openDex(startTab = 'people') {
    let dt = startTab;
    wins.open({
      title: '도감', size: 'wide', side: '겪은 만큼만 적힌다',
      render(body, { rerender }) {
        add(body, h('div', { class: 'row-btns', role: 'group', 'aria-label': '갈래' }, DTABS.filter(([id]) => id !== 'stat' || knowsHidden()).map(([id, name]) =>
          h('button', { class: `btn sm ${dt === id ? 'on' : ''}`, type: 'button', 'aria-pressed': String(dt === id), 'data-set': `d:${id}`, onclick: () => { dt = id; rerender(); } }, name))));
        const none = (t) => h('p', { class: 'muted' }, t);
        if (dt === 'people') {
          const list = peopleDex(game);
          add(body, list.length ? list.map((p) => h('div', { class: 'card' },
            h('div', {}, h('b', {}, p.name), h('small', { class: 'muted' }, ` ${p.place}`), h('span', { class: 'tagx' }, p.bond)),
            h('span', {}, `좋아하는 것: ${p.likes.length ? p.likes.join(', ') : '아직 모른다'}`),
            h('span', {}, `싫어하는 것: ${p.dislikes.length ? p.dislikes.join(', ') : '아직 모른다'}`),
            h('span', {}, `겪어 본 속: ${p.stats.length ? p.stats.join(', ') : '아직 모른다'}`))) : none('아직 말을 섞은 사람이 없다.'));
        } else if (dt === 'mon') {
          const list = Object.entries(game.dex.mon);
          add(body, list.length ? list.map(([id, d]) => {
            const m = monsterDef(id);
            const won = (d.won || 0) > 0;
            const art = MON_ART[id];
            return h('div', { class: `card ${won ? '' : 'dim'}`, style: 'flex-direction:row;gap:12px;align-items:center' },
              settings.art ? (art ? pixel(won ? art[0] : art[1], won ? `${m.name} 그림` : '그림자', 64, 64) : (won ? null : h('span', { class: 'monbox', 'aria-hidden': 'true' }))) : null,
              h('div', { style: 'display:flex;flex-direction:column' },
                h('b', {}, won ? `${m.name} (레벨 ${m.level})` : '이름 모를 것 (그림자만 보았다)'),
                h('span', {}, `마주침 ${d.seen || 0}, 이김 ${d.won || 0}, 짐 ${d.lost || 0}`),
                d.elems ? h('span', {}, Object.entries(d.elems).map(([k, v]) => `${k.split('>')[1]} 속성일 때 ${k.split('>')[0]}은 ${v > 1 ? '잘 듣는다' : '잘 듣지 않는다'}`).join('. ')) : null,
                won ? h('span', {}, `떨어뜨리는 것: ${m.drops.filter((x) => game.dex.items[x.id]).map((x) => itemDef(x.id).name).join(', ') || '아직 모른다'}`) : null,
                (d.won || 0) >= 10 ? h('span', {}, `하는 짓: ${m.moves.map((x) => `${x.name}(${x.tell})`).join(' ')}`) : won ? h('span', { class: 'muted' }, '하는 짓은 열 번 이기면 모두 적힌다.') : null));
          }) : none('아직 마주친 것이 없다.'));
        } else if (dt === 'item') {
          const ids = Object.keys(game.dex.items);
          add(body, ids.length ? h('div', { class: 'items', style: 'max-height:24rem' }, ids.map((id) => h('div', { class: 'traderow' }, icon({ id, grade: ITEMS[id].grade || 0 }), h('span', { class: 'grow' }, h('b', {}, ITEMS[id].name), h('br'), h('small', { class: 'muted' }, ITEMS[id].desc))))) : none('아직 가져 본 것이 없다.'));
        } else if (dt === 'recipe') {
          const made = Object.values(RECIPES).filter((r) => game.dex.items[r.makes]);
          add(body, made.length ? made.map((r) => h('div', { class: 'card' }, h('b', {}, r.name), h('span', {}, `재료: ${r.needs.map((n) => `${itemDef(n.id).name} ${n.n}`).join(', ')}. 망치질 ${r.hits}번.`))) : none('아직 만들어 본 것이 없다.'));
        } else if (dt === 'place') {
          add(body, Object.keys(game.dex.places).map((id) => h('div', { class: 'rowx' }, h('span', {}, PLACES[id].name), h('span', { class: 'muted' }, PLACES[id].wild ? `위험도 ${PLACES[id].danger}, 권장 레벨 ${PLACES[id].levels}` : PLACES[id].town))));
        } else if (dt === 'stat') {
          add(body, h('p', { class: 'muted' }, `찾은 것 ${foundCount(game)} / ${hiddenTotal(game)}. 이 갈래만 모두 몇 칸인지 보인다.`),
            hiddenSlots(game).map((x) => x.found ? h('div', { class: 'hid found' }, h('b', {}, `${x.name} ${x.value}`), h('span', {}, x.effect))
              : h('div', { class: 'hid unk' }, h('b', {}, x.open ? `${x.name}: ${x.have} / ${x.need}` : x.half ? '??? 무언가 쌓이고 있다' : '???'), x.open ? h('span', {}, `${x.how}. ${x.effect}`) : null, x.hints.map((t) => h('span', {}, `귀띔: ${t}`)))));
        } else if (dt === 'hq') {
          const list = hiddenView(game);
          add(body, list.length ? list.map((x) => h('div', { class: 'card mint' }, h('b', {}, x.name), h('span', {}, `나타난 꼴: ${x.kind}. 찾은 까닭: ${x.why}`), h('span', {}, { offered: '받을지 정해야 한다', active: '하고 있다', done: '끝냈다', declined: '거절했다. 다시 오지 않는다' }[x.status]))) : none('찾은 것도 놓친 것도 아직 없다.'));
        } else if (dt === 'job') {
          add(body, h('div', { class: 'rowx' }, h('span', {}, '직업'), h('span', {}, jobName(game))), h('div', { class: 'rowx' }, h('span', {}, '생산 직업'), h('span', {}, WORK_NAMES[game.work] || '없음')),
            hiddenJobTraces(game).map((x) => h('div', { class: 'card mint' }, h('b', {}, x.name), h('span', {}, `찾은 까닭: ${x.why}`), h('span', {}, { offered: '받을지 정해야 한다', taken: '받았다', declined: '거절했다. 다시 오지 않는다' }[x.status]))));
        } else add(body, none('세상에서 처음 찾아낸 것은 아직 없다.'));
      },
      onClose: () => refs.slots?.querySelector('button:not([disabled])')?.focus(),
    });
  }

  // ── 지난 알림 (G4-5, G4-6) ──
  const PAST_CATS = ['모두', '숙련도', '스탯', '레벨', '제작', '퀘스트', '사람'];
  const catOf = (d) => (d.kind === 'levelup' ? '레벨' : d.kind === 'craft' || d.kind === 'legend' ? '제작' : d.kind === 'hiddenquest' || d.kind === 'main' ? '퀘스트' : ['bond', 'fame', 'title', 'faction', 'companion'].includes(d.kind) ? '사람' : ['job', 'hiddenjob', 'first'].includes(d.kind) ? '퀘스트' : d.title.includes('숙련도') || d.title.includes('길을 골랐') ? '숙련도' : '스탯');
  function openPast() {
    let cat = '모두';
    let picked = null;
    wins.open({
      title: '알림 기록', size: 'wide',
      render(body, { rerender }) {
        const list = game.dings.filter((d) => cat === '모두' || catOf(d) === cat).slice().reverse();
        const days = [...new Set(list.map((d) => d.day))];
        const sel = list.find((d) => d.id === picked) || null;
        add(body,
          h('div', { class: 'row-btns', role: 'group', 'aria-label': '갈래' }, PAST_CATS.map((c) => h('button', { class: `btn sm ${cat === c ? 'on' : ''}`, type: 'button', 'aria-pressed': String(cat === c), 'data-set': `p:${c}`, onclick: () => { cat = c; rerender(); } }, c))),
          h('div', { class: 'cols' },
            h('div', { class: 'items', style: 'max-height:24rem' }, list.length ? days.map((day) => [h('span', { class: 'h' }, `${day}일째`), list.filter((d) => d.day === day).map((d) =>
              h('button', { class: `it ${picked === d.id ? 'on' : ''}`, type: 'button', 'aria-pressed': String(picked === d.id), onclick: () => { picked = d.id; rerender(); } }, h('small', {}, `${DING_LEVELS[d.level]}:`), h('span', { class: 'grow' }, d.title)))]) : h('p', { class: 'muted' }, '이 갈래의 알림은 아직 없다.')),
            sel ? h('div', { class: 'detail' },
              h('span', { class: 'tagx' }, DING_LEVELS[sel.level]), h('b', { class: 'serif', style: 'font-size:1.2rem' }, sel.title),
              sel.body ? h('span', {}, sel.body) : null, sel.reason ? h('span', {}, `얻은 까닭: ${sel.reason}`) : null,
              h('span', { class: 'muted' }, `${sel.day}일째 ${PHASES[sel.phase]}, ${PLACES[sel.place]?.name || ''}에서`),
              h('span', { class: 'h' }, '그때의 대화방'),
              sel.context.length ? sel.context.map((l) => h('p', { class: 'serif', style: 'font-size:.95rem' }, l.who ? `${l.who}: ${l.text}` : l.text)) : h('p', { class: 'muted' }, '남은 줄이 없다.'))
              : h('div', { class: 'detail' }, h('p', { class: 'muted' }, '알림을 고르면 얻은 까닭과 그때의 대화방이 보인다.'))));
      },
      onClose: () => refs.slots?.querySelector('button:not([disabled])')?.focus(),
    });
  }

  // ── 상태창과 스킬창 (G2) ──
  function openStatus() {
    wins.open({
      title: '상태창', size: 'wide', render(body, { rerender }) {
        const slots = hiddenSlots(game);
        const left = h('div', { style: 'display:flex;flex-direction:column' },
          h('div', { style: 'display:flex;justify-content:space-between;align-items:baseline' }, h('b', { class: 'serif', style: 'font-size:1.5rem' }, game.name), h('span', {}, `레벨 ${game.level}`)),
          h('div', { class: 'rowx' }, h('span', {}, '출신'), h('span', {}, originById(game.origin).name)),
          h('div', { class: 'rowx' }, h('span', {}, '직업'), h('span', {}, jobName(game))),
          h('div', { class: 'rowx' }, h('span', {}, '생산 직업'), h('span', {}, WORK_NAMES[game.work] || '없음')),
          h('div', { class: 'rowx' }, h('span', {}, '은화'), h('span', {}, game.silver)),
          h('span', { class: 'h' }, `기본 스탯 (남은 점수 ${game.unspent})`),
          Object.keys(STAT_NAMES).map((key) => h('div', { class: 'statline' },
            h('span', {}, h('b', {}, STAT_NAMES[key]), ` ${game.stats[key]} `, h('span', { class: 'muted', style: 'font-size:.82rem' }, STAT_USES[key])),
            game.unspent > 0 ? h('button', { class: 'pm', type: 'button', 'aria-label': `${STAT_NAMES[key]} 올리기`, onclick: () => { run({ type: 'spend', stat: key }); if (game) rerender(); } }, '+') : null)),
          h('span', { class: 'h' }, '능력치 (누르면 계산식)'),
          derived(game).map((d) => {
            const out = h('div', { class: 'muted', style: 'font-size:.85rem;padding:4px 8px;background:var(--sand)', hidden: true }, formula(d));
            return [h('button', { class: 'rowx', type: 'button', style: 'border:0;border-bottom:1px dashed var(--line2);background:none;width:100%;text-align:left', 'aria-expanded': 'false',
              onclick: (e) => { out.hidden = !out.hidden; e.currentTarget.setAttribute('aria-expanded', String(!out.hidden)); } }, h('span', {}, d.name), h('b', {}, d.value)), out];
          }));
        const right = h('div', { style: 'display:flex;flex-direction:column;gap:6px' },
          !knowsHidden() ? null : h('span', { class: 'h', style: 'margin-top:0' }, `히든 스탯 (찾은 것 ${foundCount(game)} / ${hiddenTotal(game)})`),
          !knowsHidden() ? [] : slots.map((x) => x.found
            ? h('div', { class: 'hid found' }, h('b', {}, `${x.name} ${x.value}`), h('span', {}, x.effect), h('span', {}, `오르는 법: ${x.how}`))
            : h('div', { class: 'hid unk' }, h('b', {}, x.open ? `${x.name}: ${x.have} / ${x.need}` : x.half ? '??? 무언가 쌓이고 있다' : '???'), x.open ? h('span', {}, `${x.how}. ${x.effect}`) : null,
              x.hints.length ? x.hints.map((t) => h('span', {}, `귀띔: ${t}`)) : h('span', {}, x.half ? '무엇인지는 아직 모른다.' : '아직 아무 귀띔도 듣지 못했다.'))),
          knowsHidden() ? h('p', { class: 'muted', style: 'font-size:.85rem' }, '히든 스탯은 레벨업 점수로 올릴 수 없다. 행동으로만 오른다.') : null,
          h('span', { class: 'h' }, '전투 태세'),
          h('div', { class: 'row-btns', role: 'group', 'aria-label': '전투 태세' }, Object.values(STANCES).map((st) =>
            h('button', { class: `btn sm ${stanceOf(game).id === st.id ? 'on' : ''}`, type: 'button', 'aria-pressed': String(stanceOf(game).id === st.id), disabled: !!game.battle, onclick: () => { if (run({ type: 'stance', id: st.id }, true)) rerender(); } }, `${st.name} (${STAT_NAMES[st.stat]})`))),
          h('p', { class: 'muted', style: 'font-size:.88rem' }, `${stanceOf(game).text} 싸움의 셋째 칸이 이 태세로 한 턴을 쓴다. 그렇게 싸울수록 '${SKILL_NAMES[stanceOf(game).skill]}' 숙련도가 오른다.`),
          h('span', { class: 'h' }, '세력과 성향'),
          factionView(game).map((f) => h('div', { class: 'rowx' }, h('span', {}, f.name, h('small', { class: 'muted' }, ` 맞수: ${f.rival}`)), h('span', {}, f.known ? `${f.standing} (${f.pts})` : '아직 엮인 적 없다'))),
          h('div', { class: 'rowx' }, h('span', {}, '성향'), h('span', {}, leanName(game))));
        add(body,h('div', { class: 'cols' }, left, right));
      },
      onClose: () => { drawBook(); refs.pg.querySelector('button')?.focus(); },
    });
  }

  /** 싸우는 중에 쓸 스킬을 고른다. 마나가 모자란 것은 꺼진다. 고르면 바로 쓰고 창을 닫는다 */
  function openSkillPick() {
    wins.open({
      title: '스킬', side: `마나 ${game.mp} / ${bodyView(game).maxMp}`, sheet: true,
      render(body, { close }) {
        // 단축 칸에 등록한 스킬이 맨 위에 온다
        const list = skillsNow(game).filter((x) => x.open).sort((a, b) => (b.id === game.quick) - (a.id === game.quick));
        add(body, h('div', { class: 'col-btns' }, list.map((sk, i) => {
          const short = game.mp < sk.mp;
          return h('button', { class: `btn ${i === 0 && !short ? 'go' : ''}`, type: 'button', disabled: short, 'data-autofocus': i === 0 || null,
            onclick: () => { close(); run({ type: 'battle', choice: 'skill', index: sk.id }); } },
            `${sk.name} (마나 ${sk.mp})`, h('small', { class: 'sub' }, short ? '마나가 모자란다' : sk.text));
        })));
      },
      onClose: () => refs.slots?.querySelector('button:not([disabled])')?.focus(),
    });
  }

  function openSkills() {
    wins.open({
      title: '스킬창', size: 'mid', render(body, { rerender }) {
        add(body,
          h('span', { class: 'h', style: 'margin-top:0' }, '숙련도'),
          skillRows(),
          h('div', { class: 'sk', style: 'border-bottom:0' }, h('span', { class: 'muted' }, '???'), h('div', { class: 'bar' }), h('span', { class: 'muted' }, '안 해 본 일')),
          h('span', { class: 'h' }, '직업 스킬'),
          game.job ? (skillsNow(game).length ? skillsNow(game).map((sk) => h('div', { class: `card ${sk.open ? '' : 'dim'}` },
            h('div', {}, h('b', {}, sk.name), h('small', { class: 'muted' }, ` 마나 ${sk.mp}`), (game.quick || skillsNow(game).find((x) => x.open)?.id) === sk.id ? h('span', { class: 'tagx' }, '단축 칸에 놓임') : null),
            h('span', {}, sk.text),
            sk.open ? ((game.quick || skillsNow(game).find((x) => x.open)?.id) === sk.id ? null : h('button', { class: 'btn sm', type: 'button', 'aria-label': `단축 칸에 놓기: ${sk.name}`, onclick: () => { if (run({ type: 'quick', id: sk.id }, true)) rerender(); } }, '단축 칸 등록')) : h('span', { class: 'muted' }, `레벨 ${sk.at}에 열린다`)))
            : h('p', { class: 'muted' }, `${jobName(game)}에게는 싸움 스킬이 없다.`))
            : h('p', { class: 'muted' }, canChooseJob(game) ? '직업이 없다. 상태 탭에서 직업을 고를 수 있다.' : '직업이 없다. 직업은 레벨 5에 고른다.'),
          h('span', { class: 'h' }, '단축 칸'),
          h('p', {}, '방마다 할 수 있는 일이 아래 다섯 칸에 저절로 놓인다. 숫자 키 1~5로 누른다. 누르고 있어도 한 번만 한다.'));
      },
    });
  }

  // ── 저장과 설정 (G4) ──
  function setSetting(key, value) {
    settings = { ...settings, [key]: value };
    saveSettings(storage, settings);
    applySettings(settings);
    if (key === 'assist') { assist = createAssist(value); held = -1; drawAssist(); }
    if (game && refs.strip) { drawStrip(); drawBook(); }
    void slotFor;
  }

  function openSettings() {
    wins.open({
      title: '저장과 설정', size: 'mid', onClose: () => { settingsRerender = null; if (!game && root.querySelector('main.title')) showTitle(); }, render(body, { rerender, close }) {
        settingsRerender = rerender;
        if (game) {
          add(body,
            h('span', { class: 'h', style: 'margin-top:0' }, '저장 (이 기기 안에 남는다)'),
            h('div', { class: 'slot main' }, h('span', {}, h('b', {}, game.name), `, ${jobName(game)}, 레벨 ${game.level}`, h('br'), h('span', { class: 'muted', style: 'font-size:.88rem' }, `${slot + 1}번 칸. ${whenLabel(game)}, ${placeById(game.place).name}`))),
            h('div', { class: 'row-btns' },
              h('button', { class: 'btn', type: 'button', onclick: () => { autosave(); exportSlot(slot, game.name); } }, '파일로 내보내기'),
              // 캐릭터 지우기: 경고 창을 두 번 거친다 (사용자 요청)
              h('button', { class: 'btn', type: 'button', onclick: () => { autosave(); close(); deleteCharacter(); } }, '캐릭터 지우기')),
            h('p', { class: 'muted', style: 'font-size:.85rem' }, '무엇이든 한 번 할 때마다 저절로 저장된다. 되돌려 다시 하는 저장은 없다.'));
        }
        // 구글 드라이브 (Z44)
        const cs = cloud.status;
        const busy = cs === 'busy';
        const tryIn = () => cloud.signIn().catch((e) => notice('구글 로그인', e.message));
        add(body,
          h('span', { class: 'h', style: game ? '' : 'margin-top:0' }, '구글 드라이브'),
          cs === 'off'
            ? [h('p', { class: 'muted', style: 'font-size:.85rem' }, '로그인하면 저장이 드라이브에도 남아 다른 기기에서 이어 할 수 있다. 게임이 쓰는 숨은 폴더에만 넣고, 다른 파일은 보지 못한다. ', h('a', { href: 'privacy.html', target: '_blank', rel: 'noopener' }, '개인정보처리방침')),
              h('div', { class: 'row-btns' }, h('button', { class: 'btn go', type: 'button', onclick: tryIn }, '구글로 로그인'))]
            : [h('div', { class: 'setrow' }, h('span', {}, '연결'), h('span', { class: `cloudtag ${cs === 'on' ? '' : 'warn'}`, role: 'status' }, { on: '연결됨', busy: cloud.message || '맞추는 중', expired: '로그인이 풀림', error: '오류' }[cs])),
              cloud.log.length ? h('div', { class: 'setrow' }, h('span', {}, '최근 올린 것'),
                h('div', { class: 'uplog' }, cloud.log.map((x) => h('span', {}, `${ago(x.at).replace('방금 저장됨', '방금 전')} · ${x.slot + 1}번 칸 ${x.name}, 레벨 ${x.level}, ${x.day}일째`)))) : null,
              cs === 'error' || cs === 'expired' ? h('p', { class: 'muted', style: 'font-size:.85rem' }, cloud.message) : null,
              h('div', { class: 'row-btns' },
                cs === 'expired' || cs === 'error' ? h('button', { class: 'btn go', type: 'button', onclick: tryIn }, '다시 연결') : null,
                game ? h('button', { class: 'btn', type: 'button', disabled: busy || cs !== 'on', onclick: () => { autosave(); cloud.upNow(slot); } }, '지금 올리기') : null,
                h('button', { class: 'btn', type: 'button', disabled: busy, onclick: () => cloud.signOut() }, '로그아웃')),
              h('p', { class: 'muted', style: 'font-size:.85rem' }, '무엇이든 한 번 할 때마다 이 기기에 저장되고, 몇 초 뒤 드라이브에도 올라간다. 드라이브에도 칸마다 가장 나중 것 하나만 둔다.')]);
        for (const group of SETTING_GROUPS) {
          add(body,h('span', { class: 'h' }, group.title));
          for (const row of group.rows) {
            add(body,h('div', { class: 'setrow', role: 'group', 'aria-label': row.label }, h('span', {}, row.label),
              h('div', { class: 'row-btns' }, row.options.map(([value, label]) =>
                h('button', { class: `btn ${settings[row.key] === value ? 'on' : ''}`, type: 'button', 'aria-pressed': String(settings[row.key] === value), 'data-set': `${row.key}:${value}`,
                  onclick: () => { setSetting(row.key, value); rerender(); document.querySelector(`[data-set="${row.key}:${value}"]`)?.focus(); if (row.key === 'sound') playDing(2, value); } }, label)))));
          }
        }
        const errors = readErrors(storage);
        add(body,
          h('span', { class: 'h' }, '오류 기록'),
          h('div', { class: 'setrow' }, h('span', {}, `${errors.length}개`),
            h('div', { class: 'row-btns' }, errors.length ? h('button', { class: 'btn', type: 'button', onclick: () => { clearErrors(storage); rerender(); } }, '기록 지우기') : h('span', { class: 'muted' }, '남은 오류가 없다'))),
          errors.slice(-3).map((e) => h('p', { class: 'muted', style: 'font-size:.82rem' }, `${e.where}: ${e.message}`)));
      },
    });
  }

  // ── 도움말 (H2) ──
  function openHelp(topicId = 'screen') {
    let current = topicId;
    wins.open({
      title: '도움말', size: 'wide', render(body, { rerender }) {
        const topic = HELP.find((t) => t.id === current) || HELP[0];
        body.style.padding = '0';
        add(body,h('div', { class: 'helpgrid' },
          h('nav', { 'aria-label': '도움말 갈래' }, HELP.map((t) =>
            h('button', { type: 'button', 'aria-pressed': String(t.id === topic.id), 'data-help': t.id, onclick: () => { current = t.id; rerender(); document.querySelector(`[data-help="${t.id}"]`)?.focus(); } },
              settings.art && t.icon ? pixel(t.icon, '', 24, 24) : null, h('span', {}, t.title)))),
          h('article', {},
            settings.art && topic.art ? h('div', { class: 'helpart', 'aria-hidden': 'true' }, pixel(topic.art, '', 384, 96)) : null,
            h('h2', {}, topic.title),
            topic.lead ? h('p', { class: 'helplead' }, topic.lead) : null,
            // 한 문단이 한 줄. 화면에 보이는 이름("잠자기" 같은 것)은 굵게 해서 눈에 걸리게 한다
            h('ul', { class: 'helplist' }, topic.body.map((p) => h('li', {}, p.split(/"([^"]+)"/).map((part, i) => (i % 2 ? h('b', {}, part) : part))))),
            h('div', { class: 'helpnext' },
              (() => { const i = HELP.indexOf(topic); const prev = HELP[i - 1], next = HELP[i + 1]; const go = (t) => () => { current = t.id; rerender(); document.querySelector('.helpgrid article')?.scrollIntoView({ block: 'start' }); document.querySelector(`[data-help="${t.id}"]`)?.focus(); };
                return [prev ? h('button', { class: 'btn sm', type: 'button', onclick: go(prev) }, `이전: ${prev.title}`) : h('span', {}), next ? h('button', { class: 'btn sm go', type: 'button', onclick: go(next) }, `다음: ${next.title}`) : h('span', {})]; })()))));
      },
    });
  }

  // ── 키 ──
  document.addEventListener('keydown', (e) => {
    // 무엇을 할지는 규칙(press.js)이 정한다. 화면은 따르기만 한다.
    const d = keyDecision(guard, {
      code: e.code, key: e.key, repeat: e.repeat,
      onButton: !!e.target.closest?.('button'), onInput: !!e.target.matches?.('input, textarea'),
      windowOpen: wins.isOpen(), modifier: e.ctrlKey || e.metaKey || e.altKey, inGame: !!game,
    });
    if (d.prevent) e.preventDefault();
    if (d.slot >= 0) { held = d.slot; pressDown(d.slot); }
    if (e.key === 'Escape' && !wins.isOpen()) closeDrawers();
  });
  document.addEventListener('keyup', (e) => { guard.up(e.code); const i = slotIndex(e.code); if (i >= 0) releaseHold(i); });
  globalThis.addEventListener('blur', () => { guard.reset(); if (assist.mode === 'hold') { assist.stop(); held = -1; drawAssist(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden) autosave(); });
  globalThis.addEventListener('beforeunload', autosave);

  showTitle();
  return { getGame: () => game, getSettings: () => settings };
}
