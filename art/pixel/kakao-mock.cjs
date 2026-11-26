// 카카오톡 링크 미리보기 시안을 만든다: node art/pixel/kakao-mock.cjs → art/pixel/mock/kakao.html
// 그림은 파일 안에 넣어(data URI) 어디서 열어도 보인다.
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, 'out'), MOCK = path.join(__dirname, 'mock');
fs.mkdirSync(MOCK, { recursive: true });
const img = (name, style = '') => `<img alt="" style="image-rendering:pixelated;display:block;${style}" src="data:image/png;base64,${fs.readFileSync(path.join(OUT, name + '.png')).toString('base64')}">`;

const TITLE = 'LinkPRG (띠링)';
const DESC = '누른 만큼 강해지는 글 RPG. 브라우저에서 바로 돼요.';

const shots = [
  {
    name: '1. 한마디',
    why: '작업실 카드와 같은 꼴. 게임의 규칙 한 줄을 크게.',
    bg: '#FBF4E4',
    html: `
      <div class="brand">LinkPRG</div>
      <div class="quote">“한 번 누르면, <span class="acc">한 번.</span>”</div>
      <div class="sub">백 번은 손으로 백 번. 누른 만큼 강해져요.</div>
      <div class="rowart">${img('scarecrow-0', 'height:76px')}${img('scarecrow-1', 'height:76px')}${img('scarecrow-2', 'height:76px')}${img('scarecrow-3', 'height:76px')}</div>`,
  },
  {
    name: '2. 밤의 종루',
    why: '어두운 바탕에 제목. 이야기의 분위기.',
    bg: '#6B5446',
    dark: true,
    html: `
      <div class="brand" style="color:#F6D98A">LinkPRG</div>
      <div class="quote" style="color:#FBF4E4;font-size:62px">띠링</div>
      <div class="sub" style="color:#EADFC8">끝까지 해낸 사람에게 종소리가 들린다.</div>
      <div class="strip">${img('strip-belltower-night', 'width:100%')}</div>`,
  },
  {
    name: '3. 띠링 창',
    why: '게임에서 가장 자주 보는 알림창을 그대로.',
    bg: '#F3E8D3',
    html: `
      <div class="ding">
        <div class="dh"><b>띠링! 숙련도</b><span>귀함</span></div>
        <div class="db"><div class="big">치기 중급 1</div><div>같은 자리를 치고 또 친 손에 답이 왔습니다.</div><div class="ok">확인</div></div>
      </div>`,
  },
  {
    name: '4. 대화방',
    why: '실제로 하는 화면. 글로 하는 게임이라는 것이 바로 보인다.',
    bg: '#FBF4E4',
    html: `
      <div class="chat">
        <div class="me">허수아비를 쳤다. 이백 번째다.</div>
        <div class="who">교관</div><div class="npc">…아직도 있나.</div>
        <div class="me">허수아비를 쳤다. 숨이 조금 찬다.</div>
        <div class="sys">띠링! 치기 숙련도가 올랐습니다</div>
      </div>`,
  },
  {
    name: '5. 제목과 마을',
    why: '이름을 가장 크게. 아래에 시작 마을.',
    bg: '#FBF4E4',
    html: `
      <div class="quote" style="margin-top:34px;font-size:60px">LinkPRG</div>
      <div class="sub">누른 만큼 강해지는 글 RPG</div>
      <div class="strip">${img('strip-plaza-empty', 'width:100%')}</div>`,
  },
];

const card = (s) => `
  <figure>
    <figcaption><b>${s.name}</b> ${s.why}</figcaption>
    <div class="talk">
      <div class="card">
        <div class="shot" style="background:${s.bg}">${s.html}</div>
        <div class="meta"><div class="t">${TITLE}</div><div class="d">${DESC}</div><div class="u">ff-1204.github.io</div></div>
      </div>
    </div>
  </figure>`;

const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>카톡 미리보기 시안</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Gowun+Dodum&display=swap" rel="stylesheet">
<style>
  body { margin: 0; padding: 24px 16px 48px; background: #f4f1ea; color: #3A2A1E; font: 15px/1.6 "Gowun Dodum", "Malgun Gothic", sans-serif; }
  h1 { font: 700 22px/1.3 "Gowun Batang", serif; margin: 0 0 4px; }
  .note { margin: 0 0 20px; color: #6b5a4a; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(330px, 1fr)); gap: 22px; }
  figure { margin: 0; }
  figcaption { margin-bottom: 8px; font-size: 14px; color: #6b5a4a; }
  figcaption b { color: #3A2A1E; margin-right: 6px; }
  .talk { background: #B2C7D9; padding: 14px; border-radius: 6px; }
  .card { width: 300px; max-width: 100%; background: #fff; border-radius: 6px; overflow: hidden; }
  .shot { position: relative; aspect-ratio: 1200 / 630; overflow: hidden; display: flex; flex-direction: column; align-items: center; text-align: center; font-family: "Gowun Batang", serif; color: #3A2A1E; }
  .brand { margin-top: 12px; font: 700 12px/1 "Gowun Dodum", sans-serif; letter-spacing: .02em; color: #8B4E2B; }
  .quote { margin-top: 8px; font-weight: 700; font-size: 27px; line-height: 1.15; }
  .quote .acc { color: #2F7D5B; }
  .sub { margin-top: 5px; font: 11.5px/1.4 "Gowun Dodum", sans-serif; color: #6b5a4a; }
  .rowart { position: absolute; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; align-items: flex-end; gap: 16px; border-bottom: 5px solid #3A2A1E; }
  .rowart img { height: 58px !important; }
  .strip { position: absolute; left: 0; right: 0; bottom: 0; }
  .ding { margin: auto; width: 78%; border: 2px solid #3A2A1E; background: #FBF4E4; text-align: left; box-shadow: 5px 5px 0 rgba(58, 42, 30, .25); }
  .dh { display: flex; justify-content: space-between; padding: 5px 9px; background: #F2B438; border-bottom: 2px solid #3A2A1E; font: 12px/1.3 "Gowun Dodum", sans-serif; }
  .db { padding: 8px 10px 10px; font: 11px/1.45 "Gowun Dodum", sans-serif; }
  .db .big { font: 700 21px/1.2 "Gowun Batang", serif; margin-bottom: 2px; }
  .db .ok { margin-top: 7px; padding: 4px; text-align: center; background: #8B4E2B; color: #fff; border-radius: 4px; font-size: 11px; }
  .chat { width: 100%; padding: 10px 14px; display: flex; flex-direction: column; gap: 4px; text-align: left; font-size: 11.5px; line-height: 1.35; }
  .chat .me { align-self: flex-end; background: #F3E8D3; border: 1px solid #E2D2B4; border-radius: 10px 3px 10px 10px; padding: 4px 9px; }
  .chat .who { font: 9.5px/1 "Gowun Dodum", sans-serif; color: #6b5a4a; margin-top: 1px; }
  .chat .npc { align-self: flex-start; background: #fff; border: 1px solid #E2D2B4; border-radius: 3px 10px 10px 10px; padding: 4px 9px; }
  .chat .sys { align-self: flex-start; background: #F2B438; border-radius: 3px 10px 10px 10px; padding: 4px 9px; font: 700 11.5px/1.35 "Gowun Dodum", sans-serif; }
  .meta { padding: 10px 12px 12px; font-family: "Malgun Gothic", "Apple SD Gothic Neo", sans-serif; }
  .meta .t { font-weight: 700; font-size: 15px; color: #111; }
  .meta .d { margin-top: 3px; font-size: 13.5px; line-height: 1.4; color: #777; }
  .meta .u { margin-top: 7px; font-size: 12px; color: #2a6fd6; text-decoration: underline; }
</style></head>
<body>
<h1>카톡에 주소를 붙였을 때 보이는 모습</h1>
<p class="note">그림(위)과 제목·설명(아래)이 한 묶음으로 보입니다. 그림만 다섯 가지로 그렸고, 제목과 설명은 같습니다.</p>
<div class="grid">${shots.map(card).join('')}</div>
</body></html>`;
fs.writeFileSync(path.join(MOCK, 'kakao.html'), html);
console.log('kakao.html', html.length);
