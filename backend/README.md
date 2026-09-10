# Nirvona Backend - PHP MVC Architecture

A robust, scalable Computer-Based Testing (CBT) platform backend built with PHP using MVC architecture with **error isolation** to ensure one service failure doesn't crash the entire system.

## 🎯 Features

✅ **Error Isolation** - Services fail independently without cascading failures  
✅ **Circuit Breaker Pattern** - Prevent repeated calls to failing services  
✅ **Resilient Architecture** - Fallback responses ensure continuous operation  
✅ **PostgreSQL** - ACID compliance for data integrity  
✅ **Redis Caching** - Session management and performance optimization  
✅ **RESTful API** - Clean, standardized API endpoints  
✅ **JWT Authentication** - Stateless secure token-based auth  
✅ **Comprehensive Logging** - Structured logging for debugging & monitoring  
✅ **Rate Limiting** - Protect against abuse and DoS attacks  

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Next.js Frontend)                │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer (Nginx)                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│    ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│    │ PHP-FPM  │  │ PHP-FPM  │  │ PHP-FPM  │  Cluster       │
│    │  Server  │  │  Server  │  │  Server  │                │
│    └────┬─────┘  └────┬─────┘  └────┬─────┘                │
│         │             │             │                      │
│    Middleware Stack:                                        │
│    ├─ CORS/Security                                         │
│    ├─ Authentication (JWT)                                  │
│    ├─ Validation                                            │
│    ├─ Rate Limiting                                         │
│    └─ Error Handling                                        │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
    ┌──────────────────────────┬──────────────────┐
    ↓                          ↓                  ↓
┌─────────────┐        ┌──────────────┐    ┌──────────┐
│ PostgreSQL  │        │   Redis      │    │ Elastic  │
│ (Primary)   │        │   Cache      │    │ Search   │
│             │        │              │    │ (Optional)
│ • Students  │        │ • Sessions   │    │          │
│ • Exams     │        │ • Cache      │    │ • Logs   │
│ • Payments  │        │ • Queues     │    │ • Metrics│
│ • Results   │        │ • Leaderboard    │          │
└─────────────┘        └──────────────┘    └──────────┘
```

---

## 🏗️ MVC Directory Structure

```
backend/
├── app/
│   ├── Controllers/              # HTTP Request Handlers
│   │   ├── StudentController.php
│   │   ├── ExamController.php
│   │   ├── PaymentController.php
│   │   ├── ResultController.php
│   │   └── AdminController.php
│   │
│   ├── Models/                   # Database Models
│   │   ├── Student.php
│   │   ├── Exam.php
│   │   ├── Payment.php
│   │   └── Result.php
│   │
│   ├── Repositories/             # Data Access Layer
│   │   ├── BaseRepository.php
│   │   ├── StudentRepository.php
│   │   ├── ExamRepository.php
│   │   ├── PaymentRepository.php
│   │   └── ResultRepository.php
│   │
│   ├── Services/                 # Business Logic (Error Isolation)
│   │   ├── BaseService.php       # Base with error handling
│   │   ├── CircuitBreaker.php    # Resilience pattern
│   │   ├── StudentService.php
│   │   ├── ExamService.php
│   │   ├── PaymentService.php    # With circuit breaker
│   │   ├── ResultService.php
│   │   └── NotificationService.php
│   │
│   ├── Middleware/               # Request/Response Processing
│   │   ├── AuthMiddleware.php
│   │   ├── ValidationMiddleware.php
│   │   ├── ErrorHandlingMiddleware.php
│   │   ├── CORSMiddleware.php
│   │   └── RateLimitMiddleware.php
│   │
│   ├── Exceptions/               # Custom Exceptions
│   │   ├── ServiceException.php
│   │   ├── ValidationException.php
│   │   └── AuthenticationException.php
│   │
│   ├── Helpers/                  # Utility Functions
│   │   ├── ResponseHelper.php
│   │   ├── ValidationHelper.php
│   │   └── DateHelper.php
│   │
│   └── Config/                   # Configuration
│       ├── Database.php
│       ├── Cache.php
│       └── App.php
│
├── routes/
│   ├── api.php                   # API Routes
│   ├── admin.php                 # Admin Routes
│   └── student.php               # Student Routes
│
├── database/
│   ├── migrations/               # Database Migrations
│   └── seeders/                  # Database Seeders
│
├── tests/
│   ├── Unit/                     # Unit Tests
│   └── Feature/                  # Integration Tests
│
├── public/
│   └── index.php                 # Entry Point
│
├── .env.example                  # Environment Template
├── composer.json                 # PHP Dependencies
└── README.md                     # This file
```

---

## 🚀 Quick Start

### Prerequisites

- PHP 8.2+
- PostgreSQL 13+
- Redis 6+
- Composer
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Parthbadgujar1/Nirvona.git
   cd Nirvona/backend
   ```

2. **Install dependencies**
   ```bash
   composer install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Setup database**
   ```bash
   php artisan migrate
   php artisan seed:run  # Optional: seed with test data
   ```

5. **Start development server**
   ```bash
   php -S localhost:8000 -t public/
   ```

API will be available at: `http://localhost:8000/api`

### Docker Setup

```bash
# Build and start containers
docker-compose up -d

# Run migrations
docker-compose exec app php artisan migrate

# View logs
docker-compose logs -f app
```

---

## 🔑 Key Concepts

### 1. Error Isolation (BaseService)

Services extend `BaseService` which wraps operations in try-catch blocks:

```php
public function registerStudent(array $data): array {
    return $this->executeWithFallback(
        function () use ($data) {
            // Operation that might fail
            return $this->studentRepository->create($data);
        },
        null,  // Fallback value
        'registerStudent'  // Operation name for logging
    );
}
```

**Result**: If registration fails, a fallback response is returned instead of throwing an exception. Other services continue operating.

### 2. Circuit Breaker Pattern

Prevents cascade failures when external services (like payment gateway) are down:

```
CLOSED (Normal)
    ↓ [5 failures]
OPEN (Stop calling service, return fallback)
    ↓ [After 60 seconds]
HALF_OPEN (Test if service recovered)
    ↓ [Test succeeds]
CLOSED (Resume normal operation)
```

### 3. Repository Pattern

Centralized database queries make it easy to:
- Change database implementation
- Add caching
- Optimize queries

```php
// Controller calls Service
$student = $studentService->getStudent($id);

// Service calls Repository
$student = $studentRepository->getById($id);

// Repository executes query
$stmt = $this->db->prepare("SELECT * FROM students WHERE id = ?");
```

### 4. Response Format

All API responses follow standard format:

**Success:**
```json
{
  "success": true,
  "data": { /* actual data */ },
  "meta": {
    "timestamp": "2026-09-10T10:30:00Z",
    "requestId": "req_xyz123"
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Service temporarily unavailable",
    "service": "PaymentService",
    "retryable": true
  }
}
```

---

## 🔐 Authentication

The backend uses **JWT (JSON Web Tokens)** for stateless authentication:

1. Client sends credentials to `/api/login`
2. Backend verifies and returns JWT token
3. Client includes token in `Authorization: Bearer {token}` header
4. Backend validates token in `AuthMiddleware`

**Token Expiration**: 1 hour (configurable in `.env`)

```php
// AuthMiddleware validates every request
$token = $request->getHeaderLine('Authorization');
// Extract: "Bearer {token}" → {token}
$payload = JWT::decode($token, $key, ['HS256']);
// User ID available as $payload->sub
```

---

## 📡 API Endpoints

### Student Endpoints

```
POST   /api/students/register          Register new student
GET    /api/students/{id}              Get student profile
PUT    /api/students/{id}              Update profile
GET    /api/students/{id}/enrollments  List enrollments
GET    /api/students/{id}/exams        List available exams
```

### Exam Endpoints

```
GET    /api/exams                      List all exams
GET    /api/exams/{id}                 Get exam details
POST   /api/exams/{id}/start           Start exam session
POST   /api/exams/{id}/submit          Submit responses
GET    /api/exams/{id}/admit-card      Download admit card
```

### Payment Endpoints

```
POST   /api/payments                   Process payment
GET    /api/payments/{id}              Get payment details
POST   /api/payments/{id}/verify       Verify with gateway
GET    /api/payments/student/{id}      List student payments
```

### Result Endpoints

```
GET    /api/results/{id}               Get exam result
GET    /api/results/student/{id}       List student results
GET    /api/results/analytics          Get performance analytics
GET    /api/results/leaderboard        Get exam leaderboard
```

### Admin Endpoints

```
GET    /api/admin/dashboard            Admin dashboard stats
GET    /api/admin/students             List all students
GET    /api/admin/payments             List all payments
POST   /api/admin/exams                Create exam
```

---

## 🛡️ Security Features

### Input Validation
```php
$errors = $this->validate($data, [
    'email' => ['required', 'email'],
    'mobile' => ['required', 'numeric'],
]);
```

### SQL Injection Prevention
All queries use prepared statements:
```php
$stmt = $this->db->prepare("SELECT * FROM students WHERE id = ?");
$stmt->execute([$id]);  // Safe: parameter separated from SQL
```

### Rate Limiting
Prevent abuse with configurable limits:
- Login attempts: 5 per minute per IP
- API calls: 1000 per hour per user
- Payment endpoint: 10 per minute per student

### CORS Protection
Whitelist only trusted frontend domains in `.env`:
```env
FRONTEND_URL=http://localhost:3000
```

### JWT Security
- Tokens signed with secret key
- Tokens expire after 1 hour
- Signature verified on each request

---

## 📊 Database Schema (PostgreSQL)

Key tables for Nirvona:

### Students
```sql
CREATE TABLE students (
    id UUID PRIMARY KEY,
    fullName VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(20),
    className VARCHAR(50),
    school VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    enrolledAt TIMESTAMP,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_status ON students(status);
```

### Payments
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY,
    studentId UUID NOT NULL REFERENCES students(id),
    packageId UUID NOT NULL,
    amount DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'pending',
    transactionId VARCHAR(255),
    method VARCHAR(50),
    date TIMESTAMP,
    retryCount INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_payments_studentId ON payments(studentId);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_date ON payments(date);
```

### Exams
```sql
CREATE TABLE exams (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    courseSlug VARCHAR(100),
    date TIMESTAMP NOT NULL,
    durationMinutes INT,
    totalQuestions INT,
    totalMarks INT,
    status VARCHAR(50) DEFAULT 'draft',
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_exams_date ON exams(date);
```

---

## 🧪 Testing

Run tests with PHPUnit:

```bash
# Run all tests
composer test

# Run specific test
composer test tests/Unit/StudentServiceTest.php

# Run with coverage
composer test -- --coverage-html coverage/
```

Example test:
```php
public function testStudentRegistration() {
    $studentService = new StudentService($repo, $logger, $breaker);
    
    $result = $studentService->registerStudent([
        'fullName' => 'John Doe',
        'email' => 'john@example.com',
        'mobile' => '9876543210',
    ]);
    
    $this->assertTrue($result['success']);
    $this->assertIsString($result['data']['id']);
}
```

---

## 📝 Logging & Monitoring

All operations are logged:

```php
// Service logs all actions
$this->logger->info("User logged in", [
    'userId' => $userId,
    'ip' => $ipAddress,
    'timestamp' => time(),
]);

// Errors are logged with context
$this->logger->error("Payment processing failed", [
    'paymentId' => $paymentId,
    'error' => $e->getMessage(),
    'retryable' => true,
]);
```

View logs:
```bash
tail -f storage/logs/app.log
```

---

## 🚦 Rate Limiting

Configure in `.env`:
```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=1000      # Max requests
RATE_LIMIT_MINUTES=60         # Per this many minutes
```

Different endpoints can have different limits (configured in middleware).

---

## 📦 Database Indexing Strategy

Create indexes for optimal query performance:

```sql
-- Student lookups
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_className_status ON students(className, status);

-- Payment queries
CREATE INDEX idx_payments_studentId_status ON payments(studentId, status);
CREATE INDEX idx_payments_date ON payments(DATE(date));

-- Result queries
CREATE INDEX idx_results_studentId ON results(studentId);
CREATE INDEX idx_results_examId ON results(examId);
CREATE INDEX idx_results_rank ON results(rank);

-- Exam queries
CREATE INDEX idx_exams_status_date ON exams(status, date);
CREATE INDEX idx_exams_courseSlug ON exams(courseSlug);
```

---

## 🔍 Troubleshooting

### Payment Service Failing
If payment processing fails repeatedly:
1. Check Redis connection (`REDIS_HOST`, `REDIS_PORT`)
2. Verify payment gateway credentials
3. Circuit breaker will automatically return fallback responses
4. No other services affected

### Database Connection Issues
```php
// Connection string in .env
DB_CONNECTION=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=nirvona
DB_USERNAME=postgres
DB_PASSWORD=secret
```

### High Memory Usage
Check for:
- Large query results not paginated
- Unclosed database connections
- Memory leaks in services

---

## 📚 Documentation

See related docs:
- `../BACKEND_ARCHITECTURE.md` - System design & database selection
- `../CLAUDE.md` - Project overview
- `.env.example` - Configuration reference

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes following the MVC structure
3. Write tests for new features
4. Commit: `git commit -m "Add new feature"`
5. Push: `git push origin feature/new-feature`
6. Create Pull Request

---

## 📄 License

This project is part of the Nirvona CBT Platform.

---

## 📞 Support

For questions or issues:
1. Check the troubleshooting section
2. Review logs in `storage/logs/`
3. Contact development team

---

**Built with ❤️ for scalable, resilient education technology**
