.PHONY: help install serve test lint format stan migrate seed fresh docker-build docker-up docker-down docker-logs

help:
	@echo "Nirvona Backend - Development Commands"
	@echo "======================================"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make install          - Install PHP dependencies via Composer"
	@echo "  make migrate          - Run database migrations"
	@echo "  make seed             - Seed database with test data"
	@echo ""
	@echo "Development:"
	@echo "  make serve            - Start local development server (localhost:8000)"
	@echo "  make serve-docker     - Start development server in Docker"
	@echo ""
	@echo "Testing & Quality:"
	@echo "  make test             - Run PHPUnit tests"
	@echo "  make test-unit        - Run only unit tests"
	@echo "  make test-feature     - Run only feature tests"
	@echo "  make test-coverage    - Run tests with code coverage"
	@echo "  make lint             - Run PHP linter"
	@echo "  make stan             - Run PHPStan static analysis"
	@echo "  make cs               - Run PHP CodeSniffer"
	@echo "  make format           - Format code with PHP-CS-Fixer"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build     - Build Docker images"
	@echo "  make docker-up        - Start Docker containers"
	@echo "  make docker-down      - Stop Docker containers"
	@echo "  make docker-logs      - View Docker container logs"
	@echo "  make docker-shell     - Enter PHP container shell"
	@echo ""
	@echo "Database:"
	@echo "  make fresh            - Reset database (migrate + seed)"
	@echo ""

install:
	composer install

serve:
	php -S localhost:8000 -t public/

serve-docker:
	docker-compose up

test:
	vendor/bin/phpunit

test-unit:
	vendor/bin/phpunit --testsuite="Unit Tests"

test-feature:
	vendor/bin/phpunit --testsuite="Feature Tests"

test-coverage:
	vendor/bin/phpunit --coverage-html=coverage/

lint:
	php -l app/
	php -l routes/

stan:
	vendor/bin/phpstan analyse app --level=8

cs:
	vendor/bin/phpcs app --standard=PSR12

format:
	vendor/bin/phpcbf app --standard=PSR12

migrate:
	php -r "echo 'Migration command not yet implemented - see database/migrations/';";

seed:
	php -r "echo 'Seeding command not yet implemented';";

fresh: migrate seed
	@echo "Database reset complete!"

docker-build:
	docker-compose build

docker-up:
	docker-compose up -d
	@echo "Waiting for services to be healthy..."
	@sleep 5
	@echo "Services started. Access at http://localhost:8000/api/health"

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f app

docker-shell:
	docker-compose exec app sh

clean:
	rm -rf storage/logs/*
	rm -rf storage/cache/*
	rm -rf .phpunit.result.cache
	@echo "Cache cleaned!"
