<?php

namespace Nirvona\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;
use Nirvona\Config\App;

/**
 * JwtService
 *
 * Issues and verifies the JWTs AuthMiddleware/AdminMiddleware check on
 * every protected request. Centralized so AuthService (issuing, on
 * login) and the middleware (verifying, on every request) can't drift
 * out of sync on secret/algorithm/expiry handling.
 *
 * This replaces AuthMiddleware's previous "any string over 20 chars
 * counts as a valid token" placeholder with real, verified JWTs signed
 * with JWT_SECRET (see Config\App::getJWT()).
 */
class JwtService
{
    /**
     * Issue a signed JWT for a subject (student/admin id)
     *
     * @param string $subject The user id to embed as `sub`
     * @param string $role "student" | "admin"
     * @param array $extraClaims Additional claims to embed (e.g. email)
     * @return string
     */
    public function issue(string $subject, string $role, array $extraClaims = []): string
    {
        $config = App::getJWT();
        $now = time();

        $payload = array_merge($extraClaims, [
            'sub' => $subject,
            'role' => $role,
            'iat' => $now,
            'exp' => $now + $config['expiration'],
        ]);

        return JWT::encode($payload, $config['secret'], $config['algorithm']);
    }

    /**
     * Verify a JWT and return its claims as an array
     *
     * @param string $token
     * @return ?array Claims, or null if the token is missing/invalid/expired
     */
    public function verify(string $token): ?array
    {
        $config = App::getJWT();

        try {
            $decoded = JWT::decode($token, new Key($config['secret'], $config['algorithm']));
            return (array) $decoded;
        } catch (ExpiredException | SignatureInvalidException | \UnexpectedValueException | \InvalidArgumentException $e) {
            return null;
        }
    }
}
