import { Server } from 'socket.io';
import { prisma } from '../lib/prisma';

let io: Server | null = null;

export function setSocketServer(server: Server) {
  io = server;
}

export async function swipe(userId: string, planId: string, action: 'join' | 'skip') {
  const existing = await prisma.match.findUnique({
    where: { userId_planId: { userId, planId } }
  });
  if (existing) throw new Error('Already swiped on this plan');

  if (action === 'skip') {
    await prisma.match.create({ data: { userId, planId, status: 'REJECTED' } });
    return { matched: false };
  }

  const plan = await prisma.plan.findUniqueOrThrow({
    where: { id: planId },
    include: {
      creator: true,
      matches: { where: { status: 'ACCEPTED' } }
    }
  });

  if (plan.matches.length >= plan.maxPeople) throw new Error('Plan is full');

  await prisma.match.create({ data: { userId, planId, status: 'ACCEPTED' } });

  const chat = await prisma.chat.findUnique({ where: { planId } });
  if (chat) {
    await prisma.chatMember.upsert({
      where: { chatId_userId: { chatId: chat.id, userId } },
      create: { chatId: chat.id, userId },
      update: {}
    });
  }

  const otherMatch = await prisma.match.findFirst({
    where: { planId, userId: { not: userId }, status: 'ACCEPTED' },
    include: { user: true }
  });

  if (otherMatch) {
    const matchData = {
      planName: plan.title,
      partner: { name: otherMatch.user.username, avatar: otherMatch.user.avatar || '' }
    };

    // Emit socket events when server is available
    if (io) {
      const currentUser = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
      const base = { planId, planTitle: plan.title, planCoverImage: plan.coverImage || '' };
      io.to(`user:${userId}`).emit('match:new', {
        ...base,
        matchedWith: { name: otherMatch.user.username, avatar: otherMatch.user.avatar || '' }
      });
      io.to(`user:${otherMatch.userId}`).emit('match:new', {
        ...base,
        matchedWith: { name: currentUser.username, avatar: currentUser.avatar || '' }
      });
    }

    return { matched: true, matchData };
  }

  return { matched: false };
}

export async function getMatches(userId: string) {
  return prisma.match.findMany({
    where: { userId, status: 'ACCEPTED' },
    include: { plan: { include: { creator: true } } }
  });
}

export async function updateMatch(matchId: string, currentUserId: string, status: 'ACCEPTED' | 'REJECTED') {
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    include: { plan: true }
  });

  if (match.plan.creatorId !== currentUserId) throw new Error('Only plan creator can update matches');

  const updated = await prisma.match.update({ where: { id: matchId }, data: { status } });

  if (status === 'ACCEPTED') {
    const chat = await prisma.chat.findUnique({ where: { planId: match.planId } });
    if (chat) {
      await prisma.chatMember.upsert({
        where: { chatId_userId: { chatId: chat.id, userId: match.userId } },
        create: { chatId: chat.id, userId: match.userId },
        update: {}
      });
    }
  }

  return updated;
}
