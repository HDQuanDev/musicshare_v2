// src/lib/socket.ts
"use client";

import { io, Socket } from "socket.io-client";
import { useEffect, useState } from "react";
import type { QueuedVideo } from "@/components/VideoQueue";

let socket: Socket;

export const initSocket = () => {
  if (!socket) {
    socket = io(process.env.NODE_ENV === "production" ? "" : "", {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 20000,
      forceNew: false,
    });

    // Add better connection logging
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_error', (error) => {
      console.log('Socket reconnection error:', error);
    });
  }
  return socket;
};

// YouTube search via Socket.IO
export const searchYouTubeVideos = (query: string): Promise<QueuedVideo[]> => {
  const socketInstance = initSocket();

  return new Promise((resolve, reject) => {
    socketInstance.emit("search-youtube", query);

    const onResults = (results: QueuedVideo[]) => {
      socketInstance.off("youtube-search-results", onResults);
      socketInstance.off("youtube-search-error", onError);
      resolve(results);
    };

    const onError = (error: { message: string }) => {
      socketInstance.off("youtube-search-results", onResults);
      socketInstance.off("youtube-search-error", onError);
      reject(new Error(error.message));
    };

    socketInstance.on("youtube-search-results", onResults);
    socketInstance.on("youtube-search-error", onError);

    // Set a timeout in case the server doesn't respond
    setTimeout(() => {
      socketInstance.off("youtube-search-results", onResults);
      socketInstance.off("youtube-search-error", onError);
      reject(new Error("YouTube search timeout"));
    }, 10000);
  });
};

// Get video duration via Socket.IO
export const getYouTubeVideoDuration = (videoId: string): Promise<number> => {
  const socketInstance = initSocket();

  return new Promise((resolve, reject) => {
    socketInstance.emit("get-video-duration", videoId);

    const onResult = (data: { videoId: string; duration: number }) => {
      if (data.videoId === videoId) {
        socketInstance.off("video-duration-result", onResult);
        socketInstance.off("video-duration-error", onError);
        resolve(data.duration);
      }
    };

    const onError = (error: { videoId: string; message: string }) => {
      if (error.videoId === videoId) {
        socketInstance.off("video-duration-result", onResult);
        socketInstance.off("video-duration-error", onError);
        reject(new Error(error.message));
      }
    };

    socketInstance.on("video-duration-result", onResult);
    socketInstance.on("video-duration-error", onError);

    // Set a timeout in case the server doesn't respond
    setTimeout(() => {
      socketInstance.off("video-duration-result", onResult);
      socketInstance.off("video-duration-error", onError);
      reject(new Error("Get video duration timeout"));
    }, 5000);
  });
};

// Get video details from video ID via Socket.IO
export const getYouTubeVideoDetails = (
  videoId: string
): Promise<{
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration?: number;
}> => {
  const socketInstance = initSocket();

  return new Promise((resolve, reject) => {
    socketInstance.emit("get-video-details", videoId);

    const onResult = (videoDetails: {
      id: string;
      title: string;
      channelTitle: string;
      thumbnail: string;
      duration?: number;
    }) => {
      socketInstance.off("video-details-result", onResult);
      socketInstance.off("video-details-error", onError);
      resolve(videoDetails);
    };

    const onError = (error: { videoId: string; message: string }) => {
      socketInstance.off("video-details-result", onResult);
      socketInstance.off("video-details-error", onError);
      reject(new Error(error.message));
    };

    socketInstance.on("video-details-result", onResult);
    socketInstance.on("video-details-error", onError);

    // Set a timeout in case the server doesn't respond
    setTimeout(() => {
      socketInstance.off("video-details-result", onResult);
      socketInstance.off("video-details-error", onError);
      reject(new Error("Get video details timeout"));
    }, 10000);
  });
};

export const useSocket = () => {
  const socketInstance = initSocket();
  const [isConnected, setIsConnected] = useState(socketInstance.connected);

  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    // Kiểm tra nếu đã kết nối
    if (socketInstance.connected && !isConnected) {
      setIsConnected(true);
    }

    socketInstance.on("connect", onConnect);
    socketInstance.on("disconnect", onDisconnect);

    return () => {
      socketInstance.off("connect", onConnect);
      socketInstance.off("disconnect", onDisconnect);
    };
  }, [socketInstance, isConnected]);

  return { socket: socketInstance, isConnected };
};
