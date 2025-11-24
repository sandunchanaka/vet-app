# PowerShell script to set up the database
# Run this script: .\scripts\setup-database.ps1

Write-Host "🚀 Setting up e-Tutor Platform Database..." -ForegroundColor Green

# Get database credentials
$dbHost = Read-Host "Enter MySQL host (default: localhost)"
if ([string]::IsNullOrEmpty($dbHost)) { $dbHost = "localhost" }

$dbUser = Read-Host "Enter MySQL username (default: root)"
if ([string]::IsNullOrEmpty($dbUser)) { $dbUser = "root" }

$dbPassword = Read-Host "Enter MySQL password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))

Write-Host "📊 Creating database and tables..." -ForegroundColor Yellow

# Read the SQL file content
$sqlContent = Get-Content -Path "database/schema.sql" -Raw

# Execute the SQL commands
try {
    $connectionString = "Server=$dbHost;Uid=$dbUser;Pwd=$dbPasswordPlain;"
    
    # Create connection
    $connection = New-Object MySql.Data.MySqlClient.MySqlConnection($connectionString)
    $connection.Open()
    
    # Split SQL content by semicolon and execute each command
    $sqlCommands = $sqlContent -split ';' | Where-Object { $_.Trim() -ne '' }
    
    foreach ($command in $sqlCommands) {
        if ($command.Trim() -ne '') {
            $cmd = New-Object MySql.Data.MySqlClient.MySqlCommand($command, $connection)
            $cmd.ExecuteNonQuery() | Out-Null
        }
    }
    
    Write-Host "✅ Database setup completed successfully!" -ForegroundColor Green
    Write-Host "📋 User types created: admin, institution, teachers, student, publishers" -ForegroundColor Cyan
    Write-Host "👤 Sample admin user created: admin@etutor.com" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Error setting up database: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    if ($connection) {
        $connection.Close()
    }
}

Write-Host "`n🎉 Setup complete! You can now run: npm run dev" -ForegroundColor Green

