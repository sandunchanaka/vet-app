import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

// GET - List all user types
export async function GET(request: NextRequest) {
  try {
    const connection = await pool.getConnection();
    
    try {
      const [userTypes] = await connection.execute(
        'SELECT * FROM user_type ORDER BY created_at DESC'
      );
      
      return NextResponse.json({
        success: true,
        data: userTypes
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching user types:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user types' },
      { status: 500 }
    );
  }
}

// POST - Create new user type
export async function POST(request: NextRequest) {
  try {
    const { user_type_name, description } = await request.json();

    if (!user_type_name) {
      return NextResponse.json(
        { success: false, message: 'User type name is required' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    
    try {
      // Check if user type already exists
      const [existing] = await connection.execute(
        'SELECT user_type_id FROM user_type WHERE user_type_name = ?',
        [user_type_name]
      );

      if (Array.isArray(existing) && existing.length > 0) {
        return NextResponse.json(
          { success: false, message: 'User type already exists' },
          { status: 409 }
        );
      }

      // Insert new user type
      const [result] = await connection.execute(
        'INSERT INTO user_type (user_type_name, description) VALUES (?, ?)',
        [user_type_name, description || null]
      );

      return NextResponse.json({
        success: true,
        message: 'User type created successfully',
        data: { id: (result as any).insertId }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating user type:', error);
    return NextResponse.json(
      { success: false, message: `Failed to create user type: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}