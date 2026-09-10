<?php

namespace Nirvona\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Nirvona\Services\StudentService;
use Nirvona\Repositories\StudentRepository;
use Psr\Log\LoggerInterface;
use Nirvona\Services\CircuitBreaker;

/**
 * StudentServiceTest
 *
 * Unit tests for StudentService with error isolation.
 */
class StudentServiceTest extends TestCase
{
    private StudentService $studentService;
    private StudentRepository $studentRepository;
    private LoggerInterface $logger;
    private CircuitBreaker $circuitBreaker;

    protected function setUp(): void
    {
        // Mock dependencies
        $this->studentRepository = $this->createMock(StudentRepository::class);
        $this->logger = $this->createMock(LoggerInterface::class);
        $this->circuitBreaker = $this->createMock(CircuitBreaker::class);

        $this->studentService = new StudentService(
            $this->studentRepository,
            $this->logger,
            $this->circuitBreaker
        );
    }

    public function testRegisterStudentSuccess()
    {
        $data = [
            'fullName' => 'John Doe',
            'email' => 'john@example.com',
            'mobile' => '9876543210',
            'className' => 'Class 12',
            'school' => 'ABC School',
            'city' => 'Mumbai',
            'state' => 'Maharashtra',
        ];

        $createdStudent = $data + [
            'id' => 'stud_123',
            'status' => 'active',
            'enrolledAt' => date('Y-m-d H:i:s'),
        ];

        $this->studentRepository
            ->expects($this->once())
            ->method('findByEmail')
            ->with($data['email'])
            ->willReturn(null);

        $this->studentRepository
            ->expects($this->once())
            ->method('create')
            ->willReturn($createdStudent);

        $result = $this->studentService->registerStudent($data);

        $this->assertTrue($result['success']);
        $this->assertNotNull($result['data']['id']);
        $this->assertEquals('John Doe', $result['data']['fullName']);
    }

    public function testRegisterStudentValidationError()
    {
        $data = [
            'fullName' => 'John Doe',
            // Missing required fields
        ];

        $result = $this->studentService->registerStudent($data);

        $this->assertFalse($result['success']);
        $this->assertArrayHasKey('error', $result);
    }

    public function testGetStudentSuccess()
    {
        $studentId = 'stud_123';
        $student = [
            'id' => $studentId,
            'fullName' => 'John Doe',
            'email' => 'john@example.com',
        ];

        $this->studentRepository
            ->expects($this->once())
            ->method('getById')
            ->with($studentId)
            ->willReturn($student);

        $result = $this->studentService->getStudent($studentId);

        $this->assertTrue($result['success']);
        $this->assertEquals($student, $result['data']);
    }

    public function testGetStudentNotFound()
    {
        $studentId = 'invalid_id';

        $this->studentRepository
            ->expects($this->once())
            ->method('getById')
            ->with($studentId)
            ->willReturn(null);

        $result = $this->studentService->getStudent($studentId);

        $this->assertFalse($result['success']);
    }

    public function testErrorIsolation()
    {
        // Test that exception in repository is caught and fallback is returned
        $this->studentRepository
            ->expects($this->once())
            ->method('getById')
            ->willThrowException(new \RuntimeException("Database error"));

        $result = $this->studentService->getStudent('any_id');

        // Service returns fallback instead of throwing exception
        $this->assertFalse($result['success']);
        $this->assertArrayHasKey('error', $result);
    }
}
