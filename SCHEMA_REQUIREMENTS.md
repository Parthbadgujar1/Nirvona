# Nirvona Database Schemas - Complete Requirements

## Overview

This document specifies all database schemas required for the Nirvona CBT Platform. **4 out of 20** tables are currently implemented.

---

## 📊 Current Status

| Status | Count | Tables |
|--------|-------|--------|
| ✅ Created | 4 | students, exams, payments, results |
| ⏳ Needed | 16 | See sections below |

---

## ✅ TIER 0: Already Created (4 Tables)

### 1. **students** ✓
Stores student profiles and enrollment data.

```sql
id (UUID PK)
fullName (VARCHAR 255)
email (VARCHAR 255, UNIQUE)
mobile (VARCHAR 20)
dateOfBirth (DATE)
gender (VARCHAR 20)
className (VARCHAR 100)
school (VARCHAR 255)
city (VARCHAR 100)
state (VARCHAR 100)
address (TEXT)
status (VARCHAR 50, DEFAULT: 'active')
enrolledAt (TIMESTAMP)
avatarUrl (VARCHAR 500)
guardianName (VARCHAR 255)
guardianMobile (VARCHAR 20)
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)

Indexes: email, status, className, city
```

### 2. **exams** ✓
Stores exam schedules and metadata.

```sql
id (UUID PK)
name (VARCHAR 255)
courseSlug (VARCHAR 100)
date (TIMESTAMP)
reportingTime (VARCHAR 20)
examTime (VARCHAR 20)
durationMinutes (INT)
totalQuestions (INT)
totalMarks (INT)
centreId (UUID FK → exam_centres)
status (VARCHAR 50, DEFAULT: 'draft')
instructions (TEXT)
candidates (INT)
admitCardsGenerated (INT)
credentialsAssigned (INT)
syllabusScope (TEXT)
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)

Indexes: status, date, courseSlug
```

### 3. **payments** ✓
Stores payment transactions.

```sql
id (UUID PK)
studentId (UUID FK → students)
packageId (UUID FK → packages)
courseSlug (VARCHAR 100)
amount (DECIMAL 10,2)
discount (DECIMAL 10,2)
tax (DECIMAL 10,2)
total (DECIMAL 10,2)
status (VARCHAR 50, DEFAULT: 'pending')
method (VARCHAR 50) -- razorpay, upi, card, etc
transactionId (VARCHAR 255)
date (TIMESTAMP)
retryCount (INT)
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)

Indexes: studentId, status, date
```

### 4. **results** ✓
Stores exam results and performance metrics.

```sql
id (UUID PK)
studentId (UUID FK → students)
examId (UUID FK → exams)
examName (VARCHAR 255)
courseSlug (VARCHAR 100)
score (DECIMAL 10,2)
maxScore (DECIMAL 10,2)
percentage (DECIMAL 5,2)
rank (INT)
totalCandidates (INT)
percentile (DECIMAL 5,2)
accuracy (DECIMAL 5,2)
correct (INT)
incorrect (INT)
unattempted (INT)
timeTakenMin (INT)
status (VARCHAR 50, DEFAULT: 'processing')
topPerformerScore (DECIMAL 10,2)
averageScore (DECIMAL 10,2)
date (TIMESTAMP)
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)

Indexes: studentId, examId, status, rank
```

---

## ⚡ TIER 1: Core Business Tables (HIGH PRIORITY)

### 5. **enrollments** ⏳ NEEDED
Student enrollment in courses/exams.

**Purpose:** Track which students are enrolled in which courses and exams.

```sql
id (UUID PK)
studentId (UUID FK → students)
courseSlug (VARCHAR 100 FK → courses)
examId (UUID FK → exams, NULL for course enrollments)
enrolledAt (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
status (VARCHAR 50, DEFAULT: 'active') -- active, dropped, completed
paymentStatus (VARCHAR 50) -- paid, pending, refunded
expiresAt (TIMESTAMP, NULL for lifetime access)
completionPercentage (INT DEFAULT 0)
lastAccessedAt (TIMESTAMP)
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)

Indexes: studentId, courseSlug, examId, status
Foreign Keys: 
  - studentId → students(id)
  - courseSlug → courses(slug)
  - examId → exams(id)
```

### 6. **exam_candidates** ⏳ NEEDED
Student attendance and seat allocation for exams.

**Purpose:** Track which students appeared in which exams, their seats, roll numbers, etc.

```sql
id (UUID PK)
examId (UUID FK → exams)
studentId (UUID FK → students)
rollNumber (VARCHAR 50)
seatNumber (VARCHAR 50)
admitCardNumber (VARCHAR 100, UNIQUE)
centerCode (VARCHAR 50)
attendanceStatus (VARCHAR 50) -- present, absent, invalid
reportingTime (TIMESTAMP)
examStartTime (TIMESTAMP)
examEndTime (TIMESTAMP)
ipAddress (VARCHAR 45) -- IPv4 or IPv6
deviceInfo (JSONB) -- browser, OS, device details
proctorNotes (TEXT)
status (VARCHAR 50, DEFAULT: 'registered') -- registered, attended, absent, disqualified
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)

Indexes: examId, studentId, admitCardNumber, seatNumber, attendanceStatus
Foreign Keys:
  - examId → exams(id)
  - studentId → students(id)
Unique Constraint: (examId, studentId)
```

### 7. **admit_cards** ⏳ NEEDED
Digital admit card records and download history.

**Purpose:** Track admit card generation, downloads, and distribution.

```sql
id (UUID PK)
examId (UUID FK → exams)
studentId (UUID FK → students)
admitCardNumber (VARCHAR 100, UNIQUE)
rollNumber (VARCHAR 50)
generatedAt (TIMESTAMP)
generatedBy (VARCHAR 100) -- admin email or system
documentUrl (VARCHAR 500) -- S3/CDN URL to PDF
downloadedAt (TIMESTAMP, NULL until first download)
downloadCount (INT DEFAULT 0)
sentViaEmail (BOOLEAN DEFAULT false)
sentViaSMS (BOOLEAN DEFAULT false)
verificationCode (VARCHAR 20) -- for ID verification
status (VARCHAR 50, DEFAULT: 'generated') -- generated, sent, verified, used
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)

Indexes: examId, studentId, admitCardNumber, generatedAt
Foreign Keys:
  - examId → exams(id)
  - studentId → students(id)
```

### 8. **exam_credentials** ⏳ NEEDED
Login credentials for exam access.

**Purpose:** Store encrypted username/password for exam portal access.

```sql
id (UUID PK)
examId (UUID FK → exams)
studentId (UUID FK → students)
username (VARCHAR 100, UNIQUE)
passwordHash (VARCHAR 255) -- bcrypt/argon2
lastUsedAt (TIMESTAMP)
loginAttempts (INT DEFAULT 0)
lockedUntil (TIMESTAMP)
isExpired (BOOLEAN DEFAULT false)
expiresAt (TIMESTAMP)
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)

Indexes: examId, studentId, username
Foreign Keys:
  - examId → exams(id)
  - studentId → students(id)
Unique Constraint: (examId, studentId)
```

### 9. **student_responses** ⏳ NEEDED
Individual student answers to exam questions.

**Purpose:** Store every answer submitted by students during exam.

```sql
id (UUID PK)
examId (UUID FK → exams)
studentId (UUID FK → students)
questionId (UUID FK → questions)
selectedOption (VARCHAR 1) -- A, B, C, D
selectedAnswerJson (JSONB) -- for complex answers
markedForReview (BOOLEAN DEFAULT false)
visitCount (INT DEFAULT 1) -- times student visited question
timeSpentSec (INT) -- seconds spent on this question
isCorrect (BOOLEAN, NULL until evaluation)
marksAwarded (DECIMAL 5,2)
marksNegative (DECIMAL 5,2))
responseAt (TIMESTAMP)
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)

Indexes: examId, studentId, questionId, isCorrect
Foreign Keys:
  - examId → exams(id)
  - studentId → students(id)
  - questionId → questions(id)
Unique Constraint: (examId, studentId, questionId)
```

### 10. **questions** ⏳ NEEDED
Question bank with all exam questions.

**Purpose:** Store question content, options, and metadata.

```sql
id (UUID PK)
examId (UUID FK → exams)
subjectId (UUID FK → subjects)
topicId (UUID FK → topics)
questionNumber (INT)
questionText (TEXT)
questionType (VARCHAR 50) -- mcq, numeric, matrix, fill-blank
difficulty (VARCHAR 20) -- easy, medium, hard
marksFor (DECIMAL 5,2)) -- marks if correct
marksAgainst (DECIMAL 5,2)) -- negative marking
optionA (TEXT)
optionB (TEXT)
optionC (TEXT)
optionD (TEXT)
optionE (TEXT, NULL)
correctOption (VARCHAR 1) -- A, B, C, D, E
explanation (TEXT) -- shown after exam
imageUrl (VARCHAR 500)
audioUrl (VARCHAR 500)
solutionVideoUrl (VARCHAR 500)
language (VARCHAR 20, DEFAULT: 'en') -- en, hi, etc
status (VARCHAR 50, DEFAULT: 'active') -- active, inactive, deleted
createdBy (VARCHAR 100)
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)

Indexes: examId, subjectId, topicId, questionNumber, difficulty
Foreign Keys:
  - examId → exams(id)
  - subjectId → subjects(id)
  - topicId → topics(id)
```

---

## 📚 TIER 2: Catalog & Course Management (HIGH PRIORITY)

### 11. **courses** ⏳ NEEDED
Course definitions and metadata.

**Purpose:** Store master course information.

```sql
id (UUID PK)
slug (VARCHAR 100, UNIQUE)
name (VARCHAR 255)
description (TEXT)
category (VARCHAR 100)
board (VARCHAR 100) -- CBSE, ICSE, STATE, etc
class (VARCHAR 50) -- Class 10, 12, etc
language (VARCHAR 20, DEFAULT: 'en')
imageUrl (VARCHAR 500)
icon (VARCHAR 50) -- emoji or icon code
isActive (BOOLEAN DEFAULT true)
orderIndex (INT DEFAULT 0)
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)

Indexes: slug, name, category, board, class
Unique Constraint: (slug)
```

### 12. **packages** ⏳ NEEDED
Subscription/pricing packages.

**Purpose:** Store package plans available for purchase.

```sql
id (UUID PK)
courseSlug (VARCHAR 100 FK → courses)
name (VARCHAR 255)
description (TEXT)
price (DECIMAL 10,2)
discountedPrice (DECIMAL 10,2), NULL)
currency (VARCHAR 10, DEFAULT: 'INR')
validity (INT) -- days of access
examCount (INT) -- number of exams included
validityStartsFrom (VARCHAR 50) -- purchase-date, course-start, etc
features (JSONB) -- array of feature strings
isActive (BOOLEAN DEFAULT true)
orderIndex (INT DEFAULT 0)
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)

Indexes: courseSlug, isActive
Foreign Keys:
  - courseSlug → courses(slug)
```

### 13. **subjects** ⏳ NEEDED
Subjects within courses.

**Purpose:** Organize course content by subjects.

```sql
id (UUID PK)
courseSlug (VARCHAR 100 FK → courses)
name (VARCHAR 255)
slug (VARCHAR 100)
description (TEXT)
icon (VARCHAR 50)
orderIndex (INT DEFAULT 0)
isActive (BOOLEAN DEFAULT true)
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)

Indexes: courseSlug, slug
Foreign Keys:
  - courseSlug → courses(slug)
Unique Constraint: (courseSlug, slug)
```

### 14. **topics** ⏳ NEEDED
Topics within subjects.

**Purpose:** Fine-grained categorization for analytics and tracking.

```sql
id (UUID PK)
subjectId (UUID FK → subjects)
name (VARCHAR 255)
slug (VARCHAR 100)
description (TEXT)
orderIndex (INT DEFAULT 0)
difficulty (VARCHAR 20) -- easy, medium, hard
estimatedHours (DECIMAL 5,2))
isActive (BOOLEAN DEFAULT true)
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)

Indexes: subjectId, slug
Foreign Keys:
  - subjectId → subjects(id)
Unique Constraint: (subjectId, slug)
```

### 15. **syllabus** ⏳ NEEDED
Detailed curriculum scope.

**Purpose:** Track learning objectives and topics covered in exams.

```sql
id (UUID PK)
examId (UUID FK → exams)
courseSlug (VARCHAR 100 FK → courses)
topicId (UUID FK → topics)
weight (DECIMAL 5,2)) -- percentage in exam (e.g., 15.5%)
estimatedHours (DECIMAL 5,2))
learningObjectives (JSONB) -- array of objectives
questionsCount (INT)
sampledItems (JSONB) -- sample questions from this topic
isOptional (BOOLEAN DEFAULT false)
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)

Indexes: examId, courseSlug, topicId
Foreign Keys:
  - examId → exams(id)
  - courseSlug → courses(slug)
  - topicId → topics(id)
```

---

## 🏢 TIER 3: Exam Infrastructure (MEDIUM PRIORITY)

### 16. **exam_centres** ⏳ NEEDED
Physical or virtual exam centers.

**Purpose:** Manage exam center locations and capacity.

```sql
id (UUID PK)
code (VARCHAR 50, UNIQUE)
name (VARCHAR 255)
type (VARCHAR 50) -- physical, online, hybrid
city (VARCHAR 100)
state (VARCHAR 100)
address (TEXT)
coordinatorName (VARCHAR 255)
coordinatorEmail (VARCHAR 255)
coordinatorMobile (VARCHAR 20)
totalSeats (INT)
seatsAvailable (INT)
latitude (DECIMAL 10,8), NULL)
longitude (DECIMAL 11,8), NULL)
amenities (JSONB) -- array of amenities
isActive (BOOLEAN DEFAULT true)
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)

Indexes: code, city, state, isActive
Unique Constraint: (code)
```

### 17. **answer_keys** ⏳ NEEDED
Correct answers and marking schemes.

**Purpose:** Store correct answers used for result evaluation.

```sql
id (UUID PK)
examId (UUID FK → exams)
version (INT DEFAULT 1) -- if answer key changes
questionId (UUID FK → questions)
correctOption (VARCHAR 1) -- A, B, C, D, E
acceptableAnswers (JSONB) -- array for fill-blanks
marksFor (DECIMAL 5,2))
marksAgainst (DECIMAL 5,2))
explanation (TEXT)
solutionUrl (VARCHAR 500)
updatedBy (VARCHAR 100)
releaseDate (TIMESTAMP, NULL until results declaration)
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)

Indexes: examId, questionId, releaseDate
Foreign Keys:
  - examId → exams(id)
  - questionId → questions(id)
Unique Constraint: (examId, questionId, version)
```

---

## 📈 TIER 4: Analytics & Performance (OPTIMIZATION)

### 18. **result_analysis** ⏳ NEEDED
Detailed performance breakdowns.

**Purpose:** Pre-computed analytics for faster query performance.

```sql
id (UUID PK)
resultId (UUID FK → results)
studentId (UUID FK → students)
examId (UUID FK → exams)
subjectId (UUID FK → subjects)
subjectName (VARCHAR 255)
subjectMarks (DECIMAL 10,2))
subjectMaxMarks (DECIMAL 10,2))
subjectPercentage (DECIMAL 5,2))
subjectRank (INT)
correctCount (INT)
incorrectCount (INT)
unattemptedCount (INT)
accuracy (DECIMAL 5,2))
speed (DECIMAL 10,2)) -- questions per minute
strongTopics (JSONB) -- array of topic performance
weakTopics (JSONB)
comparisonWithClassAverage (DECIMAL 5,2))
comparisonWithToppers (DECIMAL 5,2))
updatedAt (TIMESTAMP)
createdAt (TIMESTAMP)

Indexes: resultId, studentId, examId, subjectId
Foreign Keys:
  - resultId → results(id)
  - studentId → students(id)
  - examId → exams(id)
  - subjectId → subjects(id)
```

### 19. **topic_performance** ⏳ NEEDED
Performance metrics by topic.

**Purpose:** Track performance and trends by topic for personalized recommendations.

```sql
id (UUID PK)
studentId (UUID FK → students)
topicId (UUID FK → topics)
totalAttempts (INT)
correctCount (INT)
incorrectCount (INT)
accuracy (DECIMAL 5,2))
averageTimePerQuestion (DECIMAL 10,2))
lastAttemptAt (TIMESTAMP)
trendDirection (VARCHAR 20) -- improving, stable, declining
performanceLevel (VARCHAR 50) -- beginner, intermediate, advanced, mastered
recommendedExams (JSONB) -- array of recommended exams
needsImprovement (BOOLEAN DEFAULT false)
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)

Indexes: studentId, topicId, accuracy, performanceLevel
Foreign Keys:
  - studentId → students(id)
  - topicId → topics(id)
Unique Constraint: (studentId, topicId)
```

### 20. **leaderboards** ⏳ NEEDED
Rankings and aggregated leaderboard data.

**Purpose:** Cached leaderboard data for fast retrieval.

```sql
id (UUID PK)
examId (UUID FK → exams)
courseSlug (VARCHAR 100 FK → courses)
period (VARCHAR 50) -- today, week, month, overall
studentId (UUID FK → students)
studentName (VARCHAR 255)
score (DECIMAL 10,2))
percentage (DECIMAL 5,2))
rank (INT)
totalAttempted (INT)
centerCode (VARCHAR 50)
avatarUrl (VARCHAR 500)
lastUpdatedAt (TIMESTAMP)
createdAt (TIMESTAMP)

Indexes: examId, courseSlug, period, rank, score DESC
Foreign Keys:
  - examId → exams(id)
  - courseSlug → courses(slug)
  - studentId → students(id)
Unique Constraint: (examId, courseSlug, period, studentId)
```

---

## 🔗 Table Relationships Map

```
STUDENTS (✓)
├── enrollments → COURSES
├── payments → PACKAGES
├── exam_candidates → EXAMS
├── student_responses → QUESTIONS
├── topic_performance → TOPICS
└── result_analysis → SUBJECTS

EXAMS (✓)
├── exam_candidates → STUDENTS
├── questions → SUBJECTS, TOPICS
├── answer_keys
└── syllabus → TOPICS, COURSES
├── exam_centres

COURSES
├── subjects
├── packages
├── syllabus
└── enrollments → STUDENTS

SUBJECTS
├── topics
└── questions

TOPICS
├── questions
├── syllabus
├── topic_performance
└── result_analysis

PAYMENTS (✓)
└── packages

RESULTS (✓)
├── result_analysis
└── leaderboards

QUESTIONS
├── student_responses
└── answer_keys
```

---

## 📋 Migration Order (Recommended)

### Phase 1: Core Dependencies (Week 1)
1. `courses` - Master data
2. `packages` - Pricing
3. `subjects` - Course hierarchy
4. `topics` - Fine-grained categorization
5. `syllabus` - Exam scope
6. `exam_centres` - Venue management

### Phase 2: Business Tables (Week 2)
7. `enrollments` - Student-course mapping
8. `exam_candidates` - Attendance
9. `admit_cards` - Document generation
10. `exam_credentials` - Access control
11. `questions` - Question bank
12. `student_responses` - Exam answers

### Phase 3: Evaluation (Week 3)
13. `answer_keys` - Marking scheme

### Phase 4: Analytics (Week 4)
14. `result_analysis` - Performance breakdowns
15. `topic_performance` - Topic-wise tracking
16. `leaderboards` - Rankings cache

---

## ✨ Implementation Checklist

- [ ] Create migration files for all 16 missing tables
- [ ] Create Model classes for each table
- [ ] Create Repository classes for data access
- [ ] Add proper indexes for performance
- [ ] Add foreign key constraints
- [ ] Add unique constraints where needed
- [ ] Create seeders for master data (courses, subjects, topics)
- [ ] Run migrations on local database
- [ ] Test each model with sample data
- [ ] Document API endpoints for each table

---

## 📖 Next Steps

1. **Start with Phase 1:** courses, packages, subjects, topics, syllabus, exam_centres
2. **Create migration files** in `backend/database/migrations/`
3. **Create models** in `backend/app/Models/`
4. **Create repositories** in `backend/app/Repositories/`
5. **Test thoroughly** before moving to next phase

---

**Last Updated:** 2026-09-10  
**Status:** Planning & Documentation Complete
