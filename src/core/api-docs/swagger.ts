// src/core/api-docs/swagger.ts
import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';
import { Request, Response, NextFunction, Router } from 'express';
import { z } from 'zod';
import swaggerUi from 'swagger-ui-express';

extendZodWithOpenApi(z);
export const registry = new OpenAPIRegistry();

export const generateOpenAPIDocument = () => {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'API Documentation For Physiobuddies',
      description: 'API for backend services',
    },
    servers: [{ url: `/api/v1` }],
  });
};

export const swaggerRouter = Router();

// FIX: Use a getter function so the doc is generated when the route is hit,
// ensuring all 'registerApiRoute' calls from other files have finished.
swaggerRouter.use('/', swaggerUi.serve);
swaggerRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  const doc = generateOpenAPIDocument();
  return swaggerUi.setup(doc)(req, res, next);
});

swaggerRouter.get('/doc.json', (_req: Request, res: Response, _next: NextFunction) => {
  const doc = generateOpenAPIDocument();
  res.json(doc);
});
