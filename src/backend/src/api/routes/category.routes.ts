// Category Routes - API Endpoints
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  CreateCategoryUseCase,
  GetCategoriesUseCase,
  UpdateCategoryUseCase,
  DeleteCategoryUseCase,
} from '../../application/categories/index.js';
import { categoryRepository } from '../../infrastructure/database/repositories/container.js';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamsSchema,
} from '../schemas/index.js';
import { AppError } from '../../shared/errors/index.js';
import { authMiddleware, requireManager } from '../middleware/index.js';

export async function categoryRoutes(fastify: FastifyInstance): Promise<void> {
  const createCategoryUseCase = new CreateCategoryUseCase(categoryRepository);
  const getCategoriesUseCase = new GetCategoriesUseCase(categoryRepository);
  const updateCategoryUseCase = new UpdateCategoryUseCase(categoryRepository);
  const deleteCategoryUseCase = new DeleteCategoryUseCase(categoryRepository);

  // GET /categories - List all categories
  fastify.get('/', {
    onRequest: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const categories = await getCategoriesUseCase.execute(request.tenantId!);
    return reply.send({ success: true, data: categories });
  });

  // GET /categories/:id - Get single category
  fastify.get('/:id', {
    onRequest: [authMiddleware],
    schema: categoryIdParamsSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const categories = await getCategoriesUseCase.execute(request.tenantId!);
      const category = categories.find(c => c.id === id);

      if (!category) {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Category not found' },
        });
      }

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

  // POST /categories - Create category
  fastify.post('/', {
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

  // PUT /categories/:id - Update category
  fastify.put('/:id', {
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

  // DELETE /categories/:id - Delete category
  fastify.delete('/:id', {
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
}
