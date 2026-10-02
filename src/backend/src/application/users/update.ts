// Update User Use Case
import type { User, UserRole } from '../../domain/entities/index.js';
import type { IUserRepository } from '../../domain/repositories/index.js';
import { NotFoundError, DuplicateError, ForbiddenError } from '../../shared/errors/index.js';

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
    userId: string,
    actorRole: UserRole,
    input: UpdateUserInput
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepo.findById(tenantId, userId);

    if (!user) {
      throw new NotFoundError(`User with id '${userId}'`);
    }

    if (input.email && input.email !== user.email) {
      const existing = await this.userRepo.findByEmail(tenantId, input.email);
      if (existing && existing.id !== userId) {
        throw new DuplicateError('User', 'email', input.email);
      }
    }

    if (input.role === 'owner' && actorRole !== 'owner') {
      throw new ForbiddenError('Only owner can change user role to owner');
    }

    const updated = await this.userRepo.update(tenantId, userId, input);
    const { passwordHash: _, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }
}
