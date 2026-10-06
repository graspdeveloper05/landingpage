<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use Illuminate\Http\JsonResponse;

/**
 * Who filled a survey in, and everything one of them answered. A person is
 * the email they typed; the name and phone shown are the latest they gave.
 * Anonymous feedback has no email: each submission is one response instead.
 */
class SurveyRespondentController extends Controller
{
    public function index(Survey $survey): JsonResponse
    {
        $questions = $survey->questions()->get()->keyBy('id');
        $rows = SurveyResponse::query()
            ->whereIn('survey_question_id', $survey->questions()->select('id'))
            ->where(fn ($q) => $q->whereNotNull('email')->orWhereNotNull('submission_id'))
            ->orderBy('id')
            ->get(['survey_question_id', 'email', 'submission_id', 'name', 'mobile', 'organisation', 'answer', 'other_text', 'created_at'])
            ->groupBy(fn ($r) => $r->email ?? $r->submission_id);

        return response()->json($rows->map(function ($answers, $key) use ($questions) {
            $latest = $answers->last();

            return [
                'key' => $key,
                'email' => $latest->email,
                'name' => $latest->name,
                'mobile' => $latest->mobile,
                'organisation' => $latest->organisation,
                // Skipped optional questions are stored empty; not answers.
                'answers' => $answers->filter(fn ($r) => $r->answer !== '')->count(),
                'last_answered_at' => $answers->max('created_at'),
                // Every answer, by question id, as the admin reads it.
                'values' => $answers
                    ->filter(fn ($r) => $r->answer !== '' && $questions->has($r->survey_question_id))
                    ->mapWithKeys(fn ($r) => [
                        (string) $r->survey_question_id => $questions[$r->survey_question_id]->label($r->answer, $r->other_text),
                    ])
                    ->toArray() ?: new \stdClass,
            ];
        })->sortByDesc('last_answered_at')->values());
    }

    /**
     * Every question of the survey in order, with this person's answer: a
     * choice as its English label, a skipped optional question marked as
     * skipped, and a question they never reached as null.
     */
    public function show(Survey $survey, string $key): JsonResponse
    {
        // An email for a named person, a submission id for anonymous feedback.
        $key = strtolower(trim(urldecode($key)));
        $column = str_contains($key, '@') ? 'email' : 'submission_id';
        $questions = $survey->questions()->get();
        $responses = SurveyResponse::where($column, $key)
            ->whereIn('survey_question_id', $questions->pluck('id'))
            ->orderBy('id')
            ->get()
            ->keyBy('survey_question_id');

        abort_if($responses->isEmpty(), 404, 'This person has not answered this survey.');

        $latest = $responses->sortBy('id')->last();

        return response()->json([
            'respondent' => [
                'email' => $latest->email,
                'name' => $latest->name,
                'mobile' => $latest->mobile,
                'organisation' => $latest->organisation,
            ],
            'answers' => $questions->map(function (SurveyQuestion $q) use ($responses) {
                $r = $responses->get($q->id);
                $skipped = $r !== null && $r->answer === '';

                return [
                    'question_id' => $q->id,
                    'type' => $q->type,
                    'question' => $q->question,
                    'is_required' => $q->is_required,
                    'answer' => $r === null || $skipped ? null : $q->label($r->answer, $r->other_text),
                    'skipped' => $skipped,
                    'answered_at' => $r?->created_at,
                ];
            })->values(),
        ]);
    }
}
