import { Pool, PoolClient } from 'pg';

// Optimized connection pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Optimized pool settings
  max: 10, // Maximum number of clients in the pool
  min: 2,  // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
});

// Connection pool event handlers
pool.on('connect', (client: PoolClient) => {
  console.log('New client connected to database');
});

pool.on('error', (err: Error, client: PoolClient) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('acquire', (client: PoolClient) => {
  console.log('Client acquired from pool');
});

pool.on('release', (client: PoolClient) => {
  console.log('Client released back to pool');
});

// Simple query cache for frequently accessed data
const queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key?: string; // Custom cache key
}

export async function query(text: string, params?: any[], cacheOptions?: CacheOptions) {
  const cacheKey = cacheOptions?.key || `${text}-${JSON.stringify(params)}`;
  const ttl = cacheOptions?.ttl || 5 * 60 * 1000; // Default 5 minutes
  
  // Check cache first
  if (cacheOptions && queryCache.has(cacheKey)) {
    const cached = queryCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    queryCache.delete(cacheKey);
  }
  
  const client = await pool.connect();
  try {
    const start = Date.now();
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries
    if (duration > 1000) {
      console.warn(`Slow query detected (${duration}ms):`, text.substring(0, 100));
    }
    
    // Cache the result if caching is enabled
    if (cacheOptions) {
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

// Optimized query for products with pagination
export async function getProductsWithPagination(
  page: number = 1,
  limit: number = 20,
  categoryId?: string,
  search?: string
) {
  const offset = (page - 1) * limit;
  
  let whereClause = 'WHERE p."isActive" = true';
  const params: any[] = [];
  let paramCount = 1;
  
  if (categoryId) {
    whereClause += ` AND p."categoryId" = $${paramCount}`;
    params.push(categoryId);
    paramCount++;
  }
  
  if (search) {
    whereClause += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
    params.push(`%${search}%`);
    paramCount++;
  }
  
  const query = `
    SELECT 
      p.id,
      p.name,
      p.description,
      p.price,
      p."salePrice",
      p.sku,
      p.stock,
      p.images,
      p."isActive",
      p."isFeatured",
      p.artikul,
      p."catalogNumber",
      p."createdAt",
      p."updatedAt",
      p."categoryId",
      c.name as category_name,
      c.description as category_description,
      COUNT(*) OVER() as total_count
    FROM products p
    LEFT JOIN categories c ON p."categoryId" = c.id
    ${whereClause}
    ORDER BY p."createdAt" DESC
    LIMIT $${paramCount} OFFSET $${paramCount + 1}
  `;
  
  params.push(limit, offset);
  
  const result = await query(query, params, {
    ttl: 2 * 60 * 1000, // Cache for 2 minutes
    key: `products-${page}-${limit}-${categoryId}-${search}`
  });
  
  const totalCount = result.rows[0]?.total_count || 0;
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    products: result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      salePrice: row.salePrice ? parseFloat(row.salePrice) : null,
      sku: row.sku,
      stock: parseInt(row.stock),
      images: row.images || [],
      isActive: row.isActive,
      isFeatured: row.isFeatured,
      artikul: row.artikul,
      catalogNumber: row.catalogNumber,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      categoryId: row.categoryId,
      category: row.category_name ? {
        id: row.categoryId,
        name: row.category_name,
        description: row.category_description
      } : null
    })),
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}

// Clear cache utility
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

// Graceful shutdown
export async function closePool() {
  await pool.end();
}

export { pool };