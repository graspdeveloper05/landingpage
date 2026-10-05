<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use App\Models\SurveyResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** One row per answer, in the shape the team files results in. */
class SurveyExportController extends Controller
{
    public function __invoke(Survey $survey): StreamedResponse
    {
        $name = 'survey-'.$survey->id.'-'.now('Asia/Kuala_Lumpur')->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($survey) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Reference', 'Name', 'Question', 'Answer', 'Answered at']);

            $questions = $survey->questions()->get()->keyBy('id');

            SurveyResponse::query()
                ->whereIn('survey_question_id', $questions->keys())
                ->with('registration:id,full_name,reference')
                ->orderBy('survey_question_id')->orderBy('id')
                ->chunk(200, function ($rows) use ($out, $questions) {
                    foreach ($rows as $r) {
                        $q = $questions[$r->survey_question_id];
                        // A choice is stored as its option number; the file
                        // shows the English label so it reads on its own.
                        $answer = $q->type === 'choice'
                            ? ($q->options[(int) $r->answer]['en'] ?? $r->answer)
                            : $r->answer;

                        fputcsv($out, array_map(fn ($v) => $this->guard((string) $v), [
                            $r->registration?->reference,
                            $r->registration?->full_name,
                            $q->question['en'] ?? '',
                            $answer,
                            $r->created_at?->timezone('Asia/Kuala_Lumpur')->format('Y-m-d H:i'),
                        ]));
                    }
                });

            fclose($out);
        }, $name, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /** A cell starting with = + - @ would run as a formula in Excel. */
    private function guard(string $value): string
    {
        return preg_match('/^[=+\-@\t\r]/', $value) === 1 ? "'".$value : $value;
    }
}
