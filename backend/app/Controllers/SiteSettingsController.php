<?php

namespace Nirvona\Controllers;

use Nirvona\Services\SiteSettingsService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * SiteSettingsController
 *
 * GET  /api/site-settings        (public - contact details shown on the site)
 * GET  /api/admin/site-settings  (admin)
 * PUT  /api/admin/site-settings  (admin)
 */
class SiteSettingsController
{
    private SiteSettingsService $service;

    public function __construct(SiteSettingsService $service)
    {
        $this->service = $service;
    }

    public function get(Request $request, Response $response): Response
    {
        return $this->json($response, $this->service->get());
    }

    public function update(Request $request, Response $response): Response
    {
        $data = json_decode((string) $request->getBody(), true);
        return $this->json($response, $this->service->update(is_array($data) ? $data : []));
    }

    private function json(Response $response, array $result): Response
    {
        $response->getBody()->write(json_encode($result));
        return $response
            ->withStatus($result['success'] ? 200 : 400)
            ->withHeader('Content-Type', 'application/json');
    }
}
