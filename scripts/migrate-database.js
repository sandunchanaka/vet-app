const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function migrateDatabase() {
  console.log('🔧 Running database migration...\n');

  try {
    // Get database credentials
    const host = await question('Enter MySQL host (default: localhost): ') || 'localhost';
    const user = await question('Enter MySQL username (default: root): ') || 'root';
    const password = await question('Enter MySQL password: ');
    const database = 'etutor_platform';

    console.log('\n📊 Adding missing columns to users table...');

    // Create connection
    const connection = await mysql.createConnection({
      host: host,
      user: user,
      password: password,
      database: database
    });

    // Add missing columns
    await connection.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS business_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS website VARCHAR(255)
    `);

    // Update existing users with sample data
    await connection.execute(`
      UPDATE users SET phone = '+1234567890' WHERE phone IS NULL
    `);
    
    await connection.execute(`
      UPDATE users SET business_name = 'Sample Business' WHERE business_name IS NULL
    `);
    
    await connection.execute(`
      UPDATE users SET website = 'https://example.com' WHERE website IS NULL
    `);

    await connection.end();

    console.log('✅ Database migration completed successfully!');
    console.log('📋 Added columns: phone, business_name, website');
    console.log('👥 Updated existing users with sample data');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    rl.close();
  }
}

migrateDatabase();

