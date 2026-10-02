// Create Order Use Case
import type { Order, OrderItem } from '../../domain/entities/index.js';
import type {
  IOrderRepository,
  IProductRepository,
  ITableRepository,
} from '../../domain/repositories/index.js';
import { NotFoundError, BusinessRuleError } from '../../shared/errors/index.js';
import { config } from '../../shared/config/index.js';

const TAX_RATE = config.tax.rate;

export interface CreateOrderInput {
  tableId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    modifiers?: Array<{ modifierId: string; name: string; priceAdjustment: number }>;
    notes?: string;
  }>;
  customerName?: string;
  notes?: string;
  applyDiscount?: { type: 'percentage' | 'fixed'; value: number };
}

export class CreateOrderUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
    private tableRepo: ITableRepository
  ) {}

  async execute(tenantId: string, userId: string, input: CreateOrderInput): Promise<Order> {
    if (input.tableId) {
      const table = await this.tableRepo.findById(tenantId, input.tableId);
      if (!table) throw new NotFoundError(`Table '${input.tableId}'`);
    }

    const ids = input.items.map(i => i.productId);
    const products = await this.productRepo.findByIds(tenantId, ids);
    const prodMap = new Map(products.map(p => [p.id, p]));

    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const item of input.items) {
      const p = prodMap.get(item.productId);
      if (!p) throw new NotFoundError(`Product '${item.productId}'`);
      if (!p.isActive) throw new BusinessRuleError(`Product '${p.name}' is inactive`);
      if (p.stockQuantity < item.quantity) {
        throw new BusinessRuleError(`Insufficient stock for '${p.name}'`);
      }

      const modTotal = item.modifiers?.reduce((s, m) => s + m.priceAdjustment, 0) ?? 0;
      const unitPrice = p.price + modTotal;
      const totalPrice = unitPrice * item.quantity;

      orderItems.push({
        id: crypto.randomUUID(),
        orderId: '',
        productId: p.id,
        productName: p.name,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        modifiers: (item.modifiers ?? []).map(m => ({
          id: crypto.randomUUID(),
          modifierId: m.modifierId,
          modifierName: m.name,
          priceAdjustment: m.priceAdjustment,
        })),
        notes: item.notes,
      });
      subtotal += totalPrice;
    }

    let discountAmount = 0;
    if (input.applyDiscount) {
      if (input.applyDiscount.type === 'percentage') {
        const pct = input.applyDiscount.value;
        if (pct < 0 || pct > 100) throw new BusinessRuleError('Discount pct 0-100');
        discountAmount = (subtotal * pct) / 100;
      } else {
        discountAmount = input.applyDiscount.value;
        if (discountAmount < 0 || discountAmount > subtotal) {
          throw new BusinessRuleError('Fixed discount exceeds subtotal');
        }
      }
    }

    const taxable = subtotal - discountAmount;
    const taxAmount = Math.round(taxable * TAX_RATE * 100) / 100;
    const total = Math.round((taxable + taxAmount) * 100) / 100;

    const order = await this.orderRepo.create(tenantId, {
      tenantId,
      tableId: input.tableId,
      userId,
      orderNumber: await this.orderRepo.generateOrderNumber(tenantId),
      status: 'pending',
      items: orderItems,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount: total,
      customerName: input.customerName,
      notes: input.notes,
    });

    if (input.tableId) await this.tableRepo.updateStatus(tenantId, input.tableId, 'occupied');
    return order;
  }
}
