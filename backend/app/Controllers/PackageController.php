<?php

namespace Nirvona\Controllers;

use Nirvona\Services\PackageService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * PackageController
 *
 * Handles HTTP requests for subscription/test-series packages.
 */
class PackageController
{
    private PackageService $packageService;

    public function __construct(PackageService $packageService)
    {
        $this->packageService = $packageService;
    }

    /**
     * GET /api/packages/{id}
     */
    public function get(Request $request, Response $response, array $args): Response
    {
        $result = $this->packageService->getPackage($args['id']);
        $statusCode = $result['success'] ? 200 : 404;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/packages
     */
    public function list(Request $request, Response $response): Response
    {
        $result = $this->packageService->listAll();
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
