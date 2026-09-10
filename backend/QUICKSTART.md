# Nirvona Backend - Quick Start Guide

Get the Nirvona backend running in minutes! Choose your preferred setup method.

## ⚡ 30-Second Setup (Docker)

```bash
# Clone and navigate
git clone https://github.com/Parthbadgujar1/Nirvona.git
cd Nirvona/backend

# Copy environment
cp .env.example .env

# Start containers
docker-compose up -d

# Verify
curl http://localhost/api/health
```

**That's it!** 🎉 Your backend is running at `http://localhost/api`

---

## 💻 Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/Parthbadgujar1/Nirvona.git
cd Nirvona/backend
```

### 2. Install Dependencies
```bash
composer install
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 4. Verify Setup
```bash
php verify-setup.php
```

### 5. Start Server
```bash
php -S localhost:8000 -t public/
```

**Access:** `http://localhost:8000/api/health`

---

## 🐳 Docker Setup (Production-like)

### 1. Clone Repository
```bash
git clone https://github.com/Parthbadgujar1/Nirvona.git
cd Nirvona/backend
```

### 2. Setup Environment
```bash
cp .env.example .env
```

### 3. Start Services
```bash
docker-compose up -d
```

### 4. Verify
```bash
docker-compose ps  # Check all services running
curl http://localhost/api/health  # Test API
```

### 5. View Logs
```bash
docker-compose logs -f app
```

---

## 📝 Available Commands

### Development Server
```bash
# Local PHP server
php -S localhost:8000 -t public/

# Or using make
make serve

# Or using Docker
docker-compose up -d
```

### Running Tests
```bash
# All tests
make test
vendor/bin/phpunit

# Unit tests only
make test-unit

# With coverage report
make test-coverage
```

### Code Quality
```bash
# Format code
make format

# Check standards
make cs

# Static analysis
make stan

# All checks
make lint
```

### Database
```bash
# Run migrations (manual, see SETUP.md for details)
php -r "..."

# Reset database
make fresh
```

---

## 🧪 Test API Endpoints

### Health Check
```bash
curl http://localhost:8000/api/health
```

### Register Student
```bash
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

### List Exams
```bash
curl http://localhost:8000/api/exams
```

---

## 🔍 Check Status

### Docker
```bash
# See running containers
docker-compose ps

# View logs
docker-compose logs -f app

# Enter container
docker-compose exec app sh
```

### Local
```bash
# Check PHP version
php -v

# Check extensions
php -m

# Verify database connection
php verify-setup.php
```

---

## 🛠️ Troubleshooting

### Port Already in Use
```bash
# Use different port
php -S localhost:8080 -t public/

# Or kill existing process
lsof -i :8000
kill -9 <PID>
```

### Database Connection Failed
```bash
# Check credentials in .env
cat .env

# Test connection (if local PostgreSQL)
psql -U postgres -h localhost -d nirvona
```

### Docker Issues
```bash
# Restart containers
docker-compose restart

# Remove and rebuild
docker-compose down
docker-compose up -d --build

# Check logs
docker-compose logs app
```

### Permission Denied
```bash
# Fix storage permissions
chmod -R 755 storage/
```

---

## 📚 Learn More

- **Full Setup Guide:** `SETUP.md`
- **Architecture Details:** `BACKEND_ARCHITECTURE.md`
- **API Documentation:** See routes in `routes/api.php`
- **Database Schema:** See `database/migrations/`
- **Error Isolation Pattern:** See `app/Services/BaseService.php`

---

## 🚀 What's Included

✅ **Error Isolation** - Services fail independently  
✅ **Circuit Breaker** - Protect external services  
✅ **PostgreSQL** - Production-grade database  
✅ **Redis** - Caching and sessions  
✅ **Docker** - Containerized setup  
✅ **Comprehensive Tests** - Unit and integration tests  
✅ **Code Quality** - Linting and static analysis  
✅ **Detailed Documentation** - Multiple guides included  

---

## 🎯 Next Steps

1. **Choose setup method** (Docker recommended for quick start)
2. **Verify setup** with `php verify-setup.php`
3. **Test API** with provided curl examples
4. **Run tests** with `make test`
5. **Explore code** starting with Services layer
6. **Read architecture** guide for design patterns

---

## ⚙️ Environment Variables

Key variables to configure in `.env`:

```env
# Application
APP_ENV=development
APP_DEBUG=true

# Database
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=nirvona
DB_USERNAME=postgres
DB_PASSWORD=secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=dev-secret-key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

See `.env.example` for all options.

---

## 🆘 Need Help?

1. Check `SETUP.md` for detailed setup guide
2. Review `BACKEND_ARCHITECTURE.md` for system design
3. Check logs in `storage/logs/app.log`
4. Run `php verify-setup.php` to diagnose issues
5. Refer to troubleshooting section above

---

## 🎉 Ready to Go!

Your Nirvona backend is ready for development. Start coding and building amazing features! 🚀

Need more details? See the complete `SETUP.md` guide.
