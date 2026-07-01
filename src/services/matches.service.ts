import { Server } from 'socket.io';
import { prisma } from '../lib/prisma';
import { sendPushNotification } from './notifications.service';

let io: Server | null = null;

export function setSocketServer(server: Server) {
  io = server;
}

/**
 * Emit match:new to both users when a mutual match is confirmed.
 * Each user receives the other's info as `matchedWith`.
 */
async function emitMatchNew(
  planId: string,
  planTitle: string,
  planCoverImage: string,
  userAId: string,
  userBId: string
) {
  if (!io) return;

  const [userA, userB] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userAId }, select: { username: true, avatar: true } }),
    prisma.user.findUniqueOrThrow({ where: { id: userBId }, select: { username: true, avatar: true } })
  ]);

  const base = { planId, planTitle, planCoverImage };

  io.to(`user:${userAId}`).emit('match:new', {
    ...base,
    matchedWith: { name: userB.username, avatar: userB.avatar || '' }
  });

  io.to(`user:${userBId}`).emit('match:new', {
    ...base,
    matchedWith: { name: userA.username, avatar: userA.avatar || '' }
  });
}

/**
 * Add a user to the chat associated with a plan (if the chat exists).
 */
async function addUserToChat(planId: string, userId: string) {
  const chat = await prisma.chat.findUnique({ where: { planId } });
  if (!chat) return;
  await prisma.chatMember.upsert({
    where: { chatId_userId: { chatId: chat.id, userId } },
    create: { chatId: chat.id, userId },
    update: {}
  });
}

/**
 * Swipe on a plan.
 *
 * action = 'skip' → creates Match(REJECTED).
 * action = 'join' → public plan: ACCEPTED immediately + user added to chat.
 *                   private plan: PENDING until creator approves via updateMatch.
 */
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
    include: { matches: { where: { status: 'ACCEPTED' } } }
  });

  if (plan.matches.length >= plan.maxPeople) throw new Error('Plan is full');

  if (plan.isPrivate) {
    await prisma.match.create({ data: { userId, planId, status: 'PENDING' } });
    return { matched: false };
  }

  // Public plan: join immediately
  await prisma.match.create({ data: { userId, planId, status: 'ACCEPTED' } });
  await addUserToChat(planId, userId);
  await emitMatchNew(planId, plan.title, plan.coverImage || '', userId, plan.creatorId);

  // Notify the plan creator via FCM
  const creator = await prisma.user.findUnique({ where: { id: plan.creatorId }, select: { fcmToken: true } });
  if (creator?.fcmToken) {
    await sendPushNotification(
      creator.fcmToken,
      'Alguien se unió a tu plan',
      `Alguien se ha unido a tu plan ${plan.title}`,
      { planId }
    );
  }

  return {
    matched: true,
    matchData: { planId, planName: plan.title }
  };
}

/**
 * Get all confirmed (ACCEPTED) matches for the current user.
 */
export async function getMatches(userId: string) {
  return prisma.match.findMany({
    where: { userId, status: 'ACCEPTED' },
    include: { plan: { include: { creator: true } } }
  });
}

/**
 * Allow the plan creator to manually accept or reject a PENDING match request.
 * On ACCEPTED: add the user to the plan chat and emit match:new to both users.
 */
/**
 * Allow an ACCEPTED user to leave a plan they joined.
 * Deletes the Match and removes them from the plan's ChatMember.
 */
export async function leavePlan(userId: string, planId: string) {
  const match = await prisma.match.findUnique({
    where: { userId_planId: { userId, planId } },
    include: { plan: { select: { creatorId: true } } }
  });

  if (!match || match.status !== 'ACCEPTED') throw new Error('Match not found');
  if (match.plan.creatorId === userId) throw new Error('Creator cannot leave their own plan');

  await prisma.match.delete({ where: { userId_planId: { userId, planId } } });

  const chat = await prisma.chat.findUnique({ where: { planId } });
  if (chat) {
    await prisma.chatMember.deleteMany({ where: { chatId: chat.id, userId } });
  }
}

/**
 * Return all PENDING match requests for plans the current user created.
 */
export async function getPendingRequests(creatorId: string) {
  return prisma.match.findMany({
    where: {
      status: 'PENDING',
      plan: { creatorId }
    },
    select: {
      id: true,
      userId: true,
      planId: true,
      createdAt: true,
      user: { select: { username: true, avatar: true } },
      plan: { select: { title: true, coverImage: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function updateMatch(
  matchId: string,
  currentUserId: string,
  status: 'ACCEPTED' | 'REJECTED'
) {
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    include: {
      plan: {
        select: { id: true, title: true, coverImage: true, creatorId: true, maxPeople: true },
        include: { matches: { where: { status: 'ACCEPTED' } } }
      }
    }
  });

  if (match.plan.creatorId !== currentUserId) {
    throw new Error('Only the plan creator can update match requests');
  }

  if (status === 'ACCEPTED' && (match.plan as any).matches.length >= match.plan.maxPeople) {
    throw new Error('Plan is full');
  }

  const updated = await prisma.match.update({ where: { id: matchId }, data: { status } });

  if (status === 'ACCEPTED') {
    await addUserToChat(match.plan.id, match.userId);

    await emitMatchNew(
      match.plan.id,
      match.plan.title,
      match.plan.coverImage || '',
      match.userId,
      currentUserId
    );

    // Notify the requester via FCM
    const requester = await prisma.user.findUnique({ where: { id: match.userId }, select: { fcmToken: true } });
    if (requester?.fcmToken) {
      await sendPushNotification(
        requester.fcmToken,
        'Solicitud aceptada',
        `Tu solicitud para ${match.plan.title} fue aceptada`,
        { planId: match.plan.id }
      );
    }
  }

  return updated;
}
