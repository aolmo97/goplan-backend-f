import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { signToken } from '../lib/jwt';

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

export async function register(username: string, email: string, password: string, city?: string) {
  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existing) throw new Error('User already exists');

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { username, email, password: hashed, city, role: 'USER' }
  });

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  return { token, user: await buildProfile(user.id) };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) throw new Error('Invalid credentials');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid credentials');

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  return { token, user: await buildProfile(user.id) };
}

export async function googleAuth(idToken: string) {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  if (!res.ok) throw new Error('Invalid Google token');
  const data = await res.json() as { sub: string; email: string; name: string; picture: string };

  const baseUsername = data.name.replace(/\s+/g, '_').toLowerCase();
  const exists = await prisma.user.findUnique({ where: { username: baseUsername } });
  const username = exists ? `${baseUsername}_${Date.now()}` : baseUsername;

  const user = await prisma.user.upsert({
    where: { email: data.email },
    update: { googleId: data.sub, avatar: data.picture },
    create: { email: data.email, username, googleId: data.sub, avatar: data.picture, role: 'USER' }
  });

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  return { token, user: await buildProfile(user.id) };
}

export async function getMe(userId: string) {
  return buildProfile(userId);
}
