// src/app/api/socket/route.ts

import { NextRequest } from 'next/server';
import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponse } from 'next';

export const dynamic = 'force-dynamic';

type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

const SocketHandler = (req: NextRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    console.log('Setting up Socket.IO server...');
    
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);
      
      socket.on('join-room', (roomCode: string) => {
        socket.join(roomCode);
        socket.to(roomCode).emit('user-joined', {
          id: socket.id,
          name: `User ${socket.id.slice(0, 4)}`
        });
        console.log(`User ${socket.id} joined room ${roomCode}`);
      });
      
      socket.on('leave-room', (roomCode: string) => {
        socket.leave(roomCode);
        socket.to(roomCode).emit('user-left', socket.id);
        console.log(`User ${socket.id} left room ${roomCode}`);
      });
      
      socket.on('play', (roomCode: string) => {
        socket.to(roomCode).emit('play');
      });
      
      socket.on('pause', (roomCode: string) => {
        socket.to(roomCode).emit('pause');
      });
      
      socket.on('seek', (data: { roomCode: string; time: number }) => {
        socket.to(data.roomCode).emit('seek', data.time);
      });
      
      socket.on('chat-message', (data: { roomCode: string; message: string; username: string }) => {
        const chatMessage = {
          id: Date.now().toString(),
          userId: socket.id,
          username: data.username,
          message: data.message,
          timestamp: new Date()
        };
        io.to(data.roomCode).emit('new-message', chatMessage);
      });
      
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });
    
    res.socket.server.io = io;
  }
  
  return new Response('Socket server initialized', { status: 200 });
};

export { SocketHandler as GET, SocketHandler as POST };
