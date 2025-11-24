import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get database connection
    const connection = await pool.getConnection();

    try {
      // Find user by email
      const [users] = await connection.execute(
        'SELECT * FROM users WHERE email = ? AND is_active = 1',
        [email]
      );

      console.log('Database query result:', { usersCount: Array.isArray(users) ? users.length : 'not array', email });

      if (!Array.isArray(users) || users.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Invalid email or password' },
          { status: 401 }
        );
      }

      const user = users[0] as any;
      console.log('User found:', { id: user.id, email: user.email, hasPassword: !!user.password_hash });

      // Check if user has a password
      if (!user.password_hash) {
        console.error('User password_hash is undefined for email:', email);
        return NextResponse.json(
          { success: false, message: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Verify password
      console.log('Password verification details:', {
        providedPassword: password ? 'provided' : 'missing',
        providedPasswordLength: password ? password.length : 0,
        storedHash: user.password_hash ? 'exists' : 'missing',
        storedHashLength: user.password_hash ? user.password_hash.length : 0,
        storedHashPrefix: user.password_hash ? user.password_hash.substring(0, 10) : 'N/A'
      });
      
      const isPasswordValid = await verifyPassword(password, user.password_hash);
      console.log('Password verification result:', isPasswordValid);
      
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, message: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Generate JWT token
      const token = generateToken({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type
      });

      // Return success response
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          user_type: user.user_type
        }
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during login. Please try again.' },
      { status: 500 }
    );
  }
}
