import { PrismaClient } from '@prisma/client'

// Development üçün global client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Production üçün tamamilə yeni yanaşma - singleton pattern
let prismaClient: PrismaClient | null = null

const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    // Vercel üçün əlavə konfiqurasiyalar
    ...(process.env.NODE_ENV === 'production' && {
      // Connection pooling üçün
      __internal: {
        engine: {
          connectionLimit: 1,
          pool: {
            min: 0,
            max: 1
          }
        }
      }
    })
  })
}

// Development-da global client istifadə et
export const prisma = process.env.NODE_ENV === 'development'
  ? (globalForPrisma.prisma ?? createPrismaClient())
  : createPrismaClient()

if (process.env.NODE_ENV === 'development') {
  globalForPrisma.prisma = prisma
}

// Production üçün singleton pattern - hər request üçün yalnız bir client
export async function getPrismaClient() {
  if (process.env.NODE_ENV === 'production') {
    // Əgər client yoxdursa, yeni yarad
    if (!prismaClient) {
      console.log('🔄 Creating new Prisma client for production...')
      prismaClient = createPrismaClient()
      
      // Connection-ı test et
      try {
        await prismaClient.$connect()
        console.log('✅ New Prisma client created and connected')
      } catch (error) {
        console.error('❌ Connection failed:', error)
        await prismaClient.$disconnect()
        prismaClient = null
        throw error
      }
    }
    
    return prismaClient
  }
  return prisma
}

export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeout: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms} ms`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeout);
  });
}

// Production üçün client cleanup utility
export async function cleanupClient(client: PrismaClient) {
  try {
    await client.$disconnect()
    // Production-da client-ı null et ki, növbəti request-də yeni yaradılsın
    if (process.env.NODE_ENV === 'production') {
      prismaClient = null
    }
  } catch (error) {
    console.error('Cleanup error:', error)
  }
}

// Production üçün client reset utility
export function resetPrismaClient() {
  if (process.env.NODE_ENV === 'production' && prismaClient) {
    prismaClient.$disconnect()
    prismaClient = null
    console.log('✅ Prisma client reset')
  }
}

// Vercel üçün xüsusi connection handler
export async function getVercelPrismaClient() {
  if (process.env.NODE_ENV === 'production') {
    // Hər request üçün yeni client yarad
    const client = new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })
    
    try {
      await client.$connect()
      return client
    } catch (error) {
      console.error('Vercel Prisma connection failed:', error)
      await client.$disconnect()
      throw error
    }
  }
  
  return getPrismaClient()
} 