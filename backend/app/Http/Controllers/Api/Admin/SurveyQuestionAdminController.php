<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSurveyQuestionRequest;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SurveyQuestionAdminController extends Controller
{
    public function store(StoreSurveyQuestionRequest $request, Survey $survey): JsonResponse
    {
        $data = $request->toQuestion();
        $data['display_order'] = $survey->questions()->exists()
            ? (int) $survey->questions()->max('display_order') + 1
            : 0;

        return response()->json($survey->questions()->create($data)->fresh(), 201);
    }

    public function update(StoreSurveyQuestionRequest $request, SurveyQuestion $question): JsonResponse
    {
        $data = $request->toQuestion();

        // Stamped on the way to closed and cleared on the way back, so it
        // always says when the question last stopped taking answers.
        if (isset($data['status']) && $data['status'] !== $question->status) {
            $data['closed_at'] = $data['status'] === 'closed' ? now() : null;
        }

        $question->update($data);

        return response()->json($question->fresh()->loadCount('responses'));
    }

    public function destroy(SurveyQuestion $question): JsonResponse
    {
        $question->delete();

        return response()->json(null, 204);
    }

    public function reorder(Request $request, Survey $survey): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer'],
        ]);

        // One order at a time, all of it or none: two saves close together
        // cannot interleave row by row.
        DB::transaction(function () use ($data, $survey) {
            Survey::whereKey($survey->id)->lockForUpdate()->first();
            foreach ($data['ids'] as $position => $id) {
                $survey->questions()->whereKey($id)->update(['display_order' => $position]);
            }
        });

        return response()->json(['message' => 'Order saved.']);
    }
}
