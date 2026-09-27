#!/usr/bin/env bash
# 홈서버에서 이 스크립트 하나만 실행하면 배포됨: ./deploy.sh
set -e

cd "$(dirname "$0")"

LOCK_BEFORE=$(md5sum package-lock.json 2>/dev/null || true)
git pull
LOCK_AFTER=$(md5sum package-lock.json 2>/dev/null || true)

if [ "$LOCK_BEFORE" != "$LOCK_AFTER" ]; then
  echo "package-lock.json 변경 감지 — npm install 실행"
  npm install
fi

npm run build
pm2 restart prompt-lab
pm2 status
