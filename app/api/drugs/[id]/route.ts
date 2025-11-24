import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [rows] = await connection.execute(
      'SELECT * FROM drugs WHERE id = ? AND is_active = 1',
      [params.id]
    );

    if (Array.isArray(rows) && rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Drug not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching drug:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch drug'
    }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Check if drug exists
    const [existing] = await connection.execute(
      'SELECT id FROM drugs WHERE id = ? AND is_active = 1',
      [params.id]
    );

    if (Array.isArray(existing) && existing.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Drug not found'
      }, { status: 404 });
    }

    // Check if new name conflicts with existing drug
    const [conflict] = await connection.execute(
      'SELECT id FROM drugs WHERE drug_name = ? AND id != ?',
      [drug_name, params.id]
    );

    if (Array.isArray(conflict) && conflict.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Drug name already exists'
      }, { status: 409 });
    }

    // Update drug
    await connection.execute(
      `UPDATE drugs 
       SET drug_name = ?, generic_name = ?, manufacturer = ?, drug_type = ?, 
           dosage_form = ?, strength = ?, unit = ?, description = ?, 
           side_effects = ?, contraindications = ?, storage_conditions = ?, 
           expiry_date = ?, is_prescription_required = ?, updated_by = ?, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
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
        1, 
        params.id
      ]
    );

    // Get updated drug
    const [drugs] = await connection.execute(
      'SELECT * FROM drugs WHERE id = ?',
      [params.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Drug updated successfully',
      data: drugs[0]
    });

  } catch (error) {
    console.error('Error updating drug:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update drug'
    }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  try {
    connection = await pool.getConnection();

    // Check if drug exists
    const [existing] = await connection.execute(
      'SELECT id FROM drugs WHERE id = ? AND is_active = 1',
      [params.id]
    );

    if (Array.isArray(existing) && existing.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Drug not found'
      }, { status: 404 });
    }

    // Soft delete drug
    await connection.execute(
      'UPDATE drugs SET is_active = 0, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [1, params.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Drug deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting drug:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete drug'
    }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
