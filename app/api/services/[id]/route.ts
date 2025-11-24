import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [rows] = await connection.execute(
      'SELECT * FROM services WHERE id = ? AND is_active = 1',
      [params.id]
    );

    if (Array.isArray(rows) && rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Service not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch service'
    }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  try {
    const { 
      service_name, 
      service_type, 
      description, 
      duration_minutes, 
      base_price, 
      is_recurring, 
      requires_appointment 
    } = await request.json();

    if (!service_name || !base_price) {
      return NextResponse.json({
        success: false,
        message: 'Service name and base price are required'
      }, { status: 400 });
    }

    connection = await pool.getConnection();

    // Check if service exists
    const [existing] = await connection.execute(
      'SELECT id FROM services WHERE id = ? AND is_active = 1',
      [params.id]
    );

    if (Array.isArray(existing) && existing.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Service not found'
      }, { status: 404 });
    }

    // Check if new name conflicts with existing service
    const [conflict] = await connection.execute(
      'SELECT id FROM services WHERE service_name = ? AND id != ?',
      [service_name, params.id]
    );

    if (Array.isArray(conflict) && conflict.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Service name already exists'
      }, { status: 409 });
    }

    // Update service
    await connection.execute(
      `UPDATE services 
       SET service_name = ?, service_type = ?, description = ?, duration_minutes = ?, 
           base_price = ?, is_recurring = ?, requires_appointment = ?, updated_by = ?, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        service_name, 
        service_type || 'consultation', 
        description || null, 
        duration_minutes || 30, 
        base_price, 
        is_recurring || false, 
        requires_appointment !== false, 
        1, 
        params.id
      ]
    );

    // Get updated service
    const [services] = await connection.execute(
      'SELECT * FROM services WHERE id = ?',
      [params.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Service updated successfully',
      data: services[0]
    });

  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update service'
    }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  try {
    connection = await pool.getConnection();

    // Check if service exists
    const [existing] = await connection.execute(
      'SELECT id FROM services WHERE id = ? AND is_active = 1',
      [params.id]
    );

    if (Array.isArray(existing) && existing.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Service not found'
      }, { status: 404 });
    }

    // Soft delete service
    await connection.execute(
      'UPDATE services SET is_active = 0, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [1, params.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete service'
    }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
