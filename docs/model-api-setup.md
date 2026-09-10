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

## 2. 키 발급처

- OpenAI: https://platform.openai.com/api-keys
- DeepSeek: https://platform.deepseek.com/api_keys

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
