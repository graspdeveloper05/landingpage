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
 */
class SurveyRespondentController extends Controller
{
    public function index(Survey $survey): JsonResponse
    {
        $rows = SurveyResponse::query()
            ->whereIn('survey_question_id', $survey->questions()->select('id'))
            ->whereNotNull('email')
            ->orderBy('id')
            ->get(['email', 'name', 'mobile', 'answer', 'created_at'])
            ->groupBy('email');

        return response()->json($rows->map(function ($answers, $email) {
            $latest = $answers->last();

            return [
                'email' => $email,
                'name' => $latest->name,
                'mobile' => $latest->mobile,
                // Skipped optional questions are stored empty; not answers.
                'answers' => $answers->filter(fn ($r) => $r->answer !== '')->count(),
                'last_answered_at' => $answers->max('created_at'),
            ];
        })->sortByDesc('last_answered_at')->values());
    }

    /**
     * Every question of the survey in order, with this person's answer: a
     * choice as its English label, a skipped optional question marked as
     * skipped, and a question they never reached as null.
     */
    public function show(Survey $survey, string $email): JsonResponse
    {
        $email = strtolower(trim(urldecode($email)));
        $questions = $survey->questions()->get();
        $responses = SurveyResponse::where('email', $email)
            ->whereIn('survey_question_id', $questions->pluck('id'))
            ->orderBy('id')
            ->get()
            ->keyBy('survey_question_id');

        abort_if($responses->isEmpty(), 404, 'This person has not answered this survey.');

        $latest = $responses->sortBy('id')->last();

        return response()->json([
            'respondent' => [
                'email' => $email,
                'name' => $latest->name,
                'mobile' => $latest->mobile,
            ],
            'answers' => $questions->map(function (SurveyQuestion $q) use ($responses) {
                $r = $responses->get($q->id);
                $skipped = $r !== null && $r->answer === '';

                return [
                    'question_id' => $q->id,
                    'type' => $q->type,
                    'question' => $q->question,
                    'is_required' => $q->is_required,
                    'answer' => $r === null || $skipped ? null : $q->label($r->answer),
                    'skipped' => $skipped,
                    'answered_at' => $r?->created_at,
                ];
            })->values(),
        ]);
    }
}
