import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '../lib/prisma';

if (process.env.CLOUDINARY_API_KEY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

async function uploadCoverImage(image: string): Promise<string> {
  if (!process.env.CLOUDINARY_API_KEY) return image;
  if (!image.startsWith('data:image')) return image;
  const result = await cloudinary.uploader.upload(image, { folder: 'planmate/covers' });
  return result.secure_url;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatTime(date: Date): string {
  return date.toISOString().split('T')[1].slice(0, 5);
}

function formatTimestamp(date: Date): string {
  const diffH = Math.floor((Date.now() - date.getTime()) / 3600000);
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPlanToDTO(plan: any, currentUserId: string, isFollowing = false) {
  const joinedUsers = (plan.matches || []).map((m: any) => ({
    name: m.user.username,
    avatar: m.user.avatar || ''
  }));

  return {
    id: plan.id,
    title: plan.title,
    description: plan.description,
    category: plan.category,
    date: formatDate(plan.date),
    time: formatTime(plan.date),
    location: plan.location,
    ...(plan.locationDetails && { locationDetails: plan.locationDetails }),
    maxPeople: plan.maxPeople,
    joinedCount: joinedUsers.length,
    spotsLeft: plan.maxPeople - joinedUsers.length,
    isPrivate: plan.isPrivate,
    isOwner: plan.creatorId === currentUserId,
    creator: {
      name: plan.creator.username,
      avatar: plan.creator.avatar || '',
      isFollowing
    },
    coverImage: plan.coverImage || '',
    joinedUsers,
    comments: (plan.comments || []).map((c: any) => ({
      id: c.id,
      userName: c.user.username,
      userAvatar: c.user.avatar || '',
      text: c.text,
      timestamp: formatTimestamp(c.createdAt)
    }))
  };
}

const PLAN_INCLUDE = {
  creator: true,
  matches: {
    where: { status: 'ACCEPTED' as const },
    include: { user: true }
  },
  comments: {
    include: { user: true },
    orderBy: { createdAt: 'desc' as const }
  }
};

async function getFollowingIds(userId: string): Promise<Set<string>> {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true }
  });
  return new Set(follows.map(f => f.followingId));
}

export async function getFeed(currentUserId: string, params: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { category, search, page = 1, limit = 10 } = params;
  const skip = (page - 1) * limit;
  const now = new Date();

  const where: Record<string, unknown> = {
    status: 'ACTIVE' as const,
    creatorId: { not: currentUserId },
    date: { gte: now },
    ...(category && { category: { equals: category, mode: 'insensitive' } }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    })
  };

  const [plans, total, trending, followingIds] = await Promise.all([
    prisma.plan.findMany({ where, include: PLAN_INCLUDE, orderBy: { date: 'asc' }, skip, take: limit }),
    prisma.plan.count({ where }),
    prisma.plan.findMany({
      where: { status: 'ACTIVE', creatorId: { not: currentUserId }, date: { gte: now } },
      include: PLAN_INCLUDE,
      orderBy: { matches: { _count: 'desc' } },
      take: 5
    }),
    getFollowingIds(currentUserId)
  ]);

  return {
    plans: plans.map(p => mapPlanToDTO(p, currentUserId, followingIds.has(p.creatorId))),
    trending: trending.map(p => mapPlanToDTO(p, currentUserId, followingIds.has(p.creatorId))),
    total,
    page,
    hasMore: skip + plans.length < total
  };
}

export async function getSwipeFeed(currentUserId: string) {
  const now = new Date();

  const swiped = await prisma.match.findMany({
    where: { userId: currentUserId },
    select: { planId: true }
  });
  const excludeIds = swiped.map(m => m.planId);

  const plans = await prisma.plan.findMany({
    where: {
      status: 'ACTIVE',
      creatorId: { not: currentUserId },
      date: { gte: now },
      ...(excludeIds.length > 0 && { id: { notIn: excludeIds } })
    },
    include: PLAN_INCLUDE,
    orderBy: { date: 'asc' },
    take: 20
  });

  const followingIds = await getFollowingIds(currentUserId);

  return {
    plans: plans
      .filter(p => p.maxPeople - p.matches.length > 0)
      .map(p => mapPlanToDTO(p, currentUserId, followingIds.has(p.creatorId)))
  };
}

export async function getPlanById(planId: string, currentUserId: string) {
  const plan = await prisma.plan.findUniqueOrThrow({ where: { id: planId }, include: PLAN_INCLUDE });
  const isFollowing = !!(await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: currentUserId, followingId: plan.creatorId } }
  }));
  return mapPlanToDTO(plan, currentUserId, isFollowing);
}

export async function createPlan(currentUserId: string, data: {
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  location: string;
  locationDetails?: string;
  maxPeople: number;
  isPrivate?: boolean;
  coverImage?: string;
}) {
  const dateTime = new Date(`${data.date}T${data.time}:00.000Z`);

  const plan = await prisma.plan.create({
    data: {
      title: data.title,
      description: data.description,
      category: data.category,
      date: dateTime,
      location: data.location,
      locationDetails: data.locationDetails,
      maxPeople: data.maxPeople,
      isPrivate: data.isPrivate ?? false,
      coverImage: data.coverImage,
      creatorId: currentUserId,
      chat: {
        create: {
          name: data.title,
          members: { create: { userId: currentUserId } }
        }
      }
    },
    include: PLAN_INCLUDE
  });

  return mapPlanToDTO(plan, currentUserId, false);
}

export async function updatePlan(planId: string, currentUserId: string, data: {
  title?: string;
  description?: string;
  category?: string;
  date?: string;
  time?: string;
  location?: string;
  locationDetails?: string;
  maxPeople?: number;
  isPrivate?: boolean;
  coverImage?: string;
  status?: string;
}) {
  const plan = await prisma.plan.findUniqueOrThrow({ where: { id: planId } });
  if (plan.creatorId !== currentUserId) throw new Error('Unauthorized');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {};
  if (data.title) updateData.title = data.title;
  if (data.description) updateData.description = data.description;
  if (data.category) updateData.category = data.category;
  if (data.location) updateData.location = data.location;
  if (data.locationDetails !== undefined) updateData.locationDetails = data.locationDetails;
  if (data.maxPeople) updateData.maxPeople = data.maxPeople;
  if (data.isPrivate !== undefined) updateData.isPrivate = data.isPrivate;
  if (data.status) updateData.status = data.status;
  if (data.date && data.time) updateData.date = new Date(`${data.date}T${data.time}:00.000Z`);
  if (data.coverImage) updateData.coverImage = await uploadCoverImage(data.coverImage);

  const updated = await prisma.plan.update({ where: { id: planId }, data: updateData, include: PLAN_INCLUDE });
  return mapPlanToDTO(updated, currentUserId, false);
}

export async function deletePlan(planId: string, currentUserId: string) {
  const plan = await prisma.plan.findUniqueOrThrow({ where: { id: planId } });
  if (plan.creatorId !== currentUserId) throw new Error('Forbidden');
  await prisma.plan.update({ where: { id: planId }, data: { status: 'CANCELLED' } });
}

export async function getPlanRequests(planId: string, currentUserId: string) {
  const plan = await prisma.plan.findUniqueOrThrow({ where: { id: planId } });
  if (plan.creatorId !== currentUserId) throw new Error('Forbidden');

  const requests = await prisma.match.findMany({
    where: { planId, status: 'PENDING' },
    include: { user: { select: { id: true, username: true, avatar: true } } },
    orderBy: { createdAt: 'asc' }
  });

  return requests.map(r => ({
    matchId: r.id,
    userId: r.userId,
    username: r.user.username,
    avatar: r.user.avatar || '',
    requestedAt: r.createdAt.toISOString()
  }));
}

const COMMENT_SELECT = {
  id: true,
  text: true,
  createdAt: true,
  user: { select: { id: true, username: true, avatar: true } }
};

export async function getComments(planId: string) {
  return prisma.comment.findMany({
    where: { planId },
    select: COMMENT_SELECT,
    orderBy: { createdAt: 'asc' }
  });
}

export async function addComment(planId: string, userId: string, text: string) {
  return prisma.comment.create({
    data: { planId, userId, text },
    select: COMMENT_SELECT
  });
}

export async function deleteComment(commentId: string, userId: string) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error('NotFound');
  if (comment.userId !== userId) throw new Error('Unauthorized');
  await prisma.comment.delete({ where: { id: commentId } });
}

export { mapPlanToDTO, PLAN_INCLUDE };
