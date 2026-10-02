// Deactivate User Use Case
import type { IUserRepository } from '../../domain/repositories/index.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors/index.js';

export class DeactivateUserUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(tenantId: string, userId: string, actorRole: string): Promise<void> {
    if (actorRole !== 'owner' && actorRole !== 'manager') {
      throw new ForbiddenError('Only owner or manager can deactivate users');
    }

    const user = await this.userRepo.findById(tenantId, userId);
    if (!user) {
      throw new NotFoundError(`User with id '${userId}'`);
    }

    await this.userRepo.deactivate(tenantId, userId);
  }
}
