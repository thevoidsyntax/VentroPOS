// Checkout Use Case Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckoutUseCase } from '../../src/application/orders/checkout.js';
import { AppError, BusinessRuleError, NotFoundError } from '../../src/shared/errors/index.js';

// Mock dependencies
const mockOrderRepo = {
  findById: vi.fn(),
  updateStatus: vi.fn(),
  create: vi.fn(),
};

const mockStockRepo = {
  adjust: vi.fn(),
};

const mockIdempotencyRepo = {
  findByKey: vi.fn(),
  create: vi.fn(),
};

const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
};

// Test fixtures
const mockOrder = {
  id: 'order-123',
  tenantId: 'tenant-456',
  orderNumber: 'ORD-20260118-0001',
  status: 'pending' as const,
  subtotal: 50000,
  taxAmount: 5000,
  discountAmount: 0,
  totalAmount: 55000,
  items: [
    {
      id: 'item-1',
      productId: 'product-1',
      productName: 'Coffee',
      quantity: 2,
      unitPrice: 25000,
      totalPrice: 50000,
      modifiers: [],
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CheckoutUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Cash Payment', () => {
    it('should checkout successfully with sufficient cash', async () => {
      mockOrderRepo.findById.mockResolvedValue({ ...mockOrder, status: 'pending' });
      mockOrderRepo.updateStatus.mockResolvedValue({ ...mockOrder, status: 'paid' });
      mockIdempotencyRepo.findByKey.mockResolvedValue(null);
      mockIdempotencyRepo.create.mockResolvedValue({ id: 'idem-1' });
      mockStockRepo.adjust.mockResolvedValue({});

      const useCase = new CheckoutUseCase(
        mockOrderRepo,
        mockStockRepo,
        mockIdempotencyRepo,
        mockLogger as any
      );

      const result = await useCase.execute('tenant-456', 'order-123', {
        method: 'cash',
        cashReceived: 60000,
      });

      expect(result.status).toBe('paid');
      expect(result.changeAmount).toBe(5000); // 60000 - 55000
      expect(mockOrderRepo.updateStatus).toHaveBeenCalledWith('tenant-456', 'order-123', 'paid');
    });

    it('should throw error for insufficient cash', async () => {
      mockOrderRepo.findById.mockResolvedValue({ ...mockOrder, status: 'pending' });
      mockIdempotencyRepo.findByKey.mockResolvedValue(null);

      const useCase = new CheckoutUseCase(
        mockOrderRepo,
        mockStockRepo,
        mockIdempotencyRepo,
        mockLogger as any
      );

      await expect(
        useCase.execute('tenant-456', 'order-123', {
          method: 'cash',
          cashReceived: 30000, // less than total 55000
        })
      ).rejects.toThrow(BusinessRuleError);
    });

    it('should throw error for zero cash received', async () => {
      mockOrderRepo.findById.mockResolvedValue({ ...mockOrder, status: 'pending' });
      mockIdempotencyRepo.findByKey.mockResolvedValue(null);

      const useCase = new CheckoutUseCase(
        mockOrderRepo,
        mockStockRepo,
        mockIdempotencyRepo,
        mockLogger as any
      );

      await expect(
        useCase.execute('tenant-456', 'order-123', {
          method: 'cash',
          cashReceived: 0,
        })
      ).rejects.toThrow(BusinessRuleError);
    });
  });

  describe('Card Payment', () => {
    it('should checkout successfully with card payment', async () => {
      mockOrderRepo.findById.mockResolvedValue({ ...mockOrder, status: 'pending' });
      mockOrderRepo.updateStatus.mockResolvedValue({ ...mockOrder, status: 'paid' });
      mockIdempotencyRepo.findByKey.mockResolvedValue(null);
      mockIdempotencyRepo.create.mockResolvedValue({ id: 'idem-1' });
      mockStockRepo.adjust.mockResolvedValue({});

      const useCase = new CheckoutUseCase(
        mockOrderRepo,
        mockStockRepo,
        mockIdempotencyRepo,
        mockLogger as any
      );

      const result = await useCase.execute('tenant-456', 'order-123', {
        method: 'card',
        cardLast4: '1234',
        cardType: 'visa',
      });

      expect(result.status).toBe('paid');
    });
  });

  describe('Split Payment', () => {
    it('should checkout successfully with split payment', async () => {
      mockOrderRepo.findById.mockResolvedValue({ ...mockOrder, status: 'pending' });
      mockOrderRepo.updateStatus.mockResolvedValue({ ...mockOrder, status: 'paid' });
      mockIdempotencyRepo.findByKey.mockResolvedValue(null);
      mockIdempotencyRepo.create.mockResolvedValue({ id: 'idem-1' });
      mockStockRepo.adjust.mockResolvedValue({});

      const useCase = new CheckoutUseCase(
        mockOrderRepo,
        mockStockRepo,
        mockIdempotencyRepo,
        mockLogger as any
      );

      const result = await useCase.execute('tenant-456', 'order-123', {
        method: 'split',
        payments: [
          { method: 'cash', amount: 30000, cashReceived: 30000 },
          { method: 'card', amount: 25000, cardLast4: '5678', cardType: 'mastercard' },
        ],
      });

      expect(result.status).toBe('paid');
    });

    it('should throw error when split total is less than order amount', async () => {
      mockOrderRepo.findById.mockResolvedValue({ ...mockOrder, status: 'pending' });
      mockIdempotencyRepo.findByKey.mockResolvedValue(null);

      const useCase = new CheckoutUseCase(
        mockOrderRepo,
        mockStockRepo,
        mockIdempotencyRepo,
        mockLogger as any
      );

      await expect(
        useCase.execute('tenant-456', 'order-123', {
          method: 'split',
          payments: [
            { method: 'cash', amount: 20000, cashReceived: 20000 },
            { method: 'card', amount: 20000, cardLast4: '5678', cardType: 'mastercard' },
          ],
        })
      ).rejects.toThrow(BusinessRuleError);
    });
  });

  describe('Edge Cases', () => {
    it('should throw error for already paid order', async () => {
      mockOrderRepo.findById.mockResolvedValue({ ...mockOrder, status: 'paid' });

      const useCase = new CheckoutUseCase(
        mockOrderRepo,
        mockStockRepo,
        mockIdempotencyRepo,
        mockLogger as any
      );

      await expect(
        useCase.execute('tenant-456', 'order-123', {
          method: 'cash',
          cashReceived: 60000,
        })
      ).rejects.toThrow(BusinessRuleError);
    });

    it('should throw error for voided order', async () => {
      mockOrderRepo.findById.mockResolvedValue({ ...mockOrder, status: 'voided' });

      const useCase = new CheckoutUseCase(
        mockOrderRepo,
        mockStockRepo,
        mockIdempotencyRepo,
        mockLogger as any
      );

      await expect(
        useCase.execute('tenant-456', 'order-123', {
          method: 'cash',
          cashReceived: 60000,
        })
      ).rejects.toThrow(BusinessRuleError);
    });

    it('should throw error for non-existent order', async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      const useCase = new CheckoutUseCase(
        mockOrderRepo,
        mockStockRepo,
        mockIdempotencyRepo,
        mockLogger as any
      );

      await expect(
        useCase.execute('tenant-456', 'nonexistent-order', {
          method: 'cash',
          cashReceived: 60000,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should handle idempotency - return cached result', async () => {
      const cachedResult = {
        orderId: 'order-123',
        status: 'paid' as const,
        totalAmount: 55000,
        changeAmount: 5000,
        payments: [{ method: 'cash', amount: 55000, cashReceived: 60000 }],
        processedAt: new Date().toISOString(),
      };
      mockIdempotencyRepo.findByKey.mockResolvedValue({
        id: 'idem-1',
        result: cachedResult,
      });

      const useCase = new CheckoutUseCase(
        mockOrderRepo,
        mockStockRepo,
        mockIdempotencyRepo,
        mockLogger as any
      );

      const result = await useCase.execute('tenant-456', 'order-123', {
        method: 'cash',
        cashReceived: 60000,
        idempotencyKey: 'idem-key-123',
      });

      expect(result).toEqual(cachedResult);
      expect(mockOrderRepo.findById).not.toHaveBeenCalled();
    });

    it('should deduct stock on successful checkout', async () => {
      mockOrderRepo.findById.mockResolvedValue({ ...mockOrder, status: 'pending' });
      mockOrderRepo.updateStatus.mockResolvedValue({ ...mockOrder, status: 'paid' });
      mockIdempotencyRepo.findByKey.mockResolvedValue(null);
      mockIdempotencyRepo.create.mockResolvedValue({ id: 'idem-1' });
      mockStockRepo.adjust.mockResolvedValue({});

      const useCase = new CheckoutUseCase(
        mockOrderRepo,
        mockStockRepo,
        mockIdempotencyRepo,
        mockLogger as any
      );

      await useCase.execute('tenant-456', 'order-123', {
        method: 'cash',
        cashReceived: 60000,
      });

      expect(mockStockRepo.adjust).toHaveBeenCalledWith(
        'tenant-456',
        'product-1',
        expect.objectContaining({ adjustment: -2 }) // negative for deduction
      );
    });
  });
});
