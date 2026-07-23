import { NODE_ENV } from '@/core/constants';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: NODE_ENV === 'development' ? ['info', 'warn', 'error'] : ['warn', 'error'],
});

export default prisma;
