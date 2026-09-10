# Nirvona Frontend - Next.js Application

A modern, responsive Computer-Based Testing (CBT) platform frontend built with Next.js 16, React 19, and TypeScript. Seamlessly integrated with the PHP MVC backend with automatic fallback to mock data for development.

## 🎯 Features

✅ **Fully Dynamic** - All data fetched from backend API at runtime  
✅ **Graceful Degradation** - Falls back to mock data if API unavailable  
✅ **Multi-Portal** - Separate portals for Students, Admins, and Public users  
✅ **Real-time Updates** - Live exam status, results, and notifications  
✅ **Responsive Design** - Works seamlessly on all devices  
✅ **Type-Safe** - Full TypeScript coverage for reliability  
✅ **Accessible** - WCAG compliance with Radix UI primitives  
✅ **Performance Optimized** - Code splitting, lazy loading, caching  
✅ **Modern Stack** - Next.js 16, React 19, Tailwind CSS 4  

---

## 📊 Application Structure

```
src/
├── app/                          # Next.js App Router (Pages)
│   ├── (auth)/                   # Auth pages (login, register)
│   ├── (site)/                   # Public site (home, courses, packages, FAQs)
│   ├── (flow)/                   # Checkout flow (payment, success, failed)
│   ├── student/                  # Student portal (dashboard, exams, results)
│   ├── admin/                    # Admin portal (dashboard, management)
│   └── layout.tsx                # Root layout
│
├── components/
│   ├── ui/                       # Base UI components (button, card, dialog, etc.)
│   ├── shared/                   # Shared components (data-table, status-badge, file-upload)
│   ├── public/                   # Public site components (hero, navbar, footer)
│   ├── student/                  # Student portal components
│   ├── admin/                    # Admin portal components
│   ├── charts/                   # Chart components (recharts)
│   └── brand/                    # Brand components (logo)
│
├── services/                     # API & Data Services
│   ├── http.ts                   # HTTP client with backend/mock routing
│   ├── auth.service.ts           # Authentication service
│   ├── student.service.ts        # Student data service
│   ├── admin.service.ts          # Admin data service
│   ├── catalogue.service.ts      # Courses & packages service
│   └── checkout.service.ts       # Payment & checkout service
│
├── data/                         # Mock Data (Fallback)
│   ├── students.ts               # Student mock data
│   ├── exams.ts                  # Exams mock data
│   ├── results.ts                # Results mock data
│   ├── payments.ts               # Payments mock data
│   ├── courses.ts                # Courses mock data
│   ├── packages.ts               # Packages mock data
│   └── operations.ts             # Operations mock data
│
├── hooks/                        # Custom React Hooks
│   ├── use-session.ts            # Session management
│   ├── use-async.ts              # Async state management
│   ├── use-orders.ts             # Order management
│   └── use-local-storage.ts      # LocalStorage persistence
│
├── lib/                          # Utilities
│   ├── utils.ts                  # General utilities
│   ├── format.ts                 # Formatting utilities
│   ├── nav.ts                    # Navigation helpers
│   └── export.ts                 # Export utilities
│
└── types/
    └── index.ts                  # TypeScript type definitions
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** 18.17+ or 20+
- **npm:** 9+ or yarn/pnpm
- **Backend:** Running on http://localhost:8000/api (optional - mock data as fallback)

### Installation

1. **Clone repository**
   ```bash
   git clone https://github.com/Parthbadgujar1/Nirvona.git
   cd Nirvona
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

   Key variables:
   ```env
   # Backend API (required for dynamic data)
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
   NEXT_PUBLIC_USE_MOCK_DATA=false

   # Frontend URL
   NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Open http://localhost:3000 in your browser

---

## 🔌 Backend Integration

### How It Works

The frontend is fully integrated with the backend through a flexible HTTP client:

1. **Automatic Routing** - All service methods call the backend API
2. **Graceful Fallback** - If API unavailable, uses mock data for continuity
3. **Dynamic Data** - All displayed data is fetched at runtime
4. **Type-Safe** - TypeScript ensures request/response type safety

### Configuration

**API Base URL:**
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

**Toggle Mock Mode** (for development without backend):
```env
NEXT_PUBLIC_USE_MOCK_DATA=true
```

### Service Layer Architecture

```
Component
   ↓
Hook (useAsync, useSession, etc.)
   ↓
Service (studentService, adminService, etc.)
   ↓
HTTP Client (resolve(), get(), post(), put())
   ↓
   ├─ API_BASE_URL (if available and not mock mode)
   │  └─ Fetch from Backend API
   │
   └─ Mock Data (if API unavailable or mock mode enabled)
      └─ Return Fallback Data
```

### API Endpoints Used

#### Authentication
- `POST /auth/login` - User login (email/mobile + password)
- `POST /auth/register` - Student registration
- `POST /auth/logout` - User logout
- `POST /auth/verify` - Verify JWT token

#### Student Portal
- `GET /students/me` - Current student profile
- `GET /students/{id}` - Get student by ID
- `GET /students/me/enrollments` - Student enrollments
- `GET /students/me/payments` - Payment history
- `GET /students/me/exams` - Enrolled exams
- `GET /students/me/results` - Exam results
- `GET /students/me/analytics` - Performance analytics
- `GET /exams/{id}/answer-key` - Answer keys
- `GET /results/{id}` - Detailed result

#### Admin Portal
- `GET /admin/dashboard` - Admin dashboard
- `GET /admin/students` - All students
- `GET /admin/payments` - Payment records
- `GET /admin/exams` - All exams
- `GET /admin/exam-centres` - Exam centres
- `GET /admin/admit-cards` - Admit card management
- `GET /admin/credentials` - Credential management
- `GET /admin/results` - Results management
- `GET /admin/reports` - Report generation

#### Public/Catalog
- `GET /courses` - Available courses
- `GET /packages` - Available packages
- `GET /exams` - Upcoming exams

---

## 🎨 Component System

### UI Components (Base)

Located in `src/components/ui/` - Radix UI primitives with Tailwind styling:

```tsx
Button | Input | Card | Dialog | Dropdown | Tabs | Accordion
Badge | Avatar | Progress | Checkbox | Select | Alert | Tooltip
```

### Shared Components

Located in `src/components/shared/` - Reusable across portals:

```tsx
DataTable         # Dynamic table with sorting, filtering, pagination
StatusBadge       # Status indicator with colors
StatCard          # Stat display card
PageHeader        # Page title and breadcrumbs
Filters           # Filter UI for data tables
ConfirmDialog     # Confirmation modal
FileUpload        # File upload component
AdmitCard         # Admit card display
Receipt           # Payment receipt
```

### Portal Components

#### Public Components (`src/components/public/`)
- **Navbar** - Navigation with auth links
- **Hero** - Landing page hero section
- **Footer** - Site footer
- **CourseCard** - Course display
- **PackageCard** - Package pricing card
- **LoginForm** - Login form with email/mobile
- **RegisterWizard** - Multi-step registration
- **ContactForm** - Contact form
- **UpcomingExams** - Exam listings

#### Student Components (`src/components/student/`)
- **Dashboard** - Student overview
- **ExamCard** - Individual exam card
- **ResultDetail** - Detailed result view
- **PerformanceDashboard** - Performance charts
- **AdmitCardPage** - Admit card display
- **PaymentsView** - Payment history

#### Admin Components (`src/components/admin/`)
- **Dashboard** - Admin overview
- **ExamsManager** - Exam CRUD
- **StudentsManager** - Student management
- **ResultsManager** - Result publishing
- **AdmitCardsManager** - Admit card generation
- **AnalyticsDashboard** - Detailed analytics
- **ReportsCenter** - Report generation

---

## 🔐 Authentication

### Session Management

Session is managed through `use-session.ts` hook:

```tsx
import { useSession } from "@/hooks/use-session";

export function Component() {
  const { session, login, logout, isLoading } = useSession();

  if (isLoading) return <Spinner />;

  return (
    <>
      {session ? (
        <>
          <p>Logged in as {session.name}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <a href="/login">Login</a>
      )}
    </>
  );
}
```

### Token Storage

- JWT token stored in localStorage (configurable via `NEXT_PUBLIC_TOKEN_STORAGE_KEY`)
- Sent in `Authorization` header for subsequent API calls
- Auto-verified on app load to restore session
- Cleared on logout

### Role-Based Access

Routes are protected by role:
- `/student/*` - Requires `role === "student"`
- `/admin/*` - Requires `role === "admin"`
- `/auth/*` - Public (requires no session)
- `/(site)/*` - Public (accessible to all)

---

## 📡 Data Flow (All Dynamic)

### Example: Fetching Student Results

1. **Component mounts**
   ```tsx
   export function ResultsList() {
     const { data, isLoading, error } = useAsync(
       () => studentService.results(),
       [],
     );
   }
   ```

2. **Service is called**
   ```tsx
   // src/services/student.service.ts
   results: () => resolve(STUDENT_RESULTS, "/students/me/results")
   ```

3. **HTTP client determines routing**
   ```tsx
   // src/services/http.ts
   if (endpoint && !USE_MOCK_DATA) {
     return fetchApi("/students/me/results");  // Call backend
   } else {
     return STUDENT_RESULTS;  // Use mock data
   }
   ```

4. **Backend API returns real data**
   ```
   GET http://localhost:8000/api/students/me/results
   ↓
   Returns: { success: true, data: [...results...] }
   ↓
   Frontend extracts and displays data
   ```

---

## 🛠️ Development Workflow

### Adding a New Page

1. **Create page file**
   ```bash
   touch src/app/student/new-feature/page.tsx
   ```

2. **Import and call service**
   ```tsx
   import { studentService } from "@/services/student.service";

   export default async function NewFeaturePage() {
     const data = await studentService.exams();
     return <div>{/* Use data */}</div>;
   }
   ```

3. **Service automatically calls backend**
   - No component changes needed if API endpoint exists
   - Fallback to mock data if API unavailable

### Adding a New Component

1. **Create component file**
   ```bash
   touch src/components/student/new-component.tsx
   ```

2. **Follow patterns**
   - Use TypeScript for props
   - Accept data as prop (fetched by parent)
   - Keep components pure and composable

### Creating a New Service

1. **Create service file**
   ```bash
   touch src/services/new.service.ts
   ```

2. **Implement with resolve pattern**
   ```tsx
   export const newService = {
     getData: () => resolve(MOCK_DATA, "/api/endpoint"),
     updateData: (id: string, data: unknown) =>
       resolve(MOCK_RESPONSE, "/api/endpoint", {
         method: "PUT",
         body: JSON.stringify(data),
       }),
   };
   ```

---

## 🧪 Testing the Integration

### Test Backend Connection

```bash
# Check API is running
curl http://localhost:8000/api/health

# Should respond:
# {"status":"ok"}
```

### Test Frontend with Backend

1. **Set environment**
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
   NEXT_PUBLIC_USE_MOCK_DATA=false
   ```

2. **Start backend**
   ```bash
   cd backend
   php -S localhost:8000 -t public/
   ```

3. **Start frontend**
   ```bash
   npm run dev
   ```

4. **Test operations**
   - Login: Should call `/auth/login` backend endpoint
   - View results: Should call `/students/me/results` backend endpoint
   - All operations should show real data, not mock

### Test Fallback (Mock Mode)

1. **Set mock mode**
   ```env
   NEXT_PUBLIC_USE_MOCK_DATA=true
   ```

2. **Backend can be down**
   ```bash
   # Stop backend (Ctrl+C if running)
   ```

3. **App still works** with mock data
   - No errors
   - Smooth user experience
   - Data is consistent

---

## 📦 Build & Deployment

### Production Build

```bash
npm run build
npm run start
```

Server runs on http://localhost:3000

### Environment for Production

```env
# Production
NODE_ENV=production

# Backend API (update to production URL)
NEXT_PUBLIC_API_BASE_URL=https://api.nirvona.com/api

# Disable mock data
NEXT_PUBLIC_USE_MOCK_DATA=false

# Frontend URL
NEXT_PUBLIC_FRONTEND_URL=https://nirvona.com
```

### Deployment Platforms

Recommended for Next.js 16:

- **Vercel** (easiest, optimized for Next.js)
- **AWS Amplify**
- **Firebase Hosting**
- **Netlify**
- **Self-hosted** (Node.js server)

---

## 🎯 Key Design Decisions

### 1. Dynamic Data First

- **All data fetched at runtime** from backend API
- No hardcoded data in components
- Mock data only as development fallback
- Easy to switch between real and mock

### 2. Graceful Degradation

- Frontend works with or without backend
- Automatic fallback to mock data
- User experience unaffected
- Ideal for development and demos

### 3. Service Layer Pattern

- Clear separation between components and data access
- Easy to mock services for testing
- Single source of truth for API endpoints
- Type-safe requests and responses

### 4. Type Safety

- Full TypeScript coverage
- Type definitions for all data models
- Compiled at build time
- Catches errors before production

### 5. Component Composition

- Small, focused components
- Props-based data flow
- Easy to test and reuse
- Clean separation of concerns

---

## 🔧 Environment Variables

### Required
- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL
- `NEXT_PUBLIC_FRONTEND_URL` - Frontend URL (for CORS)

### Optional
- `NEXT_PUBLIC_USE_MOCK_DATA` - Force mock data (default: false)
- `NEXT_PUBLIC_ENABLE_MOCK_LATENCY` - Simulate network latency
- `NEXT_PUBLIC_SESSION_TIMEOUT_MS` - Session timeout duration
- `NODE_ENV` - development, production, test

---

## 📚 Architecture Diagram

```
┌─────────────────────────────────────────────┐
│           Browser / User Device              │
└────────────────────┬────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │                         │
    ┌───▼────┐              ┌────▼─────┐
    │ Network │              │ Local    │
    │ Request │              │ Storage  │
    │ (API)   │              │ (Token)  │
    └───┬────┘              └────┬─────┘
        │                        │
        └────────────┬───────────┘
                     │
            ┌────────▼────────┐
            │   HTTP Client   │
            │  (http.ts)      │
            │                 │
            │ ┌─────────────┐ │
            │ │ Real API?   │ │
            │ │ Backend URL │ │
            │ │ Available?  │ │
            │ └──────┬──────┘ │
            │        │        │
            │    ┌───▼──┐ ┌──▼────┐
            │    │  YES │ │  NO   │
            │    └───┬──┘ └──┬────┘
            │        │       │
            │     Fetch   Return
            │     Backend  Mock
            │     API      Data
            │        │       │
            └────────┴───────┘
                     │
            ┌────────▼────────┐
            │  Service Layer  │
            │  (*.service.ts) │
            └────────┬────────┘
                     │
            ┌────────▼────────┐
            │   Hooks         │
            │ (useAsync,etc)  │
            └────────┬────────┘
                     │
            ┌────────▼────────┐
            │  Components     │
            │ (Render UI)     │
            └─────────────────┘
```

---

## 🚀 Performance Optimizations

### Code Splitting
- Automatic per-route code splitting
- Components lazy-loaded as needed
- Reduced initial bundle size

### Caching
- Browser cache for static assets
- Service worker support (optional)
- API response caching in-memory

### Image Optimization
- Next.js Image component
- Automatic format conversion
- Responsive image delivery

### Build Optimizations
- Tree-shaking to remove unused code
- CSS minification
- JavaScript minification
- Static optimization

---

## 🎓 Learning Path

1. **Start with Pages** - Understand `src/app/` structure
2. **Then Components** - Explore `src/components/`
3. **Then Services** - Study `src/services/` pattern
4. **Then Hooks** - Learn custom hooks for state
5. **Then Integration** - See how everything connects

---

## 🐛 Troubleshooting

### Backend Connection Issues

**Problem:** Getting "Network error" on operations
```bash
# Check backend is running
curl http://localhost:8000/api/health

# Check environment
cat .env.local | grep API_BASE_URL

# Enable mock data temporarily
# Set NEXT_PUBLIC_USE_MOCK_DATA=true
```

### Session/Auth Issues

**Problem:** Can't login or session persists after logout
```bash
# Check token storage
# Open DevTools → Application → LocalStorage
# Look for key: nirvona_token

# Clear and try again
# Or set: NEXT_PUBLIC_TOKEN_STORAGE_KEY=my_custom_key
```

### Type Errors

**Problem:** TypeScript compilation errors
```bash
# Run type check
npx tsc --noEmit

# Check types/index.ts matches backend
# Update types if backend schema changed
```

---

## 📞 Support

- **Documentation:** See `SETUP.md` for detailed setup
- **Backend Docs:** See `backend/README.md`
- **Architecture:** See `BACKEND_ARCHITECTURE.md`
- **Issues:** Check GitHub issues
- **Environment:** See `.env.example` for all options

---

## 📋 Quick Reference

| Task | Command |
|------|---------|
| Start dev server | `npm run dev` |
| Build for production | `npm run build` |
| Run production build | `npm run start` |
| Type check | `npx tsc --noEmit` |
| Install dependencies | `npm install` |
| Format code | `npm run format` (if configured) |
| Lint code | `npm run lint` (if configured) |

---

## 🎉 Summary

The Nirvona frontend is a **modern, dynamic, production-ready** Next.js application with:

✅ **165 TypeScript/TSX files** implementing full student/admin portals  
✅ **Seamless backend integration** with automatic API routing  
✅ **Graceful degradation** with mock data fallback  
✅ **Type-safe** throughout for reliability  
✅ **Responsive design** for all devices  
✅ **Accessible UI** using Radix UI primitives  
✅ **Performance optimized** with code splitting and caching  
✅ **Developer friendly** with clear patterns and documentation  

**All data is fetched dynamically at runtime** - no static content. Components are kept lightweight and composable. The service layer handles all backend communication with automatic fallback to mock data if needed.

Ready for development and deployment! 🚀
