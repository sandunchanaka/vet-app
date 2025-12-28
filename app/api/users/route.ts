import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { verifyToken } from '@/lib/auth';

const getDecodedToken = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization') || '';
  const cookieToken = request.cookies.get('auth_token')?.value;
  const rawHeaderToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  const token = rawHeaderToken || cookieToken || '';
  return token ? verifyToken(token) : null;
};

export async function POST(request: NextRequest) {
  let connection;
  try {
    const body = await request.json();
    const { first_name, last_name, email, phone_number, user_type, password } = body;

    // Basic validation
    if (!first_name || !last_name || !email || !password) {
      return NextResponse.json({ success: false, message: 'All required fields must be provided' }, { status: 400 });
    }

    // Get database connection
    connection = await pool.getConnection();

    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return NextResponse.json({ success: false, message: 'User with this email already exists' }, { status: 409 });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await connection.execute(
      `INSERT INTO users (first_name, last_name, email, phone_number, password_hash, user_type, created_user) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
       [first_name, last_name, email, phone_number || null, hashedPassword, user_type, null]
    );

    const insertResult = result as any;
    const userId = insertResult.insertId;

    // Get the created user with user type name
    const [users] = await connection.execute(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone_number,
             u.user_type, u.created_date, u.updated_date, u.is_active,
             ut.user_type_name
      FROM users u 
      JOIN user_type ut ON u.user_type = ut.user_type_id 
      WHERE u.id = ?
    `, [userId]);

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: users[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({
      success: false,
      message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function GET(request: NextRequest) {
  let connection;
  try {
    // Get all users with user type information
    connection = await pool.getConnection();
    const [users] = await connection.execute(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone_number,
             u.user_type, u.created_date, u.updated_date, u.is_active,
             ut.user_type_name
      FROM users u 
      JOIN user_type ut ON u.user_type = ut.user_type_id 
      ORDER BY u.created_date DESC
    `);

    return NextResponse.json({
      success: true,
      data: users
    }, { status: 200 });

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({
      success: false,
      message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
