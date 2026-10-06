<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use App\Models\Testimonial;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * The attendee side of a survey. There is no sign-in and no link to the
 * registration list: each form asks for the details it is set to ask
 * (name, email, phone, organisation), kept with each answer. With an email,
 * one answer per email per question; without one, every submit is new.
 */
class SurveyController extends Controller
{
    /**
     * One survey, at its own link. A survey that is not open still shows its
     * title, so someone scanning an old QR code learns it has closed rather
     * than meeting a dead page.
     */
    public function show(Request $request, string $link): JsonResponse
    {
        $survey = $this->fromLink($link);

        // Which of these this person has already answered, so the page can
        // leave them out; looked up by the email they typed.
        $email = $this->email((string) $request->query('email', ''));

        $questions = $survey->isOpen()
            ? $survey->questions()->where('status', 'open')->get()
            : collect();

        $answered = $email !== ''
            ? SurveyResponse::where('email', $email)
                ->whereIn('survey_question_id', $questions->pluck('id'))
                ->pluck('survey_question_id')->flip()
            : collect();

        return response()->json([
            'id' => $survey->id,
            'form_type' => $survey->form_type,
            'slug' => $survey->slug,
            'title' => $survey->title,
            'description' => $survey->description,
            'fields' => $survey->fields(),
            'details_note' => $survey->details_note,
            'status' => $survey->status,
            'questions' => $questions->map(fn (SurveyQuestion $q) => [
                'id' => $q->id,
                'type' => $q->type,
                'question' => $q->question,
                'help' => $q->help,
                'section' => $q->section,
                'options' => $q->options,
                'statements' => $q->statements,
                'layout' => $q->layout,
                'max_choices' => $q->max_choices,
                'has_other' => $q->has_other,
                'max_length' => $q->max_length,
                'is_required' => $q->is_required,
                'answered' => $answered->has($q->id),
            ])->values(),
        ]);
    }

    /**
     * The testimonial part every feedback form ends with. Stored apart from
     * the answers, and only with the writer's permission to publish; it then
     * waits for the team's review before appearing on the website.
     */
    public function testimonial(Request $request, string $link): JsonResponse
    {
        $survey = $this->fromLink($link);
        abort_unless($survey->form_type === 'feedback', 404);

        if (! $survey->isOpen()) {
            return response()->json(['message' => 'This form is not taking responses.'], 422);
        }

        // A form that asks for the organisation credits "full name and
        // organisation" with whatever was given there, even nothing; a form
        // that does not ask needs it typed for the credit.
        $fields = $survey->fields();
        $data = $request->validate([
            'quote' => ['required', 'string', 'max:1000'],
            'credit' => ['required', Rule::in(Testimonial::CREDITS)],
            'name' => ['nullable', 'required_unless:credit,anonymous', 'string', 'max:120'],
            'organisation' => [
                'nullable', Rule::requiredIf($fields['organisation'] === 'off' && $request->input('credit') === 'full_name_org'),
                'string', 'max:150',
            ],
            'email' => ['nullable', 'email:rfc,filter', 'max:190'],
            'consent' => ['accepted'],
        ], [
            'consent.accepted' => 'Tick the box to give permission to publish.',
        ]);

        try {
            Testimonial::create([
                'survey_id' => $survey->id,
                // Kept only where the form asks for an email; an anonymous
                // form keeps the credit they chose and nothing more.
                'email' => $fields['email'] !== 'off' && filled($data['email'] ?? null) ? $this->email($data['email']) : null,
                'quote' => trim($data['quote']),
                'credit' => $data['credit'],
                'name' => $data['credit'] === 'anonymous' ? null : trim((string) $data['name']),
                'organisation' => $data['credit'] === 'full_name_org' && filled($data['organisation'] ?? null) ? trim((string) $data['organisation']) : null,
                'status' => 'pending',
                'display_order' => (int) Testimonial::max('display_order') + 1,
            ]);
        } catch (UniqueConstraintViolationException) {
            return response()->json(['message' => 'You have already shared a testimonial on this form.'], 409);
        }

        return response()->json(['message' => 'Thank you.'], 201);
    }

    public function answer(Request $request, SurveyQuestion $question): JsonResponse
    {
        if (! $question->isAnswerable()) {
            return response()->json(['message' => 'This question is closed.'], 422);
        }

        // An optional question may be skipped. The skip is stored as an empty
        // answer, so the question counts as done and is not asked again; the
        // results leave empty answers out.
        // Details are asked as the form is set: each detail required,
        // optional or not asked. One not asked is not kept, even if sent.
        $fields = $question->survey->fields();
        $detailRules = [
            'name' => ['string', 'max:120'],
            'email' => ['email:rfc,filter', 'max:190'],
            // Malaysian and international numbers, as the RSVP form accepts.
            'mobile' => ['string', 'regex:/^\+?[0-9\s\-]{8,16}$/'],
            'organisation' => ['string', 'max:150'],
        ];
        $rules = [
            'answer' => [$question->is_required ? 'required' : 'nullable', 'string', ...$this->rulesFor($question)],
            'other' => ['nullable', 'string', 'max:300'],
            // One id per submit, so the admin can read each response whole.
            'submission' => ['nullable', 'uuid'],
        ];
        foreach ($fields as $detail => $mode) {
            if ($mode !== 'off') {
                $rules[$detail] = [$mode === 'required' ? 'required' : 'nullable', ...$detailRules[$detail]];
            }
        }

        $data = $request->validate($rules, [
            'name.required' => 'Please enter your full name.',
        ]);
        $answer = trim((string) $data['answer']);

        // Ticked boxes in option order, each once: "2,0,2" is stored "0,2".
        if ($question->type === 'checkbox' && $answer !== '') {
            $answer = collect(explode(',', $answer))->map(fn ($i) => (int) $i)->unique()->sort()->implode(',');
        }

        $this->checkShape($question, $answer);

        // "Other" needs what it is; text sent without choosing it is dropped.
        $chose = $question->otherIndex() !== null && $answer !== ''
            && in_array((string) $question->otherIndex(), explode(',', $answer), true);
        $other = $chose ? trim((string) ($data['other'] ?? '')) : '';
        if ($chose && $other === '') {
            throw ValidationException::withMessages(['other' => 'Please tell us what “Other” is.']);
        }

        $detail = fn (string $key) => $fields[$key] !== 'off' && filled($data[$key] ?? null) ? trim((string) $data[$key]) : null;

        try {
            SurveyResponse::create([
                'survey_question_id' => $question->id,
                'name' => $detail('name'),
                'email' => ($email = $detail('email')) !== null ? $this->email($email) : null,
                'mobile' => ($mobile = $detail('mobile')) !== null ? preg_replace('/\s+/', ' ', $mobile) : null,
                'organisation' => $detail('organisation'),
                'submission_id' => $data['submission'] ?? null,
                'answer' => $answer,
                'other_text' => $chose ? $other : null,
            ]);
        } catch (UniqueConstraintViolationException) {
            return response()->json(['message' => 'You have already answered this question.'], 409);
        }

        return response()->json(['message' => 'Thank you.'], 201);
    }

    /**
     * What the type's rules cannot say alone: no more boxes than allowed, and
     * one choice for every statement of a table.
     */
    private function checkShape(SurveyQuestion $question, string $answer): void
    {
        if ($answer === '') {
            return;
        }

        if ($question->type === 'checkbox' && $question->max_choices
            && count(explode(',', $answer)) > $question->max_choices) {
            throw ValidationException::withMessages([
                'answer' => "Choose up to {$question->max_choices}.",
            ]);
        }

        if ($question->type === 'grid') {
            $picked = explode(',', $answer);
            $columns = count($question->options ?? []);
            $ok = count($picked) === count($question->statements ?? [])
                && collect($picked)->every(fn ($i) => (int) $i < $columns);
            if (! $ok) {
                throw ValidationException::withMessages(['answer' => 'Choose one response for each statement.']);
            }
        }
    }

    /** What a valid answer looks like for each type of question. */
    private function rulesFor(SurveyQuestion $question): array
    {
        return match ($question->type) {
            'choice' => ['regex:/^\d+$/', 'integer', 'min:0', 'max:'.$this->lastOption($question)],
            // Option numbers separated by commas, each one an existing option.
            'checkbox' => [
                'regex:/^\d+(,\d+)*$/',
                function (string $attribute, mixed $value, \Closure $fail) use ($question) {
                    $last = $this->lastOption($question);
                    foreach (explode(',', (string) $value) as $i) {
                        if ((int) $i > $last) {
                            $fail('Choose from the options shown.');

                            return;
                        }
                    }
                },
            ],
            'rating' => ['regex:/^[1-5]$/'],
            'grid' => ['regex:/^\d+(,\d+)*$/'],
            default => ['max:'.($question->max_length ?: 1000)],
        };
    }

    /** The highest option number: the last option, or "Other" after it. */
    private function lastOption(SurveyQuestion $question): int
    {
        return $question->otherIndex() ?? count($question->options ?? []) - 1;
    }

    /**
     * Links read "live-poll-12": the title for people, the id for us. Only the
     * id is looked up, so a survey renamed after its QR code went to print
     * still opens from the old link. A form with a short link ("pre-event")
     * opens at that too, which a QR code can carry before the form exists.
     */
    private function fromLink(string $link): Survey
    {
        if ($bySlug = Survey::where('slug', strtolower($link))->first()) {
            return $bySlug;
        }

        if (! preg_match('/(?:^|-)(\d+)$/', $link, $m)) {
            abort(404);
        }

        return Survey::findOrFail((int) $m[1]);
    }

    /** One spelling of an address, so the same person is recognised. */
    private function email(string $email): string
    {
        return strtolower(trim($email));
    }
}
