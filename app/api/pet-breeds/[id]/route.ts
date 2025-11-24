import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [rows] = await connection.execute(`
      SELECT pb.*, pc.category_name
      FROM pet_breeds pb
      LEFT JOIN pet_categories pc ON pb.category_id = pc.id
      WHERE pb.id = ? AND pb.is_active = 1
    `, [params.id]);

    if (Array.isArray(rows) && rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Pet breed not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching pet breed:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch pet breed'
    }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Check if breed exists
    const [existing] = await connection.execute(
      'SELECT id FROM pet_breeds WHERE id = ? AND is_active = 1',
      [params.id]
    );

    if (Array.isArray(existing) && existing.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Pet breed not found'
      }, { status: 404 });
    }

    // Check if new name conflicts with existing breed in same category
    const [conflict] = await connection.execute(
      'SELECT id FROM pet_breeds WHERE breed_name = ? AND category_id = ? AND id != ?',
      [breed_name, category_id, params.id]
    );

    if (Array.isArray(conflict) && conflict.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Pet breed name already exists in this category'
      }, { status: 409 });
    }

    // Update breed
    await connection.execute(
      `UPDATE pet_breeds 
       SET breed_name = ?, category_id = ?, description = ?, average_weight = ?, 
           average_lifespan = ?, temperament = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        breed_name, 
        category_id, 
        description || null, 
        average_weight || null, 
        average_lifespan || null, 
        temperament || null, 
        1, 
        params.id
      ]
    );

    // Get updated breed with category name
    const [breeds] = await connection.execute(`
      SELECT pb.*, pc.category_name
      FROM pet_breeds pb
      LEFT JOIN pet_categories pc ON pb.category_id = pc.id
      WHERE pb.id = ?
    `, [params.id]);

    return NextResponse.json({
      success: true,
      message: 'Pet breed updated successfully',
      data: breeds[0]
    });

  } catch (error) {
    console.error('Error updating pet breed:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update pet breed'
    }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  try {
    connection = await pool.getConnection();

    // Check if breed exists
    const [existing] = await connection.execute(
      'SELECT id FROM pet_breeds WHERE id = ? AND is_active = 1',
      [params.id]
    );

    if (Array.isArray(existing) && existing.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Pet breed not found'
      }, { status: 404 });
    }

    // Soft delete breed
    await connection.execute(
      'UPDATE pet_breeds SET is_active = 0, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [1, params.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Pet breed deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting pet breed:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete pet breed'
    }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
