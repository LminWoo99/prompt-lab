import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { storage } from "@/lib/storage";

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const { data: session } = useSession();
  const [anthropicKey, setAnthropicKey] = useState("");
  const [googleKey, setGoogleKey] = useState("");

  useEffect(() => {
    setAnthropicKey(storage.getAnthropicKey());
    setGoogleKey(storage.getGoogleKey());
  }, []);

  function handleSave() {
    storage.setAnthropicKey(anthropicKey.trim());
    storage.setGoogleKey(googleKey.trim());
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">설정</h2>

        <div className="space-y-4">
          {/* GitHub 계정 */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <img
                src={session?.user?.image ?? ""}
                alt="avatar"
                className="w-8 h-8 rounded-full"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
                <p className="text-xs text-gray-500">GitHub 연결됨</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="text-xs text-red-500 hover:text-red-700"
            >
              로그아웃
            </button>
          </div>

          <hr />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anthropic API Key
            </label>
            <input
              type="password"
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              placeholder="sk-ant-xxxxxxxxxxxx"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google AI API Key
            </label>
            <input
              type="password"
              value={googleKey}
              onChange={(e) => setGoogleKey(e.target.value)}
              placeholder="AIzaxxxxxxxxxxxx"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
