// Users Application Service - User Management Use Cases
// Simplified DDD: User CRUD operations

import type { User, UserRole } from '../../domain/entities/index.js';
import type { IUserRepository } from '../../domain/repositories/index.js';
import { NotFoundError, DuplicateError, ForbiddenError } from '../../shared/errors/index.js';
import { config } from '../../shared/config/index.js';
import bcrypt from 'bcrypt';

// ============== CREATE USER ==============

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export class CreateUserUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(
    tenantId: string,
    creatorRole: UserRole,
    input: CreateUserInput
  ): Promise<Omit<User, 'passwordHash'>> {
    // Only owner and manager can create users
    if (creatorRole !== 'owner' && creatorRole !== 'manager') {
      throw new ForbiddenError('Only owner or manager can create users');
    }

    // Check if email already exists in tenant
    const existing = await this.userRepo.findByEmail(tenantId, input.email);
    if (existing) {
      throw new DuplicateError('User', 'email', input.email);
    }

    // Validate role hierarchy
    // Owner cannot be created by anyone except another owner
    if (input.role === 'owner' && creatorRole !== 'owner') {
      throw new ForbiddenError('Only owner can create another owner');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, config.security.bcryptRounds);

    // Create user
    const user = await this.userRepo.create({
      tenantId,
      email: input.email,
      passwordHash,
      name: input.name,
      role: input.role,
      isActive: true,
    });

    // Return without password
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

// ============== GET USERS ==============

export class GetUsersUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(tenantId: string): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.userRepo.findAll(tenantId);
    return users.map(({ passwordHash: _, ...user }) => user);
  }
}

// ============== GET USER BY ID ==============

export class GetUserUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(tenantId: string, userId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepo.findById(tenantId, userId);

    if (!user) {
      throw new NotFoundError(`User with id '${userId}'`);
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

// ============== UPDATE USER ==============

export interface UpdateUserInput {
  email?: string;
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

export class UpdateUserUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(
    tenantId: string,
    requesterRole: UserRole,
    userId: string,
    input: UpdateUserInput
  ): Promise<Omit<User, 'passwordHash'>> {
    // Only owner and manager can update users
    if (requesterRole !== 'owner' && requesterRole !== 'manager') {
      throw new ForbiddenError('Only owner or manager can update users');
    }

    // Get existing user
    const existing = await this.userRepo.findById(tenantId, userId);
    if (!existing) {
      throw new NotFoundError(`User with id '${userId}'`);
    }

    // Check email uniqueness if changing
    if (input.email && input.email !== existing.email) {
      const emailExists = await this.userRepo.findByEmail(tenantId, input.email);
      if (emailExists) {
        throw new DuplicateError('User', 'email', input.email);
      }
    }

    // Role change restrictions
    if (input.role === 'owner' && requesterRole !== 'owner') {
      throw new ForbiddenError('Only owner can change role to owner');
    }

    // Manager cannot demote owner
    if (existing.role === 'owner' && input.role && input.role !== 'owner' && requesterRole !== 'owner') {
      throw new ForbiddenError('Cannot demote owner');
    }

    // Update user
    const updated = await this.userRepo.update(tenantId, userId, {
      email: input.email,
      name: input.name,
      role: input.role,
      isActive: input.isActive,
    });

    const { passwordHash: _, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }
}

// ============== UPDATE OWN PASSWORD ==============

export interface UpdatePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export class UpdatePasswordUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(
    tenantId: string,
    userId: string,
    input: UpdatePasswordInput
  ): Promise<void> {
    const user = await this.userRepo.findById(tenantId, userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new ForbiddenError('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(input.newPassword, config.security.bcryptRounds);

    // Update password
    await this.userRepo.update(tenantId, userId, { passwordHash: newPasswordHash });
  }
}

// ============== DEACTIVATE USER ==============

export class DeactivateUserUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(
    tenantId: string,
    requesterRole: UserRole,
    userId: string
  ): Promise<void> {
    // Only owner and manager can deactivate users
    if (requesterRole !== 'owner' && requesterRole !== 'manager') {
      throw new ForbiddenError('Only owner or manager can deactivate users');
    }

    const user = await this.userRepo.findById(tenantId, userId);
    if (!user) {
      throw new NotFoundError(`User with id '${userId}'`);
    }

    // Cannot deactivate owner
    if (user.role === 'owner') {
      throw new ForbiddenError('Cannot deactivate owner');
    }

    await this.userRepo.deactivate(tenantId, userId);
  }
}

// ============== CHANGE PASSWORD (Admin reset) ==============

export interface AdminResetPasswordInput {
  newPassword: string;
}

export class AdminResetPasswordUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(
    tenantId: string,
    requesterRole: UserRole,
    userId: string,
    input: AdminResetPasswordInput
  ): Promise<void> {
    // Only owner and manager can reset passwords
    if (requesterRole !== 'owner' && requesterRole !== 'manager') {
      throw new ForbiddenError('Only owner or manager can reset passwords');
    }

    const user = await this.userRepo.findById(tenantId, userId);
    if (!user) {
      throw new NotFoundError(`User with id '${userId}'`);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(input.newPassword, config.security.bcryptRounds);

    // Update password
    await this.userRepo.update(tenantId, userId, { passwordHash });
  }
}
