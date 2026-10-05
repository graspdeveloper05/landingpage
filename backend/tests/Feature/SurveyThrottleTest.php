<?php

namespace Tests\Feature;

use App\Models\Survey;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A hall of phones on one Wi-Fi address polls the survey every ten seconds.
 * Plain throttle:N,1 counts every route against one shared per-IP counter,
 * so that polling must not use up the allowance for registering at the door
 * or the organisers logging in.
 */
class SurveyThrottleTest extends TestCase
{
    use RefreshDatabase;

    public function test_survey_polling_does_not_lock_out_other_endpoints(): void
    {
        $survey = Survey::create(['title' => ['en' => 'Live poll'], 'status' => 'open']);

        for ($i = 0; $i < 200; $i++) {
            $this->getJson("/api/survey/live-poll-{$survey->id}")->assertOk();
        }

        $this->postJson('/api/registrations', [])->assertUnprocessable();
        $this->postJson('/api/admin/login', ['email' => 'x@example.com', 'password' => 'wrong'])
            ->assertStatus(422);
    }
}
