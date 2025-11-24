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

async function setupDatabase() {
  console.log('🚀 Setting up e-Tutor Platform Database...\n');

  try {
    // Get database credentials
    const host = await question('Enter MySQL host (default: localhost): ') || 'localhost';
    const user = await question('Enter MySQL username (default: root): ') || 'root';
    const password = await question('Enter MySQL password: ');
    const database = 'etutor_platform';

    console.log('\n📊 Creating database and tables...');

    // Create connection
    const connection = await mysql.createConnection({
      host: host,
      user: user,
      password: password
    });

    // Read and execute SQL file
    const sqlPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL content by semicolon and execute each command
    const sqlCommands = sqlContent.split(';').filter(cmd => cmd.trim() !== '');

    for (const command of sqlCommands) {
      if (command.trim()) {
        await connection.execute(command);
      }
    }

    await connection.end();

    console.log('✅ Database setup completed successfully!');
    console.log('📋 User types created: admin, institution, teachers, student, publishers');
    console.log('👤 Sample admin user created: admin@etutor.com');
    console.log('\n🎉 Setup complete! You can now run: npm run dev');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   - MySQL is running');
    console.log('   - Credentials are correct');
    console.log('   - You have permission to create databases');
  } finally {
    rl.close();
  }
}

setupDatabase();

