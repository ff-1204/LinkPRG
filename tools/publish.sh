#!/usr/bin/env bash
# 이 PC의 HEAD를 공개 저장소 사본에 덮어쓰고 올린다. 사용자가 "올려 줘"라고 할 때만 쓴다.
# 쓰는 법: bash tools/publish.sh ["<커밋 메시지>"] [<공개 저장소 사본 폴더>]
#   메시지를 빼면 HEAD의 제목을 쓴다. 폴더를 빼면 /d/Game/LinkPRG-public (없으면 받아 온다).
# 공개용 README, .nojekyll, package.json 이름은 지킨다. 커밋은 깃허브 익명 주소(noreply)로 한다.
# 올린 뒤 깃허브 페이지 빌드가 끝날 때까지 기다리고, 게임 주소가 새 판 번호를 내는지 확인한다.
set -e
SRC=/d/Game/ttiring
MSG="${1:-$(cd "$SRC" && git log -1 --format=%s)}"
PUB="${2:-/d/Game/LinkPRG-public}"
SHA="$(cd "$SRC" && git rev-parse --short HEAD)"
if [ -n "$(cd "$SRC" && git status --porcelain)" ]; then echo "커밋하지 않은 고침이 있다. 먼저 커밋한다"; exit 1; fi
if [ ! -d "$PUB/.git" ]; then gh repo clone ff-1204/LinkPRG "$PUB" -- -q; fi
cd "$PUB"
git pull -q --ff-only origin main || true
KEEP="$PUB/../README.pub.keep"; cp README.md "$KEEP"
# 옛 파일을 지우고(.git 빼고) 새로 푼다
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
(cd "$SRC" && git archive HEAD) | tar -x -C "$PUB"
rm -rf .claude
cp "$KEEP" README.md
touch .nojekyll
sed -i 's/"name": "ttiring"/"name": "linkprg"/; s/"description": "띠링 (가제) — /"description": "LinkPRG — /' package.json
# 시험이 하나라도 깨지면 올리지 않는다. 깨져도 공개 사본에는 아직 커밋도 push도 하지 않았다
TESTLOG="$PUB/../publish-test.log"
if node --test tests/ > "$TESTLOG" 2>&1; then
  grep -E "^ℹ (pass|fail)" "$TESTLOG" || true; rm -f "$TESTLOG"
else
  grep -E "^(✖|ℹ (pass|fail))" "$TESTLOG" || tail -20 "$TESTLOG"
  echo "시험이 깨졌다. 올리지 않는다 (기록: $TESTLOG)"; exit 1
fi
# 파일 주소에 판 번호를 붙인다(F5만으로 새 파일을 받게). 시험은 붙이기 전에 돌렸다
node "$SRC/tools/bust.mjs" "$PUB" "$SHA"
git add -A
if git diff --cached --quiet; then echo "공개 사본과 같다. 올릴 것 없음"; exit 0; fi
git -c user.name="ff-1204" -c user.email="ff-1204@users.noreply.github.com" commit -q -m "$MSG"
git log --format='%an <%ae> %s' -1
git push -q origin main
echo "pushed $SHA"
# 깃허브 페이지 빌드를 기다린다. 오래 "building"에 멈추면 한 번 다시 건다
for i in $(seq 1 30); do
  sleep 10
  ST="$(gh api repos/ff-1204/LinkPRG/pages/builds/latest --jq .status 2>/dev/null || echo unknown)"
  [ "$ST" = built ] && break
  [ "$i" = 15 ] && gh api -X POST repos/ff-1204/LinkPRG/pages/builds >/dev/null 2>&1 || true
done
echo "pages: $ST"
if curl -s "https://ff-1204.github.io/LinkPRG/?t=$(date +%s)" | grep -q "main.js?v=$SHA"; then echo "확인: 게임 주소가 $SHA 판을 낸다"; else echo "아직 옛 판이 보인다. 몇 분 뒤 다시 확인한다"; fi
