// Get User Use Case
import type { User } from '../../domain/entities/index.js';
import type { IUserRepository } from '../../domain/repositories/index.js';
import { NotFoundError } from '../../shared/errors/index.js';

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
