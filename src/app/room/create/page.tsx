// src/app/room/create/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Music, Video, Copy, Users, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/lib/socket';

function CreateRoom() {
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { socket, isConnected } = useSocket();
  const router = useRouter();

  useEffect(() => {
    socket.on('room-created', (data) => {
      setRoomCode(data.roomCode);
      setIsCreating(false);
    });

    return () => {
      socket.off('room-created');
    };
  }, [socket]);

  const handleCreateRoom = async () => {
    if (!roomName.trim() || !userName.trim()) return;
    
    setIsCreating(true);
    
    socket.emit('create-room', {
      roomName: roomName.trim(),
      userName: userName.trim()
    });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Enhanced background decoration with more subtle animations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-10 -left-10 w-72 h-72 md:w-96 md:h-96 bg-pink-500 rounded-full filter blur-3xl animate-[pulse_8s_ease-in-out_infinite]"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 md:w-[30rem] md:h-[30rem] bg-violet-500 rounded-full filter blur-3xl animate-[pulse_12s_ease-in-out_infinite_1s]"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 md:w-[25rem] md:h-[25rem] bg-blue-500 rounded-full filter blur-3xl animate-[pulse_10s_ease-in-out_infinite_0.5s]"></div>
      </div>

      <header className="relative z-10 p-3 sm:p-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2 hover:scale-105 transition-transform duration-200">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
            <Music className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">MusicShare</h1>
        </Link>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-4 sm:py-6">
        <div className="max-w-md sm:max-w-lg mx-auto">
          <div className="text-center mb-4 sm:mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full mb-3 shadow-lg">
              <Video className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 drop-shadow-lg">Tạo phòng mới</h2>
            <p className="text-gray-300 text-sm max-w-sm mx-auto">
              Tạo phòng riêng tư để xem phim và nghe nhạc cùng bạn bè
            </p>
          </div>

          {!roomCode ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/20 shadow-lg transition-all">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="flex text-white font-medium text-sm items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Tên của bạn
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập tên của bạn..."
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white/20 focus:ring-2 focus:ring-blue-400/50 transition-all text-sm"
                    autoFocus
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="flex text-white font-medium text-sm items-center">
                    <Music className="w-4 h-4 mr-2" />
                    Tên phòng
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập tên phòng..."
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white/20 focus:ring-2 focus:ring-blue-400/50 transition-all text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && roomName.trim() && userName.trim() && !isCreating && isConnected) {
                        handleCreateRoom();
                      }
                    }}
                  />
                </div>

                <button
                  onClick={handleCreateRoom}
                  disabled={!roomName.trim() || !userName.trim() || isCreating || !isConnected}
                  className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-xl hover:from-pink-600 hover:to-violet-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-lg"
                >
                  {isCreating ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang tạo phòng...
                    </div>
                  ) : !isConnected ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-pulse w-2 h-2 bg-white rounded-full mr-2"></div>
                      Đang kết nối...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Video className="w-4 h-4 mr-2" />
                      Tạo phòng
                    </div>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/20 shadow-lg transition-all">
              <div className="text-center space-y-4">
                {/* Success Icon */}
                <div className="relative">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                </div>
                
                {/* Success Message */}
                <div className="space-y-1">
                  <h3 className="text-lg sm:text-xl font-bold text-white">🎉 Phòng đã được tạo!</h3>
                  <p className="text-gray-300 text-sm max-w-xs mx-auto">
                    Chia sẻ mã phòng với bạn bè để tham gia xem cùng
                  </p>
                </div>

                {/* Room Code Display */}
                <div className="bg-white/10 border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-gray-400 text-xs font-medium mb-1">Mã phòng</p>
                      <p className="text-xl sm:text-2xl font-bold text-white font-mono tracking-wider select-all">
                        {roomCode}
                      </p>
                    </div>
                    <button
                      onClick={copyRoomCode}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all hover:scale-110 active:scale-95 border border-white/20"
                      title="Sao chép mã phòng"
                    >
                      {isCopied ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => router.push(`/room/${roomCode}?name=${encodeURIComponent(userName)}`)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all font-medium text-sm shadow-lg"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Video className="w-4 h-4" />
                      <span>Vào phòng ngay</span>
                    </div>
                  </button>
                  
                  <Link
                    href="/"
                    className="block w-full px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 hover:border-white/40 hover:scale-[1.02] active:scale-[0.98] transition-all font-medium text-sm"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Music className="w-4 h-4" />
                      <span>Tạo phòng khác</span>
                    </div>
                  </Link>
                </div>

                {/* Additional Info */}
                <div className="text-center pt-2">
                  <p className="text-gray-400 text-xs">
                    💡 Bạn bè có thể tham gia bằng cách nhập mã phòng trên trang chủ
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default CreateRoom;
