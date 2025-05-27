'use client';

import { useState } from 'react';
import { Music, Video, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { useSocket } from '@/lib/socket';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [roomCode, setRoomCode] = useState('');
  const [userName, setUserName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const { socket, isConnected } = useSocket();
  const router = useRouter();

  const handleJoinRoom = () => {
    if (!roomCode.trim() || !userName.trim()) return;
    
    setIsJoining(true);
    
    socket.emit('join-room', {
      roomCode: roomCode.toUpperCase(),
      userName: userName.trim()
    });

    socket.on('room-joined', (room) => {
      router.push(`/room/${roomCode.toUpperCase()}?name=${encodeURIComponent(userName.trim())}`);
    });

    socket.on('room-error', (error) => {
      alert(error.message);
      setIsJoining(false);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header với responsive design */}
      <header className="sticky top-0 backdrop-blur-md bg-black/20 border-b border-white/10 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-violet-500 rounded-lg flex items-center justify-center">
                <Music className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">MusicShare</h1>
            </div>
            
            {/* Connection status và login */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                <span className="text-xs text-gray-300 hidden sm:block">
                  {isConnected ? 'Đã kết nối' : 'Đang kết nối...'}
                </span>
              </div>
              <button className="px-3 py-2 sm:px-4 sm:py-2 bg-white/10 backdrop-blur-md text-white text-sm rounded-lg hover:bg-white/20 transition-all">
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="mb-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-pink-500 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Video className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Xem phim và nghe nhạc
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent"> cùng nhau</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Tạo phòng riêng tư để thưởng thức âm nhạc và phim ảnh cùng bạn bè theo thời gian thực. 
            Đồng bộ hoàn hảo, trải nghiệm tuyệt vời.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto mb-12 sm:mb-16">
          {/* Create Room Card */}
          <Link href="/room/create" className="group block">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:bg-white/20 transition-all cursor-pointer border border-white/20 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98]">
              <div className="w-16 h-16 sm:w-18 sm:h-18 bg-gradient-to-r from-pink-500 to-violet-500 rounded-xl flex items-center justify-center mb-6">
                <Plus className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Tạo phòng mới</h3>
              <p className="text-gray-300 mb-6 text-sm sm:text-base leading-relaxed">
                Tạo một phòng riêng tư và mời bạn bè tham gia xem phim hoặc nghe nhạc cùng nhau. 
                Bạn sẽ là host với quyền điều khiển.
              </p>
              <div className="flex items-center text-pink-400 group-hover:text-pink-300 transition-colors font-medium">
                <span>Bắt đầu ngay</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Join Room Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/20 shadow-xl">
            <div className="w-16 h-16 sm:w-18 sm:h-18 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Tham gia phòng</h3>
            <p className="text-gray-300 mb-6 text-sm sm:text-base leading-relaxed">
              Có mã phòng từ bạn bè? Nhập thông tin để tham gia ngay lập tức.
            </p>
            
            <form onSubmit={(e) => { e.preventDefault(); handleJoinRoom(); }} className="space-y-4">
              <input
                type="text"
                placeholder="Tên hiển thị của bạn..."
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-3 sm:py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white/20 focus:ring-2 focus:ring-blue-400/20 transition-all text-sm sm:text-base"
                required
                maxLength={30}
              />
                type="text"
                placeholder="Nhập mã phòng..."
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition-all font-mono tracking-wider"
              />
              <button
                onClick={handleJoinRoom}
                disabled={!roomCode.trim() || !userName.trim() || isJoining || !isConnected}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isJoining ? 'Đang tham gia...' : !isConnected ? 'Đang kết nối...' : 'Tham gia'}
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Video className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Xem phim cùng nhau</h4>
            <p className="text-gray-400">Đồng bộ thời gian phát video với bạn bè</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Music className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Nghe nhạc cùng nhau</h4>
            <p className="text-gray-400">Chia sẻ playlist và nghe nhạc đồng bộ</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Chat thời gian thực</h4>
            <p className="text-gray-400">Trò chuyện trong khi thưởng thức nội dung</p>
          </div>
        </div>
      </main>
    </div>
  );
}
