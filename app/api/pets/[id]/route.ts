import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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
      WHERE p.pet_id = ? AND p.is_active = 1
    `;
    
    const [rows] = await connection.execute(query, [params.id]);
    
    if ((rows as any[]).length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Pet not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: (rows as any[])[0]
    });
    
  } catch (error) {
    console.error('Error fetching pet:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch pet'
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
      // Get current pet to find owner_id
      const [currentPet] = await connection.execute(
        'SELECT owner_id FROM pets WHERE pet_id = ?',
        [params.id]
      );

      if ((currentPet as any[]).length === 0) {
        await connection.rollback();
        return NextResponse.json({
          success: false,
          message: 'Pet not found'
        }, { status: 404 });
      }

      const currentOwnerId = (currentPet as any[])[0].owner_id;

      // Update pet owner information
      await connection.execute(
        'UPDATE pet_owners SET owner_name = ?, nic = ?, phone = ?, address = ?, email = ? WHERE owner_id = ?',
        [owner_name, owner_nic, owner_phone, owner_address, owner_email, currentOwnerId]
      );

      // Update the pet
      await connection.execute(
        `UPDATE pets SET 
         name = ?, gender = ?, date_of_birth = ?, age_months = ?, 
         pet_category_id = ?, breed_id = ?, weight = ?, color = ?, remarks = ?
         WHERE pet_id = ?`,
        [
          name, 
          gender, 
          date_of_birth ? new Date(date_of_birth).toISOString().split('T')[0] : null, 
          age_months ? parseInt(age_months) : null, 
          parseInt(pet_category_id), 
          breed_id ? parseInt(breed_id) : null, 
          weight ? parseFloat(weight) : null, 
          color || null, 
          remarks || null, 
          params.id
        ]
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: 'Pet updated successfully'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error updating pet:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update pet'
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
      'UPDATE pets SET is_active = 0 WHERE pet_id = ?',
      [params.id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({
        success: false,
        message: 'Pet not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Pet deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting pet:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete pet'
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
