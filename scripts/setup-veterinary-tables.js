const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'animal_clinic_db',
  port: process.env.DB_PORT || 3306
};

async function setupVeterinaryTables() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Read the veterinary schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'veterinary_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('📋 Executing veterinary schema...');
    console.log('📄 Schema file length:', schemaSQL.length);
    
    // Clean up the SQL and split into statements
    const cleanedSQL = schemaSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n');
    
    const statements = cleanedSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Debug: Show all statements before filtering
    const allStatements = schemaSQL.split(';').map(stmt => stmt.trim()).filter(stmt => stmt.length > 0);
    console.log(`🔍 Total statements before filtering: ${allStatements.length}`);
    console.log('🔍 First 5 statements before filtering:');
    allStatements.slice(0, 5).forEach((stmt, i) => {
      console.log(`  ${i + 1}: ${stmt.substring(0, 100)}...`);
    });
    
    // Debug: Show first few statements after filtering
    console.log('🔍 First 3 statements after filtering:');
    statements.slice(0, 3).forEach((stmt, i) => {
      console.log(`  ${i + 1}: ${stmt.substring(0, 50)}...`);
    });

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          await connection.execute(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          // Handle specific errors gracefully
          if (error.code === 'ER_DUP_KEYNAME') {
            console.log(`⚠️  Index already exists, skipping...`);
          } else if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log(`⚠️  Table already exists, skipping...`);
          } else if (error.code === 'ER_DUP_ENTRY') {
            console.log(`⚠️  Duplicate entry, skipping...`);
          } else {
            console.error(`❌ Error executing statement ${i + 1}:`, error.message);
            console.error(`Statement: ${statement.substring(0, 100)}...`);
          }
        }
      }
    }

    console.log('🎉 Veterinary tables setup completed successfully!');
    
    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('pet_categories', 'pet_breeds', 'drugs', 'services', 'vaccination_types', 'vaccinations')
    `, [dbConfig.database]);
    
    console.log('📊 Created tables:', tables.map(t => t.TABLE_NAME));
    
    // Check data counts
    const tableCounts = {};
    for (const table of tables) {
      try {
        const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${table.TABLE_NAME}`);
        tableCounts[table.TABLE_NAME] = count[0].count;
      } catch (error) {
        tableCounts[table.TABLE_NAME] = 'Error';
      }
    }
    
    console.log('📈 Data counts:');
    Object.entries(tableCounts).forEach(([table, count]) => {
      console.log(`  ${table}: ${count} records`);
    });

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the setup
setupVeterinaryTables();
