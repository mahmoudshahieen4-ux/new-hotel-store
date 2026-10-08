import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Errors reported by Prisma/Node when the database server cannot be reached
 * transiently (e.g. Neon serverless "cold start" / auto-pause wake-up).
 */
const CONNECTION_ERROR =
  /can't reach database server|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|connection terminated/i;

/**
 * Retries a database operation when the connection is temporarily unavailable.
 *
 * The app uses Neon serverless Postgres, which auto-pauses its compute after a
 * short period of inactivity. The first query issued after the pause wakes the
 * compute and can fail with:
 *
 *   PrismaClientInitializationError: Can't reach database server at `...neon.tech:5432`  (P1001)
 *
 * Instead of crashing the page, we wait (with an increasing delay) and retry,
 * giving the database a moment to finish waking up.
 */
export async function withDbRetry<T>(operation: () => Promise<T>): Promise<T> {
  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const isRetryable = CONNECTION_ERROR.test(message);
      if (!isRetryable || attempt === maxAttempts) {
        throw error;
      }
      const delay = 800 * attempt; // 800ms, 1600ms, 2400ms
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('withDbRetry: exceeded maximum number of attempts');
}
