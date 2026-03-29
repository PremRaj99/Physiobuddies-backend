import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import path from 'path';
import { router } from './app';
import { NODE_ENV, PORT } from './core/constants';
import { errorHandlerMiddleware } from './core/errors/errorHandler';
import { allowedDomains } from './core/security/allowed-domains';
import { limiter } from './core/security/rate-limiting';
import { initRedis } from './shared/redis';
import { requestContextMiddleware } from './core/logger/requestContextMiddleware';
import { Request, Response } from 'express';
import { setupLogWebSocket } from './modules/log/log.service';

const app = express();

app.use(
  cors({
    origin: allowedDomains,
    credentials: true,
  }),
);

app.use(requestContextMiddleware);

app.use(cookieParser());

app.set('trust-proxy', 1);

// Apply rate limiting to all requests
app.use(limiter);

app.get('/health-check', (req: Request, res: Response) => {
  req.logger.info('Api Gateway is perfectly working');
  res.json({ success: true, message: 'Api Gateway is perfectly working' });
});

// Apply body parsing only to non-proxy routes
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.use('/api/v1', router);
app.use(errorHandlerMiddleware);

const clientPath = path.join(__dirname, '../../client/dist');

if (clientPath && NODE_ENV === 'production') {
  app.use(express.static(clientPath));

  // FIX: Change '*' to /.*$/
  app.get(/.*$/, (_req: Request, res: Response) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

const server = setupLogWebSocket(app);

const initServer = async () => {
  await initRedis();
  server.listen(PORT, () => {
    console.log(`API Gateway is running at http://localhost:${PORT}`);
    console.log(`WebSocket ready at ws://localhost:${PORT}/api/v1/logs/live`);
  });
};

initServer();
