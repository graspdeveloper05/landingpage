<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * The admin panel saves with PUT and removes with DELETE. Wherever the panel
 * runs on a different origin from the API (a local `npm run dev`, a split
 * API host), the browser asks first, and both methods have to be allowed.
 */
class CorsTest extends TestCase
{
    /** @dataProvider methods */
    public function test_the_panels_methods_pass_preflight(string $method): void
    {
        config(['cors.allowed_origins' => ['http://localhost:5173']]);

        $allowed = $this->call('OPTIONS', '/api/admin/surveys/1', server: [
            'HTTP_ORIGIN' => 'http://localhost:5173',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => $method,
        ])->headers->get('Access-Control-Allow-Methods');

        $this->assertStringContainsString($method, (string) $allowed);
    }

    public static function methods(): array
    {
        return [['PUT'], ['DELETE']];
    }
}
