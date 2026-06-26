import { Server } from 'socket.io';
import { prisma } from '../lib/prisma';

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
 * action = 'skip'  → creates Match(REJECTED). No further processing.
 * action = 'join'  → creates Match(PENDING) for the current user on the target plan.
 *                    Then checks for a mutual swipe:
 *                    - Mutual = plan.creator already has a PENDING (or ACCEPTED) match
 *                      on any plan created by the current user.
 *                    If mutual → update both matches to ACCEPTED, add both to plan chat,
 *                    emit match:new to both users.
 */
export async function swipe(userId: string, planId: string, action: 'join' | 'skip') {
  // Guard: prevent double swipe
  const existing = await prisma.match.findUnique({
    where: { userId_planId: { userId, planId } }
  });
  if (existing) throw new Error('Already swiped on this plan');

  if (action === 'skip') {
    await prisma.match.create({ data: { userId, planId, status: 'REJECTED' } });
    return { matched: false };
  }

  // Fetch the target plan (need creator + capacity info)
  const plan = await prisma.plan.findUniqueOrThrow({
    where: { id: planId },
    include: {
      matches: { where: { status: 'ACCEPTED' } }
    }
  });

  if (plan.matches.length >= plan.maxPeople) throw new Error('Plan is full');

  // Create the swipe as PENDING
  const newMatch = await prisma.match.create({
    data: { userId, planId, status: 'PENDING' }
  });

  // --- Mutual match check ---
  // The plan belongs to plan.creatorId (userB).
  // A mutual match exists if userB has already swiped right (PENDING or ACCEPTED)
  // on any plan created by userId (userA).
  const mutualMatch = await prisma.match.findFirst({
    where: {
      userId: plan.creatorId,
      status: { in: ['PENDING', 'ACCEPTED'] },
      plan: { creatorId: userId }
    },
    include: {
      plan: { select: { id: true, title: true, coverImage: true } }
    }
  });

  if (mutualMatch) {
    // Upgrade both matches to ACCEPTED
    await prisma.match.update({ where: { id: newMatch.id }, data: { status: 'ACCEPTED' } });
    await prisma.match.update({ where: { id: mutualMatch.id }, data: { status: 'ACCEPTED' } });

    // Add both users to the relevant plan chats
    await Promise.all([
      addUserToChat(planId, userId),
      addUserToChat(mutualMatch.plan.id, plan.creatorId)
    ]);

    // Emit match:new to both users (using the plan that just got swiped as context)
    await emitMatchNew(
      planId,
      plan.title,
      plan.coverImage || '',
      userId,
      plan.creatorId
    );

    return {
      matched: true,
      matchData: {
        planId,
        planName: plan.title
      }
    };
  }

  return { matched: false };
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
export async function updateMatch(
  matchId: string,
  currentUserId: string,
  status: 'ACCEPTED' | 'REJECTED'
) {
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    include: {
      plan: { select: { id: true, title: true, coverImage: true, creatorId: true } }
    }
  });

  if (match.plan.creatorId !== currentUserId) {
    throw new Error('Only the plan creator can update match requests');
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
  }

  return updated;
}
