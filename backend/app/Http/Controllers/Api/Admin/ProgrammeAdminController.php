<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProgrammeItemRequest;
use App\Models\ProgrammeItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** §8 — "the organising team must be able to update timings directly." */
class ProgrammeAdminController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            ProgrammeItem::query()->orderBy('sort_order')->orderBy('time')->get(),
        );
    }

    public function store(StoreProgrammeItemRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['sort_order'] ??= (int) ProgrammeItem::max('sort_order') + 1;

        return response()->json(ProgrammeItem::create($data), 201);
    }

    public function update(StoreProgrammeItemRequest $request, ProgrammeItem $programmeItem): JsonResponse
    {
        $programmeItem->update($request->validated());

        return response()->json($programmeItem->fresh());
    }

    public function destroy(ProgrammeItem $programmeItem): JsonResponse
    {
        $programmeItem->delete();

        return response()->json(null, 204);
    }

    public function reorder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'string', 'exists:programme_items,id'],
        ]);

        foreach ($data['ids'] as $position => $id) {
            ProgrammeItem::whereKey($id)->update(['sort_order' => $position]);
        }

        return response()->json(['message' => 'Order saved.']);
    }
}
