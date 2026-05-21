import { useState } from "react";
import { storage } from "@/lib/storage";

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

    const pat = storage.getGhPat();
    if (!pat) {
      setError("설정에서 GitHub PAT를 먼저 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/github/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-github-pat": pat,
        },
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold mb-4">깃에 반영하기</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              생성될 브랜치
            </label>
            <div className="bg-gray-50 border rounded-lg px-3 py-2 text-sm font-mono text-gray-600">
              {previewBranch}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              커밋 메시지 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="prompt: 시스템 프롬프트 개선"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PR 제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={prTitle}
              onChange={(e) => setPrTitle(e.target.value)}
              placeholder="[Prompt] 시스템 프롬프트 v2 개선"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PR 내용 (선택)
            </label>
            <textarea
              value={prBody}
              onChange={(e) => setPrBody(e.target.value)}
              placeholder="변경 내용을 설명해주세요."
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handlePush}
            disabled={loading}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "처리 중..." : "PR 생성"}
          </button>
        </div>
      </div>
    </div>
  );
}
