import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { verifyToken, hashPassword } from '@/lib/auth';

const getDecodedToken = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization') || '';
  const cookieToken = request.cookies.get('auth_token')?.value;
  const rawHeaderToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  const token = rawHeaderToken || cookieToken || '';
  return token ? verifyToken(token) : null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Get user by ID
    const [users] = await pool.execute(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone_number,
             u.user_type, u.created_date, u.updated_date, u.is_active,
             ut.user_type_name
      FROM users u 
      JOIN user_type ut ON u.user_type = ut.user_type_id 
      WHERE u.id = ?
    `, [userId]);

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: users[0]
    }, { status: 200 });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const body = await request.json();
    const { first_name, last_name, email, phone_number, user_type, is_active } = body;

    // Check if email already exists for another user
    if (email) {
      const [existingUsers] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (Array.isArray(existingUsers) && existingUsers.length > 0) {
        return NextResponse.json({
          success: false,
          message: 'Email already exists for another user'
        }, { status: 409 });
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (first_name !== undefined) {
      updateFields.push('first_name = ?');
      updateValues.push(first_name);
    }
    if (last_name !== undefined) {
      updateFields.push('last_name = ?');
      updateValues.push(last_name);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (phone_number !== undefined) {
      updateFields.push('phone_number = ?');
      updateValues.push(phone_number);
    }
    if (user_type !== undefined) {
      updateFields.push('user_type = ?');
      updateValues.push(user_type);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    updateFields.push('updated_user = ?');
    updateValues.push(null);

    updateValues.push(userId);

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

    await pool.execute(query, updateValues);

    // Get updated user
    const [users] = await pool.execute(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone_number,
             u.user_type, u.created_date, u.updated_date, u.is_active,
             ut.user_type_name
      FROM users u 
      JOIN user_type ut ON u.user_type = ut.user_type_id 
      WHERE u.id = ?
    `, [userId]);

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: users[0]
    }, { status: 200 });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Soft delete - set is_active to false
    await pool.execute(
      'UPDATE users SET is_active = false, updated_user = ? WHERE id = ?',
      [null, userId]
    );

    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
