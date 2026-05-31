import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import { MODELS, calcCost } from "@/lib/models";
import { storage } from "@/lib/storage";
import SettingsModal from "@/components/SettingsModal";
import PushModal from "@/components/PushModal";

interface TestResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  elapsedMs: number;
  cost: number;
}

type DiffLine = { type: "unchanged" | "added" | "removed"; line: string };

function computeLineDiff(original: string, modified: string): DiffLine[] {
  const a = original.split("\n");
  const b = modified.split("\n");
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  const result: DiffLine[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.unshift({ type: "unchanged", line: a[i - 1] }); i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "added", line: b[j - 1] }); j--;
    } else {
      result.unshift({ type: "removed", line: a[i - 1] }); i--;
    }
  }
  return result;
}

type ViewMode = "edit" | "preview" | "diff";

export default function Home() {
  const { data: session, status } = useSession();
  const [systemPrompt, setSystemPrompt] = useState("");
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [selectedModelId, setSelectedModelId] = useState(MODELS[0].id);
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showPush, setShowPush] = useState(false);
  const [prUrl, setPrUrl] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("edit");

  useEffect(() => {
    const draft = storage.getPromptDraft();
    if (draft) setSystemPrompt(draft);
    const savedModel = storage.getSelectedModel();
    if (savedModel && MODELS.find((m) => m.id === savedModel)) setSelectedModelId(savedModel);
  }, []);

  useEffect(() => { storage.setPromptDraft(systemPrompt); }, [systemPrompt]);
  useEffect(() => { storage.setSelectedModel(selectedModelId); }, [selectedModelId]);

  const isDirty = systemPrompt !== originalPrompt && originalPrompt !== "";

  async function handleLoadPrompt() {
    setLoadingPrompt(true);
    setError("");
    setViewMode("edit");
    try {
      const res = await fetch("/api/github/load");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSystemPrompt(data.content);
      setOriginalPrompt(data.content);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "프롬프트 로드 실패");
    } finally {
      setLoadingPrompt(false);
    }
  }

  async function handleTest() {
    if (!userMessage.trim()) { setError("유저 메시지를 입력해주세요."); return; }
    const model = MODELS.find((m) => m.id === selectedModelId)!;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId: selectedModelId, systemPrompt, userMessage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({ ...data, cost: calcCost(model, data.inputTokens, data.outputTokens) });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "테스트 실패");
    } finally {
      setLoading(false);
    }
  }

  function handlePushSuccess(url: string) {
    setShowPush(false); setPrUrl(url); setOriginalPrompt(systemPrompt); setViewMode("edit");
  }

  const diffLines = viewMode === "diff" && isDirty ? computeLineDiff(originalPrompt, systemPrompt) : [];

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#131314] flex items-center justify-center">
        <p className="text-sm text-[#9aa0a6]">로딩 중...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#131314] flex items-center justify-center">
        <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-2xl p-8 text-center w-80">
          <div className="w-10 h-10 rounded-full bg-[#8ab4f8]/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-[#8ab4f8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-[#e8eaed] mb-1">Prompt Lab</h1>
          <p className="text-sm text-[#9aa0a6] mb-6">RelationshipLogic 팀 프롬프트 테스트 도구</p>
          <button
            onClick={() => signIn("github")}
            className="w-full flex items-center justify-center gap-2 bg-[#8ab4f8] text-[#131314] rounded-xl py-2.5 text-sm font-semibold hover:bg-[#aecbfa] transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.58 9.58 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            GitHub으로 로그인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131314] flex flex-col text-[#e8eaed]">
      {/* Header */}
      <header className="bg-[#1e1e1e] border-b border-[#3c3c3c] px-4 md:px-6 py-3 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-semibold text-[#8ab4f8] tracking-wide shrink-0">Prompt Lab</span>
          <span className="text-[#3c3c3c] hidden sm:block">|</span>
          <div className="hidden sm:flex items-center gap-1.5 min-w-0">
            <img src={session.user?.image ?? ""} alt="avatar" className="w-5 h-5 rounded-full shrink-0" />
            <span className="text-xs text-[#9aa0a6] truncate">{session.user?.name}</span>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="text-xs text-[#9aa0a6] hover:text-[#e8eaed] border border-[#3c3c3c] hover:border-[#5c5c5c] rounded-lg px-3 py-1.5 transition-colors"
        >
          설정
        </button>
      </header>

      {/* Banners */}
      {prUrl && (
        <div className="bg-[#1a3a2a] border-b border-[#2d6a4a] px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-[#81c995]">
            PR 생성 완료 —{" "}
            <a href={prUrl} target="_blank" rel="noreferrer" className="underline font-medium">PR 보기</a>
          </span>
          <button onClick={() => setPrUrl("")} className="text-[#81c995] hover:text-white text-sm ml-2">✕</button>
        </div>
      )}
      {error && (
        <div className="bg-[#3a1a1a] border-b border-[#6a2a2a] px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-[#f28b82]">{error}</span>
          <button onClick={() => setError("")} className="text-[#f28b82] hover:text-white text-sm ml-2">✕</button>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-col md:flex-row flex-1 overflow-auto md:overflow-hidden">

        {/* Left: Prompt Editor */}
        <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-[#3c3c3c] bg-[#1a1a1a] md:overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#3c3c3c] gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-[#131314] rounded-lg p-0.5">
              {(["edit", "preview", ...(isDirty ? ["diff"] : [])] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    viewMode === mode
                      ? "bg-[#2d2d2d] text-[#e8eaed]"
                      : "text-[#9aa0a6] hover:text-[#e8eaed]"
                  }`}
                >
                  {mode === "edit" ? "편집" : mode === "preview" ? "미리보기" : "변경 내용"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {isDirty && (
                <span className="text-xs bg-[#3a2d00] text-[#fdd663] px-2 py-0.5 rounded-full">수정됨</span>
              )}
              <button
                onClick={handleLoadPrompt}
                disabled={loadingPrompt}
                className="text-xs text-[#8ab4f8] hover:text-[#aecbfa] border border-[#3c5a8a] hover:border-[#5c7aaa] rounded-lg px-3 py-1.5 disabled:opacity-40 transition-colors"
              >
                {loadingPrompt ? "로드 중..." : "최신 로드"}
              </button>
              {isDirty && (
                <button
                  onClick={() => setShowPush(true)}
                  className="text-xs bg-[#8ab4f8] text-[#131314] font-semibold rounded-lg px-3 py-1.5 hover:bg-[#aecbfa] transition-colors"
                >
                  깃에 반영
                </button>
              )}
            </div>
          </div>

          {/* Editor area */}
          <div className="flex-1 overflow-auto min-h-[300px] md:min-h-0">
            {viewMode === "diff" && isDirty ? (
              <pre className="text-xs font-mono p-4 leading-relaxed h-full">
                {diffLines.map((dl, idx) => (
                  <div
                    key={idx}
                    className={
                      dl.type === "added"
                        ? "bg-[#1a3a1a] text-[#81c995]"
                        : dl.type === "removed"
                        ? "bg-[#3a1a1a] text-[#f28b82]"
                        : "text-[#5c5c5c]"
                    }
                  >
                    <span className="select-none mr-3 opacity-60 w-3 inline-block">
                      {dl.type === "added" ? "+" : dl.type === "removed" ? "-" : " "}
                    </span>
                    {dl.line || " "}
                  </div>
                ))}
              </pre>
            ) : viewMode === "preview" ? (
              <div className="p-4 h-full overflow-auto">
                <div className="prose prose-invert prose-sm max-w-none
                  prose-headings:text-[#e8eaed] prose-headings:font-semibold
                  prose-p:text-[#bdc1c6] prose-p:leading-relaxed
                  prose-strong:text-[#e8eaed]
                  prose-code:text-[#8ab4f8] prose-code:bg-[#2d2d2d] prose-code:px-1 prose-code:rounded
                  prose-pre:bg-[#2d2d2d] prose-pre:border prose-pre:border-[#3c3c3c]
                  prose-blockquote:border-[#8ab4f8] prose-blockquote:text-[#9aa0a6]
                  prose-hr:border-[#3c3c3c]
                  prose-li:text-[#bdc1c6]
                  prose-table:text-[#bdc1c6]
                  prose-th:text-[#e8eaed] prose-th:border-[#3c3c3c]
                  prose-td:border-[#3c3c3c]
                ">
                  <ReactMarkdown>{systemPrompt || "*프롬프트가 없습니다.*"}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="시스템 프롬프트를 입력하거나 '최신 로드'로 GitHub에서 불러오세요."
                className="w-full h-full p-4 text-sm font-mono text-[#e8eaed] bg-transparent placeholder-[#4a4a4a] resize-none focus:outline-none leading-relaxed"
              />
            )}
          </div>
        </div>

        {/* Right: Test Panel */}
        <div className="w-full md:w-1/2 flex flex-col overflow-auto bg-[#131314]">
          <div className="p-4 border-b border-[#3c3c3c]">
            <span className="text-xs font-medium text-[#9aa0a6] uppercase tracking-wider">테스트 실행</span>
          </div>

          <div className="flex flex-col gap-4 p-4">
            {/* Model selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#9aa0a6]">모델</label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="bg-[#1e1e1e] border border-[#3c3c3c] text-[#e8eaed] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8ab4f8] transition-colors"
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* User message */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#9aa0a6]">유저 메시지</label>
              <textarea
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="테스트할 메시지를 입력하세요."
                rows={4}
                className="bg-[#1e1e1e] border border-[#3c3c3c] text-[#e8eaed] placeholder-[#4a4a4a] rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-[#8ab4f8] transition-colors"
              />
            </div>

            <button
              onClick={handleTest}
              disabled={loading}
              className="bg-[#8ab4f8] text-[#131314] font-semibold rounded-xl py-2.5 text-sm hover:bg-[#aecbfa] disabled:opacity-40 transition-colors"
            >
              {loading ? "실행 중..." : "테스트 실행"}
            </button>

            {/* Result */}
            {result && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-3 bg-[#1e1e1e] border border-[#3c3c3c] rounded-xl px-4 py-2.5">
                  <span className="text-xs text-[#9aa0a6]">소요 <span className="text-[#e8eaed] font-medium">{(result.elapsedMs / 1000).toFixed(1)}s</span></span>
                  <span className="text-[#3c3c3c]">·</span>
                  <span className="text-xs text-[#9aa0a6]">입력 <span className="text-[#e8eaed] font-medium">{result.inputTokens.toLocaleString()}</span></span>
                  <span className="text-[#3c3c3c]">·</span>
                  <span className="text-xs text-[#9aa0a6]">출력 <span className="text-[#e8eaed] font-medium">{result.outputTokens.toLocaleString()}</span></span>
                  <span className="text-[#3c3c3c]">·</span>
                  <span className="text-xs text-[#8ab4f8] font-semibold">${result.cost.toFixed(6)}</span>
                </div>
                <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-xl p-4 text-sm text-[#e8eaed] whitespace-pre-wrap leading-relaxed">
                  {result.text}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showPush && (
        <PushModal promptContent={systemPrompt} onClose={() => setShowPush(false)} onSuccess={handlePushSuccess} />
      )}
    </div>
  );
}
