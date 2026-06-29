import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '../lib/prisma';
import { PLAN_INCLUDE, mapPlanToDTO } from './plans.service';

if (process.env.CLOUDINARY_API_KEY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

async function uploadAvatar(avatar: string): Promise<string> {
  if (!process.env.CLOUDINARY_API_KEY) return avatar;
  const isBase64 = avatar.startsWith('data:image');
  if (!isBase64) return avatar;
  const result = await cloudinary.uploader.upload(avatar, { folder: 'goplan/avatars' });
  return result.secure_url;
}

async function buildProfile(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const [plansCount, joinedCount, matchesCount] = await Promise.all([
    prisma.plan.count({ where: { creatorId: userId, status: { not: 'CANCELLED' } } }),
    prisma.match.count({ where: { userId, status: 'ACCEPTED' } }),
    prisma.match.count({ where: { userId } })
  ]);
  return {
    name: user.username,
    avatar: user.avatar || '',
    location: user.city || '',
    plansCount,
    joinedCount,
    matchesCount,
    aboutMe: user.bio || '',
    interests: user.interests
  };
}

export async function getMe(userId: string) {
  return buildProfile(userId);
}

export async function updateMe(userId: string, data: {
  name?: string;
  bio?: string;
  city?: string;
  interests?: string[];
  avatar?: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {};
  if (data.name) updateData.username = data.name;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.interests) updateData.interests = data.interests;
  if (data.avatar) updateData.avatar = await uploadAvatar(data.avatar);

  await prisma.user.update({ where: { id: userId }, data: updateData });
  return buildProfile(userId);
}

export async function getUserById(targetId: string, currentUserId: string) {
  const profile = await buildProfile(targetId);
  const isFollowing = !!(await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: currentUserId, followingId: targetId } }
  }));

  const plans = await prisma.plan.findMany({
    where: { creatorId: targetId, status: 'ACTIVE' },
    include: PLAN_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: 6
  });

  return {
    ...profile,
    isFollowing,
    plansCreated: plans.map(p => mapPlanToDTO(p, currentUserId, isFollowing))
  };
}

export async function toggleFollow(currentUserId: string, targetId: string) {
  if (currentUserId === targetId) throw new Error('Cannot follow yourself');

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: currentUserId, followingId: targetId } }
  });

  if (existing) {
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId: currentUserId, followingId: targetId } }
    });
    return { isFollowing: false };
  }

  await prisma.follow.create({ data: { followerId: currentUserId, followingId: targetId } });
  return { isFollowing: true };
}

export async function getMyPlans(userId: string) {
  const plans = await prisma.plan.findMany({
    where: { creatorId: userId },
    include: PLAN_INCLUDE,
    orderBy: { createdAt: 'desc' }
  });
  return plans.map(p => mapPlanToDTO(p, userId, false));
}

export async function getJoinedPlans(userId: string) {
  const matches = await prisma.match.findMany({
    where: { userId, status: 'ACCEPTED' },
    include: { plan: { include: PLAN_INCLUDE } }
  });
  return matches.map(m => mapPlanToDTO(m.plan, userId, false));
}

export async function saveFcmToken(userId: string, fcmToken: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { fcmToken } });
  console.log(`[FCM] Token saved for user ${userId}: ${fcmToken.slice(0, 20)}...`);
}
