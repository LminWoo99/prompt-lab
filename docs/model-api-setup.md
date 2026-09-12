# AI 모델 API 연동 가이드

`feature/add-test-models` 브랜치에서 추가한 모델을 실제로 테스트하려면 아래 설정이 필요합니다.

## 1. 모델별 필요 작업

| 모델 | provider | 필요한 키 | 신규 발급 여부 |
|---|---|---|---|
| Claude Sonnet 4.6 | anthropic | `ANTHROPIC_API_KEY` | 기존 사용 |
| Claude Haiku 4.5 | anthropic | `ANTHROPIC_API_KEY` | 기존 사용 |
| Gemini Flash 3.1 Lite | google | `GOOGLE_API_KEY` | 기존 사용 |
| **Claude Sonnet 5** | anthropic | `ANTHROPIC_API_KEY` | 기존 사용, 추가 작업 없음 |
| **Gemini 3.5 Flash-Lite** | google | `GOOGLE_API_KEY` | 기존 사용, 추가 작업 없음 |
| **GPT-5-mini** | openai | `OPENAI_API_KEY` | **신규 발급 필요** |
| **DeepSeek v4-pro** | deepseek | `DEEPSEEK_API_KEY` | **신규 발급 필요** |

## 2. 키 발급 방법

### OpenAI (GPT-5-mini)

1. https://platform.openai.com 접속 후 회원가입 (이메일 또는 Google/Microsoft/Apple 계정) — 이메일·휴대폰 인증 필요
2. 가입 시 조직(organization) 생성 — API 키 발급에는 조직이 있어야 함
3. 왼쪽 사이드바 **API keys** 메뉴로 이동 (직접 URL: https://platform.openai.com/api-keys)
4. **Create new secret key** 클릭 → 키 이름 입력(예: `prompt-lab-dev`) → 생성
5. `sk-proj-...`로 시작하는 키가 한 번만 표시됨 — 즉시 복사해서 안전한 곳에 보관 (다시 볼 수 없음)
6. **Billing** 메뉴에서 결제 수단 등록 후 크레딧 충전 — OpenAI는 선불 크레딧 방식이라 결제수단 없으면 키가 있어도 호출 실패함

### DeepSeek (DeepSeek v4-pro)

1. https://platform.deepseek.com 접속 후 이메일/휴대폰으로 회원가입 또는 로그인
2. **Top up**에서 결제 수단 등록 후 크레딧 충전 — 잔액 없으면 API 호출 실패
3. 왼쪽 사이드바 **API keys** 메뉴 → **Create new API key** 클릭 → 이름 입력(예: `prompt-lab-dev`) → 생성
4. 표시된 키를 즉시 복사해서 보관 (다시 볼 수 없음, 분실 시 재발급 필요)

### Google (Gemini Flash 3.1 Lite / Gemini 3.5 Flash-Lite)

`GOOGLE_API_KEY`는 기존 Gemini Flash 3.1 Lite와 신규 Gemini 3.5 Flash-Lite가 공유합니다.

1. https://aistudio.google.com 접속 후 구글 계정으로 로그인
2. 처음 접속 시 약관(Generative AI Additional Terms of Service) 동의 및 지역 확인
3. 왼쪽 사이드바 **Get API key** 클릭
4. **Create API key** 클릭 → "새 프로젝트에서 생성" 또는 "기존 프로젝트에서 생성" 선택 (처음이면 새 프로젝트 추천) → 생성
5. 표시된 키를 즉시 복사해서 보관
6. (선택) 무료 티어는 요청 한도가 낮음 — 더 높은 한도가 필요하면 **Set up billing**에서 결제 계정 연결 후 최소 $5 상당 선불 크레딧 충전

## 3. 로컬 설정 순서

1. 위 두 사이트에서 API 키 발급
2. 프로젝트 루트 `.env.local`에 추가 (`.env.local.example` 참고):
   ```
   ANTHROPIC_API_KEY=...
   GOOGLE_API_KEY=...
   OPENAI_API_KEY=...
   DEEPSEEK_API_KEY=...
   ```
3. `feature/add-test-models` 브랜치 체크아웃 후 `npm install` (openai 패키지가 새로 추가됨)
4. `npm run dev`로 재시작

## 4. 연동 방식 메모

- DeepSeek는 OpenAI 호환 API라서 별도 SDK 없이 `openai` 패키지를 그대로 쓰고, `baseURL`만 `https://api.deepseek.com`으로 바꿔서 호출합니다 (`pages/api/chat.ts`).
- provider 분기는 `pages/api/chat.ts`의 `model.provider` 값(`anthropic` / `google` / `openai` / `deepseek`)에 따라 처리됩니다.

## 5. 확인 필요 사항

- `lib/models.ts`에 등록한 신규 모델 3종(`gpt-5-mini`, `deepseek-v4-pro`, `gemini-3.5-flash-lite`)의 `inputPricePerMToken` / `outputPricePerMToken`은 **잠정치**입니다. 실제 단가 확인되면 `lib/models.ts`에서 수정 필요.
- `gpt-5-mini`, `deepseek-v4-pro`, `gemini-3.5-flash-lite`는 실제 API에서 사용하는 정확한 모델 ID인지 각 제공사 문서에서 한 번 더 확인 권장.
