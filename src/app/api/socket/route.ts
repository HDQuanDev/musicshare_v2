// src/app/api/socket/route.ts

import { NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';

export const dynamic = 'force-dynamic';

// This is needed because the App Router doesn't expose the underlying HTTP server directly
// We need to use a global instance of Socket.IO
let io: SocketIOServer;

// Initialize Socket.IO server if not already initialized
function initSocketServer() {
  if (!io) {
    // Get the server instance from global
    // Using type assertion with a more specific type for the server
    const httpServer = (process as unknown as { 
      server: import('http').Server 
    }).server;
    
    if (!httpServer) {
      console.error("HTTP server not available");
      return null;
    }
    
    console.log('Setting up Socket.IO server...');
    
    io = new SocketIOServer(httpServer, {
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
  }
  
  return io;
}

export async function GET() {
  initSocketServer();
  return NextResponse.json({ success: true, message: 'Socket server initialized' });
}

export async function POST() {
  initSocketServer();
  return NextResponse.json({ success: true, message: 'Socket server initialized' });
}
