<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Registration;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use Illuminate\Http\JsonResponse;

/** Who filled a survey in, and everything one of them answered. */
class SurveyRespondentController extends Controller
{
    public function index(Survey $survey): JsonResponse
    {
        $rows = SurveyResponse::query()
            ->whereIn('survey_question_id', $survey->questions()->select('id'))
            ->selectRaw("registration_id, SUM(CASE WHEN answer <> '' THEN 1 ELSE 0 END) AS answers, MAX(created_at) AS last_at")
            ->groupBy('registration_id')
            ->orderByDesc('last_at')
            ->get();

        $people = Registration::whereIn('id', $rows->pluck('registration_id'))
            ->get(['id', 'reference', 'full_name', 'email', 'mobile'])
            ->keyBy('id');

        return response()->json($rows->map(fn ($row) => [
            'id' => $row->registration_id,
            'reference' => $people[$row->registration_id]?->reference,
            'name' => $people[$row->registration_id]?->full_name,
            'email' => $people[$row->registration_id]?->email,
            'mobile' => $people[$row->registration_id]?->mobile,
            'answers' => (int) $row->answers,
            'last_answered_at' => $row->last_at,
        ])->values());
    }

    /**
     * Every question of the survey in order, with this person's answer: a
     * choice as its English label, a skipped optional question marked as
     * skipped, and a question they never reached as null.
     */
    public function show(Survey $survey, Registration $registration): JsonResponse
    {
        $questions = $survey->questions()->get();
        $responses = SurveyResponse::where('registration_id', $registration->id)
            ->whereIn('survey_question_id', $questions->pluck('id'))
            ->get()
            ->keyBy('survey_question_id');

        abort_if($responses->isEmpty(), 404, 'This person has not answered this survey.');

        return response()->json([
            'respondent' => [
                'id' => $registration->id,
                'reference' => $registration->reference,
                'name' => $registration->full_name,
                'email' => $registration->email,
                'mobile' => $registration->mobile,
                'organisation' => $registration->organisation,
                'designation' => $registration->designation,
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
