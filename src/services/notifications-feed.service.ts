import { prisma } from '../lib/prisma';

export interface NotificationItem {
  id: string;
  type: 'join' | 'approved' | 'message';
  title: string;
  body: string;
  avatarUrl: string;
  planId?: string;
  chatId?: string;
  createdAt: Date;
}

export async function getNotifications(userId: string): Promise<NotificationItem[]> {
  const notifications: NotificationItem[] = [];

  // 1. New ACCEPTED matches on plans the user created (someone joined their plan)
  const joinMatches = await prisma.match.findMany({
    where: {
      status: 'ACCEPTED',
      plan: { creatorId: userId }
    },
    select: {
      id: true,
      planId: true,
      updatedAt: true,
      user: { select: { username: true, avatar: true } },
      plan: { select: { title: true } }
    },
    orderBy: { updatedAt: 'desc' },
    take: 30
  });

  for (const match of joinMatches) {
    notifications.push({
      id: `join-${match.id}`,
      type: 'join',
      title: match.plan.title,
      body: `${match.user.username} se ha unido a tu plan`,
      avatarUrl: match.user.avatar || '',
      planId: match.planId,
      createdAt: match.updatedAt
    });
  }

  // 2. Match status changed to ACCEPTED for the current user (their join request was approved)
  const approvedMatches = await prisma.match.findMany({
    where: {
      userId,
      status: 'ACCEPTED'
    },
    select: {
      id: true,
      planId: true,
      updatedAt: true,
      plan: {
        select: {
          title: true,
          coverImage: true,
          creator: { select: { avatar: true } }
        }
      }
    },
    orderBy: { updatedAt: 'desc' },
    take: 30
  });

  for (const match of approvedMatches) {
    notifications.push({
      id: `approved-${match.id}`,
      type: 'approved',
      title: match.plan.title,
      body: `Tu solicitud para ${match.plan.title} fue aprobada`,
      avatarUrl: match.plan.creator.avatar || '',
      planId: match.planId,
      createdAt: match.updatedAt
    });
  }

  // 3. Unread messages in chats the user is a member of (last message per chat)
  const memberships = await prisma.chatMember.findMany({
    where: { userId },
    include: {
      chat: {
        include: {
          plan: { select: { id: true, title: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { sender: { select: { username: true, avatar: true } } }
          }
        }
      }
    }
  });

  for (const membership of memberships) {
    const chat = membership.chat;
    const lastMsg = chat.messages[0];
    if (!lastMsg) continue;

    // Only include if unread (lastSeenAt is null or message is newer)
    const isUnread =
      !membership.lastSeenAt || lastMsg.createdAt > membership.lastSeenAt;

    // Skip messages sent by the user themselves
    if (!isUnread || lastMsg.sender.username === undefined) continue;

    notifications.push({
      id: `message-${chat.id}`,
      type: 'message',
      title: chat.plan?.title || 'Chat',
      body: `${lastMsg.sender.username}: ${lastMsg.content.length > 80 ? lastMsg.content.slice(0, 80) + '…' : lastMsg.content}`,
      avatarUrl: lastMsg.sender.avatar || '',
      planId: chat.plan?.id,
      chatId: chat.id,
      createdAt: lastMsg.createdAt
    });
  }

  // Combine, sort by date descending, return max 30
  notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return notifications.slice(0, 30);
}
