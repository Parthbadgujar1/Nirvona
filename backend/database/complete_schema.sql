-- ============================================================================
-- NIRVONA CBT PLATFORM - COMPLETE DATABASE SCHEMA
-- PostgreSQL 13+
-- ============================================================================
-- This file contains all 20 tables for the Nirvona Computer-Based Testing platform
-- Created: 2026-09-10
-- Status: Production-Ready
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TIER 0: EXISTING TABLES (4 tables - already created)
-- ============================================================================

-- 1. STUDENTS TABLE
-- Core student profile and enrollment information
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fullName VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(20),
    password VARCHAR(255),
    dateOfBirth DATE,
    gender VARCHAR(20),
    className VARCHAR(100),
    school VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    address TEXT,
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended, deleted
    enrolledAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    avatarUrl VARCHAR(500),
    guardianName VARCHAR(255),
    guardianMobile VARCHAR(20),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_className ON students(className);
CREATE INDEX idx_students_city ON students(city);
CREATE INDEX idx_students_enrolledAt ON students(enrolledAt);

-- 2. EXAMS TABLE
-- Exam schedules, configuration, and metadata
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    courseSlug VARCHAR(100),
    date TIMESTAMP NOT NULL,
    reportingTime VARCHAR(20),
    examTime VARCHAR(20),
    durationMinutes INT,
    totalQuestions INT,
    totalMarks INT,
    centreId UUID,
    status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, ongoing, completed, cancelled
    instructions TEXT,
    candidates INT DEFAULT 0,
    admitCardsGenerated INT DEFAULT 0,
    credentialsAssigned INT DEFAULT 0,
    syllabusScope TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_exams_date ON exams(date);
CREATE INDEX idx_exams_courseSlug ON exams(courseSlug);
CREATE INDEX idx_exams_centreId ON exams(centreId);

-- 3. PAYMENTS TABLE
-- Payment transactions and revenue tracking
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    packageId UUID,
    courseSlug VARCHAR(100),
    amount DECIMAL(10, 2),
    discount DECIMAL(10, 2),
    tax DECIMAL(10, 2),
    total DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded, cancelled
    method VARCHAR(50), -- razorpay, upi, card, netbanking, wallet
    transactionId VARCHAR(255),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    retryCount INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_studentId ON payments(studentId);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_date ON payments(date);
CREATE INDEX idx_payments_transactionId ON payments(transactionId);

-- 4. RESULTS TABLE
-- Exam results and performance analytics
CREATE TABLE IF NOT EXISTS results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    examId UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    examName VARCHAR(255),
    courseSlug VARCHAR(100),
    score DECIMAL(10, 2),
    maxScore DECIMAL(10, 2),
    percentage DECIMAL(5, 2),
    rank INT,
    totalCandidates INT,
    percentile DECIMAL(5, 2),
    accuracy DECIMAL(5, 2),
    correct INT,
    incorrect INT,
    unattempted INT,
    timeTakenMin INT,
    status VARCHAR(50) DEFAULT 'processing', -- processing, completed, cancelled
    topPerformerScore DECIMAL(10, 2),
    averageScore DECIMAL(10, 2),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_results_studentId ON results(studentId);
CREATE INDEX idx_results_examId ON results(examId);
CREATE INDEX idx_results_status ON results(status);
CREATE INDEX idx_results_rank ON results(rank);
CREATE UNIQUE INDEX idx_results_unique ON results(studentId, examId);

-- ============================================================================
-- TIER 1: CORE BUSINESS TABLES (6 tables - HIGH PRIORITY)
-- ============================================================================

-- 5. COURSES TABLE
-- Master course definitions
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- JEE, NEET, BOARDS, COMPETITIVE, etc
    board VARCHAR(100), -- CBSE, ICSE, STATE, GENERAL
    class VARCHAR(50), -- Class 10, Class 12, etc
    language VARCHAR(20) DEFAULT 'en', -- en, hi, te, etc
    imageUrl VARCHAR(500),
    icon VARCHAR(50), -- emoji or icon code
    isActive BOOLEAN DEFAULT true,
    orderIndex INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_courses_name ON courses(name);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_isActive ON courses(isActive);

-- 6. PACKAGES TABLE
-- Subscription/pricing packages
CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courseSlug VARCHAR(100) NOT NULL REFERENCES courses(slug) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    discountedPrice DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'INR',
    validity INT, -- days of access
    examCount INT, -- number of exams included
    validityStartsFrom VARCHAR(50), -- purchase-date, course-start
    features JSONB, -- array of feature strings
    isActive BOOLEAN DEFAULT true,
    orderIndex INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_packages_courseSlug ON packages(courseSlug);
CREATE INDEX idx_packages_isActive ON packages(isActive);

-- 7. SUBJECTS TABLE
-- Subject categorization within courses
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courseSlug VARCHAR(100) NOT NULL REFERENCES courses(slug) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100),
    description TEXT,
    icon VARCHAR(50),
    orderIndex INT DEFAULT 0,
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(courseSlug, slug)
);

CREATE INDEX idx_subjects_courseSlug ON subjects(courseSlug);
CREATE INDEX idx_subjects_slug ON subjects(slug);

-- 8. TOPICS TABLE
-- Fine-grained topic categorization for analytics
CREATE TABLE IF NOT EXISTS topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subjectId UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100),
    description TEXT,
    orderIndex INT DEFAULT 0,
    difficulty VARCHAR(20), -- easy, medium, hard
    estimatedHours DECIMAL(5, 2),
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subjectId, slug)
);

CREATE INDEX idx_topics_subjectId ON topics(subjectId);
CREATE INDEX idx_topics_slug ON topics(slug);
CREATE INDEX idx_topics_difficulty ON topics(difficulty);

-- 9. ENROLLMENTS TABLE
-- Student enrollment in courses/exams
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    courseSlug VARCHAR(100) NOT NULL REFERENCES courses(slug) ON DELETE CASCADE,
    examId UUID REFERENCES exams(id) ON DELETE SET NULL,
    enrolledAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active', -- active, dropped, completed, suspended
    paymentStatus VARCHAR(50), -- paid, pending, refunded, trial
    expiresAt TIMESTAMP,
    completionPercentage INT DEFAULT 0,
    lastAccessedAt TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(studentId, courseSlug)
);

CREATE INDEX idx_enrollments_studentId ON enrollments(studentId);
CREATE INDEX idx_enrollments_courseSlug ON enrollments(courseSlug);
CREATE INDEX idx_enrollments_examId ON enrollments(examId);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_expiresAt ON enrollments(expiresAt);

-- 10. EXAM_CANDIDATES TABLE
-- Student attendance and seat allocation
CREATE TABLE IF NOT EXISTS exam_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    examId UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    rollNumber VARCHAR(50),
    seatNumber VARCHAR(50),
    admitCardNumber VARCHAR(100) UNIQUE,
    centerCode VARCHAR(50),
    attendanceStatus VARCHAR(50) DEFAULT 'present', -- present, absent, invalid
    reportingTime TIMESTAMP,
    examStartTime TIMESTAMP,
    examEndTime TIMESTAMP,
    ipAddress VARCHAR(45),
    deviceInfo JSONB, -- browser, OS, device details
    proctorNotes TEXT,
    status VARCHAR(50) DEFAULT 'registered', -- registered, attended, absent, disqualified
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(examId, studentId)
);

CREATE INDEX idx_exam_candidates_examId ON exam_candidates(examId);
CREATE INDEX idx_exam_candidates_studentId ON exam_candidates(studentId);
CREATE INDEX idx_exam_candidates_admitCardNumber ON exam_candidates(admitCardNumber);
CREATE INDEX idx_exam_candidates_seatNumber ON exam_candidates(seatNumber);
CREATE INDEX idx_exam_candidates_attendanceStatus ON exam_candidates(attendanceStatus);

-- 11. ADMIT_CARDS TABLE
-- Digital admit card records
CREATE TABLE IF NOT EXISTS admit_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    examId UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    admitCardNumber VARCHAR(100) UNIQUE NOT NULL,
    rollNumber VARCHAR(50),
    generatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generatedBy VARCHAR(100),
    documentUrl VARCHAR(500),
    downloadedAt TIMESTAMP,
    downloadCount INT DEFAULT 0,
    sentViaEmail BOOLEAN DEFAULT false,
    sentViaSMS BOOLEAN DEFAULT false,
    verificationCode VARCHAR(20),
    status VARCHAR(50) DEFAULT 'generated', -- generated, sent, verified, used
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admit_cards_examId ON admit_cards(examId);
CREATE INDEX idx_admit_cards_studentId ON admit_cards(studentId);
CREATE INDEX idx_admit_cards_admitCardNumber ON admit_cards(admitCardNumber);
CREATE INDEX idx_admit_cards_generatedAt ON admit_cards(generatedAt);

-- 12. EXAM_CREDENTIALS TABLE
-- Login credentials for exam access
CREATE TABLE IF NOT EXISTS exam_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    examId UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    username VARCHAR(100) UNIQUE NOT NULL,
    passwordHash VARCHAR(255),
    lastUsedAt TIMESTAMP,
    loginAttempts INT DEFAULT 0,
    lockedUntil TIMESTAMP,
    isExpired BOOLEAN DEFAULT false,
    expiresAt TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(examId, studentId)
);

CREATE INDEX idx_exam_credentials_examId ON exam_credentials(examId);
CREATE INDEX idx_exam_credentials_studentId ON exam_credentials(studentId);
CREATE INDEX idx_exam_credentials_username ON exam_credentials(username);

-- 13. QUESTIONS TABLE
-- Question bank with exam content
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    examId UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    subjectId UUID REFERENCES subjects(id) ON DELETE SET NULL,
    topicId UUID REFERENCES topics(id) ON DELETE SET NULL,
    questionNumber INT,
    questionText TEXT NOT NULL,
    questionType VARCHAR(50), -- mcq, numeric, matrix, fill-blank, assertion-reason
    difficulty VARCHAR(20), -- easy, medium, hard
    marksFor DECIMAL(5, 2),
    marksAgainst DECIMAL(5, 2),
    optionA TEXT,
    optionB TEXT,
    optionC TEXT,
    optionD TEXT,
    optionE TEXT,
    correctOption VARCHAR(1), -- A, B, C, D, E
    explanation TEXT,
    imageUrl VARCHAR(500),
    audioUrl VARCHAR(500),
    solutionVideoUrl VARCHAR(500),
    language VARCHAR(20) DEFAULT 'en',
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, deleted
    createdBy VARCHAR(100),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_questions_examId ON questions(examId);
CREATE INDEX idx_questions_subjectId ON questions(subjectId);
CREATE INDEX idx_questions_topicId ON questions(topicId);
CREATE INDEX idx_questions_questionNumber ON questions(questionNumber);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_status ON questions(status);

-- 14. STUDENT_RESPONSES TABLE
-- Individual student answers during exam
CREATE TABLE IF NOT EXISTS student_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    examId UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    questionId UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selectedOption VARCHAR(1), -- A, B, C, D, E
    selectedAnswerJson JSONB,
    markedForReview BOOLEAN DEFAULT false,
    visitCount INT DEFAULT 1,
    timeSpentSec INT,
    isCorrect BOOLEAN,
    marksAwarded DECIMAL(5, 2),
    marksNegative DECIMAL(5, 2),
    responseAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(examId, studentId, questionId)
);

CREATE INDEX idx_student_responses_examId ON student_responses(examId);
CREATE INDEX idx_student_responses_studentId ON student_responses(studentId);
CREATE INDEX idx_student_responses_questionId ON student_responses(questionId);
CREATE INDEX idx_student_responses_isCorrect ON student_responses(isCorrect);

-- ============================================================================
-- TIER 2: CATALOG & INFRASTRUCTURE TABLES (3 tables - MEDIUM PRIORITY)
-- ============================================================================

-- 15. SYLLABUS TABLE
-- Detailed curriculum scope per exam
CREATE TABLE IF NOT EXISTS syllabus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    examId UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    courseSlug VARCHAR(100) NOT NULL REFERENCES courses(slug) ON DELETE CASCADE,
    topicId UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    weight DECIMAL(5, 2), -- percentage in exam
    estimatedHours DECIMAL(5, 2),
    learningObjectives JSONB, -- array of objectives
    questionsCount INT,
    sampledItems JSONB,
    isOptional BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(examId, topicId)
);

CREATE INDEX idx_syllabus_examId ON syllabus(examId);
CREATE INDEX idx_syllabus_courseSlug ON syllabus(courseSlug);
CREATE INDEX idx_syllabus_topicId ON syllabus(topicId);

-- 16. EXAM_CENTRES TABLE
-- Physical/virtual exam center management
CREATE TABLE IF NOT EXISTS exam_centres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50), -- physical, online, hybrid
    city VARCHAR(100),
    state VARCHAR(100),
    address TEXT,
    coordinatorName VARCHAR(255),
    coordinatorEmail VARCHAR(255),
    coordinatorMobile VARCHAR(20),
    totalSeats INT,
    seatsAvailable INT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    amenities JSONB, -- array of amenities
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exam_centres_code ON exam_centres(code);
CREATE INDEX idx_exam_centres_city ON exam_centres(city);
CREATE INDEX idx_exam_centres_state ON exam_centres(state);
CREATE INDEX idx_exam_centres_isActive ON exam_centres(isActive);

-- 17. ANSWER_KEYS TABLE
-- Correct answers and marking scheme
CREATE TABLE IF NOT EXISTS answer_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    examId UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    version INT DEFAULT 1,
    questionId UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    correctOption VARCHAR(1), -- A, B, C, D, E
    acceptableAnswers JSONB, -- array for fill-blanks
    marksFor DECIMAL(5, 2),
    marksAgainst DECIMAL(5, 2),
    explanation TEXT,
    solutionUrl VARCHAR(500),
    updatedBy VARCHAR(100),
    releaseDate TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(examId, questionId, version)
);

CREATE INDEX idx_answer_keys_examId ON answer_keys(examId);
CREATE INDEX idx_answer_keys_questionId ON answer_keys(questionId);
CREATE INDEX idx_answer_keys_releaseDate ON answer_keys(releaseDate);

-- ============================================================================
-- TIER 3: ANALYTICS & PERFORMANCE TABLES (3 tables - LATER PRIORITY)
-- ============================================================================

-- 18. RESULT_ANALYSIS TABLE
-- Detailed performance breakdowns
CREATE TABLE IF NOT EXISTS result_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resultId UUID NOT NULL REFERENCES results(id) ON DELETE CASCADE,
    studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    examId UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    subjectId UUID REFERENCES subjects(id) ON DELETE SET NULL,
    subjectName VARCHAR(255),
    subjectMarks DECIMAL(10, 2),
    subjectMaxMarks DECIMAL(10, 2),
    subjectPercentage DECIMAL(5, 2),
    subjectRank INT,
    correctCount INT,
    incorrectCount INT,
    unattemptedCount INT,
    accuracy DECIMAL(5, 2),
    speed DECIMAL(10, 2), -- questions per minute
    strongTopics JSONB, -- array of topic performance
    weakTopics JSONB,
    comparisonWithClassAverage DECIMAL(5, 2),
    comparisonWithToppers DECIMAL(5, 2),
    updatedAt TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_result_analysis_resultId ON result_analysis(resultId);
CREATE INDEX idx_result_analysis_studentId ON result_analysis(studentId);
CREATE INDEX idx_result_analysis_examId ON result_analysis(examId);
CREATE INDEX idx_result_analysis_subjectId ON result_analysis(subjectId);

-- 19. TOPIC_PERFORMANCE TABLE
-- Performance metrics by topic
CREATE TABLE IF NOT EXISTS topic_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    topicId UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    totalAttempts INT,
    correctCount INT,
    incorrectCount INT,
    accuracy DECIMAL(5, 2),
    averageTimePerQuestion DECIMAL(10, 2),
    lastAttemptAt TIMESTAMP,
    trendDirection VARCHAR(20), -- improving, stable, declining
    performanceLevel VARCHAR(50), -- beginner, intermediate, advanced, mastered
    recommendedExams JSONB, -- array of exam IDs
    needsImprovement BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(studentId, topicId)
);

CREATE INDEX idx_topic_performance_studentId ON topic_performance(studentId);
CREATE INDEX idx_topic_performance_topicId ON topic_performance(topicId);
CREATE INDEX idx_topic_performance_accuracy ON topic_performance(accuracy);
CREATE INDEX idx_topic_performance_performanceLevel ON topic_performance(performanceLevel);

-- 20. LEADERBOARDS TABLE
-- Rankings and cached leaderboard data
CREATE TABLE IF NOT EXISTS leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    examId UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    courseSlug VARCHAR(100) NOT NULL REFERENCES courses(slug) ON DELETE CASCADE,
    period VARCHAR(50), -- today, week, month, overall
    studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    studentName VARCHAR(255),
    score DECIMAL(10, 2),
    percentage DECIMAL(5, 2),
    rank INT,
    totalAttempted INT,
    centerCode VARCHAR(50),
    avatarUrl VARCHAR(500),
    lastUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(examId, courseSlug, period, studentId)
);

CREATE INDEX idx_leaderboards_examId ON leaderboards(examId);
CREATE INDEX idx_leaderboards_courseSlug ON leaderboards(courseSlug);
CREATE INDEX idx_leaderboards_period ON leaderboards(period);
CREATE INDEX idx_leaderboards_rank ON leaderboards(rank);
CREATE INDEX idx_leaderboards_score ON leaderboards(score DESC);

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS (Already defined above with ON DELETE rules)
-- ============================================================================

-- Update EXAMS table centreId reference to exam_centres
ALTER TABLE exams
    ADD CONSTRAINT fk_exams_centreId
    FOREIGN KEY (centreId)
    REFERENCES exam_centres(id)
    ON DELETE SET NULL;

-- ============================================================================
-- PERFORMANCE OPTIMIZATION - ADDITIONAL INDEXES
-- ============================================================================

-- Composite indexes for common queries
CREATE INDEX idx_results_studentId_examId ON results(studentId, examId);
CREATE INDEX idx_student_responses_examId_studentId ON student_responses(examId, studentId);
CREATE INDEX idx_enrollments_studentId_status ON enrollments(studentId, status);
CREATE INDEX idx_exam_candidates_examId_attendanceStatus ON exam_candidates(examId, attendanceStatus);

-- Full-text search indexes (optional, for future search functionality)
CREATE INDEX idx_questions_search ON questions USING GIN(to_tsvector('english', questionText));
CREATE INDEX idx_students_search ON students USING GIN(to_tsvector('english', fullName));

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES (Optional)
-- ============================================================================

-- Create a function to update the 'updatedAt' column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updatedAt column
CREATE TRIGGER update_students_updatedAt BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exams_updatedAt BEFORE UPDATE ON exams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updatedAt BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_results_updatedAt BEFORE UPDATE ON results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updatedAt BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updatedAt BEFORE UPDATE ON packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updatedAt BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updatedAt BEFORE UPDATE ON topics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updatedAt BEFORE UPDATE ON enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_candidates_updatedAt BEFORE UPDATE ON exam_candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admit_cards_updatedAt BEFORE UPDATE ON admit_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_credentials_updatedAt BEFORE UPDATE ON exam_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updatedAt BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_responses_updatedAt BEFORE UPDATE ON student_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_syllabus_updatedAt BEFORE UPDATE ON syllabus
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_centres_updatedAt BEFORE UPDATE ON exam_centres
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answer_keys_updatedAt BEFORE UPDATE ON answer_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_result_analysis_updatedAt BEFORE UPDATE ON result_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topic_performance_updatedAt BEFORE UPDATE ON topic_performance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE SUMMARY & STATISTICS
-- ============================================================================

/*
TOTAL TABLES CREATED: 20

TIER 0 - EXISTING (4 tables):
1. students - Student profiles and enrollments
2. exams - Exam schedules and configuration
3. payments - Payment transactions
4. results - Exam results and analytics

TIER 1 - CORE BUSINESS (10 tables):
5. courses - Course definitions
6. packages - Pricing packages
7. subjects - Subject categorization
8. topics - Topic categorization
9. enrollments - Student enrollment tracking
10. exam_candidates - Student attendance
11. admit_cards - Admit card records
12. exam_credentials - Exam access credentials
13. questions - Question bank
14. student_responses - Student answers

TIER 2 - INFRASTRUCTURE (3 tables):
15. syllabus - Curriculum scope
16. exam_centres - Exam centers
17. answer_keys - Answer keys and marking

TIER 3 - ANALYTICS (3 tables):
18. result_analysis - Performance breakdowns
19. topic_performance - Topic-wise tracking
20. leaderboards - Rankings cache

RELATIONSHIPS:
- students: 1-to-many with enrollments, payments, results, exam_candidates, admit_cards, exam_credentials
- exams: 1-to-many with questions, results, exam_candidates, admit_cards, exam_credentials
- courses: 1-to-many with packages, subjects, enrollments, syllabus
- subjects: 1-to-many with topics
- topics: 1-to-many with student_responses, syllabus, topic_performance
- exam_centres: 1-to-many with exams

FEATURES:
✓ UUID primary keys (better for distributed systems)
✓ Automatic timestamps (createdAt, updatedAt)
✓ Strategic indexes for query performance
✓ Foreign key constraints with CASCADE/SET NULL rules
✓ JSONB columns for flexible data storage
✓ Triggers for automatic timestamp updates
✓ Full-text search capabilities
✓ Unique constraints for data integrity

ESTIMATED STORAGE (with ~100k students, ~1k exams):
- Total records: ~50M
- Database size: ~10-15GB
- Recommended: NVMe SSD with 20GB+ space

PERFORMANCE CONSIDERATIONS:
- Results table may grow large: consider partitioning by exam date
- Student responses: index on (examId, studentId) for fast retrieval
- Leaderboards: pre-compute and cache for performance
- Topic performance: denormalize for analytics queries
*/

-- ============================================================================
-- SCHEMA VERSION: 1.0
-- Last Updated: 2026-09-10
-- Status: Production Ready
-- ============================================================================
