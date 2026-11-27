// 시스템 창 (D3). 한 번에 하나가 보이고, 나머지는 줄을 선다.
// 창이 떠 있는 동안 초점은 창 안에 머문다. Esc로 닫는다.

import { h, focusables } from './dom.js?v=8bcdbdb';

/** 다시 그린 뒤에도 같은 단추를 찾을 수 있게 하는 이름표. */
function tagOf(el) {
  if (!el || !el.getAttribute) return null;
  return el.getAttribute('aria-label') || el.dataset.set || el.dataset.help || el.textContent || null;
}

export function createWindows(root) {
  const queue = [];
  const under = []; // 위에 다른 창이 떠서 잠깐 가려진 창들
  let current = null;
  const veil = h('div', { class: 'veil', hidden: true });
  root.append(veil);

  function grab(tag) {
    const list = focusables(veil);
    const same = tag ? list.find((el) => tagOf(el) === tag && !el.closest('.wt')) : null;
    (same || veil.querySelector('[data-autofocus]') || list.find((el) => !el.closest('.wt')) || list[0])?.focus();
  }

  // 초점이 창 밖으로 떨어져도 Esc와 Tab이 듣도록 문서에서 듣는다.
  document.addEventListener('keydown', (e) => {
    if (!current) return;
    if (e.key === 'Escape') { e.preventDefault(); if (!current.noClose) close(); return; }
    if (!veil.contains(document.activeElement)) {
      if (e.key === 'Tab') e.preventDefault();
      grab();
      return;
    }
    if (e.key !== 'Tab') return;
    const list = focusables(veil);
    if (!list.length) return;
    const first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }, true);
  // 창 바깥의 어두운 곳을 눌러도 초점은 창 안에 남는다.
  veil.addEventListener('mousedown', (e) => { if (e.target === veil) { e.preventDefault(); grab(); } });

  function show(spec) {
    current = spec;
    spec.returnTo = spec.returnTo || document.activeElement;
    const body = h('div', { class: 'wb' });
    spec.body = body;
    const win = h('section', { class: `win ${spec.size || ''} ${spec.sheet ? 'sheet' : ''}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': spec.title },
      h('div', { class: `wt ${spec.honey ? 'honey' : ''} ${spec.dark ? 'dark' : ''}` },
        h('span', {}, spec.title),
        spec.side ? h('span', { style: 'font-weight:400' }, spec.side) : null,
        spec.noClose ? null : h('button', { type: 'button', onclick: () => close(spec) }, '닫기')),
      body);
    const ctx = {
      // 이 창을 닫는다. 위에 다른 창(띠링 같은)이 떠 있어도 그 창이 아니라 이 창이 닫힌다.
      close: () => close(spec),
      rerender() {
        if (current !== spec) return; // 가려져 있으면 다시 보일 때 그린다
        const tag = veil.contains(document.activeElement) ? tagOf(document.activeElement) : null;
        // 다시 그려도 보던 자리를 지킨다 (판 뒤 스크롤이 위로 튀어 사는 칸을 잘못 누르던 것)
        const scrolls = [body, ...body.querySelectorAll('*')].filter((el) => el.scrollTop > 0).map((el) => [el === body ? null : tagOf(el) || el.className, el.scrollTop]);
        const top = body.scrollTop;
        body.replaceChildren();
        spec.render(body, ctx);
        body.scrollTop = top;
        for (const [key, y] of scrolls) if (key) { const el = [...body.querySelectorAll('*')].find((x) => (tagOf(x) || x.className) === key); if (el) el.scrollTop = y; }
        if (!veil.contains(document.activeElement)) grab(tag);
      },
    };
    spec.render(body, ctx);
    if (current !== spec) return; // 그리다가 스스로 닫았다
    veil.replaceChildren(win);
    veil.hidden = false;
    // 가려졌다 다시 보이는 창은 보던 자리로 (확인 창을 닫고 상점으로 돌아올 때)
    if (spec.scrollTop) { body.scrollTop = spec.scrollTop; spec.scrollTop = 0; }
    grab();
  }

  function close(target) {
    if (!current) return;
    if (target && target !== current) {
      // 가려져 있거나 줄 서 있는 창을 닫는다. 맨 위 창은 그대로 둔다.
      let i = under.indexOf(target);
      if (i >= 0) under.splice(i, 1);
      else { i = queue.indexOf(target); if (i < 0) return; queue.splice(i, 1); }
      if (target.onClose) target.onClose();
      return;
    }
    const done = current;
    current = null;
    veil.hidden = true;
    veil.replaceChildren();
    if (done.onClose) done.onClose();
    if (current) return; // onClose가 새 창을 띄웠다
    // 줄 선 알림이 있으면 그것부터(차례대로), 그다음 가려졌던 창을 다시 그려 보인다
    if (queue.length && (queue[0].notice || !under.length)) show(queue.shift());
    else if (under.length) show(under.pop());
    else if (done.returnTo && document.contains(done.returnTo)) done.returnTo.focus();
  }

  return {
    /** 창을 띄운다. 이미 떠 있으면 줄을 세운다. */
    open(spec) {
      // over: 지금 뜬 창에서 띄운 창(확인, 알림). 줄을 서지 않고 바로 위에 뜬다.
      // 알림 위에 알림을 겹치지 않는다. 뜬 차례대로 보이게 줄을 세운다.
      if (current && spec.over && !(current.notice && spec.notice)) { current.scrollTop = current.body?.scrollTop || 0; under.push(current); show({ ...spec, returnTo: current.returnTo }); }
      else if (current) queue.push({ ...spec, returnTo: current.returnTo });
      else show(spec);
    },
    close,
    /** 뜬 창, 가려진 창, 줄 선 창을 모두 걷는다 (화면이 바뀔 때). */
    closeAll() {
      queue.length = 0;
      under.length = 0;
      current = null;
      veil.hidden = true;
      veil.replaceChildren();
    },
    isOpen: () => !!current,
    pending: () => queue.length,
  };
}
