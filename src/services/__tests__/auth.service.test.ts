import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { register, login } from '../auth.service';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    plan: { count: jest.fn() },
    match: { count: jest.fn() },
  }
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn()
}));

jest.mock('../../lib/jwt', () => ({
  signToken: jest.fn().mockReturnValue('mock_token')
}));

const db = prisma as jest.Mocked<typeof prisma>;
const mockUser = {
  id: 'user-1',
  username: 'testuser',
  email: 'test@goplan.app',
  password: 'hashed_password',
  role: 'USER' as const,
  avatar: null,
  bio: null,
  city: 'Madrid',
  googleId: null,
  interests: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

beforeEach(() => {
  (db.plan.count as jest.Mock).mockResolvedValue(3);
  (db.match.count as jest.Mock).mockResolvedValue(2);
});

describe('auth.service — register', () => {
  it('creates user with hashed password', async () => {
    (db.user.findFirst as jest.Mock).mockResolvedValue(null);
    (db.user.create as jest.Mock).mockResolvedValue(mockUser);
    (db.user.findUniqueOrThrow as jest.Mock) = jest.fn().mockResolvedValue(mockUser);

    const result = await register('testuser', 'test@goplan.app', 'password123', 'Madrid');

    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
    expect(db.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ password: 'hashed_password', role: 'USER' })
      })
    );
    expect(result.token).toBe('mock_token');
    expect(result.user.name).toBe('testuser');
  });

  it('throws if user already exists', async () => {
    (db.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
    await expect(register('testuser', 'test@goplan.app', 'pass', 'Madrid'))
      .rejects.toThrow('User already exists');
  });
});

describe('auth.service — login', () => {
  beforeEach(() => {
    (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (db.user.findUniqueOrThrow as jest.Mock) = jest.fn().mockResolvedValue(mockUser);
  });

  it('returns valid token on correct credentials', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    const result = await login('test@goplan.app', 'password123');
    expect(result.token).toBe('mock_token');
    expect(result.user.name).toBe('testuser');
  });

  it('throws on wrong password', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(login('test@goplan.app', 'wrongpass'))
      .rejects.toThrow('Invalid credentials');
  });

  it('throws if user not found', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(login('nobody@goplan.app', 'pass'))
      .rejects.toThrow('Invalid credentials');
  });
});
