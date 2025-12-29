import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/database';
import { hashPassword } from '@/lib/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

export async function POST(request: NextRequest) {
  try {
    const { token, new_password, confirm_password } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ success: false, message: 'Reset token is required' }, { status: 400 });
    }

    if (!new_password || typeof new_password !== 'string') {
      return NextResponse.json({ success: false, message: 'New password is required' }, { status: 400 });
    }

    if (new_password !== confirm_password) {
      return NextResponse.json({ success: false, message: 'Passwords do not match' }, { status: 400 });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 400 });
    }

    if (payload?.type !== 'password-reset' || !payload.userId || !payload.email) {
      return NextResponse.json({ success: false, message: 'Invalid token payload' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      const [users] = await connection.execute(
        'SELECT id FROM users WHERE id = ? AND email = ? AND is_active = 1 LIMIT 1',
        [payload.userId, payload.email]
      );

      if (!Array.isArray(users) || users.length === 0) {
        return NextResponse.json({ success: false, message: 'Account not found or inactive' }, { status: 404 });
      }

      const hashed = await hashPassword(new_password);

      await connection.execute('UPDATE users SET password_hash = ?, updated_date = NOW() WHERE id = ?', [
        hashed,
        payload.userId
      ]);

      return NextResponse.json({ success: true, message: 'Password has been reset successfully' });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Unable to reset password' },
      { status: 500 }
    );
  }
}
