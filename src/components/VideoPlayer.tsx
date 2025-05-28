"use client";

import { useEffect, useRef, useState } from "react";
import YouTube, { YouTubePlayer, YouTubeEvent } from "react-youtube";
import type { YouTubeProps } from "react-youtube";
import { Play } from "lucide-react";

interface VideoPlayerProps {
  videoId: string;
  isPlaying: boolean;
  currentTime: number;
  volume?: number;
  onPlayerReady: (player: YouTubePlayer) => void;
  onStateChange: (event: YouTubeEvent) => void;
  onError: (event: YouTubeEvent) => void;
  onTimeUpdate: (time: number) => void;
  onVideoEnd: () => void;
  onUserInteraction?: () => void; // Callback khi người dùng tương tác để sync
}

/**
 * Thành phần VideoPlayer sử dụng YouTube IFrame API để phát video
 * Hỗ trợ đồng bộ hóa trạng thái phát lại giữa nhiều người dùng
 */
const VideoPlayer = ({
  videoId,
  isPlaying,
  currentTime,
  volume = 70,
  onPlayerReady,
  onStateChange,
  onError,
  onTimeUpdate,
  onVideoEnd,
  onUserInteraction,
}: VideoPlayerProps) => {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const timeUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const [playerLoaded, setPlayerLoaded] = useState(false);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const [pendingPlay, setPendingPlay] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const programmaticChangeRef = useRef(false); // Track if change is programmatic
  const lastStateRef = useRef(-1); // Track last state to prevent duplicate events
  const stateChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Debounce state changes

  // Cập nhật trạng thái khi isPlaying thay đổi
  useEffect(() => {
    if (!playerRef.current || !playerLoaded) return;

    // Đánh dấu đây là thay đổi programmatic và reset last state
    programmaticChangeRef.current = true;
    lastStateRef.current = -1; // Reset to detect new state changes

    try {
      if (isPlaying) {
        // Thử phát video, nếu không được thì đánh dấu cần tương tác
        const playPromise = playerRef.current.playVideo();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {
            setNeedsUserInteraction(true);
            setPendingPlay(true);
          });
        }
      } else {
        playerRef.current.pauseVideo();
        setPendingPlay(false);
        setNeedsUserInteraction(false);
      }
    } catch (error) {
      console.error("Error controlling YouTube player:", error);
      if (isPlaying) {
        setNeedsUserInteraction(true);
        setPendingPlay(true);
      }
    }

    // Reset flag sau một khoảng thời gian dài hơn để cho phép tất cả state changes settle
    setTimeout(() => {
      programmaticChangeRef.current = false;
    }, 2000); // Tăng thời gian để đảm bảo tất cả state changes hoàn thành
  }, [isPlaying, playerLoaded]);

  // Cập nhật thời gian khi currentTime thay đổi - CHỈ cho sync events quan trọng
  useEffect(() => {
    if (!playerRef.current || !playerLoaded) return;

    try {
      // CHỈ seek khi có sự khác biệt RẤT LỚN (>15 giây) để tránh seek loops
      // Điều này chỉ xảy ra khi:
      // 1. User mới join room và cần sync
      // 2. Someone seeks manually
      // 3. Video mới được chọn
      const playerTime = playerRef.current.getCurrentTime();
      const timeDiff = Math.abs(playerTime - currentTime);

      if (timeDiff > 15) {
        // Tăng threshold lên 15 giây
        programmaticChangeRef.current = true;
        lastStateRef.current = -1; // Reset state tracking for seek operation
        playerRef.current.seekTo(currentTime, true);

        // Reset flag sau seek với thời gian rất dài
        setTimeout(() => {
          programmaticChangeRef.current = false;
        }, 3000); // Tăng thời gian lên 3 giây cho seek operations
      }
    } catch (error) {
      console.error("Error seeking in YouTube player:", error);
    }
  }, [currentTime, playerLoaded]);

  // Cập nhật âm lượng khi volume thay đổi
  useEffect(() => {
    if (!playerRef.current || !playerLoaded) return;

    try {
      playerRef.current.setVolume(volume);
    } catch (error) {
      console.error("Error setting volume in YouTube player:", error);
    }
  }, [volume, playerLoaded]);

  // Thiết lập interval cập nhật thời gian
  useEffect(() => {
    return () => {
      if (timeUpdateRef.current) {
        clearInterval(timeUpdateRef.current);
      }
      if (stateChangeTimeoutRef.current) {
        clearTimeout(stateChangeTimeoutRef.current);
      }
    };
  }, []);

  // Xử lý khi video ID thay đổi
  useEffect(() => {
    setPlayerLoaded(false);
    setIsLoading(true);
  }, [videoId]);

  // Cấu hình cho YouTube IFrame API
  const opts: YouTubeProps["opts"] = {
    height: "100%",
    width: "100%",
    playerVars: {
      // Cài đặt cho YouTube Player
      autoplay: isPlaying ? 1 : 0, // Bật autoplay nếu đang phát
      controls: 0, // Tắt điều khiển mặc định của YouTube để tự tạo UI
      disablekb: 1, // Vô hiệu hóa điều khiển bàn phím
      fs: 0, // Tắt nút full screen
      rel: 0, // Không hiển thị video liên quan khi kết thúc
      modestbranding: 1, // Ẩn logo YouTube
      origin: typeof window !== "undefined" ? window.location.origin : "",
      enablejsapi: 1, // Bật JavaScript API
      start: Math.floor(currentTime), // Bắt đầu từ thời gian hiện tại
      playsinline: 1, // Cho phép video chạy trong iframe trên iOS
    },
  };

  const handleReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    setPlayerLoaded(true);
    setIsLoading(false);

    // Set initial volume
    if (playerRef.current) {
      playerRef.current.setVolume(volume);
    }
    onPlayerReady(event.target);

    // Thiết lập trạng thái ban đầu với programmatic flag
    programmaticChangeRef.current = true;
    lastStateRef.current = -1; // Reset state tracking

    if (currentTime > 0) {
      event.target.seekTo(currentTime, true);
    }

    // Thử phát video nếu đang trong trạng thái phát
    if (isPlaying) {
      const playPromise = event.target.playVideo();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          setNeedsUserInteraction(true);
          setPendingPlay(true);
        });
      }
    }

    // Reset programmatic flag after initial setup
    setTimeout(() => {
      programmaticChangeRef.current = false;
    }, 3000); // Longer timeout for initial setup

    // Track thời gian để cập nhật UI (không gửi sync events)
    timeUpdateRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const currentTime = playerRef.current.getCurrentTime();
        // Gọi onTimeUpdate chỉ để cập nhật UI, không có logic sync
        onTimeUpdate(currentTime);
      }
    }, 1000); // Update UI mỗi giây
  };

  const handleStateChange = (event: YouTubeEvent) => {
    const currentState = event.data;

    // Prevent rapid duplicate state change events
    if (lastStateRef.current === currentState) {
      return;
    }

    lastStateRef.current = currentState;

    // Clear any existing timeout
    if (stateChangeTimeoutRef.current) {
      clearTimeout(stateChangeTimeoutRef.current);
    }

    // Only emit onStateChange for meaningful user interactions
    // Ignore buffering (3), unstarted (-1), and cued (5) states as they're usually programmatic
    const userInteractionStates = [1, 2]; // playing, paused
    const shouldEmitEvent =
      !programmaticChangeRef.current &&
      userInteractionStates.includes(currentState);

    if (shouldEmitEvent) {
      // Debounce the state change to prevent rapid events
      stateChangeTimeoutRef.current = setTimeout(() => {
        onStateChange(event);
      }, 300); // 300ms debounce to allow for state settling
    } else {
    }

    // Update loading state
    if (currentState === 3) {
      // Buffering
      setIsLoading(true);
    } else if (currentState === 1) {
      // Playing
      setIsLoading(false);
    }

    // Handle internal state updates regardless of programmatic flag
    switch (currentState) {
      case 0: // Video kết thúc
        onVideoEnd();
        break;
      case 1: // Video đang chạy
        // Video đã bắt đầu phát, không cần tương tác nữa
        setNeedsUserInteraction(false);
        setPendingPlay(false);
        break;
      case 2: // Video bị tạm dừng
        // Chỉ log, không emit events ở đây

        break;
    }
  };

  const handleError = (event: YouTubeEvent) => {
    console.error("YouTube player error:", event);
    setIsLoading(false);
    onError(event);
  };

  // Xử lý khi người dùng click vào video để phát
  const handleVideoClick = async () => {
    if (needsUserInteraction && pendingPlay && playerRef.current) {
      try {
        await playerRef.current.playVideo();
        // Đồng bộ lại thời gian sau khi phát
        const currentPlayerTime = playerRef.current.getCurrentTime();
        if (Math.abs(currentPlayerTime - currentTime) > 2) {
          playerRef.current.seekTo(currentTime, true);
        }
        setNeedsUserInteraction(false);
        setPendingPlay(false);

        // Gọi callback để thông báo đã tương tác
        if (onUserInteraction) {
          onUserInteraction();
        }
      } catch (error) {
        console.error("Error playing video after user interaction:", error);
      }
    }
  };

  return (
    <div className="aspect-video w-full h-full rounded-xl overflow-hidden relative">
      {videoId ? (
        <>
          <YouTube
            videoId={videoId}
            opts={opts}
            onReady={handleReady}
            onStateChange={handleStateChange}
            onError={handleError}
            className="w-full h-full"
            loading="lazy"
            iframeClassName="w-full h-full"
          />

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
            </div>
          )}

          {/* User interaction overlay */}
          {needsUserInteraction && pendingPlay && (
            <div
              className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer z-10"
              onClick={handleVideoClick}
            >
              <div className="bg-violet-500/90 rounded-full p-5 backdrop-blur-sm hover:scale-110 transition-transform duration-300 animate-pulse shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
              <div className="absolute bottom-10 left-4 right-4 text-center text-white">
                <p className="text-sm font-medium bg-black/50 backdrop-blur-md py-3 px-4 rounded-lg inline-block max-w-md">
                  Nhấn để phát video và đồng bộ với phòng
                </p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-violet-800 to-indigo-900 flex items-center justify-center">
          <div className="text-center text-white max-w-md p-6">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Chưa có video</h3>
            <p className="text-white/70 text-sm">
              Tìm kiếm và thêm video YouTube từ phần tìm kiếm bên phải để bắt
              đầu xem cùng bạn bè
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
