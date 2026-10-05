<?php

namespace Tests\Feature;

use App\Models\Registration;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SurveyAdminTest extends TestCase
{
    use RefreshDatabase;

    private function admin()
    {
        return $this->actingAs(User::factory()->create());
    }

    private function survey(array $attrs = []): Survey
    {
        return Survey::create($attrs + ['title' => ['en' => 'Live poll']]);
    }

    private function question(Survey $survey, array $attrs = []): SurveyQuestion
    {
        return $survey->questions()->create($attrs + [
            'type' => 'choice',
            'question' => ['en' => 'Pick one'],
            'options' => [['en' => 'A'], ['en' => 'B']],
            'display_order' => 0,
        ]);
    }

    private int $registrations = 0;

    private function registration(array $attrs = []): Registration
    {
        $n = ++$this->registrations;

        return Registration::create($attrs + [
            'reference' => sprintf('SND26-%04d', $n),
            'full_name' => "Guest {$n}",
            'email' => "guest{$n}@example.com",
            'mobile' => sprintf('+60 12 345 67%02d', $n),
            'organisation' => 'Org',
            'designation' => 'Role',
            'pdpa_accepted' => true,
            'edition' => 2026,
        ]);
    }

    public function test_a_question_is_answerable_only_when_it_and_its_survey_are_open(): void
    {
        $survey = $this->survey();
        $q = $this->question($survey);

        $this->assertSame('draft', $survey->fresh()->status);
        $this->assertFalse($q->fresh()->isAnswerable());

        $q->update(['status' => 'open']);
        $this->assertFalse($q->fresh()->isAnswerable());

        $survey->update(['status' => 'open']);
        $this->assertTrue($q->fresh()->isAnswerable());
    }
}
