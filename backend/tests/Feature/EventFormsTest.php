<?php

namespace Tests\Feature;

use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use App\Models\Testimonial;
use App\Models\User;
use Database\Seeders\EventFormsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * What the organising team's pre-event, feedback and "questions from the
 * floor" forms need: a fixed short link, the details each form asks for,
 * and question notes, sections, numbered scales, "select up to", "Other",
 * statement tables and a character limit.
 */
class EventFormsTest extends TestCase
{
    use RefreshDatabase;

    private const PERSON = ['name' => 'Aisyah Rahman', 'email' => 'Aisyah@Example.com', 'organisation' => 'UKM'];

    private function form(array $attrs = []): Survey
    {
        return Survey::create($attrs + [
            'title' => ['en' => 'Before the Dialogue'],
            'status' => 'open',
            'fields' => ['name' => 'required', 'email' => 'required', 'organisation' => 'optional'],
        ]);
    }

    private function question(Survey $survey, array $attrs = []): SurveyQuestion
    {
        return $survey->questions()->create($attrs + [
            'type' => 'choice',
            'question' => ['en' => 'Pick one'],
            'options' => [['en' => 'A'], ['en' => 'B'], ['en' => 'C']],
            'is_required' => true,
            'status' => 'open',
        ]);
    }

    private function answer(SurveyQuestion $q, string $answer, array $extra = [])
    {
        return $this->postJson("/api/survey/questions/{$q->id}/answer", self::PERSON + ['answer' => $answer] + $extra);
    }

    private function admin()
    {
        return $this->actingAs(User::factory()->create());
    }

    // Short links

    public function test_a_form_opens_at_its_short_link_and_its_title_id_link(): void
    {
        $survey = $this->form(['slug' => 'pre-event']);

        $this->getJson('/api/survey/pre-event')->assertOk()->assertJsonPath('id', $survey->id);
        $this->getJson("/api/survey/before-the-dialogue-{$survey->id}")->assertOk()->assertJsonPath('slug', 'pre-event');
    }

    public function test_a_short_link_is_lowercase_words_and_unique(): void
    {
        $this->form(['slug' => 'pre-event']);
        $admin = $this->admin();

        $admin->postJson('/api/admin/surveys', ['title' => ['en' => 'X'], 'slug' => 'Pre Event!'])
            ->assertUnprocessable()->assertJsonValidationErrors('slug');
        $admin->postJson('/api/admin/surveys', ['title' => ['en' => 'X'], 'slug' => 'pre-event'])
            ->assertUnprocessable()->assertJsonValidationErrors('slug');
        $admin->postJson('/api/admin/surveys', ['title' => ['en' => 'X'], 'slug' => 'ask'])
            ->assertCreated()->assertJsonPath('slug', 'ask');
    }

    // The details a form asks for

    public function test_the_form_says_which_details_it_asks_for(): void
    {
        $this->form(['slug' => 'pre-event', 'details_note' => ['en' => 'Linked to your name.']]);

        $this->getJson('/api/survey/pre-event')
            ->assertJsonPath('fields', ['name' => 'required', 'email' => 'required', 'mobile' => 'off', 'organisation' => 'optional'])
            ->assertJsonPath('details_note.en', 'Linked to your name.');
    }

    public function test_older_forms_keep_their_details_email_and_phone_or_none(): void
    {
        $survey = Survey::create(['title' => ['en' => 'Poll'], 'status' => 'open']);
        $feedback = Survey::create(['title' => ['en' => 'Feedback'], 'status' => 'open', 'form_type' => 'feedback']);

        $this->assertSame(['name' => 'off', 'email' => 'required', 'mobile' => 'required', 'organisation' => 'off'], $survey->fields());
        $this->assertSame(['name' => 'off', 'email' => 'off', 'mobile' => 'off', 'organisation' => 'off'], $feedback->fields());
    }

    public function test_required_details_are_checked_and_all_are_kept(): void
    {
        $q = $this->question($this->form());

        $this->postJson("/api/survey/questions/{$q->id}/answer", ['answer' => '0', 'email' => 'a@b.co'])
            ->assertUnprocessable()->assertJsonValidationErrors('name');

        $this->answer($q, '1')->assertCreated();
        $row = SurveyResponse::firstOrFail();
        $this->assertSame('Aisyah Rahman', $row->name);
        $this->assertSame('aisyah@example.com', $row->email);
        $this->assertSame('UKM', $row->organisation);
        $this->assertNull($row->mobile);
    }

    public function test_a_detail_the_form_does_not_ask_is_not_kept(): void
    {
        $q = $this->question($this->form(['fields' => ['name' => 'optional', 'email' => 'off', 'mobile' => 'off', 'organisation' => 'optional']]));

        $this->answer($q, '0', ['mobile' => '+60 12 345 6789'])->assertCreated();

        $row = SurveyResponse::firstOrFail();
        $this->assertNull($row->email);
        $this->assertNull($row->mobile);
        $this->assertSame('Aisyah Rahman', $row->name);
    }

    public function test_a_form_without_email_takes_many_submissions_from_one_phone(): void
    {
        // "Questions from the floor": anyone may ask more than once.
        $q = $this->question($this->form(['fields' => ['name' => 'optional', 'email' => 'off']]), ['type' => 'text', 'options' => null]);

        $this->answer($q, 'First question')->assertCreated();
        $this->answer($q, 'Second question')->assertCreated();

        $this->assertSame(2, SurveyResponse::count());
    }

    // Question settings

    public function test_the_new_question_settings_reach_the_page(): void
    {
        $survey = $this->form(['slug' => 'pre-event']);
        $this->question($survey, [
            'help' => ['en' => 'Nationhood means belonging to one nation.'],
            'section' => ['title' => ['en' => 'Shaping the conversation'], 'intro' => ['en' => 'Three questions.']],
            'layout' => 'scale',
        ]);

        $this->getJson('/api/survey/pre-event')
            ->assertJsonPath('questions.0.help.en', 'Nationhood means belonging to one nation.')
            ->assertJsonPath('questions.0.section.title.en', 'Shaping the conversation')
            ->assertJsonPath('questions.0.layout', 'scale')
            ->assertJsonPath('questions.0.has_other', false)
            ->assertJsonPath('questions.0.max_choices', null);
    }

    public function test_a_checkbox_takes_no_more_than_its_maximum(): void
    {
        $q = $this->question($this->form(), [
            'type' => 'checkbox',
            'options' => [['en' => 'A'], ['en' => 'B'], ['en' => 'C'], ['en' => 'D']],
            'max_choices' => 3,
        ]);

        $this->answer($q, '0,1,2,3')->assertUnprocessable()->assertJsonValidationErrors('answer');
        $this->answer($q, '0,1,3')->assertCreated();
    }

    public function test_other_is_the_option_after_the_last_and_needs_its_text(): void
    {
        $q = $this->question($this->form(), ['type' => 'checkbox', 'has_other' => true]);

        // A, B, C are 0-2; "Other" is 3.
        $this->answer($q, '0,3')->assertUnprocessable()->assertJsonValidationErrors('other');
        $this->answer($q, '0,4', ['other' => 'x'])->assertUnprocessable()->assertJsonValidationErrors('answer');
        $this->answer($q, '0,3', ['other' => 'Arts and culture'])->assertCreated();

        $row = SurveyResponse::firstOrFail();
        $this->assertSame('Arts and culture', $row->other_text);
        $this->assertSame('A; Other: Arts and culture', $q->label($row->answer, $row->other_text));
    }

    public function test_other_text_is_dropped_when_other_is_not_chosen(): void
    {
        $q = $this->question($this->form(), ['has_other' => true]);

        $this->answer($q, '1', ['other' => 'ignored'])->assertCreated();

        $this->assertNull(SurveyResponse::firstOrFail()->other_text);
    }

    public function test_a_statement_table_takes_one_choice_per_statement(): void
    {
        $q = $this->question($this->form(), [
            'type' => 'grid',
            'statements' => [['en' => 'Relevant'], ['en' => 'Respectful']],
            'options' => [['en' => 'Agree'], ['en' => 'Neutral'], ['en' => 'Disagree']],
        ]);

        $this->answer($q, '0')->assertUnprocessable()->assertJsonValidationErrors('answer');
        $this->answer($q, '0,3')->assertUnprocessable()->assertJsonValidationErrors('answer');
        $this->answer($q, '0,2')->assertCreated();

        $this->assertSame('Relevant: Agree; Respectful: Disagree', $q->label('0,2'));
    }

    public function test_a_written_answer_keeps_to_its_character_limit(): void
    {
        $q = $this->question($this->form(), ['type' => 'text', 'options' => null, 'max_length' => 300]);

        $this->answer($q, str_repeat('a', 301))->assertUnprocessable()->assertJsonValidationErrors('answer');
        $this->answer($q, str_repeat('a', 300))->assertCreated();
    }

    public function test_an_admin_saves_the_new_question_settings(): void
    {
        $survey = $this->form();

        $this->admin()->postJson("/api/admin/surveys/{$survey->id}/questions", [
            'type' => 'grid',
            'question' => ['en' => 'To what extent do you agree?'],
            'help' => ['en' => 'One response per statement.'],
            'section' => ['title' => ['en' => 'Your voice'], 'intro' => ['en' => '']],
            'statements' => [['en' => 'Relevant'], ['en' => 'Respectful']],
            'options' => [['en' => 'Agree'], ['en' => 'Disagree']],
        ])->assertCreated()
            ->assertJsonPath('statements.1.en', 'Respectful')
            ->assertJsonPath('help.en', 'One response per statement.')
            ->assertJsonPath('section.title.en', 'Your voice');

        $this->postJson("/api/admin/surveys/{$survey->id}/questions", [
            'type' => 'checkbox',
            'question' => ['en' => 'Topics?'],
            'options' => [['en' => 'A'], ['en' => 'B']],
            'max_choices' => 2,
            'has_other' => true,
        ])->assertCreated()->assertJsonPath('max_choices', 2)->assertJsonPath('has_other', true);

        $this->postJson("/api/admin/surveys/{$survey->id}/questions", [
            'type' => 'grid', 'question' => ['en' => 'No statements'], 'options' => [['en' => 'A'], ['en' => 'B']],
        ])->assertUnprocessable()->assertJsonValidationErrors('statements');
    }

    public function test_a_rating_can_show_smileys_and_only_a_rating_keeps_them(): void
    {
        $survey = $this->form();

        $rating = $this->admin()->postJson("/api/admin/surveys/{$survey->id}/questions", [
            'type' => 'rating', 'question' => ['en' => 'How was the venue?'], 'layout' => 'smileys',
            'status' => 'open',
        ])->assertCreated()->assertJsonPath('layout', 'smileys');

        // The attendee page is told, and the answer is still 1 to 5.
        $this->getJson("/api/survey/{$survey->id}")->assertJsonPath('questions.0.layout', 'smileys');
        $q = SurveyQuestion::find($rating->json('id'));
        $this->answer($q, '5')->assertCreated();
        $this->answer($q, '6')->assertUnprocessable();

        // Smileys mean nothing on a choice, and a scale nothing on a rating.
        $this->postJson("/api/admin/surveys/{$survey->id}/questions", [
            'type' => 'choice', 'question' => ['en' => 'Pick'], 'options' => [['en' => 'A'], ['en' => 'B']],
            'layout' => 'smileys',
        ])->assertCreated()->assertJsonPath('layout', null);
        $this->postJson("/api/admin/surveys/{$survey->id}/questions", [
            'type' => 'rating', 'question' => ['en' => 'Stars'], 'layout' => 'scale',
        ])->assertCreated()->assertJsonPath('layout', null);
    }

    public function test_an_admin_sets_the_details_a_form_asks_for(): void
    {
        $this->admin()->postJson('/api/admin/surveys', [
            'title' => ['en' => 'Feedback'],
            'form_type' => 'feedback',
            'fields' => ['name' => 'required', 'email' => 'required', 'mobile' => 'off', 'organisation' => 'optional'],
            'details_note' => ['en' => 'Only organisers see this.'],
        ])->assertCreated()
            ->assertJsonPath('fields.name', 'required')
            ->assertJsonPath('details_note.en', 'Only organisers see this.');

        $this->postJson('/api/admin/surveys', ['title' => ['en' => 'X'], 'fields' => ['name' => 'sometimes']])
            ->assertUnprocessable()->assertJsonValidationErrors('fields.name');
    }

    public function test_changing_only_a_questions_status_keeps_its_settings(): void
    {
        $survey = $this->form();
        $q = $this->question($survey, [
            'type' => 'checkbox', 'max_choices' => 2, 'has_other' => true,
            'help' => ['en' => 'A note'], 'status' => 'open',
        ]);
        $grid = $this->question($survey, [
            'type' => 'grid', 'statements' => [['en' => 'S1']], 'options' => [['en' => 'A'], ['en' => 'B']],
        ]);

        $this->admin()->putJson("/api/admin/survey-questions/{$q->id}", [
            'type' => 'checkbox', 'question' => $q->question, 'options' => $q->options, 'status' => 'closed',
        ])->assertOk();
        $this->putJson("/api/admin/survey-questions/{$grid->id}", [
            'type' => 'grid', 'question' => $grid->question, 'options' => $grid->options, 'status' => 'closed',
        ])->assertOk();

        $q->refresh();
        $this->assertSame('closed', $q->status);
        $this->assertSame(2, $q->max_choices);
        $this->assertTrue($q->has_other);
        $this->assertSame('A note', $q->help['en']);
        $this->assertSame('S1', $grid->fresh()->statements[0]['en']);
    }

    // Results, responses, export

    public function test_results_count_each_statement_and_list_other_answers(): void
    {
        $survey = $this->form();
        $grid = $this->question($survey, [
            'type' => 'grid',
            'statements' => [['en' => 'Relevant'], ['en' => 'Respectful']],
            'options' => [['en' => 'Agree'], ['en' => 'Disagree']],
        ]);
        $topics = $this->question($survey, ['type' => 'checkbox', 'has_other' => true]);
        $grid->responses()->create(['email' => 'a@x.co', 'answer' => '0,1']);
        $grid->responses()->create(['email' => 'b@x.co', 'answer' => '0,0']);
        $topics->responses()->create(['email' => 'a@x.co', 'answer' => '1,3', 'other_text' => 'Arts']);

        $this->admin()->getJson("/api/admin/surveys/{$survey->id}/results")
            ->assertJsonPath('questions.0.statements.0.label', 'Relevant')
            ->assertJsonPath('questions.0.statements.0.options.0.count', 2)
            ->assertJsonPath('questions.0.statements.1.options.1.count', 1)
            ->assertJsonPath('questions.1.options.3.label', 'Other')
            ->assertJsonPath('questions.1.options.3.count', 1)
            ->assertJsonPath('questions.1.other.0.answer', 'Arts');
    }

    public function test_the_export_has_organisation_and_other_text(): void
    {
        $survey = $this->form();
        $q = $this->question($survey, ['has_other' => true]);
        $this->answer($q, '3', ['other' => 'Something else'])->assertCreated();

        $csv = $this->admin()->get("/api/admin/surveys/{$survey->id}/export")->assertOk()->streamedContent();

        $this->assertStringContainsString('Organisation', strtok($csv, "\n"));
        $this->assertStringContainsString('UKM', $csv);
        $this->assertStringContainsString('Other: Something else', $csv);
    }

    public function test_the_responses_list_shows_organisation_and_other_text(): void
    {
        $survey = $this->form();
        $q = $this->question($survey, ['has_other' => true]);
        $this->answer($q, '3', ['other' => 'Something else'])->assertCreated();

        $this->admin()->getJson("/api/admin/surveys/{$survey->id}/respondents")
            ->assertJsonPath('0.organisation', 'UKM')
            ->assertJsonPath("0.values.{$q->id}", 'Other: Something else');
    }

    // Testimonial on a named feedback form

    public function test_a_named_feedback_form_credits_the_testimonial_from_the_details(): void
    {
        $survey = $this->form(['form_type' => 'feedback', 'slug' => 'dialogue-2026']);

        // Organisation may be blank: "Full name and organisation" uses what was given.
        $this->postJson('/api/survey/dialogue-2026/testimonial', [
            'name' => 'Aisyah Rahman', 'email' => 'aisyah@example.com', 'organisation' => '',
            'quote' => 'A rare, honest room.', 'credit' => 'full_name_org', 'consent' => true,
        ])->assertCreated();

        $t = Testimonial::firstOrFail();
        $this->assertSame('Aisyah Rahman', $t->name);
        $this->assertNull($t->organisation);
        $this->assertSame('aisyah@example.com', $t->email);
        $this->assertSame($survey->id, $t->survey_id);
    }

    // The three forms

    public function test_the_seeder_creates_the_three_forms_once(): void
    {
        $this->seed(EventFormsSeeder::class);
        $this->seed(EventFormsSeeder::class);

        $this->assertSame(3, Survey::count());
        $pre = Survey::where('slug', 'pre-event')->firstOrFail();
        $feedback = Survey::where('slug', 'dialogue-2026')->firstOrFail();
        $ask = Survey::where('slug', 'ask')->firstOrFail();

        $this->assertSame(5, $pre->questions()->count());
        $this->assertSame(11, $feedback->questions()->count());
        $this->assertSame('feedback', $feedback->form_type);
        $this->assertSame('off', $ask->fields()['email']);
        $this->assertNotEmpty($pre->questions()->first()->question['ms'] ?? null);
        $this->assertSame(1, $feedback->questions()->where('type', 'grid')->count());
    }

    public function test_the_seeder_leaves_a_form_that_has_answers_alone(): void
    {
        $this->seed(EventFormsSeeder::class);
        $pre = Survey::where('slug', 'pre-event')->firstOrFail();
        $first = $pre->questions()->first();
        $first->responses()->create(['email' => 'a@x.co', 'answer' => '0']);
        $first->update(['question' => ['en' => 'Edited by the team']]);

        $this->seed(EventFormsSeeder::class);

        $this->assertSame('Edited by the team', $first->fresh()->question['en']);
        $this->assertSame(1, SurveyResponse::count());
    }
}
