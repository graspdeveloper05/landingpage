<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The attendee side of a survey. There is no sign-in and no link to the
 * registration list: the form asks for a name, email and phone, which are
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
        // Links read "live-poll-12": the title for people, the id for us. Only
        // the id is looked up, so a survey renamed after its QR code went to
        // print still opens from the old link.
        if (! preg_match('/(?:^|-)(\d+)$/', $link, $m)) {
            abort(404);
        }
        $survey = Survey::findOrFail((int) $m[1]);

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

    public function answer(Request $request, SurveyQuestion $question): JsonResponse
    {
        if (! $question->isAnswerable()) {
            return response()->json(['message' => 'This question is closed.'], 422);
        }

        // An optional question may be skipped. The skip is stored as an empty
        // answer, so the question counts as done and is not asked again; the
        // results leave empty answers out.
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
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
                'name' => trim($data['name']),
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

    /** One spelling of an address, so the same person is recognised. */
    private function email(string $email): string
    {
        return strtolower(trim($email));
    }
}
