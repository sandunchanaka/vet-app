import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id;
    const body = await request.json();
    const { current_password, new_password } = body;

    // Basic validation
    if (!current_password || !new_password || new_password.length < 6) {
      return NextResponse.json({ 
        success: false, 
        message: 'Current password and a new password of at least 6 characters are required' 
      }, { status: 400 });
    }

    // Get existing password hash
    const [users] = await pool.execute('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const bcrypt = require('bcryptjs');
    const currentHash = (users as any)[0].password_hash;
    const isCurrentValid = await bcrypt.compare(current_password, currentHash || '');
    if (!isCurrentValid) {
      return NextResponse.json({ success: false, message: 'Current password is incorrect' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password_hash (matches login schema)
    await pool.execute(
      'UPDATE users SET password_hash = ?, updated_user = ? WHERE id = ?',
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
