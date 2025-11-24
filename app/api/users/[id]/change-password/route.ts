import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    if (decoded.user_type !== 1) {
      return NextResponse.json({ success: false, message: 'Access denied. Admin privileges required.' }, { status: 403 });
    }

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
      [hashedPassword, decoded.id, userId]
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

