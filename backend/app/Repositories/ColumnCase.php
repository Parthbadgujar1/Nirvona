<?php

namespace Nirvona\Repositories;

/**
 * ColumnCase
 *
 * Every migration in this project defines columns as unquoted camelCase
 * (`fullName`, `courseSlug`, `createdAt`, ...). PostgreSQL silently
 * folds every unquoted identifier to lowercase, so those columns are
 * actually stored as `fullname`, `courseslug`, `createdat`. Writes
 * happen to work anyway (an unquoted `fullName` in an INSERT/UPDATE
 * column list folds to `fullname` and still matches), but every read -
 * `SELECT *`, `RETURNING *` - hands back the column names as actually
 * stored: lowercase. Every Model, Service, and Controller in this app
 * (and the frontend's TypeScript contract) expects camelCase.
 *
 * Concretely, this was also a live security bug: `unset($row['passwordHash'])`
 * calls throughout the auth/credential repositories silently did
 * nothing (the real key was `passwordhash`), so every "created" student/
 * admin/credential response leaked its password hash to the client.
 *
 * The correct long-term fix is to quote every camelCase identifier in
 * every migration and every repository's SQL - a much larger, riskier
 * change across dozens of already-written (and already-deployed
 * against a live database) queries. This is the pragmatic alternative:
 * normalize every row's keys back to camelCase in one place
 * (BaseRepository's row-returning methods), so nothing else has to
 * change. New columns need an entry added here.
 */
class ColumnCase
{
    /** @var array<string, string> lowercase (as Postgres stores it) => camelCase */
    private const MAP = [
        // students
        'fullname' => 'fullName',
        'dateofbirth' => 'dateOfBirth',
        'classname' => 'className',
        'enrolledat' => 'enrolledAt',
        'avatarurl' => 'avatarUrl',
        'guardianname' => 'guardianName',
        'guardianmobile' => 'guardianMobile',
        'passwordhash' => 'passwordHash',
        'notificationprefs' => 'notificationPrefs',

        // exams
        'courseslug' => 'courseSlug',
        'reportingtime' => 'reportingTime',
        'examtime' => 'examTime',
        'durationminutes' => 'durationMinutes',
        'totalquestions' => 'totalQuestions',
        'totalmarks' => 'totalMarks',
        'centreid' => 'centreId',
        'admitcardsgenerated' => 'admitCardsGenerated',
        'credentialsassigned' => 'credentialsAssigned',
        'syllabusscope' => 'syllabusScope',

        // payments / enrollments
        'studentid' => 'studentId',
        'packageid' => 'packageId',
        'retrycount' => 'retryCount',
        'transactionid' => 'transactionId',
        'paymentid' => 'paymentId',
        'razorpayorderid' => 'razorpayOrderId',
        'razorpaysignature' => 'razorpaySignature',
        'startdate' => 'startDate',
        'enddate' => 'endDate',
        'teststaken' => 'testsTaken',
        'teststotal' => 'testsTotal',

        // results
        'examid' => 'examId',
        'examname' => 'examName',
        'maxscore' => 'maxScore',
        'totalcandidates' => 'totalCandidates',
        'timetakenmin' => 'timeTakenMin',
        'topperformerscore' => 'topPerformerScore',
        'averagescore' => 'averageScore',

        // courses / packages / subjects / topics / syllabus
        'shortname' => 'shortName',
        'maxdurationmonths' => 'maxDurationMonths',
        'totaltests' => 'totalTests',
        'exampattern' => 'examPattern',
        'patternnotes' => 'patternNotes',
        'orderindex' => 'orderIndex',
        'unittitle' => 'unitTitle',
        'subjectid' => 'subjectId',
        'durationlabel' => 'durationLabel',
        'durationmonths' => 'durationMonths',
        'originalprice' => 'originalPrice',
        'discountpercent' => 'discountPercent',

        // exam centres / candidates / admit cards / credentials
        'pincode' => 'pincode',
        'studentname' => 'studentName',
        'seatno' => 'seatNo',
        'admitcardstatus' => 'admitCardStatus',
        'credentialstatus' => 'credentialStatus',
        'rollnumber' => 'rollNumber',
        'generatedat' => 'generatedAt',
        'publishedat' => 'publishedAt',
        'loginid' => 'loginId',
        'assignedat' => 'assignedAt',

        // questions / answer keys / responses
        'qno' => 'qNo',
        'optiona' => 'optionA',
        'optionb' => 'optionB',
        'optionc' => 'optionC',
        'optiond' => 'optionD',
        'correctoption' => 'correctOption',
        'negativemarks' => 'negativeMarks',
        'questiontext' => 'questionText',
        'totalquestions' => 'totalQuestions',
        'uploadedat' => 'uploadedAt',

        // result analysis / topic performance / leaderboards
        'scoretrend' => 'scoreTrend',
        'ranktrend' => 'rankTrend',
        'accuracytrend' => 'accuracyTrend',
        'subjectcomparison' => 'subjectComparison',
        'timedistribution' => 'timeDistribution',
        'improvementpercent' => 'improvementPercent',
        'avgpercentage' => 'avgPercentage',
        'totalexams' => 'totalExams',
        'bestrank' => 'bestRank',

        // query-time aliases (not real columns, but folded the same way -
        // e.g. ResultRepository::getPerformanceAnalytics(), ExamRepository::getWithDetails())
        'bestscore' => 'bestScore',
        'worstscore' => 'worstScore',
        'avgaccuracy' => 'avgAccuracy',
        'examdate' => 'examDate',
        'packagename' => 'packageName',
        'coursename' => 'courseName',
        'centrename' => 'centreName',
        'centreaddress' => 'centreAddress',
        'candidatecount' => 'candidateCount',
        'totalrevenue' => 'totalRevenue',
        'averagetransaction' => 'averageTransaction',

        // notifications
        'recipientcount' => 'recipientCount',
        'notificationid' => 'notificationId',
        'isread' => 'isRead',
        'readat' => 'readAt',

        // common to every table
        'createdat' => 'createdAt',
        'updatedat' => 'updatedAt',
    ];

    /**
     * DECIMAL/NUMERIC columns (see every migration's `DECIMAL(p,s)`
     * definitions) - PDO_PGSQL always returns these as strings
     * ("17700.00"), never native PHP floats/ints, because Postgres's
     * wire protocol represents them as text. Every Model/Service and
     * the frontend's TypeScript types declare these as `number`.
     * Silently working with the strings mostly "works" (string
     * concatenation instead of addition rarely throws), which is
     * exactly why it went unnoticed - `payments-view.tsx` summed a
     * column of "17700.00" strings with `+` and rendered "₹NaN" as the
     * total once concatenation produced a non-numeric string.
     *
     * Keyed by the camelCase name (this list is checked after
     * {@see normalize()} has already renamed the row's keys).
     *
     * @var array<string, true>
     */
    private const NUMERIC_FIELDS = [
        // payments
        'amount' => true, 'discount' => true, 'tax' => true, 'total' => true,
        // packages
        'price' => true, 'originalPrice' => true,
        // results / leaderboards / topic performance
        'score' => true, 'maxScore' => true, 'percentage' => true, 'percentile' => true,
        'accuracy' => true, 'topPerformerScore' => true, 'averageScore' => true,
        'avgPercentage' => true, 'trend' => true, 'improvementPercent' => true,
        // questions
        'marks' => true, 'negativeMarks' => true,
        // query-time SUM/AVG aggregate aliases (PaymentRepository::getStats/
        // getMonthlyRevenue/getTotalRevenue) - PDO stringifies these exactly
        // like a stored DECIMAL column
        'revenue' => true, 'totalRevenue' => true, 'averageTransaction' => true,
        // query-time COUNT() aliases - PDO_PGSQL always stringifies bigint
        // results too, same failure mode as a DECIMAL column (e.g. summing
        // a column of these with `+` silently concatenates instead)
        'students' => true, 'candidateCount' => true,
    ];

    /**
     * Normalize one row's keys from Postgres-folded-lowercase to the
     * camelCase every Model/Service/Controller/frontend expects, and
     * cast known DECIMAL/NUMERIC columns from PDO's string
     * representation back to a real PHP float. Unknown keys pass
     * through unchanged.
     *
     * @param array $row
     * @return array
     */
    public static function normalize(array $row): array
    {
        $normalized = [];
        foreach ($row as $key => $value) {
            $mappedKey = self::MAP[$key] ?? $key;
            if ($value !== null && isset(self::NUMERIC_FIELDS[$mappedKey])) {
                $value = (float) $value;
            }
            $normalized[$mappedKey] = $value;
        }
        return $normalized;
    }

    /**
     * Normalize every row in a result set
     *
     * @param array $rows
     * @return array
     */
    public static function normalizeAll(array $rows): array
    {
        return array_map([self::class, 'normalize'], $rows);
    }
}
