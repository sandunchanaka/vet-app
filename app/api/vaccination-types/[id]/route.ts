import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [rows] = await connection.execute(
      'SELECT * FROM vaccination_types WHERE id = ? AND is_active = 1',
      [params.id]
    );

    if (Array.isArray(rows) && rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Vaccination type not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching vaccination type:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch vaccination type'
    }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Check if vaccination type exists
    const [existing] = await connection.execute(
      'SELECT id FROM vaccination_types WHERE id = ? AND is_active = 1',
      [params.id]
    );

    if (Array.isArray(existing) && existing.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Vaccination type not found'
      }, { status: 404 });
    }

    // Check if new name conflicts with existing vaccination type
    const [conflict] = await connection.execute(
      'SELECT id FROM vaccination_types WHERE vaccine_name = ? AND id != ?',
      [vaccine_name, params.id]
    );

    if (Array.isArray(conflict) && conflict.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Vaccination type name already exists'
      }, { status: 409 });
    }

    // Update vaccination type
    await connection.execute(
      `UPDATE vaccination_types 
       SET vaccine_name = ?, vaccine_type = ?, target_species = ?, age_requirement_months = ?, 
           frequency_months = ?, description = ?, side_effects = ?, contraindications = ?, price = ?, 
           updated_by = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
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
        1, 
        params.id
      ]
    );

    // Get updated vaccination type
    const [vaccines] = await connection.execute(
      'SELECT * FROM vaccination_types WHERE id = ?',
      [params.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Vaccination type updated successfully',
      data: vaccines[0]
    });

  } catch (error) {
    console.error('Error updating vaccination type:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update vaccination type'
    }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  try {
    connection = await pool.getConnection();

    // Check if vaccination type exists
    const [existing] = await connection.execute(
      'SELECT id FROM vaccination_types WHERE id = ? AND is_active = 1',
      [params.id]
    );

    if (Array.isArray(existing) && existing.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Vaccination type not found'
      }, { status: 404 });
    }

    // Soft delete vaccination type
    await connection.execute(
      'UPDATE vaccination_types SET is_active = 0, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [1, params.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Vaccination type deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting vaccination type:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete vaccination type'
    }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
