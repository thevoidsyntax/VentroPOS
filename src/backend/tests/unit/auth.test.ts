// Auth Use Case Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginUseCase, RegisterUseCase, RefreshTokenUseCase, GetCurrentUserUseCase } from '../../src/application/auth/index.js';
import { AppError } from '../../src/shared/errors/index.js';

// Mock dependencies
const mockUserRepo = {
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

const mockTenantRepo = {
  create: vi.fn(),
  findById: vi.fn(),
};

const mockBcryptHash = vi.fn().mockResolvedValue('hashed_password');
const mockBcryptCompare = vi.fn();

const mockJwtSign = vi.fn().mockReturnValue({ accessToken: 'mock_token', refreshToken: 'mock_refresh', expiresIn: '15m' });
const mockJwtVerify = vi.fn();

// Test fixtures
const mockUser = {
  id: 'user-123',
  tenantId: 'tenant-456',
  email: 'test@example.com',
  passwordHash: 'hashed_password',
  name: 'Test User',
  role: 'owner' as const,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('LoginUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should login successfully with correct credentials', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(true);
    mockJwtSign.mockReturnValue({
      accessToken: 'access_token_here',
      refreshToken: 'refresh_token_here',
      expiresIn: '15m',
    });

    const useCase = new LoginUseCase(
      mockUserRepo,
      mockBcryptCompare,
      mockJwtSign
    );

    const result = await useCase.execute({ email: 'test@example.com', password: 'correct_password' });

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(mockBcryptCompare).toHaveBeenCalledWith('correct_password', 'hashed_password');
  });

  it('should throw error for non-existent email', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);

    const useCase = new LoginUseCase(
      mockUserRepo,
      mockBcryptCompare,
      mockJwtSign
    );

    await expect(
      useCase.execute({ email: 'nonexistent@example.com', password: 'password' })
    ).rejects.toThrow(AppError);
  });

  it('should throw error for wrong password', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(false);

    const useCase = new LoginUseCase(
      mockUserRepo,
      mockBcryptCompare,
      mockJwtSign
    );

    await expect(
      useCase.execute({ email: 'test@example.com', password: 'wrong_password' })
    ).rejects.toThrow(AppError);
  });

  it('should throw error for inactive user', async () => {
    mockUserRepo.findByEmail.mockResolvedValue({ ...mockUser, isActive: false });

    const useCase = new LoginUseCase(
      mockUserRepo,
      mockBcryptCompare,
      mockJwtSign
    );

    await expect(
      useCase.execute({ email: 'test@example.com', password: 'password' })
    ).rejects.toThrow(AppError);
  });
});

describe('RegisterUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register new user successfully', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockTenantRepo.create.mockResolvedValue({
      id: 'tenant-new',
      name: 'New Tenant',
    });
    mockUserRepo.create.mockResolvedValue({
      id: 'user-new',
      tenantId: 'tenant-new',
      email: 'new@example.com',
      name: 'New User',
      role: 'owner',
      isActive: true,
    });
    mockBcryptHash.mockResolvedValue('hashed_password');

    const useCase = new RegisterUseCase(
      mockTenantRepo,
      mockUserRepo,
      mockBcryptHash
    );

    const result = await useCase.execute({
      tenantName: 'New Tenant',
      email: 'new@example.com',
      password: 'secure_password',
      ownerName: 'New User',
    });

    expect(result.user.email).toBe('new@example.com');
    expect(mockBcryptHash).toHaveBeenCalledWith('secure_password', 12);
  });

  it('should throw error for duplicate email', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(mockUser);

    const useCase = new RegisterUseCase(
      mockTenantRepo,
      mockUserRepo,
      mockBcryptHash
    );

    await expect(
      useCase.execute({
        tenantName: 'New Tenant',
        email: 'test@example.com',
        password: 'secure_password',
        ownerName: 'New User',
      })
    ).rejects.toThrow(AppError);
  });

  it('should throw error for weak password', async () => {
    const useCase = new RegisterUseCase(
      mockTenantRepo,
      mockUserRepo,
      mockBcryptHash
    );

    await expect(
      useCase.execute({
        tenantName: 'New Tenant',
        email: 'new@example.com',
        password: '123', // too short
        ownerName: 'New User',
      })
    ).rejects.toThrow();
  });
});

describe('RefreshTokenUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should refresh token successfully with valid refresh token', async () => {
    mockJwtVerify.mockResolvedValue({
      sub: 'user-123',
      tenantId: 'tenant-456',
      email: 'test@example.com',
      role: 'owner',
      type: 'refresh',
    });
    mockUserRepo.findById.mockResolvedValue(mockUser);
    mockJwtSign.mockReturnValue({
      accessToken: 'new_access_token',
      refreshToken: 'new_refresh_token',
      expiresIn: '15m',
    });

    const useCase = new RefreshTokenUseCase(
      mockJwtVerify,
      mockJwtSign,
      mockUserRepo
    );

    const result = await useCase.execute({ refreshToken: 'valid_refresh_token' });

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('should throw error for access token (wrong type)', async () => {
    mockJwtVerify.mockResolvedValue({
      sub: 'user-123',
      tenantId: 'tenant-456',
      email: 'test@example.com',
      role: 'owner',
      type: 'access', // wrong type!
    });

    const useCase = new RefreshTokenUseCase(
      mockJwtVerify,
      mockJwtSign,
      mockUserRepo
    );

    await expect(
      useCase.execute({ refreshToken: 'access_token_used_as_refresh' })
    ).rejects.toThrow(AppError);
  });

  it('should throw error for expired token', async () => {
    mockJwtVerify.mockRejectedValue(new Error('Token expired'));

    const useCase = new RefreshTokenUseCase(
      mockJwtVerify,
      mockJwtSign,
      mockUserRepo
    );

    await expect(
      useCase.execute({ refreshToken: 'expired_token' })
    ).rejects.toThrow(AppError);
  });

  it('should throw error for invalid token', async () => {
    mockJwtVerify.mockRejectedValue(new Error('Invalid token'));

    const useCase = new RefreshTokenUseCase(
      mockJwtVerify,
      mockJwtSign,
      mockUserRepo
    );

    await expect(
      useCase.execute({ refreshToken: 'invalid_token' })
    ).rejects.toThrow(AppError);
  });
});

describe('GetCurrentUserUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return user data successfully', async () => {
    mockUserRepo.findById.mockResolvedValue(mockUser);

    const useCase = new GetCurrentUserUseCase(mockUserRepo);
    const result = await useCase.execute('tenant-456', 'user-123');

    expect(result.id).toBe('user-123');
    expect(result.email).toBe('test@example.com');
    expect(result.passwordHash).toBeUndefined(); // should not expose hash
  });

  it('should throw error for non-existent user', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    const useCase = new GetCurrentUserUseCase(mockUserRepo);

    await expect(
      useCase.execute('tenant-456', 'nonexistent-user')
    ).rejects.toThrow(AppError);
  });
});
