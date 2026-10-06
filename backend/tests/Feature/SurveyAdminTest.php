<?php

namespace Tests\Feature;

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

    private int $people = 0;

    /** The details a person types into the survey form. */
    private function person(array $attrs = []): array
    {
        $n = ++$this->people;

        return $attrs + [
            'name' => "Guest {$n}",
            'email' => "guest{$n}@example.com",
            'mobile' => sprintf('+60 12 345 67%02d', $n),
        ];
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

    public function test_a_question_is_optional_unless_marked_required(): void
    {
        $survey = $this->survey();

        $this->admin()->postJson("/api/admin/surveys/{$survey->id}/questions", [
            'type' => 'rating',
            'question' => ['en' => 'Rate it'],
        ])->assertCreated()->assertJsonPath('is_required', false);

        $this->postJson("/api/admin/surveys/{$survey->id}/questions", [
            'type' => 'text',
            'question' => ['en' => 'Anything else?'],
            'is_required' => true,
        ])->assertCreated()->assertJsonPath('is_required', true);
    }

    public function test_skipped_optional_answers_are_left_out_of_results(): void
    {
        $survey = $this->survey();
        $q = $this->question($survey, ['type' => 'rating', 'options' => null, 'is_required' => false]);
        $q->responses()->create([...$this->person(), 'answer' => '4']);
        $q->responses()->create([...$this->person(), 'answer' => '']);

        $this->admin()->getJson("/api/admin/surveys/{$survey->id}/results")
            ->assertJsonPath('questions.0.total', 1)
            ->assertJsonPath('questions.0.average', 4);

        $csv = $this->get("/api/admin/surveys/{$survey->id}/export")->streamedContent();
        $this->assertSame(2, substr_count(trim($csv), "\n") + 1);
    }

    public function test_respondents_lists_each_person_who_answered_once(): void
    {
        $survey = $this->survey();
        $a = $this->question($survey);
        $b = $this->question($survey, ['type' => 'text', 'options' => null, 'display_order' => 1]);
        $amy = $this->person(['name' => 'Amy Tan']);
        $raj = $this->person(['name' => 'Raj Kumar']);
        $a->responses()->create([...$amy, 'answer' => '1']);
        $b->responses()->create([...$amy, 'answer' => 'Great']);
        $a->responses()->create([...$raj, 'answer' => '0']);
        $this->person(['name' => 'Did Not Answer']);

        $this->admin()->getJson("/api/admin/surveys/{$survey->id}/respondents")
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonFragment(['name' => 'Amy Tan', 'email' => $amy['email'], 'mobile' => $amy['mobile'], 'answers' => 2])
            ->assertJsonFragment(['name' => 'Raj Kumar', 'answers' => 1])
            ->assertJsonMissing(['name' => 'Did Not Answer']);
    }

    public function test_one_respondents_full_answers_in_question_order(): void
    {
        $survey = $this->survey();
        $choice = $this->question($survey);
        $rating = $this->question($survey, ['type' => 'rating', 'options' => null, 'display_order' => 1]);
        $text = $this->question($survey, ['type' => 'text', 'options' => null, 'display_order' => 2, 'is_required' => false]);
        $open = $this->question($survey, ['type' => 'text', 'options' => null, 'display_order' => 3]);
        $amy = $this->person(['name' => 'Amy Tan']);
        $choice->responses()->create([...$amy, 'answer' => '1']);
        $rating->responses()->create([...$amy, 'answer' => '4']);
        $text->responses()->create([...$amy, 'answer' => '']);

        $this->admin()->getJson("/api/admin/surveys/{$survey->id}/respondents/{$amy['email']}")
            ->assertOk()
            ->assertJsonPath('respondent.name', 'Amy Tan')
            ->assertJsonPath('respondent.email', $amy['email'])
            ->assertJsonPath('respondent.mobile', $amy['mobile'])
            ->assertJsonPath('answers.0.answer', 'B')
            ->assertJsonPath('answers.1.answer', '4')
            ->assertJsonPath('answers.2.skipped', true)
            ->assertJsonPath('answers.3.answer', null)
            ->assertJsonPath('answers.3.question', $open->question);
    }

    public function test_the_list_says_when_each_form_was_made_and_last_answered(): void
    {
        $this->travelTo('2026-10-01 09:00:00');
        $quiet = $this->survey(['title' => ['en' => 'Quiet']]);
        $busy = $this->survey(['form_type' => 'feedback', 'status' => 'open']);
        $rating = $this->question($busy, ['type' => 'rating', 'options' => null, 'status' => 'open']);

        $this->travelTo('2026-10-03 14:30:00');
        $this->postJson("/api/survey/questions/{$rating->id}/answer", [
            'answer' => '4', 'submission' => '33333333-3333-4333-8333-333333333333',
        ])->assertCreated();

        $list = collect($this->admin()->getJson('/api/admin/surveys')->assertOk()->json())->keyBy('id');
        $this->assertStringStartsWith('2026-10-01', $list[$quiet->id]['created_at']);
        $this->assertNull($list[$quiet->id]['last_answer_at']);
        $this->assertSame('2026-10-03T14:30:00.000000Z', $list[$busy->id]['last_answer_at']);
    }

    public function test_anonymous_feedback_is_listed_one_entry_per_submission(): void
    {
        $survey = $this->survey(['form_type' => 'feedback', 'status' => 'open']);
        $rating = $this->question($survey, ['type' => 'rating', 'options' => null, 'status' => 'open']);
        $text = $this->question($survey, ['type' => 'text', 'options' => null, 'display_order' => 1, 'status' => 'open']);
        $first = '11111111-1111-4111-8111-111111111111';
        $second = '22222222-2222-4222-8222-222222222222';

        $this->postJson("/api/survey/questions/{$rating->id}/answer", ['answer' => '5', 'submission' => $first])->assertCreated();
        $this->postJson("/api/survey/questions/{$text->id}/answer", ['answer' => 'Great', 'submission' => $first])->assertCreated();
        $this->postJson("/api/survey/questions/{$rating->id}/answer", ['answer' => '3', 'submission' => $second])->assertCreated();

        $this->admin()->getJson("/api/admin/surveys/{$survey->id}/respondents")
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonFragment(['key' => $first, 'email' => null, 'answers' => 2])
            ->assertJsonFragment(['key' => $second, 'answers' => 1])
            // Each answer in the list, by question, so the list reads on its own.
            ->assertJsonFragment(['values' => [(string) $rating->id => '5', (string) $text->id => 'Great']]);

        $this->getJson("/api/admin/surveys/{$survey->id}/respondents/{$first}")
            ->assertOk()
            ->assertJsonPath('respondent.email', null)
            ->assertJsonPath('answers.0.answer', '5')
            ->assertJsonPath('answers.1.answer', 'Great');
    }

    public function test_a_person_who_did_not_answer_this_survey_is_404(): void
    {
        $survey = $this->survey();
        $this->question($survey);

        $this->admin()->getJson("/api/admin/surveys/{$survey->id}/respondents/nobody@example.com")
            ->assertNotFound();
    }

    public function test_checkbox_questions_count_each_ticked_option(): void
    {
        $survey = $this->survey();

        $this->admin()->postJson("/api/admin/surveys/{$survey->id}/questions", [
            'type' => 'checkbox',
            'question' => ['en' => 'Which sessions did you attend?'],
            'options' => [['en' => 'Opening'], ['en' => 'Panel'], ['en' => 'Q&A']],
        ])->assertCreated()->assertJsonPath('options.1.en', 'Panel');

        $q = $survey->questions()->first();
        $amy = $this->person(['name' => 'Amy Tan']);
        $raj = $this->person();
        $q->responses()->create([...$amy, 'answer' => '0,1']);
        $q->responses()->create([...$raj, 'answer' => '1']);

        $this->getJson("/api/admin/surveys/{$survey->id}/results")
            ->assertJsonPath('questions.0.total', 2)
            ->assertJsonPath('questions.0.options.0', ['label' => 'Opening', 'count' => 1])
            ->assertJsonPath('questions.0.options.1', ['label' => 'Panel', 'count' => 2])
            ->assertJsonPath('questions.0.options.2', ['label' => 'Q&A', 'count' => 0]);

        $this->getJson("/api/admin/surveys/{$survey->id}/respondents/{$amy['email']}")
            ->assertJsonPath('answers.0.answer', 'Opening; Panel');

        $csv = $this->get("/api/admin/surveys/{$survey->id}/export")->streamedContent();
        $this->assertStringContainsString('"Opening; Panel"', $csv);
    }

    /** A single tickbox, e.g. consent to publish, is a checkbox with one option. */
    public function test_a_feedback_form_can_have_a_single_tickbox(): void
    {
        $survey = $this->survey(['form_type' => 'feedback']);

        $this->admin()->postJson("/api/admin/surveys/{$survey->id}/questions", [
            'type' => 'checkbox',
            'question' => ['en' => 'Permission to publish'],
            'options' => [['en' => 'I give permission']],
            'is_required' => false,
        ])->assertCreated()->assertJsonCount(1, 'options');

        $this->postJson("/api/admin/surveys/{$survey->id}/questions", [
            'type' => 'checkbox',
            'question' => ['en' => 'Nothing to tick'],
            'options' => [],
        ])->assertUnprocessable()->assertJsonValidationErrors('options');
    }

    public function test_a_survey_checkbox_still_needs_two_options(): void
    {
        $survey = $this->survey();
        $one = ['type' => 'checkbox', 'question' => ['en' => 'Pick any'], 'options' => [['en' => 'Only one']]];

        $this->admin()->postJson("/api/admin/surveys/{$survey->id}/questions", $one)
            ->assertUnprocessable()->assertJsonValidationErrors('options');

        // Editing an existing survey question is held to the same rule.
        $q = $this->question($survey, ['type' => 'checkbox', 'options' => [['en' => 'A'], ['en' => 'B']]]);
        $this->putJson("/api/admin/survey-questions/{$q->id}", $one)
            ->assertUnprocessable()->assertJsonValidationErrors('options');
    }

    public function test_a_form_is_a_survey_unless_marked_feedback(): void
    {
        $this->admin()->postJson('/api/admin/surveys', ['title' => ['en' => 'Live poll']])
            ->assertCreated()
            ->assertJsonPath('form_type', 'survey');

        $id = $this->postJson('/api/admin/surveys', ['title' => ['en' => 'Feedback'], 'form_type' => 'feedback'])
            ->assertCreated()
            ->assertJsonPath('form_type', 'feedback')
            ->json('id');

        $this->getJson('/api/admin/surveys')->assertJsonFragment(['id' => $id, 'form_type' => 'feedback']);
        $this->getJson("/api/survey/{$id}")->assertJsonPath('form_type', 'feedback');

        $this->postJson('/api/admin/surveys', ['title' => ['en' => 'X'], 'form_type' => 'quiz'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('form_type');
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
            ...$this->person(),
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

    /** @dataProvider lockedChanges */
    public function test_an_answered_question_keeps_its_type_and_option_count(array $change, string $field): void
    {
        $three = [['en' => 'A'], ['en' => 'B'], ['en' => 'C']];
        $q = $this->question($this->survey(), ['options' => $three]);
        $q->responses()->create([...$this->person(), 'answer' => '0']);

        $this->admin()->putJson("/api/admin/survey-questions/{$q->id}", $change + [
            'type' => 'choice',
            'question' => ['en' => 'Pick one'],
            'options' => $three,
        ])->assertUnprocessable()->assertJsonValidationErrors($field);
    }

    public static function lockedChanges(): array
    {
        return [
            'type changed' => [['type' => 'text'], 'type'],
            'option added' => [['options' => [['en' => 'A'], ['en' => 'B'], ['en' => 'C'], ['en' => 'D']]], 'options'],
            'option removed' => [['options' => [['en' => 'A'], ['en' => 'B']]], 'options'],
        ];
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

    public function test_results_count_choices_ratings_and_list_text(): void
    {
        $survey = $this->survey();
        $choice = $this->question($survey);
        $rating = $this->question($survey, ['type' => 'rating', 'options' => null, 'display_order' => 1]);
        $text = $this->question($survey, ['type' => 'text', 'options' => null, 'display_order' => 2]);

        $a = $this->person();
        $b = $this->person();
        $choice->responses()->create([...$a, 'answer' => '1']);
        $choice->responses()->create([...$b, 'answer' => '1']);
        $rating->responses()->create([...$a, 'answer' => '4']);
        $rating->responses()->create([...$b, 'answer' => '5']);
        $text->responses()->create([...$a, 'answer' => 'More Q&A time']);

        $this->admin()->getJson("/api/admin/surveys/{$survey->id}/results")
            ->assertOk()
            ->assertJsonPath('questions.0.total', 2)
            ->assertJsonPath('questions.0.options.0', ['label' => 'A', 'count' => 0])
            ->assertJsonPath('questions.0.options.1', ['label' => 'B', 'count' => 2])
            ->assertJsonPath('questions.1.ratings.5', 1)
            ->assertJsonPath('questions.1.average', 4.5)
            ->assertJsonPath('questions.2.answers.0.answer', 'More Q&A time')
            ->assertJsonPath('questions.2.answers.0.email', $a['email']);
    }

    public function test_export_writes_one_row_per_answer_with_the_option_label(): void
    {
        $survey = $this->survey();
        $q = $this->question($survey);
        $r = $this->person(['name' => '=HYPERLINK("x")']);
        $q->responses()->create([...$r, 'answer' => '1']);

        $csv = $this->admin()->get("/api/admin/surveys/{$survey->id}/export")
            ->assertOk()
            ->streamedContent();

        $this->assertStringContainsString('Name,Email,Phone,Organisation,Question,Answer,"Answered at"', $csv);
        $this->assertStringContainsString("\"'=HYPERLINK(\"\"x\"\")\",{$r['email']},\"'{$r['mobile']}\",,\"Pick one\",B,", $csv);
    }
}
