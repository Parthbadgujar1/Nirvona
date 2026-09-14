#!/usr/bin/env powershell
<#
.SYNOPSIS
    Nirvona Development Environment Setup Script for Windows
.DESCRIPTION
    Automates the setup of the full-stack Nirvona application locally,
    against natively-installed PostgreSQL and a Redis-protocol-compatible
    server (Memurai on Windows) - no Docker involved.
.EXAMPLE
    .\setup-dev-environment.ps1
.NOTES
    Requires: PowerShell 5.0+
    Prerequisites you install yourself first:
      - PostgreSQL:  https://www.postgresql.org/download/windows/
      - Memurai:     https://www.memurai.com/get-memurai (LTS edition)
#>

param(
    [switch]$SkipDatabase = $false,
    [string]$DBPassword = "secure_password",
    [switch]$NoInstall = $false
)

# Color output
$ErrorActionPreference = "Stop"
$WarningPreference = "Continue"

function Write-Success {
    Write-Host "✅ $args" -ForegroundColor Green
}

function Write-Error {
    Write-Host "❌ $args" -ForegroundColor Red
}

function Write-Info {
    Write-Host "ℹ️  $args" -ForegroundColor Cyan
}

function Write-Warning {
    Write-Host "⚠️  $args" -ForegroundColor Yellow
}

function Write-Section {
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
    Write-Host "  $args" -ForegroundColor Magenta
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
}

# Check prerequisites
function Test-Prerequisites {
    Write-Section "Checking Prerequisites"

    $missing = @()

    # Check Node.js
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        $missing += "Node.js (https://nodejs.org/)"
    } else {
        $nodeVersion = node --version
        Write-Success "Node.js found: $nodeVersion"
    }

    # Check npm
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        $missing += "npm"
    } else {
        $npmVersion = npm --version
        Write-Success "npm found: v$npmVersion"
    }

    # Check PHP
    if (-not (Get-Command php -ErrorAction SilentlyContinue)) {
        $missing += "PHP 8.2+ (https://windows.php.net/download/)"
    } else {
        $phpVersion = php --version | Select-Object -First 1
        Write-Success "PHP found: $phpVersion"
    }

    # Check Composer
    if (-not (Get-Command composer -ErrorAction SilentlyContinue)) {
        $missing += "Composer (https://getcomposer.org/)"
    } else {
        $composerVersion = composer --version
        Write-Success "$composerVersion"
    }

    # Check PostgreSQL
    if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
        $missing += "PostgreSQL (https://www.postgresql.org/download/windows/)"
    } else {
        $psqlVersion = psql --version
        Write-Success "$psqlVersion"
    }

    # Check Redis / Memurai (both speak the same protocol on port 6379)
    $redisService = Get-Service -Name "Memurai" -ErrorAction SilentlyContinue
    if ($redisService -and $redisService.Status -eq 'Running') {
        Write-Success "Memurai (Redis-compatible) service is running"
    } elseif (Get-Command redis-cli -ErrorAction SilentlyContinue) {
        Write-Success "redis-cli found"
    } else {
        $missing += "Memurai (https://www.memurai.com/get-memurai) - install the LTS edition, it runs as a Windows service on port 6379"
    }

    if ($missing.Count -gt 0) {
        Write-Error "Missing required software:"
        $missing | ForEach-Object { Write-Host "  • $_" -ForegroundColor Red }
        exit 1
    }
}

# Setup Backend
function Setup-Backend {
    Write-Section "Setting Up Backend (PHP)"

    $backendPath = Join-Path $PSScriptRoot "backend"

    # Copy .env file
    Write-Info "Creating backend .env file..."
    $envExample = Join-Path $backendPath ".env.example"
    $envFile = Join-Path $backendPath ".env"

    if (-not (Test-Path $envFile)) {
        Copy-Item $envExample $envFile -Force
        Write-Success ".env file created"
    } else {
        Write-Warning ".env file already exists, skipping..."
    }

    # Check if need to install dependencies
    if (-not $NoInstall) {
        Write-Info "Installing PHP dependencies via Composer..."
        Push-Location $backendPath
        try {
            composer install
            Write-Success "Composer dependencies installed"
        } catch {
            Write-Error "Failed to install composer dependencies: $_"
            exit 1
        } finally {
            Pop-Location
        }
    }

    # Run migrations
    Write-Info "Running database migrations..."
    Push-Location $backendPath
    try {
        php migrate.php
    } catch {
        Write-Warning "Migrations failed - check your .env database settings and that PostgreSQL is running"
    } finally {
        Pop-Location
    }

    # Verify setup
    Write-Info "Verifying backend setup..."
    Push-Location $backendPath
    try {
        if (Test-Path "verify-setup.php") {
            php verify-setup.php
        } else {
            Write-Warning "verify-setup.php not found"
        }
    } finally {
        Pop-Location
    }
}

# Setup Frontend
function Setup-Frontend {
    Write-Section "Setting Up Frontend (Next.js)"

    $rootPath = $PSScriptRoot

    # Copy .env file
    Write-Info "Creating frontend .env.local file..."
    $envExample = Join-Path $rootPath ".env.example"
    $envFile = Join-Path $rootPath ".env.local"

    if (-not (Test-Path $envFile)) {
        Copy-Item $envExample $envFile -Force
        Write-Success ".env.local file created"
    } else {
        Write-Warning ".env.local already exists, skipping..."
    }

    # Check if need to install dependencies
    if (-not $NoInstall) {
        Write-Info "Installing npm dependencies..."
        try {
            npm install
            Write-Success "npm dependencies installed"
        } catch {
            Write-Error "Failed to install npm dependencies: $_"
            exit 1
        }
    }
}

# Setup Database (native PostgreSQL - create the database/user if missing)
function Setup-Database {
    if ($SkipDatabase) {
        Write-Warning "Skipping database setup as requested"
        return
    }

    Write-Section "Setting Up Database"

    $psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
    if (-not $psqlCmd) {
        Write-Error "PostgreSQL is not installed. Install it from https://www.postgresql.org/download/windows/"
        exit 1
    }

    Write-Info "Creating database and user (you may be prompted for the postgres admin password)..."

    try {
        $dbExists = (psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'nirvona'").Trim()
        if ($dbExists -ne "1") {
            psql -U postgres -c "CREATE DATABASE nirvona;" | Out-Null
            Write-Success "Database 'nirvona' created"
        } else {
            Write-Success "Database 'nirvona' already exists"
        }

        $userExists = (psql -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname = 'nirvona_user'").Trim()
        if ($userExists -ne "1") {
            psql -U postgres -c "CREATE USER nirvona_user WITH PASSWORD '$DBPassword';" | Out-Null
            Write-Success "User 'nirvona_user' created"
        } else {
            Write-Success "User 'nirvona_user' already exists"
        }

        psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE nirvona TO nirvona_user;" | Out-Null
        Write-Success "Privileges granted"
    } catch {
        Write-Warning "Could not auto-create database/user. Run these manually as the postgres user:"
        Write-Host "  CREATE DATABASE nirvona;" -ForegroundColor Yellow
        Write-Host "  CREATE USER nirvona_user WITH PASSWORD '$DBPassword';" -ForegroundColor Yellow
        Write-Host "  GRANT ALL PRIVILEGES ON DATABASE nirvona TO nirvona_user;" -ForegroundColor Yellow
    }

    Write-Info "Checking Redis-compatible service (Memurai)..."
    $redisService = Get-Service -Name "Memurai" -ErrorAction SilentlyContinue
    if ($redisService -and $redisService.Status -eq 'Running') {
        Write-Success "Memurai is running"
    } else {
        Write-Warning "Memurai isn't running - install/start it from https://www.memurai.com/get-memurai"
    }
}

# Create VS Code configuration
function Setup-VSCode {
    Write-Section "Setting Up VS Code Configuration"

    $vscodeDir = Join-Path $PSScriptRoot ".vscode"

    if (Test-Path $vscodeDir) {
        Write-Success "VS Code configuration directory found"
    } else {
        Write-Info ".vscode directory not found - should be created by setup"
    }

    Write-Info "VS Code configuration files:"
    Write-Host "  • settings.json - Editor and formatter settings" -ForegroundColor Cyan
    Write-Host "  • launch.json - Debug configurations" -ForegroundColor Cyan
    Write-Host "  • tasks.json - Development tasks" -ForegroundColor Cyan
    Write-Host "  • extensions.json - Recommended extensions" -ForegroundColor Cyan

    Write-Info "To install recommended extensions:"
    Write-Host "  1. Press Ctrl+Shift+P in VS Code" -ForegroundColor Yellow
    Write-Host "  2. Type: Extensions: Show Recommended Extensions" -ForegroundColor Yellow
    Write-Host "  3. Install all recommended extensions" -ForegroundColor Yellow
}

# Summary and next steps
function Show-Summary {
    Write-Section "Setup Summary"

    Write-Success "Environment setup completed!"

    Write-Info "Next steps:"
    Write-Host "  1. Update .env files with your configuration:" -ForegroundColor Yellow
    Write-Host "     - backend/.env (database credentials)" -ForegroundColor Yellow
    Write-Host "     - .env.local (API configuration)" -ForegroundColor Yellow

    Write-Host "  2. Start the development servers:" -ForegroundColor Yellow
    Write-Host "     Backend:  php -S localhost:8000 -t backend/public/" -ForegroundColor Yellow
    Write-Host "     Frontend: npm run dev" -ForegroundColor Yellow

    Write-Host "  3. Or use VS Code tasks:" -ForegroundColor Yellow
    Write-Host "     - Press Ctrl+Shift+P" -ForegroundColor Yellow
    Write-Host "     - Type: Tasks: Run Task" -ForegroundColor Yellow
    Write-Host "     - Select: Start All Servers" -ForegroundColor Yellow

    Write-Host "  4. Access the application:" -ForegroundColor Yellow
    Write-Host "     - Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "     - Backend API: http://localhost:8000/api" -ForegroundColor Cyan
    Write-Host "     - Database: localhost:5432" -ForegroundColor Cyan
    Write-Host "     - Cache: localhost:6379 (Memurai)" -ForegroundColor Cyan

    Write-Success "Happy coding! 🚀"
}

# Main execution
function Main {
    Clear-Host
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║   Nirvona Development Environment Setup - Windows          ║" -ForegroundColor Magenta
    Write-Host "║   Computer-Based Testing Platform                          ║" -ForegroundColor Magenta
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
    Write-Host ""

    try {
        Test-Prerequisites
        Setup-Backend
        Setup-Frontend
        Setup-Database
        Setup-VSCode
        Show-Summary
    } catch {
        Write-Error "Setup failed: $_"
        exit 1
    }
}

# Run main function
Main
