import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET(request: NextRequest) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const isAdmin = searchParams.get('isAdmin')
    const isApproved = searchParams.get('isApproved')

    const skip = (page - 1) * limit

    const whereConditions = [];
    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(email ILIKE $${paramIndex} OR "firstName" ILIKE $${paramIndex} OR "lastName" ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (isAdmin !== null) {
      whereConditions.push(`role = $${paramIndex}`);
      queryParams.push(isAdmin === 'true' ? 'ADMIN' : 'CUSTOMER');
      paramIndex++;
    }

    if (isApproved !== null) {
      whereConditions.push(`"isApproved" = $${paramIndex}`);
      queryParams.push(isApproved === 'true');
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get users with actual database schema (without isActive)
    const usersQuery = `
      SELECT id, email, "firstName", "lastName", phone, role, "isApproved", "createdAt", "updatedAt"
      FROM users 
      ${whereClause}
      ORDER BY "createdAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users 
      ${whereClause}
    `;

    const [usersResult, countResult] = await Promise.all([
      client.query(usersQuery, [...queryParams, limit, skip]),
      client.query(countQuery, queryParams)
    ]);

    // Transform users to include name, isAdmin, and discount for frontend compatibility
    const users = usersResult.rows.map(user => ({
      ...user,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
      isAdmin: user.role === 'ADMIN',
      discount: user.isApproved ? 0 : 0 // Default discount for approved users
    }));

    const total = parseInt(countResult.rows[0].total);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'İstifadəçiləri yükləmək mümkün olmadı' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}

// POST - Create new user (admin only)
export async function POST(request: NextRequest) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    
    const body = await request.json()
    const { email, password, firstName, lastName, isAdmin } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email və şifrə tələb olunur' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Bu email artıq istifadə olunub' },
        { status: 400 }
      )
    }

    // Hash password
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with actual database schema (without isActive)
    const result = await client.query(
      `INSERT INTO users (id, email, password, "firstName", "lastName", role, "isApproved", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, email, "firstName", "lastName", role, "isApproved"`,
      [
        'user-' + Date.now(),
        email,
        hashedPassword,
        firstName || 'User',
        lastName || 'User',
        isAdmin ? 'ADMIN' : 'CUSTOMER',
        true
      ]
    );

    const user = result.rows[0];

    return NextResponse.json({
      message: 'İstifadəçi uğurla yaradıldı',
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        isAdmin: user.role === 'ADMIN',
        isApproved: user.isApproved
      }
    })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'İstifadəçi yaratma xətası' },
      { status: 500 }
    )
  } finally {
    await client.end();
  }
} 