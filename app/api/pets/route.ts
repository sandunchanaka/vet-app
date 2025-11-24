import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { generatePetCode } from '@/lib/pet-code-generator';

export async function GET(request: NextRequest) {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    const query = `
      SELECT 
        p.pet_id,
        p.pet_code,
        p.name,
        p.gender,
        p.date_of_birth,
        p.age_months,
        p.weight,
        p.color,
        p.remarks,
        p.is_active,
        p.created_at,
        p.updated_at,
        p.pet_category_id,
        p.breed_id,
        p.owner_id,
        pc.category_name,
        pb.breed_name,
        po.owner_name,
        po.nic as owner_nic,
        po.phone as owner_phone,
        po.address as owner_address,
        po.email as owner_email
      FROM pets p
      LEFT JOIN pet_categories pc ON p.pet_category_id = pc.id
      LEFT JOIN pet_breeds pb ON p.breed_id = pb.id
      LEFT JOIN pet_owners po ON p.owner_id = po.owner_id
      WHERE p.is_active = 1
      ORDER BY p.created_at DESC
    `;
    
    const [rows] = await connection.execute(query);
    
    return NextResponse.json({
      success: true,
      data: rows
    });
    
  } catch (error) {
    console.error('Error fetching pets:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch pets'
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
      name,
      gender,
      date_of_birth,
      age_months,
      pet_category_id,
      breed_id,
      weight,
      color,
      remarks,
      owner_name,
      owner_nic,
      owner_phone,
      owner_address,
      owner_email
    } = body;

    // Validate required fields
    if (!name || !gender || !pet_category_id) {
      return NextResponse.json({
        success: false,
        message: 'Name, gender, and pet category are required'
      }, { status: 400 });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // First, create or find the pet owner
      let ownerId;
      
      if (owner_nic) {
        // Check if owner with this NIC already exists
        const [existingOwner] = await connection.execute(
          'SELECT owner_id FROM pet_owners WHERE nic = ?',
          [owner_nic]
        );
        
        if (existingOwner.length > 0) {
          ownerId = existingOwner[0].owner_id;
        } else {
          // Create new owner
          const [ownerResult] = await connection.execute(
            'INSERT INTO pet_owners (owner_name, nic, phone, address, email) VALUES (?, ?, ?, ?, ?)',
            [owner_name, owner_nic, owner_phone, owner_address, owner_email]
          );
          ownerId = (ownerResult as any).insertId;
        }
      } else {
        // Create owner without NIC
        const [ownerResult] = await connection.execute(
          'INSERT INTO pet_owners (owner_name, phone, address, email) VALUES (?, ?, ?, ?)',
          [owner_name, owner_phone, owner_address, owner_email]
        );
        ownerId = (ownerResult as any).insertId;
      }

      // Generate pet code
      const petCode = await generatePetCode();

      // Create the pet
      const [petResult] = await connection.execute(
        `INSERT INTO pets (pet_code, name, gender, date_of_birth, age_months, pet_category_id, breed_id, weight, color, remarks, owner_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          petCode,
          name, 
          gender, 
          date_of_birth ? new Date(date_of_birth).toISOString().split('T')[0] : null, 
          age_months ? parseInt(age_months) : null, 
          parseInt(pet_category_id), 
          breed_id ? parseInt(breed_id) : null, 
          weight ? parseFloat(weight) : null, 
          color || null, 
          remarks || null, 
          ownerId
        ]
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: 'Pet created successfully',
        data: { pet_id: (petResult as any).insertId, owner_id: ownerId }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error creating pet:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create pet'
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
