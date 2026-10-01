// Modifiers Application Service - CRUD Use Cases
// For size options, extras, toppings

import type { ModifierGroup, Modifier } from '../../domain/entities/index.js';
import type { IModifierGroupRepository, IModifierRepository } from '../../domain/repositories/index.js';
import { NotFoundError } from '../../shared/errors/index.js';

// ============== MODIFIER GROUP USE CASES ==============

export interface CreateModifierGroupInput {
  name: string;
  type: 'size' | 'extras' | 'topping' | 'custom';
  isRequired?: boolean;
  minSelections?: number;
  maxSelections?: number;
}

export class CreateModifierGroupUseCase {
  constructor(private modifierGroupRepo: IModifierGroupRepository) {}

  async execute(tenantId: string, input: CreateModifierGroupInput): Promise<ModifierGroup> {
    return this.modifierGroupRepo.create(tenantId, {
      name: input.name,
      type: input.type,
      isRequired: input.isRequired ?? false,
      minSelections: input.minSelections ?? 0,
      maxSelections: input.maxSelections ?? 1,
      modifiers: [],
    });
  }
}

export class GetModifierGroupsUseCase {
  constructor(private modifierGroupRepo: IModifierGroupRepository) {}

  async execute(tenantId: string): Promise<ModifierGroup[]> {
    return this.modifierGroupRepo.findAll(tenantId);
  }
}

export class GetModifierGroupUseCase {
  constructor(private modifierGroupRepo: IModifierGroupRepository) {}

  async execute(tenantId: string, groupId: string): Promise<ModifierGroup> {
    const group = await this.modifierGroupRepo.findById(tenantId, groupId);

    if (!group) {
      throw new NotFoundError(`Modifier group with id '${groupId}'`);
    }

    return group;
  }
}

export interface UpdateModifierGroupInput {
  name?: string;
  type?: 'size' | 'extras' | 'topping' | 'custom';
  isRequired?: boolean;
  minSelections?: number;
  maxSelections?: number;
}

export class UpdateModifierGroupUseCase {
  constructor(private modifierGroupRepo: IModifierGroupRepository) {}

  async execute(tenantId: string, groupId: string, input: UpdateModifierGroupInput): Promise<ModifierGroup> {
    const group = await this.modifierGroupRepo.findById(tenantId, groupId);

    if (!group) {
      throw new NotFoundError(`Modifier group with id '${groupId}'`);
    }

    return this.modifierGroupRepo.update(tenantId, groupId, input);
  }
}

export class DeleteModifierGroupUseCase {
  constructor(private modifierGroupRepo: IModifierGroupRepository) {}

  async execute(tenantId: string, groupId: string): Promise<void> {
    const group = await this.modifierGroupRepo.findById(tenantId, groupId);

    if (!group) {
      throw new NotFoundError(`Modifier group with id '${groupId}'`);
    }

    await this.modifierGroupRepo.delete(tenantId, groupId);
  }
}

// ============== MODIFIER USE CASES ==============

export interface CreateModifierInput {
  name: string;
  priceAdjustment?: number;
  sortOrder?: number;
}

export class CreateModifierUseCase {
  constructor(
    private modifierGroupRepo: IModifierGroupRepository,
    private modifierRepo: IModifierRepository
  ) {}

  async execute(tenantId: string, groupId: string, input: CreateModifierInput): Promise<Modifier> {
    const group = await this.modifierGroupRepo.findById(tenantId, groupId);

    if (!group) {
      throw new NotFoundError(`Modifier group with id '${groupId}'`);
    }

    return this.modifierRepo.create(tenantId, groupId, {
      name: input.name,
      priceAdjustment: input.priceAdjustment ?? 0,
      isActive: true,
      sortOrder: input.sortOrder ?? 0,
    });
  }
}

export class GetModifiersUseCase {
  constructor(private modifierRepo: IModifierRepository) {}

  async execute(tenantId: string, groupId: string): Promise<Modifier[]> {
    return this.modifierRepo.findByGroup(tenantId, groupId);
  }
}

export interface UpdateModifierInput {
  name?: string;
  priceAdjustment?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export class UpdateModifierUseCase {
  constructor(private modifierRepo: IModifierRepository) {}

  async execute(tenantId: string, modifierId: string, input: UpdateModifierInput): Promise<Modifier> {
    const modifier = await this.modifierRepo.findById(tenantId, modifierId);

    if (!modifier) {
      throw new NotFoundError(`Modifier with id '${modifierId}'`);
    }

    return this.modifierRepo.update(tenantId, modifierId, input);
  }
}

export class DeleteModifierUseCase {
  constructor(private modifierRepo: IModifierRepository) {}

  async execute(tenantId: string, modifierId: string): Promise<void> {
    const modifier = await this.modifierRepo.findById(tenantId, modifierId);

    if (!modifier) {
      throw new NotFoundError(`Modifier with id '${modifierId}'`);
    }

    await this.modifierRepo.delete(tenantId, modifierId);
  }
}
