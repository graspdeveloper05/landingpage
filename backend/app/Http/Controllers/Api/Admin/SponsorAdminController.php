<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Sponsor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** §10 — the partners and sponsors band, as the organising team edits it. */
class SponsorAdminController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Sponsor::query()->orderBy('sort_order')->orderBy('id')->get()->map->toPublicArray(),
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['sort_order'] = (int) Sponsor::max('sort_order') + 1;

        return response()->json(Sponsor::create($data)->toPublicArray(), 201);
    }

    public function update(Request $request, Sponsor $sponsor): JsonResponse
    {
        $sponsor->update($this->validated($request));

        return response()->json($sponsor->toPublicArray());
    }

    public function destroy(Sponsor $sponsor): JsonResponse
    {
        $sponsor->delete();

        return response()->json(null, 204);
    }

    /** The order the band shows them in, sent as the whole list of ids. */
    public function reorder(Request $request): JsonResponse
    {
        $ids = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:sponsors,id'],
        ])['ids'];

        foreach ($ids as $position => $id) {
            Sponsor::whereKey($id)->update(['sort_order' => $position]);
        }

        return response()->json(null, 204);
    }

    /**
     * A logo, kept as sent. No cropping: a sponsor's mark is theirs, and the
     * band sits every logo on the same white tile at the same height.
     */
    public function logo(Request $request): JsonResponse
    {
        $request->validate([
            // svg is excluded deliberately: an SVG is a document that can
            // carry script, served here from the site's own origin.
            'logo' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:8192'],
        ], [
            'logo.max' => 'The logo must be under 8 MB.',
            'logo.mimes' => 'Use a JPEG, PNG or WebP image.',
        ]);

        $file = $request->file('logo');
        // Generated, never the uploaded name: that can carry path separators
        // or a second extension, and it leaks whatever it was called locally.
        $name = Str::uuid()->toString().'.'.$file->extension();
        $file->storeAs('sponsors', $name, 'public');
        $size = @getimagesize($file->getRealPath());

        return response()->json([
            'path' => '/storage/sponsors/'.$name,
            'width' => $size[0] ?? null,
            'height' => $size[1] ?? null,
        ], 201);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'tier' => ['required', Rule::in(Sponsor::TIERS)],
            // Either an upload or one of the logos shipped with the site.
            'logo' => ['required', 'string', 'max:200', 'regex:#^/(storage/sponsors|partners)/[A-Za-z0-9._-]+$#'],
            // Their website. https or http only: this becomes a link on the
            // public site, and anything else (javascript:, data:) must not.
            'link' => ['nullable', 'string', 'max:300', 'url:http,https'],
            'width' => ['nullable', 'integer', 'min:1', 'max:20000'],
            'height' => ['nullable', 'integer', 'min:1', 'max:20000'],
        ], [
            'name.required' => 'Enter the sponsor’s name.',
            'logo.required' => 'Upload a logo.',
            'logo.regex' => 'Upload a logo.',
            'link.url' => 'Enter the full web address, starting with https://',
        ]);
    }
}
