import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [rows] = await connection.execute(`
      SELECT pc.*, 
             u1.first_name as created_by_name,
             u2.first_name as updated_by_name
      FROM pet_categories pc
      LEFT JOIN users u1 ON pc.created_by = u1.id
      LEFT JOIN users u2 ON pc.updated_by = u2.id
      WHERE pc.is_active = 1
      ORDER BY pc.category_name ASC
    `);

    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching pet categories:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch pet categories'
    }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function POST(request: NextRequest) {
  let connection;
  try {
    const { category_name, description } = await request.json();

    if (!category_name) {
      return NextResponse.json({
        success: false,
        message: 'Category name is required'
      }, { status: 400 });
    }

    connection = await pool.getConnection();

    // Check if category already exists
    const [existing] = await connection.execute(
      'SELECT id FROM pet_categories WHERE category_name = ?',
      [category_name]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Pet category already exists'
      }, { status: 409 });
    }

    // Insert new category
    const [result] = await connection.execute(
      `INSERT INTO pet_categories (category_name, description, created_by) 
       VALUES (?, ?, ?)`,
      [category_name, description || null, 1] // Using admin user ID
    );

    const insertResult = result as any;
    const categoryId = insertResult.insertId;

    // Get the created category
    const [categories] = await connection.execute(
      'SELECT * FROM pet_categories WHERE id = ?',
      [categoryId]
    );

    return NextResponse.json({
      success: true,
      message: 'Pet category created successfully',
      data: categories[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating pet category:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create pet category'
    }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
