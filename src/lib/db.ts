import { Pool } from 'pg';

// Optimized connection pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10, // Increased from 3 for better concurrency
  idleTimeoutMillis: 30000, // Reduced idle timeout
  connectionTimeoutMillis: 10000, // Increased connection timeout
  allowExitOnIdle: true, // Allow pool to exit when idle
});

// Connection pool event handlers for monitoring
pool.on('connect', () => {
  console.log('New database connection established');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Query cache for frequently accessed data
const queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Cache TTL in milliseconds (5 minutes for most queries)
const DEFAULT_CACHE_TTL = 5 * 60 * 1000;

export async function query(text: string, params?: any[], cacheKey?: string, ttl: number = DEFAULT_CACHE_TTL) {
  // Check cache first if cacheKey is provided
  if (cacheKey && queryCache.has(cacheKey)) {
    const cached = queryCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    queryCache.delete(cacheKey);
  }

  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    
    // Cache the result if cacheKey is provided
    if (cacheKey) {
      queryCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl
      });
    }
    
    return result;
  } finally {
    client.release();
  }
}

// Clear cache function
export function clearCache(pattern?: string) {
  if (pattern) {
    for (const key of queryCache.keys()) {
      if (key.includes(pattern)) {
        queryCache.delete(key);
      }
    }
  } else {
    queryCache.clear();
  }
}

// Get cache statistics
export function getCacheStats() {
  return {
    size: queryCache.size,
    keys: Array.from(queryCache.keys())
  };
}

export default pool;