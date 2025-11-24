const fs = require('fs');
const mysql = require('mysql2/promise');

async function setupPetsTables() {
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

    // Read the pets schema file
    const schemaPath = './database/pets_schema.sql';
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Clean the SQL and split by semicolon
    const cleanSchema = schema
      .replace(/--.*$/gm, '') // Remove comment lines
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
    
    const statements = cleanSchema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          await connection.execute(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          if (error.code === 'ER_DUP_KEYNAME') {
            console.log(`⚠️  Index already exists, skipping...`);
          } else if (error.code === 'ER_DUP_ENTRY') {
            console.log(`⚠️  Duplicate entry, skipping...`);
          } else if (error.code === 'ER_DUP_KEYNAME' || error.message.includes('Duplicate key name')) {
            console.log(`⚠️  Key already exists, skipping...`);
          } else if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY' || error.message.includes('Cannot drop')) {
            console.log(`⚠️  Cannot drop key, skipping...`);
          } else {
            console.error(`❌ Error executing statement ${i + 1}:`, error.message);
            console.log(`Statement: ${statement.substring(0, 100)}...`);
            throw error;
          }
        }
      }
    }

    console.log('🎉 Pets tables setup completed successfully!');
    
    // Verify tables were created
    const [tables] = await connection.execute("SHOW TABLES LIKE 'pet%'");
    console.log('Created tables:', tables.map(table => Object.values(table)[0]));

  } catch (error) {
    console.error('❌ Error setting up pets tables:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the setup
setupPetsTables()
  .then(() => {
    console.log('✅ Pets tables setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
