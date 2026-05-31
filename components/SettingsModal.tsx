import { useSession, signOut } from "next-auth/react";

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const { data: session } = useSession();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-2xl w-full max-w-sm p-6">
        <h2 className="text-sm font-semibold text-[#e8eaed] mb-4">설정</h2>

        <div className="flex items-center justify-between bg-[#131314] border border-[#3c3c3c] rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={session?.user?.image ?? ""} alt="avatar" className="w-8 h-8 rounded-full" />
            <div>
              <p className="text-sm font-medium text-[#e8eaed]">{session?.user?.name}</p>
              <p className="text-xs text-[#9aa0a6]">GitHub 연결됨</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="text-xs text-[#f28b82] hover:text-[#ff9a8d] transition-colors"
          >
            로그아웃
          </button>
        </div>

        <div className="flex justify-end mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#9aa0a6] hover:text-[#e8eaed] transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
