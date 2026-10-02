// Get Stock History Use Case
import type { StockLog } from '../../domain/entities/index.js';
import type { IProductRepository, IStockLogRepository, StockLogFilters } from '../../domain/repositories/index.js';
import { NotFoundError } from '../../shared/errors/index.js';

export interface GetStockHistoryInput {
  productId?: string;
  fromDate?: Date;
  toDate?: Date;
  type?: StockLog['type'];
}

export class GetStockHistoryUseCase {
  constructor(
    private productRepo: IProductRepository,
    private stockLogRepo: IStockLogRepository
  ) {}

  async execute(tenantId: string, input: GetStockHistoryInput = {}): Promise<{
    logs: StockLog[];
    meta: { productName?: string };
  }> {
    let productName: string | undefined;

    if (input.productId) {
      const product = await this.productRepo.findById(tenantId, input.productId);
      if (!product) {
        throw new NotFoundError(`Product with id '${input.productId}'`);
      }
      productName = product.name;
    }

    const filters: StockLogFilters = {
      productId: input.productId,
      type: input.type,
      fromDate: input.fromDate,
      toDate: input.toDate,
    };

    const logs = await this.stockLogRepo.findAll(tenantId, filters);

    return { logs, meta: { productName } };
  }
}
