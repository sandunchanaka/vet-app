import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

const getDefaultDateRange = () => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const format = (date: Date) => date.toISOString().split('T')[0];

  return {
    startDate: format(start),
    endDate: format(end)
  };
};

export async function GET(request: NextRequest) {
  let connection;

  try {
    const url = new URL(request.url);
    const defaults = getDefaultDateRange();

    const startDate = url.searchParams.get('startDate') || defaults.startDate;
    const endDate = url.searchParams.get('endDate') || defaults.endDate;
    const doctorId = url.searchParams.get('doctorId');
    const petId = url.searchParams.get('petId');

    connection = await pool.getConnection();

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (startDate) {
      conditions.push('DATE(b.billing_date) >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('DATE(b.billing_date) <= ?');
      params.push(endDate);
    }

    if (doctorId && doctorId !== 'any') {
      conditions.push('b.veterinarian_id = ?');
      params.push(Number(doctorId));
    }

    if (petId && petId !== 'any') {
      conditions.push('b.pet_id = ?');
      params.push(Number(petId));
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const summaryQuery = `
      SELECT 
        COUNT(*) AS bill_count,
        COALESCE(SUM(b.grand_total), 0) AS total_billing
      FROM bills b
      ${whereClause}
    `;

    const trendQuery = `
      SELECT 
        DATE(b.billing_date) AS billing_day,
        COALESCE(SUM(b.grand_total), 0) AS total_amount,
        COUNT(*) AS bill_count
      FROM bills b
      ${whereClause}
      GROUP BY DATE(b.billing_date)
      ORDER BY billing_day ASC
    `;

    const revenueByDoctorQuery = `
      SELECT 
        b.veterinarian_id AS doctor_id,
        COALESCE(CONCAT(v.first_name, ' ', v.last_name), 'Unknown Doctor') AS doctor_name,
        COALESCE(SUM(b.grand_total), 0) AS total_amount
      FROM bills b
      LEFT JOIN veterinarians v ON b.veterinarian_id = v.vet_id
      ${whereClause}
      GROUP BY b.veterinarian_id, v.first_name, v.last_name
      HAVING total_amount > 0
      ORDER BY total_amount DESC
    `;

    const billsQuery = `
      SELECT 
        b.bill_id,
        b.bill_number,
        b.billing_date,
        b.grand_total,
        b.status,
        p.pet_id,
        p.name AS pet_name,
        b.veterinarian_id,
        v.first_name AS vet_first_name,
        v.last_name AS vet_last_name
      FROM bills b
      LEFT JOIN pets p ON b.pet_id = p.pet_id
      LEFT JOIN veterinarians v ON b.veterinarian_id = v.vet_id
      ${whereClause}
      ORDER BY b.billing_date DESC, b.bill_id DESC
    `;

    const [summaryRows] = await connection.execute(summaryQuery, params);
    const summaryRow = (summaryRows as any[])[0] || { bill_count: 0, total_billing: 0 };
    const totalBills = Number(summaryRow.bill_count) || 0;
    const totalAmount = Number(summaryRow.total_billing) || 0;
    const averagePerBill = totalBills > 0 ? totalAmount / totalBills : 0;

    const [trendRows] = await connection.execute(trendQuery, params);
    const [revenueByDoctorRows] = await connection.execute(revenueByDoctorQuery, params);
    const [billRows] = await connection.execute(billsQuery, params);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalBills,
          totalAmount,
          averagePerBill
        },
        revenueTrend: trendRows,
        revenueByDoctor: revenueByDoctorRows,
        bills: billRows
      }
    });
  } catch (error) {
    console.error('Error generating billing search report:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load billing search data' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
