import { Server, Socket } from 'socket.io';
import { verifyToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';

interface AuthSocket extends Socket {
  userId: string;
}

export function initSocketServer(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = verifyToken(token);
      (socket as AuthSocket).userId = payload.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId } = socket as AuthSocket;
    socket.join(`user:${userId}`);

    socket.on('chat:join', (chatId: string) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on('chat:message', async (data: { chatId: string; content: string }) => {
      try {
        const message = await prisma.message.create({
          data: { chatId: data.chatId, senderId: userId, content: data.content },
          include: { sender: true }
        });

        io.to(`chat:${data.chatId}`).emit('chat:message', {
          id: message.id,
          senderName: message.sender.username,
          senderAvatar: message.sender.avatar || '',
          text: message.content,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          isMe: false
        });
      } catch {
        socket.emit('error', 'Failed to send message');
      }
    });

    socket.on('chat:typing', (data: { chatId: string }) => {
      socket.to(`chat:${data.chatId}`).emit('chat:typing', { userId });
    });

    socket.on('chat:stop_typing', (data: { chatId: string }) => {
      socket.to(`chat:${data.chatId}`).emit('chat:stop_typing', { userId });
    });

    socket.on('disconnect', () => {
      socket.leave(`user:${userId}`);
    });
  });
}
