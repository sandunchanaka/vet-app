import pool from './database';

export async function generatePetCode(): Promise<string> {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    // Get the maximum pet_id from the database
    const [result] = await connection.execute('SELECT MAX(pet_id) as maxId FROM pets');
    const maxId = (result as any[])[0]?.maxId || 0;
    
    // Get the pet code prefix from environment or default to 'CV'
    const prefix = process.env.PET_CODE_PREFIX || 'CV';
    
    // Generate the next pet code
    const nextNumber = maxId + 1;
    const petCode = `${prefix}${String(nextNumber).padStart(4, '0')}`;
    
    return petCode;
  } catch (error) {
    console.error('Error generating pet code:', error);
    throw new Error('Failed to generate pet code');
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
