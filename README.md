# Prompt Lab

RelationshipLogic 팀 프롬프트 테스트 도구.
GitHub OAuth로 로그인하면 `yun0-2/RelationshipLogic` 레포의 시스템 프롬프트를 불러와 테스트하고, 수정한 내용을 PR로 반영할 수 있다.

---

## 팀원 사용법

1. `https://prompt-lab.minu-dev.win` 접속
2. **GitHub으로 로그인**
3. 설정(⚙)에서 Anthropic / Google API 키 입력
4. **최신 로드** → 프롬프트 수정 → **테스트 실행**
5. 만족하면 **깃에 반영하기** → PR 생성

> API 키는 브라우저 localStorage에만 저장되며 서버나 git에 올라가지 않는다.

---

## 로컬 개발

```bash
git clone https://github.com/LminWoo99/prompt-lab.git
cd prompt-lab
npm install
cp .env.local.example .env.local
# .env.local 값 채우기 (아래 참고)
npm run dev
```

`http://localhost:3000` 접속.

---

## 환경변수 (.env.local)

```
GITHUB_ID=          # GitHub OAuth App Client ID
GITHUB_SECRET=      # GitHub OAuth App Client Secret
NEXTAUTH_SECRET=    # 랜덤 문자열 (openssl rand -base64 32)
NEXTAUTH_URL=       # 로컬: http://localhost:3000 / 서버: https://prompt-lab.minu-dev.win
```

---

## 홈서버 배포 (minu-dev.win)

### 현재 완료된 것

- [x] GitHub OAuth App 생성 (`prompt-lab.minu-dev.win` 콜백 등록)
- [x] `.env.local` 작성

### 남은 작업

#### 1. GitHub OAuth App Secret 재발급 (보안)
채팅에 Secret이 노출됐으므로 재발급 필요.

`https://github.com/settings/developers` → OAuth Apps → 앱 선택 → **Generate a new client secret**

재발급 후 Ubuntu VM의 `.env.local` GITHUB_SECRET 값 교체.

#### 2. Cloudflare DNS 서브도메인 추가

Cloudflare 대시보드 → `minu-dev.win` → DNS → 레코드 추가
```
Type: CNAME
Name: prompt-lab
Target: minu-dev.win (또는 터널 ID.cfargotunnel.com)
Proxied: ON
```

#### 3. Cloudflare Tunnel config.yml 수정

`~/.cloudflared/config.yml`에 ingress 항목 추가:

```yaml
tunnel: <터널 ID>
credentials-file: /Users/minu/.cloudflared/<터널 ID>.json

ingress:
  - hostname: prompt-lab.minu-dev.win
    service: http://localhost:3000        # ← 추가
  - hostname: minu-dev.win
    service: ssh://localhost:22
  - service: http_status:404
```

터널 재시작:
```bash
cloudflared tunnel run homeserver
```

#### 4. Ubuntu VM에 앱 배포

```bash
# 맥미니 접속
ssh minu-dev.win

# Ubuntu VM 접속
orb shell -m homeserver

# 레포 클론 및 실행
git clone https://github.com/LminWoo99/prompt-lab.git
cd prompt-lab
npm install
npm run build

# .env.local 작성
cat > .env.local << EOF
GITHUB_ID=Ov23liieJapqQR1f5ilc
GITHUB_SECRET=재발급한_시크릿
NEXTAUTH_SECRET=lkmninZw6RVGeFcuL6tCEgpHb1PxuaLWlXrUX9qYVUk=
NEXTAUTH_URL=https://prompt-lab.minu-dev.win
EOF

# pm2로 백그라운드 실행
npm install -g pm2
pm2 start npm --name prompt-lab -- start
pm2 save
```

#### 5. 확인

`https://prompt-lab.minu-dev.win` 접속 → GitHub 로그인 화면 나오면 완료.

---

## 기술 스택

| 항목 | 내용 |
|---|---|
| 프레임워크 | Next.js 14 (Pages Router) |
| 인증 | next-auth (GitHub OAuth) |
| GitHub 연동 | @octokit/rest |
| LLM | Anthropic SDK, Google Generative AI |
| 스타일 | Tailwind CSS |

## 지원 모델

| 모델 | 비용 (Input / Output per 1M tok) |
|---|---|
| Claude Sonnet 4.6 | $3.00 / $15.00 |
| Claude Haiku 4.5 | $0.80 / $4.00 |
| Gemini Flash 3.1 Lite | $0.075 / $0.30 |

## PR 브랜치 네이밍

깃에 반영하기 버튼 클릭 시 자동 생성:
```
feature/prompt/{YYYYMMDD}/{4자리 난수}
예) feature/prompt/20260521/f3a9
```
