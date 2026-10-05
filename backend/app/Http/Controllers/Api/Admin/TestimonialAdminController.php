<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** The team's review of testimonials before any appear on the website. */
class TestimonialAdminController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Testimonial::orderBy('display_order')->orderBy('id')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['display_order'] = (int) Testimonial::max('display_order') + 1;

        return response()->json(Testimonial::create($data)->fresh(), 201);
    }

    public function update(Request $request, Testimonial $testimonial): JsonResponse
    {
        $testimonial->update($this->validated($request));

        return response()->json($testimonial->fresh());
    }

    public function destroy(Testimonial $testimonial): JsonResponse
    {
        $testimonial->delete();

        return response()->json(null, 204);
    }

    public function reorder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer'],
        ]);

        foreach ($data['ids'] as $position => $id) {
            Testimonial::whereKey($id)->update(['display_order' => $position]);
        }

        return response()->json(['message' => 'Order saved.']);
    }

    /** A credit that shows a name needs one; with organisation, that too. */
    private function validated(Request $request): array
    {
        return $request->validate([
            'quote' => ['required', 'string', 'max:1000'],
            'credit' => ['required', Rule::in(Testimonial::CREDITS)],
            'name' => ['nullable', 'required_unless:credit,anonymous', 'string', 'max:120'],
            'organisation' => ['nullable', 'required_if:credit,full_name_org', 'string', 'max:150'],
            'status' => ['sometimes', Rule::in(Testimonial::STATUSES)],
        ], [
            'name.required_unless' => 'Add the name this testimonial is credited to.',
            'organisation.required_if' => 'Add the organisation for this credit.',
        ]);
    }
}
