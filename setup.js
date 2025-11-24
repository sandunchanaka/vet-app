#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up e-Tutor Platform...\n');

// Create .env.local file if it doesn't exist
const envPath = path.join(__dirname, '.env.local');
const envExamplePath = path.join(__dirname, 'config', 'database.env');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env.local file from template');
    console.log('📝 Please update your database credentials in .env.local\n');
  } else {
    const defaultEnv = `# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=etutor_platform

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here`;
    
    fs.writeFileSync(envPath, defaultEnv);
    console.log('✅ Created .env.local file with default values');
    console.log('📝 Please update your database credentials in .env.local\n');
  }
} else {
  console.log('✅ .env.local file already exists\n');
}

console.log('📋 Next steps:');
console.log('1. Set up your MySQL database:');
console.log('   - Create database: etutor_platform');
console.log('   - Run: mysql -u your_username -p etutor_platform < database/schema.sql');
console.log('2. Update .env.local with your database credentials');
console.log('3. Run: npm run dev');
console.log('4. Open: http://localhost:3000');
console.log('\n🎉 Your e-Tutor Platform is ready!');

