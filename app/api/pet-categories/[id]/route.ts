import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [rows] = await connection.execute(
      'SELECT * FROM pet_categories WHERE id = ? AND is_active = 1',
      [params.id]
    );

    if (Array.isArray(rows) && rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Pet category not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching pet category:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch pet category'
    }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Check if category exists
    const [existing] = await connection.execute(
      'SELECT id FROM pet_categories WHERE id = ? AND is_active = 1',
      [params.id]
    );

    if (Array.isArray(existing) && existing.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Pet category not found'
      }, { status: 404 });
    }

    // Check if new name conflicts with existing category
    const [conflict] = await connection.execute(
      'SELECT id FROM pet_categories WHERE category_name = ? AND id != ?',
      [category_name, params.id]
    );

    if (Array.isArray(conflict) && conflict.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Pet category name already exists'
      }, { status: 409 });
    }

    // Update category
    await connection.execute(
      `UPDATE pet_categories 
       SET category_name = ?, description = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [category_name, description || null, 1, params.id]
    );

    // Get updated category
    const [categories] = await connection.execute(
      'SELECT * FROM pet_categories WHERE id = ?',
      [params.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Pet category updated successfully',
      data: categories[0]
    });

  } catch (error) {
    console.error('Error updating pet category:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update pet category'
    }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  try {
    connection = await pool.getConnection();

    // Check if category exists
    const [existing] = await connection.execute(
      'SELECT id FROM pet_categories WHERE id = ? AND is_active = 1',
      [params.id]
    );

    if (Array.isArray(existing) && existing.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Pet category not found'
      }, { status: 404 });
    }

    // Soft delete category
    await connection.execute(
      'UPDATE pet_categories SET is_active = 0, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [1, params.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Pet category deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting pet category:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete pet category'
    }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
