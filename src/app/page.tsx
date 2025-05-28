"use client";

import { useState, useEffect } from "react";
import {
  Music,
  Video,
  Plus,
  Users,
  LogIn,
  ArrowRight,
  X,
  User,
  Edit3,
  Star,
  Github,
  Heart,
  Sparkles,
  Play,
  Headphones,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { useSocket } from "@/lib/socket";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import UserNameModal from "@/components/UserNameModal";

export default function Home() {
  const [roomCode, setRoomCode] = useState("");
  const [userName, setUserName] = useState("");
  const [joinUserName, setJoinUserName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [animateHero, setAnimateHero] = useState(false);
  const [isUserNameFromStorage, setIsUserNameFromStorage] = useState(false);
  const [isUserNameModalOpen, setIsUserNameModalOpen] = useState(false);
  const { socket, isConnected } = useSocket();
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    // Trigger animation after component mounts
    setAnimateHero(true);

    // Load saved username from localStorage
    import("@/lib/local-storage").then((module) => {
      const savedUserName = module.getUserName();
      if (savedUserName) {
        setUserName(savedUserName);
        setJoinUserName(savedUserName);
        setIsUserNameFromStorage(true);
      }
    });

    // Clean up socket listeners when component unmounts
    return () => {
      socket.off("room-joined");
      socket.off("room-error");
      socket.off("room-created");
    };
  }, [socket]);

  const handleJoinRoom = () => {
    if (!roomCode.trim() || !joinUserName.trim()) {
      showToast("Vui lòng nhập cả mã phòng và tên của bạn", "error");
      return;
    }

    setIsJoining(true);

    // Remove any existing listeners first to prevent duplicates
    socket.off("room-joined");
    socket.off("room-error");

    socket.emit("join-room", {
      roomCode: roomCode.toUpperCase(),
      userName: joinUserName.trim(),
    });

    socket.on("room-joined", () => {
      // Lưu tên người dùng vào localStorage trước khi chuyển hướng
      import("@/lib/local-storage").then((module) => {
        module.saveUserName(joinUserName.trim());
        showToast(
          `Đang tham gia phòng ${roomCode.toUpperCase()}...`,
          "success"
        );
        router.push(`/room/${roomCode.toUpperCase()}`);
      });
    });

    socket.on("room-error", (error) => {
      showToast(error.message, "error");
      setIsJoining(false);
    });
  };

  const handleCreateRoom = () => {
    if (!userName.trim()) {
      showToast("Please enter your name to create a room", "error");
      return;
    }

    setIsCreating(true);

    // Remove any existing listeners first to prevent duplicates
    socket.off("room-created");
    socket.off("room-error");

    socket.emit("create-room", {
      userName: userName.trim(),
    });

    socket.on("room-created", (data) => {
      // Lưu tên người dùng vào localStorage trước khi chuyển hướng
      import("@/lib/local-storage").then((module) => {
        module.saveUserName(userName.trim());
        showToast(
          `Room created successfully! Room code: ${data.roomCode}`,
          "success"
        );
        router.push(`/room/${data.roomCode}`);
      });
    });

    socket.on("room-error", (error) => {
      showToast(error.message, "error");
      setIsCreating(false);
    });
  };

  const handleClearUserName = () => {
    import("@/lib/local-storage").then((module) => {
      module.clearUserName();
      setUserName("");
      setJoinUserName("");
      setIsUserNameFromStorage(false);
      showToast("Tên đã được xóa", "success");
    });
  };

  const handleSaveUserName = (newUserName: string) => {
    import("@/lib/local-storage").then((module) => {
      module.saveUserName(newUserName);
      setUserName(newUserName);
      setJoinUserName(newUserName);
      setIsUserNameFromStorage(true);
      setIsUserNameModalOpen(false);
      showToast("Tên đã được cập nhật", "success");
    });
  };

  const handleOpenUserNameModal = () => {
    setIsUserNameModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating orbs */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
      </div>
      {/* Header */}
      <header className="relative z-10 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                <Music className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                MusicShare
              </h1>
              <p className="text-xs text-purple-300 font-medium">v0.2.beta</p>
            </div>
          </div>

          {/* User Profile */}
          {userName ? (
            <button
              onClick={handleOpenUserNameModal}
              className="group flex items-center space-x-3 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full hover:bg-white/20 transition-all duration-300 hover:scale-105"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-medium max-w-32 truncate">
                {userName}
              </span>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </button>
          ) : (
            <button
              onClick={handleOpenUserNameModal}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <LogIn className="w-5 h-5" />
              <span className="font-medium">Đăng nhập</span>
            </button>
          )}
        </div>
      </header>{" "}
      {/* Hero Section - Tối ưu cho above the fold */}
      <main className="relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Content - Compact */}
          <div className="text-center py-8 sm:py-12">
            <div
              className={`transition-all duration-1000 transform ${
                animateHero
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
            >
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-500/20 border border-purple-400/30 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-purple-300" />
                <span className="text-purple-200 text-sm font-medium">
                  Xem phim & nghe nhạc cùng nhau
                </span>
              </div>

              {/* Main Title - Compact */}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                  Chia sẻ
                </span>
                <span className="mx-2 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">
                  Khoảnh khắc âm nhạc
                </span>
              </h2>

              {/* Subtitle - Compact */}
              <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8">
                Tạo phòng riêng tư để thưởng thức âm nhạc và phim ảnh cùng bạn
                bè
                <span className="text-purple-300 font-semibold">
                  {" "}
                  theo thời gian thực
                </span>
              </p>
            </div>
          </div>

          {/* Action Cards - Priority above the fold */}
          <div className="grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
            {/* Quick Create Room */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                    <Plus className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      Tạo phòng nhanh
                    </h3>
                    <p className="text-purple-200 text-sm">
                      Bắt đầu ngay lập tức
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {userName && isUserNameFromStorage ? (
                    <div className="flex items-center justify-between p-3 bg-green-500/20 border border-green-400/30 rounded-2xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-green-200">Xin chào</p>
                          <p className="text-white font-semibold text-sm">
                            {userName}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={handleOpenUserNameModal}
                          className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                          title="Đổi tên"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-green-300 hover:text-white" />
                        </button>
                        <button
                          onClick={handleClearUserName}
                          className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                          title="Xóa tên"
                        >
                          <X className="w-3.5 h-3.5 text-green-300 hover:text-white" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Nhập tên của bạn..."
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:bg-white/20 focus:ring-2 focus:ring-purple-400/30 transition-all"
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          userName.trim() &&
                          !isCreating &&
                          isConnected
                        ) {
                          handleCreateRoom();
                        }
                      }}
                    />
                  )}

                  <button
                    onClick={handleCreateRoom}
                    disabled={!userName.trim() || isCreating || !isConnected}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl active:scale-[0.98] group"
                  >
                    {isCreating ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Đang tạo phòng...</span>
                      </div>
                    ) : !isConnected ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-pulse w-2 h-2 bg-white rounded-full"></div>
                        <span>Đang kết nối...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        <span>Tạo phòng ngay</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Join Room */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      Tham gia phòng
                    </h3>
                    <p className="text-blue-200 text-sm">Kết nối với bạn bè</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Nhập mã phòng (6 ký tự)..."
                      value={roomCode}
                      onChange={(e) =>
                        setRoomCode(e.target.value.toUpperCase())
                      }
                      maxLength={6}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white/20 focus:ring-2 focus:ring-blue-400/30 transition-all font-mono tracking-widest text-center text-lg"
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          roomCode.trim() &&
                          joinUserName.trim() &&
                          !isJoining &&
                          isConnected
                        ) {
                          handleJoinRoom();
                        }
                      }}
                    />
                    {roomCode && roomCode.length === 6 && (
                      <div className="absolute top-1/2 right-3 transform -translate-y-1/2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      </div>
                    )}
                  </div>

                  {joinUserName && isUserNameFromStorage ? (
                    <div className="flex items-center justify-between p-3 bg-green-500/20 border border-green-400/30 rounded-2xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-green-200">Xin chào</p>
                          <p className="text-white font-semibold text-sm">
                            {joinUserName}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={handleOpenUserNameModal}
                          className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                          title="Đổi tên"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-green-300 hover:text-white" />
                        </button>
                        <button
                          onClick={handleClearUserName}
                          className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                          title="Xóa tên"
                        >
                          <X className="w-3.5 h-3.5 text-green-300 hover:text-white" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Nhập tên của bạn..."
                      value={joinUserName}
                      onChange={(e) => setJoinUserName(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white/20 focus:ring-2 focus:ring-blue-400/30 transition-all"
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          roomCode.trim() &&
                          joinUserName.trim() &&
                          !isJoining &&
                          isConnected
                        ) {
                          handleJoinRoom();
                        }
                      }}
                    />
                  )}

                  <button
                    onClick={handleJoinRoom}
                    disabled={
                      !roomCode.trim() ||
                      !joinUserName.trim() ||
                      isJoining ||
                      !isConnected
                    }
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl active:scale-[0.98] group"
                  >
                    {isJoining ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Đang tham gia...</span>
                      </div>
                    ) : !isConnected ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-pulse w-2 h-2 bg-white rounded-full"></div>
                        <span>Đang kết nối...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Users className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                        <span>Tham gia ngay</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="text-center mb-8">
            <Link
              href="/room/create"
              className="group inline-flex items-center space-x-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-2xl transition-all duration-300 hover:scale-105"
            >
              <Video className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-white font-medium">
                Tạo phòng với tùy chọn nâng cao
              </span>
              <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>

          {/* Stats Section */}
          <div className="flex justify-center items-center space-x-8 mb-16">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">1K+</div>
              <div className="text-sm text-gray-400">Phòng đã tạo</div>
            </div>
            <div className="w-px h-12 bg-gray-600"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">5K+</div>
              <div className="text-sm text-gray-400">Người dùng</div>
            </div>
            <div className="w-px h-12 bg-gray-600"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">99.9%</div>
              <div className="text-sm text-gray-400">Uptime</div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="group text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Play className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <Heart className="w-3 h-3 text-white fill-current" />
                </div>
              </div>
              <h4 className="text-xl font-bold text-white mb-3">
                Đồng bộ hoàn hảo
              </h4>
              <p className="text-gray-400 leading-relaxed">
                Công nghệ đồng bộ thời gian thực giúp bạn và bạn bè xem phim,
                nghe nhạc cùng lúc dù ở bất kỳ đâu
              </p>
            </div>

            <div className="group text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Headphones className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <Music className="w-3 h-3 text-white" />
                </div>
              </div>
              <h4 className="text-xl font-bold text-white mb-3">
                Chất lượng cao
              </h4>
              <p className="text-gray-400 leading-relaxed">
                Hỗ trợ streaming chất lượng HD, âm thanh crystal clear và giao
                diện mượt mà trên mọi thiết bị
              </p>
            </div>

            <div className="group text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <MessageCircle className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <h4 className="text-xl font-bold text-white mb-3">
                Tương tác thú vị
              </h4>
              <p className="text-gray-400 leading-relaxed">
                Chat real-time, emoji reactions, và nhiều tính năng tương tác
                giúp trải nghiệm thêm thú vị
              </p>
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t border-white/10 pt-12 pb-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-white font-bold">MusicShare</div>
                  <div className="text-sm text-gray-400">
                    Chia sẻ khoảnh khắc âm nhạc
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-sm text-gray-400">Phát triển bởi</div>
                  <div className="flex items-center space-x-2">
                    <Github className="w-4 h-4 text-purple-400" />
                    <span className="text-white font-semibold">HDQuanDev</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">Phiên bản</div>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-white font-semibold">0.2.beta</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-8 pt-6 border-t border-white/5">
              <p className="text-gray-400 text-sm">
                © 2025 MusicShare by HDQuanDev. Made with{" "}
                <Heart className="w-4 h-4 text-red-400 fill-current inline mx-1" />{" "}
                for music lovers.
              </p>
            </div>
          </footer>
        </div>
      </main>
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
