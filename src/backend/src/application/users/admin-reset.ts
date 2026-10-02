// Admin Reset Password Use Case
import type { IUserRepository } from '../../domain/repositories/index.js';
import { NotFoundError, ForbiddenError, BusinessRuleError } from '../../shared/errors/index.js';
import { config } from '../../shared/config/index.js';
import bcrypt from 'bcrypt';

const MIN_PASSWORD_LENGTH = 8;

export interface AdminResetPasswordInput {
  newPassword: string;
}

export class AdminResetPasswordUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(
    tenantId: string,
    actorRole: string,
    userId: string,
    input: AdminResetPasswordInput
  ): Promise<void> {
    if (actorRole !== 'owner' && actorRole !== 'manager') {
      throw new ForbiddenError('Only owner or manager can reset passwords');
    }

    const user = await this.userRepo.findById(tenantId, userId);

    if (!user) {
      throw new NotFoundError(`User with id '${userId}'`);
    }

    if (input.newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new BusinessRuleError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }

    const newHash = await bcrypt.hash(input.newPassword, config.security.bcryptRounds);
    await this.userRepo.update(tenantId, userId, { passwordHash: newHash });
  }
}
