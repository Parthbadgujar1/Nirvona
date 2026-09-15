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

    /**
     * GET /api/admin/packages
     */
    public function listForAdmin(Request $request, Response $response): Response
    {
        $result = $this->packageService->listAllForAdmin();
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/packages
     */
    public function create(Request $request, Response $response): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $result = $this->packageService->create($data);
        $statusCode = $result['success'] ? 201 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * PUT /api/admin/packages/{id}
     */
    public function update(Request $request, Response $response, array $args): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $result = $this->packageService->update($args['id'], $data);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * DELETE /api/admin/packages/{id}
     */
    public function delete(Request $request, Response $response, array $args): Response
    {
        $result = $this->packageService->delete($args['id']);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }
}
