// Unit Tests for Modifier Use Cases
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CreateModifierGroupUseCase,
  GetModifierGroupsUseCase,
  UpdateModifierGroupUseCase,
  DeleteModifierGroupUseCase,
  CreateModifierUseCase,
  GetModifiersUseCase,
  UpdateModifierUseCase,
  DeleteModifierUseCase,
} from '../../src/application/modifiers/index.js';
import type { IModifierGroupRepository, IModifierRepository } from '../../src/domain/repositories/index.js';
import type { ModifierGroup, Modifier } from '../../src/domain/entities/index.js';
import { NotFoundError } from '../../src/shared/errors/index.js';

describe('ModifierGroupUseCases', () => {
  let mockModifierGroupRepo: IModifierGroupRepository;
  let mockModifierRepo: IModifierRepository;
  let createUseCase: CreateModifierGroupUseCase;
  let getAllUseCase: GetModifierGroupsUseCase;
  let getUseCase: GetModifierGroupUseCase;
  let updateUseCase: UpdateModifierGroupUseCase;
  let deleteUseCase: DeleteModifierGroupUseCase;

  const mockModifierGroup: ModifierGroup = {
    id: 'group-1',
    tenantId: 'tenant-1',
    name: 'Coffee Size',
    type: 'size',
    isRequired: true,
    minSelections: 1,
    maxSelections: 1,
    modifiers: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockModifierGroupRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    mockModifierRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findByGroup: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    createUseCase = new CreateModifierGroupUseCase(mockModifierGroupRepo);
    getAllUseCase = new GetModifierGroupsUseCase(mockModifierGroupRepo);
    getUseCase = new GetModifierGroupUseCase(mockModifierGroupRepo);
    updateUseCase = new UpdateModifierGroupUseCase(mockModifierGroupRepo);
    deleteUseCase = new DeleteModifierGroupUseCase(mockModifierGroupRepo);
  });

  describe('CreateModifierGroupUseCase', () => {
    it('should create modifier group with default values', async () => {
      vi.mocked(mockModifierGroupRepo.create).mockResolvedValue(mockModifierGroup);

      const result = await createUseCase.execute('tenant-1', {
        name: 'Coffee Size',
        type: 'size',
      });

      expect(result.name).toBe('Coffee Size');
      expect(mockModifierGroupRepo.create).toHaveBeenCalledWith('tenant-1', {
        name: 'Coffee Size',
        type: 'size',
        isRequired: false,
        minSelections: 0,
        maxSelections: 1,
        modifiers: [],
      });
    });

    it('should create modifier group with custom selections', async () => {
      vi.mocked(mockModifierGroupRepo.create).mockResolvedValue({
        ...mockModifierGroup,
        minSelections: 1,
        maxSelections: 3,
      });

      const result = await createUseCase.execute('tenant-1', {
        name: 'Toppings',
        type: 'topping',
        isRequired: false,
        minSelections: 0,
        maxSelections: 5,
      });

      expect(result.minSelections).toBe(0);
      expect(result.maxSelections).toBe(5);
    });
  });

  describe('GetModifierGroupUseCase', () => {
    it('should return modifier group by id', async () => {
      vi.mocked(mockModifierGroupRepo.findById).mockResolvedValue(mockModifierGroup);

      const result = await getUseCase.execute('tenant-1', 'group-1');

      expect(result.id).toBe('group-1');
    });

    it('should throw NotFoundError for non-existent group', async () => {
      vi.mocked(mockModifierGroupRepo.findById).mockResolvedValue(null);

      await expect(
        getUseCase.execute('tenant-1', 'invalid-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('UpdateModifierGroupUseCase', () => {
    it('should update modifier group', async () => {
      vi.mocked(mockModifierGroupRepo.findById).mockResolvedValue(mockModifierGroup);
      vi.mocked(mockModifierGroupRepo.update).mockResolvedValue({
        ...mockModifierGroup,
        name: 'Updated Name',
      });

      const result = await updateUseCase.execute('tenant-1', 'group-1', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
    });
  });

  describe('DeleteModifierGroupUseCase', () => {
    it('should delete modifier group', async () => {
      vi.mocked(mockModifierGroupRepo.findById).mockResolvedValue(mockModifierGroup);
      vi.mocked(mockModifierGroupRepo.delete).mockResolvedValue(undefined);

      await deleteUseCase.execute('tenant-1', 'group-1');

      expect(mockModifierGroupRepo.delete).toHaveBeenCalledWith('tenant-1', 'group-1');
    });
  });
});

describe('ModifierUseCases', () => {
  let mockModifierGroupRepo: IModifierGroupRepository;
  let mockModifierRepo: IModifierRepository;
  let createUseCase: CreateModifierUseCase;
  let getUseCase: GetModifiersUseCase;
  let updateUseCase: UpdateModifierUseCase;
  let deleteUseCase: DeleteModifierUseCase;

  const mockModifier: Modifier = {
    id: 'mod-1',
    groupId: 'group-1',
    tenantId: 'tenant-1',
    name: 'Large',
    priceAdjustment: 5000,
    isActive: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockModifierGroupRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    mockModifierRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findByGroup: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    createUseCase = new CreateModifierUseCase(mockModifierGroupRepo, mockModifierRepo);
    getUseCase = new GetModifiersUseCase(mockModifierRepo);
    updateUseCase = new UpdateModifierUseCase(mockModifierRepo);
    deleteUseCase = new DeleteModifierUseCase(mockModifierRepo);
  });

  describe('CreateModifierUseCase', () => {
    it('should create modifier for a group', async () => {
      vi.mocked(mockModifierGroupRepo.findById).mockResolvedValue({
        id: 'group-1',
        tenantId: 'tenant-1',
        name: 'Size',
        type: 'size',
        isRequired: true,
        minSelections: 1,
        maxSelections: 1,
        modifiers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(mockModifierRepo.create).mockResolvedValue(mockModifier);

      const result = await createUseCase.execute('tenant-1', 'group-1', {
        name: 'Large',
        priceAdjustment: 5000,
      });

      expect(result.name).toBe('Large');
      expect(result.priceAdjustment).toBe(5000);
    });

    it('should throw NotFoundError for non-existent group', async () => {
      vi.mocked(mockModifierGroupRepo.findById).mockResolvedValue(null);

      await expect(
        createUseCase.execute('tenant-1', 'invalid-group', {
          name: 'Large',
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('UpdateModifierUseCase', () => {
    it('should update modifier', async () => {
      vi.mocked(mockModifierRepo.findById).mockResolvedValue(mockModifier);
      vi.mocked(mockModifierRepo.update).mockResolvedValue({
        ...mockModifier,
        name: 'Extra Large',
        priceAdjustment: 8000,
      });

      const result = await updateUseCase.execute('tenant-1', 'mod-1', {
        name: 'Extra Large',
        priceAdjustment: 8000,
      });

      expect(result.name).toBe('Extra Large');
      expect(result.priceAdjustment).toBe(8000);
    });
  });

  describe('DeleteModifierUseCase', () => {
    it('should delete modifier', async () => {
      vi.mocked(mockModifierRepo.findById).mockResolvedValue(mockModifier);
      vi.mocked(mockModifierRepo.delete).mockResolvedValue(undefined);

      await deleteUseCase.execute('tenant-1', 'mod-1');

      expect(mockModifierRepo.delete).toHaveBeenCalledWith('tenant-1', 'mod-1');
    });
  });
});

describe('ModifierGroup Types', () => {
  it('should have valid modifier group types', () => {
    const validTypes: ModifierGroup['type'][] = ['size', 'extras', 'topping', 'custom'];

    expect(validTypes).toContain('size');
    expect(validTypes).toContain('extras');
    expect(validTypes).toContain('topping');
    expect(validTypes).toContain('custom');
  });
});
