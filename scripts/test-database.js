const mysql = require('mysql2/promise');

async function testDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'animal_clinic_db'
  });

  try {
    console.log('🔍 Testing database connection...\n');

    // Test user types
    console.log('📋 User Types:');
    const [userTypes] = await connection.execute('SELECT * FROM user_type');
    console.table(userTypes);

    // Test users
    console.log('\n👥 Users:');
    const [users] = await connection.execute(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.user_type, u.created_date, u.is_active,
             ut.user_type_name
      FROM users u 
      JOIN user_type ut ON u.user_type = ut.user_type_id 
      ORDER BY u.id
    `);
    console.table(users);

    console.log('\n✅ Database connection successful!');
    console.log(`📊 Found ${userTypes.length} user types and ${users.length} users`);

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await connection.end();
  }
}

testDatabase();

