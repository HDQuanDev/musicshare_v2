// src/app/room/[code]/page.tsx

"use client";

import { useState, useEffect, useRef, use } from "react";
import {
  Play,
  Pause,
  Volume2,
  MessageCircle,
  Users,
  X,
  Volume1,
  VolumeX,
  Maximize2,
  ArrowLeft,
  ChevronDown,
  Search,
  List,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { useSocket, searchYouTubeVideos } from "@/lib/socket";
import { useRouter, useSearchParams } from "next/navigation";
import { User, ChatMessage, MediaItem } from "@/types";
import VideoPlayer from "@/components/VideoPlayer";
import VideoSearch from "@/components/VideoSearch";
import VideoQueue, { QueuedVideo } from "@/components/VideoQueue";
import { YouTubePlayer } from "react-youtube";

interface RoomPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const resolvedParams = use(params);
  // Trạng thái cơ bản
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [localDisplayTime, setLocalDisplayTime] = useState(0); // Chỉ để hiển thị UI
  const [duration, setDuration] = useState(0);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0); // For unread message counter
  const [users, setUsers] = useState<User[]>([]);
  const [isRoomJoined, setIsRoomJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(true);
  const [isFullUI, setIsFullUI] = useState(true); // New state for UI mode

  // Current user tracking
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Trạng thái UI mobile
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false); // For mobile chat display
  const [showQueue, setShowQueue] = useState(false); // For mobile queue display
  const [showMobileSearch, setShowMobileSearch] = useState(false); // For mobile search display

  // Trạng thái video
  const [currentVideo, setCurrentVideo] = useState<MediaItem | null>(null);
  const [videoQueue, setVideoQueue] = useState<QueuedVideo[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [youtubePlayer, setYoutubePlayer] = useState<YouTubePlayer | null>(
    null
  );
  const [volume, setVolume] = useState(70); // Default volume
  const [isVolumeMuted, setIsVolumeMuted] = useState(false);
  const [lastVolume, setLastVolume] = useState(70);
  const [showMinimalControls, setShowMinimalControls] = useState(false); // For minimal controls in fullscreen mode

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { socket, isConnected } = useSocket();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const nameFromUrl = searchParams.get("name");

    // Set current user details
    setCurrentUserName(nameFromUrl || "Anonymous");

    // Check socket connection
    console.log("Socket connected status:", isConnected);

    // Join room when component mounts
    socket.emit("join-room", {
      roomCode: resolvedParams.code,
      userName: nameFromUrl || "Anonymous",
    });

    // Socket event listeners
    socket.on("room-joined", (room) => {
      console.log("Room joined:", room);
      setUsers(room.users);
      setIsPlaying(room.isPlaying);
      setCurrentTime(room.currentTime);
      setLocalDisplayTime(room.currentTime); // Sync display time với room state

      // Set room volume if available
      if (room.volume !== undefined) {
        setVolume(room.volume);
      }

      // Lấy lịch sử tin nhắn từ phòng
      if (room.messages && room.messages.length > 0) {
        setMessages(room.messages);
      }

      // Lấy thông tin về media hiện tại và queue
      if (room.currentMedia) {
        setCurrentVideo(room.currentMedia);
      }

      if (room.mediaQueue && room.mediaQueue.length > 0) {
        setVideoQueue(
          room.mediaQueue.map((media: MediaItem) => ({
            id: media.videoId || media.id,
            title: media.title,
            channelTitle: media.channelTitle || "",
            thumbnail: media.thumbnail || "",
          }))
        );
        setCurrentVideoIndex(room.currentQueueIndex);
      }

      // Set current user ID
      if (socket.id) {
        setCurrentUserId(socket.id);
      }
      
      const currentUser = room.users.find(
        (user: User) => user.name === (nameFromUrl || "Anonymous")
      );
      if (currentUser && currentUser.id) {
        setCurrentUserId(currentUser.id);
      }

      setIsRoomJoined(true);
      setIsJoining(false);
    });

    socket.on("user-joined", (user) => {
      setUsers((prev) => [...prev, user]);
    });

    socket.on("user-left", (userId) => {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    });

    socket.on("new-message", (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      
      // Increment unread messages counter when in fullscreen mode or on mobile when chat isn't open
      if (!isFullUI || (window.innerWidth < 768 && !isMobileChatOpen)) {
        setUnreadMessages((prev) => prev + 1);
        
        // Play notification sound if the message is not from the current user
        // Only play if chat is not currently focused
        if (newMessage.userId !== currentUserId) {
          try {
            // Create a subtle notification sound
            // Use proper type definition to avoid 'any'
            const AudioContextClass = (window.AudioContext || 
              (window as unknown as {webkitAudioContext: typeof window.AudioContext}).webkitAudioContext);
              
            if (AudioContextClass) {
              const audioCtx = new AudioContextClass();
              const oscillator = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              
              oscillator.type = 'sine';
              oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
              
              gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
              gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
              gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
              
              oscillator.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              
              oscillator.start();
              oscillator.stop(audioCtx.currentTime + 0.3);
            }
          } catch (error) {
            // Use the error variable or use '_' to explicitly ignore it
            console.log('Audio notification not supported:', error instanceof Error ? error.message : 'Unknown error');
          }
        }
      }
    });

    socket.on("play", () => {
      setIsPlaying(true);
    });

    socket.on("pause", () => {
      setIsPlaying(false);
    });

    socket.on("seek", (time) => {
      setCurrentTime(time);
      setLocalDisplayTime(time); // Cập nhật cả display time
    });

    socket.on("media-changed", (media) => {
      if (media) {
        console.log("Media changed:", media);
        setCurrentVideo(media);
        setDuration(media.duration || 0);
      } else {
        setCurrentVideo(null);
        setDuration(0);
      }
    });

    socket.on("queue-updated", (queue) => {
      console.log("Queue updated:", queue);
      setVideoQueue(
        queue.map((media: MediaItem) => ({
          id: media.videoId || media.id,
          title: media.title,
          channelTitle: media.channelTitle || "",
          thumbnail: media.thumbnail || "",
        }))
      );
    });

    socket.on("queue-index-changed", (index) => {
      console.log("Queue index changed:", index);
      setCurrentVideoIndex(index);
    });

    // Listen for volume changes from other users
    socket.on("volume-change", (newVolume) => {
      console.log("Received volume change:", newVolume);
      setVolume(newVolume);
      if (youtubePlayer) {
        youtubePlayer.setVolume(newVolume);
      }
    });

    // Handle special sync event for new users joining when media is playing
    socket.on("sync-playback", (syncData) => {
      console.log("Received playback sync data:", syncData);

      if (syncData.media) {
        setCurrentVideo(syncData.media);
        setDuration(syncData.media.duration || 0);
      }

      // Calculate time elapsed since server sent the sync data
      const now = new Date().getTime();
      const timeOffset = (now - syncData.serverTimestamp) / 1000; // Convert ms to seconds

      // Adjust current time based on elapsed time since server timestamp
      const adjustedTime =
        syncData.currentTime + (syncData.isPlaying ? timeOffset : 0);
      console.log(
        `Syncing playback to position: ${adjustedTime} (with ${timeOffset}s offset)`
      );

      // Also sync volume if provided
      if (syncData.volume !== undefined) {
        setVolume(syncData.volume);
      }

      setCurrentTime(adjustedTime);
      setLocalDisplayTime(adjustedTime); // Sync display time
      setIsPlaying(syncData.isPlaying);

      // If video should be playing and we have a player, try to sync immediately
      if (syncData.isPlaying && youtubePlayer) {
        console.log("Attempting to sync playing video immediately");
        youtubePlayer.seekTo(adjustedTime, true);
        youtubePlayer.playVideo().catch(() => {
          console.log("Auto-sync play blocked, user will need to interact");
        });
      }
    });

    socket.on("room-error", (error) => {
      alert(error.message);
      setIsJoining(false);
      router.push("/");
    });

    return () => {
      // Only cleanup socket listeners, don't leave room automatically
      // Room leaving will be handled by socket disconnect event on server
      socket.off("room-joined");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("new-message");
      socket.off("play");
      socket.off("pause");
      socket.off("seek");
      socket.off("media-changed");
      socket.off("queue-updated");
      socket.off("queue-index-changed");
      socket.off("volume-change");
      socket.off("sync-playback");
      socket.off("room-error");
    };
  }, [resolvedParams.code, socket, router, searchParams, isConnected, youtubePlayer, isMobileChatOpen, isFullUI, currentUserId]);

  // Handle page unload - leave room when user actually leaves
  useEffect(() => {
    const handleBeforeUnload = () => {
      socket.emit("leave-room");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [socket]);

  // Effect to rejoin room when socket reconnects
  useEffect(() => {
    if (isConnected && !isRoomJoined && !isJoining) {
      console.log("Socket reconnected, attempting to rejoin room");
      const nameFromUrl = searchParams.get("name");

      setIsJoining(true);
      socket.emit("join-room", {
        roomCode: resolvedParams.code,
        userName: nameFromUrl || "Anonymous",
      });
    }
  }, [isConnected, isRoomJoined, isJoining, resolvedParams.code, searchParams, socket]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Create ref for controls timer outside of useEffect
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Listen for escape key to exit fullscreen/minimal UI mode and handle mouse movement
  useEffect(() => {
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isFullUI) {
        setIsFullUI(true);
        setShowMinimalControls(false);
      }
    };

    // Enhanced mouse movement handler with better timer management
    const handleMouseMove = () => {
      if (!isFullUI) {
        setShowMinimalControls(true);
        // Reset the timer on mouse movement
        if (controlsTimerRef.current) {
          clearTimeout(controlsTimerRef.current);
        }
        // Thiết lập thời gian hiển thị điều khiển lâu hơn (5 giây)
        controlsTimerRef.current = setTimeout(() => setShowMinimalControls(false), 5000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Only add mousemove listener in fullscreen mode
    if (!isFullUI) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, [isFullUI]);

  // Reset unread message counter when chat becomes visible
  useEffect(() => {
    if ((isFullUI && window.innerWidth >= 768) || (isMobileChatOpen && window.innerWidth < 768)) {
      setUnreadMessages(0);
    }
  }, [isMobileChatOpen, isFullUI]);
  
  // Focus on message input when opening chat on mobile
  useEffect(() => {
    if (isMobileChatOpen) {
      // Brief delay to allow the DOM to update
      const timer = setTimeout(() => {
        const messageInput = document.querySelector('.mobile-chat-input') as HTMLInputElement;
        if (messageInput) {
          messageInput.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isMobileChatOpen]);

  const togglePlay = () => {
    if (isPlaying) {
      socket.emit("pause");
    } else {
      socket.emit("play");
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    setLocalDisplayTime(newTime);
    socket.emit("seek", newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    setLastVolume(newVolume);
    setIsVolumeMuted(newVolume === 0);
    
    if (youtubePlayer) {
      youtubePlayer.setVolume(newVolume);
      // Broadcast volume change to other users
      socket.emit("volume-change", newVolume);
    }
  };

  const toggleMute = () => {
    if (isVolumeMuted) {
      // Unmute - restore last volume
      setVolume(lastVolume > 0 ? lastVolume : 50);
      setIsVolumeMuted(false);
      if (youtubePlayer) {
        youtubePlayer.setVolume(lastVolume > 0 ? lastVolume : 50);
        socket.emit("volume-change", lastVolume > 0 ? lastVolume : 50);
      }
    } else {
      // Mute
      setLastVolume(volume);
      setVolume(0);
      setIsVolumeMuted(true);
      if (youtubePlayer) {
        youtubePlayer.setVolume(0);
        socket.emit("volume-change", 0);
      }
    }
  };

  const toggleFullUI = () => {
    setIsFullUI(!isFullUI);
    // When entering fullscreen, show minimal controls briefly
    if (isFullUI) {
      setShowMinimalControls(true);
      // Keep controls visible for a longer time (5 seconds) before fading
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
      controlsTimerRef.current = setTimeout(() => setShowMinimalControls(false), 5000);
    }
  };

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("chat-message", {
        message: message.trim(),
      });
      setMessage("");
    }
  };

  const getVolumeIcon = () => {
    if (isVolumeMuted || volume === 0) return <VolumeX className="w-5 h-5" />;
    if (volume < 50) return <Volume1 className="w-5 h-5" />;
    return <Volume2 className="w-5 h-5" />;
  };

  const toggleMobileChat = () => {
    setIsMobileChatOpen(!isMobileChatOpen);
    setShowQueue(false);
    setShowMobileSearch(false);
    // Clear unread messages when opening chat
    if (!isMobileChatOpen) {
      setUnreadMessages(0);
    }
    
    // Vibrate on mobile devices for feedback if supported
    if (navigator.vibrate && !isMobileChatOpen) {
      navigator.vibrate(50);
    }
  };

  const toggleQueue = () => {
    setShowQueue(!showQueue);
    setIsMobileChatOpen(false);
    setShowMobileSearch(false);
  };

  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch);
    setShowQueue(false);
    setIsMobileChatOpen(false);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 to-black text-white overflow-hidden flex flex-col">
      {/* Header - visible only in full UI */}
      {isFullUI && (
        <header className="p-2 sm:p-3 flex justify-between items-center border-b border-white/10 bg-black/50 backdrop-blur-md shrink-0">
          <Link
            href="/"
            className="text-white hover:text-gray-300 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Về trang chủ</span>
          </Link>
          <div className="text-center">
            <h1 className="text-lg sm:text-xl font-bold text-white">
              {currentVideo?.title ? (
                <span className="hidden sm:inline truncate max-w-md">{currentVideo.title}</span>
              ) : (
                <span>Phòng {resolvedParams.code}</span>
              )}
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm hidden sm:block">
              {isJoining
                ? "Đang tham gia phòng..."
                : isRoomJoined
                ? `${users.length} người tham gia`
                : isConnected
                ? "Đang tìm phòng..."
                : "Đang kết nối..."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={toggleMobileSearch} className="sm:hidden">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={toggleMobileChat} className="sm:hidden relative">
              <MessageCircle className="w-4 h-4" />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </Button>
            <Button variant="secondary" size="sm" onClick={toggleQueue} className="sm:hidden">
              <List className="w-4 h-4" />
            </Button>
          </div>
        </header>
      )}

      {/* Main layout with flexible height based on UI mode */}
      <div 
        className="flex flex-col md:flex-row flex-1 min-h-0 transition-all duration-300"
      >
        {/* Left Sidebar - Search (visible on desktop) */}
        {isFullUI && (
          <div 
            ref={searchContainerRef}
            className="hidden md:flex flex-col w-64 xl:w-80 border-r border-white/10 bg-black/50 backdrop-blur-md overflow-hidden shrink-0"
          >
            <div className="p-3 border-b border-white/10 shrink-0">
              <h3 className="text-white font-semibold">Tìm kiếm</h3>
            </div>
            
            <div className="flex-1 p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-violet-600 scrollbar-track-transparent min-h-0">
              <VideoSearch
                onSearch={async (query) => {
                  setIsSearching(true);
                  try {
                    const results = await searchYouTubeVideos(query);
                    setIsSearching(false);
                    return results;
                  } catch (error) {
                    console.error("Search error:", error);
                    setIsSearching(false);
                    return [];
                  }
                }}
                onAddVideo={(video) => {
                  const mediaItem: MediaItem = {
                    id: video.id,
                    title: video.title,
                    type: "video",
                    videoId: video.id,
                    url: `https://www.youtube.com/watch?v=${video.id}`,
                    duration: 0,
                    thumbnail: video.thumbnail,
                    channelTitle: video.channelTitle,
                  };
                  socket.emit("add-to-queue", mediaItem);
                }}
                isSearching={isSearching}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-black/20 relative min-h-0">
          {/* Media Player */}
          <div 
            ref={videoContainerRef}
            className="flex-1 flex items-center justify-center overflow-hidden min-h-0"
            onMouseMove={() => {
              if (!isFullUI) {
                setShowMinimalControls(true);
                if (controlsTimerRef.current) {
                  clearTimeout(controlsTimerRef.current);
                }
                controlsTimerRef.current = setTimeout(() => setShowMinimalControls(false), 5000);
              }
            }}
          >
            <div className={`relative rounded-lg overflow-hidden w-full h-full ${isFullUI ? 'max-w-5xl mx-auto max-h-full' : 'aspect-auto'}`}>
              {/* YouTube Video Player */}
              <div className="relative w-full h-full">
                <VideoPlayer
                  videoId={currentVideo?.videoId || ""}
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  volume={volume}
                  onPlayerReady={(player) => {
                    setYoutubePlayer(player);
                    setDuration(player.getDuration());
                  }}
                  onStateChange={(event) => {
                    const state = event.data;
                    console.log("YouTube player state changed:", state, "Current isPlaying:", isPlaying);
                    
                    if (state === 1 && !isPlaying) {
                      console.log("User initiated play - emitting play event");
                      socket.emit("play");
                    } else if (state === 2 && isPlaying) {
                      console.log("User initiated pause - emitting pause event");
                      socket.emit("pause");
                    }
                  }}
                  onError={(event) => {
                    console.error("YouTube player error:", event);
                  }}
                  onTimeUpdate={(time) => {
                    setLocalDisplayTime(time);
                  }}
                  onVideoEnd={() => {
                    if (currentVideoIndex < videoQueue.length - 1) {
                      socket.emit("select-from-queue", currentVideoIndex + 1);
                    }
                  }}
                  onUserInteraction={() => {
                    console.log("User interacted, requesting sync");
                    socket.emit("request-sync");
                  }}
                />

                {/* Floating controls */}
                <div 
                  className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 sm:px-4 pt-16 pb-2 sm:pb-4 transition-opacity duration-300 ${
                    isFullUI ? 'opacity-100' : showMinimalControls ? 'opacity-100' : 'opacity-0'
                  } z-20 pointer-events-auto hover:opacity-100`}
                >
                  {/* Progress bar */}
                  <div className="space-y-1 mb-2">
                    <input
                      type="range"
                      min="0"
                      max={duration || 1}
                      value={localDisplayTime}
                      onChange={handleSeek}
                      className="w-full h-1.5 sm:h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-violet-500 hover:accent-violet-400"
                      style={{
                        background: `linear-gradient(to right, rgb(139, 92, 246) ${(localDisplayTime / (duration || 1)) * 100}%, rgba(255, 255, 255, 0.2) ${(localDisplayTime / (duration || 1)) * 100}%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{formatTime(localDisplayTime)}</span> 
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Player controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <button 
                        onClick={togglePlay}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-violet-600 flex items-center justify-center transition-all"
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
                        )}
                      </button>
                      
                      <div className="flex items-center space-x-1 sm:space-x-2 group">
                        <button 
                          onClick={toggleMute} 
                          className="hover:text-violet-300 transition-colors p-1.5"
                        >
                          {getVolumeIcon()}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={volume}
                          onChange={handleVolumeChange}
                          className="w-16 sm:w-20 h-1 sm:h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-violet-500 opacity-60 group-hover:opacity-100 transition-opacity"
                          style={{
                            background: `linear-gradient(to right, rgb(139, 92, 246) ${volume}%, rgba(255, 255, 255, 0.2) ${volume}%)`
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Mini controls for full screen */}
                      {!isFullUI && (
                        <>
                          <button
                            onClick={toggleMobileChat}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-violet-600 flex items-center justify-center transition-all relative group pointer-events-auto"
                            title="Chat"
                            aria-label="Open chat"
                          >
                            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                            {unreadMessages > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center animate-pulse">
                                {unreadMessages}
                              </span>
                            )}
                            <span className="hidden sm:block absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              Chat {unreadMessages > 0 ? `(${unreadMessages})` : ''}
                            </span>
                          </button>
                          <button
                            onClick={toggleMobileSearch}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-violet-600 flex items-center justify-center transition-all group pointer-events-auto"
                            title="Tìm kiếm"
                            aria-label="Search videos"
                          >
                            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="hidden sm:block absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              Tìm kiếm
                            </span>
                          </button>
                          <button
                            onClick={toggleQueue}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-violet-600 flex items-center justify-center transition-all group pointer-events-auto"
                            title="Danh sách phát"
                            aria-label="Show play queue"
                          >
                            <List className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="hidden sm:block absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              Danh sách phát
                            </span>
                          </button>
                        </>
                      )}
                      <button 
                        onClick={toggleFullUI}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-violet-600 flex items-center justify-center transition-all group pointer-events-auto"
                        title={isFullUI ? "Chỉ xem video" : "Hiện đầy đủ giao diện"}
                        aria-label={isFullUI ? "Enter fullscreen mode" : "Exit fullscreen mode"}
                      >
                        {isFullUI ? <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />}
                        <span className="hidden sm:block absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          {isFullUI ? "Chỉ xem video" : "Hiện đầy đủ giao diện"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Video Queue - visible in full UI at the bottom */}
          {isFullUI && (
            <div className="border-t border-white/10 bg-black/50 backdrop-blur-md p-3 sm:p-4 overflow-hidden shrink-0">
              <div className="max-h-40 sm:max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-violet-600 scrollbar-track-transparent">
                <VideoQueue
                  queue={videoQueue}
                  currentVideoIndex={currentVideoIndex}
                  onSelectVideo={(index) => {
                    socket.emit("select-from-queue", index);
                  }}
                  onRemoveVideo={(index) => {
                    socket.emit("remove-from-queue", index);
                  }}
                />
              </div>

              {/* Room Info */}
              <div className="flex items-center justify-between text-white py-1 mt-1 border-t border-white/10">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{users.length} người</span>
                  </div>
                  <div className="flex -space-x-2">
                    {users.slice(0, 5).map((user, index) => (
                      <div
                        key={user.id}
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white ${
                          [
                            "bg-pink-500",
                            "bg-blue-500",
                            "bg-green-500",
                            "bg-yellow-500",
                            "bg-purple-500",
                          ][index % 5]
                        }`}
                        title={user.name}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {users.length > 5 && (
                      <div className="w-8 h-8 bg-gray-500 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white">
                        +{users.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Chat (visible on desktop) */}
        {isFullUI && (
          <div 
            ref={chatContainerRef}
            className="hidden md:flex flex-col w-64 xl:w-80 border-l border-white/10 bg-black/50 backdrop-blur-md overflow-hidden"
          >
            <div className="p-4 border-b border-white/10">
              <h3 className="text-white font-semibold">Chat</h3>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-violet-600 scrollbar-track-transparent">
              {!isConnected && (
                <div className="text-center text-gray-400 text-sm py-4">
                  Đang kết nối đến server...
                </div>
              )}
              {isConnected && !isRoomJoined && (
                <div className="text-center text-gray-400 text-sm py-4">
                  Đang kết nối đến phòng...
                </div>
              )}
              {isRoomJoined && messages.length === 0 && (
                <div className="text-center text-gray-400 text-sm py-4">
                  Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                </div>
              )}
              {messages.map((msg) => {
                // Improved user identification logic
                const isCurrentUser = msg.userId === socket.id || 
                                    msg.userId === currentUserId || 
                                    msg.username === currentUserName;
                return (
                  <div key={msg.id} className={`${isCurrentUser ? 'ml-6' : 'mr-6'}`}>
                    <div className={`rounded-lg p-3 ${
                      isCurrentUser 
                        ? 'bg-violet-600/80 border border-violet-500/50 shadow-lg' 
                        : 'bg-white/10 border border-white/20'
                    }`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className={`font-medium text-sm ${
                          isCurrentUser ? 'text-white' : 'text-violet-300'
                        }`}>
                          {isCurrentUser ? 'Bạn' : msg.username}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        isCurrentUser ? 'text-gray-100' : 'text-gray-300'
                      }`}>
                        {msg.message}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/10">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 focus:bg-white/20 transition-all text-sm"
                />
                <Button onClick={sendMessage} size="sm">
                  Gửi
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Search Overlay */}
        {showMobileSearch && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Tìm kiếm</h2>
              <button 
                onClick={toggleMobileSearch}
                className="p-2 rounded-full bg-white/10 hover:bg-violet-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <VideoSearch
                onSearch={async (query) => {
                  setIsSearching(true);
                  try {
                    const results = await searchYouTubeVideos(query);
                    setIsSearching(false);
                    return results;
                  } catch (error) {
                    console.error("Search error:", error);
                    setIsSearching(false);
                    return [];
                  }
                }}
                onAddVideo={(video) => {
                  const mediaItem: MediaItem = {
                    id: video.id,
                    title: video.title,
                    type: "video",
                    videoId: video.id,
                    url: `https://www.youtube.com/watch?v=${video.id}`,
                    duration: 0,
                    thumbnail: video.thumbnail,
                    channelTitle: video.channelTitle,
                  };
                  socket.emit("add-to-queue", mediaItem);
                  // Optionally close the search overlay after adding
                  // toggleMobileSearch();
                }}
                isSearching={isSearching}
              />
            </div>
          </div>
        )}

        {/* Mobile Queue Overlay */}
        {showQueue && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 p-4 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Danh sách phát</h2>
              <button 
                onClick={toggleQueue}
                className="p-2 rounded-full bg-white/10 hover:bg-violet-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-violet-600 scrollbar-track-transparent">
              <VideoQueue
                queue={videoQueue}
                currentVideoIndex={currentVideoIndex}
                onSelectVideo={(index) => {
                  socket.emit("select-from-queue", index);
                  toggleQueue();
                }}
                onRemoveVideo={(index) => {
                  socket.emit("remove-from-queue", index);
                }}
              />
            </div>
          </div>
        )}

        {/* Mobile Chat Overlay */}
        {isMobileChatOpen && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Chat</h2>
              <button 
                onClick={toggleMobileChat}
                className="p-2 rounded-full bg-white/10 hover:bg-violet-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 scrollbar-thin scrollbar-thumb-violet-600 scrollbar-track-transparent">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-4">
                  Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                </div>
              ) : (
                messages.map((msg) => {
                  const isCurrentUser = msg.userId === socket.id || msg.username === currentUserName;
                  return (
                    <div key={msg.id} className={`${isCurrentUser ? 'ml-6' : 'mr-6'}`}>
                      <div className={`rounded-lg p-3 ${
                        isCurrentUser 
                          ? 'bg-violet-600/80 border border-violet-500/50' 
                          : 'bg-white/10 border border-white/20'
                      }`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className={`font-medium text-sm ${
                            isCurrentUser ? 'text-white' : 'text-violet-300'
                          }`}>
                            {isCurrentUser ? 'Bạn' : msg.username}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className={`text-sm ${
                          isCurrentUser ? 'text-gray-100' : 'text-gray-300'
                        }`}>
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                className="mobile-chat-input flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 focus:bg-white/20 transition-all text-sm"
              />
              <Button onClick={sendMessage} size="sm">
                Gửi
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
