#!/bin/bash

echo "🚀 Setting up e-Tutor Platform Database..."

# Get database credentials
read -p "Enter MySQL host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Enter MySQL username (default: root): " DB_USER
DB_USER=${DB_USER:-root}

read -s -p "Enter MySQL password: " DB_PASSWORD
echo

echo "📊 Creating database and tables..."

# Execute the SQL file
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD < database/schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database setup completed successfully!"
    echo "📋 User types created: admin, institution, teachers, student, publishers"
    echo "👤 Sample admin user created: admin@etutor.com"
    echo
    echo "🎉 Setup complete! You can now run: npm run dev"
else
    echo "❌ Error setting up database. Please check your credentials and try again."
fi

