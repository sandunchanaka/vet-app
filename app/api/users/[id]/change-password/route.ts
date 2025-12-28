import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';

const getDecodedToken = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization') || '';
  const cookieToken = request.cookies.get('auth_token')?.value;
  const rawHeaderToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  const token = rawHeaderToken || cookieToken || '';
  return token ? verifyToken(token) : null;
};

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id;
    const body = await request.json();
    const { new_password } = body;

    // Basic validation
    if (!new_password || new_password.length < 6) {
      return NextResponse.json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      }, { status: 400 });
    }

    // Hash the new password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await pool.execute(
      'UPDATE users SET password = ?, updated_user = ? WHERE id = ?',
      [hashedPassword, null, userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
