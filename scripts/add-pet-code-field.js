const mysql = require('mysql2/promise');

async function addPetCodeField() {
  let connection;
  
  try {
    // Read database configuration
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'animal_clinic_db'
    };

    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database successfully!');

    // Add pet_code field to pets table
    console.log('Adding pet_code field to pets table...');
    try {
      await connection.execute(`
        ALTER TABLE pets 
        ADD COLUMN pet_code VARCHAR(10) UNIQUE AFTER pet_id
      `);
      console.log('✅ pet_code field added successfully');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  pet_code field already exists, skipping...');
      } else {
        throw error;
      }
    }

    // Create index for pet_code
    console.log('Creating index for pet_code...');
    try {
      await connection.execute(`
        CREATE INDEX idx_pets_pet_code ON pets(pet_code)
      `);
      console.log('✅ Index created successfully');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️  Index already exists, skipping...');
      } else {
        throw error;
      }
    }

    // Generate pet codes for existing pets
    console.log('Generating pet codes for existing pets...');
    
    // Get all pets without pet_code
    const [petsWithoutCode] = await connection.execute(`
      SELECT pet_id FROM pets WHERE pet_code IS NULL ORDER BY pet_id
    `);

    const petCodePrefix = process.env.PET_CODE_PREFIX || 'CV';
    
    for (let i = 0; i < petsWithoutCode.length; i++) {
      const pet = petsWithoutCode[i];
      const petCode = `${petCodePrefix}${String(i + 1).padStart(4, '0')}`;
      
      await connection.execute(
        'UPDATE pets SET pet_code = ? WHERE pet_id = ?',
        [petCode, pet.pet_id]
      );
      
      console.log(`✅ Generated pet code ${petCode} for pet ID ${pet.pet_id}`);
    }

    console.log('🎉 Pet code field setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up pet code field:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the setup
addPetCodeField()
  .then(() => {
    console.log('✅ Pet code field setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
