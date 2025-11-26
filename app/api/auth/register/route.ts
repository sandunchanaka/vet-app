import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { hashPassword, generateToken } from '@/lib/auth';
import { UserRegistration, AuthResponse } from '@/types/user';

export async function POST(request: NextRequest) {
  try {
    const body: UserRegistration = await request.json();
    
    // Basic validation
    if (!body.first_name || !body.last_name || !body.email || !body.password) {
      return NextResponse.json({
        success: false,
        message: 'All required fields must be provided'
      } as AuthResponse, { status: 400 });
    }

    if (body.password !== body.confirm_password) {
      return NextResponse.json({
        success: false,
        message: 'Passwords do not match'
      } as AuthResponse, { status: 400 });
    }

    if (body.password.length < 8) {
      return NextResponse.json({
        success: false,
        message: 'Password must be at least 8 characters'
      } as AuthResponse, { status: 400 });
    }

    const { first_name, last_name, email, password, phone, business_name, website } = body;

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'User with this email already exists'
      } as AuthResponse, { status: 409 });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Default user type to student (4) if not specified
    const userType = body.user_type || 4;

    // Insert new user
    const [result] = await pool.execute(
      `INSERT INTO users (first_name, last_name, email, password_hash, user_type, created_user) 
       VALUES (?, ?, ?, ?, ?, 1)`,
      [first_name, last_name, email, hashedPassword, userType]
    );

    const insertResult = result as any;
    const userId = insertResult.insertId;

    // Get the created user with user type name
    const [users] = await pool.execute(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.user_type, u.created_date, u.updated_date, u.is_active,
              ut.user_type_name
       FROM users u 
       JOIN user_type ut ON u.user_type = ut.user_type_id 
       WHERE u.id = ?`,
      [userId]
    );

    const user = (users as any[])[0];
    
    // Generate JWT token
    const token = generateToken(user);

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user,
      token
    } as AuthResponse, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    } as AuthResponse, { status: 500 });
  }
}
