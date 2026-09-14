<?php

/**
 * Migration: Seed courses & packages catalogue
 *
 * Root cause of "packages page renders almost nothing / most programs
 * have no packages to open": only one row ever existed in the real
 * `packages` table (a single JEE 1-year plan, itself missing
 * durationLabel/tagline/features/benefits/includes) and only one row
 * existed in `courses` (jee) - so every other program tab on
 * /packages (Class 11, Class 12, Devoter, NEET) filtered down to an
 * empty grid, and even the one package that did render showed blank
 * duration/features/benefits sections.
 *
 * This backfills the real catalogue to match what the frontend's mock
 * data (src/data/courses.ts, src/data/packages.ts) has always
 * described - same pricing formulas, same duration tiers, same
 * feature/benefit copy - so the real backend finally has real
 * inventory for every course instead of just one row.
 *
 * Idempotent: courses are upserted by slug; the one pre-existing
 * package (11111111-1111-1111-1111-111111111111, already referenced
 * by real payments/enrollments made against it during testing) is
 * updated in place rather than replaced, and every other
 * (courseSlug, duration) combination is inserted only if missing.
 */
return [
    'up' => function (\PDO $pdo) {
        $courses = [
            ['class-11', 'Class 11 Foundation', 'Class 11', 'Build the base that carries you through Class 12 and beyond.', 24, 48],
            ['class-12', 'Class 12 Accelerator', 'Class 12', 'Board precision and competitive speed, tested in the same paper.', 12, 32],
            ['devoter', 'Devoter Program', 'Devoter', 'Scripture, philosophy and reasoning — examined with modern rigour.', 12, 24],
            ['jee', 'JEE Advantage', 'JEE', 'Main and Advanced patterns, tested at national scale.', 24, 60],
            ['neet', 'NEET Advantage', 'NEET', '720 marks. 200 minutes. Rehearsed until it is routine.', 24, 56],
        ];

        $upsertCourse = $pdo->prepare("
            INSERT INTO courses (slug, name, shortName, tagline, maxDurationMonths, totalTests, status)
            VALUES (?, ?, ?, ?, ?, ?, 'active')
            ON CONFLICT (slug) DO UPDATE SET
                name = EXCLUDED.name,
                shortName = EXCLUDED.shortName,
                tagline = EXCLUDED.tagline,
                maxDurationMonths = EXCLUDED.maxDurationMonths,
                totalTests = EXCLUDED.totalTests,
                status = 'active'
        ");
        foreach ($courses as $c) {
            $upsertCourse->execute($c);
        }

        // Mirrors DURATION_META / MAX_DURATION / blueprints() in
        // src/data/packages.ts exactly, so real prices/features match
        // what the site has always advertised.
        $maxDuration = ['class-11' => 24, 'class-12' => 12, 'devoter' => 12, 'jee' => 24, 'neet' => 24];
        $testsPerYear = ['class-11' => 24, 'class-12' => 32, 'devoter' => 24, 'jee' => 30, 'neet' => 28];
        $courseNames = [
            'class-11' => 'Class 11 Foundation',
            'class-12' => 'Class 12 Accelerator',
            'devoter' => 'Devoter Program',
            'jee' => 'JEE Advantage',
            'neet' => 'NEET Advantage',
        ];
        $priceTable = ['class-11' => 2999, 'class-12' => 3499, 'devoter' => 2499, 'jee' => 4499, 'neet' => 4499];
        $durationMeta = [
            '3M' => ['label' => '3 Months', 'months' => 3],
            '6M' => ['label' => '6 Months', 'months' => 6],
            '1Y' => ['label' => '1 Year', 'months' => 12],
            '2Y' => ['label' => '2 Years', 'months' => 24],
        ];
        $includesBase = ['examAccess' => true, 'analytics' => true, 'answerKey' => true, 'doubtSupport' => false, 'mentorship' => false, 'printedMaterial' => false];

        $insertPackage = $pdo->prepare("
            INSERT INTO packages (
                courseSlug, name, duration, durationLabel, durationMonths, price, originalPrice,
                discountPercent, tests, recommended, tagline, features, benefits, includes, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        ");

        $existing = $pdo->query("SELECT courseSlug, duration FROM packages")->fetchAll(\PDO::FETCH_ASSOC);
        $existingKeys = array_map(fn($r) => $r['courseslug'] . '|' . $r['duration'], $existing);

        foreach (array_keys($maxDuration) as $course) {
            $q = $priceTable[$course];
            $tpy = $testsPerYear[$course];

            $blueprints = [
                [
                    'duration' => '3M',
                    'price' => $q,
                    'originalPrice' => (int) round($q * 1.34),
                    'tests' => (int) round($tpy / 4),
                    'tagline' => 'Try the full Nirvona examination system for a quarter.',
                    'includes' => $includesBase,
                    'recommended' => false,
                    'features' => [
                        round($tpy / 4) . ' CBT examinations',
                        'Full performance analytics',
                        'Answer key after every exam',
                        'All-India rank & percentile',
                    ],
                    'benefits' => [
                        'Experience the real CBT interface before committing long term',
                        'Get a baseline diagnostic of your current standing',
                        'Ideal for students joining mid-session',
                    ],
                ],
                [
                    'duration' => '6M',
                    'price' => (int) round($q * 1.75),
                    'originalPrice' => (int) round($q * 2.4),
                    'tests' => (int) round($tpy / 2),
                    'tagline' => 'A half-session runway with doubt support included.',
                    'includes' => array_merge($includesBase, ['doubtSupport' => true]),
                    'recommended' => false,
                    'features' => [
                        round($tpy / 2) . ' CBT examinations',
                        'Full performance analytics',
                        'Topic-level weakness reports',
                        'Doubt support (48h response)',
                        'All-India rank & percentile',
                    ],
                    'benefits' => [
                        'Enough tests to establish a measurable improvement trend',
                        'Doubt resolution on every incorrect response',
                        'Priority seat allocation at your preferred exam centre',
                    ],
                ],
                [
                    'duration' => '1Y',
                    'price' => (int) round($q * 3),
                    'originalPrice' => (int) round($q * 4.6),
                    'tests' => $tpy,
                    'tagline' => 'The complete academic session. Our most chosen package.',
                    'includes' => array_merge($includesBase, ['doubtSupport' => true, 'mentorship' => true]),
                    'recommended' => true,
                    'features' => [
                        $tpy . ' CBT examinations',
                        'Advanced analytics with trend tracking',
                        'Topic & chapter priority ranking',
                        'Doubt support (24h response)',
                        '1:1 mentor review every quarter',
                        'All-India rank & percentile',
                    ],
                    'benefits' => [
                        'Full-session coverage with no syllabus gaps',
                        'Quarterly mentor calls to reset your strategy',
                        'Complete score, rank and percentile history',
                        'Best value per examination',
                    ],
                ],
            ];

            if ($maxDuration[$course] === 24) {
                $blueprints[] = [
                    'duration' => '2Y',
                    'price' => (int) round($q * 5.2),
                    'originalPrice' => (int) round($q * 8.4),
                    'tests' => $tpy * 2,
                    'tagline' => 'Two full sessions — start in Class 11, finish exam-ready.',
                    'includes' => array_merge($includesBase, ['doubtSupport' => true, 'mentorship' => true, 'printedMaterial' => true]),
                    'recommended' => false,
                    'features' => [
                        ($tpy * 2) . ' CBT examinations',
                        'Two-year longitudinal analytics',
                        'Doubt support (12h priority response)',
                        'Monthly 1:1 mentor review',
                        'Printed revision compendium',
                        'Guaranteed centre allocation',
                    ],
                    'benefits' => [
                        'Uninterrupted two-year preparation with a single enrolment',
                        'Year-on-year improvement tracking across both sessions',
                        'Lowest effective cost per examination',
                        'Priority support and centre selection',
                    ],
                ];
            }

            foreach ($blueprints as $bp) {
                $meta = $durationMeta[$bp['duration']];
                $discountPercent = $bp['originalPrice']
                    ? (int) round((($bp['originalPrice'] - $bp['price']) / $bp['originalPrice']) * 100)
                    : 0;
                $name = "{$courseNames[$course]} — {$meta['label']}";

                if (in_array($course . '|' . $bp['duration'], $existingKeys, true)) {
                    // The one pre-existing row (real JEE 1Y package,
                    // already referenced by test payments/enrollments)
                    // - fill in only what it was missing, keep its real
                    // id, price and test count untouched.
                    $stmt = $pdo->prepare("
                        UPDATE packages SET
                            durationLabel = COALESCE(durationLabel, ?),
                            tagline = COALESCE(tagline, ?),
                            features = CASE WHEN features = '[]' THEN ? ELSE features END,
                            benefits = CASE WHEN benefits = '[]' THEN ? ELSE benefits END,
                            includes = CASE WHEN includes = '{}' OR includes = '[]' THEN ? ELSE includes END
                        WHERE courseSlug = ? AND duration = ?
                    ");
                    $stmt->execute([
                        $meta['label'],
                        $bp['tagline'],
                        json_encode($bp['features']),
                        json_encode($bp['benefits']),
                        json_encode($bp['includes']),
                        $course,
                        $bp['duration'],
                    ]);
                    continue;
                }

                $insertPackage->execute([
                    $course,
                    $name,
                    $bp['duration'],
                    $meta['label'],
                    $meta['months'],
                    $bp['price'],
                    $bp['originalPrice'],
                    $discountPercent,
                    $bp['tests'],
                    $bp['recommended'] ? 't' : 'f',
                    $bp['tagline'],
                    json_encode($bp['features']),
                    json_encode($bp['benefits']),
                    json_encode($bp['includes']),
                ]);
            }
        }
    },

    'down' => function (\PDO $pdo) {
        // Not reversible in a meaningful way without risking dropping
        // real payment/enrollment history tied to seeded package ids -
        // intentionally a no-op.
    },
];
