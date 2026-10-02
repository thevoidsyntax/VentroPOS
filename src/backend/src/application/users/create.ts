// Create User Use Case
import type { User, UserRole } from '../../domain/entities/index.js';
import type { IUserRepository } from '../../domain/repositories/index.js';
import { DuplicateError, ForbiddenError } from '../../shared/errors/index.js';
import { config } from '../../shared/config/index.js';
import bcrypt from 'bcrypt';

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
    if (creatorRole !== 'owner' && creatorRole !== 'manager') {
      throw new ForbiddenError('Only owner or manager can create users');
    }

    const existing = await this.userRepo.findByEmail(tenantId, input.email);
    if (existing) {
      throw new DuplicateError('User', 'email', input.email);
    }

    if (input.role === 'owner' && creatorRole !== 'owner') {
      throw new ForbiddenError('Only owner can create another owner');
    }

    const passwordHash = await bcrypt.hash(input.password, config.security.bcryptRounds);

    const user = await this.userRepo.create({
      tenantId,
      email: input.email,
      passwordHash,
      name: input.name,
      role: input.role,
      isActive: true,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
