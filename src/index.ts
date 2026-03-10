import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import path from 'path';
import { router } from './app';
import { NODE_ENV, PORT } from './core/constants';
import { errorHandlerMiddleware } from './core/errors/errorHandler';
import httpLogger from './core/logger/httpLogger';
import { logger } from './core/logger/logger';
import { allowedDomains } from './core/security/allowed-domains';
import { limiter } from './core/security/rate-limiting';

const app = express();

app.use(
  cors({
    origin: allowedDomains,
    credentials: true,
  }),
);

app.use(httpLogger);

app.use(cookieParser());

app.set('trust-proxy', 1);

// Apply rate limiting to all requests
app.use(limiter);

app.get('/health-check', (req, res) => {
  logger.info('Api Gateway is perfectly working');
  res.json({ success: true, message: 'Api Gateway is perfectly working' });
});

// Apply body parsing only to non-proxy routes
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.use('/api/v1', router);
app.use(errorHandlerMiddleware);

app.use(express.static(path.join(__dirname, '../../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client', 'dist', 'index.html'));
});
app.listen(PORT, () => {
  console.log(`API Gateway is running in ${NODE_ENV} environment at http://localhost:${PORT}`);
});
