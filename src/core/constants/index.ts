export const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// ------------------ JWT ------------------
export const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET ||
  '62b39b43ba78a6c026706883ec35a165cabd678d13d6dfddf5d5edbc6468e063';
export const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET ||
  '0abac188fd39fb9b900e68c60351c678732be612caccdf610fd470bf17649357';

// ------------------ PAYMENT ------------------
export const BUSAN_API_URL = 'https://xtragateway.site';
export const BUSAN_API_TOKEN = 'aa1352222db7aef3b275b4f3212d22b7';

// ------------------ BANNER ------------------
export const AWS_ACCESS_KEY = 'AKIAW3MEEWEHFQ5KOXVN';
export const AWS_BUCKET_NAME = 'busan-public';
export const AWS_BUCKET_REGION = 'ap-south-1';
export const AWS_SECRET_ACCESS_KEY = 'H5fCpGHYRsGzOm5pK92z+Qb57vQrfRoM6c43HeAm';

// ------------------ ORDER ------------------
export const BUSAN_URL = 'https://1gamestopup.com/api/v1';
export const BUSAN_API_KEY =
  'busan_2ee0e32d5b7a0db087d80cbf22fc4ced55d94517fb0ea0a21024b8a1f3b47d41';

export const SMILE_UID = '1699602';
export const SMILE_EMAIL = 'bhusanoinam@gmail.com';
export const SMILE_KEY = 'b2fbd7282c2b67f61cfeb95ea623ca9c';

// ------------------ AUTH ------------------
export const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  '22438999008-eskr5v3jvtqgkchbk5g7r9ees02rd9e7.apps.googleusercontent.com';
export const GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_CLIENT_SECRET || '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';

// ------------------ WEBHOOK ------------------
export const EXPAY_WEBHOOK_SECRET = process.env.EXPAY_WEBHOOK_SECRET || 'dummmy_webhook_secret_key';

// ------------------ EMAIL ------------------
export const SENDING_EMAIL = process.env.SENDING_EMAIL || 'support@physiobuddies.in';
export const MAIL_PASS = process.env.MAIL_PASS || '@Twophysios@2developers';
