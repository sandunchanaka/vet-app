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
        weeks,
        days,
        description,
        is_active,
        created_at,
        updated_at
      FROM duration_weeks
      WHERE is_active = 1
      ORDER BY weeks ASC, days ASC
    `;
    
    const [rows] = await connection.execute(query);
    
    return NextResponse.json({
      success: true,
      data: rows
    });
    
  } catch (error) {
    console.error('Error fetching duration weeks:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch duration weeks'
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
    const { name, weeks, days, description } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({
        success: false,
        message: 'Name is required'
      }, { status: 400 });
    }

    connection = await pool.getConnection();
    
    // Check if duration week already exists
    const [existingWeek] = await connection.execute(
      'SELECT id FROM duration_weeks WHERE name = ?',
      [name]
    );

    if ((existingWeek as any[]).length > 0) {
      return NextResponse.json({
        success: false,
        message: 'A duration week with this name already exists'
      }, { status: 400 });
    }

    // Create the duration week
    const [result] = await connection.execute(
      'INSERT INTO duration_weeks (name, weeks, days, description) VALUES (?, ?, ?, ?)',
      [name, weeks || null, days || null, description || null]
    );

    return NextResponse.json({
      success: true,
      message: 'Duration week created successfully',
      data: { id: (result as any).insertId }
    });

  } catch (error) {
    console.error('Error creating duration week:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create duration week'
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
