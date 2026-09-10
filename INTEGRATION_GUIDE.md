# Nirvona Frontend-Backend Integration Guide

Complete guide for integrating and testing the frontend and backend together.

## 📚 Overview

The Nirvona platform consists of two independently deployable parts that work seamlessly together:

- **Backend** (PHP MVC) - Data, authentication, business logic
- **Frontend** (Next.js) - User interface, dynamic data rendering

This guide explains how they integrate and how to set up both for development, testing, and production.

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                      User's Browser                              │
│                   (Nirvona Frontend - Next.js)                   │
│                                                                  │
│  Pages (Auth, Student, Admin, Public) → Components → Services   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                    HTTP/REST │ (Automatic Routing)
                             │
                             ▼
                  ┌──────────────────────┐
                  │   Network Layer      │
                  │  (http.ts)           │
                  │                      │
                  │ - Fetch from API?    │
                  │ - Mock mode?         │
                  │ - Fallback?          │
                  └──────────┬───────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
     ┌────▼──────┐                    ┌────────▼──────┐
     │  Backend   │                    │   Mock Data   │
     │ (PHP/PSql)│                    │  (Fallback)   │
     │            │                    │               │
     │ - API      │                    │ - Seed Data   │
     │ - DB       │                    │ - In Memory   │
     │ - Auth     │                    │ - Instant     │
     └────┬──────┘                    └────────┬──────┘
          │                                     │
          └──────────────────┬──────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │   Parsed Response    │
                  │   to Components      │
                  └──────────────────────┘
```

---

## 🔌 Connection Points

### Frontend Services Calling Backend

All frontend services use this pattern:

```typescript
// src/services/student.service.ts
export const studentService = {
  results: () => resolve(MOCK_DATA, "/students/me/results"),
  //                      └─ Fallback    └─ API endpoint
};
```

**Flow:**
1. Component calls `studentService.results()`
2. Service calls `resolve(MOCK_DATA, "/students/me/results")`
3. HTTP client checks:
   - Is backend API enabled? (`NEXT_PUBLIC_USE_MOCK_DATA=false`)
   - Is network available?
   - Is endpoint available?
4. If YES → Fetch from `http://localhost:8000/api/students/me/results`
5. If NO → Return `MOCK_DATA`

### API Endpoints Implemented

#### Auth Endpoints
```
POST   /api/auth/login          Login with email/mobile + password
POST   /api/auth/register       Register new student
POST   /api/auth/logout         Clear session
POST   /api/auth/verify         Verify JWT token
```

#### Student Endpoints
```
GET    /api/students/me         Current student profile
GET    /api/students/{id}       Get student by ID
GET    /api/students/{id}/enrollments
GET    /api/students/{id}/payments
GET    /api/students/{id}/exams
GET    /api/students/{id}/results
GET    /api/students/{id}/analytics
GET    /api/results/{id}        Specific result
GET    /api/exams/{id}/answer-key
```

#### Admin Endpoints
```
GET    /api/admin/dashboard     Dashboard stats
GET    /api/admin/students      All students
GET    /api/admin/payments      Payment records
GET    /api/admin/exams         All exams
GET    /api/admin/exam-centres  Exam centres
GET    /api/admin/admit-cards   Admit cards
GET    /api/admin/results       Results management
GET    /api/admin/reports       Reports
```

---

## 🚀 Setup Guide

### Step 1: Backend Setup (If You Haven't Already)

```bash
cd backend
composer install
cp .env.example .env

# Edit .env with your database config
nano .env

# Start server
php -S localhost:8000 -t public/
```

**Expected output:**
```
Development Server (http://localhost:8000)
Listening on http://0.0.0.0:8000
Press Ctrl+C to quit.
```

### Step 2: Verify Backend Health

```bash
# In another terminal
curl http://localhost:8000/api/health

# Should return:
# {"status":"ok"}
```

### Step 3: Frontend Setup

```bash
# In project root
npm install

# Setup environment
cp .env.example .env.local

# Edit to match backend
cat > .env.local << EOF
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NODE_ENV=development
EOF

# Start frontend
npm run dev
```

**Expected output:**
```
  ▲ Next.js 16.3
  - Local:        http://localhost:3000
  - Environment:  development
```

### Step 4: Verify Integration

Open http://localhost:3000 in browser and:

1. **Check health**: Network tab shows request to `/api/health`
2. **Try login**: 
   - Should call `/api/auth/login`
   - Check Network tab in DevTools
3. **View data**:
   - Should show real data from backend
   - Check browser console for any errors

---

## 🧪 Testing Scenarios

### Scenario 1: Full Integration (Backend + Frontend)

**Setup:**
```env
# Frontend (.env.local)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_USE_MOCK_DATA=false
```

**Test:**
```bash
# Terminal 1: Start backend
cd backend
php -S localhost:8000 -t public/

# Terminal 2: Start frontend
npm run dev

# Terminal 3: Test API
curl http://localhost:8000/api/health
curl http://localhost:8000/api/students/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "mobile": "9999999999",
    "className": "Class 12",
    "school": "Test School",
    "city": "Mumbai",
    "state": "Maharashtra"
  }'
```

**Expected behavior:**
- Frontend shows "Connecting..." then real data
- Network tab shows requests to backend
- Data is live from database
- Page operations perform real updates

### Scenario 2: Frontend Only with Mock Data

**Setup:**
```env
# Frontend (.env.local)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_USE_MOCK_DATA=true
```

**Test:**
```bash
# Stop backend
# Start frontend only
npm run dev

# App still works with mock data
```

**Expected behavior:**
- No network errors
- Data is consistent
- Operations work smoothly
- Perfect for UI development
- Faster dev server (no network latency)

### Scenario 3: Backend Offline Fallback

**Setup:**
```env
# Frontend (.env.local)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_USE_MOCK_DATA=false  # Try real API
```

**Test:**
```bash
# Start frontend with this env
npm run dev

# Backend is NOT running
# Frontend gracefully falls back to mock data
```

**Expected behavior:**
- Console shows "API call failed, using mock data"
- App continues working with mock data
- No broken pages
- Seamless user experience

---

## 🔍 Debugging Guide

### Check What's Happening

**1. Is API being called or mock data used?**

In browser DevTools:
```javascript
// Console
localStorage.getItem('nirvona_token')  // Check stored token
// Network tab - watch for API calls
```

**2. Enable verbose logging**

Edit `src/services/http.ts`:
```typescript
export async function fetchApi<T>(...) {
  console.log('Fetching:', url);  // Add this
  const response = await fetch(url, ...);
  console.log('Response:', response);  // Add this
}
```

**3. Check backend is running**

```bash
# Terminal
curl -v http://localhost:8000/api/health

# Should see:
# Connected to localhost (127.0.0.1) port 8000
# < HTTP/1.1 200 OK
# {"status":"ok"}
```

**4. Check environment variables**

```bash
# In frontend directory
grep NEXT_PUBLIC .env.local

# Should show:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
# NEXT_PUBLIC_USE_MOCK_DATA=false
```

### Common Issues

**Issue: "Failed to fetch" errors**

```
Cause:  Backend not running or wrong URL
Fix:    1. Check backend: curl http://localhost:8000/api/health
        2. Check URL in .env.local
        3. Check CORS headers in backend (nginx.conf)
```

**Issue: Getting mock data instead of real data**

```
Cause:  NEXT_PUBLIC_USE_MOCK_DATA=true
Fix:    Set to false in .env.local
        Restart dev server (npm run dev)
```

**Issue: CORS errors**

```
Cause:  Backend CORS not configured for frontend URL
Fix:    Update nginx.conf or CORSMiddleware.php
        Add NEXT_PUBLIC_FRONTEND_URL to .env backend
        Restart backend
```

**Issue: Session not persisting**

```
Cause:  Token not being stored/sent
Fix:    Check localStorage has token after login
        Check Authorization header being sent in requests
        Verify JWT_SECRET in backend .env matches
```

---

## 🔐 Security Considerations

### API Communication

1. **HTTPS in Production**
   ```env
   # Production .env
   NEXT_PUBLIC_API_BASE_URL=https://api.nirvona.com/api
   ```

2. **CORS Configuration**
   ```php
   // backend/app/Middleware/CORSMiddleware.php
   $whitelist = [
       'http://localhost:3000',           // Dev
       'https://nirvona.com',             // Production
   ];
   ```

3. **JWT Tokens**
   - Stored in localStorage (consider: httpOnly cookie for production)
   - Sent in `Authorization: Bearer <token>` header
   - Validated by backend on each request
   - Auto-cleared on logout

### Data Validation

1. **Frontend Validation**
   - Form validation before submission
   - Type checking with TypeScript
   - Input sanitization

2. **Backend Validation**
   - All inputs re-validated
   - SQL injection prevention
   - XSS protection

---

## 📊 Performance Optimization

### Frontend Optimization

```typescript
// Use automatic code splitting
const AdminDashboard = dynamic(() => import("@/components/admin/dashboard"));

// Cache API responses
const { data } = useAsync(() => studentService.results(), []);
// useAsync uses React query internally for caching
```

### Backend Optimization

```php
// Backend uses:
// - Redis caching for frequently accessed data
// - Database indexes for fast queries
// - Pagination for large result sets
// - Connection pooling for database
```

### Network Optimization

```env
# Frontend
NEXT_PUBLIC_ENABLE_MOCK_LATENCY=true  # Add realism in dev

# Use mock data for development (faster)
NEXT_PUBLIC_USE_MOCK_DATA=true
```

---

## 🚀 Deployment Guide

### Development Environment

```bash
# Terminal 1: Backend
cd backend
php -S localhost:8000 -t public/

# Terminal 2: Frontend
npm run dev
```

### Staging Environment (Docker)

```bash
# Backend
cd backend
docker-compose up -d

# Frontend (separate)
NEXT_PUBLIC_API_BASE_URL=http://backend:8000/api npm run build
npm run start
```

### Production Environment

**Backend:**
```bash
cd backend
# Use production server (Apache, Nginx + PHP-FPM)
# See backend/SETUP.md for full deployment guide
```

**Frontend:**
```bash
# Build
npm run build

# Deploy to Vercel, AWS, etc.
# Or run on Node.js server
npm run start
```

**Environment Variables:**
```env
# Production Frontend (.env.production)
NEXT_PUBLIC_API_BASE_URL=https://api.nirvona.com/api
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_FRONTEND_URL=https://nirvona.com
NODE_ENV=production
```

---

## 🧬 Development Workflow

### Adding a New Feature (Backend-Driven)

1. **Backend Development**
   ```bash
   # Create new service method
   # Create new API endpoint
   # Test with curl
   ```

2. **Frontend Development**
   ```typescript
   // Add to service
   export const studentService = {
     newFeature: () => resolve(MOCK_DATA, "/api/new-endpoint"),
   };

   // Use in component
   const { data } = useAsync(() => studentService.newFeature());
   ```

3. **Testing**
   - Run both backend and frontend
   - Verify API calls in Network tab
   - Check data is live

### Adding a New UI Component

1. **Create component** (no backend needed)
   ```tsx
   export function NewComponent({ data }) {
     return <div>{data.name}</div>;
   }
   ```

2. **Integrate service** (same-day)
   ```tsx
   export function NewPage() {
     const { data } = useAsync(() => studentService.data());
     return <NewComponent data={data} />;
   }
   ```

3. **Test with mock or real data**
   - Toggle `NEXT_PUBLIC_USE_MOCK_DATA`
   - Component works either way

---

## 📋 Checklist for Integration

- [ ] Backend runs on `http://localhost:8000/api`
- [ ] Frontend runs on `http://localhost:3000`
- [ ] `.env.local` has correct `NEXT_PUBLIC_API_BASE_URL`
- [ ] `NEXT_PUBLIC_USE_MOCK_DATA=false` (to use real backend)
- [ ] Database migrations completed in backend
- [ ] Backend health check returns `{"status":"ok"}`
- [ ] Frontend can login successfully
- [ ] Data displayed is from backend (not mock)
- [ ] Network tab shows requests to backend
- [ ] Fallback to mock data when backend offline
- [ ] CORS headers configured correctly
- [ ] JWT tokens being stored and sent
- [ ] All services have corresponding backend endpoints

---

## 🎯 Key Points

✅ **Automatic Routing** - Frontend automatically calls backend API  
✅ **Graceful Fallback** - Works with or without backend  
✅ **Type Safe** - TypeScript ensures type safety  
✅ **No Code Changes** - Add backend endpoint, frontend uses it automatically  
✅ **Dynamic Data** - All data fetched at runtime  
✅ **Development Friendly** - Mock mode for fast development  
✅ **Production Ready** - Both parts deploy independently  

---

## 📞 Troubleshooting Commands

```bash
# Check backend health
curl http://localhost:8000/api/health

# Check frontend is running
curl http://localhost:3000

# Check CORS headers
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS http://localhost:8000/api/students/register -v

# Test login endpoint
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Monitor network requests (in browser)
# 1. Open DevTools (F12)
# 2. Go to Network tab
# 3. Perform action in app
# 4. See all API requests and responses
```

---

## 🎉 Summary

The Nirvona frontend-backend integration is:

✅ **Seamless** - Frontend automatically routes to backend  
✅ **Robust** - Fallback to mock data if backend unavailable  
✅ **Dynamic** - All data fetched at runtime from backend  
✅ **Type-Safe** - TypeScript ensures correctness  
✅ **Developer-Friendly** - Clear patterns and documentation  
✅ **Production-Ready** - Both parts independently deployable  

With this guide, you can:
- Develop frontend and backend independently
- Test both together seamlessly
- Debug issues efficiently
- Deploy to production with confidence

Happy building! 🚀
