import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    const query = `
      SELECT 
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at
      FROM duration_types
      WHERE is_active = 1
      ORDER BY name ASC
    `;
    
    const [rows] = await connection.execute(query);
    
    return NextResponse.json({
      success: true,
      data: rows
    });
    
  } catch (error) {
    console.error('Error fetching duration types:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch duration types'
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function POST(request: NextRequest) {
  let connection;
  
  try {
    const body = await request.json();
    const { name, description } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({
        success: false,
        message: 'Name is required'
      }, { status: 400 });
    }

    connection = await pool.getConnection();
    
    // Check if duration type already exists
    const [existingType] = await connection.execute(
      'SELECT id FROM duration_types WHERE name = ?',
      [name]
    );

    if ((existingType as any[]).length > 0) {
      return NextResponse.json({
        success: false,
        message: 'A duration type with this name already exists'
      }, { status: 400 });
    }

    // Create the duration type
    const [result] = await connection.execute(
      'INSERT INTO duration_types (name, description) VALUES (?, ?)',
      [name, description || null]
    );

    return NextResponse.json({
      success: true,
      message: 'Duration type created successfully',
      data: { id: (result as any).insertId }
    });

  } catch (error) {
    console.error('Error creating duration type:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create duration type'
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
