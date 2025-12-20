import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const doctorId = searchParams.get('doctorId');
  const petId = searchParams.get('petId');

  if (!startDate || !endDate) {
    return NextResponse.json(
      { success: false, message: 'startDate and endDate are required' },
      { status: 400 }
    );
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const conditions: string[] = ['b.billing_date BETWEEN ? AND ?'];
    const params: any[] = [startDate, endDate];

    if (doctorId && doctorId !== 'any') {
      conditions.push('b.veterinarian_id = ?');
      params.push(doctorId);
    }

    if (petId && petId !== 'any') {
      conditions.push('b.pet_id = ?');
      params.push(petId);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [bills] = await connection.execute(
      `
        SELECT 
          b.bill_id,
          b.bill_number,
          b.billing_date,
          b.grand_total,
          b.net_total,
          b.discount_amount,
          b.status,
          b.pet_id,
          p.name AS pet_name,
          p.pet_code,
          p.owner_id,
          po.owner_name,
          po.phone AS owner_phone,
          b.veterinarian_id,
          v.first_name AS vet_first_name,
          v.last_name AS vet_last_name
        FROM bills b
        LEFT JOIN pets p ON b.pet_id = p.pet_id
        LEFT JOIN pet_owners po ON b.owner_id = po.owner_id
        LEFT JOIN veterinarians v ON b.veterinarian_id = v.vet_id
        ${whereClause}
        ORDER BY b.billing_date DESC, b.created_at DESC
      `,
      params
    );

    const [trend] = await connection.execute(
      `
        SELECT 
          DATE(b.billing_date) AS billing_day,
          SUM(b.grand_total) AS total_amount,
          COUNT(*) AS bill_count
        FROM bills b
        ${whereClause}
        GROUP BY DATE(b.billing_date)
        ORDER BY billing_day ASC
      `,
      params
    );

    const [revenueByDoctor] = await connection.execute(
      `
        SELECT 
          b.veterinarian_id AS doctor_id,
          CONCAT(v.first_name, ' ', v.last_name) AS doctor_name,
          SUM(b.grand_total) AS total_amount
        FROM bills b
        LEFT JOIN veterinarians v ON b.veterinarian_id = v.vet_id
        ${whereClause}
        GROUP BY b.veterinarian_id, v.first_name, v.last_name
        ORDER BY total_amount DESC
      `,
      params
    );

    const numericTotal = (bills as any[]).reduce((sum, row) => sum + (Number(row.grand_total) || 0), 0);
    const totalBills = Array.isArray(bills) ? bills.length : 0;

    return NextResponse.json({
      success: true,
      data: {
        bills,
        summary: {
          totalBills,
          totalAmount: numericTotal,
          averagePerBill: totalBills > 0 ? numericTotal / totalBills : 0
        },
        revenueTrend: trend,
        revenueByDoctor
      }
    });
  } catch (error) {
    console.error('Error loading billing search report:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to load billing report' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
