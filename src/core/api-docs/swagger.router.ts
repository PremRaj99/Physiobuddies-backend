// src/core/api-docs/swagger.router.ts
import { z } from 'zod';
import { registerApiRoute } from './swagger.util';

// Define the return type to match your RouteConfig success structure
export type SuccessResult = {
  statusCode: 200 | 201 | 202;
  message?: string;
  schema?: z.ZodTypeAny;
};

export function success(code: 200, schema?: z.ZodTypeAny): SuccessResult;
export function success(code: 201 | 202, message?: string): SuccessResult;
export function success(code: 200 | 201 | 202, secondArg?: z.ZodTypeAny | string): SuccessResult {
  if (code === 200) {
    return {
      statusCode: code,
      schema: secondArg as z.ZodTypeAny, // If undefined, registerApiRoute handles 'OK'
    };
  }
  return {
    statusCode: code,
    message: secondArg as string, // If undefined, registerApiRoute handles status text
  };
}

interface SwaggerRouteOptions {
  summary: string;
  description?: string;
  body?: z.ZodTypeAny;
  query?: z.ZodObject;
  params?: z.ZodObject;
  success?: SuccessResult;
  errors?: number[];
  noDefaultErrors?: boolean;
}

export const swaggerRouter = (basePath: string, tags: string[]) => {
  const register = (
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    endpoint: string,
    options: SwaggerRouteOptions,
  ) => {
    // Clean up paths to prevent double slashes
    const fullPath = `${basePath}/${endpoint}`.replace(/\/+/g, '/');

    registerApiRoute({
      method,
      path: fullPath,
      tags,
      summary: options.summary,
      ...(options.description !== undefined && { description: options.description }),
      ...(options.body !== undefined && { body: options.body }),
      ...(options.query !== undefined && { query: options.query }),
      ...(options.params !== undefined && { params: options.params }),
      ...(options.success !== undefined && { success: options.success }),
      ...(options.errors !== undefined && { errors: options.errors }),
      ...(options.noDefaultErrors !== undefined && { noDefaultErrors: options.noDefaultErrors }),
    });

    return router; // Return for chaining
  };

  const router = {
    get: (path: string, opts: SwaggerRouteOptions) => register('get', path, opts),
    post: (path: string, opts: SwaggerRouteOptions) => register('post', path, opts),
    put: (path: string, opts: SwaggerRouteOptions) => register('put', path, opts),
    patch: (path: string, opts: SwaggerRouteOptions) => register('patch', path, opts),
    delete: (path: string, opts: SwaggerRouteOptions) => register('delete', path, opts),
  };

  return router;
};
