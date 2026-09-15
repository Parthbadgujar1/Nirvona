<?php

namespace Nirvona\Services;

use Nirvona\Repositories\AdmitCardRepository;
use Nirvona\Repositories\ExamCandidateRepository;
use Nirvona\Repositories\ExamRepository;
use Nirvona\Exceptions\ServiceException;

/**
 * AdmitCardService
 *
 * Handles admit card generation & publishing with error isolation.
 */
class AdmitCardService extends BaseService
{
    private AdmitCardRepository $admitCardRepository;
    private ExamCandidateRepository $examCandidateRepository;
    private ExamRepository $examRepository;

    public function __construct(
        AdmitCardRepository $admitCardRepository,
        ExamCandidateRepository $examCandidateRepository,
        ExamRepository $examRepository,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->admitCardRepository = $admitCardRepository;
        $this->examCandidateRepository = $examCandidateRepository;
        $this->examRepository = $examRepository;
    }

    /**
     * List admit cards for an exam
     *
     * @param string $examId
     * @return array
     */
    public function getByExam(string $examId): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->admitCardRepository->getByExam($examId)],
            ['success' => true, 'data' => []],
            'getAdmitCardsByExam'
        );
    }

    /**
     * Get a student's admit cards
     *
     * @param string $studentId
     * @return array
     */
    public function getByStudent(string $studentId): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->admitCardRepository->getByStudent($studentId)],
            ['success' => true, 'data' => []],
            'getAdmitCardsByStudent'
        );
    }

    /**
     * Get a student's single most relevant admit card (most recently
     * generated) - the frontend's "current admit card" widget expects one
     * object, not a list.
     *
     * @param string $studentId
     * @return array
     */
    public function getLatestForStudent(string $studentId): array
    {
        return $this->executeWithFallback(
            function () use ($studentId) {
                $cards = $this->admitCardRepository->getByStudent($studentId);
                $latest = $cards[0] ?? null;

                if (!$latest) {
                    throw new ServiceException("No admit card found for this student", 'AdmitCardService', false);
                }

                return ['success' => true, 'data' => $latest];
            },
            ['success' => false, 'error' => 'No admit card found'],
            'getLatestAdmitCardForStudent'
        );
    }

    /**
     * Generate an admit card for a student's exam candidacy
     *
     * @param array $data studentId, examId, rollNumber, seatNo
     * @return array
     */
    public function generate(array $data): array
    {
        return $this->executeWithFallback(
            function () use ($data) {
                $errors = $this->validate($data, [
                    'studentId' => ['required'],
                    'examId' => ['required'],
                ]);

                if (!empty($errors)) {
                    throw new ServiceException(
                        "Validation failed: " . json_encode($errors),
                        'AdmitCardService',
                        false
                    );
                }

                $existing = $this->admitCardRepository->findByStudentAndExam($data['studentId'], $data['examId']);
                if ($existing) {
                    $this->admitCardRepository->markGenerated($existing['id']);
                    $this->examRepository->syncAdmitCardsGenerated($data['examId']);
                    return [
                        'success' => true,
                        'data' => $this->admitCardRepository->getById($existing['id']),
                        'message' => 'Admit card regenerated',
                    ];
                }

                $admitCard = $this->admitCardRepository->create([
                    'studentId' => $data['studentId'],
                    'examId' => $data['examId'],
                    'rollNumber' => $data['rollNumber'] ?? null,
                    'seatNo' => $data['seatNo'] ?? null,
                    'status' => 'generated',
                    'generatedAt' => date('Y-m-d H:i:s'),
                ]);
                $this->examRepository->syncAdmitCardsGenerated($data['examId']);

                $this->auditLog('GENERATE', 'AdmitCard', $admitCard['id'], [
                    'studentId' => $data['studentId'],
                    'examId' => $data['examId'],
                ]);

                return ['success' => true, 'data' => $admitCard, 'message' => 'Admit card generated successfully'];
            },
            null,
            'generateAdmitCard'
        );
    }

    /**
     * Publish an admit card to the student
     *
     * @param string $id
     * @return array
     */
    public function publish(string $id): array
    {
        return $this->executeWithFallback(
            function () use ($id) {
                $card = $this->admitCardRepository->getById($id);
                if (!$card) {
                    throw new ServiceException("Admit card not found: {$id}", 'AdmitCardService', false);
                }

                $this->admitCardRepository->markPublished($id);
                $this->auditLog('PUBLISH', 'AdmitCard', $id, []);

                return ['success' => true, 'message' => 'Admit card published successfully'];
            },
            null,
            'publishAdmitCard'
        );
    }

    /**
     * Revoke an admit card (e.g. a candidate withdraws, or a seating/
     * centre error needs correcting before regenerating). UNIQUE(studentId,
     * examId) means the row stays and is marked revoked rather than
     * deleted, the same reasoning as ExamCredentialService::revoke().
     *
     * @param string $id
     * @return array
     */
    public function revoke(string $id): array
    {
        return $this->executeWithFallback(
            function () use ($id) {
                if (!$this->admitCardRepository->getById($id)) {
                    throw new ServiceException("Admit card not found: {$id}", 'AdmitCardService', false);
                }

                $this->admitCardRepository->update($id, ['status' => 'revoked']);
                $this->auditLog('REVOKE', 'AdmitCard', $id, []);

                return ['success' => true, 'message' => 'Admit card revoked successfully'];
            },
            null,
            'revokeAdmitCard'
        );
    }

    /**
     * Generate an admit card for every candidate registered for an
     * exam who doesn't already have one - the admin "Generate Admit
     * Cards" bulk action operates on the whole exam roster, not one
     * student at a time.
     *
     * @param string $examId
     * @return array
     */
    public function generateForExam(string $examId): array
    {
        return $this->executeWithFallback(
            function () use ($examId) {
                $candidates = $this->examCandidateRepository->getByExam($examId);
                $generated = 0;
                $alreadyExisted = 0;
                // exam_candidates has no rollNumber column (only seatNo,
                // assigned separately at registration) - allocate one
                // here, sequential per exam, since a real admit card
                // needs one to be usable.
                $rollPrefix = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $examId), 0, 6));
                $sequence = $this->admitCardRepository->countGeneratedByExam($examId);

                foreach ($candidates as $candidate) {
                    $existing = $this->admitCardRepository->findByStudentAndExam($candidate['studentId'], $examId);
                    if ($existing) {
                        $alreadyExisted++;
                        continue;
                    }

                    $sequence++;
                    $this->admitCardRepository->create([
                        'studentId' => $candidate['studentId'],
                        'examId' => $examId,
                        'rollNumber' => $rollPrefix . '-' . str_pad((string) $sequence, 4, '0', STR_PAD_LEFT),
                        'seatNo' => $candidate['seatNo'] ?? null,
                        'status' => 'generated',
                        'generatedAt' => date('Y-m-d H:i:s'),
                    ]);
                    $generated++;
                }

                // Always resync, even if every candidate already had a
                // card - cheap (one COUNT query) and guarantees the
                // counter can never drift from the real admit_cards rows.
                $this->examRepository->syncAdmitCardsGenerated($examId);

                $this->auditLog('GENERATE_BULK', 'AdmitCard', $examId, [
                    'generated' => $generated,
                    'alreadyExisted' => $alreadyExisted,
                    'totalCandidates' => count($candidates),
                ]);

                return [
                    'success' => true,
                    'data' => [
                        'generated' => $generated,
                        'alreadyExisted' => $alreadyExisted,
                        'totalCandidates' => count($candidates),
                    ],
                    'message' => "{$generated} admit card(s) generated",
                ];
            },
            ['success' => false, 'message' => 'Unable to generate admit cards for this exam'],
            'generateAdmitCardsForExam'
        );
    }

    /**
     * Publish every generated (not-yet-published) admit card for an
     * exam in one go - the admin "Publish" bulk action.
     *
     * @param string $examId
     * @return array
     */
    public function publishForExam(string $examId): array
    {
        return $this->executeWithFallback(
            function () use ($examId) {
                $cards = $this->admitCardRepository->getByExam($examId);
                $published = 0;

                foreach ($cards as $card) {
                    if ($card['status'] === 'generated') {
                        $this->admitCardRepository->markPublished($card['id']);
                        $published++;
                    }
                }

                $this->auditLog('PUBLISH_BULK', 'AdmitCard', $examId, ['published' => $published]);

                return [
                    'success' => true,
                    'data' => ['published' => $published],
                    'message' => "{$published} admit card(s) published",
                ];
            },
            ['success' => false, 'message' => 'Unable to publish admit cards for this exam'],
            'publishAdmitCardsForExam'
        );
    }
}
