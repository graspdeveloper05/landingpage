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

    public function test_admin_endpoints_need_a_session(): void
    {
        $this->getJson('/api/admin/surveys')->assertUnauthorized();
    }

    public function test_an_admin_creates_a_survey_and_adds_questions(): void
    {
        $id = $this->admin()->postJson('/api/admin/surveys', [
            'title' => ['en' => 'Live poll', 'ms' => '', 'zh' => '', 'ta' => ''],
        ])->assertCreated()->json('id');

        $this->postJson("/api/admin/surveys/{$id}/questions", [
            'type' => 'choice',
            'question' => ['en' => 'Which value matters most?'],
            'options' => [['en' => 'Unity'], ['en' => 'Education']],
        ])->assertCreated();
        $this->postJson("/api/admin/surveys/{$id}/questions", [
            'type' => 'rating',
            'question' => ['en' => 'Rate this session'],
        ])->assertCreated();

        $this->getJson("/api/admin/surveys/{$id}")
            ->assertOk()
            ->assertJsonPath('status', 'draft')
            ->assertJsonPath('questions.0.type', 'choice')
            ->assertJsonPath('questions.1.type', 'rating')
            ->assertJsonPath('questions.1.options', null)
            ->assertJsonPath('questions.1.display_order', 1);

        $this->getJson('/api/admin/surveys')
            ->assertJsonPath('0.questions_count', 2)
            ->assertJsonPath('0.responses_count', 0);
    }

    public function test_english_is_required_and_a_choice_needs_two_options(): void
    {
        $this->admin()->postJson('/api/admin/surveys', ['title' => ['en' => '']])
            ->assertUnprocessable()->assertJsonValidationErrors('title.en');

        $survey = $this->survey();
        $this->postJson("/api/admin/surveys/{$survey->id}/questions", [
            'type' => 'choice',
            'question' => ['en' => 'Pick'],
            'options' => [['en' => 'Only one']],
        ])->assertUnprocessable()->assertJsonValidationErrors('options');
    }

    public function test_closing_a_question_stamps_closed_at_and_reopening_clears_it(): void
    {
        $q = $this->question($this->survey());

        $this->admin()->putJson("/api/admin/survey-questions/{$q->id}", ['status' => 'closed'] + $q->only('type', 'question', 'options'))
            ->assertOk();
        $this->assertNotNull($q->fresh()->closed_at);

        $this->putJson("/api/admin/survey-questions/{$q->id}", ['status' => 'open'] + $q->only('type', 'question', 'options'))
            ->assertOk();
        $this->assertNull($q->fresh()->closed_at);
    }

    public function test_options_cannot_change_once_answered_but_wording_can(): void
    {
        $q = $this->question($this->survey());
        $q->responses()->create([
            'registration_id' => $this->registration()->id,
            'answer' => '0',
        ]);

        $this->admin()->putJson("/api/admin/survey-questions/{$q->id}", [
            'type' => 'choice',
            'question' => ['en' => 'Pick one'],
            'options' => [['en' => 'B'], ['en' => 'A']],
        ])->assertUnprocessable()->assertJsonValidationErrors('options');

        $this->putJson("/api/admin/survey-questions/{$q->id}", [
            'type' => 'choice',
            'question' => ['en' => 'Pick one, please', 'ms' => 'Pilih satu'],
            'options' => [['en' => 'A', 'ms' => 'A'], ['en' => 'B']],
        ])->assertOk();
    }

    public function test_questions_can_be_reordered(): void
    {
        $survey = $this->survey();
        $a = $this->question($survey, ['display_order' => 0]);
        $b = $this->question($survey, ['display_order' => 1]);

        $this->admin()->postJson("/api/admin/surveys/{$survey->id}/questions/reorder", ['ids' => [$b->id, $a->id]])
            ->assertOk();

        $this->assertSame([$b->id, $a->id], $survey->questions()->pluck('id')->all());
    }

    public function test_deleting_a_survey_removes_its_questions(): void
    {
        $survey = $this->survey();
        $this->question($survey);

        $this->admin()->deleteJson("/api/admin/surveys/{$survey->id}")->assertNoContent();
        $this->assertSame(0, SurveyQuestion::count());
    }
}
