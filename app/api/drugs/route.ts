import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [rows] = await connection.execute(`
      SELECT d.*, 
             u1.first_name as created_by_name,
             u2.first_name as updated_by_name
      FROM drugs d
      LEFT JOIN users u1 ON d.created_by = u1.id
      LEFT JOIN users u2 ON d.updated_by = u2.id
      WHERE d.is_active = 1
      ORDER BY d.drug_name ASC
    `);

    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching drugs:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch drugs'
    }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function POST(request: NextRequest) {
  let connection;
  try {
    const { 
      drug_name, 
      generic_name, 
      manufacturer, 
      drug_type, 
      dosage_form, 
      strength, 
      unit, 
      description, 
      side_effects, 
      contraindications, 
      storage_conditions, 
      expiry_date, 
      is_prescription_required 
    } = await request.json();

    if (!drug_name) {
      return NextResponse.json({
        success: false,
        message: 'Drug name is required'
      }, { status: 400 });
    }

    connection = await pool.getConnection();

    // Check if drug already exists
    const [existing] = await connection.execute(
      'SELECT id FROM drugs WHERE drug_name = ?',
      [drug_name]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Drug already exists'
      }, { status: 409 });
    }

    // Insert new drug
    const [result] = await connection.execute(
      `INSERT INTO drugs (
        drug_name, generic_name, manufacturer, drug_type, dosage_form, 
        strength, unit, description, side_effects, contraindications, 
        storage_conditions, expiry_date, is_prescription_required, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        drug_name, 
        generic_name || null, 
        manufacturer || null, 
        drug_type || 'other', 
        dosage_form || 'tablet', 
        strength || null, 
        unit || 'mg', 
        description || null, 
        side_effects || null, 
        contraindications || null, 
        storage_conditions || null, 
        expiry_date || null, 
        is_prescription_required !== false, 
        1
      ]
    );

    const insertResult = result as any;
    const drugId = insertResult.insertId;

    // Get the created drug
    const [drugs] = await connection.execute(
      'SELECT * FROM drugs WHERE id = ?',
      [drugId]
    );

    return NextResponse.json({
      success: true,
      message: 'Drug created successfully',
      data: drugs[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating drug:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create drug'
    }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
