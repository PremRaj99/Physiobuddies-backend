import { z } from 'zod';
import { registry } from './swagger';

export const createSuccessResponseSchema = (
  dataSchema?: z.ZodTypeAny,
  defaultMessage = 'Success',
) => {
  return z.object({
    success: z.boolean().default(true).openapi({ example: true }),
    message: z.string().openapi({ example: defaultMessage }),
    data: dataSchema ? dataSchema : z.null().openapi({ example: null }),
  });
};

export const createErrorResponseSchema = (defaultMessage = 'Error') => {
  return z.object({
    success: z.boolean().default(false).openapi({ example: false }),
    message: z.string().openapi({ example: defaultMessage }),
  });
};

const STANDARD_ERRORS: Record<number, string> = {
  400: 'bad request',
  401: 'Unauthorized',
  403: 'forbidden',
  404: 'not found',
  429: 'too many request',
  500: 'Internal Server Error',
  502: 'database failed to do task',
};

// --- UPDATED TYPES ---

interface RouteConfig {
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  path: string;
  tags: string[];
  summary: string;
  description?: string;
  body?: z.ZodTypeAny;
  // FIX 1: Change these to z.AnyZodObject. Query and params must be objects!
  query?: z.ZodObject;
  params?: z.ZodObject;
  success?: {
    statusCode?: 200 | 201 | 202;
    description?: string;
    message?: string;
    schema?: z.ZodTypeAny;
  };
  errors?: (keyof typeof STANDARD_ERRORS)[];
  noDefaultErrors?: boolean;
}

type SwaggerResponseDefinition = {
  description: string;
  content: {
    'application/json': {
      schema: z.ZodTypeAny;
    };
  };
};

// Define an exact interface for the request payload
interface RequestPayload {
  body?: {
    content: {
      'application/json': { schema: z.ZodTypeAny };
    };
  };
  query?: z.ZodObject;
  params?: z.ZodObject;
}

const DEFAULT_ERRORS: (keyof typeof STANDARD_ERRORS)[] = [400, 429, 500];

const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
};

export const registerApiRoute = (config: RouteConfig) => {
  const statusCode = config.success?.statusCode || 200;
  const message: string = config.success?.message || STATUS_TEXT[statusCode] || 'Success';

  // FIX 2: Change Record<number, ...> to Record<string, ...>
  const responses: Record<string, SwaggerResponseDefinition> = {
    [String(statusCode)]: {
      description: message,
      content: {
        'application/json': {
          schema: createSuccessResponseSchema(config.success?.schema, message),
        },
      },
    },
  };

  const errorCodes = config.noDefaultErrors
    ? config.errors || []
    : Array.from(new Set([...DEFAULT_ERRORS, ...(config.errors || [])]));

  errorCodes.forEach((code) => {
    // Cast code to string for the key
    responses[String(code)] = {
      description: STANDARD_ERRORS[code] || 'Error',
      content: { 'application/json': { schema: createErrorResponseSchema(STANDARD_ERRORS[code]) } },
    };
  });

  // FIX 3: Construct the request payload safely.
  // By building it this way, we avoid spreading `undefined`, satisfying exactOptionalPropertyTypes
  const requestPayload: RequestPayload = {};

  if (config.body) {
    requestPayload.body = { content: { 'application/json': { schema: config.body } } };
  }
  if (config.query) {
    requestPayload.query = config.query;
  }
  if (config.params) {
    requestPayload.params = config.params;
  }

  registry.registerPath({
    method: config.method,
    path: config.path,
    tags: config.tags,
    summary: config.summary,
    // Safely add description
    ...(config.description ? { description: config.description } : {}),
    // Safely add request only if it has properties
    ...(Object.keys(requestPayload).length > 0 ? { request: requestPayload } : {}),
    responses,
  });
};
