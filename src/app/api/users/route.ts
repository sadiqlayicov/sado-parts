import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 2, // Limit connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function GET(request: NextRequest) {
  let client: any;
  
  try {
    console.log('GET /api/users called');
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const isAdmin = searchParams.get('isAdmin')
    const isApproved = searchParams.get('isApproved')

    const skip = (page - 1) * limit

    client = await pool.connect();
    console.log('Database connected successfully');

    // Build where conditions
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(u.email ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex} OR u.phone ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (isAdmin !== null) {
      whereConditions.push(`u.role = $${paramIndex}`);
      queryParams.push(isAdmin === 'true' ? 'ADMIN' : 'CUSTOMER');
      paramIndex++;
    }

    if (isApproved !== null) {
      whereConditions.push(`u."isApproved" = $${paramIndex}`);
      queryParams.push(isApproved === 'true');
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get users with count
    const usersQuery = `
      SELECT 
        u.id,
        u.email,
        u.name,
        u.phone,
        u.role,
        u."isApproved",
        u."firstName",
        u."lastName",
        u.inn,
        u.country,
        u.city,
        u.address,
        u."discountPercentage",
        u."createdAt",
        u."updatedAt",
        COUNT(o.id) as orders_count,
        COALESCE(SUM(o."totalAmount"), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o."userId"
      ${whereClause}
      GROUP BY u.id, u.email, u.name, u.phone, u.role, u."isApproved", u."firstName", u."lastName", u.inn, u.country, u.city, u.address, u."discountPercentage", u."createdAt", u."updatedAt"
      ORDER BY u."createdAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      ${whereClause}
    `;

    queryParams.push(limit, skip);

    console.log('Executing users query...');
    const [usersResult, countResult] = await Promise.all([
      client.query(usersQuery, queryParams),
      client.query(countQuery, queryParams.slice(0, -2))
    ]);

    console.log('Users found:', usersResult.rows.length);
    console.log('Total users:', countResult.rows[0].total);

    // Transform users for frontend compatibility
    const transformedUsers = usersResult.rows.map((user: any) => {
      return {
        id: user.id,
        email: user.email,
        name: user.name || 'User',
        phone: user.phone || '—',
        isAdmin: user.role === 'ADMIN',
        isApproved: user.isApproved,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        discount: user.isApproved ? 0 : 0,
        discountPercentage: user.discountPercentage || 0,
        ordersCount: parseInt(user.orders_count) || 0,
        totalSpent: parseFloat(user.total_spent) || 0,
        lastLogin: user.updatedAt,
        registrationDate: user.createdAt,
        country: user.country || '—',
        city: user.city || '—',
        inn: user.inn || '—',
        address: user.address || '—',
        role: user.role === 'ADMIN' ? 'admin' : 'customer'
      };
    });

    return NextResponse.json({
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
      }
    });
  } catch (error: any) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: 'İstifadəçiləri yükləmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function POST(request: NextRequest) {
  let client: any;
  
  try {
    client = await pool.connect();
    
    const body = await request.json();
    const { email, name, phone, isAdmin, isApproved } = body;

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email tələb olunur' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Bu email ünvanı artıq istifadə olunub' },
        { status: 400 }
      );
    }

    // Create user
    const user = await client.query(`
      INSERT INTO users (id, email, name, phone, role, "isApproved", password, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, email, name, phone, role, "isApproved"
    `, [`user_${Date.now()}`, email, name || 'User', phone, isAdmin ? 'ADMIN' : 'CUSTOMER', isApproved !== false, 'temp_password']);

    return NextResponse.json({
      success: true,
      user: user.rows[0]
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        { error: 'Bu email ünvanı artıq istifadə olunub' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'İstifadəçi yaratma zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
} 