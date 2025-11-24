import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [rows] = await connection.execute(`
      SELECT pb.*, 
             pc.category_name,
             u1.first_name as created_by_name,
             u2.first_name as updated_by_name
      FROM pet_breeds pb
      LEFT JOIN pet_categories pc ON pb.category_id = pc.id
      LEFT JOIN users u1 ON pb.created_by = u1.id
      LEFT JOIN users u2 ON pb.updated_by = u2.id
      WHERE pb.is_active = 1
      ORDER BY pb.breed_name ASC
    `);

    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching pet breeds:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch pet breeds'
    }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function POST(request: NextRequest) {
  let connection;
  try {
    const { 
      breed_name, 
      category_id, 
      description, 
      average_weight, 
      average_lifespan, 
      temperament 
    } = await request.json();

    if (!breed_name || !category_id) {
      return NextResponse.json({
        success: false,
        message: 'Breed name and category are required'
      }, { status: 400 });
    }

    connection = await pool.getConnection();

    // Check if breed already exists
    const [existing] = await connection.execute(
      'SELECT id FROM pet_breeds WHERE breed_name = ? AND category_id = ?',
      [breed_name, category_id]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Pet breed already exists in this category'
      }, { status: 409 });
    }

    // Insert new breed
    const [result] = await connection.execute(
      `INSERT INTO pet_breeds (
        breed_name, category_id, description, average_weight, 
        average_lifespan, temperament, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        breed_name, 
        category_id, 
        description || null, 
        average_weight || null, 
        average_lifespan || null, 
        temperament || null, 
        1
      ]
    );

    const insertResult = result as any;
    const breedId = insertResult.insertId;

    // Get the created breed with category name
    const [breeds] = await connection.execute(`
      SELECT pb.*, pc.category_name
      FROM pet_breeds pb
      LEFT JOIN pet_categories pc ON pb.category_id = pc.id
      WHERE pb.id = ?
    `, [breedId]);

    return NextResponse.json({
      success: true,
      message: 'Pet breed created successfully',
      data: breeds[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating pet breed:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create pet breed'
    }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
