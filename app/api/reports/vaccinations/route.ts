import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

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

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [summaryRows] = await connection.execute(
      `
        SELECT
          COALESCE(SUM(bv.quantity), COUNT(bv.vaccination_id)) AS totalVaccinations,
          COUNT(DISTINCT bv.vaccine_name) AS vaccineTypes
        FROM bill_vaccinations bv
        JOIN bills b ON bv.bill_id = b.bill_id
        ${whereClause}
      `,
      params
    );

    const [vaccineRows] = await connection.execute(
      `
        SELECT 
          bv.vaccine_name,
          COUNT(*) AS vaccination_entries,
          COALESCE(SUM(bv.quantity), COUNT(*)) AS vaccination_quantity,
          COALESCE(SUM(bs.quantity), 0) AS service_entries
        FROM bill_vaccinations bv
        JOIN bills b ON bv.bill_id = b.bill_id
        LEFT JOIN bill_services bs ON bs.bill_id = b.bill_id AND bs.service_name = bv.vaccine_name
        ${whereClause}
        GROUP BY bv.vaccine_name
        ORDER BY vaccination_quantity DESC
      `,
      params
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: Array.isArray(summaryRows) && summaryRows[0] ? summaryRows[0] : { totalVaccinations: 0, vaccineTypes: 0 },
        vaccines: vaccineRows || [],
        dateRange: { startDate, endDate }
      }
    });
  } catch (error) {
    console.error('Error loading vaccination sales report:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to load vaccination sales report' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
