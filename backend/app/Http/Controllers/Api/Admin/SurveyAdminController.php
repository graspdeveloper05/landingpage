<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSurveyRequest;
use App\Models\Survey;
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
}
