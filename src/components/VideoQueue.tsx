'use client';

import { List, Play, X, ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/Button';
import { useState } from 'react';

export interface QueuedVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
}

interface VideoQueueProps {
  queue: QueuedVideo[];
  currentVideoIndex: number;
  onSelectVideo: (index: number) => void;
  onRemoveVideo: (index: number) => void;
}

const VideoQueue = ({
  queue,
  currentVideoIndex,
  onSelectVideo,
  onRemoveVideo,
}: VideoQueueProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="w-full bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all shadow-lg">
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <List className="w-5 h-5 text-white mr-2" />
          <h3 className="text-white font-medium">Hàng chờ phát</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 px-2 py-0.5 bg-white/10 rounded-full">
            {queue.length} video
          </span>
          {queue.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-6 h-6 p-0 rounded-full"
            >
              {isExpanded ? 
                <ChevronUp className="w-4 h-4" /> : 
                <ChevronDown className="w-4 h-4" />
              }
            </Button>
          )}
        </div>
      </div>

      {isExpanded && (
        <>
          {queue.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm bg-white/5 rounded-lg border border-dashed border-white/10">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                <List className="w-6 h-6 text-gray-500" />
              </div>
              <p>Chưa có video trong hàng chờ</p>
              <p className="text-xs mt-1">Tìm kiếm và thêm video để bắt đầu xem cùng bạn bè</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {queue.map((video, index) => {
                const isCurrentVideo = currentVideoIndex === index;
                
                return (
                  <div
                    key={`${video.id}-${index}`}
                    className={`flex items-center space-x-3 rounded-lg p-2 transition-all ${
                      isCurrentVideo
                        ? 'bg-gradient-to-r from-violet-900/70 to-indigo-900/70 border border-violet-500/50 shadow-[0_0_10px_rgba(139,92,246,0.2)]'
                        : 'bg-white/10 hover:bg-white/15 border border-transparent hover:border-white/30'
                    }`}
                  >
                    <div className="relative flex-shrink-0 w-16">
                      <Image
                        src={video.thumbnail || 'https://via.placeholder.com/128x72.png?text=No+Thumbnail'}
                        alt={video.title}
                        width={128}
                        height={72}
                        className="w-16 h-auto rounded object-cover"
                      />
                      {isCurrentVideo && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center animate-pulse">
                            <span className="sr-only">Playing</span>
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isCurrentVideo ? 'text-violet-300' : 'text-white'}`}>
                        {index + 1}. {video.title}
                      </p>
                      <p className="text-gray-400 text-xs truncate">{video.channelTitle}</p>
                    </div>
                    <div className="flex space-x-1">
                      {!isCurrentVideo && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectVideo(index);
                          }}
                          title="Phát ngay"
                          className="w-7 h-7 rounded-full p-0 hover:bg-violet-500/30"
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveVideo(index);
                        }}
                        title="Xóa khỏi hàng chờ"
                        className="w-7 h-7 rounded-full p-0 hover:bg-red-500/30"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoQueue;
