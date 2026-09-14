<?php

/**
 * PHPUnit Bootstrap File
 *
 * Initializes test environment and autoloader.
 */

// Load Composer autoloader
require __DIR__ . '/../vendor/autoload.php';

// Load environment variables for testing
$dotenv = \Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

// Set testing environment
$_ENV['APP_ENV'] = 'testing';
$_ENV['LOG_LEVEL'] = 'critical'; // Suppress logs during tests
