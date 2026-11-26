// 배포할 때만 쓴다: 공개 사본의 파일 주소에 판 번호를 붙여, 새로 올리면 F5만으로 새 파일을 받게 한다.
// 깃허브 페이지는 파일을 10분 동안 저장해 두어도 된다고 알려 주므로, 주소가 바뀌어야 브라우저가 새로 받는다.
// 쓰는 법: node tools/bust.mjs <공개 사본 폴더> <판 번호>
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const [dir, ver] = process.argv.slice(2);
if (!dir || !ver) throw new Error('쓰는 법: node tools/bust.mjs <폴더> <판 번호>');
const q = `?v=${ver}`;
let files = 0, marks = 0;

function walk(d) {
  for (const name of readdirSync(d)) {
    const p = join(d, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.js')) stamp(p, /((?:from|import)\s*['"])(\.{1,2}\/[^'"?]+\.js)(['"])/g);
  }
}
function stamp(p, re) {
  const s = readFileSync(p, 'utf8');
  let n = 0;
  const t = s.replace(re, (m, a, path, b) => { n++; return `${a}${path}${q}${b}`; });
  if (n) { writeFileSync(p, t); files++; marks += n; }
}

walk(join(dir, 'src'));
stamp(join(dir, 'index.html'), /((?:src|href)=")(src\/[^"?]+\.(?:js|css))(")/g);
console.log(`판 번호 ${ver}: 파일 ${files}개, 주소 ${marks}곳`);
