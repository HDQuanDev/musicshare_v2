// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const https = require('https'); // Added for YouTube API requests

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// YouTube API configuration
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || 'AIzaSyCxdfz_ZXdAhWta8S_U5CHNo0fVqfjVF7I';

// Next.js app setup
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// Function to update time for active rooms
const updateRoomTimes = () => {
  const now = new Date().getTime();

  rooms.forEach(room => {
    // Only update time for rooms with active playback
    if (room.isPlaying && room.currentMedia) {
      // Calculate elapsed time since last update
      const timeElapsed = room.lastTimeUpdate
        ? (now - room.lastTimeUpdate) / 1000  // Convert ms to seconds
        : 0;

      // Update current time
      room.currentTime += timeElapsed;
      room.lastTimeUpdate = now;
    }
  });
};

// In-memory storage for rooms (in production, use Redis or database)
const rooms = new Map();
const userSockets = new Map();

// Helper function to search YouTube videos using the YouTube API directly
function searchYouTubeVideos(query) {
  return new Promise((resolve, reject) => {
    const encodedQuery = encodeURIComponent(query);
    const requestUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodedQuery}&maxResults=10&type=video&videoEmbeddable=true&key=${YOUTUBE_API_KEY}`;

    https.get(requestUrl, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const results = JSON.parse(data);

          if (results.items && results.items.length > 0) {
            // Map API response to our internal format
            const mappedResults = results.items.map(item => {
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

            resolve(mappedResults);
          } else {
            resolve([]);
          }
        } catch (error) {
          console.error('Error parsing YouTube API response:', error);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.error('Error searching YouTube:', error);
      reject(error);
    });
  });
}

// Helper function to get video details from YouTube API
function getYouTubeVideoDetails(videoId) {
  return new Promise((resolve, reject) => {
    const requestUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&key=${YOUTUBE_API_KEY}&id=${videoId}`;

    https.get(requestUrl, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const results = JSON.parse(data);

          if (results.items && results.items.length > 0) {
            const item = results.items[0];
            const snippet = item.snippet || {};
            const contentDetails = item.contentDetails || {};

            const videoDetails = {
              id: videoId,
              title: snippet.title || 'Unknown Title',
              channelTitle: snippet.channelTitle || '',
              thumbnail: snippet.thumbnails?.default?.url ||
                snippet.thumbnails?.medium?.url ||
                `https://i.ytimg.com/vi/${videoId}/default.jpg`,
              duration: contentDetails.duration ? convertISO8601ToSeconds(contentDetails.duration) : 0
            };

            resolve(videoDetails);
          } else {
            reject(new Error('Video not found or not available'));
          }
        } catch (error) {
          console.error('Error parsing YouTube video details response:', error);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.error('Error getting YouTube video details:', error);
      reject(error);
    });
  });
}

// Helper function to get video duration from YouTube API
function getYouTubeVideoDuration(videoId) {
  return new Promise((resolve, reject) => {
    const requestUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&key=${YOUTUBE_API_KEY}&id=${videoId}`;

    https.get(requestUrl, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const results = JSON.parse(data);

          if (results.items && results.items.length > 0) {
            const duration = results.items[0].contentDetails?.duration;
            if (duration) {
              // Convert ISO 8601 duration to seconds
              const seconds = convertISO8601ToSeconds(duration);
              resolve(seconds);
            } else {
              resolve(0);
            }
          } else {
            resolve(0);
          }
        } catch (error) {
          console.error('Error parsing YouTube video details response:', error);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.error('Error getting YouTube video duration:', error);
      reject(error);
    });
  });
}

// Helper function to convert ISO 8601 duration to seconds
function convertISO8601ToSeconds(duration) {
  // PT4M13S format
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = duration.match(regex);

  if (!matches) return 0;

  const hours = parseInt(matches[1]) || 0;
  const minutes = parseInt(matches[2]) || 0;
  const seconds = parseInt(matches[3]) || 0;

  return hours * 3600 + minutes * 60 + seconds;
}

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Set up interval to update current time for playing media
  const timeUpdateInterval = setInterval(updateRoomTimes, 5000); // Update every 5 seconds

  io.on('connection', (socket) => {


    // YouTube search event handler
    socket.on('search-youtube', async (query) => {
      try {

        const results = await searchYouTubeVideos(query);
        socket.emit('youtube-search-results', results);

      } catch (error) {
        console.error('YouTube search failed:', error);
        socket.emit('youtube-search-error', { message: 'Failed to search YouTube' });
      }
    });

    // Get video duration event handler
    socket.on('get-video-duration', async (videoId) => {
      try {

        const duration = await getYouTubeVideoDuration(videoId);
        socket.emit('video-duration-result', { videoId, duration });

      } catch (error) {
        console.error('Get video duration failed:', error);
        socket.emit('video-duration-error', { videoId, message: 'Failed to get video duration' });
      }
    });

    // Get video details from video ID
    socket.on('get-video-details', async (videoId) => {
      try {

        const videoDetails = await getYouTubeVideoDetails(videoId);
        socket.emit('video-details-result', videoDetails);

      } catch (error) {
        console.error('Get video details failed:', error);
        socket.emit('video-details-error', { videoId, message: error.message || 'Failed to get video details' });
      }
    });

    socket.on('create-room', (data) => {
      const { roomName, userName } = data;
      const roomCode = generateRoomCode();

      const room = {
        id: roomCode,
        name: roomName,
        code: roomCode,
        createdBy: socket.id,
        users: [{
          id: socket.id,
          name: userName || 'Host',
          isHost: true
        }],
        currentMedia: null,
        mediaQueue: [],
        currentQueueIndex: -1,
        isPlaying: false,
        currentTime: 0,
        volume: 70, // Default volume level
        messages: [],
        lastTimeUpdate: null, // For tracking when timestamps are updated
        createdAt: new Date()
      };

      rooms.set(roomCode, room);
      userSockets.set(socket.id, { roomCode, userName: userName || 'Host' });

      socket.join(roomCode);
      socket.emit('room-created', { roomCode, room });


    });

    socket.on('join-room', (data) => {
      const { roomCode, userName } = data;
      const room = rooms.get(roomCode);

      if (!room) {
        socket.emit('room-error', { message: 'Phòng không tồn tại' });
        return;
      }

      // Check if user is already in the room
      const existingUser = room.users.find(u => u.id === socket.id);
      if (existingUser) {
        // User is already in room, just rejoin
        socket.join(roomCode);
        userSockets.set(socket.id, { roomCode, userName: existingUser.name });
        socket.emit('room-joined', room);

        return;
      }

      const user = {
        id: socket.id,
        name: userName || `User ${socket.id.slice(0, 4)}`,
        isHost: false
      };

      room.users.push(user);
      userSockets.set(socket.id, { roomCode, userName: user.name });

      // Create a system message for user joining
      const joinMessage = {
        id: `system-${Date.now()}`,
        userId: 'system',
        username: 'Hệ thống',
        message: `${user.name} vừa tham gia phòng`,
        timestamp: new Date()
      };

      // Save the message in room history
      room.messages.push(joinMessage);

      // Limit the number of messages (similar to chat message handling)
      if (room.messages.length > 100) {
        room.messages = room.messages.slice(-100);
      }

      socket.join(roomCode);
      socket.emit('room-joined', room);
      socket.to(roomCode).emit('user-joined', user);
      socket.to(roomCode).emit('new-message', joinMessage);

      // If a video is currently playing, immediately sync the new user
      if (room.currentMedia) {
        // Get the current server timestamp to calculate time offset
        const serverTime = new Date().getTime();

        // Update current time if video is playing
        if (room.isPlaying && room.lastTimeUpdate) {
          const timeElapsed = (serverTime - room.lastTimeUpdate) / 1000;
          room.currentTime += timeElapsed;
          room.lastTimeUpdate = serverTime;
        }

        // Send a special sync event to the new user
        socket.emit('sync-playback', {
          isPlaying: room.isPlaying,
          currentTime: room.currentTime,
          serverTimestamp: serverTime,
          media: room.currentMedia,
          volume: room.volume || 70
        });


      }


    });

    socket.on('leave-room', () => {
      const userInfo = userSockets.get(socket.id);
      if (!userInfo) return;

      const { roomCode, userName } = userInfo;
      const room = rooms.get(roomCode);

      if (room) {
        // Find the user before removing them from the room
        const leavingUser = room.users.find(u => u.id === socket.id);
        const leavingUserName = leavingUser ? leavingUser.name : userName || 'Người dùng';

        // Remove user from room's user list
        room.users = room.users.filter(u => u.id !== socket.id);

        if (room.users.length === 0) {
          rooms.delete(roomCode);

        } else {
          // Create a system message for user leaving
          const leaveMessage = {
            id: `system-${Date.now()}`,
            userId: 'system',
            username: 'Hệ thống',
            message: `${leavingUserName} vừa rời khỏi phòng`,
            timestamp: new Date()
          };

          // Save the message in room history
          room.messages.push(leaveMessage);

          // Limit the number of messages
          if (room.messages.length > 100) {
            room.messages = room.messages.slice(-100);
          }

          socket.to(roomCode).emit('user-left', socket.id);
          io.to(roomCode).emit('new-message', leaveMessage);
        }
      }

      socket.leave(roomCode);
      userSockets.delete(socket.id);


    });

    socket.on('chat-message', (data) => {
      const userInfo = userSockets.get(socket.id);
      if (!userInfo) return;

      const { roomCode } = userInfo;
      const room = rooms.get(roomCode);
      if (!room) return;

      const message = {
        id: Date.now().toString(),
        userId: socket.id,
        username: userInfo.userName,
        message: data.message,
        timestamp: new Date()
      };

      // Lưu tin nhắn vào phòng
      room.messages.push(message);

      // Giới hạn số lượng tin nhắn lưu trữ (tùy chọn)
      if (room.messages.length > 100) {
        room.messages = room.messages.slice(-100);
      }

      io.to(roomCode).emit('new-message', message);

    });

    // Handle emoji reactions
    socket.on('send-emoji', (data) => {
      const userInfo = userSockets.get(socket.id);
      if (!userInfo) return;

      const { roomCode } = userInfo;
      const room = rooms.get(roomCode);
      if (!room) return;

      const reaction = {
        id: `emoji-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        emoji: data.emoji,
        userId: socket.id,
        username: userInfo.userName,
        timestamp: new Date(),
        x: data.x,
        y: data.y
      };

      // Broadcast emoji reaction to all users in the room
      io.to(roomCode).emit('emoji-reaction', reaction);

    });

    socket.on('play', () => {
      const userInfo = userSockets.get(socket.id);
      if (!userInfo) return;

      const { roomCode } = userInfo;
      const room = rooms.get(roomCode);

      if (room && !room.isPlaying) { // Only process if not already playing

        room.isPlaying = true;
        room.lastTimeUpdate = new Date().getTime(); // Record when playback started
        io.to(roomCode).emit('play'); // Emit to all clients in room including sender

      } else if (room && room.isPlaying) {

      }
    });

    socket.on('pause', () => {
      const userInfo = userSockets.get(socket.id);
      if (!userInfo) return;

      const { roomCode } = userInfo;
      const room = rooms.get(roomCode);

      if (room && room.isPlaying) { // Only process if currently playing

        // Before pausing, update the current time to have accurate position
        if (room.lastTimeUpdate) {
          const now = new Date().getTime();
          const timeElapsed = (now - room.lastTimeUpdate) / 1000;
          room.currentTime += timeElapsed;
        }

        room.isPlaying = false;
        io.to(roomCode).emit('pause'); // Emit to all clients in room including sender

      } else if (room && !room.isPlaying) {

      }
    });

    socket.on('seek', (time) => {
      const userInfo = userSockets.get(socket.id);
      if (!userInfo) return;

      const { roomCode } = userInfo;
      const room = rooms.get(roomCode);

      if (room) {
        room.currentTime = time;
        room.lastTimeUpdate = new Date().getTime(); // Track when the time was last updated
        io.to(roomCode).emit('seek', time); // Emit to all clients in room including sender
      }
    });

    // Sync volume
    socket.on('volume-change', (volume) => {
      const userInfo = userSockets.get(socket.id);
      if (!userInfo) return;

      const { roomCode } = userInfo;
      const room = rooms.get(roomCode);

      if (room) {
        // Store volume setting in room
        room.volume = volume;
        // Broadcast to all other users
        socket.to(roomCode).emit('volume-change', volume);
      }
    });

    // Handle sync request from users (when they start interacting with video)
    socket.on('request-sync', () => {
      const userInfo = userSockets.get(socket.id);
      if (!userInfo) return;

      const { roomCode } = userInfo;
      const room = rooms.get(roomCode);

      if (room && room.currentMedia) {
        // Get the current server timestamp to calculate time offset
        const serverTime = new Date().getTime();

        // Update current time if video is playing
        if (room.isPlaying && room.lastTimeUpdate) {
          const timeElapsed = (serverTime - room.lastTimeUpdate) / 1000;
          room.currentTime += timeElapsed;
          room.lastTimeUpdate = serverTime;
        }

        // Send sync data to the requesting user
        socket.emit('sync-playback', {
          isPlaying: room.isPlaying,
          currentTime: room.currentTime,
          serverTimestamp: serverTime,
          media: room.currentMedia,
          volume: room.volume
        });


      }
    });

    socket.on('add-to-queue', async (mediaItem) => {
      const userInfo = userSockets.get(socket.id);
      if (!userInfo) return;

      const { roomCode } = userInfo;
      const room = rooms.get(roomCode);

      if (room) {
        try {
          // Lấy duration của video nếu chưa có
          if (!mediaItem.duration && mediaItem.videoId) {

            const duration = await getYouTubeVideoDuration(mediaItem.videoId);
            mediaItem.duration = duration;

          }
        } catch (error) {
          console.error('Failed to get video duration:', error);
          // Tiếp tục thêm video vào queue ngay cả khi không lấy được duration
          mediaItem.duration = 0;
        }

        // Thêm media vào hàng chờ
        room.mediaQueue.push(mediaItem);

        // Nếu đây là item đầu tiên và không có media nào đang phát
        if (room.mediaQueue.length === 1 && !room.currentMedia) {
          room.currentMedia = mediaItem;
          room.currentQueueIndex = 0;
          io.to(roomCode).emit('media-changed', mediaItem);
        }

        // Thông báo queue đã được cập nhật
        io.to(roomCode).emit('queue-updated', room.mediaQueue);

      }
    });

    socket.on('remove-from-queue', (index) => {
      const userInfo = userSockets.get(socket.id);
      if (!userInfo) return;

      const { roomCode } = userInfo;
      const room = rooms.get(roomCode);

      if (room && index >= 0 && index < room.mediaQueue.length) {
        // Xóa item từ hàng chờ
        const removedItem = room.mediaQueue.splice(index, 1)[0];

        // Nếu item đang phát bị xóa
        if (index === room.currentQueueIndex) {
          // Nếu còn item trong hàng chờ
          if (room.mediaQueue.length > 0) {
            // Phát item tiếp theo hoặc giữ nguyên index nếu là item cuối cùng
            const newIndex = Math.min(index, room.mediaQueue.length - 1);
            room.currentMedia = room.mediaQueue[newIndex];
            room.currentQueueIndex = newIndex;
            room.currentTime = 0;
            io.to(roomCode).emit('media-changed', room.currentMedia);
            io.to(roomCode).emit('queue-index-changed', newIndex);
          } else {
            // Không còn item nào trong hàng chờ
            room.currentMedia = null;
            room.currentQueueIndex = -1;
            io.to(roomCode).emit('media-changed', null);
          }
        }
        // Nếu item bị xóa trước item đang phát, cập nhật lại index
        else if (index < room.currentQueueIndex) {
          room.currentQueueIndex--;
          io.to(roomCode).emit('queue-index-changed', room.currentQueueIndex);
        }

        // Thông báo queue đã được cập nhật
        io.to(roomCode).emit('queue-updated', room.mediaQueue);

      }
    });

    socket.on('select-from-queue', (index) => {
      const userInfo = userSockets.get(socket.id);
      if (!userInfo) return;

      const { roomCode } = userInfo;
      const room = rooms.get(roomCode);

      if (room && index >= 0 && index < room.mediaQueue.length) {
        // Cập nhật media hiện tại
        room.currentMedia = room.mediaQueue[index];
        room.currentQueueIndex = index;
        room.currentTime = 0;
        room.isPlaying = true;
        room.lastTimeUpdate = new Date().getTime(); // Track when new media started playing

        // Thông báo media đã thay đổi
        io.to(roomCode).emit('media-changed', room.currentMedia);
        io.to(roomCode).emit('queue-index-changed', index);
        io.to(roomCode).emit('seek', 0);
        io.to(roomCode).emit('play');


      }
    });

    socket.on('disconnect', () => {
      const userInfo = userSockets.get(socket.id);
      if (userInfo) {
        const { roomCode, userName } = userInfo;
        const room = rooms.get(roomCode);

        if (room) {
          // Find the user before removing them from the room
          const leavingUser = room.users.find(u => u.id === socket.id);
          const leavingUserName = leavingUser ? leavingUser.name : userName || 'Người dùng';

          // Remove user from room's user list
          room.users = room.users.filter(u => u.id !== socket.id);

          if (room.users.length === 0) {
            rooms.delete(roomCode);

          } else {
            // Create a system message for user leaving
            const leaveMessage = {
              id: `system-${Date.now()}`,
              userId: 'system',
              username: 'Hệ thống',
              message: `${leavingUserName} vừa rời khỏi phòng`,
              timestamp: new Date()
            };

            // Save the message in room history
            room.messages.push(leaveMessage);

            // Limit the number of messages
            if (room.messages.length > 100) {
              room.messages = room.messages.slice(-100);
            }

            socket.to(roomCode).emit('user-left', socket.id);
            io.to(roomCode).emit('new-message', leaveMessage);
          }
        }

        userSockets.delete(socket.id);
      }


    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      clearInterval(timeUpdateInterval);
      process.exit(1);
    })
    .listen(port, () => {

    });

  // Clean up on server shutdown
  process.on('SIGINT', () => {
    clearInterval(timeUpdateInterval);
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    clearInterval(timeUpdateInterval);
    process.exit(0);
  });
});

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
