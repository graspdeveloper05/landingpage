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

/**
 * The attendee side of a survey. There is no sign-in and no link to the
 * registration list: the form asks for an email and phone, which are
 * kept with each answer. One answer per email per question.
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
            'title' => $survey->title,
            'description' => $survey->description,
            'status' => $survey->status,
            'questions' => $questions->map(fn (SurveyQuestion $q) => [
                'id' => $q->id,
                'type' => $q->type,
                'question' => $q->question,
                'options' => $q->options,
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

        $data = $request->validate([
            'email' => ['required', 'email:rfc,filter', 'max:190'],
            'mobile' => ['required', 'string', 'regex:/^\+?[0-9\s\-]{8,16}$/'],
            'quote' => ['required', 'string', 'max:1000'],
            'credit' => ['required', Rule::in(Testimonial::CREDITS)],
            'name' => ['nullable', 'required_unless:credit,anonymous', 'string', 'max:120'],
            'organisation' => ['nullable', 'required_if:credit,full_name_org', 'string', 'max:150'],
            'consent' => ['accepted'],
        ], [
            'consent.accepted' => 'Tick the box to give permission to publish.',
        ]);

        try {
            Testimonial::create([
                'survey_id' => $survey->id,
                'email' => $this->email($data['email']),
                'quote' => trim($data['quote']),
                'credit' => $data['credit'],
                'name' => $data['credit'] === 'anonymous' ? null : trim((string) $data['name']),
                'organisation' => $data['credit'] === 'full_name_org' ? trim((string) $data['organisation']) : null,
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
        $data = $request->validate([
            // The form asks only for email and phone; a name is kept if sent.
            'name' => ['nullable', 'string', 'max:120'],
            'email' => ['required', 'email:rfc,filter', 'max:190'],
            // Malaysian and international numbers, as the RSVP form accepts.
            'mobile' => ['required', 'string', 'regex:/^\+?[0-9\s\-]{8,16}$/'],
            'answer' => [$question->is_required ? 'required' : 'nullable', 'string', ...$this->rulesFor($question)],
        ]);
        $answer = trim((string) $data['answer']);

        // Ticked boxes in option order, each once: "2,0,2" is stored "0,2".
        if ($question->type === 'checkbox' && $answer !== '') {
            $answer = collect(explode(',', $answer))->map(fn ($i) => (int) $i)->unique()->sort()->implode(',');
        }

        try {
            SurveyResponse::create([
                'survey_question_id' => $question->id,
                'name' => isset($data['name']) ? trim($data['name']) : null,
                'email' => $this->email($data['email']),
                'mobile' => preg_replace('/\s+/', ' ', trim($data['mobile'])),
                'answer' => $answer,
            ]);
        } catch (UniqueConstraintViolationException) {
            return response()->json(['message' => 'You have already answered this question.'], 409);
        }

        return response()->json(['message' => 'Thank you.'], 201);
    }

    /** What a valid answer looks like for each type of question. */
    private function rulesFor(SurveyQuestion $question): array
    {
        return match ($question->type) {
            'choice' => ['regex:/^\d+$/', 'integer', 'min:0', 'max:'.(count($question->options ?? []) - 1)],
            // Option numbers separated by commas, each one an existing option.
            'checkbox' => [
                'regex:/^\d+(,\d+)*$/',
                function (string $attribute, mixed $value, \Closure $fail) use ($question) {
                    $last = count($question->options ?? []) - 1;
                    foreach (explode(',', (string) $value) as $i) {
                        if ((int) $i > $last) {
                            $fail('Choose from the options shown.');

                            return;
                        }
                    }
                },
            ],
            'rating' => ['regex:/^[1-5]$/'],
            default => ['max:1000'],
        };
    }

    /**
     * Links read "live-poll-12": the title for people, the id for us. Only the
     * id is looked up, so a survey renamed after its QR code went to print
     * still opens from the old link.
     */
    private function fromLink(string $link): Survey
    {
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
