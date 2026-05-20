import { prisma } from '../../lib/prisma';
import { getFeed, getSwipeFeed, createPlan } from '../plans.service';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    plan: {
      findMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    match: { findMany: jest.fn() },
    follow: { findMany: jest.fn() },
  }
}));

const db = prisma as jest.Mocked<typeof prisma>;

const makePlan = (overrides = {}) => ({
  id: 'plan-1',
  title: 'Test Plan',
  description: 'Desc',
  category: 'Culture',
  date: new Date('2026-10-24T18:30:00.000Z'),
  location: 'Madrid',
  locationDetails: null,
  maxPeople: 10,
  isPrivate: false,
  status: 'ACTIVE',
  coverImage: 'https://example.com/img.jpg',
  creatorId: 'user-1',
  creator: { id: 'user-1', username: 'Carlos', avatar: null },
  matches: [],
  comments: [],
  ...overrides
});

beforeEach(() => {
  (db.follow.findMany as jest.Mock).mockResolvedValue([]);
  (db.match.findMany as jest.Mock).mockResolvedValue([]);
  (db.plan.count as jest.Mock).mockResolvedValue(1);
});

describe('plans.service — getFeed', () => {
  it('returns plans in correct DTO format', async () => {
    const plan = makePlan();
    (db.plan.findMany as jest.Mock).mockResolvedValue([plan]);

    const result = await getFeed('user-2', {});

    expect(result.plans).toHaveLength(1);
    const dto = result.plans[0];
    expect(dto.id).toBe('plan-1');
    expect(dto.date).toBe('2026-10-24');
    expect(dto.time).toBe('18:30');
    expect(dto.joinedCount).toBe(0);
    expect(dto.spotsLeft).toBe(10);
    expect(dto.creator.name).toBe('Carlos');
  });

  it('calculates spotsLeft correctly from accepted matches', async () => {
    const matches = [
      { status: 'ACCEPTED', user: { id: 'u2', username: 'Elena', avatar: null } },
      { status: 'ACCEPTED', user: { id: 'u3', username: 'Mark', avatar: null } }
    ];
    const plan = makePlan({ matches, maxPeople: 5 });
    (db.plan.findMany as jest.Mock).mockResolvedValue([plan]);

    const result = await getFeed('user-1', {});
    expect(result.plans[0].joinedCount).toBe(2);
    expect(result.plans[0].spotsLeft).toBe(3);
  });
});

describe('plans.service — getSwipeFeed', () => {
  it('excludes plans already swiped by user', async () => {
    (db.match.findMany as jest.Mock).mockResolvedValue([
      { planId: 'plan-already-swiped' }
    ]);
    (db.plan.findMany as jest.Mock).mockResolvedValue([makePlan()]);

    await getSwipeFeed('user-1');

    expect(db.plan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { notIn: ['plan-already-swiped'] }
        })
      })
    );
  });

  it('returns only plans with spots left', async () => {
    const fullPlan = makePlan({
      maxPeople: 2,
      matches: [
        { status: 'ACCEPTED', user: { username: 'a', avatar: null } },
        { status: 'ACCEPTED', user: { username: 'b', avatar: null } }
      ]
    });
    (db.plan.findMany as jest.Mock).mockResolvedValue([fullPlan]);

    const result = await getSwipeFeed('user-1');
    expect(result.plans).toHaveLength(0);
  });
});

describe('plans.service — createPlan', () => {
  it('creates plan with an associated chat automatically', async () => {
    const plan = makePlan();
    (db.plan.create as jest.Mock).mockResolvedValue(plan);

    await createPlan('user-1', {
      title: 'Test Plan',
      description: 'Desc',
      category: 'Culture',
      date: '2026-10-24',
      time: '18:30',
      location: 'Madrid',
      maxPeople: 10
    });

    expect(db.plan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          chat: { create: expect.objectContaining({ members: expect.anything() }) }
        })
      })
    );
  });
});
