import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  let connection;
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract search parameters
    const pet_code = searchParams.get('pet_code') || '';
    const pet_name = searchParams.get('pet_name') || '';
    const pet_category = searchParams.get('pet_category') || '';
    const breed = searchParams.get('breed') || '';
    const owner_name = searchParams.get('owner_name') || '';
    const owner_phone = searchParams.get('owner_phone') || '';
    const owner_email = searchParams.get('owner_email') || '';
    const owner_nic = searchParams.get('owner_nic') || '';

    connection = await pool.getConnection();
    
    // Build the base query
    let query = `
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
    `;
    
    const conditions: string[] = [];
    const params: any[] = [];
    
    // Add search conditions
    if (pet_code) {
      conditions.push('p.pet_code LIKE ?');
      params.push(`%${pet_code}%`);
    }
    
    if (pet_name) {
      conditions.push('p.name LIKE ?');
      params.push(`%${pet_name}%`);
    }
    
    if (pet_category) {
      conditions.push('p.pet_category_id = ?');
      params.push(parseInt(pet_category));
    }
    
    if (breed) {
      conditions.push('p.breed_id = ?');
      params.push(parseInt(breed));
    }
    
    if (owner_name) {
      conditions.push('po.owner_name LIKE ?');
      params.push(`%${owner_name}%`);
    }
    
    if (owner_phone) {
      conditions.push('po.phone LIKE ?');
      params.push(`%${owner_phone}%`);
    }
    
    if (owner_email) {
      conditions.push('po.email LIKE ?');
      params.push(`%${owner_email}%`);
    }
    
    if (owner_nic) {
      conditions.push('po.nic LIKE ?');
      params.push(`%${owner_nic}%`);
    }
    
    // Add conditions to query
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY p.created_at DESC';
    
    const [rows] = await connection.execute(query, params);
    
    return NextResponse.json({
      success: true,
      data: rows
    });
    
  } catch (error) {
    console.error('Error searching pets:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to search pets'
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
