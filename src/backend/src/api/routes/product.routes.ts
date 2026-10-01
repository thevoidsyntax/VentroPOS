// Products Routes - API Endpoints
// Simplified DDD: Routes delegate to Application Services

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  CreateProductUseCase,
  GetProductsUseCase,
  GetProductUseCase,
  UpdateProductUseCase,
  DeleteProductUseCase,
  CreateCategoryUseCase,
  GetCategoriesUseCase,
  UpdateCategoryUseCase,
  DeleteCategoryUseCase,
} from '../../application/products/index.js';
import { productRepository, categoryRepository } from '../../infrastructure/database/repositories/container.js';
import {
  createProductSchema,
  updateProductSchema,
  productIdParamsSchema,
  getProductsQuerySchema,
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamsSchema,
} from '../schemas/index.js';
import { AppError } from '../../shared/errors/index.js';
import { authMiddleware, requireManager } from '../middleware/index.js';

export async function productRoutes(fastify: FastifyInstance): Promise<void> {
  const createProductUseCase = new CreateProductUseCase(productRepository, categoryRepository);
  const getProductsUseCase = new GetProductsUseCase(productRepository);
  const getProductUseCase = new GetProductUseCase(productRepository);
  const updateProductUseCase = new UpdateProductUseCase(productRepository);
  const deleteProductUseCase = new DeleteProductUseCase(productRepository);

  const createCategoryUseCase = new CreateCategoryUseCase(categoryRepository);
  const getCategoriesUseCase = new GetCategoriesUseCase(categoryRepository);
  const updateCategoryUseCase = new UpdateCategoryUseCase(categoryRepository);
  const deleteCategoryUseCase = new DeleteCategoryUseCase(categoryRepository);

  // ============== CATEGORIES ==============
  fastify.get('/categories', {
    onRequest: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const categories = await getCategoriesUseCase.execute(request.tenantId!);
    return reply.send({ success: true, data: categories });
  });

  fastify.post('/categories', {
    onRequest: [authMiddleware, requireManager],
    schema: createCategorySchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { name, description, parentId, sortOrder } = request.body as {
      name: string;
      description?: string;
      parentId?: string;
      sortOrder?: number;
    };

    try {
      const category = await createCategoryUseCase.execute(request.tenantId!, {
        name,
        description,
        parentId,
        sortOrder,
      });
      return reply.status(201).send({ success: true, data: category });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      throw error;
    }
  });

  fastify.put('/categories/:id', {
    onRequest: [authMiddleware, requireManager],
    schema: updateCategorySchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string;
      description?: string;
      parentId?: string;
      sortOrder?: number;
      isActive?: boolean;
    };

    try {
      const category = await updateCategoryUseCase.execute(request.tenantId!, id, body);
      return reply.send({ success: true, data: category });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      throw error;
    }
  });

  fastify.delete('/categories/:id', {
    onRequest: [authMiddleware, requireManager],
    schema: categoryIdParamsSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      await deleteCategoryUseCase.execute(request.tenantId!, id);
      return reply.status(204).send();
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      throw error;
    }
  });

  // ============== PRODUCTS ==============
  fastify.get('/', {
    onRequest: [authMiddleware],
    schema: getProductsQuerySchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as {
      categoryId?: string;
      isActive?: boolean;
      lowStock?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    };

    const result = await getProductsUseCase.execute(request.tenantId!, query);
    return reply.send({ success: true, ...result });
  });

  fastify.get('/:id', {
    onRequest: [authMiddleware],
    schema: productIdParamsSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const product = await getProductUseCase.execute(request.tenantId!, id);
      return reply.send({ success: true, data: product });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      throw error;
    }
  });

  fastify.post('/', {
    onRequest: [authMiddleware, requireManager],
    schema: createProductSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      name: string;
      sku?: string;
      categoryId?: string;
      description?: string;
      price: number;
      cost?: number;
      stockQuantity?: number;
      lowStockThreshold?: number;
      modifierGroupIds?: string[];
    };

    try {
      const product = await createProductUseCase.execute(request.tenantId!, body);
      return reply.status(201).send({ success: true, data: product });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      throw error;
    }
  });

  fastify.put('/:id', {
    onRequest: [authMiddleware, requireManager],
    schema: updateProductSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Parameters<typeof updateProductUseCase.execute>[2];

    try {
      const product = await updateProductUseCase.execute(request.tenantId!, id, body);
      return reply.send({ success: true, data: product });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      throw error;
    }
  });

  fastify.delete('/:id', {
    onRequest: [authMiddleware, requireManager],
    schema: productIdParamsSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      await deleteProductUseCase.execute(request.tenantId!, id);
      return reply.status(204).send();
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      throw error;
    }
  });
}
