// src/app/room/create/page.tsx

"use client";

import { useState, useEffect } from "react";
import {
  Music,
  Video,
  Copy,
  Users,
  CheckCircle2,
  User,
  Edit3,
  X,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSocket } from "@/lib/socket";
import UserNameModal from "@/components/UserNameModal";

function CreateRoom() {
  const [roomName, setRoomName] = useState("");
  const [userName, setUserName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isUserNameFromStorage, setIsUserNameFromStorage] = useState(false);
  const [isUserNameModalOpen, setIsUserNameModalOpen] = useState(false);
  const { socket, isConnected } = useSocket();
  const router = useRouter();

  useEffect(() => {
    // Load saved username from localStorage
    import("@/lib/local-storage").then((module) => {
      const savedUserName = module.getUserName();
      if (savedUserName) {
        setUserName(savedUserName);
        setIsUserNameFromStorage(true);
      }
    });

    socket.on("room-created", (data) => {
      setRoomCode(data.roomCode);
      setIsCreating(false);
    });

    return () => {
      socket.off("room-created");
    };
  }, [socket]);

  const handleCreateRoom = async () => {
    if (!roomName.trim() || !userName.trim()) return;

    setIsCreating(true);

    socket.emit("create-room", {
      roomName: roomName.trim(),
      userName: userName.trim(),
    });
  };

  const handleClearUserName = () => {
    import("@/lib/local-storage").then((module) => {
      module.clearUserName();
      setUserName("");
      setIsUserNameFromStorage(false);
    });
  };

  const handleSaveUserName = (newUserName: string) => {
    import("@/lib/local-storage").then((module) => {
      module.saveUserName(newUserName);
      setUserName(newUserName);
      setIsUserNameFromStorage(true);
      setIsUserNameModalOpen(false);
    });
  };

  const handleOpenUserNameModal = () => {
    setIsUserNameModalOpen(true);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background decoration to match homepage */}
      <div className="absolute inset-0">
        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-600/20 rounded-full filter blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-2/3 left-1/3 w-64 h-64 bg-pink-600/20 rounded-full filter blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
      </div>

      <header className="relative z-10 p-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300 group-hover:scale-110">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-2 h-2 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
              MusicShare
            </h1>
            <span className="text-xs text-purple-300 -mt-1">v0.2.beta</span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-200 text-white/80 hover:text-white text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Trang chủ</span>
        </Link>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-4 sm:py-6">
        <div className="max-w-md sm:max-w-lg mx-auto">
          <div className="text-center mb-6">
            <div className="relative mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-2xl shadow-lg shadow-purple-500/25">
                <Video className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-2">
              <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                Tạo phòng mới
              </span>
            </h2>
            <p className="text-gray-300 text-sm max-w-sm mx-auto">
              Tạo phòng riêng tư để xem phim và nghe nhạc cùng bạn bè
            </p>
          </div>

          {!roomCode ? (
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="flex text-white/90 font-medium text-sm items-center">
                    <Users className="w-4 h-4 mr-2 text-purple-400" />
                    Tên của bạn
                  </label>
                  {userName && isUserNameFromStorage ? (
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/20 rounded-2xl p-4 flex items-center justify-between backdrop-blur-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-green-300 font-medium">
                            Tên đã lưu
                          </p>
                          <p className="text-white font-semibold">{userName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleOpenUserNameModal}
                          className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-110"
                          title="Đổi tên"
                        >
                          <Edit3 className="w-4 h-4 text-gray-400 hover:text-white" />
                        </button>
                        <button
                          onClick={handleClearUserName}
                          className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-110"
                          title="Xóa tên đã lưu"
                        >
                          <X className="w-4 h-4 text-gray-400 hover:text-white" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Nhập tên của bạn..."
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 focus:bg-white/10 focus:ring-2 focus:ring-purple-400/20 transition-all backdrop-blur-sm"
                      autoFocus
                    />
                  )}
                </div>

                <div className="space-y-3">
                  <label className="flex text-white/90 font-medium text-sm items-center">
                    <Music className="w-4 h-4 mr-2 text-purple-400" />
                    Tên phòng
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập tên phòng..."
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 focus:bg-white/10 focus:ring-2 focus:ring-purple-400/20 transition-all backdrop-blur-sm"
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        roomName.trim() &&
                        userName.trim() &&
                        !isCreating &&
                        isConnected
                      ) {
                        handleCreateRoom();
                      }
                    }}
                  />
                </div>

                <button
                  onClick={handleCreateRoom}
                  disabled={
                    !roomName.trim() ||
                    !userName.trim() ||
                    isCreating ||
                    !isConnected
                  }
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white rounded-2xl hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
                >
                  {isCreating ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Đang tạo phòng...
                    </div>
                  ) : !isConnected ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-pulse w-2 h-2 bg-white rounded-full mr-3"></div>
                      Đang kết nối...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Video className="w-5 h-5 mr-3" />
                      Tạo phòng
                    </div>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">
              <div className="text-center space-y-6">
                {/* Success Icon */}
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-green-500/25">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Success Message */}
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">
                    <span className="bg-gradient-to-r from-white via-green-200 to-white bg-clip-text text-transparent">
                      🎉 Phòng đã được tạo!
                    </span>
                  </h3>
                  <p className="text-gray-300 text-sm max-w-xs mx-auto">
                    Chia sẻ mã phòng với bạn bè để tham gia xem cùng
                  </p>
                </div>

                {/* Room Code Display */}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/20 rounded-2xl p-6 hover:bg-white/10 transition-all backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-left flex-1">
                      <p className="text-gray-400 text-xs font-medium mb-2">
                        Mã phòng
                      </p>
                      <p className="text-3xl font-bold text-white font-mono tracking-wider select-all">
                        {roomCode}
                      </p>
                    </div>
                    <button
                      onClick={copyRoomCode}
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all hover:scale-110 active:scale-95 border border-white/20 ml-4"
                      title="Sao chép mã phòng"
                    >
                      {isCopied ? (
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                      ) : (
                        <Copy className="w-6 h-6 text-white" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() =>
                      router.push(
                        `/room/${roomCode}?name=${encodeURIComponent(userName)}`
                      )
                    }
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white rounded-2xl hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600 hover:shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all font-semibold shadow-lg"
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <Video className="w-5 h-5" />
                      <span>Vào phòng ngay</span>
                    </div>
                  </button>

                  <Link
                    href="/"
                    className="block w-full px-6 py-4 bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all font-medium backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <Music className="w-5 h-5" />
                      <span>Tạo phòng khác</span>
                    </div>
                  </Link>
                </div>

                {/* Additional Info */}
                <div className="text-center pt-2">
                  <p className="text-gray-400 text-xs">
                    💡 Bạn bè có thể tham gia bằng cách nhập mã phòng trên trang
                    chủ
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer với thông tin tác giả */}
      <footer className="relative z-10 mt-auto py-6 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-gray-400 text-xs mb-1">Được tạo bởi</p>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-white font-semibold">HDQuanDev</span>
              <span className="px-2 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-lg text-xs text-purple-300 font-medium">
                v0.2.beta
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* User Name Modal */}
      <UserNameModal
        isOpen={isUserNameModalOpen}
        onClose={() => setIsUserNameModalOpen(false)}
        onSave={handleSaveUserName}
        initialUserName={userName}
      />
    </div>
  );
}

export default CreateRoom;
