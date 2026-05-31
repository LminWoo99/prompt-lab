# Prompt Lab — Claude Guide

## 프로젝트 개요

RelationshipLogic 팀이 공통으로 사용하는 프롬프트 테스트 도구.
팀원 누구나 LLM 모델을 선택해 프롬프트를 테스트하고, 만족스러운 결과가 나오면 GitHub PR로 반영할 수 있다.

## 기술 스택

- **Next.js 14** (Pages Router)
- **TypeScript**
- **Tailwind CSS**
- **@octokit/rest** — GitHub API (프롬프트 load/push/PR 생성)
- **@anthropic-ai/sdk** — Claude Sonnet 4.6, Haiku 4.5
- **@google/generative-ai** — Gemini Flash 3.1 Lite

## 핵심 설계 원칙

- DB 없음 — 상태는 메모리 또는 localStorage에만 보관
- API 키, GitHub PAT는 localStorage에 저장, git에 절대 포함하지 않음
- 프롬프트 원본은 GitHub에서 pull, 수정은 로컬에서만 (임시)
- 만족한 결과의 프롬프트만 GitHub에 push 가능

## 연동 레포

- **레포**: `yun0-2/RelationshipLogic`
- **프롬프트 경로**: `experiments/psych-engine/prompts/system_v2.md`
- **base 브랜치**: `main` (직접 push 절대 금지)

## 브랜치 네이밍 (push 시 자동 생성)

```
feature/prompt/{YYYYMMDD}/{4자리 난수}
예) feature/prompt/20260521/f3a9
```

## GitHub push 플로우

1. 브랜치 자동 생성 (`feature/prompt/...`)
2. 수정된 프롬프트 파일 push
3. PR 생성 (base: `main`)
4. main 직접 push 금지 — 코드에서도 막아야 함

## 지원 모델 및 비용 단가

| 모델 ID | 표시명 | Input ($/1M) | Output ($/1M) |
|---|---|---|---|
| `claude-sonnet-4-6` | Claude Sonnet 4.6 | $3.00 | $15.00 |
| `claude-haiku-4-5-20251001` | Claude Haiku 4.5 | $0.80 | $4.00 |
| `gemini-2.0-flash-lite` | Gemini Flash 3.1 Lite | $0.075 | $0.30 |

## API Route 구조

```
/api/chat.ts              — LLM 프록시 (Anthropic / Google 분기)
/api/github/load.ts       — system_v2.md 내용 fetch
/api/github/push.ts       — 브랜치 생성 + 파일 push + PR 생성
```

## 컴포넌트 구조

```
components/
  SettingsModal.tsx   — GitHub PAT, API 키 입력/저장
  PromptEditor.tsx    — 시스템 프롬프트 에디터 + 최신 로드 버튼
  TestPanel.tsx       — 모델 선택, 유저 메시지, 응답 출력, 비용 표시
  PushModal.tsx       — 브랜치명 자동 생성, 커밋/PR 메시지 입력
```

## 민감 정보 처리

- `.env.local` — git 제외
- `CLAUDE.md` — git 제외 (.gitignore에 등록)
- localStorage 키: `gh_pat`, `anthropic_key`, `google_key`

## 코드 작성 규칙

- 불필요한 추상화 금지 — 현재 기능에 필요한 최소한만 작성
- 에러는 UI에 사용자 친화적 메시지로 표시
- main 직접 push는 `/api/github/push.ts`에서 코드 레벨로 차단
