// 마일스톤이나 세부 항목이 끝났을 때 기획 문서를 한꺼번에 고친다.
// 쓰는 법: node tools/plan-done.cjs <설정.json>
// 설정: { "milestone": "M1", "closeMilestone": true, "rows": ["M1-1", ...], "checklist": ["F01-05", ...],
//         "steps": { "01": [1,2,3,4] }, "pieces": { "05-4": ["F01-09","F01-03"] }, "note": "한 줄" }
//  - steps: 그 페르소나의 그 단계 전체가 이제 된다(✅로 바꾼다)
//  - pieces: 단계의 일부만 된다. 적은 번호만 ✅ 조각으로 떼어 내고 나머지는 🔜로 남긴다
const fs = require('fs'), cp = require('child_process'), path = require('path'), os = require('os');
const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const score = path.join(os.homedir(), '.claude', 'skills', 'haejo', 'scripts', 'score.js');
const d = new Date(), p = (n) => String(n).padStart(2, '0');
const stamp = (plus = 0) => { const t = new Date(d.getTime() + plus * 60000); return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())} ${p(t.getHours())}:${p(t.getMinutes())}`; };
const day = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, md = `${p(d.getMonth() + 1)}-${p(d.getDate())}`;
const read = (f) => fs.readFileSync(f, 'utf8'), write = (f, s) => fs.writeFileSync(f, s);
const head = (s, what, plus) => s.replace(/^> 갱신: .*$/m, `> 갱신: ${stamp(plus)} (${what})`);
const M = cfg.milestone;

// 1. 로드맵: 세부 항목과 마일스톤
let road = read('roadmap.md'), rowsDone = 0;
for (const id of cfg.rows || []) {
  const re = new RegExp(`^\\| ${id} \\|`, 'm');
  if (!re.test(road)) { if (new RegExp(`^\\| ${id} ✅`, 'm').test(road)) continue; throw new Error('로드맵에 없는 줄: ' + id); }
  road = road.replace(re, `| ${id} ✅ (${day}) |`); rowsDone++;
}
if (cfg.closeMilestone) {
  const re = new RegExp(`^\\| \\*\\*${M}\\*\\* \\|(.*)\\| (\`v[0-9.]+\`) \\|$`, 'm');
  if (!re.test(road)) throw new Error('마일스톤 줄을 못 찾음: ' + M);
  road = road.replace(re, (_, mid, tag) => `| **${M} ✅ (${day})** |${mid}| ${tag} (태그 전) |`);
  road = road.replace(/^- 끝난 것: (.*)$/m, (_, was) => `- 끝난 것: ${was === '없음' ? '' : was + ', '}${M}`);
}
write('roadmap.md', head(road, `${M} ${cfg.closeMilestone ? '끝 표시' : `세부 항목 ${rowsDone}줄 끝`}`, 3));

// 2. 체크리스트
let chk = read('checklist.md'), chkDone = 0;
for (const id of cfg.checklist || []) {
  const re = new RegExp(`^(\\s*)- (?:⬜|🆕|🔄) (${id} [^\\n]*)$`, 'm');
  if (!re.test(chk)) { if (new RegExp(`^\\s*- ✅ ${id} `, 'm').test(chk)) continue; throw new Error('체크리스트에 없는 번호: ' + id); }
  chk = chk.replace(re, (_, sp, rest) => `${sp}- ✅ ${rest} (${day})`); chkDone++;
}
write('checklist.md', head(chk, `${M}에서 끝난 항목 ${chkDone}개 ✅`, 0));

// 3. 시나리오: 🔜 → ✅
let sc = read('persona-scenarios.md').split('\n'), persona = null, full = 0, part = 0;
sc = sc.map((line) => {
  const ph = line.match(/^### (\d\d) /); if (ph) { persona = ph[1]; return line; }
  const st = line.match(/^(\d+)\. /); if (!st || !persona) return line;
  const n = Number(st[1]);
  if ((cfg.steps?.[persona] || []).includes(n)) {
    const m = line.match(/^(.*?)\s*🔜 \(([^)]+)\)\s*$/);
    if (!m) { if (line.includes('✅')) return line; throw new Error(`🔜 한 조각이 아님: ${persona}-${n}`); }
    full++; return `${m[1]} ✅ (${m[2]}) ${M} ${md}`;
  }
  const ids = cfg.pieces?.[`${persona}-${n}`];
  if (ids) {
    const m = line.match(/^(.*?)\s*🔜 \(([^)]+)\)\s*$/);
    if (!m) throw new Error(`🔜 한 조각이 아님: ${persona}-${n}`);
    const all = m[2].split(',').map((x) => x.trim()), rest = all.filter((x) => !ids.includes(x));
    for (const id of ids) if (!all.includes(id)) throw new Error(`${persona}-${n}에 없는 번호: ${id}`);
    if (!rest.length) throw new Error(`${persona}-${n}: 남는 번호가 없으면 steps에 적는다`);
    part++; return `${m[1]} ✅ (${ids.join(', ')}) ${M} ${md} / 나머지 🔜 (${rest.join(', ')})`;
  }
  return line;
});
let scText = sc.join('\n');
scText = scText.replace(/^> 갱신 기록: (.*)$/m, (_, was) => `> 갱신 기록: ${day} ${M}${cfg.closeMilestone ? '이 끝나' : ' 일부가 끝나'} 🔜 → ✅ ${full + part}단계 (일부만 ${part}). ${was}`);
write('persona-scenarios.md', head(scText, `${M}: 🔜 → ✅ ${full + part}단계`, 0));

// 4. 점수 다시
const names = {};
for (const l of read('checklist.md').split('\n')) { const m = l.match(/^- (?:⬜|🆕|🔄|✅) (F\d\d-\d\d) (.+?)(?:\(| — 누가)/); if (m) names[m[1]] = m[2].trim(); }
const out = cp.execFileSync('node', [score, 'persona-scenarios.md']).toString().split('\n');
if (!/번호 없는 단계 0 · 표시 없는 단계 0/.test(out[0])) throw new Error('점수 머리가 이상함: ' + out[0]);
const cut = out.findIndex((l) => l.startsWith('## 이미 된 것'));
const named = (l) => { const c = l.split('|'); const id = c[l.match(/^\| \d+ \|/) ? 2 : 1].trim(); if (!names[id]) throw new Error('이름 없는 묶음: ' + id); c.splice(l.match(/^\| \d+ \|/) ? 3 : 2, 0, ' ' + names[id] + ' '); return c.join('|'); };
const todo = out.slice(0, cut).filter((l) => /^\| \d+ \| F/.test(l)).map(named);
const doneRows = out.slice(cut).filter((l) => /^\| F/.test(l)).map(named);
let map = read('persona-checklist-map.md');
map = map.replace(/> 점수: .*\n\n\| 순위[\s\S]*?\n\n## 2\./, () => `> 점수: ${stamp(1)} (옵션 없음)\n\n${['| 순위 | 묶음 | 이름 | 사람 | 단계 | 점수 | 등급 | 누구 |', '|---|---|---|---|---|---|---|---|', ...todo].join('\n')}\n\n## 2.`);
map = map.replace(/(## 2\. [^\n]*\n\n)[\s\S]*?(\n\n## 3\.)/, (_, a, b) => `${a}${['| 묶음 | 이름 | 사람 | 단계 | 점수 |', '|---|---|---|---|---|', ...doneRows].join('\n')}${b}`);
// 시나리오가 새로워졌으니 매핑 머리와 순서 줄의 시각도 맞춘다(순서 자체는 그대로다).
map = map.replace(/^> 갱신: .*$/m, `> 갱신: ${stamp(1)} (${M} 끝난 것 반영, 매핑은 그대로)`).replace(/^> 순서: .*$/m, `> 순서: ${stamp(2)}`);
map += `\n### ${day} ${M}${cfg.closeMilestone ? ' 끝' : ' 진행'}\n- 로드맵 ${rowsDone}줄 ✅, 체크리스트 ${chkDone}개 ✅, 시나리오 🔜 → ✅ ${full + part}단계(일부만 ${part})\n- 점수를 다시 냄: 남은 🔜 묶음 ${todo.length}개, ✅ 묶음 ${doneRows.length}개. 순서는 그대로${cfg.note ? `\n- ${cfg.note}` : ''}\n`;
write('persona-checklist-map.md', map);
console.log(`${M}: 로드맵 ${rowsDone}줄 · 체크리스트 ${chkDone}개 · 시나리오 ${full}+${part}단계 · 🔜 묶음 ${todo.length} · ✅ 묶음 ${doneRows.length}`);
