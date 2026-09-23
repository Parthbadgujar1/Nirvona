<?php

/**
 * Migration: class-level x stream catalogue, packages by plan, test schedules
 *
 * Replaces the original five generic programmes (Class 11 / Class 12 /
 * Devoter / JEE / NEET, priced by duration) with the structure the client
 * asked for:
 *
 *   category  : 11th, 12th, Dropper
 *   stream    : JEE, NEET, CET (+ a Hindi-medium Dropper NEET batch)
 *   plan      : Basic, Pro, Pro Max   (one package per plan)
 *
 * and loads the MIP Planner 2026-27 test calendar into `test_schedules`.
 *
 * SCHEDULE RULE (client-specified). Nirvona runs each test on the NEXT test
 * date of the source calendar: the test the source runs on the 16th is run
 * by Nirvona on the 25th (the source's next test date), and so on. So for
 * a schedule sorted by source date, `examDate(i) = pwDate(i + 1)`. The last
 * test has no "next" date - it is scheduled LAST_TEST_LAG_DAYS after its
 * source date. The source ("pw") dates are stored but never exposed by the
 * API.
 *
 * Old programmes are deactivated, NOT deleted: real payments, enrollments
 * and exams reference them.
 *
 * New packages are created INACTIVE with price 0 - the workbook has no
 * prices, and nothing may be sold at an invented price. The admin sets the
 * price in Admin > Packages and activates the plan.
 */

const LAST_TEST_LAG_DAYS = 7;

return [
    'up' => function (\PDO $pdo) {
        $pdo->exec("
            ALTER TABLE packages ADD COLUMN IF NOT EXISTS tier VARCHAR(20);
            CREATE INDEX IF NOT EXISTS idx_packages_tier ON packages(courseSlug, tier);

            CREATE TABLE IF NOT EXISTS test_schedules (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                courseSlug VARCHAR(50) NOT NULL REFERENCES courses(slug) ON DELETE CASCADE,
                tier VARCHAR(20) NOT NULL,
                sNo INT NOT NULL,
                testName VARCHAR(255) NOT NULL,
                pwDate DATE,
                examDate DATE,
                testNumber VARCHAR(100),
                testType VARCHAR(100),
                testPattern VARCHAR(100),
                mode VARCHAR(100),
                subjects JSONB NOT NULL DEFAULT '{}',
                note TEXT,
                testCount INT NOT NULL DEFAULT 1,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (courseSlug, tier, sNo)
            );
            CREATE INDEX IF NOT EXISTS idx_test_schedules_lookup ON test_schedules(courseSlug, tier, examDate);
        ");

        // Retire the original programmes (kept for history).
        $pdo->exec("
            UPDATE courses SET status = 'inactive'
            WHERE slug IN ('class-11', 'class-12', 'devoter', 'jee', 'neet');
            UPDATE packages SET status = 'inactive'
            WHERE courseSlug IN ('class-11', 'class-12', 'devoter', 'jee', 'neet');
        ");

        $jeePattern = [
            ['section' => 'Physics', 'questions' => 30, 'marks' => 120, 'type' => '25 MCQ + 5 Numerical', 'negative' => '-1 on MCQ'],
            ['section' => 'Chemistry', 'questions' => 30, 'marks' => 120, 'type' => '25 MCQ + 5 Numerical', 'negative' => '-1 on MCQ'],
            ['section' => 'Mathematics', 'questions' => 30, 'marks' => 120, 'type' => '25 MCQ + 5 Numerical', 'negative' => '-1 on MCQ'],
        ];
        $neetPattern = [
            ['section' => 'Physics', 'questions' => 45, 'marks' => 180, 'type' => 'Single correct MCQ', 'negative' => '-1'],
            ['section' => 'Chemistry', 'questions' => 45, 'marks' => 180, 'type' => 'Single correct MCQ', 'negative' => '-1'],
            ['section' => 'Biology (Botany + Zoology)', 'questions' => 90, 'marks' => 360, 'type' => 'Single correct MCQ', 'negative' => '-1'],
        ];

        $levels = ['11th' => '11th', '12th' => '12th', 'dropper' => 'Dropper'];
        $streams = [
            'jee' => ['JEE', 'ember', 'Atom', $jeePattern, ['Physics', 'Chemistry', 'Mathematics']],
            'neet' => ['NEET', 'teal', 'Stethoscope', $neetPattern, ['Physics', 'Chemistry', 'Biology']],
            'cet' => ['CET', 'royal', 'GraduationCap', [], ['Physics', 'Chemistry', 'Mathematics / Biology']],
        ];

        $catalogue = [];
        foreach ($levels as $levelKey => $levelLabel) {
            foreach ($streams as $streamKey => [$streamLabel, $accent, $icon, $pattern, $subjects]) {
                $catalogue[] = [
                    'slug' => "{$levelKey}-{$streamKey}",
                    'name' => "{$levelLabel} {$streamLabel}",
                    'shortName' => "{$levelLabel} {$streamLabel}",
                    'level' => $levelLabel,
                    'stream' => $streamLabel,
                    'medium' => 'English',
                    'accent' => $accent,
                    'icon' => $icon,
                    'pattern' => $pattern,
                ];
            }
        }
        $catalogue[] = [
            'slug' => 'dropper-neet-hindi',
            'name' => 'Dropper NEET (Hindi medium)',
            'shortName' => 'Dropper NEET Hindi',
            'level' => 'Dropper',
            'stream' => 'NEET',
            'medium' => 'Hindi',
            'accent' => 'teal',
            'icon' => 'Stethoscope',
            'pattern' => $neetPattern,
        ];

        $upsertCourse = $pdo->prepare("
            INSERT INTO courses (
                slug, name, shortName, tagline, description, audience, maxDurationMonths, totalTests,
                accent, icon, highlights, examPattern, patternNotes, faqs, stats, status
            ) VALUES (?, ?, ?, ?, ?, ?, 12, 0, ?, ?, ?, ?, ?, ?, ?, 'active')
            ON CONFLICT (slug) DO UPDATE SET
                name = EXCLUDED.name, shortName = EXCLUDED.shortName, tagline = EXCLUDED.tagline,
                description = EXCLUDED.description, audience = EXCLUDED.audience,
                accent = EXCLUDED.accent, icon = EXCLUDED.icon, highlights = EXCLUDED.highlights,
                examPattern = EXCLUDED.examPattern, patternNotes = EXCLUDED.patternNotes,
                faqs = EXCLUDED.faqs, status = 'active'
        ");

        foreach ($catalogue as $c) {
            $isCet = $c['stream'] === 'CET';
            $who = $c['level'] === 'Dropper' ? 'repeaters (droppers)' : "{$c['level']} students";
            $tagline = $isCet
                ? "CET test series for {$c['level']} students, with a published test calendar."
                : "{$c['stream']} test series for {$c['level']} students, following a published test calendar.";
            $description = $isCet
                ? "A computer-based CET practice programme for {$who}. The full test calendar and chapter-wise coverage will be published here as soon as it is finalised."
                : "A structured {$c['stream']} test series for {$who}: part tests and full-syllabus tests on a fixed calendar, with the exact chapters for every test published in advance, followed by an answer key and performance analytics.";
            $audience = [
                "{$c['level']} students preparing for {$c['stream']}",
                'Students who want a fixed, published test calendar',
                'Aspirants who want rank and accuracy feedback after every test',
            ];
            $highlights = $isCet
                ? ['Computer-based practice tests', 'Answer key and analytics after every test', 'Calendar to be announced']
                : [
                    'Published test calendar with chapter-wise coverage for every test',
                    'Mix of part tests and full-syllabus tests in the actual exam pattern',
                    'Answer key and detailed performance analytics after every test',
                    'Three plans - Basic, Pro and Pro Max - to match how many tests you want',
                ];
            $patternNotes = $isCet
                ? ['Test pattern and schedule will be announced.']
                : [
                    "Tests follow the {$c['stream']} paper pattern; the pattern of each test is shown in the schedule.",
                    'Tests are conducted in offline / OMR or CBT mode as indicated per test.',
                    'The chapters covered by each test are published in the schedule.',
                ];
            $faqs = [
                [
                    'q' => 'What if I join after some tests have already been conducted?',
                    'a' => 'You are enrolled for the tests that are still to come. Tests already conducted are not part of your schedule, and the number of tests shown on a plan is always the number of tests remaining.',
                ],
                [
                    'q' => 'Where can I see the test dates and chapters?',
                    'a' => 'The Test Schedule page lists every upcoming test with its date, pattern and the chapters it covers. After you enrol, your own schedule is also shown in your student portal.',
                ],
                [
                    'q' => 'What is the difference between Basic, Pro and Pro Max?',
                    'a' => 'The plans differ in how many tests they include. Compare the test counts on the plan cards; the higher plans include every test of the lower ones plus additional tests.',
                ],
            ];
            $upsertCourse->execute([
                $c['slug'], $c['name'], $c['shortName'], $tagline, $description,
                json_encode($audience), $c['accent'], $c['icon'], json_encode($highlights),
                json_encode($c['pattern']), json_encode($patternNotes), json_encode($faqs),
                json_encode([]),
            ]);
        }

        // ---- Test schedules (with the "next source date" shift) ----------
        $file = __DIR__ . '/../data/test_schedule.json';
        $sheets = json_decode((string) file_get_contents($file), true) ?: [];

        $insertTest = $pdo->prepare("
            INSERT INTO test_schedules (
                courseSlug, tier, sNo, testName, pwDate, examDate, testNumber, testType,
                testPattern, mode, subjects, note, testCount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (courseSlug, tier, sNo) DO NOTHING
        ");

        $tierCounts = [];
        foreach ($sheets as $sheet) {
            $tests = $sheet['tests'];
            // Distinct dated source dates, ascending.
            $dates = [];
            foreach ($tests as $t) {
                if (!empty($t['pwDate'])) {
                    $dates[$t['pwDate']] = true;
                }
            }
            $dates = array_keys($dates);
            sort($dates);
            $nextOf = [];
            foreach ($dates as $i => $d) {
                $nextOf[$d] = $dates[$i + 1]
                    ?? (new \DateTimeImmutable($d))->modify('+' . LAST_TEST_LAG_DAYS . ' days')->format('Y-m-d');
            }

            $total = 0;
            foreach ($tests as $t) {
                $isSeries = ($t['testType'] ?? '') === '6-test series';
                $weight = $isSeries ? 6 : 1;
                $total += $weight;
                $examDate = !empty($t['pwDate']) ? $nextOf[$t['pwDate']] : null;
                $insertTest->execute([
                    $sheet['courseSlug'], $sheet['tier'], $t['sNo'], $t['testName'],
                    $t['pwDate'] ?: null, $examDate, $t['testNumber'] ?: null, $t['testType'] ?: null,
                    $t['testPattern'] ?: null, $t['mode'] ?: null, json_encode($t['subjects'] ?: new \stdClass()),
                    $t['note'] ?: null, $weight,
                ]);
            }
            $tierCounts[$sheet['courseSlug']][$sheet['tier']] = $total;
        }

        // ---- Packages: one per (course, plan), inactive until priced ------
        $insertPackage = $pdo->prepare("
            INSERT INTO packages (
                courseSlug, name, duration, durationLabel, durationMonths, price, originalPrice,
                discountPercent, tests, recommended, tagline, features, benefits, includes, status, tier
            )
            SELECT ?::varchar, ?::varchar, '1Y', 'Session 2026-27', 12, 0, NULL, 0, ?::int, ?::boolean, ?::varchar,
                   ?::jsonb, ?::jsonb, ?::jsonb, 'inactive', ?::varchar
            WHERE NOT EXISTS (SELECT 1 FROM packages WHERE courseSlug = ?::varchar AND tier = ?::varchar)
        ");
        $updateCourseTests = $pdo->prepare("UPDATE courses SET totalTests = ? WHERE slug = ?");

        $tiers = [
            'Basic' => 'Essential test series.',
            'Pro' => 'More tests for steady, deeper practice.',
            'Pro Max' => 'The complete test series, including exclusive extra tests.',
        ];
        foreach ($catalogue as $c) {
            $max = 0;
            foreach ($tiers as $tier => $tagline) {
                $count = $tierCounts[$c['slug']][$tier] ?? 0;
                $max = max($max, $count);
                $features = $count > 0
                    ? [
                        "{$count} tests as per the published schedule",
                        'Chapter-wise coverage published for every test',
                        'Answer key after every test',
                        'Detailed performance analytics',
                    ]
                    : ['Test calendar to be announced', 'Answer key after every test', 'Detailed performance analytics'];
                $benefits = [
                    'A fixed calendar - you always know what is being tested and when',
                    'Instant clarity on strong and weak chapters after each test',
                    'Only the tests still to come are included when you join mid-session',
                ];
                $includes = [
                    'examAccess' => true, 'analytics' => true, 'answerKey' => true,
                    'doubtSupport' => false, 'mentorship' => false, 'printedMaterial' => false,
                ];
                $insertPackage->execute([
                    $c['slug'], "{$c['name']} — {$tier}", $count, $tier === 'Pro' ? 'true' : 'false',
                    $tagline, json_encode($features), json_encode($benefits), json_encode($includes), $tier,
                    $c['slug'], $tier,
                ]);
            }
            $updateCourseTests->execute([$max, $c['slug']]);
        }
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("
            DELETE FROM packages WHERE tier IS NOT NULL;
            DROP TABLE IF EXISTS test_schedules;
            ALTER TABLE packages DROP COLUMN IF EXISTS tier;
            UPDATE courses SET status = 'active' WHERE slug IN ('class-11', 'class-12', 'devoter', 'jee', 'neet');
        ");
    },
];
