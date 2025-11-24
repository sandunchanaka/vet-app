import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    const query = `
      SELECT 
        b.bill_id,
        b.bill_number,
        b.billing_date,
        b.next_treatment_date,
        b.net_total,
        b.discount_amount,
        b.grand_total,
        b.status,
        b.created_at,
        p.pet_code,
        p.name as pet_name,
        po.owner_name,
        po.phone as owner_phone,
        v.first_name as vet_first_name,
        v.last_name as vet_last_name
      FROM bills b
      LEFT JOIN pets p ON b.pet_id = p.pet_id
      LEFT JOIN pet_owners po ON b.owner_id = po.owner_id
      LEFT JOIN veterinarians v ON b.veterinarian_id = v.vet_id
      ORDER BY b.created_at DESC
    `;
    
    const [rows] = await connection.execute(query);
    
    return NextResponse.json({
      success: true,
      data: rows
    });
    
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch bills'
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function POST(request: NextRequest) {
  let connection;
  
  try {
    const body = await request.json();
    const {
      bill_number,
      pet_id,
      veterinarian_id,
      owner_id,
      billing_date,
      next_treatment_date,
      history_complaint,
      clinical_observation,
      treatment_remarks,
      net_total,
      discount_amount,
      grand_total,
      prescriptions,
      vaccinations,
      services
    } = body;

    // Validate required fields
    if (!pet_id || !veterinarian_id || !owner_id) {
      return NextResponse.json({
        success: false,
        message: 'Pet, veterinarian, and owner are required'
      }, { status: 400 });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create the bill
      const [billResult] = await connection.execute(
        `INSERT INTO bills (bill_number, pet_id, veterinarian_id, owner_id, billing_date, next_treatment_date, 
         history_complaint, clinical_observation, treatment_remarks, net_total, discount_amount, grand_total) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bill_number,
          pet_id,
          veterinarian_id,
          owner_id,
          billing_date,
          next_treatment_date,
          history_complaint || null,
          clinical_observation || null,
          treatment_remarks || null,
          net_total || 0,
          discount_amount || 0,
          grand_total || 0
        ]
      );

      const billId = (billResult as any).insertId;

      // Insert prescriptions
      if (prescriptions && prescriptions.length > 0) {
        for (const prescription of prescriptions) {
          await connection.execute(
            'INSERT INTO bill_prescriptions (bill_id, drug_name, dose, dosage, duration) VALUES (?, ?, ?, ?, ?)',
            [billId, prescription.drug_name, prescription.dose, prescription.dosage, prescription.duration]
          );
        }
      }

      // Insert vaccinations
      if (vaccinations && vaccinations.length > 0) {
        for (const vaccination of vaccinations) {
          await connection.execute(
            'INSERT INTO bill_vaccinations (bill_id, vaccine_name, next_vaccination_date, duration_slots) VALUES (?, ?, ?, ?)',
            [billId, vaccination.vaccine_name, vaccination.next_vaccination_date, vaccination.duration_slots]
          );
        }
      }

      // Insert services
      if (services && services.length > 0) {
        for (const service of services) {
          await connection.execute(
            'INSERT INTO bill_services (bill_id, service_name, quantity, unit_price, discount_percentage, total_amount) VALUES (?, ?, ?, ?, ?, ?)',
            [billId, service.service_name, service.quantity, service.unit_price, service.discount_percentage, service.total_amount]
          );
        }
      }

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: 'Bill created successfully',
        data: { bill_id: billId, bill_number: bill_number }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error creating bill:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create bill'
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
