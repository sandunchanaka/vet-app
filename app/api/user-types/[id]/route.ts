import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

// GET - Get specific user type
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const connection = await pool.getConnection();
    
    try {
      const [userTypes] = await connection.execute(
        'SELECT * FROM user_type WHERE user_type_id = ?',
        [params.id]
      );

      if (!Array.isArray(userTypes) || userTypes.length === 0) {
        return NextResponse.json(
          { success: false, message: 'User type not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: userTypes[0]
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching user type:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user type' },
      { status: 500 }
    );
  }
}

// PUT - Update user type
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user_type_name, description, is_active } = await request.json();

    if (!user_type_name) {
      return NextResponse.json(
        { success: false, message: 'User type name is required' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    
    try {
      // Check if user type exists
      const [existing] = await connection.execute(
        'SELECT user_type_id FROM user_type WHERE user_type_id = ?',
        [params.id]
      );

      if (!Array.isArray(existing) || existing.length === 0) {
        return NextResponse.json(
          { success: false, message: 'User type not found' },
          { status: 404 }
        );
      }

      // Check if name already exists for different user type
      const [nameExists] = await connection.execute(
        'SELECT user_type_id FROM user_type WHERE user_type_name = ? AND user_type_id != ?',
        [user_type_name, params.id]
      );

      if (Array.isArray(nameExists) && nameExists.length > 0) {
        return NextResponse.json(
          { success: false, message: 'User type name already exists' },
          { status: 409 }
        );
      }

      // Update user type
      await connection.execute(
        'UPDATE user_type SET user_type_name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE user_type_id = ?',
        [user_type_name, description || null, params.id]
      );

      return NextResponse.json({
        success: true,
        message: 'User type updated successfully'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating user type:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update user type' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user type
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const connection = await pool.getConnection();
    
    try {
      // Check if user type exists
      const [existing] = await connection.execute(
        'SELECT user_type_id FROM user_type WHERE user_type_id = ?',
        [params.id]
      );

      if (!Array.isArray(existing) || existing.length === 0) {
        return NextResponse.json(
          { success: false, message: 'User type not found' },
          { status: 404 }
        );
      }

      // Check if any users are using this user type
      const [usersWithType] = await connection.execute(
        'SELECT id FROM users WHERE user_type = ?',
        [params.id]
      );

      if (Array.isArray(usersWithType) && usersWithType.length > 0) {
        return NextResponse.json(
          { success: false, message: 'Cannot delete user type that is in use by existing users' },
          { status: 409 }
        );
      }

      // Delete user type
      await connection.execute(
        'DELETE FROM user_type WHERE user_type_id = ?',
        [params.id]
      );

      return NextResponse.json({
        success: true,
        message: 'User type deleted successfully'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting user type:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete user type' },
      { status: 500 }
    );
  }
}
