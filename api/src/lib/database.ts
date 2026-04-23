import { PrismaClient } from '@prisma/client';
import logger from './logger';
import { appConfig } from './config';

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    log:
      appConfig.NODE_ENV === 'development'
        ? ['info', 'warn', 'error']
        : ['error'],
  });

if (appConfig.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

// Test database connection
const connectDB = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Test query to ensure connection works
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database query test successful');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
};

// Graceful shutdown
const disconnectDB = async () => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
  }
};

export { connectDB, disconnectDB };
export default prisma;
