import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [rows] = await connection.execute(`
      SELECT s.*, 
             u1.first_name as created_by_name,
             u2.first_name as updated_by_name
      FROM services s
      LEFT JOIN users u1 ON s.created_by = u1.id
      LEFT JOIN users u2 ON s.updated_by = u2.id
      WHERE s.is_active = 1
      ORDER BY s.service_name ASC
    `);

    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch services'
    }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function POST(request: NextRequest) {
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

    // Check if service already exists
    const [existing] = await connection.execute(
      'SELECT id FROM services WHERE service_name = ?',
      [service_name]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Service already exists'
      }, { status: 409 });
    }

    // Insert new service
    const [result] = await connection.execute(
      `INSERT INTO services (
        service_name, service_type, description, duration_minutes, 
        base_price, is_recurring, requires_appointment, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        service_name, 
        service_type || 'consultation', 
        description || null, 
        duration_minutes || 30, 
        base_price, 
        is_recurring || false, 
        requires_appointment !== false, 
        1
      ]
    );

    const insertResult = result as any;
    const serviceId = insertResult.insertId;

    // Get the created service
    const [services] = await connection.execute(
      'SELECT * FROM services WHERE id = ?',
      [serviceId]
    );

    return NextResponse.json({
      success: true,
      message: 'Service created successfully',
      data: services[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create service'
    }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
