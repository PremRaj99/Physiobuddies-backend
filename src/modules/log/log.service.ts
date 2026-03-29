import { WebSocketServer } from 'ws';
import { Tail } from 'tail';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { logger } from '@/core/logger/logger';
import type { Express } from 'express';

const logFilePath = path.join(process.cwd(), 'logs', 'combined.log');

export const getLogs = () => {
  if (!fs.existsSync(logFilePath)) return [];
  const file = fs.readFileSync(logFilePath, 'utf-8');
  return file
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { message: line };
      }
    });
};

export const setupLogWebSocket = (app: Express) => {
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/api/v1/logs/live' });

  // Make sure the file exists before tailing, or Tail will throw an error
  if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, '');
  }

  // 1. Initialize Tail
  const tail = new Tail(logFilePath, {
    useWatchFile: true, // This safely handles the OS buffering issue we fixed earlier!
    fsWatchOptions: { interval: 500 },
    fromBeginning: false, // CRITICAL: Only stream NEW lines, ignore the 100k history
  });

  // 2. Listen for new lines automatically
  tail.on('line', (data) => {
    const log = JSON.parse(data);
    const logString = JSON.stringify(log);

    // Broadcast to all active WebSocket clients
    wss.clients.forEach((client) => {
      if (client.readyState === 1 /* WebSocket.OPEN */) {
        client.send(logString);
      }
    });
  });

  tail.on('error', (error) => {
    logger.error('Tail stream error:', error);
  });

  return server;
};
