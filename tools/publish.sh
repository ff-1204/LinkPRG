#!/usr/bin/env bash
# 이 PC의 HEAD를 공개 저장소 사본에 덮어쓴다. 쓰는 법: bash tools/publish.sh <공개 저장소를 받아 온 폴더> "<커밋 메시지>"
# 공개용 README, .nojekyll, package.json 이름은 지킨다. 커밋은 깃허브 익명 주소로 한다.
set -e
SRC=/d/Game/ttiring
PUB="$1"
MSG="$2"
cd "$PUB"
git pull -q --ff-only origin main || true
KEEP="$PUB/../README.pub.keep"; cp README.md "$KEEP"
# 옛 파일을 지우고(.git 빼고) 새로 푼다
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
(cd "$SRC" && git archive HEAD) | tar -x -C "$PUB"
rm -rf .claude
cp "$KEEP" README.md
touch .nojekyll
sed -i 's/"name": "ttiring"/"name": "linkprg"/; s/"description": "띠링 (가제) — /"description": "LinkPRG (띠링) — /' package.json
node --test tests/ 2>&1 | grep -E "^ℹ (pass|fail)"
git add -A
git -c user.name="ff-1204" -c user.email="ff-1204@users.noreply.github.com" commit -q -m "$MSG"
git log --format='%an <%ae> %s' -1
git push -q origin main
echo pushed
