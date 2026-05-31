import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
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
      result.unshift({ type: "unchanged", line: a[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "added", line: b[j - 1] });
      j--;
    } else {
      result.unshift({ type: "removed", line: a[i - 1] });
      i--;
    }
  }
  return result;
}

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
  const [showDiff, setShowDiff] = useState(false);

  useEffect(() => {
    const draft = storage.getPromptDraft();
    if (draft) setSystemPrompt(draft);
    const savedModel = storage.getSelectedModel();
    if (savedModel && MODELS.find((m) => m.id === savedModel)) {
      setSelectedModelId(savedModel);
    }
  }, []);

  useEffect(() => {
    storage.setPromptDraft(systemPrompt);
  }, [systemPrompt]);

  useEffect(() => {
    storage.setSelectedModel(selectedModelId);
  }, [selectedModelId]);

  const isDirty = systemPrompt !== originalPrompt && originalPrompt !== "";

  async function handleLoadPrompt() {
    setLoadingPrompt(true);
    setError("");
    setShowDiff(false);

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
    if (!userMessage.trim()) {
      setError("유저 메시지를 입력해주세요.");
      return;
    }

    const model = MODELS.find((m) => m.id === selectedModelId)!;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId: selectedModelId, systemPrompt, userMessage }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const cost = calcCost(model, data.inputTokens, data.outputTokens);
      setResult({ ...data, cost });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "테스트 실패");
    } finally {
      setLoading(false);
    }
  }

  function handlePushSuccess(url: string) {
    setShowPush(false);
    setPrUrl(url);
    setOriginalPrompt(systemPrompt);
    setShowDiff(false);
  }

  const diffLines = isDirty && showDiff ? computeLineDiff(originalPrompt, systemPrompt) : [];

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">로딩 중...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center w-80">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Prompt Lab</h1>
          <p className="text-sm text-gray-500 mb-6">RelationshipLogic 팀 프롬프트 테스트 도구</p>
          <button
            onClick={() => signIn("github")}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-700"
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 md:px-6 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-base md:text-lg font-semibold text-gray-900 shrink-0">Prompt Lab</h1>
          <div className="flex items-center gap-1.5 min-w-0">
            <img src={session.user?.image ?? ""} alt="avatar" className="w-5 h-5 rounded-full shrink-0" />
            <span className="text-xs md:text-sm text-gray-500 truncate">{session.user?.name}</span>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="text-sm text-gray-500 hover:text-gray-900 border rounded-lg px-3 py-1.5 shrink-0"
        >
          ⚙ 설정
        </button>
      </header>

      {/* PR 성공 배너 */}
      {prUrl && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-green-700">
            PR이 생성되었습니다.{" "}
            <a href={prUrl} target="_blank" rel="noreferrer" className="underline font-medium">
              PR 보기
            </a>
          </span>
          <button onClick={() => setPrUrl("")} className="text-green-500 hover:text-green-700 text-sm ml-2">
            ✕
          </button>
        </div>
      )}

      {/* 에러 배너 */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-red-700">{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-600 text-sm ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-col md:flex-row flex-1 overflow-auto md:overflow-hidden">
        {/* Left: Prompt Editor */}
        <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r bg-white p-4 gap-3 md:overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">시스템 프롬프트</span>
              {isDirty && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  수정됨
                </span>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {isDirty && (
                <button
                  onClick={() => setShowDiff((v) => !v)}
                  className={`text-sm border rounded-lg px-3 py-1.5 ${
                    showDiff
                      ? "bg-gray-900 text-white border-gray-900"
                      : "text-gray-600 hover:text-gray-900 border-gray-300"
                  }`}
                >
                  변경 내용
                </button>
              )}
              <button
                onClick={handleLoadPrompt}
                disabled={loadingPrompt}
                className="text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg px-3 py-1.5 disabled:opacity-50"
              >
                {loadingPrompt ? "로드 중..." : "최신 로드"}
              </button>
              {isDirty && (
                <button
                  onClick={() => setShowPush(true)}
                  className="text-sm bg-gray-900 text-white rounded-lg px-3 py-1.5 hover:bg-gray-700"
                >
                  깃에 반영하기
                </button>
              )}
            </div>
          </div>

          {/* Diff view */}
          {showDiff && isDirty ? (
            <div className="flex-1 border rounded-lg overflow-auto bg-gray-950 min-h-[300px] md:min-h-0">
              <pre className="text-xs font-mono p-3 leading-relaxed">
                {diffLines.map((dl, idx) => (
                  <div
                    key={idx}
                    className={
                      dl.type === "added"
                        ? "bg-green-900/60 text-green-300"
                        : dl.type === "removed"
                        ? "bg-red-900/60 text-red-300"
                        : "text-gray-400"
                    }
                  >
                    <span className="select-none mr-2 opacity-60">
                      {dl.type === "added" ? "+" : dl.type === "removed" ? "-" : " "}
                    </span>
                    {dl.line}
                  </div>
                ))}
              </pre>
            </div>
          ) : (
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="시스템 프롬프트를 입력하거나 '최신 로드'로 GitHub에서 불러오세요."
              className="flex-1 border rounded-lg p-3 text-sm font-mono text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[300px] md:min-h-0"
            />
          )}
        </div>

        {/* Right: Test Panel */}
        <div className="w-full md:w-1/2 flex flex-col p-4 gap-3 overflow-auto">
          {/* Model selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 shrink-0">모델</span>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="flex-1 md:flex-none border rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* User message */}
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">유저 메시지</span>
            <textarea
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="테스트할 메시지를 입력하세요."
              rows={4}
              className="border rounded-lg p-3 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleTest}
            disabled={loading}
            className="bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "테스트 중..." : "테스트 실행"}
          </button>

          {/* Result */}
          {result && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                <span>소요: {(result.elapsedMs / 1000).toFixed(1)}s</span>
                <span>입력: {result.inputTokens.toLocaleString()} tok</span>
                <span>출력: {result.outputTokens.toLocaleString()} tok</span>
                <span className="font-medium text-gray-700">비용: ${result.cost.toFixed(6)}</span>
              </div>
              <div className="border rounded-lg p-3 text-sm text-gray-900 bg-white whitespace-pre-wrap">
                {result.text}
              </div>
            </div>
          )}
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showPush && (
        <PushModal
          promptContent={systemPrompt}
          onClose={() => setShowPush(false)}
          onSuccess={handlePushSuccess}
        />
      )}
    </div>
  );
}
