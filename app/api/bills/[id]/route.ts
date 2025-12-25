import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  let connection;

  try {
    const billId = params.id;

    connection = await pool.getConnection();

    const [billRows] = await connection.execute(
      `
        SELECT 
          b.*,
          p.pet_code,
          p.name AS pet_name,
          p.gender AS pet_gender,
          p.date_of_birth AS pet_date_of_birth,
          p.weight AS pet_weight,
          p.color AS pet_color,
          pc.category_name,
          pb.breed_name,
          po.owner_name,
          po.phone AS owner_phone,
          po.address AS owner_address,
          po.email AS owner_email,
          v.first_name AS vet_first_name,
          v.last_name AS vet_last_name,
          v.specialization AS vet_specialization
        FROM bills b
        LEFT JOIN pets p ON b.pet_id = p.pet_id
        LEFT JOIN pet_categories pc ON p.pet_category_id = pc.id
        LEFT JOIN pet_breeds pb ON p.breed_id = pb.id
        LEFT JOIN pet_owners po ON b.owner_id = po.owner_id
        LEFT JOIN veterinarians v ON b.veterinarian_id = v.vet_id
        WHERE b.bill_id = ?
      `,
      [billId]
    );

    if (!Array.isArray(billRows) || billRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bill not found'
        },
        { status: 404 }
      );
    }

    const bill = (billRows as any[])[0];

    const [services] = await connection.execute(
      `SELECT service_name, quantity, unit_price, discount_percentage, total_amount 
       FROM bill_services WHERE bill_id = ?`,
      [billId]
    );

    const [prescriptions] = await connection.execute(
      `SELECT 
         bp.drug_name,
         bp.dose,
         bp.dosage,
         COALESCE(dt.abbreviation, dt.name, bp.dosage) AS dosage_label,
         bp.duration,
         COALESCE(dur.name, bp.duration) AS duration_label
       FROM bill_prescriptions bp
       LEFT JOIN dosage_types dt 
         ON (
           dt.id = CASE 
             WHEN bp.dosage REGEXP '^[0-9]+$' THEN CAST(bp.dosage AS UNSIGNED) 
             ELSE NULL
           END
           OR dt.name = bp.dosage
           OR dt.abbreviation = bp.dosage
         )
       LEFT JOIN duration_types dur
         ON (
           dur.id = CASE 
             WHEN bp.duration REGEXP '^[0-9]+$' THEN CAST(bp.duration AS UNSIGNED)
             ELSE NULL
           END
           OR dur.name = bp.duration
         )
       WHERE bp.bill_id = ?`,
      [billId]
    );

    const [vaccinations] = await connection.execute(
      `SELECT 
         bv.vaccine_id,
         COALESCE(vt.vaccine_name, bv.vaccine_name) AS vaccine_name,
         bv.next_vaccination_date,
         bv.duration_slots
       FROM bill_vaccinations bv
       LEFT JOIN vaccination_types vt 
         ON (vt.id = bv.vaccine_id OR vt.vaccine_name = bv.vaccine_name)
       WHERE bv.bill_id = ?`,
      [billId]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...bill,
        services,
        prescriptions,
        vaccinations
      }
    });
  } catch (error) {
    console.error('Error fetching bill details:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch bill details'
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  let connection;

  try {
    const billId = params.id;
    if (!billId) {
      return NextResponse.json(
        { success: false, message: 'Bill ID is required' },
        { status: 400 }
      );
    }

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

    if (!pet_id || !veterinarian_id || !owner_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Pet, veterinarian, and owner are required'
        },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.execute(
      `UPDATE bills
       SET bill_number = ?, pet_id = ?, veterinarian_id = ?, owner_id = ?, billing_date = ?, next_treatment_date = ?,
           history_complaint = ?, clinical_observation = ?, treatment_remarks = ?, net_total = ?, discount_amount = ?, grand_total = ?
       WHERE bill_id = ?`,
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
        grand_total || 0,
        billId
      ]
    );

    await connection.execute('DELETE FROM bill_prescriptions WHERE bill_id = ?', [billId]);
    await connection.execute('DELETE FROM bill_vaccinations WHERE bill_id = ?', [billId]);
    await connection.execute('DELETE FROM bill_services WHERE bill_id = ?', [billId]);

    if (Array.isArray(prescriptions) && prescriptions.length > 0) {
      for (const prescription of prescriptions) {
        await connection.execute(
          'INSERT INTO bill_prescriptions (bill_id, drug_name, dose, dosage, duration) VALUES (?, ?, ?, ?, ?)',
          [billId, prescription.drug_name, prescription.dose, prescription.dosage, prescription.duration]
        );
      }
    }

    if (Array.isArray(vaccinations) && vaccinations.length > 0) {
      for (const vaccination of vaccinations) {
        const vaccineId = vaccination.vaccine_id || vaccination.id || null;
        const vaccineName = vaccination.vaccine_name || vaccination.vaccineName || (vaccineId ? String(vaccineId) : '');
        await connection.execute(
          'INSERT INTO bill_vaccinations (bill_id, vaccine_id, vaccine_name, next_vaccination_date, duration_slots) VALUES (?, ?, ?, ?, ?)',
          [billId, vaccineId, vaccineName, vaccination.next_vaccination_date, vaccination.duration_slots]
        );
      }
    }

    if (Array.isArray(services) && services.length > 0) {
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
      message: 'Bill updated successfully'
    });
  } catch (error) {
    console.error('Error updating bill:', error);
    if (connection) {
      await connection.rollback();
    }
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update bill'
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  let connection;

  try {
    const billId = params.id;
    if (!billId) {
      return NextResponse.json(
        { success: false, message: 'Bill ID is required' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.execute('DELETE FROM bill_prescriptions WHERE bill_id = ?', [billId]);
    await connection.execute('DELETE FROM bill_vaccinations WHERE bill_id = ?', [billId]);
    await connection.execute('DELETE FROM bill_services WHERE bill_id = ?', [billId]);

    const [deleteResult] = await connection.execute('DELETE FROM bills WHERE bill_id = ?', [billId]);
    const affected = (deleteResult as any).affectedRows || 0;
    if (affected === 0) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, message: 'Bill not found' },
        { status: 404 }
      );
    }

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: 'Bill deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bill:', error);
    if (connection) {
      await connection.rollback();
    }
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete bill'
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
