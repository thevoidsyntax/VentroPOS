// Change Password Use Case
import type { IUserRepository } from '../../domain/repositories/index.js';
import { NotFoundError, BusinessRuleError } from '../../shared/errors/index.js';
import { config } from '../../shared/config/index.js';
import bcrypt from 'bcrypt';

const MIN_PASSWORD_LENGTH = 8;

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export class ChangePasswordUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(
    tenantId: string,
    userId: string,
    input: ChangePasswordInput
  ): Promise<void> {
    const user = await this.userRepo.findById(tenantId, userId);

    if (!user) {
      throw new NotFoundError(`User with id '${userId}'`);
    }

    const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BusinessRuleError('Current password is incorrect');
    }

    if (input.newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new BusinessRuleError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }

    const newHash = await bcrypt.hash(input.newPassword, config.security.bcryptRounds);
    await this.userRepo.update(tenantId, userId, { passwordHash: newHash });
  }
}
