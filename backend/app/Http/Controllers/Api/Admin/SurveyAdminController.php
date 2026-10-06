<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSurveyRequest;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use Illuminate\Http\JsonResponse;

/** Surveys the organising team runs during and after the event. */
class SurveyAdminController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Survey::query()->withCount(['questions', 'responses'])->latest('id')->get(),
        );
    }

    public function store(StoreSurveyRequest $request): JsonResponse
    {
        return response()->json(Survey::create($request->validated())->fresh(), 201);
    }

    public function show(Survey $survey): JsonResponse
    {
        return response()->json(
            $survey->load(['questions' => fn ($q) => $q->withCount('responses')]),
        );
    }

    public function update(StoreSurveyRequest $request, Survey $survey): JsonResponse
    {
        $survey->update($request->validated());

        return $this->show($survey->fresh());
    }

    public function destroy(Survey $survey): JsonResponse
    {
        $survey->delete();

        return response()->json(null, 204);
    }

    /** Counts per option or star, or the written answers, per question. */
    public function results(Survey $survey): JsonResponse
    {
        $questions = $survey->questions()->with('responses')->get();

        return response()->json([
            'questions' => $questions->map(fn (SurveyQuestion $q) => $this->summarise($q))->values(),
        ]);
    }

    private function summarise(SurveyQuestion $q): array
    {
        // A skipped optional question is stored as an empty answer; it is not
        // an answer, so it is left out of every count.
        $responses = $q->responses->filter(fn ($r) => $r->answer !== '');
        $answers = $responses->pluck('answer');
        $base = [
            'id' => $q->id,
            'type' => $q->type,
            'question' => $q->question,
            'status' => $q->status,
            'total' => $answers->count(),
        ];

        if ($q->type === 'grid') {
            // "0,2": the first statement took option 0, the second option 2.
            $picked = $answers->map(fn ($a) => explode(',', $a));

            return $base + ['statements' => collect($q->statements)->map(function ($s, $row) use ($q, $picked) {
                $counts = $picked->map(fn ($p) => $p[$row] ?? null)->filter(fn ($v) => $v !== null)->countBy();

                return [
                    'label' => $s['en'] ?? '',
                    'options' => collect($q->options)->map(fn ($o, $i) => [
                        'label' => $o['en'] ?? '',
                        'count' => (int) ($counts[(string) $i] ?? 0),
                    ])->values(),
                ];
            })->values()];
        }

        if ($q->hasOptions()) {
            // A checkbox answer ("0,2") counts once for each option ticked.
            $counts = $answers->flatMap(fn ($a) => explode(',', $a))->countBy();
            $options = collect($q->options)->map(fn ($o) => $o['en'] ?? '');
            if ($q->otherIndex() !== null) {
                $options->push('Other');
            }

            return $base + [
                'options' => $options->map(fn ($label, $i) => [
                    'label' => $label,
                    'count' => (int) ($counts[(string) $i] ?? 0),
                ])->values(),
                // What people typed for "Other", newest first.
                'other' => $responses->filter(fn ($r) => filled($r->other_text))->sortByDesc('id')
                    ->map(fn ($r) => ['answer' => $r->other_text, 'name' => $r->name, 'at' => $r->created_at])->values(),
            ];
        }

        if ($q->type === 'rating') {
            $counts = $answers->countBy();

            return $base + [
                'ratings' => collect(range(1, 5))->mapWithKeys(fn ($n) => [$n => (int) ($counts[(string) $n] ?? 0)]),
                'average' => $answers->isEmpty() ? null : round($answers->map(fn ($a) => (int) $a)->avg(), 2),
            ];
        }

        return $base + ['answers' => $responses->sortByDesc('id')->map(fn ($r) => [
            'answer' => $r->answer,
            'name' => $r->name,
            'organisation' => $r->organisation,
            'email' => $r->email,
            'at' => $r->created_at,
        ])->values()];
    }
}
