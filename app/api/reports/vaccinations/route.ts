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

    const params: any[] = [startDate, endDate];

    const [summaryRows] = await connection.execute(
      `
        SELECT
          COUNT(*) AS totalVaccinations,
          COUNT(DISTINCT COALESCE(vt.id, bv.vaccine_id, bv.vaccine_name)) AS vaccineTypes,
          COALESCE(SUM(COALESCE(vt.price, 0)), 0) AS totalRevenue
        FROM bill_vaccinations bv
        JOIN bills b ON bv.bill_id = b.bill_id AND b.billing_date BETWEEN ? AND ?
        LEFT JOIN vaccination_types vt ON vt.id = bv.vaccine_id OR vt.vaccine_name = bv.vaccine_name
      `,
      params
    );

    const [vaccineRows] = await connection.execute(
      `
        SELECT 
          COALESCE(vt.vaccine_name, bv.vaccine_name) AS vaccine_name,
          COALESCE(vt.id, bv.vaccine_id, bv.vaccine_name) AS vaccine_id,
          COUNT(*) AS vaccination_count,
          COALESCE(vt.price, 0) AS unit_price,
          COUNT(*) * COALESCE(vt.price, 0) AS total_amount
        FROM bill_vaccinations bv
        JOIN bills b ON bv.bill_id = b.bill_id AND b.billing_date BETWEEN ? AND ?
        LEFT JOIN vaccination_types vt ON vt.id = bv.vaccine_id OR vt.vaccine_name = bv.vaccine_name
        GROUP BY COALESCE(vt.id, bv.vaccine_id, bv.vaccine_name), COALESCE(vt.vaccine_name, bv.vaccine_name), vt.price
        ORDER BY vaccination_count DESC, vaccine_name ASC
      `,
      params
    );

    const rawSummary = Array.isArray(summaryRows) && summaryRows[0] ? summaryRows[0] : { totalVaccinations: 0, vaccineTypes: 0, totalRevenue: 0 };
    const summary = {
      totalVaccinations: Number((rawSummary as any).totalVaccinations) || 0,
      vaccineTypes: Number((rawSummary as any).vaccineTypes) || 0,
      totalRevenue: Number((rawSummary as any).totalRevenue) || 0
    };

    const vaccines = Array.isArray(vaccineRows)
      ? (vaccineRows as any[]).map((row) => ({
          vaccine_name: row.vaccine_name,
          vaccine_id: row.vaccine_id,
          vaccination_count: Number(row.vaccination_count) || 0,
          unit_price: Number(row.unit_price) || 0,
          total_amount: Number(row.total_amount) || 0
        }))
      : [];

    return NextResponse.json({
      success: true,
      data: {
        summary,
        vaccines,
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
