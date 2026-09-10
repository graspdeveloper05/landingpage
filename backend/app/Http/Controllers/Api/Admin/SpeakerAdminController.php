<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSpeakerRequest;
use App\Models\Speaker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** §7 — speaker records, editable by the organising team. */
class SpeakerAdminController extends Controller
{
    /** The admin list carries every column, unlike the public endpoint. */
    public function index(): JsonResponse
    {
        return response()->json(
            Speaker::query()->orderBy('sort_order')->orderBy('id')->get(),
        );
    }

    public function store(StoreSpeakerRequest $request): JsonResponse
    {
        $data = $request->validated();

        // New speakers go to the end rather than sharing position 0 with the
        // first one, where the id tie-break would decide the running order.
        $data['sort_order'] ??= (int) Speaker::max('sort_order') + 1;

        return response()->json(Speaker::create($data), 201);
    }

    public function update(StoreSpeakerRequest $request, Speaker $speaker): JsonResponse
    {
        $speaker->update($request->validated());

        return response()->json($speaker->fresh());
    }

    public function destroy(Speaker $speaker): JsonResponse
    {
        $speaker->delete();

        return response()->json(null, 204);
    }

    /**
     * Saves a new running order in one request.
     *
     * Sent as a whole list rather than one PATCH per row: reordering by drag
     * touches most of the list at once, and a half-applied sequence leaves two
     * speakers claiming the same position.
     */
    public function reorder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'string', 'exists:speakers,id'],
        ]);

        foreach ($data['ids'] as $position => $id) {
            Speaker::whereKey($id)->update(['sort_order' => $position]);
        }

        return response()->json(['message' => 'Order saved.']);
    }
}
