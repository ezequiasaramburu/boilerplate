import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma client
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Re-export Prisma types
export * from '@prisma/client';

// Database utilities
export const connectDb = async () => {
  try {
    await prisma.$connect();
    // eslint-disable-next-line no-console
    console.log('🗄️  Database connected successfully');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

export const disconnectDb = async () => {
  await prisma.$disconnect();
};
