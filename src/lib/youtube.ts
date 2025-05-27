'use client';

import { google } from 'googleapis';
import type { QueuedVideo } from '@/components/VideoQueue';

// Cấu hình YouTube Data API v3
// Lưu ý: Trong môi trường production, API KEY nên được lưu trong biến môi trường
// Nhưng để thuận tiện cho phát triển, chúng ta sẽ lưu nó trực tiếp ở đây
const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || 'YOUR_API_KEY_HERE';
const youtube = google.youtube({
  version: 'v3',
  auth: API_KEY
});

/**
 * Tìm kiếm video YouTube sử dụng YouTube Data API v3
 * @param query Từ khóa tìm kiếm
 * @returns Danh sách kết quả tìm kiếm
 */
export async function searchYouTubeVideos(query: string): Promise<QueuedVideo[]> {
  try {
    console.log('Searching YouTube for:', query);
    
    const response = await youtube.search.list({
      part: ['snippet'],
      q: query,
      maxResults: 10,
      type: ['video'],
      videoEmbeddable: 'true'
    });
    
    console.log('YouTube search results:', response.data);
    
    if (response.data.items && response.data.items.length > 0) {
      // Map API response to our internal format
      const results = response.data.items.map(item => {
        const videoId = item.id?.videoId || '';
        const snippet = item.snippet || {};
        
        return {
          id: videoId,
          title: snippet.title || 'Unknown Title',
          channelTitle: snippet.channelTitle || '',
          thumbnail: snippet.thumbnails?.default?.url || 
                     snippet.thumbnails?.medium?.url || 
                     `https://i.ytimg.com/vi/${videoId}/default.jpg`
        };
      });
      
      console.log('Mapped results:', results);
      return results;
    }
    
    console.log('Search returned no results');
    return [];
      
  } catch (error: unknown) {
    console.error('YouTube API search failed:', error);
    // Return some fallback results rather than throwing
    return [
      {
        id: 'dQw4w9WgXcQ',
        title: 'Rick Astley - Never Gonna Give You Up',
        channelTitle: 'Rick Astley',
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg'
      },
      {
        id: '9bZkp7q19f0',
        title: 'PSY - GANGNAM STYLE(강남스타일)',
        channelTitle: 'officialpsy',
        thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/default.jpg'
      },
      {
        id: 'kJQP7kiw5Fk',
        title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
        channelTitle: 'Luis Fonsi',
        thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/default.jpg'
      }
    ];
  }
}

export function getYouTubeVideoId(url: string): string | null {    // Xử lý link YouTube để lấy videoId
  try {
    if (!url) return null;
    
    // Trường hợp đã là video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url;
    }
    
    const urlObj = new URL(url);
    
    // youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.includes('/watch')) {
      return urlObj.searchParams.get('v');
    }
    
    // youtu.be/VIDEO_ID
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    
    return null;
  } catch {
    // URL có thể không hợp lệ
    return null;
  }
}

/**
 * Lấy chi tiết video từ YouTube Data API v3
 * @param videoId ID của video cần lấy thông tin
 * @returns Thông tin video 
 */
export async function getVideoDetails(videoId: string): Promise<QueuedVideo | null> {
  try {
    console.log('Getting video details for:', videoId);
    
    // Gọi YouTube API để lấy thông tin video
    const response = await youtube.videos.list({
      part: ['snippet', 'contentDetails', 'statistics'],
      id: [videoId]
    });
    
    console.log('Video details response:', response.data);
    
    if (response.data.items && response.data.items.length > 0) {
      const video = response.data.items[0];
      const snippet = video.snippet || {};
      
      return {
        id: videoId,
        title: snippet.title || 'Unknown Title',
        channelTitle: snippet.channelTitle || 'Unknown Channel',
        thumbnail: snippet.thumbnails?.standard?.url || 
                  snippet.thumbnails?.high?.url || 
                  snippet.thumbnails?.medium?.url || 
                  snippet.thumbnails?.default?.url || 
                  `https://i.ytimg.com/vi/${videoId}/default.jpg`
      };
    }
    
    // Fallback: construct basic video details from ID
    console.log('No video details returned, using fallback');
    return {
      id: videoId,
      title: 'Video ' + videoId,
      channelTitle: 'YouTube',
      thumbnail: `https://i.ytimg.com/vi/${videoId}/default.jpg`
    };
  } catch (error: unknown) {
    console.error('Error getting video details:', error);
    
    // Fallback khi API lỗi
    return {
      id: videoId,
      title: 'Video ' + videoId,
      channelTitle: 'YouTube',
      thumbnail: `https://i.ytimg.com/vi/${videoId}/default.jpg`
    };
  }
}
