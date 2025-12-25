import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const doctorId = searchParams.get('doctorId');

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

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [summaryRows] = await connection.execute(
      `
        SELECT 
          COUNT(*) AS totalInvoices,
          COALESCE(SUM(bs.quantity), 0) AS totalServices,
          COUNT(DISTINCT b.veterinarian_id) AS totalDoctors
        FROM bills b
        LEFT JOIN bill_services bs ON bs.bill_id = b.bill_id
        ${whereClause}
      `,
      params
    );

    const [doctorRows] = await connection.execute(
      `
        SELECT 
          b.veterinarian_id AS doctor_id,
          CONCAT(v.first_name, ' ', v.last_name) AS doctor_name,
          COUNT(*) AS invoice_count,
          COALESCE(SUM(bs.quantity), 0) AS service_count
        FROM bills b
        LEFT JOIN veterinarians v ON b.veterinarian_id = v.vet_id
        LEFT JOIN bill_services bs ON bs.bill_id = b.bill_id
        ${whereClause}
        GROUP BY b.veterinarian_id, v.first_name, v.last_name
        ORDER BY invoice_count DESC
      `,
      params
    );

    const [serviceBreakdownRows] = await connection.execute(
      `
        SELECT 
          b.veterinarian_id AS doctor_id,
          CONCAT(v.first_name, ' ', v.last_name) AS doctor_name,
          bs.service_name,
          SUM(bs.quantity) AS quantity
        FROM bills b
        JOIN bill_services bs ON bs.bill_id = b.bill_id
        LEFT JOIN veterinarians v ON b.veterinarian_id = v.vet_id
        ${whereClause}
        GROUP BY b.veterinarian_id, v.first_name, v.last_name, bs.service_name
        ORDER BY quantity DESC
      `,
      params
    );

    const [topServicesRows] = await connection.execute(
      `
        SELECT 
          bs.service_name,
          SUM(bs.quantity) AS total_quantity
        FROM bills b
        JOIN bill_services bs ON bs.bill_id = b.bill_id
        ${whereClause}
        GROUP BY bs.service_name
        ORDER BY total_quantity DESC
        LIMIT 20
      `,
      params
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: Array.isArray(summaryRows) && summaryRows[0] ? summaryRows[0] : { totalInvoices: 0, totalServices: 0, totalDoctors: 0 },
        doctors: doctorRows || [],
        serviceBreakdown: serviceBreakdownRows || [],
        topServices: topServicesRows || [],
        dateRange: { startDate, endDate }
      }
    });
  } catch (error) {
    console.error('Error loading doctor report:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to load doctor report' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
