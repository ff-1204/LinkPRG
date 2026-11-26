// 작은 DOM 도우미. 화면은 모두 표준 버튼·제목으로 짓는다 (M1-1).

export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

function nodes(kids) {
  return kids.flat(Infinity).filter((k) => k != null && k !== false).map((k) => (k.nodeType ? k : document.createTextNode(String(k))));
}

/** 안을 비우고 다시 채운다. 배열이 섞여 있어도 펴서 넣는다. */
export function fill(el, ...kids) {
  el.replaceChildren(...nodes(kids));
  return el;
}

/** 뒤에 덧붙인다. 배열이 섞여 있어도 펴서 넣는다. */
export function add(el, ...kids) {
  el.append(...nodes(kids));
  return el;
}

/** 픽셀 그림. alt가 비면 꾸밈으로 보고 화면읽기가 건너뛴다 (X1-2). */
export function pixel(name, alt, width, height) {
  return h('img', { class: 'px', src: `art/pixel/out/${name}.png`, alt: alt || '', width, height });
}

export function focusables(root) {
  return [...root.querySelectorAll('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')];
}
