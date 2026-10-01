// Auth Application Service - Login/Register/Token Use Cases
/**
 * @module application/auth
 * @description Authentication and authorization use cases
 */

import type { User } from '../../domain/entities/index.js';
import type { IUserRepository, ITenantRepository } from '../../domain/repositories/index.js';
import { InvalidCredentialsError, DuplicateError, UnauthorizedError, TokenExpiredError, ValidationError } from '../../shared/errors/index.js';
import { validatePasswordStrength, isCommonPassword } from '../../shared/utils/password.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string; // JWT time string format (e.g., "15m", "7d")
}

export interface JwtPayload {
  sub: string;       // userId
  tenantId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

// Use Case: Register Tenant
export interface RegisterInput {
  tenantName: string;
  email: string;
  password: string;
  ownerName: string;
}

/**
 * Register a new tenant with owner user
 */
export class RegisterUseCase {
  constructor(
    private tenantRepo: ITenantRepository,
    private userRepo: IUserRepository,
    private hashPassword: (password: string) => Promise<string>
  ) {}

  async execute(input: RegisterInput): Promise<{ tenantId: string; user: Omit<User, 'passwordHash'> }> {
    // Validate password strength
    const passwordValidation = validatePasswordStrength(input.password);
    if (!passwordValidation.valid) {
      throw new ValidationError('Password does not meet requirements', {
        errors: passwordValidation.errors,
      });
    }

    // Check if password is common
    if (isCommonPassword(input.password)) {
      throw new ValidationError('Password is too common, please choose a stronger password');
    }

    // Check if email already exists (globally)
    const existingUser = await this.userRepo.findByEmail('system', input.email);
    if (existingUser) {
      throw new DuplicateError('User', 'email', input.email);
    }

    // Create tenant
    const tenant = await this.tenantRepo.create({
      name: input.tenantName,
      settings: {},
      plan: 'starter',
      isActive: true,
    });

    // Create owner user
    const passwordHash = await this.hashPassword(input.password);
    const user = await this.userRepo.create({
      tenantId: tenant.id,
      email: input.email,
      passwordHash,
      name: input.ownerName,
      role: 'owner',
      isActive: true,
    });

    return {
      tenantId: tenant.id,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}

// Use Case: Login
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Authenticate user and generate tokens
 */
export class LoginUseCase {
  constructor(
    private userRepo: IUserRepository,
    private comparePassword: (password: string, hash: string) => Promise<boolean>,
    private generateTokens: (payload: Omit<JwtPayload, 'type'>) => Promise<AuthTokens>
  ) {}

  async execute(input: LoginInput): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    // Find user by email (need to search across all tenants)
    const user = await this.userRepo.findByEmail('system', input.email);

    if (!user || !user.isActive) {
      throw new InvalidCredentialsError();
    }

    // Verify password
    const isValid = await this.comparePassword(input.password, user.passwordHash);
    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    // Update last login
    await this.userRepo.update(user.tenantId, user.id, { lastLoginAt: new Date() });

    // Generate tokens
    const tokens = await this.generateTokens({
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }
}

// Use Case: Refresh Token
export interface RefreshTokenInput {
  refreshToken: string;
}

export class RefreshTokenUseCase {
  constructor(
    private verifyRefreshToken: (token: string) => Promise<JwtPayload>,
    private generateTokens: (payload: Omit<JwtPayload, 'type'>) => Promise<AuthTokens>,
    private userRepo: IUserRepository
  ) {}

  async execute(input: RefreshTokenInput): Promise<AuthTokens> {
    const payload = await this.verifyRefreshToken(input.refreshToken);

    if (payload.type !== 'refresh') {
      throw new TokenExpiredError();
    }

    // Verify user still exists and is active
    const user = await this.userRepo.findById(payload.tenantId, payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User no longer active');
    }

    return this.generateTokens({
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    });
  }
}

// Use Case: Get Current User
export class GetCurrentUserUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(tenantId: string, userId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepo.findById(tenantId, userId);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
