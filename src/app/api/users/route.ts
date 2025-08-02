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
      whereConditions.push(`(email ILIKE $${paramIndex} OR name ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (isAdmin !== null) {
      whereConditions.push(`"isAdmin" = $${paramIndex}`);
      queryParams.push(isAdmin === 'true');
      paramIndex++;
    }

    if (isApproved !== null) {
      whereConditions.push(`"isApproved" = $${paramIndex}`);
      queryParams.push(isApproved === 'true');
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get users
    const usersQuery = `
      SELECT id, email, name, phone, "isApproved", "isAdmin", "createdAt", "updatedAt"
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

    const users = usersResult.rows;
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
    const { email, password, name, isAdmin } = body

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

    // Create user
    const result = await client.query(
      `INSERT INTO users (id, email, password, name, "isAdmin", "isApproved", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, email, name, "isAdmin", "isApproved"`,
      [
        'user-' + Date.now(),
        email,
        hashedPassword,
        name || 'User',
        isAdmin || false,
        true
      ]
    );

    const user = result.rows[0];

    return NextResponse.json({
      message: 'İstifadəçi uğurla yaradıldı',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
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