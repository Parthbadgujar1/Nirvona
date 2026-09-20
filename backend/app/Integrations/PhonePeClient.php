<?php

namespace Nirvona\Integrations;

use Predis\Client as RedisClient;

/**
 * PhonePeClient
 *
 * Minimal REST client for PhonePe Payment Gateway "Standard Checkout" (v2),
 * talking to PhonePe directly over cURL - no SDK needed.
 *
 * Flow this supports (PhonePe's hosted checkout):
 *  1. Backend calls createPayment() and gets a `redirectUrl` on PhonePe's
 *     hosted payment page (UPI, cards, netbanking, wallets - the customer
 *     picks there).
 *  2. The customer pays and PhonePe sends the browser back to the
 *     `redirectUrl` we supplied. That return trip proves nothing - anyone
 *     can type that URL.
 *  3. Backend calls getOrderStatus() (server-to-server, authenticated with
 *     our client secret) and only trusts the state PhonePe reports there.
 *     PhonePe's webhook is handled the same way: it only prompts us to
 *     re-check the status, its body is never trusted on its own.
 *
 * Auth is OAuth client-credentials: the client id/secret/version from the
 * PhonePe Business dashboard (Developer Settings) are exchanged for a
 * short-lived bearer token, cached in Redis until shortly before expiry.
 */
class PhonePeClient
{
    private const SANDBOX_API = 'https://api-preprod.phonepe.com/apis/pg-sandbox';
    private const SANDBOX_AUTH = 'https://api-preprod.phonepe.com/apis/pg-sandbox';
    private const LIVE_API = 'https://api.phonepe.com/apis/pg';
    private const LIVE_AUTH = 'https://api.phonepe.com/apis/identity-manager';

    private string $apiBase;
    private string $authBase;
    /** Token cache key - tied to the credentials + environment that produced the token,
     * so switching sandbox -> production (or rotating the secret) can never reuse a stale one. */
    private string $tokenCacheKey;

    /**
     * @param string $environment "sandbox" (default) or "production"
     * @param ?string $apiBaseOverride Only for pointing at a stub in tests
     * @param ?string $authBaseOverride Only for pointing at a stub in tests
     */
    public function __construct(
        private readonly string $clientId,
        private readonly string $clientSecret,
        private readonly string $clientVersion = '1',
        string $environment = 'sandbox',
        private readonly ?RedisClient $redis = null,
        ?string $apiBaseOverride = null,
        ?string $authBaseOverride = null,
    ) {
        $live = strtolower($environment) === 'production';
        $this->apiBase = rtrim($apiBaseOverride ?: ($live ? self::LIVE_API : self::SANDBOX_API), '/');
        $this->authBase = rtrim($authBaseOverride ?: ($live ? self::LIVE_AUTH : self::SANDBOX_AUTH), '/');
        $this->tokenCacheKey = 'phonepe:access_token:' . hash('sha256', implode('|', [
            $this->authBase, $clientId, $clientSecret, $clientVersion,
        ]));
    }

    public function isConfigured(): bool
    {
        return $this->clientId !== '' && $this->clientSecret !== '';
    }

    /**
     * Create a checkout order. Amount must be in paise (rupees * 100).
     *
     * @param string $merchantOrderId Our own unique id (the payments row id)
     * @return array{orderId: string, state: string, redirectUrl: string, expireAt: ?int}
     * @throws \RuntimeException on any transport or API-level failure
     */
    public function createPayment(
        string $merchantOrderId,
        int $amountPaise,
        string $redirectUrl,
        string $message = 'Nirvona package purchase',
    ): array {
        $response = $this->request('POST', '/checkout/v2/pay', [
            'merchantOrderId' => $merchantOrderId,
            'amount' => $amountPaise,
            'paymentFlow' => [
                'type' => 'PG_CHECKOUT',
                'message' => $message,
                'merchantUrls' => ['redirectUrl' => $redirectUrl],
            ],
        ]);

        if (empty($response['redirectUrl']) || empty($response['orderId'])) {
            throw new \RuntimeException('PhonePe did not return a checkout URL.');
        }

        return [
            'orderId' => (string) $response['orderId'],
            'state' => (string) ($response['state'] ?? 'PENDING'),
            'redirectUrl' => (string) $response['redirectUrl'],
            'expireAt' => isset($response['expireAt']) ? (int) $response['expireAt'] : null,
        ];
    }

    /**
     * Ask PhonePe for the current state of an order. This - not the
     * browser's return trip - is the source of truth for whether the
     * customer actually paid.
     *
     * @return array{state: string, amount: int, orderId: ?string, transactionId: ?string, paymentMode: ?string}
     * @throws \RuntimeException on any transport or API-level failure
     */
    public function getOrderStatus(string $merchantOrderId): array
    {
        $response = $this->request(
            'GET',
            '/checkout/v2/order/' . rawurlencode($merchantOrderId) . '/status?details=false'
        );

        // Successful attempts are reported in paymentDetails; pick the one
        // that completed if there are several (e.g. a failed try, then a retry).
        $details = is_array($response['paymentDetails'] ?? null) ? $response['paymentDetails'] : [];
        $attempt = null;
        foreach ($details as $candidate) {
            if (($candidate['state'] ?? '') === 'COMPLETED') {
                $attempt = $candidate;
                break;
            }
        }
        $attempt ??= $details[0] ?? null;

        return [
            'state' => strtoupper((string) ($response['state'] ?? 'PENDING')),
            'amount' => (int) ($response['amount'] ?? 0),
            'orderId' => isset($response['orderId']) ? (string) $response['orderId'] : null,
            'transactionId' => isset($attempt['transactionId']) ? (string) $attempt['transactionId'] : null,
            'paymentMode' => isset($attempt['paymentMode']) ? (string) $attempt['paymentMode'] : null,
        ];
    }

    /**
     * Check the `Authorization` header PhonePe sends with webhook calls.
     * It is SHA256("username:password"), using the username/password set
     * when the webhook was created in the PhonePe dashboard.
     */
    public static function verifyWebhookAuthorization(
        ?string $header,
        string $username,
        string $password,
    ): bool {
        if ($username === '' || $password === '' || $header === null || $header === '') {
            return false;
        }
        $expected = hash('sha256', "{$username}:{$password}");
        // Some setups prefix the hash with the scheme; accept either form.
        $given = preg_replace('/^\s*(SHA256|Bearer)\s+/i', '', trim($header));
        return hash_equals($expected, strtolower((string) $given));
    }

    private function accessToken(): string
    {
        if ($this->redis !== null) {
            try {
                $cached = $this->redis->get($this->tokenCacheKey);
                if (is_string($cached) && $cached !== '') {
                    return $cached;
                }
            } catch (\Throwable) {
                // Cache is an optimisation only - fall through and fetch.
            }
        }

        $raw = $this->send('POST', $this->authBase . '/v1/oauth/token', [
            'Content-Type: application/x-www-form-urlencoded',
        ], http_build_query([
            'client_id' => $this->clientId,
            'client_version' => $this->clientVersion,
            'client_secret' => $this->clientSecret,
            'grant_type' => 'client_credentials',
        ]));

        $token = $raw['access_token'] ?? null;
        if (!is_string($token) || $token === '') {
            throw new \RuntimeException('PhonePe did not return an access token.');
        }

        if ($this->redis !== null) {
            $expiresAt = (int) ($raw['expires_at'] ?? 0);
            $ttl = $expiresAt > 0 ? $expiresAt - time() - 60 : 300;
            if ($ttl > 0) {
                try {
                    $this->redis->setex($this->tokenCacheKey, $ttl, $token);
                } catch (\Throwable) {
                }
            }
        }

        return $token;
    }

    /**
     * @param array<string, mixed>|null $body
     * @return array<string, mixed>
     */
    private function request(string $method, string $path, ?array $body = null): array
    {
        return $this->send($method, $this->apiBase . $path, [
            'Content-Type: application/json',
            'Authorization: O-Bearer ' . $this->accessToken(),
        ], $body !== null ? json_encode($body) : null);
    }

    /**
     * @param string[] $headers
     * @return array<string, mixed>
     */
    private function send(string $method, string $url, array $headers, ?string $body): array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_CONNECTTIMEOUT => 5,
        ]);
        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }

        $raw = curl_exec($ch);
        $errno = curl_errno($ch);
        $error = curl_error($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($raw === false) {
            throw new \RuntimeException("PhonePe request failed (cURL {$errno}): {$error}");
        }

        $decoded = json_decode((string) $raw, true);
        if (!is_array($decoded)) {
            throw new \RuntimeException("PhonePe returned a non-JSON response (HTTP {$status}).");
        }

        if ($status >= 400) {
            $reason = $decoded['message'] ?? $decoded['code'] ?? $decoded['error_description'] ?? 'unknown error';
            // A rejected token (revoked/rotated credentials) must not stay cached.
            if ($status === 401 && $this->redis !== null) {
                try {
                    $this->redis->del([$this->tokenCacheKey]);
                } catch (\Throwable) {
                }
            }
            throw new \RuntimeException("PhonePe API error (HTTP {$status}): {$reason}");
        }

        return $decoded;
    }
}
