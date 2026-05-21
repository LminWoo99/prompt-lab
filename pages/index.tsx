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
    const pat = storage.getGhPat();
    if (!pat) {
      setError("설정에서 GitHub PAT를 먼저 입력해주세요.");
      setShowSettings(true);
      return;
    }

    setLoadingPrompt(true);
    setError("");

    try {
      const res = await fetch("/api/github/load", {
        headers: { "x-github-pat": pat },
      });
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
    const anthropicKey = storage.getAnthropicKey();
    const googleKey = storage.getGoogleKey();

    if (model.provider === "anthropic" && !anthropicKey) {
      setError("설정에서 Anthropic API 키를 먼저 입력해주세요.");
      setShowSettings(true);
      return;
    }
    if (model.provider === "google" && !googleKey) {
      setError("설정에서 Google API 키를 먼저 입력해주세요.");
      setShowSettings(true);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (model.provider === "anthropic") headers["x-anthropic-key"] = anthropicKey;
      if (model.provider === "google") headers["x-google-key"] = googleKey;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
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
  }

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
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">Prompt Lab</h1>
          <div className="flex items-center gap-1.5">
            <img src={session.user?.image ?? ""} alt="avatar" className="w-5 h-5 rounded-full" />
            <span className="text-sm text-gray-500">{session.user?.name}</span>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="text-sm text-gray-500 hover:text-gray-900 border rounded-lg px-3 py-1.5"
        >
          ⚙ 설정
        </button>
      </header>

      {/* PR 성공 배너 */}
      {prUrl && (
        <div className="bg-green-50 border-b border-green-200 px-6 py-2 flex items-center justify-between">
          <span className="text-sm text-green-700">
            PR이 생성되었습니다.{" "}
            <a href={prUrl} target="_blank" rel="noreferrer" className="underline font-medium">
              PR 보기
            </a>
          </span>
          <button onClick={() => setPrUrl("")} className="text-green-500 hover:text-green-700 text-sm">
            ✕
          </button>
        </div>
      )}

      {/* 에러 배너 */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2 flex items-center justify-between">
          <span className="text-sm text-red-700">{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-600 text-sm">
            ✕
          </button>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 49px)" }}>
        {/* Left: Prompt Editor */}
        <div className="w-1/2 flex flex-col border-r bg-white p-4 gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">시스템 프롬프트</span>
              {isDirty && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  수정됨
                </span>
              )}
            </div>
            <div className="flex gap-2">
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

          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="시스템 프롬프트를 입력하거나 '최신 로드'로 GitHub에서 불러오세요."
            className="flex-1 border rounded-lg p-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Right: Test Panel */}
        <div className="w-1/2 flex flex-col p-4 gap-3 overflow-auto">
          {/* Model selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">모델</span>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <div className="flex gap-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                <span>소요: {(result.elapsedMs / 1000).toFixed(1)}s</span>
                <span>입력: {result.inputTokens.toLocaleString()} tok</span>
                <span>출력: {result.outputTokens.toLocaleString()} tok</span>
                <span className="font-medium text-gray-700">비용: ${result.cost.toFixed(6)}</span>
              </div>
              <div className="border rounded-lg p-3 text-sm bg-white whitespace-pre-wrap">
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
