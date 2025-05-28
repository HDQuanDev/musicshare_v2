// src/types/index.ts

export interface User {
  id: string;
  name: string;
  isHost?: boolean;
}

export interface Room {
  id: string;
  name: string;
  code: string;
  createdBy: string;
  users: User[];
  currentMedia?: MediaItem;
  mediaQueue: MediaItem[];
  currentQueueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  messages: ChatMessage[];
  createdAt: Date;
}

export interface MediaItem {
  id: string;
  title: string;
  type: "video" | "audio";
  videoId?: string; // YouTube video ID
  url: string;
  duration: number;
  thumbnail?: string;
  channelTitle?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
}

export interface EmojiReaction {
  id: string;
  emoji: string;
  userId: string;
  username: string;
  timestamp: Date;
  x?: number; // Position for animation
  y?: number;
}

export interface SocketEvents {
  // Room events
  "join-room": (roomCode: string) => void;
  "leave-room": (roomCode: string) => void;
  "room-joined": (room: Room) => void;
  "user-joined": (user: User) => void;
  "user-left": (userId: string) => void;

  // Media control events
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  "media-changed": (media: MediaItem) => void;
  "sync-state": (state: { isPlaying: boolean; currentTime: number }) => void;

  // Queue events
  "add-to-queue": (media: MediaItem) => void;
  "remove-from-queue": (index: number) => void;
  "select-from-queue": (index: number) => void;
  "queue-updated": (queue: MediaItem[]) => void;
  "queue-index-changed": (index: number) => void;

  // Chat events
  "chat-message": (message: ChatMessage) => void;
  "new-message": (message: ChatMessage) => void;

  // Emoji reaction events
  "send-emoji": (data: { emoji: string; x?: number; y?: number }) => void;
  "emoji-reaction": (reaction: EmojiReaction) => void;
}
