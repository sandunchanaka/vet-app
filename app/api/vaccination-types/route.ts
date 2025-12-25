import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [rows] = await connection.execute(`
      SELECT vt.*, 
             u1.first_name as created_by_name,
             u2.first_name as updated_by_name
      FROM vaccination_types vt
      LEFT JOIN users u1 ON vt.created_by = u1.id
      LEFT JOIN users u2 ON vt.updated_by = u2.id
      WHERE vt.is_active = 1
      ORDER BY vt.vaccine_name ASC
    `);

    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching vaccination types:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch vaccination types'
    }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function POST(request: NextRequest) {
  let connection;
  try {
    const { 
      vaccine_name, 
      vaccine_type, 
      target_species, 
      age_requirement_months, 
      frequency_months, 
      description, 
      side_effects, 
      contraindications,
      price
    } = await request.json();

    if (!vaccine_name) {
      return NextResponse.json({
        success: false,
        message: 'Vaccine name is required'
      }, { status: 400 });
    }

    const parsedPrice = price === undefined || price === '' ? null : (Number(price) || null);

    connection = await pool.getConnection();

    // Check if vaccine already exists
    const [existing] = await connection.execute(
      'SELECT id FROM vaccination_types WHERE vaccine_name = ?',
      [vaccine_name]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Vaccination type already exists'
      }, { status: 409 });
    }

    // Insert new vaccination type
    const [result] = await connection.execute(
      `INSERT INTO vaccination_types (
        vaccine_name, vaccine_type, target_species, age_requirement_months, 
        frequency_months, description, side_effects, contraindications, price, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vaccine_name, 
        vaccine_type || 'core', 
        target_species || null, 
        age_requirement_months || null, 
        frequency_months || null, 
        description || null, 
        side_effects || null, 
        contraindications || null, 
        parsedPrice, 
        1
      ]
    );

    const insertResult = result as any;
    const vaccineId = insertResult.insertId;

    // Get the created vaccination type
    const [vaccines] = await connection.execute(
      'SELECT * FROM vaccination_types WHERE id = ?',
      [vaccineId]
    );

    return NextResponse.json({
      success: true,
      message: 'Vaccination type created successfully',
      data: vaccines[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating vaccination type:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create vaccination type'
    }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
