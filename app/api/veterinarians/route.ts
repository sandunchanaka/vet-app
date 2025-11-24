import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
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
      WHERE is_active = 1
      ORDER BY created_at DESC
    `;
    
    const [rows] = await connection.execute(query);
    
    return NextResponse.json({
      success: true,
      data: rows
    });
    
  } catch (error) {
    console.error('Error fetching veterinarians:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch veterinarians'
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
    
    // Check if email already exists
    const [existingVet] = await connection.execute(
      'SELECT vet_id FROM veterinarians WHERE email = ?',
      [email]
    );

    if ((existingVet as any[]).length > 0) {
      return NextResponse.json({
        success: false,
        message: 'A veterinarian with this email already exists'
      }, { status: 400 });
    }

    // Check if license number already exists (if provided)
    if (license_number) {
      const [existingLicense] = await connection.execute(
        'SELECT vet_id FROM veterinarians WHERE license_number = ?',
        [license_number]
      );

      if ((existingLicense as any[]).length > 0) {
        return NextResponse.json({
          success: false,
          message: 'A veterinarian with this license number already exists'
        }, { status: 400 });
      }
    }

    // Create the veterinarian
    const [vetResult] = await connection.execute(
      `INSERT INTO veterinarians (first_name, last_name, email, phone, license_number, specialization, experience_years, qualification, address, date_of_birth, gender) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        gender || null
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Veterinarian created successfully',
      data: { vet_id: (vetResult as any).insertId }
    });

  } catch (error) {
    console.error('Error creating veterinarian:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create veterinarian'
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
