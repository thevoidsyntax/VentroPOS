// Get Users Use Case
import type { User } from '../../domain/entities/index.js';
import type { IUserRepository } from '../../domain/repositories/index.js';

export class GetUsersUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(tenantId: string): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.userRepo.findAll(tenantId);
    return users.map(({ passwordHash: _, ...user }) => user);
  }
}
