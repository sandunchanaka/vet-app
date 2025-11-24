@echo off
echo 🚀 Setting up e-Tutor Platform Database...

REM Get database credentials
set /p DB_HOST="Enter MySQL host (default: localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_USER="Enter MySQL username (default: root): "
if "%DB_USER%"=="" set DB_USER=root

set /p DB_PASSWORD="Enter MySQL password: "

echo 📊 Creating database and tables...

REM Execute the SQL file
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASSWORD% < database/schema.sql

if %ERRORLEVEL% EQU 0 (
    echo ✅ Database setup completed successfully!
    echo 📋 User types created: admin, institution, teachers, student, publishers
    echo 👤 Sample admin user created: admin@etutor.com
    echo.
    echo 🎉 Setup complete! You can now run: npm run dev
) else (
    echo ❌ Error setting up database. Please check your credentials and try again.
)

pause

