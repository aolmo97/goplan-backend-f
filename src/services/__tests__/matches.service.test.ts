import { prisma } from '../../lib/prisma';
import { swipe } from '../matches.service';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    match: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    plan: { findUniqueOrThrow: jest.fn() },
    chat: { findUnique: jest.fn() },
    chatMember: { upsert: jest.fn() },
    user: { findUniqueOrThrow: jest.fn() },
  }
}));

const db = prisma as jest.Mocked<typeof prisma>;

const mockPlan = (matchCount = 0, maxPeople = 10) => ({
  id: 'plan-1',
  title: 'Test Plan',
  coverImage: null,
  maxPeople,
  matches: Array.from({ length: matchCount }, (_, i) => ({
    id: `m-${i}`,
    userId: `other-user-${i}`
  })),
  creator: { id: 'creator-1', username: 'Carlos' }
});

beforeEach(() => {
  (db.match.findUnique as jest.Mock).mockResolvedValue(null);
  (db.chat.findUnique as jest.Mock).mockResolvedValue(null);
  (db.match.findFirst as jest.Mock).mockResolvedValue(null);
  (db.match.create as jest.Mock).mockResolvedValue({ id: 'match-new' });
});

describe('matches.service — swipe("skip")', () => {
  it('creates Match with status REJECTED', async () => {
    (db.plan.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockPlan());

    const result = await swipe('user-1', 'plan-1', 'skip');

    expect(db.match.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'REJECTED' })
      })
    );
    expect(result.matched).toBe(false);
  });
});

describe('matches.service — swipe("join")', () => {
  it('creates Match with status ACCEPTED', async () => {
    (db.plan.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockPlan(0, 10));

    const result = await swipe('user-1', 'plan-1', 'join');

    expect(db.match.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'ACCEPTED' })
      })
    );
    expect(result.matched).toBe(false);
  });

  it('emits match:new when another user already joined (social match)', async () => {
    (db.plan.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockPlan(1, 10));
    (db.match.findFirst as jest.Mock).mockResolvedValue({
      userId: 'other-user',
      user: { username: 'Elena', avatar: 'https://example.com/elena.jpg' }
    });
    (db.user.findUniqueOrThrow as jest.Mock).mockResolvedValue({
      id: 'user-1',
      username: 'Sophia',
      avatar: null
    });

    const result = await swipe('user-1', 'plan-1', 'join');

    expect(result.matched).toBe(true);
    expect(result.matchData?.partner.name).toBe('Elena');
  });

  it('throws when plan is full', async () => {
    (db.plan.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockPlan(10, 10));

    await expect(swipe('user-1', 'plan-1', 'join')).rejects.toThrow('Plan is full');
    expect(db.match.create).not.toHaveBeenCalled();
  });

  it('throws when user already swiped on this plan', async () => {
    (db.match.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-match' });

    await expect(swipe('user-1', 'plan-1', 'join')).rejects.toThrow('Already swiped on this plan');
    expect(db.match.create).not.toHaveBeenCalled();
  });
});
