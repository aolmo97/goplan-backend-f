import { Server } from 'socket.io';
import { prisma } from '../lib/prisma';
import { sendPushNotification } from './notifications.service';

let io: Server | null = null;

export function setSocketServer(server: Server) {
  io = server;
}

function formatMessageTime(date: Date): string {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (diffDays === 1) return 'YESTERDAY';
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export async function getChats(userId: string) {
  const memberships = await prisma.chatMember.findMany({
    where: { userId },
    include: {
      chat: {
        include: {
          plan: true,
          members: { include: { user: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { sender: true }
          }
        }
      }
    }
  });

  return Promise.all(memberships.map(async membership => {
    const chat = membership.chat;
    const isGroup = chat.members.length > 2;
    const lastMsg = chat.messages[0];
    const other = chat.members.find(m => m.userId !== userId);

    const unreadCount = await prisma.message.count({
      where: {
        chatId: chat.id,
        ...(membership.lastSeenAt && { createdAt: { gt: membership.lastSeenAt } })
      }
    });

    const name = (isGroup || chat.plan)
      ? (chat.plan?.title || chat.name || 'Group Chat')
      : (other?.user.username || 'Unknown');

    const coverImage = (isGroup || chat.plan)
      ? (chat.plan?.coverImage || '')
      : (other?.user.avatar || '');

    return {
      id: chat.id,
      name,
      coverImage,
      membersCount: chat.members.length,
      ...(chat.plan?.id && { planId: chat.plan.id }),
      ...(chat.plan?.date && { nextEvent: chat.plan.date.toISOString() }),
      lastMessageText: lastMsg?.content || '',
      lastMessageTime: lastMsg ? formatMessageTime(lastMsg.createdAt) : '',
      unreadCount,
      isGroup,
      hasUpdates: unreadCount > 0
    };
  }));
}

export async function getChatMessages(chatId: string, userId: string, page = 1, limit = 50) {
  const member = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId } }
  });
  if (!member) throw new Error('Not a member of this chat');

  const messages = await prisma.message.findMany({
    where: { chatId },
    include: { sender: true },
    orderBy: { createdAt: 'asc' },
    skip: (page - 1) * limit,
    take: limit
  });

  return messages.map(m => ({
    id: m.id,
    senderName: m.sender.username,
    senderAvatar: m.sender.avatar || '',
    text: m.content,
    time: formatMessageTime(m.createdAt),
    isMe: m.senderId === userId
  }));
}

export async function sendMessage(chatId: string, userId: string, content: string) {
  const member = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId } }
  });
  if (!member) throw new Error('Not a member of this chat');

  const message = await prisma.message.create({
    data: { chatId, senderId: userId, content },
    include: { sender: true }
  });

  const dto = {
    id: message.id,
    senderName: message.sender.username,
    senderAvatar: message.sender.avatar || '',
    text: message.content,
    time: formatMessageTime(message.createdAt),
    isMe: false
  };

  if (io) io.to(`chat:${chatId}`).emit('chat:message', dto);

  // Send FCM push notifications to all chat members except the sender
  const otherMembers = await prisma.chatMember.findMany({
    where: { chatId, userId: { not: userId } },
    include: { user: { select: { fcmToken: true } } }
  });

  const truncatedBody = message.content.length > 100 ? message.content.slice(0, 100) + '…' : message.content;
  await Promise.all(
    otherMembers
      .filter(m => m.user.fcmToken)
      .map(m => sendPushNotification(m.user.fcmToken!, message.sender.username, truncatedBody))
  );

  return { ...dto, isMe: true };
}

export async function markRead(chatId: string, userId: string) {
  await prisma.chatMember.update({
    where: { chatId_userId: { chatId, userId } },
    data: { lastSeenAt: new Date() }
  });
}
