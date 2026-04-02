# Script to push migration to Supabase using database URL
# You need to get your database password from Supabase dashboard

# Get database password from user
$password = Read-Host "Enter your database password (from Supabase dashboard > Settings > Database)"

# Construct the database URL
$dbUrl = "postgresql://postgres:$($password)@db.pvdwstafgtwtovkxmnhv.supabase.co:5432/postgres"

# URL encode the password for CLI
$encodedPassword = [System.Web.HttpUtility]::UrlEncode($password)
$encodedDbUrl = "postgresql://postgres:$($encodedPassword)@db.pvdwstafgtwtovkxmnhv.supabase.co:5432/postgres"

Write-Host "Attempting to push migration..."
Write-Host "Database URL: postgresql://postgres:****@db.pvdwstafgtwtovkxmnhv.supabase.co:5432/postgres"

# Try to push the migration
try {
    supabase db push --db-url $encodedDbUrl --yes
    Write-Host "Migration pushed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Error pushing migration: $_" -ForegroundColor Red
    Write-Host "Please run the migration manually in Supabase dashboard SQL Editor" -ForegroundColor Yellow
    Write-Host "File to run: supabase\migrations\20260331124517_fix_rls_policies.sql" -ForegroundColor Yellow
}

# Keep the window open
Read-Host "Press Enter to exit"
