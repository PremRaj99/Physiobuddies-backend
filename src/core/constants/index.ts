export const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// ------------------ JWT ------------------
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

// ------------------ PAYMENT ------------------
export const BUSAN_API_URL = process.env.BUSAN_API_URL || 'https://xtragateway.site';
export const BUSAN_API_TOKEN = process.env.BUSAN_API_TOKEN;

// ------------------ BANNER ------------------
export const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
export const AWS_BUCKET_REGION = process.env.AWS_BUCKET_REGION;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

// ------------------ AUTH ------------------
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// ------------------ WEBHOOK ------------------

// ------------------ EMAIL ------------------
export const SENDING_EMAIL = process.env.SENDING_EMAIL;
export const MAIL_PASS = process.env.MAIL_PASS;

// ------------------ REDIS ------------------
export const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
export const REDIS_PORT = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379;
export const REDIS_USERNAME = process.env.REDIS_USERNAME || '';
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';
