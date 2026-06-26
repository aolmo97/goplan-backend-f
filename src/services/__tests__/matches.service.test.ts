import { prisma } from '../../lib/prisma';
import { swipe } from '../matches.service';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    match: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    plan: { findUniqueOrThrow: jest.fn() },
    chat: { findUnique: jest.fn() },
    chatMember: { upsert: jest.fn() },
    user: { findUniqueOrThrow: jest.fn() },
  }
}));

const db = prisma as jest.Mocked<typeof prisma>;

const mockPlan = (acceptedCount = 0, maxPeople = 10) => ({
  id: 'plan-1',
  title: 'Test Plan',
  coverImage: null,
  maxPeople,
  creatorId: 'creator-1',
  matches: Array.from({ length: acceptedCount }, (_, i) => ({
    id: `m-${i}`,
    userId: `other-user-${i}`
  }))
});

beforeEach(() => {
  jest.clearAllMocks();
  (db.match.findUnique as jest.Mock).mockResolvedValue(null);
  (db.match.findFirst as jest.Mock).mockResolvedValue(null);
  (db.match.create as jest.Mock).mockResolvedValue({ id: 'match-new' });
  (db.match.update as jest.Mock).mockResolvedValue({ id: 'match-new', status: 'ACCEPTED' });
  (db.chat.findUnique as jest.Mock).mockResolvedValue(null);
});

// ---------------------------------------------------------------------------
// skip action
// ---------------------------------------------------------------------------
describe('matches.service — swipe("skip")', () => {
  it('creates Match with status REJECTED', async () => {
    const result = await swipe('user-1', 'plan-1', 'skip');

    expect(db.match.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'REJECTED' })
      })
    );
    expect(result.matched).toBe(false);
    // Should NOT query the plan on a skip
    expect(db.plan.findUniqueOrThrow).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// join action — no mutual match
// ---------------------------------------------------------------------------
describe('matches.service — swipe("join"), no mutual match', () => {
  beforeEach(() => {
    (db.plan.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockPlan(0, 10));
  });

  it('creates Match with status PENDING', async () => {
    const result = await swipe('user-1', 'plan-1', 'join');

    expect(db.match.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PENDING' })
      })
    );
    expect(result.matched).toBe(false);
  });

  it('does NOT upgrade or emit when no mutual match exists', async () => {
    await swipe('user-1', 'plan-1', 'join');

    expect(db.match.update).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// join action — mutual match found
// ---------------------------------------------------------------------------
describe('matches.service — swipe("join"), mutual match', () => {
  beforeEach(() => {
    (db.plan.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockPlan(0, 10));
    (db.match.findFirst as jest.Mock).mockResolvedValue({
      id: 'mutual-match-id',
      userId: 'creator-1',
      plan: { id: 'plan-creator', title: 'Creator Plan', coverImage: null }
    });
    (db.user.findUniqueOrThrow as jest.Mock).mockResolvedValue({
      id: 'user-1',
      username: 'Sophia',
      avatar: null
    });
  });

  it('upgrades both matches to ACCEPTED', async () => {
    await swipe('user-1', 'plan-1', 'join');

    expect(db.match.update).toHaveBeenCalledTimes(2);
    expect(db.match.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'ACCEPTED' } })
    );
  });

  it('returns matched: true with planId and planName', async () => {
    const result = await swipe('user-1', 'plan-1', 'join');

    expect(result.matched).toBe(true);
    expect(result.matchData?.planId).toBe('plan-1');
    expect(result.matchData?.planName).toBe('Test Plan');
  });
});

// ---------------------------------------------------------------------------
// edge cases
// ---------------------------------------------------------------------------
describe('matches.service — edge cases', () => {
  it('throws "Plan is full" when accepted matches reach maxPeople', async () => {
    (db.plan.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockPlan(10, 10));

    await expect(swipe('user-1', 'plan-1', 'join')).rejects.toThrow('Plan is full');
    expect(db.match.create).not.toHaveBeenCalled();
  });

  it('throws "Already swiped" when a match record already exists', async () => {
    (db.match.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-match' });

    await expect(swipe('user-1', 'plan-1', 'join')).rejects.toThrow('Already swiped on this plan');
    expect(db.match.create).not.toHaveBeenCalled();
  });
});
