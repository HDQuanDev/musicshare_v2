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
  Copy,
  CheckCircle2,
  Bell,
  BellOff,
  Sparkles,
  Send,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { useSocket, searchYouTubeVideos } from "@/lib/socket";
import { getUserName, saveUserName } from "@/lib/local-storage";
import { useRouter } from "next/navigation";
import { User, ChatMessage, MediaItem, EmojiReaction } from "@/types";
import VideoPlayer from "@/components/VideoPlayer";
import VideoSearch from "@/components/VideoSearch";
import VideoQueue, { QueuedVideo } from "@/components/VideoQueue";
import UserNameModal from "@/components/UserNameModal";
import EmojiReactions from "@/components/EmojiReactions";
import { YouTubePlayer } from "react-youtube";
import { useToast } from "@/components/ui/Toast";

interface RoomPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const resolvedParams = use(params);
  // Get toast functionality
  const { showToast } = useToast();

  // Trạng thái cơ bản
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [localDisplayTime, setLocalDisplayTime] = useState(0); // Chỉ để hiển thị UI
  const [duration, setDuration] = useState(0);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0); // For unread message counter
  const [users, setUsers] = useState<User[]>([]);

  // User name modal state
  const [isUserNameModalOpen, setIsUserNameModalOpen] = useState(false);
  const [currentUserName, setCurrentUserName] = useState<string>(""); // Will be set from localStorage

  // Room joining state
  const [isRoomJoined, setIsRoomJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(true);
  const [isFullUI, setIsFullUI] = useState(true); // New state for UI mode

  // Current user tracking
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [roomInvalid, setRoomInvalid] = useState(false); // Track if room is invalid

  // Trạng thái UI mobile
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false); // For mobile chat display
  const [showQueue, setShowQueue] = useState(false); // For mobile queue display
  const [showMobileSearch, setShowMobileSearch] = useState(false); // For mobile search display

  // Copy room code state
  const [isCopied, setIsCopied] = useState(false);

  // Notification sound state
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);

  // Show user queue state
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [showName, setShowName] = useState(false);

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

  // Emoji reactions state
  const [emojiReactions, setEmojiReactions] = useState<EmojiReaction[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { socket, isConnected } = useSocket();
  const router = useRouter();

  // Helper function to play notification sounds
  const playNotificationSound = (frequency: number = 880) => {
    try {
      // Create a subtle notification sound using Web Audio API
      const AudioContextClass =
        window.AudioContext ||
        (
          window as unknown as {
            webkitAudioContext: typeof window.AudioContext;
          }
        ).webkitAudioContext;

      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime); // Configurable frequency

        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      }
    } catch (error) {
      console.log(
        "Audio notification not supported:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  };

  // Initial username check effect
  useEffect(() => {
    // Check for username in localStorage when component mounts
    if (typeof window !== "undefined") {
      const storedUserName = getUserName();
      if (storedUserName) {
        setCurrentUserName(storedUserName);
      } else {
        // If no username found, show modal to set one
        setIsUserNameModalOpen(true);
      }
    }
  }, []);

  // This useEffect handles the initial room joining and socket event listeners
  useEffect(() => {
    // Check socket connection

    // Only emit join-room if not already in the process of joining, not already joined, room is not invalid,
    // we have a username and the username modal is closed
    if (
      isConnected &&
      !isRoomJoined &&
      !isJoining &&
      !roomInvalid &&
      currentUserName &&
      !isUserNameModalOpen
    ) {
      setIsJoining(true);
      socket.emit("join-room", {
        roomCode: resolvedParams.code,
        userName: currentUserName,
      });
    }

    // Socket event listeners
    socket.on("room-joined", (room) => {
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
        (user: User) => user.name === currentUserName
      );
      if (currentUser && currentUser.id) {
        setCurrentUserId(currentUser.id);
      }

      setIsRoomJoined(true);
      setIsJoining(false);
    });

    socket.on("user-joined", (user) => {
      setUsers((prev) => [...prev, user]);
      showToast(`${user.name} has joined the room`, "info", 3000);

      // Play notification sound for user join if notifications are enabled
      if (isNotificationEnabled) {
        playNotificationSound(700); // Higher pitch for join sound
      }
    });

    socket.on("user-left", (userId) => {
      const leavingUser = users.find((u) => u.id === userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      if (leavingUser) {
        showToast(`${leavingUser.name} has left the room`, "info", 3000);

        // Play notification sound for user leave if notifications are enabled
        if (isNotificationEnabled) {
          playNotificationSound(500); // Lower pitch for leave sound
        }
      }
    });

    socket.on("new-message", (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);

      // Increment unread messages counter when in fullscreen mode or on mobile when chat isn't open
      if (!isFullUI || (window.innerWidth < 768 && !isMobileChatOpen)) {
        setUnreadMessages((prev) => prev + 1);

        // Play notification sound if the message is not from the current user and notifications are enabled
        if (newMessage.userId !== currentUserId && isNotificationEnabled) {
          // Play a standard notification tone (880Hz - A5 note)
          playNotificationSound(880);
        }
      }
    });

    // Listen for emoji reactions
    socket.on("emoji-reaction", (reaction: EmojiReaction) => {
      setEmojiReactions((prev) => [...prev, reaction]);

      // Remove reaction after animation duration
      setTimeout(() => {
        setEmojiReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 4000);
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
        setCurrentVideo(media);
        setDuration(media.duration || 0);
        showToast(`Now playing: ${media.title}`, "info");
      } else {
        setCurrentVideo(null);
        setDuration(0);
      }
    });

    socket.on("queue-updated", (queue) => {
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
      setCurrentVideoIndex(index);
    });

    // Listen for volume changes from other users
    socket.on("volume-change", (newVolume) => {
      setVolume(newVolume);
      if (youtubePlayer) {
        youtubePlayer.setVolume(newVolume);
      }
    });

    // Handle special sync event for new users joining when media is playing
    socket.on("sync-playback", (syncData) => {
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
        youtubePlayer.seekTo(adjustedTime, true);
        youtubePlayer.playVideo().catch(() => {});
      }
    });

    socket.on("room-error", (error) => {
      // Use toast instead of alert
      showToast(error.message, "error");
      setIsJoining(false);
      setRoomInvalid(true); // Mark room as invalid to prevent further join attempts

      // Set a small delay before redirecting to allow the toast message to be seen
      setTimeout(() => {
        router.push("/");
      }, 1500);
    });

    return () => {
      // Only cleanup socket listeners, don't leave room automatically
      // Room leaving will be handled by socket disconnect event on server

      // Using namespaced event listeners to avoid duplications and prevent memory leaks
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
      socket.off("emoji-reaction");

      // Cancel any pending join attempts if the component unmounts
      if (isJoining && !isRoomJoined) {
        setIsJoining(false);
      }
    };
  }, [
    resolvedParams.code,
    socket,
    router,
    isConnected,
    youtubePlayer,
    isMobileChatOpen,
    isFullUI,
    currentUserId,
    showToast,
    users,
    isJoining,
    isRoomJoined,
    roomInvalid,
    currentUserName,
    isUserNameModalOpen,
    isNotificationEnabled,
  ]);

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
    // This effect only handles reconnection cases, not initial connection
    if (
      isConnected &&
      !isRoomJoined &&
      !isJoining &&
      socket.disconnected === false &&
      currentUserName &&
      !isUserNameModalOpen
    ) {
      setIsJoining(true);
      // Add a small delay to prevent rapid reconnection attempts
      const reconnectTimer = setTimeout(() => {
        if (!isRoomJoined) {
          // Double-check we still need to join
          socket.emit("join-room", {
            roomCode: resolvedParams.code,
            userName: currentUserName,
          });
        }
      }, 1000);

      return () => clearTimeout(reconnectTimer);
    }
  }, [
    isConnected,
    isRoomJoined,
    isJoining,
    resolvedParams.code,
    socket,
    currentUserName,
    isUserNameModalOpen,
  ]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Create ref for controls timer outside of useEffect
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide controls when video is playing
  useEffect(() => {
    if (isPlaying) {
      // Hiển thị controls khi video bắt đầu phát
      setShowMinimalControls(true);

      // Tự động ẩn controls sau 3 giây khi video đang phát
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
      controlsTimerRef.current = setTimeout(
        () => setShowMinimalControls(false),
        3000
      );
    } else {
      // Hiển thị controls khi video dừng
      setShowMinimalControls(true);
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    }

    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, [isPlaying]);

  // Listen for escape key to exit fullscreen/minimal UI mode and handle mouse movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isFullUI) {
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
        controlsTimerRef.current = setTimeout(
          () => setShowMinimalControls(false),
          5000
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Only add mousemove listener in fullscreen mode
    if (!isFullUI) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", handleMouseMove);
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, [isFullUI]);

  // Reset unread message counter when chat becomes visible
  useEffect(() => {
    if (
      (isFullUI && window.innerWidth >= 768) ||
      (isMobileChatOpen && window.innerWidth < 768)
    ) {
      setUnreadMessages(0);
    }
  }, [isMobileChatOpen, isFullUI]);

  // Focus on message input when opening chat on mobile
  useEffect(() => {
    if (isMobileChatOpen) {
      // Brief delay to allow the DOM to update
      const timer = setTimeout(() => {
        const messageInput = document.querySelector(
          ".mobile-chat-input"
        ) as HTMLInputElement;
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
    // Hiển thị controls ngắn khi chuyển đổi chế độ
    setShowMinimalControls(true);
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    // Tự động ẩn controls sau 3 giây nếu video đang phát
    if (isPlaying) {
      controlsTimerRef.current = setTimeout(
        () => setShowMinimalControls(false),
        3000
      );
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

  // Handle sending emoji reactions
  const handleSendEmoji = (emoji: string, x?: number, y?: number) => {
    socket.emit("send-emoji", { emoji, x, y });
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

  // Handle setting and saving the username
  const handleSaveUserName = (name: string) => {
    // Save the username to localStorage
    saveUserName(name);
    setCurrentUserName(name);
    setIsUserNameModalOpen(false);

    // Reload the page to restart the joining process with the new username
    window.location.reload();
  };

  // Copy room code function
  const copyRoomCode = () => {
    navigator.clipboard.writeText(resolvedParams.code);
    setIsCopied(true);
    showToast("Đã sao chép mã phòng!", "success", 2000);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Toggle notification sound
  const toggleNotification = () => {
    setIsNotificationEnabled(!isNotificationEnabled);
    showToast(
      isNotificationEnabled
        ? "Đã tắt âm thanh thông báo"
        : "Đã bật âm thanh thông báo",
      "info",
      2000
    );
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden flex flex-col relative">
      {/* Background decoration like homepage */}
      <div className="absolute inset-0">
        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full filter blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-2/3 left-1/3 w-64 h-64 bg-pink-600/10 rounded-full filter blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-20"></div>
      </div>
      {/* Username Modal */}
      <UserNameModal
        isOpen={isUserNameModalOpen}
        onClose={() => {
          // If we have a username, just close the modal
          // Otherwise, go back to home page since we can't join without a name
          if (currentUserName) {
            setIsUserNameModalOpen(false);
          } else {
            router.push("/");
          }
        }}
        onSave={handleSaveUserName}
        initialUserName={currentUserName}
      />
      {/* Header - visible only in full UI */}
      {isFullUI && (
        <header className="p-3 sm:p-4 flex items-center border-b border-purple-500/20 bg-black/30 backdrop-blur-xl shrink-0 relative z-10">
          {/* Left - Back Button */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Link
              href="/"
              className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-purple-300 group-hover:text-white transition-colors" />
              <span className="hidden lg:inline text-purple-200 group-hover:text-white font-medium">
                Về trang chủ
              </span>
            </Link>
          </div>

          {/* Center - Room Info */}
          <div className="flex-1 flex flex-col items-center justify-center min-w-0 px-2">
            <h1 className="text-sm sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent text-center">
              {currentVideo?.title ? (
                <span className="block truncate max-w-[200px] sm:max-w-[300px] lg:max-w-[400px]">
                  {currentVideo.title}
                </span>
              ) : (
                <span>Cinema Room {resolvedParams.code}</span>
              )}
            </h1>
            <p className="text-purple-300/80 text-xs sm:text-sm text-center mt-1">
              {isJoining
                ? "Đang tham gia phòng..."
                : isRoomJoined
                ? `${users.length} người đang xem`
                : isConnected
                ? "Đang tìm phòng..."
                : "Đang kết nối..."}
            </p>
          </div>

          {/* Right - Controls & Branding */}
          <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
            {/* Room Actions */}
            {isRoomJoined && (
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={toggleNotification}
                  className="p-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 border border-purple-500/30 backdrop-blur-sm group"
                  title={
                    isNotificationEnabled
                      ? "Tắt âm thanh thông báo"
                      : "Bật âm thanh thông báo"
                  }
                >
                  {isNotificationEnabled ? (
                    <Bell className="w-4 h-4 text-purple-300 group-hover:text-white transition-colors" />
                  ) : (
                    <BellOff className="w-4 h-4 text-gray-400 group-hover:text-purple-300 transition-colors" />
                  )}
                </button>
                <button
                  onClick={copyRoomCode}
                  className="p-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 border border-purple-500/30 backdrop-blur-sm group"
                  title="Sao chép mã phòng"
                >
                  {isCopied ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400 animate-pulse" />
                  ) : (
                    <Copy className="w-4 h-4 text-purple-300 group-hover:text-white transition-colors" />
                  )}
                </button>
              </div>
            )}

            {/* HDQuanDev Branding - Hidden on small screens */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-800/50 to-purple-800/50 border border-purple-500/30 backdrop-blur-sm flex-shrink-0">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="text-sm font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                HDQuanDev
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                v0.2.beta
              </span>
            </div>

            {/* Mobile Controls */}
            <div className="flex items-center gap-1 md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileSearch}
                className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 hover:border-purple-400/50 p-2"
              >
                <Search className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileChat}
                className="relative bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 hover:border-purple-400/50 p-2"
              >
                <MessageCircle className="w-4 h-4" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse border border-red-400/50">
                    {unreadMessages}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleQueue}
                className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 hover:border-purple-400/50 p-2"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Main layout with flexible height based on UI mode */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 transition-all duration-300">
        {/* Left Sidebar - Search (visible on desktop) */}
        {isFullUI && (
          <div
            ref={searchContainerRef}
            className="hidden md:flex flex-col w-64 xl:w-80 border-r border-purple-500/20 bg-black/20 backdrop-blur-xl overflow-hidden shrink-0 rounded-xl"
          >
            <div className="p-4 border-b border-purple-500/20 shrink-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Tìm kiếm Video
                </h3>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-600/50 scrollbar-track-transparent min-h-0">
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
        <div className="flex-1 flex flex-col bg-black/10 backdrop-blur-sm relative min-h-0">
          {/* Media Player */}
          <div
            ref={videoContainerRef}
            className="flex-1 flex items-center justify-center overflow-hidden min-h-0 relative"
            onMouseMove={() => {
              setShowMinimalControls(true);
              if (controlsTimerRef.current) {
                clearTimeout(controlsTimerRef.current);
              }
              controlsTimerRef.current = setTimeout(
                () => setShowMinimalControls(false),
                3000 // Giảm thời gian xuống 3 giây
              );
            }}
            onMouseLeave={() => {
              // Khi mouse rời khỏi video, tự động ẩn controls sau 1 giây
              if (controlsTimerRef.current) {
                clearTimeout(controlsTimerRef.current);
              }
              controlsTimerRef.current = setTimeout(
                () => setShowMinimalControls(false),
                1000
              );
            }}
          >
            {/* Cinema-style frame decoration */}
            <div
              className={`relative rounded-xl overflow-hidden w-full h-full shadow-2xl ${
                isFullUI
                  ? "max-w-7xl mx-auto max-h-full border border-purple-500/20"
                  : "aspect-auto"
              }`}
            >
              {/* YouTube Video Player */}
              <div
                className="relative w-full h-full"
                onClick={() => {
                  // Toggle controls visibility on click
                  if (showMinimalControls) {
                    setShowMinimalControls(false);
                    if (controlsTimerRef.current) {
                      clearTimeout(controlsTimerRef.current);
                    }
                  } else {
                    setShowMinimalControls(true);
                    if (controlsTimerRef.current) {
                      clearTimeout(controlsTimerRef.current);
                    }
                    // Auto-hide after 3 seconds if playing
                    if (isPlaying) {
                      controlsTimerRef.current = setTimeout(
                        () => setShowMinimalControls(false),
                        3000
                      );
                    }
                  }
                }}
              >
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
                    console.log(
                      "YouTube player state changed:",
                      state,
                      "Current isPlaying:",
                      isPlaying
                    );

                    if (state === 1 && !isPlaying) {
                      socket.emit("play");
                    } else if (state === 2 && isPlaying) {
                      console.log(
                        "User initiated pause - emitting pause event"
                      );
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
                    socket.emit("request-sync");
                    // Hiển thị controls khi có tương tác
                    setShowMinimalControls(true);
                    if (controlsTimerRef.current) {
                      clearTimeout(controlsTimerRef.current);
                    }
                    // Tự động ẩn sau 3 giây nếu video đang phát
                    if (isPlaying) {
                      controlsTimerRef.current = setTimeout(
                        () => setShowMinimalControls(false),
                        3000
                      );
                    }
                  }}
                />

                {/* Floating controls */}
                <div
                  className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 sm:px-6 pt-20 pb-3 sm:pb-6 transition-all duration-300 ${
                    showMinimalControls ? "opacity-100" : "opacity-0"
                  } z-20 pointer-events-auto hover:opacity-100`}
                  onMouseEnter={() => {
                    // Khi hover vào controls, giữ chúng hiển thị
                    setShowMinimalControls(true);
                    if (controlsTimerRef.current) {
                      clearTimeout(controlsTimerRef.current);
                    }
                  }}
                  onMouseLeave={() => {
                    // Khi rời khỏi controls, ẩn chúng sau 1 giây
                    if (controlsTimerRef.current) {
                      clearTimeout(controlsTimerRef.current);
                    }
                    controlsTimerRef.current = setTimeout(
                      () => setShowMinimalControls(false),
                      1000
                    );
                  }}
                >
                  {/* Progress bar */}
                  <div className="space-y-2 mb-4">
                    <input
                      type="range"
                      min="0"
                      max={duration || 1}
                      value={localDisplayTime}
                      onChange={handleSeek}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all"
                      style={{
                        background: `linear-gradient(to right, rgb(139, 92, 246) ${
                          (localDisplayTime / (duration || 1)) * 100
                        }%, rgba(255, 255, 255, 0.1) ${
                          (localDisplayTime / (duration || 1)) * 100
                        }%)`,
                      }}
                    />
                    <div className="flex justify-between text-sm text-purple-200/80">
                      <span className="px-2 py-1 bg-black/50 rounded-md backdrop-blur-sm">
                        {formatTime(localDisplayTime)}
                      </span>
                      <span className="px-2 py-1 bg-black/50 rounded-md backdrop-blur-sm">
                        {formatTime(duration)}
                      </span>
                    </div>
                  </div>

                  {/* Player controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 sm:space-x-6">
                      <button
                        onClick={togglePlay}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-600 hover:to-pink-600 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg border border-purple-500/30 backdrop-blur-sm"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        ) : (
                          <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5 text-white" />
                        )}
                      </button>

                      <div className="flex items-center space-x-2 sm:space-x-3 group">
                        <button
                          onClick={toggleMute}
                          className="hover:text-purple-300 transition-colors p-2 rounded-lg bg-black/30 backdrop-blur-sm border border-white/10 hover:border-purple-500/50"
                        >
                          {getVolumeIcon()}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={volume}
                          onChange={handleVolumeChange}
                          className="w-20 sm:w-24 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500 opacity-70 group-hover:opacity-100 transition-opacity"
                          style={{
                            background: `linear-gradient(to right, rgb(139, 92, 246) ${volume}%, rgba(255, 255, 255, 0.2) ${volume}%)`,
                          }}
                        />
                        <span className="text-xs text-purple-200/60 w-8">
                          {volume}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-3">
                      {/* Mini controls for full screen */}
                      {!isFullUI && (
                        <>
                          <button
                            onClick={toggleMobileChat}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-purple-600/60 to-pink-600/60 hover:from-purple-600/80 hover:to-pink-600/80 flex items-center justify-center transition-all relative group pointer-events-auto border border-purple-500/30 backdrop-blur-sm hover:scale-110"
                            title="Chat"
                            aria-label="Open chat"
                          >
                            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            {unreadMessages > 0 && (
                              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center animate-pulse border border-red-400/50">
                                {unreadMessages}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={toggleMobileSearch}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-purple-600/60 to-pink-600/60 hover:from-purple-600/80 hover:to-pink-600/80 flex items-center justify-center transition-all group pointer-events-auto border border-purple-500/30 backdrop-blur-sm hover:scale-110"
                            title="Tìm kiếm"
                            aria-label="Search videos"
                          >
                            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </button>
                          <button
                            onClick={toggleQueue}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-purple-600/60 to-pink-600/60 hover:from-purple-600/80 hover:to-pink-600/80 flex items-center justify-center transition-all group pointer-events-auto border border-purple-500/30 backdrop-blur-sm hover:scale-110"
                            title="Danh sách phát"
                            aria-label="Show play queue"
                          >
                            <List className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </button>
                          {/* Emoji Reactions Button */}
                          <div className="pointer-events-auto">
                            <EmojiReactions
                              onSendEmoji={handleSendEmoji}
                              reactions={emojiReactions}
                              containerRef={videoContainerRef}
                            />
                          </div>
                        </>
                      )}
                      <button
                        onClick={toggleFullUI}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-slate-600/60 to-purple-600/60 hover:from-slate-600/80 hover:to-purple-600/80 flex items-center justify-center transition-all group pointer-events-auto border border-purple-500/30 backdrop-blur-sm hover:scale-110"
                        title={
                          isFullUI ? "Chế độ rạp phim" : "Hiện đầy đủ giao diện"
                        }
                        aria-label={
                          isFullUI ? "Enter cinema mode" : "Exit cinema mode"
                        }
                      >
                        {isFullUI ? (
                          <Maximize2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        ) : (
                          <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Video Queue - visible in full UI at the bottom */}
          {isFullUI && (
            <div className="border-t border-purple-500/20 bg-black/20 backdrop-blur-xl p-4 sm:p-6 overflow-hidden shrink-0 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <List className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Danh sách phát
                </h3>
              </div>

              <div className="max-h-48 sm:max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-600/50 scrollbar-track-transparent rounded-lg">
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
              <div className="flex items-center justify-between text-white py-2 mt-4 border-t border-purple-500/20">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-500/30">
                      <Users className="w-5 h-5 text-purple-300" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-white">
                        {users.length} người đang xem
                      </span>
                      <p className="text-xs text-purple-300/60">
                        Cùng thưởng thức
                      </p>
                    </div>
                  </div>
                  <div className="flex -space-x-3">
                    {users.slice(0, 5).map((user, index) => {
                      return (
                        <div
                          key={user.id}
                          className={`relative group w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/20 flex items-center justify-center text-sm font-semibold text-white shadow-lg cursor-pointer transition-transform hover:scale-110 ${
                            [
                              "bg-gradient-to-br from-pink-500 to-rose-600",
                              "bg-gradient-to-br from-blue-500 to-indigo-600",
                              "bg-gradient-to-br from-green-500 to-emerald-600",
                              "bg-gradient-to-br from-yellow-500 to-orange-600",
                              "bg-gradient-to-br from-purple-500 to-violet-600",
                            ][index % 5]
                          }`}
                          title={user.name}
                          onClick={() => setShowName(!showName)}
                        >
                          {user.name.charAt(0).toUpperCase()}

                          {/* Tooltip hiển thị tên người dùng khi hover */}
                          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap backdrop-blur-sm border border-purple-500/30 z-50">
                            {user.name}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
                          </div>

                          {/* Tên hiển thị bên cạnh khi click */}
                          {showName && (
                            <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-gradient-to-r from-purple-600/90 to-pink-600/90 text-white text-xs rounded-lg whitespace-nowrap backdrop-blur-sm border border-purple-500/30 z-50 animate-in slide-in-from-left-2 duration-200">
                              {user.name}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {users.length > 5 &&
                      (() => {
                        return (
                          <div
                            className="relative group w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full border-2 border-white/20 flex items-center justify-center text-sm font-semibold text-white shadow-lg cursor-pointer transition-transform hover:scale-110"
                            onClick={() => setShowMoreInfo(!showMoreInfo)}
                          >
                            +{users.length - 5}
                            {/* Tooltip hiển thị số lượng người dùng còn lại khi hover */}
                            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap backdrop-blur-sm border border-purple-500/30 z-50">
                              {users.length - 5} người khác
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
                            </div>
                            {/* Thông tin chi tiết khi click */}
                            {showMoreInfo && (
                              <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-gradient-to-r from-gray-600/90 to-gray-700/90 text-white text-xs rounded-lg whitespace-nowrap backdrop-blur-sm border border-gray-500/30 z-50 animate-in slide-in-from-left-2 duration-200">
                                <div className="space-y-1">
                                  {users.slice(5).map((user, idx) => (
                                    <div
                                      key={user.id}
                                      className="flex items-center gap-2"
                                    >
                                      <div
                                        className={`w-3 h-3 rounded-full ${
                                          [
                                            "bg-gradient-to-br from-pink-500 to-rose-600",
                                            "bg-gradient-to-br from-blue-500 to-indigo-600",
                                            "bg-gradient-to-br from-green-500 to-emerald-600",
                                            "bg-gradient-to-br from-yellow-500 to-orange-600",
                                            "bg-gradient-to-br from-purple-500 to-violet-600",
                                          ][(idx + 5) % 5]
                                        }`}
                                      ></div>
                                      <span>{user.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                  </div>
                </div>

                {/* HDQuanDev Footer Branding */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-800/50 to-purple-800/50 border border-purple-500/30 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span className="text-sm font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    HDQuanDev
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    v0.2.beta
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Chat (visible on desktop) */}
        {isFullUI && (
          <>
            <EmojiReactions
              onSendEmoji={handleSendEmoji}
              reactions={emojiReactions}
              containerRef={videoContainerRef}
            />
            <div
              ref={chatContainerRef}
              className="hidden md:flex flex-col w-64 xl:w-80 border-l border-purple-500/30 bg-gradient-to-b from-black/40 via-purple-900/20 to-black/40 backdrop-blur-xl overflow-hidden rounded-xl shadow-2xl relative"
            >
              {/* Cinema-style header with glow */}
              <div className="relative p-4 border-b border-purple-500/30 bg-gradient-to-r from-purple-600/20 via-pink-600/15 to-purple-600/20 backdrop-blur-sm">
                {/* Animated background orb */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-xl animate-pulse"></div>

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <MessageCircle className="w-5 h-5 text-purple-400 drop-shadow-lg" />
                      <div className="absolute inset-0 animate-ping">
                        <MessageCircle className="w-5 h-5 text-purple-400 opacity-30" />
                      </div>
                    </div>
                    <h3 className="font-bold text-base bg-gradient-to-r from-white via-purple-100 to-pink-200 bg-clip-text text-transparent drop-shadow-sm">
                      Cinema Chat
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {unreadMessages > 0 && (
                      <div className="relative">
                        <span className="px-3 py-1.5 bg-gradient-to-r from-red-500 via-pink-500 to-red-500 text-white text-xs font-bold rounded-full animate-pulse shadow-lg border border-red-400/50">
                          {unreadMessages}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 rounded-full blur-sm opacity-50 animate-pulse"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subtle line decoration */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"></div>
              </div>

              {/* Enhanced chat messages area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-purple-600/60 scrollbar-track-purple-900/20 relative">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-4 left-4 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <div className="absolute top-12 right-6 w-1 h-1 bg-pink-400 rounded-full animate-pulse delay-100"></div>
                  <div className="absolute top-20 left-8 w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse delay-200"></div>
                </div>

                {!isConnected && (
                  <div className="text-center text-purple-300/60 text-sm py-12 relative">
                    <div className="relative inline-block">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-400 drop-shadow-lg" />
                      <div className="absolute inset-0 animate-ping">
                        <Loader2 className="w-8 h-8 text-purple-400 opacity-20" />
                      </div>
                    </div>
                    <p className="font-medium">Connecting to cinema...</p>
                    <div className="mt-2 flex justify-center gap-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                )}

                {isConnected && !isRoomJoined && (
                  <div className="text-center text-purple-300/60 text-sm py-12 relative">
                    <div className="relative inline-block">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-400 drop-shadow-lg" />
                      <div className="absolute inset-0 animate-ping">
                        <Loader2 className="w-8 h-8 text-purple-400 opacity-20" />
                      </div>
                    </div>
                    <p className="font-medium">Entering cinema room...</p>
                    <div className="mt-2 flex justify-center gap-1">
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                )}

                {isRoomJoined && messages.length === 0 && (
                  <div className="text-center text-purple-300/60 text-sm py-12 relative">
                    <div className="relative inline-block mb-4">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 text-purple-400/50 drop-shadow-xl" />
                      <div className="absolute inset-0 animate-pulse">
                        <MessageCircle className="w-12 h-12 text-purple-400/20" />
                      </div>
                    </div>
                    <p className="font-semibold text-base mb-2">
                      Cinema is quiet...
                    </p>
                    <p className="text-xs opacity-80">
                      Be the first to start the conversation!
                    </p>

                    {/* Decorative elements */}
                    <div className="mt-6 flex justify-center items-center gap-2">
                      <div className="h-px w-8 bg-gradient-to-r from-transparent to-purple-400/30"></div>
                      <div className="w-2 h-2 bg-purple-400/40 rounded-full"></div>
                      <div className="h-px w-8 bg-gradient-to-l from-transparent to-purple-400/30"></div>
                    </div>
                  </div>
                )}
                {messages.map((msg) => {
                  // Check if this is a system message
                  const isSystemMessage = msg.userId === "system";

                  // User identification logic for regular messages
                  const isCurrentUser =
                    !isSystemMessage &&
                    (msg.userId === socket.id ||
                      msg.userId === currentUserId ||
                      msg.username === currentUserName);

                  // Render system messages differently
                  if (isSystemMessage) {
                    const isJoinMessage = msg.message.includes("tham gia");
                    const isLeaveMessage = msg.message.includes("rời khỏi");

                    return (
                      <div
                        key={msg.id}
                        className="flex justify-center my-3 px-3 sm:px-4"
                      >
                        <div
                          className={`
        relative group transition-all duration-300 ease-in-out
        border rounded-2xl px-4 py-3 
        max-w-[280px] sm:max-w-sm md:max-w-md lg:max-w-lg
        backdrop-blur-md shadow-lg hover:shadow-xl
        transform hover:scale-[1.02] hover:-translate-y-1
        ${
          isJoinMessage
            ? "bg-gradient-to-br from-emerald-500/15 via-green-500/10 to-teal-500/15 border-emerald-400/30 hover:border-emerald-400/50"
            : isLeaveMessage
            ? "bg-gradient-to-br from-rose-500/15 via-red-500/10 to-pink-500/15 border-rose-400/30 hover:border-rose-400/50"
            : "bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-purple-500/15 border-blue-400/30 hover:border-blue-400/50"
        }
      `}
                        >
                          {/* Decorative glow effect */}
                          <div
                            className={`
          absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 
          transition-opacity duration-300 blur-xl -z-10
          ${
            isJoinMessage
              ? "bg-gradient-to-br from-emerald-400/20 to-teal-400/20"
              : isLeaveMessage
              ? "bg-gradient-to-br from-rose-400/20 to-pink-400/20"
              : "bg-gradient-to-br from-blue-400/20 to-purple-400/20"
          }
        `}
                          ></div>

                          {/* Main content */}
                          <div className="flex items-center justify-between gap-3">
                            {/* Left indicator */}
                            <div className="flex items-center gap-2">
                              <div
                                className={`
              w-2.5 h-2.5 rounded-full animate-pulse shadow-sm
              ${
                isJoinMessage
                  ? "bg-emerald-400 shadow-emerald-400/50"
                  : isLeaveMessage
                  ? "bg-rose-400 shadow-rose-400/50"
                  : "bg-blue-400 shadow-blue-400/50"
              }
            `}
                              ></div>

                              {/* Icon with better spacing */}
                              <span className="text-lg filter drop-shadow-sm">
                                {isJoinMessage && "👋"}
                                {isLeaveMessage && "🚪"}
                                {!isJoinMessage && !isLeaveMessage && "🔔"}
                              </span>
                            </div>

                            {/* Message text */}
                            <div className="flex-1 text-center">
                              <p
                                className={`
              text-sm sm:text-base font-medium leading-relaxed
              ${
                isJoinMessage
                  ? "text-emerald-100"
                  : isLeaveMessage
                  ? "text-rose-100"
                  : "text-blue-100"
              }
            `}
                              >
                                {msg.message}
                              </p>
                            </div>

                            {/* Right indicator */}
                            <div
                              className={`
            w-2.5 h-2.5 rounded-full animate-pulse shadow-sm
            ${
              isJoinMessage
                ? "bg-emerald-400 shadow-emerald-400/50"
                : isLeaveMessage
                ? "bg-rose-400 shadow-rose-400/50"
                : "bg-blue-400 shadow-blue-400/50"
            }
          `}
                            ></div>
                          </div>

                          {/* Timestamp with improved styling */}
                          <div className="mt-3 pt-2 border-t border-white/10">
                            <p className="text-xs text-gray-300/80 text-center font-mono tracking-wide">
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </p>
                          </div>

                          {/* Subtle animated border */}
                          <div
                            className={`
          absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
          transition-opacity duration-500 pointer-events-none
          bg-gradient-to-r ${
            isJoinMessage
              ? "from-emerald-400/20 via-transparent to-emerald-400/20"
              : isLeaveMessage
              ? "from-rose-400/20 via-transparent to-rose-400/20"
              : "from-blue-400/20 via-transparent to-blue-400/20"
          }
        `}
                            style={{
                              backgroundSize: "200% 100%",
                              animation: "shimmer 2s infinite",
                            }}
                          ></div>
                        </div>

                        {/* Add CSS animation for shimmer effect */}
                        <style jsx>{`
                          @keyframes shimmer {
                            0% {
                              background-position: -200% 0;
                            }
                            100% {
                              background-position: 200% 0;
                            }
                          }
                        `}</style>
                      </div>
                    );
                  }

                  // Regular user message
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        isCurrentUser ? "justify-end" : "justify-start"
                      } mb-4 group`}
                    >
                      <div
                        className={`max-w-[85%] ${
                          isCurrentUser ? "order-2" : "order-1"
                        }`}
                      >
                        {/* Enhanced user info */}
                        <div
                          className={`flex items-center gap-2 mb-2 ${
                            isCurrentUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg overflow-hidden ${
                              isCurrentUser
                                ? "bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600"
                                : "bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600"
                            }`}
                          >
                            {/* Avatar glow effect */}
                            <div
                              className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                                isCurrentUser
                                  ? "bg-gradient-to-br from-purple-400/50 to-pink-400/50"
                                  : "bg-gradient-to-br from-blue-400/50 to-purple-400/50"
                              } blur-sm`}
                            ></div>
                            <span className="relative z-10 drop-shadow-sm">
                              {(isCurrentUser ? "You" : msg.username)
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>

                          <div className="flex flex-col items-start">
                            <span
                              className={`font-semibold text-sm drop-shadow-sm ${
                                isCurrentUser
                                  ? "text-purple-200"
                                  : "text-blue-200"
                              }`}
                            >
                              {isCurrentUser ? "You" : msg.username}
                            </span>
                            <span className="text-xs text-gray-400/80 bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Enhanced message bubble */}
                        <div
                          className={`relative ${
                            isCurrentUser ? "ml-auto" : "mr-auto"
                          }`}
                        >
                          {/* Enhanced message tail with glow */}
                          <div
                            className={`absolute top-4 w-0 h-0 z-10 ${
                              isCurrentUser
                                ? "right-[-8px] border-l-[14px] border-l-purple-600/90 border-t-[7px] border-b-[7px] border-t-transparent border-b-transparent drop-shadow-lg"
                                : "left-[-8px] border-r-[14px] border-r-slate-700/90 border-t-[7px] border-b-[7px] border-t-transparent border-b-transparent drop-shadow-lg"
                            }`}
                          ></div>

                          {/* Cinema-style message container */}
                          <div
                            className={`relative rounded-2xl p-4 shadow-xl backdrop-blur-lg border transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group-hover:shadow-2xl ${
                              isCurrentUser
                                ? "bg-gradient-to-br from-purple-600/95 via-purple-700/90 to-pink-600/95 border-purple-400/50 hover:border-purple-300/70 shadow-purple-500/20"
                                : "bg-gradient-to-br from-slate-800/95 via-slate-700/90 to-gray-800/95 border-slate-600/50 hover:border-slate-500/70 shadow-slate-500/20"
                            }`}
                          >
                            {/* Enhanced glow effects */}
                            <div
                              className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-300 blur-xl ${
                                isCurrentUser
                                  ? "bg-gradient-to-br from-purple-400 via-pink-400 to-purple-400"
                                  : "bg-gradient-to-br from-blue-400 via-indigo-400 to-slate-400"
                              }`}
                            ></div>

                            {/* Background pattern overlay */}
                            <div className="absolute inset-0 rounded-2xl opacity-10">
                              <div
                                className={`absolute top-2 right-2 w-1 h-1 rounded-full ${
                                  isCurrentUser ? "bg-white" : "bg-blue-300"
                                } animate-pulse`}
                              ></div>
                              <div
                                className={`absolute bottom-2 left-2 w-0.5 h-0.5 rounded-full ${
                                  isCurrentUser ? "bg-pink-300" : "bg-slate-300"
                                } animate-pulse delay-100`}
                              ></div>
                            </div>

                            {/* Message content with better typography */}
                            <div className="relative z-10">
                              <p
                                className={`text-sm leading-relaxed break-words font-medium drop-shadow-sm ${
                                  isCurrentUser ? "text-white" : "text-gray-100"
                                }`}
                              >
                                {msg.message}
                              </p>
                            </div>

                            {/* Enhanced decorative elements */}
                            <div
                              className={`absolute top-1.5 right-3 w-2 h-2 rounded-full opacity-50 ${
                                isCurrentUser
                                  ? "bg-white shadow-white/30"
                                  : "bg-blue-400 shadow-blue-400/30"
                              } shadow-lg`}
                            ></div>
                            <div
                              className={`absolute bottom-1.5 left-3 w-1.5 h-1.5 rounded-full opacity-40 ${
                                isCurrentUser
                                  ? "bg-pink-300 shadow-pink-300/30"
                                  : "bg-slate-400 shadow-slate-400/30"
                              } shadow-lg`}
                            ></div>

                            {/* Cinema frame decoration */}
                            <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none"></div>
                          </div>

                          {/* Enhanced message status */}
                          <div
                            className={`flex items-center gap-1.5 mt-2 ${
                              isCurrentUser ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50"></div>
                            <span className="text-xs text-gray-400 font-medium">
                              Delivered
                            </span>
                            {isCurrentUser && (
                              <div className="w-1 h-1 rounded-full bg-purple-400 opacity-60"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Enhanced chat input area */}
              <div className="relative p-4 border-t border-purple-500/30 bg-gradient-to-r from-purple-600/10 via-pink-600/5 to-purple-600/10 backdrop-blur-sm">
                {/* Decorative line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"></div>

                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>

                <div className="relative flex space-x-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Share your thoughts in the cinema..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      className="w-full px-4 py-3 bg-black/40 border border-purple-500/40 rounded-xl text-white placeholder-purple-300/60 focus:outline-none focus:border-purple-400/80 focus:bg-black/60 transition-all duration-300 text-sm backdrop-blur-md shadow-lg focus:shadow-purple-500/20 focus:shadow-xl"
                    />
                    {/* Input glow effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none blur-sm"></div>
                  </div>

                  <Button
                    onClick={sendMessage}
                    size="sm"
                    className="relative px-4 py-3 bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 hover:from-purple-700 hover:via-purple-800 hover:to-pink-700 border-0 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group overflow-hidden"
                  >
                    {/* Button glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                    <Send className="w-4 h-4 relative z-10 drop-shadow-sm group-hover:scale-110 transition-transform duration-200" />
                  </Button>
                </div>

                {/* Typing indicator placeholder */}
                {message.length > 0 && (
                  <div className="absolute -top-6 right-4 text-xs text-purple-300/80 bg-black/50 px-2 py-1 rounded-md backdrop-blur-sm">
                    Typing...
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Mobile Search Overlay */}
        {showMobileSearch && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <Search className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Tìm kiếm Video
                </h2>
              </div>
              <button
                onClick={toggleMobileSearch}
                className="p-3 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/40 hover:to-pink-600/40 border border-purple-500/30 transition-all"
              >
                <X className="w-5 h-5 text-white" />
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
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 p-4 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <List className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Danh sách phát
                </h2>
              </div>
              <button
                onClick={toggleQueue}
                className="p-3 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/40 hover:to-pink-600/40 border border-purple-500/30 transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-600/50 scrollbar-track-transparent">
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

        {/* Enhanced Mobile Chat Overlay */}
        {isMobileChatOpen && (
          <div className="fixed inset-0 bg-gradient-to-br from-black/95 via-purple-900/30 to-black/95 backdrop-blur-xl z-50 p-4 flex flex-col">
            {/* Cinema-style header */}
            <div className="flex justify-between items-center mb-6 relative">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <MessageCircle className="w-6 h-6 text-purple-400 drop-shadow-lg" />
                  <div className="absolute inset-0 animate-ping">
                    <MessageCircle className="w-6 h-6 text-purple-400 opacity-30" />
                  </div>
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-white via-purple-100 to-pink-200 bg-clip-text text-transparent drop-shadow-sm">
                  Cinema Chat
                </h2>
                {unreadMessages > 0 && (
                  <div className="relative">
                    <span className="px-3 py-1.5 bg-gradient-to-r from-red-500 via-pink-500 to-red-500 text-white text-sm font-bold rounded-full animate-pulse shadow-lg">
                      {unreadMessages}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 rounded-full blur-sm opacity-50 animate-pulse"></div>
                  </div>
                )}
              </div>
              <button
                onClick={toggleMobileChat}
                className="p-3 rounded-full bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:from-purple-600/50 hover:to-pink-600/50 border border-purple-500/40 transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg backdrop-blur-sm"
              >
                <X className="w-5 h-5 text-white drop-shadow-sm" />
              </button>
            </div>

            {/* Enhanced messages area */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 scrollbar-thin scrollbar-thumb-purple-600/60 scrollbar-track-purple-900/20 relative">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-4 left-4 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <div className="absolute top-12 right-6 w-1 h-1 bg-pink-400 rounded-full animate-pulse delay-100"></div>
                <div className="absolute top-20 left-8 w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse delay-200"></div>
              </div>

              {messages.length === 0 ? (
                <div className="text-center text-purple-300/60 text-sm py-16 relative">
                  <div className="relative inline-block mb-4">
                    <MessageCircle className="w-16 h-16 mx-auto mb-3 text-purple-400/50 drop-shadow-xl" />
                    <div className="absolute inset-0 animate-pulse">
                      <MessageCircle className="w-16 h-16 text-purple-400/20" />
                    </div>
                  </div>
                  <p className="font-semibold text-lg mb-2">
                    Cinema is quiet...
                  </p>
                  <p className="text-sm opacity-80">
                    Be the first to start the conversation!
                  </p>

                  {/* Decorative elements */}
                  <div className="mt-8 flex justify-center items-center gap-2">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-purple-400/30"></div>
                    <div className="w-2 h-2 bg-purple-400/40 rounded-full"></div>
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-purple-400/30"></div>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  // Check if this is a system message
                  const isSystemMessage = msg.userId === "system";

                  // If system message, render with enhanced styling
                  if (isSystemMessage) {
                    const isJoinMessage = msg.message.includes("tham gia");
                    const isLeaveMessage = msg.message.includes("rời khỏi");

                    return (
                      <div
                        key={msg.id}
                        className="flex justify-center my-4 px-4"
                      >
                        <div
                          className={`relative group transition-all duration-300 border rounded-2xl px-4 py-3 max-w-xs backdrop-blur-md shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${
                            isJoinMessage
                              ? "bg-gradient-to-br from-emerald-500/20 via-green-500/10 to-teal-500/20 border-emerald-400/40"
                              : isLeaveMessage
                              ? "bg-gradient-to-br from-rose-500/20 via-red-500/10 to-pink-500/20 border-rose-400/40"
                              : "bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-purple-500/20 border-blue-400/40"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-lg filter drop-shadow-sm">
                              {isJoinMessage && "👋"}
                              {isLeaveMessage && "🚪"}
                              {!isJoinMessage && !isLeaveMessage && "🔔"}
                            </span>
                            <p
                              className={`text-sm font-medium text-center ${
                                isJoinMessage
                                  ? "text-emerald-100"
                                  : isLeaveMessage
                                  ? "text-rose-100"
                                  : "text-blue-100"
                              }`}
                            >
                              {msg.message}
                            </p>
                          </div>
                          <p className="text-xs text-gray-300/80 text-center mt-2 font-mono">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  // For regular messages with enhanced styling
                  const isCurrentUser =
                    msg.userId === socket.id ||
                    msg.username === currentUserName;
                  return (
                    <div
                      key={msg.id}
                      className={`group ${isCurrentUser ? "ml-6" : "mr-6"}`}
                    >
                      <div
                        className={`relative rounded-2xl p-4 shadow-xl backdrop-blur-lg border transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${
                          isCurrentUser
                            ? "bg-gradient-to-br from-purple-600/90 via-purple-700/80 to-pink-600/90 border-purple-400/50 shadow-purple-500/20"
                            : "bg-gradient-to-br from-slate-800/90 via-slate-700/80 to-gray-800/90 border-slate-600/50 shadow-slate-500/20"
                        }`}
                      >
                        {/* Enhanced glow effects */}
                        <div
                          className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-300 blur-xl ${
                            isCurrentUser
                              ? "bg-gradient-to-br from-purple-400 to-pink-400"
                              : "bg-gradient-to-br from-blue-400 to-slate-400"
                          }`}
                        ></div>

                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg ${
                                  isCurrentUser
                                    ? "bg-gradient-to-br from-purple-500 to-pink-600"
                                    : "bg-gradient-to-br from-blue-500 to-indigo-600"
                                }`}
                              >
                                {(isCurrentUser ? "You" : msg.username)
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <span
                                className={`font-semibold text-sm drop-shadow-sm ${
                                  isCurrentUser ? "text-white" : "text-blue-200"
                                }`}
                              >
                                {isCurrentUser ? "You" : msg.username}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400/80 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm border border-white/10">
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p
                            className={`text-sm leading-relaxed font-medium drop-shadow-sm ${
                              isCurrentUser ? "text-white" : "text-gray-100"
                            }`}
                          >
                            {msg.message}
                          </p>
                        </div>

                        {/* Decorative elements */}
                        <div
                          className={`absolute top-2 right-3 w-1.5 h-1.5 rounded-full opacity-50 ${
                            isCurrentUser ? "bg-white" : "bg-blue-400"
                          } shadow-lg`}
                        ></div>
                        <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none"></div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Enhanced mobile chat input */}
            <div className="relative p-4 bg-gradient-to-r from-purple-600/10 via-pink-600/5 to-purple-600/10 rounded-xl border border-purple-500/30 backdrop-blur-sm shadow-xl">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none rounded-xl"></div>

              <div className="relative flex space-x-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Share your thoughts in the cinema..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    className="mobile-chat-input w-full px-4 py-3 bg-black/40 border border-purple-500/40 rounded-xl text-white placeholder-purple-300/60 focus:outline-none focus:border-purple-400/80 focus:bg-black/60 transition-all duration-300 text-sm backdrop-blur-md shadow-lg focus:shadow-purple-500/20 focus:shadow-xl"
                  />
                  {/* Input glow effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none blur-sm"></div>
                </div>

                <button
                  onClick={sendMessage}
                  className="relative px-4 py-3 bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 hover:from-purple-700 hover:via-purple-800 hover:to-pink-700 border-0 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group overflow-hidden"
                >
                  {/* Button glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                  <Send className="w-4 h-4 relative z-10 text-white drop-shadow-sm group-hover:scale-110 transition-transform duration-200" />
                </button>
              </div>

              {/* Typing indicator */}
              {message.length > 0 && (
                <div className="absolute -top-6 right-4 text-xs text-purple-300/80 bg-black/50 px-2 py-1 rounded-md backdrop-blur-sm border border-purple-500/30">
                  Typing...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Global Floating Emoji Reactions - Always visible */}
      <div className="fixed inset-0 pointer-events-none z-[9990] overflow-hidden">
        {emojiReactions.map((reaction) => (
          <div
            key={reaction.id}
            className="absolute animate-bounce"
            style={{
              left: reaction.x ? `${reaction.x}px` : "50%",
              top: reaction.y ? `${reaction.y}px` : "50%",
              transform:
                reaction.x && reaction.y ? "none" : "translate(-50%, -50%)",
              fontSize: "2rem",
              zIndex: 9999,
              textShadow: "0 2px 8px rgba(0,0,0,0.5)",
              animation: `float-up 4s ease-out forwards`,
            }}
          >
            {reaction.emoji}
          </div>
        ))}
      </div>

      {/* Add CSS for emoji float animation */}
      <style>{`
        @keyframes float-up {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          50% {
            opacity: 1;
            transform: translateY(-50px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) scale(0.8);
          }
        }
      `}</style>
    </div>
  );
}
