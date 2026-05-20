import { prisma } from '../lib/prisma';

function formatEventDate(date: Date): string {
  const d = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const t = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${d}, ${t}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEventToDTO(event: any, userId: string) {
  const attendance = event.attendances?.find((a: any) => a.userId === userId);
  const goingCount = event.attendances?.filter((a: any) => a.status === 'going').length || 0;
  const interestedCount = event.attendances?.filter((a: any) => a.status === 'interested').length || 0;

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    coverImage: event.imageUrl || '',
    organizerLogo: event.organizerLogo || '',
    date: formatEventDate(event.date),
    location: event.location,
    price: event.price || 'FREE',
    company: {
      name: event.company?.username || '',
      logo: event.company?.avatar || ''
    },
    goingCount,
    interestedCount,
    userStatus: (attendance?.status || 'none') as 'none' | 'interested' | 'going'
  };
}

const EVENT_INCLUDE = { company: true, attendances: true };

export async function getEvents(userId: string, params: { page?: number; limit?: number }) {
  const { page = 1, limit = 10 } = params;
  const now = new Date();

  const allEvents = await prisma.event.findMany({
    where: { date: { gte: now } },
    include: EVENT_INCLUDE,
    orderBy: { date: 'asc' }
  });

  const scored = [...allEvents].sort((a, b) => {
    const aScore = (a.isPromoted ? 10 : 0) + a.attendances.length;
    const bScore = (b.isPromoted ? 10 : 0) + b.attendances.length;
    return bScore - aScore;
  });

  const skip = (page - 1) * limit;
  const nearby = allEvents.slice(skip, skip + limit);

  return {
    trending: scored.slice(0, 5).map(e => mapEventToDTO(e, userId)),
    nearby: nearby.map(e => mapEventToDTO(e, userId)),
    total: allEvents.length,
    page,
    hasMore: skip + nearby.length < allEvents.length
  };
}

export async function getEventById(eventId: string, userId: string) {
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId }, include: EVENT_INCLUDE });
  return mapEventToDTO(event, userId);
}

export async function createEvent(userId: string, data: {
  title: string;
  description: string;
  location: string;
  date: string;
  capacity?: number;
  imageUrl?: string;
  price?: string;
}) {
  const event = await prisma.event.create({
    data: { ...data, date: new Date(data.date), companyId: userId },
    include: EVENT_INCLUDE
  });
  return mapEventToDTO(event, userId);
}

export async function attendEvent(eventId: string, userId: string, status: 'interested' | 'going' | 'none') {
  if (status === 'none') {
    await prisma.eventAttendance.deleteMany({ where: { eventId, userId } });
  } else {
    await prisma.eventAttendance.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, status },
      update: { status }
    });
  }

  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId }, include: EVENT_INCLUDE });
  return {
    goingCount: event.attendances.filter(a => a.status === 'going').length,
    interestedCount: event.attendances.filter(a => a.status === 'interested').length,
    userStatus: status
  };
}
