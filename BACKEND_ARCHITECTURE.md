# Nirvona Backend Architecture - PHP MVC

## Project Overview
Nirvona is a Computer-Based Testing (CBT) platform for exam management and student performance analytics. This document outlines the recommended backend architecture, database choice, and MVC structure.

---

## 1. Database Selection for Large-Scale Projects

### Primary Database: **PostgreSQL**

PostgreSQL is the **recommended primary database** for Nirvona due to:

#### ✅ Advantages:
- **ACID Compliance**: Ensures data integrity for critical operations (payments, exam credentials, results)
- **Complex Queries**: Excellent for analytical queries (performance tracking, rankings, analytics)
- **Scalability**: Handles millions of records with proper indexing
- **Full-Text Search**: Built-in support for searching exam questions, topics, student data
- **JSON Support**: JSONB data type for flexible schemas (exam patterns, syllabus, configurations)
- **Replication**: Master-slave replication for high availability
- **Advanced Features**: Window functions, CTEs, triggers for complex business logic
- **Cost-Effective**: Open-source, no licensing costs
- **Proven Track Record**: Used by giants like Spotify, Netflix, Instagram

### Secondary Cache Layer: **Redis**

Use **Redis** for:
- **Session Management**: Student login sessions, admin tokens
- **Result Caching**: Cache exam results, performance analysis
- **Rate Limiting**: Prevent abuse on payment endpoints
- **Real-time Notifications**: Queue for WhatsApp/SMS/Email notifications
- **Leaderboards**: Efficiently manage exam rankings and percentiles

### Search Engine (Optional): **Elasticsearch**

For large-scale analytics:
- Full-text search across exams, questions, topics
- Real-time analytics dashboards
- Advanced filtering and aggregations

---

## 2. Database Schema Overview

### Core Tables for Nirvona:

```
Students
├── Enrollments
├── Payments
├── Exam_Candidates
├── Admit_Cards
├── Exam_Credentials
├── Student_Responses
└── Results

Courses
├── Packages
├── Subjects
├── Topics
└── Syllabus

Exams
├── Exam_Centres
├── Questions
├── Answer_Keys
└── Exam_Credentials

Performance
├── Result_Analysis
├── Topic_Performance
└── Leaderboards
```

---

## 3. PHP MVC Backend Architecture

### Directory Structure:

```
nirvona-backend/
├── public/
│   └── index.php                 # Single entry point
├── app/
│   ├── Controllers/              # HTTP Request Handlers
│   │   ├── StudentController.php
│   │   ├── ExamController.php
│   │   ├── PaymentController.php
│   │   ├── ResultController.php
│   │   └── AdminController.php
│   ├── Models/                   # Database Layer
│   │   ├── Student.php
│   │   ├── Exam.php
│   │   ├── Payment.php
│   │   ├── Result.php
│   │   └── BaseModel.php         # Abstract base model
│   ├── Repositories/             # Database Queries
│   │   ├── StudentRepository.php
│   │   ├── ExamRepository.php
│   │   ├── PaymentRepository.php
│   │   └── ResultRepository.php
│   ├── Services/                 # Business Logic (Error Isolation)
│   │   ├── StudentService.php
│   │   ├── ExamService.php
│   │   ├── PaymentService.php
│   │   ├── ResultService.php
│   │   ├── NotificationService.php
│   │   └── BaseService.php       # Error handling base class
│   ├── Middleware/               # Request/Response Processing
│   │   ├── AuthMiddleware.php
│   │   ├── ValidationMiddleware.php
│   │   ├── ErrorHandlingMiddleware.php
│   │   ├── CORSMiddleware.php
│   │   └── RateLimitMiddleware.php
│   ├── Exceptions/               # Custom Exceptions
│   │   ├── ServiceException.php
│   │   ├── RepositoryException.php
│   │   ├── ValidationException.php
│   │   └── AuthenticationException.php
│   ├── Helpers/                  # Utility Functions
│   │   ├── ResponseHelper.php
│   │   ├── ValidationHelper.php
│   │   ├── DateHelper.php
│   │   └── FileHelper.php
│   └── Config/                   # Configuration Files
│       ├── Database.php
│       ├── Cache.php
│       └── Mail.php
├── routes/
│   ├── api.php                   # API Routes
│   ├── admin.php                 # Admin Routes
│   └── student.php               # Student Routes
├── tests/
│   ├── Unit/                     # Unit Tests
│   ├── Feature/                  # Integration Tests
│   └── bootstrap.php             # Test Configuration
├── .env                          # Environment Variables
├── .env.example                  # Environment Template
├── composer.json                 # PHP Dependencies
├── README.md                     # Setup Instructions
└── docker-compose.yml            # Docker Setup (Optional)
```

---

## 4. Error Isolation & Resilience Strategy

### Problem: Service Interdependency Failures
When one service fails, the entire system crashes. This is solved through:

### Solution 1: Service Exception Handling

```php
// app/Exceptions/ServiceException.php
class ServiceException extends Exception {
    protected $service;
    protected $retryable;
    
    public function __construct($message, $service, $retryable = false) {
        parent::__construct($message);
        $this->service = $service;
        $this->retryable = $retryable;
    }
}
```

### Solution 2: BaseService with Error Isolation

```php
// app/Services/BaseService.php
abstract class BaseService {
    protected $logger;
    
    public function executeWithFallback($callable, $fallback = null) {
        try {
            return $callable();
        } catch (ServiceException $e) {
            $this->logger->error("Service failed: " . $e->getMessage());
            
            // Return fallback value instead of crashing
            return $fallback ?? [
                'success' => false,
                'message' => $e->getMessage(),
                'service' => $e->service
            ];
        }
    }
}
```

### Solution 3: Circuit Breaker Pattern

```php
// app/Services/CircuitBreaker.php
class CircuitBreaker {
    const STATE_CLOSED = 'closed';      // Normal operation
    const STATE_OPEN = 'open';          // Service down
    const STATE_HALF_OPEN = 'half_open'; // Testing recovery
    
    public function execute($service, $callable) {
        $state = $this->getState($service);
        
        if ($state === self::STATE_OPEN) {
            return $this->getFallbackResponse($service);
        }
        
        try {
            $result = $callable();
            $this->setState($service, self::STATE_CLOSED);
            return $result;
        } catch (Exception $e) {
            $this->setState($service, self::STATE_OPEN);
            return $this->getFallbackResponse($service);
        }
    }
}
```

### Solution 4: Queue-Based Processing

```php
// Critical operations go to queue, not direct execution
class PaymentService extends BaseService {
    public function processPayment(Payment $payment) {
        try {
            // Immediate response to client
            $this->queue->enqueue('payment.process', $payment);
            return ['status' => 'processing', 'id' => $payment->id];
        } catch (Exception $e) {
            return ['status' => 'failed', 'error' => $e->getMessage()];
        }
    }
}
```

---

## 5. Naming Conventions

### Controllers
```
StudentController.php          // Handles /api/students
ExamController.php             // Handles /api/exams
PaymentController.php          // Handles /api/payments
ResultController.php           // Handles /api/results
AdminController.php            // Handles /api/admin
```

### Models
```
Student.php                    // DB table: students
Exam.php                       // DB table: exams
Payment.php                    // DB table: payments
ExamCredential.php             // DB table: exam_credentials
AdmitCard.php                  // DB table: admit_cards
StudentResponse.php            // DB table: student_responses
Result.php                     // DB table: results
```

### Services
```
StudentService.php             // Student business logic
ExamService.php                // Exam management logic
PaymentService.php             // Payment processing logic
ResultService.php              // Result calculation & analysis
NotificationService.php        // Email/SMS/WhatsApp notifications
```

### Methods
```
// Repositories - Database queries
StudentRepository::getById($id)
StudentRepository::getByEmail($email)
StudentRepository::findActive()

// Services - Business logic
StudentService::registerStudent($data)
StudentService::updateProfile($studentId, $data)
ExamService::scheduleExam($examData)
ResultService::calculateResult($examId, $studentId)
```

---

## 6. Request/Response Flow

```
Client Request
    ↓
Routing (routes/api.php)
    ↓
Middleware Stack
    ├─ CORS Middleware
    ├─ Auth Middleware
    ├─ Validation Middleware
    └─ Rate Limit Middleware
    ↓
Controller
    ├─ Input Validation
    └─ Call Service
    ↓
Service (Business Logic)
    ├─ Circuit Breaker Check
    ├─ Repository Call
    ├─ Exception Handling
    └─ Return Result/Fallback
    ↓
Repository (Database Query)
    └─ Return Data
    ↓
Response Helper
    └─ Format JSON Response
    ↓
Client Response (JSON)
```

---

## 7. API Response Standards

```php
// Success Response
{
    "success": true,
    "data": { /* actual data */ },
    "meta": {
        "timestamp": "2026-09-10T10:30:00Z",
        "requestId": "req_xyz123"
    }
}

// Error Response
{
    "success": false,
    "error": {
        "code": "PAYMENT_FAILED",
        "message": "Payment processing failed",
        "service": "PaymentService",
        "retryable": true
    },
    "meta": {
        "timestamp": "2026-09-10T10:30:00Z",
        "requestId": "req_xyz123"
    }
}

// Validation Error Response
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Validation failed",
        "details": {
            "email": "Invalid email format",
            "mobile": "Mobile must be 10 digits"
        }
    }
}
```

---

## 8. Key Features for Large-Scale Systems

### ✅ Caching Strategy
- **Page Cache**: Cache exam data, course info (1 hour TTL)
- **Query Cache**: Cache heavy queries (results, analytics)
- **Session Cache**: Redis for user sessions
- **Invalidation**: Clear cache on data updates

### ✅ Database Optimization
- **Indexing**: Index on studentId, examId, courseSlug, status fields
- **Partitioning**: Partition large tables (results) by exam date
- **Read Replicas**: Separate read-heavy queries to replica databases
- **Query Optimization**: Use proper JOINs and avoid N+1 queries

### ✅ Logging & Monitoring
- **Structured Logging**: JSON format with context
- **Error Tracking**: Sentry/Bugsnag for exception monitoring
- **Performance Monitoring**: Track slow queries, API response times
- **Audit Trail**: Log all admin actions, payment transactions

### ✅ Rate Limiting
- Login attempts: 5 per minute per IP
- API calls: 1000 per hour per user
- Payment endpoint: 10 per minute per student

### ✅ Security
- **Input Validation**: Sanitize all inputs
- **SQL Injection Prevention**: Use prepared statements
- **CORS**: Whitelist frontend domains only
- **HTTPS**: Enforce SSL/TLS
- **JWT Tokens**: Stateless authentication
- **Password Hashing**: Use bcrypt/Argon2

---

## 9. Technology Stack

| Layer | Technology |
|-------|-----------|
| **Backend Language** | PHP 8.2+ |
| **Framework** | Laravel or Slim (lightweight MVC) |
| **Primary DB** | PostgreSQL 13+ |
| **Cache** | Redis 6+ |
| **Search** | Elasticsearch 7+ (optional) |
| **Message Queue** | Redis Queue or RabbitMQ |
| **API Documentation** | OpenAPI/Swagger |
| **Testing** | PHPUnit, Pest |
| **Containerization** | Docker |
| **CI/CD** | GitHub Actions |

---

## 10. Deployment Architecture

```
Load Balancer (Nginx)
    ├─ PHP-FPM Server 1
    ├─ PHP-FPM Server 2
    └─ PHP-FPM Server 3
        ↓
PostgreSQL Primary
    ├─ Replica 1 (Read-only)
    └─ Replica 2 (Read-only)
        ↓
Redis Cluster
    ├─ Cache Layer
    ├─ Session Store
    └─ Message Queue
```

---

## 11. Getting Started

### Prerequisites
- PHP 8.2+
- PostgreSQL 13+
- Redis 6+
- Composer
- Docker (optional)

### Installation
```bash
# Clone repository
git clone https://github.com/Parthbadgujar1/Nirvona.git
cd Nirvona/backend

# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate app key
php artisan key:generate

# Run migrations
php artisan migrate

# Start development server
php artisan serve
```

### Docker Setup
```bash
docker-compose up -d
```

---

## 12. Next Steps

1. **Set up PostgreSQL schema** with proper indexing
2. **Create Laravel/Slim project** structure
3. **Implement Authentication** with JWT
4. **Build REST API endpoints** for each module
5. **Set up Redis caching** layer
6. **Implement error handling** and circuit breakers
7. **Add comprehensive logging** and monitoring
8. **Write unit and integration tests**
9. **Deploy to production** with Docker

---

## 📞 Support & Questions

For architecture questions or clarifications, refer to the CLAUDE.md file or contact the development team.
