<?php

/**
 * Complete Database Schema Migration
 *
 * Creates all 20 tables for Nirvona CBT Platform
 * - 4 existing tables (students, exams, payments, results)
 * - 10 core business tables
 * - 3 infrastructure tables
 * - 3 analytics tables
 */

return [
    'up' => function (\PDO $pdo) {
        $statements = [
            // Enable UUID extension
            "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";",

            // ====================================================================
            // TIER 0: EXISTING TABLES (already created but included for reference)
            // ====================================================================

            // 1. Students Table
            "CREATE TABLE IF NOT EXISTS students (
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
                status VARCHAR(50) DEFAULT 'active',
                enrolledAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                avatarUrl VARCHAR(500),
                guardianName VARCHAR(255),
                guardianMobile VARCHAR(20),
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );",

            "CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);",
            "CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);",
            "CREATE INDEX IF NOT EXISTS idx_students_className ON students(className);",
            "CREATE INDEX IF NOT EXISTS idx_students_city ON students(city);",

            // 2. Exams Table
            "CREATE TABLE IF NOT EXISTS exams (
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
                status VARCHAR(50) DEFAULT 'draft',
                instructions TEXT,
                candidates INT DEFAULT 0,
                admitCardsGenerated INT DEFAULT 0,
                credentialsAssigned INT DEFAULT 0,
                syllabusScope TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );",

            "CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);",
            "CREATE INDEX IF NOT EXISTS idx_exams_date ON exams(date);",
            "CREATE INDEX IF NOT EXISTS idx_exams_courseSlug ON exams(courseSlug);",

            // 3. Payments Table
            "CREATE TABLE IF NOT EXISTS payments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                packageId UUID,
                courseSlug VARCHAR(100),
                amount DECIMAL(10, 2),
                discount DECIMAL(10, 2),
                tax DECIMAL(10, 2),
                total DECIMAL(10, 2),
                status VARCHAR(50) DEFAULT 'pending',
                method VARCHAR(50),
                transactionId VARCHAR(255),
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                retryCount INT DEFAULT 0,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );",

            "CREATE INDEX IF NOT EXISTS idx_payments_studentId ON payments(studentId);",
            "CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);",
            "CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);",

            // 4. Results Table
            "CREATE TABLE IF NOT EXISTS results (
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
                status VARCHAR(50) DEFAULT 'processing',
                topPerformerScore DECIMAL(10, 2),
                averageScore DECIMAL(10, 2),
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );",

            "CREATE INDEX IF NOT EXISTS idx_results_studentId ON results(studentId);",
            "CREATE INDEX IF NOT EXISTS idx_results_examId ON results(examId);",
            "CREATE INDEX IF NOT EXISTS idx_results_status ON results(status);",

            // ====================================================================
            // TIER 1: CORE BUSINESS TABLES
            // ====================================================================

            // 5. Courses Table
            "CREATE TABLE IF NOT EXISTS courses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                slug VARCHAR(100) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                category VARCHAR(100),
                board VARCHAR(100),
                class VARCHAR(50),
                language VARCHAR(20) DEFAULT 'en',
                imageUrl VARCHAR(500),
                icon VARCHAR(50),
                isActive BOOLEAN DEFAULT true,
                orderIndex INT DEFAULT 0,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );",

            "CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);",
            "CREATE INDEX IF NOT EXISTS idx_courses_isActive ON courses(isActive);",

            // 6. Packages Table
            "CREATE TABLE IF NOT EXISTS packages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                courseSlug VARCHAR(100) NOT NULL REFERENCES courses(slug) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2),
                discountedPrice DECIMAL(10, 2),
                currency VARCHAR(10) DEFAULT 'INR',
                validity INT,
                examCount INT,
                validityStartsFrom VARCHAR(50),
                features JSONB,
                isActive BOOLEAN DEFAULT true,
                orderIndex INT DEFAULT 0,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );",

            "CREATE INDEX IF NOT EXISTS idx_packages_courseSlug ON packages(courseSlug);",

            // 7. Subjects Table
            "CREATE TABLE IF NOT EXISTS subjects (
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
            );",

            "CREATE INDEX IF NOT EXISTS idx_subjects_courseSlug ON subjects(courseSlug);",

            // 8. Topics Table
            "CREATE TABLE IF NOT EXISTS topics (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                subjectId UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(100),
                description TEXT,
                orderIndex INT DEFAULT 0,
                difficulty VARCHAR(20),
                estimatedHours DECIMAL(5, 2),
                isActive BOOLEAN DEFAULT true,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(subjectId, slug)
            );",

            "CREATE INDEX IF NOT EXISTS idx_topics_subjectId ON topics(subjectId);",

            // 9. Enrollments Table
            "CREATE TABLE IF NOT EXISTS enrollments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                courseSlug VARCHAR(100) NOT NULL REFERENCES courses(slug) ON DELETE CASCADE,
                examId UUID REFERENCES exams(id) ON DELETE SET NULL,
                enrolledAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50) DEFAULT 'active',
                paymentStatus VARCHAR(50),
                expiresAt TIMESTAMP,
                completionPercentage INT DEFAULT 0,
                lastAccessedAt TIMESTAMP,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(studentId, courseSlug)
            );",

            "CREATE INDEX IF NOT EXISTS idx_enrollments_studentId ON enrollments(studentId);",
            "CREATE INDEX IF NOT EXISTS idx_enrollments_courseSlug ON enrollments(courseSlug);",

            // 10. Exam Candidates Table
            "CREATE TABLE IF NOT EXISTS exam_candidates (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                examId UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
                studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                rollNumber VARCHAR(50),
                seatNumber VARCHAR(50),
                admitCardNumber VARCHAR(100) UNIQUE,
                centerCode VARCHAR(50),
                attendanceStatus VARCHAR(50) DEFAULT 'present',
                reportingTime TIMESTAMP,
                examStartTime TIMESTAMP,
                examEndTime TIMESTAMP,
                ipAddress VARCHAR(45),
                deviceInfo JSONB,
                proctorNotes TEXT,
                status VARCHAR(50) DEFAULT 'registered',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(examId, studentId)
            );",

            "CREATE INDEX IF NOT EXISTS idx_exam_candidates_examId ON exam_candidates(examId);",
            "CREATE INDEX IF NOT EXISTS idx_exam_candidates_studentId ON exam_candidates(studentId);",

            // 11. Admit Cards Table
            "CREATE TABLE IF NOT EXISTS admit_cards (
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
                status VARCHAR(50) DEFAULT 'generated',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );",

            "CREATE INDEX IF NOT EXISTS idx_admit_cards_examId ON admit_cards(examId);",
            "CREATE INDEX IF NOT EXISTS idx_admit_cards_studentId ON admit_cards(studentId);",

            // 12. Exam Credentials Table
            "CREATE TABLE IF NOT EXISTS exam_credentials (
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
            );",

            "CREATE INDEX IF NOT EXISTS idx_exam_credentials_username ON exam_credentials(username);",

            // 13. Questions Table
            "CREATE TABLE IF NOT EXISTS questions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                examId UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
                subjectId UUID REFERENCES subjects(id) ON DELETE SET NULL,
                topicId UUID REFERENCES topics(id) ON DELETE SET NULL,
                questionNumber INT,
                questionText TEXT NOT NULL,
                questionType VARCHAR(50),
                difficulty VARCHAR(20),
                marksFor DECIMAL(5, 2),
                marksAgainst DECIMAL(5, 2),
                optionA TEXT,
                optionB TEXT,
                optionC TEXT,
                optionD TEXT,
                optionE TEXT,
                correctOption VARCHAR(1),
                explanation TEXT,
                imageUrl VARCHAR(500),
                audioUrl VARCHAR(500),
                solutionVideoUrl VARCHAR(500),
                language VARCHAR(20) DEFAULT 'en',
                status VARCHAR(50) DEFAULT 'active',
                createdBy VARCHAR(100),
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );",

            "CREATE INDEX IF NOT EXISTS idx_questions_examId ON questions(examId);",
            "CREATE INDEX IF NOT EXISTS idx_questions_topicId ON questions(topicId);",

            // 14. Student Responses Table
            "CREATE TABLE IF NOT EXISTS student_responses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                examId UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
                studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                questionId UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
                selectedOption VARCHAR(1),
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
            );",

            "CREATE INDEX IF NOT EXISTS idx_student_responses_examId ON student_responses(examId);",
            "CREATE INDEX IF NOT EXISTS idx_student_responses_studentId ON student_responses(studentId);",

            // ====================================================================
            // TIER 2: INFRASTRUCTURE TABLES
            // ====================================================================

            // 15. Syllabus Table
            "CREATE TABLE IF NOT EXISTS syllabus (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                examId UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
                courseSlug VARCHAR(100) NOT NULL REFERENCES courses(slug) ON DELETE CASCADE,
                topicId UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
                weight DECIMAL(5, 2),
                estimatedHours DECIMAL(5, 2),
                learningObjectives JSONB,
                questionsCount INT,
                sampledItems JSONB,
                isOptional BOOLEAN DEFAULT false,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(examId, topicId)
            );",

            "CREATE INDEX IF NOT EXISTS idx_syllabus_examId ON syllabus(examId);",

            // 16. Exam Centres Table
            "CREATE TABLE IF NOT EXISTS exam_centres (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(50),
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
                amenities JSONB,
                isActive BOOLEAN DEFAULT true,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );",

            "CREATE INDEX IF NOT EXISTS idx_exam_centres_code ON exam_centres(code);",
            "CREATE INDEX IF NOT EXISTS idx_exam_centres_city ON exam_centres(city);",

            // 17. Answer Keys Table
            "CREATE TABLE IF NOT EXISTS answer_keys (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                examId UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
                version INT DEFAULT 1,
                questionId UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
                correctOption VARCHAR(1),
                acceptableAnswers JSONB,
                marksFor DECIMAL(5, 2),
                marksAgainst DECIMAL(5, 2),
                explanation TEXT,
                solutionUrl VARCHAR(500),
                updatedBy VARCHAR(100),
                releaseDate TIMESTAMP,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(examId, questionId, version)
            );",

            "CREATE INDEX IF NOT EXISTS idx_answer_keys_examId ON answer_keys(examId);",

            // ====================================================================
            // TIER 3: ANALYTICS TABLES
            // ====================================================================

            // 18. Result Analysis Table
            "CREATE TABLE IF NOT EXISTS result_analysis (
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
                speed DECIMAL(10, 2),
                strongTopics JSONB,
                weakTopics JSONB,
                comparisonWithClassAverage DECIMAL(5, 2),
                comparisonWithToppers DECIMAL(5, 2),
                updatedAt TIMESTAMP,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );",

            "CREATE INDEX IF NOT EXISTS idx_result_analysis_resultId ON result_analysis(resultId);",
            "CREATE INDEX IF NOT EXISTS idx_result_analysis_studentId ON result_analysis(studentId);",

            // 19. Topic Performance Table
            "CREATE TABLE IF NOT EXISTS topic_performance (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                topicId UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
                totalAttempts INT,
                correctCount INT,
                incorrectCount INT,
                accuracy DECIMAL(5, 2),
                averageTimePerQuestion DECIMAL(10, 2),
                lastAttemptAt TIMESTAMP,
                trendDirection VARCHAR(20),
                performanceLevel VARCHAR(50),
                recommendedExams JSONB,
                needsImprovement BOOLEAN DEFAULT false,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(studentId, topicId)
            );",

            "CREATE INDEX IF NOT EXISTS idx_topic_performance_studentId ON topic_performance(studentId);",

            // 20. Leaderboards Table
            "CREATE TABLE IF NOT EXISTS leaderboards (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                examId UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
                courseSlug VARCHAR(100) NOT NULL REFERENCES courses(slug) ON DELETE CASCADE,
                period VARCHAR(50),
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
            );",

            "CREATE INDEX IF NOT EXISTS idx_leaderboards_examId ON leaderboards(examId);",
            "CREATE INDEX IF NOT EXISTS idx_leaderboards_rank ON leaderboards(rank);",

            // Add foreign key to exams.centreId
            "ALTER TABLE exams ADD CONSTRAINT fk_exams_centreId FOREIGN KEY (centreId) REFERENCES exam_centres(id) ON DELETE SET NULL;",
        ];

        // Execute all statements
        foreach ($statements as $statement) {
            try {
                $pdo->exec($statement);
            } catch (PDOException $e) {
                // Log but don't fail on duplicate indexes/tables
                error_log("Migration warning: " . $e->getMessage());
            }
        }
    },

    'down' => function (\PDO $pdo) {
        // Drop all tables in reverse order of creation (respecting foreign keys)
        $tables = [
            'leaderboards',
            'topic_performance',
            'result_analysis',
            'answer_keys',
            'exam_centres',
            'syllabus',
            'student_responses',
            'questions',
            'exam_credentials',
            'admit_cards',
            'exam_candidates',
            'enrollments',
            'topics',
            'subjects',
            'packages',
            'courses',
            'results',
            'payments',
            'exams',
            'students',
        ];

        foreach ($tables as $table) {
            $pdo->exec("DROP TABLE IF EXISTS $table CASCADE;");
        }
    },
];
