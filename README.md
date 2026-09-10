# Nirvona - Computer-Based Testing (CBT) Platform

A modern, scalable exam management and student performance analytics platform built with **Next.js frontend** and **PHP MVC backend** with error isolation and resilience patterns.

## 📋 Project Structure

```
Nirvona/
├── src/                             # Next.js Frontend
│   ├── app/                        # App Router (routes)
│   ├── components/                 # React Components
│   │   ├── admin/                  # Admin Dashboard
│   │   ├── student/                # Student Portal
│   │   ├── public/                 # Public Pages
│   │   ├── shared/                 # Shared Components
│   │   └── ui/                     # UI Components (Radix)
│   ├── services/                   # API Service Layer
│   ├── types/                      # TypeScript Interfaces
│   ├── data/                       # Mock Data
│   ├── hooks/                      # React Hooks
│   └── lib/                        # Utility Functions
│
├── backend/                         # PHP MVC Backend
│   ├── app/
│   │   ├── Controllers/            # Request Handlers
│   │   ├── Services/               # Business Logic (Error Isolation)
│   │   │   ├── BaseService.php     # Base with error handling
│   │   │   ├── CircuitBreaker.php  # Resilience pattern
│   │   │   ├── StudentService.php
│   │   │   ├── PaymentService.php  # With circuit breaker
│   │   │   └── ResultService.php
│   │   ├── Repositories/           # Data Access Layer
│   │   ├── Middleware/             # Request Processing
│   │   ├── Exceptions/             # Error Handling
│   │   └── Helpers/                # Utilities
│   ├── routes/                     # API Routes
│   ├── database/                   # Migrations & Seeders
│   ├── .env.example                # Environment Template
│   ├── composer.json               # PHP Dependencies
│   └── README.md                   # Backend Setup Guide
│
├── public/                          # Static Assets
├── BACKEND_ARCHITECTURE.md          # System Design & DB Selection
├── CLAUDE.md                        # AI Development Notes
├── package.json                    # Frontend Dependencies
└── README.md                        # This file
```

## 🎯 Key Features

### ✨ Frontend (Next.js + React)
- **Student Portal**: Exams, results, performance tracking
- **Admin Dashboard**: Exam management, student analytics, payments
- **Real-time Analytics**: Interactive charts with Recharts
- **Responsive Design**: Tailwind CSS + Radix UI components
- **Type Safety**: Full TypeScript coverage
- **Authentication**: Secure login/register flows
- **Payment Integration**: Razorpay gateway ready

### 🚀 Backend (PHP MVC) - Enterprise Grade
- **Error Isolation**: Services fail independently without crashing system
- **Circuit Breaker Pattern**: Prevent cascade failures to external services
- **REST API**: Clean, versioned endpoints with JWT auth
- **PostgreSQL**: ACID compliance, advanced indexing, JSON support
- **Redis Caching**: Session management, query caching, leaderboards
- **Rate Limiting**: Protection against abuse (5 login/min, 1000 API/hour)
- **Structured Logging**: Audit trails for compliance & debugging
- **Database Optimization**: Strategic indexing, query optimization

---

## 🚀 Quick Start

### Frontend Setup
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Visit http://localhost:3000
```

### Backend Setup
```bash
cd backend

# Install PHP dependencies
composer install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Database migrations
php artisan migrate

# Start development server
php -S localhost:8000 -t public/

# API available at http://localhost:8000/api
```

### Docker Setup (Recommended)
```bash
# Start all services
docker-compose up -d

# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/api
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

---

## 💾 Database Selection

### Primary: PostgreSQL 13+
**Why PostgreSQL?**
- ✅ ACID compliance for data integrity
- ✅ Advanced indexing & query optimization
- ✅ JSON/JSONB support for flexible schemas
- ✅ Full-text search capabilities
- ✅ Window functions for analytics
- ✅ Replication for high availability
- ✅ Cost-effective (open-source)

**Key Tables**:
- `students` - User profiles, enrollments
- `exams` - Exam schedules, questions, credentials
- `payments` - Transaction records, revenue
- `results` - Exam results, performance metrics
- `exam_candidates` - Attendance, admit cards

### Secondary: Redis 6+
**Purpose**:
- Session management
- Result caching (30 min TTL)
- Leaderboard caching (1 hour TTL)
- Message queues for notifications
- Rate limiting counters

See **BACKEND_ARCHITECTURE.md** for complete database design.

---

## 🏗️ Error Isolation & Resilience

### The Problem
Traditional monolithic systems: One service fails → Entire system crashes ❌

### The Solution
**Error Isolation Pattern**: Each service extends `BaseService` which:
1. Wraps operations in try-catch
2. Logs errors with context
3. Returns fallback responses
4. Other services continue operating ✅

```php
// PaymentService fails → StudentService unaffected
return $this->executeWithFallback(
    callable: fn() => $this->paymentGateway->process($data),
    fallback: ['success' => false, 'message' => 'Service unavailable'],
    operation: 'processPayment'
);
```

### Circuit Breaker Pattern
Prevents cascade failures when external services (Razorpay, etc.) are down:

```
CLOSED (Normal Operation)
    ↓ [5 consecutive failures]
OPEN (Stop Calling Service)
    ↓ [After 60 seconds]
HALF_OPEN (Test Recovery)
    ↓ [Test succeeds]
CLOSED (Resume Normal Operation)
```

**Result**: Graceful degradation, no cascade failures.

See **backend/README.md** for implementation details.

---

## 🔐 Security Features

### Frontend
- HTTPS enforcement
- CORS protection
- Secure JWT token storage & handling
- Input validation & sanitization
- XSS protection

### Backend
- **Prepared Statements**: Prevent SQL injection
- **Password Hashing**: bcrypt/Argon2
- **JWT Authentication**: Verify on every request
- **Rate Limiting**: 5 login attempts/min, 1000 API calls/hour
- **Audit Logging**: Track all sensitive operations
- **CORS Whitelisting**: Trust only frontend domain

---

## 📡 API Endpoints

### Student APIs
```
POST   /api/students/register          Create account
GET    /api/students/{id}              Get profile
PUT    /api/students/{id}              Update profile
GET    /api/students/{id}/enrollments  List enrollments
GET    /api/students/{id}/exams        List available exams
GET    /api/students/{id}/results      List results
```

### Payment APIs
```
POST   /api/payments                   Process payment
GET    /api/payments/{id}              Get payment details
POST   /api/payments/{id}/verify       Verify gateway
GET    /api/payments/student/{id}      Payment history
```

### Exam APIs
```
GET    /api/exams                      List all exams
GET    /api/exams/{id}                 Get exam details
POST   /api/exams/{id}/start           Start exam session
POST   /api/exams/{id}/submit          Submit responses
GET    /api/exams/{id}/admit-card      Download admit card
```

### Result APIs
```
GET    /api/results/{id}               Get detailed result
GET    /api/results/student/{id}       Student's all results
GET    /api/results/analytics          Performance analytics
GET    /api/results/leaderboard        Exam leaderboard
```

### Admin APIs
```
GET    /api/admin/dashboard            Dashboard stats
GET    /api/admin/students             List all students
GET    /api/admin/exams                Manage exams
GET    /api/admin/payments             Payment records
```

See **backend/README.md** for complete API documentation.

---

## 🧪 Testing

### Frontend Tests
```bash
npm run test              # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### Backend Tests
```bash
composer test                    # Run all tests
composer test tests/Unit/        # Unit tests only
composer test tests/Feature/     # Integration tests
```

---

## 📊 Performance Optimization

### Database
- Strategic indexing on `studentId`, `examId`, `status`
- Query optimization with proper JOINs
- Partitioning of large tables (results by date)
- Read replicas for analytics queries

### Caching
- Redis session caching (1 hour TTL)
- Result caching (30 minutes)
- Leaderboard caching (1 hour)
- Query result caching (varies by query)

### Frontend
- Code splitting & lazy loading
- Image optimization with Next.js
- CSS/JS minification
- Server-side rendering

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend Framework** | Next.js 16.3, React 19 |
| **Frontend Styling** | Tailwind CSS 4, Radix UI |
| **Frontend Charts** | Recharts 3.10 |
| **Frontend Language** | TypeScript 5 |
| **Backend Framework** | PHP 8.2+, Slim MVC |
| **Backend Language** | PHP with OOP |
| **Primary Database** | PostgreSQL 13+ |
| **Cache Layer** | Redis 6+ |
| **API Protocol** | REST with JSON |
| **Authentication** | JWT (JSON Web Tokens) |
| **Testing** | PHPUnit, Jest, Playwright |
| **Containerization** | Docker, Docker Compose |
| **CI/CD** | GitHub Actions |

---

## 📚 Documentation

- **[BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md)** - System design, database selection, MVC structure, error isolation patterns
- **[backend/README.md](./backend/README.md)** - Backend setup, API endpoints, deployment guide
- **[CLAUDE.md](./CLAUDE.md)** - AI development notes & project context
- **[backend/.env.example](./backend/.env.example)** - Configuration reference

---

## 🚢 Production Deployment

### Checklist
- [ ] Database backups configured
- [ ] Redis persistence enabled
- [ ] SSL/HTTPS certificates installed
- [ ] Environment variables set (`.env`)
- [ ] Rate limiting configured
- [ ] Error tracking (Sentry) setup
- [ ] Monitoring & alerts configured
- [ ] Database migrations run
- [ ] Frontend built (`npm run build`)
- [ ] Docker images built & pushed
- [ ] Load balancer configured
- [ ] CDN configured for static assets

### Deploy with Docker
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🐛 Troubleshooting

### Frontend Issues
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Verify backend is running
curl http://localhost:8000/api/health
```

### Backend Issues
```bash
# Test database connection
psql -U postgres -d nirvona

# Test Redis connection
redis-cli ping

# View error logs
tail -f backend/storage/logs/app.log

# Run migrations
cd backend && php artisan migrate
```

---

## 📞 Support & Documentation

1. Check **BACKEND_ARCHITECTURE.md** for system design questions
2. Review **backend/README.md** for backend-specific issues
3. Check error logs: `backend/storage/logs/app.log`
4. Contact development team for enterprise support

---

## 📄 License

Nirvona CBT Platform - All rights reserved

---

## 🙏 Acknowledgments

Built with modern technologies for scalable, resilient education delivery:

- **Next.js & React** for modern frontend
- **PHP 8.2 & MVC** for robust backend
- **PostgreSQL & Redis** for data persistence & performance
- **Docker** for containerization & DevOps
- **Open Source Community** for amazing tools

---

**Status**: 🚀 Active Development  
**Last Updated**: September 10, 2026  
**Version**: 0.1.0
