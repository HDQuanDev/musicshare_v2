"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { EmojiReaction } from "@/types";

interface EmojiReactionsProps {
  onSendEmoji: (emoji: string, x?: number, y?: number) => void;
  reactions: EmojiReaction[];
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

// Floating Emoji Animation Component
interface FloatingEmojiProps {
  reaction: EmojiReaction;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

const FloatingEmoji: React.FC<FloatingEmojiProps> = ({ reaction }) => {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Set initial position
    if (reaction.x !== undefined && reaction.y !== undefined) {
      setPosition({ x: reaction.x, y: reaction.y });
    } else {
      // Random position if not specified
      setPosition({
        x: Math.random() * 60 + 20, // 20-80%
        y: Math.random() * 40 + 30, // 30-70%
      });
    }

    // Hide emoji after animation duration
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3800);

    return () => clearTimeout(timer);
  }, [reaction]);

  if (!isVisible) return null;

  return (
    <div
      className="absolute animate-bounce-up-fade pointer-events-none"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: 50,
      }}
    >
      {/* Main emoji with enhanced effects */}
      <div className="relative">
        <span className="text-4xl filter drop-shadow-2xl">
          {reaction.emoji}
        </span>

        {/* Glow effect */}
        <div className="absolute inset-0 text-4xl text-yellow-300/60 blur-md animate-pulse">
          {reaction.emoji}
        </div>

        {/* Username label with better styling */}
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <div className="bg-black/90 backdrop-blur-md rounded-full px-3 py-1.5 border border-purple-400/40 shadow-lg">
            <span className="text-xs text-purple-200 font-semibold">
              {reaction.username}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmojiReactions: React.FC<EmojiReactionsProps> = ({
  onSendEmoji,
  reactions,
  containerRef,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeReactions, setActiveReactions] = useState<EmojiReaction[]>([]);
  const sidebarRef = useRef<HTMLButtonElement>(null);

  // Play sound effect for emoji reactions
  const playEmojiSound = useCallback((emoji: string) => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (
          window as typeof window & {
            webkitAudioContext: typeof window.AudioContext;
          }
        ).webkitAudioContext;

      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        // Different frequencies for different types of emojis
        let frequency = 523; // Default C5
        if (["❤️", "😍", "😘"].includes(emoji)) {
          frequency = 659; // E5 - love emojis
        } else if (["😂", "😄", "🤣"].includes(emoji)) {
          frequency = 784; // G5 - happy emojis
        } else if (["👏", "🎉", "⭐"].includes(emoji)) {
          frequency = 880; // A5 - celebration emojis
        } else if (["🔥", "💯", "👌"].includes(emoji)) {
          frequency = 698; // F5 - fire/cool emojis
        } else if (["😢", "😭", "💔"].includes(emoji)) {
          frequency = 440; // A4 - sad emojis (lower pitch)
        }

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(
          0.15,
          audioCtx.currentTime + 0.05
        );
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
      }
    } catch {}
  }, []);

  // Simple click handler without position
  const handleSimpleClick = useCallback(
    (emoji: string) => {
      onSendEmoji(emoji);
      playEmojiSound(emoji);
    },
    [onSendEmoji, playEmojiSound]
  );

  // Toggle sidebar
  const toggleSidebar = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  }, []);

  // Handle emoji click with proper event handling
  const handleEmojiClick = useCallback(
    (e: React.MouseEvent, emoji: string) => {
      e.preventDefault();
      e.stopPropagation();

      handleSimpleClick(emoji);
    },
    [handleSimpleClick]
  );

  // Handle new reactions
  useEffect(() => {
    if (reactions.length === 0) {
      setActiveReactions([]);
      return;
    }

    const latestReaction = reactions[reactions.length - 1];

    // Check if this reaction is already in activeReactions
    setActiveReactions((prev) => {
      const isAlreadyActive = prev.some((r) => r.id === latestReaction.id);

      if (!isAlreadyActive) {
        // Play sound for reactions
        playEmojiSound(latestReaction.emoji);

        // Remove after animation completes
        setTimeout(() => {
          setActiveReactions((current) =>
            current.filter((r) => r.id !== latestReaction.id)
          );
        }, 4000);

        return [...prev, latestReaction];
      }

      return prev;
    });
  }, [reactions, playEmojiSound]);

  return (
    <>
      {/* Sidebar Toggle Button */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-[9999]">
        <button
          ref={sidebarRef}
          type="button"
          onClick={toggleSidebar}
          className="group relative p-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 rounded-full border border-purple-400/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-sm cursor-pointer select-none"
          title="Open emoji reactions"
          style={{ userSelect: "none", pointerEvents: "auto" }}
        >
          {/* Button glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm rounded-full pointer-events-none"></div>

          <span className="relative text-xl filter drop-shadow-lg pointer-events-none">
            {isExpanded ? "✕" : "😀"}
          </span>

          {/* Pulse animation */}
          <div className="absolute inset-0 rounded-full border-2 border-purple-400/50 animate-ping opacity-0 group-hover:opacity-75 pointer-events-none"></div>
        </button>
      </div>

      {/* Emoji Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-gray-900/95 backdrop-blur-xl border-l border-purple-500/30 transform transition-transform duration-300 ease-in-out z-[9998] ${
          isExpanded ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">
              Emoji Reactions
            </h3>
            <button
              onClick={toggleSidebar}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Express your feelings with emojis!
          </p>
        </div>

        {/* Emoji Categories */}
        <div className="p-6 space-y-6 overflow-y-auto h-full pb-32">
          {/* Popular Reactions */}
          <div>
            <h4 className="text-sm font-medium text-purple-300 mb-3 uppercase tracking-wider">
              Popular Reactions
            </h4>
            <div className="grid grid-cols-4 gap-3">
              {["❤️", "😂", "👏", "🔥", "😍", "💯", "👌", "🎉"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={(e) => handleEmojiClick(e, emoji)}
                  className="group relative w-16 h-16 text-3xl bg-gray-800/50 hover:bg-gradient-to-br hover:from-purple-600/30 hover:to-pink-600/30 rounded-xl cursor-pointer flex items-center justify-center hover:scale-110 transition-all duration-200 active:scale-95 select-none border border-gray-700/50 hover:border-purple-400/50"
                  style={{ userSelect: "none", pointerEvents: "auto" }}
                  title={`React with ${emoji}`}
                >
                  <span className="relative z-10">{emoji}</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 to-pink-400/0 group-hover:from-purple-400/20 group-hover:to-pink-400/20 rounded-xl transition-colors duration-200"></div>
                </button>
              ))}
            </div>
          </div>

          {/* Emotions */}
          <div>
            <h4 className="text-sm font-medium text-purple-300 mb-3 uppercase tracking-wider">
              Emotions
            </h4>
            <div className="grid grid-cols-4 gap-3">
              {["😊", "😢", "😡", "😱", "🤔", "😴", "🤯", "🥳"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={(e) => handleEmojiClick(e, emoji)}
                  className="group relative w-16 h-16 text-3xl bg-gray-800/50 hover:bg-gradient-to-br hover:from-blue-600/30 hover:to-cyan-600/30 rounded-xl cursor-pointer flex items-center justify-center hover:scale-110 transition-all duration-200 active:scale-95 select-none border border-gray-700/50 hover:border-blue-400/50"
                  style={{ userSelect: "none", pointerEvents: "auto" }}
                  title={`React with ${emoji}`}
                >
                  <span className="relative z-10">{emoji}</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-cyan-400/0 group-hover:from-blue-400/20 group-hover:to-cyan-400/20 rounded-xl transition-colors duration-200"></div>
                </button>
              ))}
            </div>
          </div>

          {/* Activities */}
          <div>
            <h4 className="text-sm font-medium text-purple-300 mb-3 uppercase tracking-wider">
              Activities
            </h4>
            <div className="grid grid-cols-4 gap-3">
              {["🎵", "🎬", "🍿", "🕺", "💃", "🎸", "🥂", "🎊"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={(e) => handleEmojiClick(e, emoji)}
                  className="group relative w-16 h-16 text-3xl bg-gray-800/50 hover:bg-gradient-to-br hover:from-green-600/30 hover:to-emerald-600/30 rounded-xl cursor-pointer flex items-center justify-center hover:scale-110 transition-all duration-200 active:scale-95 select-none border border-gray-700/50 hover:border-green-400/50"
                  style={{ userSelect: "none", pointerEvents: "auto" }}
                  title={`React with ${emoji}`}
                >
                  <span className="relative z-10">{emoji}</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400/0 to-emerald-400/0 group-hover:from-green-400/20 group-hover:to-emerald-400/20 rounded-xl transition-colors duration-200"></div>
                </button>
              ))}
            </div>
          </div>

          {/* Objects & Symbols */}
          <div>
            <h4 className="text-sm font-medium text-purple-300 mb-3 uppercase tracking-wider">
              Objects & Symbols
            </h4>
            <div className="grid grid-cols-4 gap-3">
              {["⭐", "💎", "🏆", "🎯", "💝", "🌟", "🎪", "🎭"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={(e) => handleEmojiClick(e, emoji)}
                  className="group relative w-16 h-16 text-3xl bg-gray-800/50 hover:bg-gradient-to-br hover:from-yellow-600/30 hover:to-orange-600/30 rounded-xl cursor-pointer flex items-center justify-center hover:scale-110 transition-all duration-200 active:scale-95 select-none border border-gray-700/50 hover:border-yellow-400/50"
                  style={{ userSelect: "none", pointerEvents: "auto" }}
                  title={`React with ${emoji}`}
                >
                  <span className="relative z-10">{emoji}</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 to-orange-400/0 group-hover:from-yellow-400/20 group-hover:to-orange-400/20 rounded-xl transition-colors duration-200"></div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-900 to-transparent">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Click any emoji to share your reaction
            </p>
          </div>
        </div>
      </div>

      {/* Backdrop overlay */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9997] transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Floating Emoji Animations */}
      <div className="fixed inset-0 pointer-events-none z-40">
        {activeReactions.map((reaction) => (
          <FloatingEmoji
            key={reaction.id}
            reaction={reaction}
            containerRef={containerRef}
          />
        ))}
      </div>
    </>
  );
};

export default EmojiReactions;
