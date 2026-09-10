# Nirvona Backend - Setup Guide

Complete guide for setting up and running the Nirvona Backend development environment.

## 🔧 Prerequisites

### System Requirements
- **OS:** Linux, macOS, or Windows (WSL2)
- **PHP:** 8.2 or higher
- **PostgreSQL:** 13 or higher
- **Redis:** 6 or higher
- **Composer:** Latest version
- **Docker & Docker Compose:** (Optional, for containerized setup)

### Verify Prerequisites

```bash
# Check PHP version
php -v

# Check PostgreSQL version
psql --version

# Check Redis (if installed locally)
redis-cli --version

# Check Composer
composer --version

# Check Docker (if using containers)
docker --version
docker-compose --version
```

---

## 📥 Installation Methods

### Method 1: Local Development (Recommended for Development)

#### Step 1: Clone Repository
```bash
git clone https://github.com/Parthbadgujar1/Nirvona.git
cd Nirvona/backend
```

#### Step 2: Install PHP Dependencies
```bash
composer install
```

#### Step 3: Setup Environment Variables
```bash
# Copy example to .env
cp .env.example .env

# Edit .env with your configuration
nano .env  # or your preferred editor
```

**Key Environment Variables to Configure:**
```env
# Application
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=nirvona
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_SSLMODE=disable

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION=3600

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

#### Step 4: Setup PostgreSQL Database

```bash
# Create database (if not exists)
createdb -U postgres nirvona

# Run migrations (manual approach if artisan unavailable)
# Migrations are in database/migrations/
# Execute each migration file's 'up' function in order
```

**For manual migration execution:**
```php
<?php
// Create a migration runner script
$pdo = new PDO('pgsql:host=localhost;port=5432;dbname=nirvona', 'postgres', 'password');

$migrations = [
    require 'database/migrations/001_create_students_table.php',
    require 'database/migrations/002_create_exams_table.php',
    require 'database/migrations/003_create_payments_table.php',
    require 'database/migrations/004_create_results_table.php',
];

foreach ($migrations as $migration) {
    $migration['up']($pdo);
    echo "Migration executed\n";
}
?>
```

#### Step 5: Setup Storage Directories

```bash
# Create required directories
mkdir -p storage/logs
mkdir -p storage/cache

# Set permissions (Unix/Linux/macOS)
chmod -R 755 storage/
```

#### Step 6: Start Development Server

```bash
# Option 1: PHP Built-in Server
php -S localhost:8000 -t public/

# Option 2: Using Make (if available)
make serve

# Option 3: Using Composer script (if configured)
composer serve
```

**Access:**
- API Base URL: `http://localhost:8000/api`
- Health Check: `http://localhost:8000/api/health`

---

### Method 2: Docker Setup (Production-like Environment)

#### Step 1: Clone Repository
```bash
git clone https://github.com/Parthbadgujar1/Nirvona.git
cd Nirvona/backend
```

#### Step 2: Setup Environment
```bash
cp .env.example .env
# Edit .env - Docker services are configured in docker-compose.yml
```

#### Step 3: Build & Start Containers
```bash
# Build Docker images
docker-compose build

# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps

# View logs
docker-compose logs -f app
```

**What's Running:**
- **PostgreSQL** (port 5432)
- **Redis** (port 6379)
- **PHP Application** (port 8000)
- **Nginx Reverse Proxy** (port 80)

#### Step 4: Run Migrations Inside Container
```bash
docker-compose exec app php -r "
\$pdo = new PDO('pgsql:host=postgres;port=5432;dbname=nirvona', 'postgres', 'postgres');
\$migrations = [
    require 'database/migrations/001_create_students_table.php',
    require 'database/migrations/002_create_exams_table.php',
    require 'database/migrations/003_create_payments_table.php',
    require 'database/migrations/004_create_results_table.php',
];
foreach (\$migrations as \$migration) {
    \$migration['up'](\$pdo);
}
echo 'Migrations complete';
"
```

#### Step 5: Access Application
```
http://localhost/api/health          # Via Nginx
http://localhost:8000/api/health     # Direct PHP
```

#### Step 6: Useful Docker Commands
```bash
# View logs
docker-compose logs -f app

# Enter PHP container shell
docker-compose exec app sh

# Stop containers
docker-compose down

# Remove all containers and volumes
docker-compose down -v

# Rebuild after code changes
docker-compose build --no-cache
```

---

## ✅ Verification

### Check Installation
```bash
# Test PHP can run the application
php -l app/
php -l routes/

# Verify composer autoloader works
php -r "require 'vendor/autoload.php'; echo 'Autoloader OK\n';"

# Test database connection
php -r "
require 'vendor/autoload.php';
require '.env' ? \$_ENV = parse_ini_file('.env') : null;
try {
    \$pdo = new PDO(
        'pgsql:host=' . \$_ENV['DB_HOST'] . ';port=' . \$_ENV['DB_PORT'] . ';dbname=' . \$_ENV['DB_DATABASE'],
        \$_ENV['DB_USERNAME'],
        \$_ENV['DB_PASSWORD']
    );
    echo 'Database connection: OK\n';
} catch (Exception \$e) {
    echo 'Database connection: FAILED - ' . \$e->getMessage() . '\n';
}
"

# Test Redis connection
redis-cli ping  # Should output: PONG
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:8000/api/health

# Expected output:
# {\"status\":\"ok\"}

# Register student
curl -X POST http://localhost:8000/api/students/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "mobile": "9876543210",
    "className": "Class 12",
    "school": "ABC School",
    "city": "Mumbai",
    "state": "Maharashtra"
  }'
```

---

## 🧪 Testing

### Run Tests
```bash
# Run all tests
make test
# or
vendor/bin/phpunit

# Run only unit tests
make test-unit
vendor/bin/phpunit --testsuite="Unit Tests"

# Run only feature tests
make test-feature
vendor/bin/phpunit --testsuite="Feature Tests"

# Run with code coverage
make test-coverage
vendor/bin/phpunit --coverage-html=coverage/
```

### Code Quality
```bash
# Run PHP Linter
make lint

# Run PHPStan (static analysis)
make stan

# Run PHP CodeSniffer (coding standards)
make cs

# Auto-format code (PSR-12)
make format
```

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── Controllers/          # Handle HTTP requests
│   ├── Services/             # Business logic with error isolation
│   ├── Repositories/         # Database access layer
│   ├── Models/               # Domain objects
│   ├── Middleware/           # Request/response processing
│   ├── Exceptions/           # Custom exceptions
│   ├── Helpers/              # Utility functions
│   └── Config/               # Configuration classes
│
├── routes/
│   ├── api.php              # Main API routes
│   ├── admin.php            # Admin endpoints
│   └── student.php          # Student-specific endpoints
│
├── database/
│   ├── migrations/          # Database schema migrations
│   └── seeders/             # Test data seeders
│
├── tests/
│   ├── Unit/                # Unit tests
│   └── Feature/             # Integration tests
│
├── public/
│   └── index.php            # Application entry point
│
├── storage/
│   ├── logs/                # Application logs
│   └── cache/               # Cache files
│
├── .env.example             # Environment template
├── .gitignore               # Git ignore rules
├── composer.json            # PHP dependencies
├── phpunit.xml              # Test configuration
├── docker-compose.yml       # Docker setup
├── Dockerfile               # PHP image definition
├── nginx.conf               # Web server config
├── Makefile                 # Development commands
├── README.md                # Project overview
├── SETUP.md                 # This file
└── BACKEND_ARCHITECTURE.md  # Detailed architecture
```

---

## 🔍 Troubleshooting

### Database Connection Issues

**Error: "SQLSTATE[08006]"**
```bash
# Check PostgreSQL is running
systemctl status postgresql
# or
brew services list  # macOS

# Check credentials in .env
# Test connection directly
psql -h localhost -U postgres -d nirvona
```

### Redis Connection Issues

**Error: "Connection refused"**
```bash
# Check Redis is running
redis-cli ping

# If not running, start it
redis-server
# or
brew services start redis  # macOS
```

### PHP Extension Issues

**Error: "Call to undefined function PDO"**
```bash
# Install PostgreSQL extension
# macOS with Homebrew
brew install php@8.2
# or use Docker which includes all extensions
```

### Permission Denied Errors

```bash
# Fix storage directory permissions
chmod -R 755 storage/
chmod -R 777 storage/logs
chmod -R 777 storage/cache

# On macOS, may need to set correct owner
sudo chown -R $USER storage/
```

### Port Already in Use

```bash
# If port 8000 is already in use
# Use different port
php -S localhost:8080 -t public/

# Or find and kill process using port 8000
lsof -i :8000
kill -9 <PID>
```

---

## 📚 Additional Resources

- **Architecture Documentation:** `BACKEND_ARCHITECTURE.md`
- **API Routes:** `routes/api.php`, `routes/admin.php`, `routes/student.php`
- **Environment Variables:** `.env.example`
- **Tests:** `tests/Unit/StudentServiceTest.php`
- **Database Migrations:** `database/migrations/`

---

## 🚀 Next Steps

1. **Understand Error Isolation:** Read the BaseService implementation
2. **Review Circuit Breaker:** Check how external services are protected
3. **Test API Endpoints:** Use the provided curl examples
4. **Run Unit Tests:** Execute `make test` to ensure everything works
5. **Explore Code:** Start with Controllers, then Services, then Repositories

---

## ✨ Quick Commands Summary

```bash
# Development
make serve              # Start local server
make test              # Run tests
make lint              # Check code quality
make format            # Auto-format code

# Docker
make docker-up         # Start Docker containers
make docker-down       # Stop Docker containers
make docker-logs       # View Docker logs

# Database
make migrate           # Run migrations
make fresh             # Reset database
```

---

## 💡 Tips

- Use `make help` to see all available commands
- Check `.env.example` for all configurable options
- Review `BACKEND_ARCHITECTURE.md` for system design details
- Enable `APP_DEBUG=true` only in development
- Always use environment variables for sensitive data
- Test database connection before running application

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs in `storage/logs/app.log`
3. Check `.env` configuration
4. Ensure all prerequisites are installed and running
5. Refer to `BACKEND_ARCHITECTURE.md` for design details
