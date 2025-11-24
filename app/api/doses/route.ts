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
        dosage_type,
        ml_equivalent,
        is_active,
        created_at,
        updated_at
      FROM doses
      WHERE is_active = 1
      ORDER BY dosage_type, name ASC
    `;
    
    const [rows] = await connection.execute(query);
    
    return NextResponse.json({
      success: true,
      data: rows
    });
    
  } catch (error) {
    console.error('Error fetching doses:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch doses'
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
    const { name, dosage_type, ml_equivalent } = body;

    // Validate required fields
    if (!name || !dosage_type) {
      return NextResponse.json({
        success: false,
        message: 'Name and dosage type are required'
      }, { status: 400 });
    }

    connection = await pool.getConnection();
    
    // Check if dose already exists
    const [existingDose] = await connection.execute(
      'SELECT id FROM doses WHERE name = ? AND dosage_type = ?',
      [name, dosage_type]
    );

    if ((existingDose as any[]).length > 0) {
      return NextResponse.json({
        success: false,
        message: 'A dose with this name and type already exists'
      }, { status: 400 });
    }

    // Create the dose
    const [result] = await connection.execute(
      'INSERT INTO doses (name, dosage_type, ml_equivalent) VALUES (?, ?, ?)',
      [name, dosage_type, ml_equivalent || null]
    );

    return NextResponse.json({
      success: true,
      message: 'Dose created successfully',
      data: { id: (result as any).insertId }
    });

  } catch (error) {
    console.error('Error creating dose:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create dose'
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
