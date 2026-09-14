<?php

namespace Nirvona\Integrations;

/**
 * RazorpayClient
 *
 * Minimal REST client for Razorpay's Orders API, authenticated with
 * HTTP Basic Auth (key_id as username, key_secret as password - this
 * is how Razorpay's server-side API works, no SDK required). Talks to
 * https://api.razorpay.com/v1 directly via cURL (already an available
 * PHP extension - no composer install needed in this environment).
 *
 * Flow this supports (standard Razorpay Checkout integration):
 *  1. Backend calls createOrder() to get a Razorpay order id.
 *  2. Frontend opens Razorpay's Checkout widget with that order id.
 *  3. On success, Razorpay hands the frontend a payment id + signature.
 *  4. Backend calls verifySignature() to confirm the payment is
 *     genuine (HMAC-SHA256 over "order_id|payment_id" using the
 *     secret key) before trusting it - the signature is the only
 *     server-side proof that a payment actually happened and wasn't
 *     forged by a tampered client.
 */
class RazorpayClient
{
    private const BASE_URL = 'https://api.razorpay.com/v1';

    public function __construct(
        private readonly string $keyId,
        private readonly string $keySecret,
    ) {
    }

    /** The publishable key id - safe to hand to the frontend Checkout widget. */
    public function getKeyId(): string
    {
        return $this->keyId;
    }

    /**
     * Create a Razorpay order. Amount must be in the smallest currency
     * unit (paise for INR - i.e. rupees * 100).
     *
     * @param int $amountPaise
     * @param string $currency
     * @param string $receipt Our own internal payment id, so Razorpay's
     *   dashboard can be cross-referenced back to this app's records.
     * @param array<string, string> $notes
     * @return array{id: string, amount: int, currency: string, status: string}
     * @throws \RuntimeException on any transport or API-level failure
     */
    public function createOrder(int $amountPaise, string $currency, string $receipt, array $notes = []): array
    {
        return $this->request('POST', '/orders', [
            'amount' => $amountPaise,
            'currency' => $currency,
            'receipt' => $receipt,
            // Auto-capture immediately on successful authorization -
            // without this a payment stays "authorized" and needs a
            // separate capture call within a short window or it's
            // automatically refunded.
            'payment_capture' => 1,
            'notes' => $notes,
        ]);
    }

    /**
     * Verify the signature Razorpay Checkout returns after a payment,
     * per Razorpay's documented HMAC scheme. This is the step that
     * actually proves a payment happened - everything else (order id,
     * payment id) can be freely inspected or guessed by a client, but
     * only someone holding the secret key can produce a matching
     * signature.
     */
    public function verifySignature(string $orderId, string $paymentId, string $signature): bool
    {
        $expected = hash_hmac('sha256', "{$orderId}|{$paymentId}", $this->keySecret);
        return hash_equals($expected, $signature);
    }

    /**
     * Fetch a payment's current status directly from Razorpay - used
     * as a defence-in-depth check alongside signature verification
     * (e.g. to confirm the amount actually captured matches what we
     * expected, guarding against a tampered client-side amount).
     *
     * @return array{id: string, status: string, amount: int, order_id: string}
     */
    public function fetchPayment(string $paymentId): array
    {
        return $this->request('GET', "/payments/{$paymentId}");
    }

    /**
     * @param array<string, mixed>|null $body
     * @return array<string, mixed>
     */
    private function request(string $method, string $path, ?array $body = null): array
    {
        $ch = curl_init(self::BASE_URL . $path);
        $headers = ['Content-Type: application/json'];

        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_USERPWD => "{$this->keyId}:{$this->keySecret}",
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_CONNECTTIMEOUT => 5,
        ]);

        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        }

        $raw = curl_exec($ch);
        $errno = curl_errno($ch);
        $error = curl_error($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($errno !== 0) {
            throw new \RuntimeException("Razorpay request failed: {$error}");
        }

        $decoded = json_decode((string) $raw, true);

        if ($status < 200 || $status >= 300) {
            $message = $decoded['error']['description'] ?? "Razorpay API returned HTTP {$status}";
            throw new \RuntimeException($message);
        }

        return is_array($decoded) ? $decoded : [];
    }
}
