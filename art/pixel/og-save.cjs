// og.html이 보낸 그림을 받아 프로젝트 맨 위의 og.png로 적는다. 한 번 받으면 꺼진다.
// 쓰는 법: node art/pixel/og-save.cjs 를 켜 두고, 브라우저에서 http://localhost:5180/art/pixel/og.html?save=1 을 연다.
const http = require('http'), fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '..', '..', 'og.png');
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5180');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'POST' || req.url !== '/og.png') { res.writeHead(404); res.end(); return; }
  const parts = [];
  req.on('data', (d) => parts.push(d));
  req.on('end', () => {
    const buf = Buffer.concat(parts);
    // PNG가 맞는지 머리 여덟 바이트로 본다
    if (buf.length < 8 || buf.readUInt32BE(0) !== 0x89504e47 || buf.length > 5e6) { res.writeHead(400); res.end(); return; }
    fs.writeFileSync(OUT, buf);
    res.writeHead(200); res.end('ok');
    console.log('og.png', buf.length);
    server.close();
  });
});
server.listen(5181, '127.0.0.1', () => console.log('기다리는 중: http://127.0.0.1:5181/og.png'));
setTimeout(() => { console.log('시간이 지나 끈다'); process.exit(1); }, 120000).unref();
