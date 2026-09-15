<?php

namespace Nirvona\Repositories;

/**
 * ActivityRepository
 *
 * Powers the admin dashboard's "Recent activity" feed. There's no
 * dedicated audit-log table (building and threading one through every
 * write in the app is a much bigger undertaking than this dashboard
 * needs), so this synthesizes a real, live feed from the `createdAt`/
 * `updatedAt` timestamps every table already has: new registrations,
 * successful purchases, and newly-published results, merged and
 * ordered by recency. `/api/admin/activity` returned a 404 before this
 * existed - the frontend called it, nothing on the backend answered it.
 */
class ActivityRepository extends BaseRepository
{
    protected string $table = 'students';

    /**
     * @param int $limit
     * @return array Rows: {id, actor, action, target, type, at}
     */
    public function getRecent(int $limit = 20): array
    {
        return $this->select(
            "SELECT * FROM (
                (SELECT s.id::text as id, s.fullName as actor, 'registered' as action,
                        'as a new student' as target, 'student' as type, s.createdAt as at
                 FROM students s
                 ORDER BY s.createdAt DESC
                 LIMIT ?)
                UNION ALL
                (SELECT p.id::text as id, s.fullName as actor, 'purchased' as action,
                        COALESCE(pk.name, p.courseSlug, 'a package') as target,
                        'purchase' as type, p.createdAt as at
                 FROM payments p
                 JOIN students s ON s.id = p.studentId
                 LEFT JOIN packages pk ON pk.id = p.packageId
                 WHERE p.status = 'successful'
                 ORDER BY p.createdAt DESC
                 LIMIT ?)
                UNION ALL
                (SELECT r.id::text as id, s.fullName as actor, 'received a result for' as action,
                        r.examName as target, 'result' as type, r.updatedAt as at
                 FROM results r
                 JOIN students s ON s.id = r.studentId
                 WHERE r.status = 'published'
                 ORDER BY r.updatedAt DESC
                 LIMIT ?)
                UNION ALL
                (SELECT ac.id::text as id, s.fullName as actor, 'was issued an admit card for' as action,
                        e.name as target, 'admit-card' as type, ac.generatedAt as at
                 FROM admit_cards ac
                 JOIN students s ON s.id = ac.studentId
                 JOIN exams e ON e.id = ac.examId
                 WHERE ac.status != 'pending'
                 ORDER BY ac.generatedAt DESC
                 LIMIT ?)
             ) combined
             ORDER BY at DESC
             LIMIT ?",
            [$limit, $limit, $limit, $limit, $limit]
        );
    }
}
