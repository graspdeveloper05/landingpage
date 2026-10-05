<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Registration;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use App\Support\Mobile;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * The attendee side of a survey. Only registered attendees answer: they
 * identify once with the email or mobile they registered with, and get a
 * token that stands for their registration from then on. The token is the
 * registration id, encrypted, so it cannot be guessed or edited into
 * someone else's.
 */
class SurveyController extends Controller
{
    public function identify(Request $request): JsonResponse
    {
        $contact = trim((string) $request->validate([
            'contact' => ['required', 'string', 'max:190'],
        ])['contact']);

        $registration = $this->find($contact);

        if (! $registration) {
            throw ValidationException::withMessages(['contact' => 'User not found.']);
        }

        // Only the first name goes back: the token is enough to answer with,
        // and nothing here should confirm someone else's email or number.
        return response()->json([
            'token' => Crypt::encryptString((string) $registration->id),
            'firstName' => Str::of($registration->full_name)->trim()->before(' ')->toString(),
        ]);
    }

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

        $registration = $this->fromToken((string) $request->query('token', ''));

        $questions = $survey->isOpen()
            ? $survey->questions()->where('status', 'open')->get()
            : collect();

        $answered = $registration
            ? SurveyResponse::where('registration_id', $registration->id)
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
        $registration = $this->fromToken((string) $request->input('token', ''));
        if (! $registration) {
            return response()->json(['message' => 'Please enter your email or mobile again.'], 401);
        }

        if (! $question->isAnswerable()) {
            return response()->json(['message' => 'This question is closed.'], 422);
        }

        // An optional question may be skipped. The skip is stored as an empty
        // answer, so the question counts as done and is not asked again; the
        // results leave empty answers out.
        $answer = (string) $request->validate([
            'answer' => [$question->is_required ? 'required' : 'nullable', 'string', ...$this->rulesFor($question)],
        ])['answer'];

        try {
            SurveyResponse::create([
                'survey_question_id' => $question->id,
                'registration_id' => $registration->id,
                'answer' => trim($answer),
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
            'rating' => ['regex:/^[1-5]$/'],
            default => ['max:1000'],
        };
    }

    private function find(string $contact): ?Registration
    {
        $edition = (int) config('event.edition');

        if (str_contains($contact, '@')) {
            return Registration::forEdition($edition)->where('email', strtolower($contact))->first();
        }

        $wanted = Mobile::canonical($contact);
        if (strlen($wanted) < 8) {
            return null;
        }

        // A few hundred rows: compared in PHP because the stored numbers are
        // written every way people type them, which SQL cannot normalise.
        return Registration::forEdition($edition)
            ->whereNotNull('mobile')
            ->orderBy('id')
            ->get(['id', 'full_name', 'mobile'])
            ->first(fn (Registration $r) => Mobile::canonical($r->mobile) === $wanted);
    }

    private function fromToken(string $token): ?Registration
    {
        if ($token === '') {
            return null;
        }

        try {
            $id = (int) Crypt::decryptString($token);
        } catch (DecryptException) {
            return null;
        }

        return Registration::forEdition((int) config('event.edition'))->find($id);
    }
}
