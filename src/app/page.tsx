'use client';

import { useState, useEffect } from 'react';
import { Music, Video, Plus, Users, LogIn, ArrowRight, Disc } from 'lucide-react';
import Link from 'next/link';
import { useSocket } from '@/lib/socket';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [roomCode, setRoomCode] = useState('');
  const [userName, setUserName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [animateHero, setAnimateHero] = useState(false);
  const { socket, isConnected } = useSocket();
  const router = useRouter();

  useEffect(() => {
    // Trigger animation after component mounts
    setAnimateHero(true);

    // Clean up socket listeners when component unmounts
    return () => {
      socket.off('room-joined');
      socket.off('room-error');
      socket.off('room-created');
    };
  }, [socket]);

  const handleJoinRoom = () => {
    if (!roomCode.trim() || !userName.trim()) return;
    
    setIsJoining(true);
    
    // Remove any existing listeners first to prevent duplicates
    socket.off('room-joined');
    socket.off('room-error');
    
    socket.emit('join-room', {
      roomCode: roomCode.toUpperCase(),
      userName: userName.trim()
    });

    socket.on('room-joined', () => {
      router.push(`/room/${roomCode.toUpperCase()}?name=${encodeURIComponent(userName.trim())}`);
    });

    socket.on('room-error', (error) => {
      alert(error.message);
      setIsJoining(false);
    });
  };

  const handleCreateRoom = () => {
    if (!userName.trim()) return;
    
    setIsCreating(true);
    
    // Remove any existing listeners first to prevent duplicates
    socket.off('room-created');
    socket.off('room-error');
    
    socket.emit('create-room', {
      userName: userName.trim()
    });

    socket.on('room-created', (data) => {
      router.push(`/room/${data.roomCode}?name=${encodeURIComponent(userName.trim())}`);
    });

    socket.on('room-error', (error) => {
      alert(error.message);
      setIsCreating(false);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-10 -left-10 w-72 h-72 md:w-96 md:h-96 bg-pink-500 rounded-full filter blur-3xl animate-[pulse_8s_ease-in-out_infinite]"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 md:w-[30rem] md:h-[30rem] bg-violet-500 rounded-full filter blur-3xl animate-[pulse_12s_ease-in-out_infinite_1s]"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 md:w-[25rem] md:h-[25rem] bg-blue-500 rounded-full filter blur-3xl animate-[pulse_10s_ease-in-out_infinite_0.5s]"></div>
      </div>
      
      {/* Header */}
      <header className="relative z-10 p-4 sm:p-6 flex justify-between items-center">
        <div className="flex items-center space-x-2 hover:scale-105 transition-transform duration-200">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
            <Music className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">MusicShare</h1>
        </div>
        <button className="px-3 py-2 sm:px-4 sm:py-2 bg-white/10 backdrop-blur-md text-white rounded-lg hover:bg-white/20 transition-all hover:scale-105 active:scale-95 border border-white/10 hover:border-white/30 flex items-center space-x-2">
          <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Đăng nhập</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-12">
          <div className={`transition-all duration-1000 transform ${animateHero ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg">
              Xem phim và nghe nhạc
              <span className="bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent"> cùng nhau</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Tạo phòng riêng tư để thưởng thức âm nhạc và phim ảnh cùng bạn bè theo thời gian thực
            </p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8 sm:mb-12">
          {/* Create Room Quick */}
          <div className="animate-fadeInRight bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)] transition-all">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-pink-500 to-violet-500 rounded-xl flex items-center justify-center mb-4 sm:mb-6 shadow-[0_5px_15px_rgba(236,72,153,0.3)]">
              <Plus className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Tạo phòng nhanh</h3>
            <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
              Nhập tên của bạn và tạo phòng ngay lập tức
            </p>
            <div className="space-y-3 sm:space-y-4">
              <input
                type="text"
                placeholder="Tên của bạn..."
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-400 focus:bg-white/20 focus:ring-2 focus:ring-pink-400/30 transition-all text-sm sm:text-base"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && userName.trim() && !isCreating && isConnected) {
                    handleCreateRoom();
                  }
                }}
              />
              <button
                onClick={handleCreateRoom}
                disabled={!userName.trim() || isCreating || !isConnected}
                className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-lg hover:from-pink-600 hover:to-violet-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-[0_4px_10px_rgba(236,72,153,0.3)] hover:shadow-[0_4px_15px_rgba(236,72,153,0.5)] active:scale-[0.98]"
              >
                {isCreating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Đang tạo phòng...
                  </div>
                ) : !isConnected ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-pulse w-2 h-2 bg-white rounded-full mr-2"></div>
                    Đang kết nối...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Plus className="w-5 h-5 mr-2" />
                    Tạo phòng ngay
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Join Room */}
          <div className="animate-fadeInUp bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)] transition-all">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 sm:mb-6 shadow-[0_5px_15px_rgba(59,130,246,0.3)]">
              <Users className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Tham gia phòng</h3>
            <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
              Nhập mã phòng để tham gia phòng có sẵn
            </p>
            <div className="space-y-3 sm:space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nhập mã phòng..."
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white/20 focus:ring-2 focus:ring-blue-400/30 transition-all font-mono tracking-wider text-sm sm:text-base"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && roomCode.trim() && userName.trim() && !isJoining && isConnected) {
                      handleJoinRoom();
                    }
                  }}
                />
                {roomCode && (
                  <div className="absolute top-1/2 right-3 transform -translate-y-1/2 w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                )}
              </div>
              <button
                onClick={handleJoinRoom}
                disabled={!roomCode.trim() || !userName.trim() || isJoining || !isConnected}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-[0_4px_10px_rgba(59,130,246,0.3)] hover:shadow-[0_4px_15px_rgba(59,130,246,0.5)] active:scale-[0.98]"
              >
                {isJoining ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Đang tham gia...
                  </div>
                ) : !isConnected ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-pulse w-2 h-2 bg-white rounded-full mr-2"></div>
                    Đang kết nối...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Users className="w-5 h-5 mr-2" />
                    Tham gia
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Advanced Create Room */}
          <Link href="/room/create" className="group animate-fadeInLeft">
            <div className="h-full bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl p-6 sm:p-8 hover:bg-white/15 transition-all cursor-pointer border border-white/20 hover:border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)]">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-4 sm:mb-6 shadow-[0_5px_15px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform duration-300">
                <Video className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Tạo phòng nâng cao</h3>
              <p className="text-gray-300 mb-4 text-sm sm:text-base">
                Tùy chỉnh chi tiết phòng, thêm mô tả và cài đặt quyền riêng tư
              </p>
              <div className="flex items-center text-emerald-400 group-hover:text-emerald-300 transition-colors">
                <span className="font-medium">Tùy chỉnh phòng</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
          <div className="text-center bg-white/5 backdrop-blur-sm p-5 sm:p-6 rounded-xl border border-white/10 hover:bg-white/10 transition-all hover:scale-[1.02]">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Video className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Xem phim cùng nhau</h4>
            <p className="text-gray-400 text-sm sm:text-base">Đồng bộ thời gian phát video để xem cùng nhau dù ở bất kỳ đâu</p>
          </div>
          
          <div className="text-center bg-white/5 backdrop-blur-sm p-5 sm:p-6 rounded-xl border border-white/10 hover:bg-white/10 transition-all hover:scale-[1.02]">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Music className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Nghe nhạc cùng nhau</h4>
            <p className="text-gray-400 text-sm sm:text-base">Chia sẻ playlist và trải nghiệm âm nhạc đồng bộ với bạn bè</p>
          </div>
          
          <div className="text-center bg-white/5 backdrop-blur-sm p-5 sm:p-6 rounded-xl border border-white/10 hover:bg-white/10 transition-all hover:scale-[1.02] sm:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Disc className="w-6 h-6 text-white animate-spin-slow" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Chat thời gian thực</h4>
            <p className="text-gray-400 text-sm sm:text-base">Trò chuyện và chia sẻ cảm xúc trong khi thưởng thức nội dung cùng nhau</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 sm:mt-16 text-center text-gray-400 text-sm p-4">
          <p>&copy; 2025 MusicShare. Chia sẻ khoảnh khắc âm nhạc và phim ảnh.</p>
        </footer>
      </main>
    </div>
  );
}
