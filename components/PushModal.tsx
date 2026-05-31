import { useState } from "react";

interface Props {
  promptContent: string;
  onClose: () => void;
  onSuccess: (prUrl: string) => void;
}

export default function PushModal({ promptContent, onClose, onSuccess }: Props) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6);
  const previewBranch = `feature/prompt/${today}/${rand}`;

  const [commitMessage, setCommitMessage] = useState("");
  const [prTitle, setPrTitle] = useState("");
  const [prBody, setPrBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePush() {
    if (!commitMessage.trim() || !prTitle.trim()) {
      setError("커밋 메시지와 PR 제목은 필수입니다.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/github/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: promptContent,
          commitMessage: commitMessage.trim(),
          prTitle: prTitle.trim(),
          prBody: prBody.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess(data.prUrl);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-2xl w-full max-w-lg p-6">
        <h2 className="text-sm font-semibold text-[#e8eaed] mb-5">깃에 반영하기</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[#9aa0a6] mb-1.5">생성될 브랜치</label>
            <div className="bg-[#131314] border border-[#3c3c3c] rounded-xl px-3 py-2 text-xs font-mono text-[#8ab4f8]">
              {previewBranch}
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#9aa0a6] mb-1.5">
              커밋 메시지 <span className="text-[#f28b82]">*</span>
            </label>
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="prompt: 시스템 프롬프트 개선"
              className="w-full bg-[#131314] border border-[#3c3c3c] text-[#e8eaed] placeholder-[#4a4a4a] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8ab4f8] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-[#9aa0a6] mb-1.5">
              PR 제목 <span className="text-[#f28b82]">*</span>
            </label>
            <input
              type="text"
              value={prTitle}
              onChange={(e) => setPrTitle(e.target.value)}
              placeholder="[Prompt] 시스템 프롬프트 v2 개선"
              className="w-full bg-[#131314] border border-[#3c3c3c] text-[#e8eaed] placeholder-[#4a4a4a] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8ab4f8] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-[#9aa0a6] mb-1.5">PR 내용 (선택)</label>
            <textarea
              value={prBody}
              onChange={(e) => setPrBody(e.target.value)}
              placeholder="변경 내용을 설명해주세요."
              rows={3}
              className="w-full bg-[#131314] border border-[#3c3c3c] text-[#e8eaed] placeholder-[#4a4a4a] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8ab4f8] transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-[#f28b82] bg-[#3a1a1a] border border-[#6a2a2a] rounded-xl px-3 py-2">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-[#9aa0a6] hover:text-[#e8eaed] disabled:opacity-40 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handlePush}
            disabled={loading}
            className="px-4 py-2 text-sm bg-[#8ab4f8] text-[#131314] font-semibold rounded-xl hover:bg-[#aecbfa] disabled:opacity-40 transition-colors"
          >
            {loading ? "처리 중..." : "PR 생성"}
          </button>
        </div>
      </div>
    </div>
  );
}
