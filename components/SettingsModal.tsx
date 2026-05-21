import { useSession, signOut } from "next-auth/react";

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const { data: session } = useSession();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">설정</h2>

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

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
