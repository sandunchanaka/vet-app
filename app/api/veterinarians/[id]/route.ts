import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    const query = `
      SELECT 
        vet_id,
        first_name,
        last_name,
        email,
        phone,
        license_number,
        specialization,
        experience_years,
        qualification,
        address,
        date_of_birth,
        gender,
        is_active,
        created_at,
        updated_at
      FROM veterinarians
      WHERE vet_id = ? AND is_active = 1
    `;
    
    const [rows] = await connection.execute(query, [params.id]);
    
    if ((rows as any[]).length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Veterinarian not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: (rows as any[])[0]
    });
    
  } catch (error) {
    console.error('Error fetching veterinarian:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch veterinarian'
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  
  try {
    const body = await request.json();
    const {
      first_name,
      last_name,
      email,
      phone,
      license_number,
      specialization,
      experience_years,
      qualification,
      address,
      date_of_birth,
      gender
    } = body;

    // Validate required fields
    if (!first_name || !last_name || !email) {
      return NextResponse.json({
        success: false,
        message: 'First name, last name, and email are required'
      }, { status: 400 });
    }

    connection = await pool.getConnection();
    
    // Check if email already exists for another veterinarian
    const [existingVet] = await connection.execute(
      'SELECT vet_id FROM veterinarians WHERE email = ? AND vet_id != ?',
      [email, params.id]
    );

    if ((existingVet as any[]).length > 0) {
      return NextResponse.json({
        success: false,
        message: 'A veterinarian with this email already exists'
      }, { status: 400 });
    }

    // Check if license number already exists for another veterinarian (if provided)
    if (license_number) {
      const [existingLicense] = await connection.execute(
        'SELECT vet_id FROM veterinarians WHERE license_number = ? AND vet_id != ?',
        [license_number, params.id]
      );

      if ((existingLicense as any[]).length > 0) {
        return NextResponse.json({
          success: false,
          message: 'A veterinarian with this license number already exists'
        }, { status: 400 });
      }
    }

    // Update the veterinarian
    await connection.execute(
      `UPDATE veterinarians SET 
       first_name = ?, last_name = ?, email = ?, phone = ?, license_number = ?, 
       specialization = ?, experience_years = ?, qualification = ?, address = ?, 
       date_of_birth = ?, gender = ?
       WHERE vet_id = ?`,
      [
        first_name,
        last_name,
        email,
        phone || null,
        license_number || null,
        specialization || null,
        experience_years ? parseInt(experience_years) : null,
        qualification || null,
        address || null,
        date_of_birth ? new Date(date_of_birth).toISOString().split('T')[0] : null,
        gender || null,
        params.id
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Veterinarian updated successfully'
    });

  } catch (error) {
    console.error('Error updating veterinarian:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update veterinarian'
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    // Soft delete - set is_active to false
    const [result] = await connection.execute(
      'UPDATE veterinarians SET is_active = 0 WHERE vet_id = ?',
      [params.id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({
        success: false,
        message: 'Veterinarian not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Veterinarian deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting veterinarian:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete veterinarian'
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
