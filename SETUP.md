# Database Setup Guide

## 🚀 Quick Setup Options

### Option 1: Using Node.js Script (Recommended)
```bash
npm run setup-db
```

### Option 2: Using PowerShell (Windows)
```powershell
.\scripts\setup-database.ps1
```

### Option 3: Using Batch File (Windows)
```cmd
.\scripts\setup-database.bat
```

### Option 4: Using Bash (Linux/Mac)
```bash
chmod +x scripts/setup-database.sh
./scripts/setup-database.sh
```

## 🔧 Manual Setup

If the automated scripts don't work, you can set up the database manually:

### Step 1: Create Database
```sql
CREATE DATABASE etutor_platform;
USE etutor_platform;
```

### Step 2: Run SQL Commands
Copy and paste the contents of `database/schema.sql` into your MySQL client (phpMyAdmin, MySQL Workbench, or command line).

### Step 3: Verify Setup
```bash
npm run test-db
```

## 📋 What Gets Created

### Tables:
- `user_type` - User type definitions
- `users` - User accounts with role-based access

### User Types:
- **admin** - System administrators
- **institution** - Educational institutions  
- **teachers** - Individual teachers
- **student** - Students
- **publishers** - Content publishers

### Sample Data:
- Admin user: `admin@etutor.com` (password: `password`)
- Additional sample users for each user type

## 🛠️ Troubleshooting

### Common Issues:

1. **"Table doesn't exist" error**
   - Make sure you're connected to the `etutor_platform` database
   - Run the schema.sql file completely

2. **Permission denied**
   - Make sure your MySQL user has CREATE and INSERT privileges
   - Try running as administrator/root

3. **Connection refused**
   - Make sure MySQL is running
   - Check if the port (3306) is accessible

4. **PowerShell redirection error**
   - Use the Node.js script instead: `npm run setup-db`
   - Or use the PowerShell script: `.\scripts\setup-database.ps1`

### Alternative Commands:

**Windows Command Prompt:**
```cmd
mysql -u root -p etutor_platform < database/schema.sql
```

**Windows PowerShell (Alternative):**
```powershell
Get-Content database/schema.sql | mysql -u root -p etutor_platform
```

**Linux/Mac:**
```bash
mysql -u root -p etutor_platform < database/schema.sql
```

## ✅ Verification

After setup, you should see:
- 5 user types in the `user_type` table
- 5 sample users in the `users` table
- Admin user with email `admin@etutor.com`

Test the connection:
```bash
npm run test-db
```

## 🎉 Next Steps

1. Set up environment variables (`.env.local`)
2. Run the application: `npm run dev`
3. Open: `http://localhost:3000`
4. Login with: `admin@etutor.com` / `password`

