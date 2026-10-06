<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Sponsor;
use App\Models\SponsorTier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/** §10 — the groups of the sponsors band, as the organising team arranges them. */
class SponsorTierAdminController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            SponsorTier::query()->orderBy('sort_order')->orderBy('id')->get()->map(fn (SponsorTier $tier) => $this->row($tier)),
        );
    }

    /** A new group goes last, under a key made from its English name. */
    public function store(Request $request): JsonResponse
    {
        $name = $this->validated($request);
        $tier = SponsorTier::create([
            'key' => SponsorTier::keyFor($name['en']),
            'name' => $name,
            'sort_order' => (int) SponsorTier::max('sort_order') + 1,
        ]);

        return response()->json($this->row($tier), 201);
    }

    /** The name only: the key stays, so the group keeps its sponsors. */
    public function update(Request $request, SponsorTier $sponsorTier): JsonResponse
    {
        $sponsorTier->update(['name' => $this->validated($request)]);

        return response()->json($this->row($sponsorTier));
    }

    /** Only an empty group: its sponsors would otherwise vanish from the site. */
    public function destroy(SponsorTier $sponsorTier): JsonResponse
    {
        $count = Sponsor::where('tier', $sponsorTier->key)->count();
        if ($count > 0) {
            throw ValidationException::withMessages([
                'tier' => $count === 1
                    ? 'Move or remove the sponsor in this group first.'
                    : "Move or remove the {$count} sponsors in this group first.",
            ]);
        }
        $sponsorTier->delete();

        return response()->json(null, 204);
    }

    /** The order the band shows the groups in, sent as the whole list of ids. */
    public function reorder(Request $request): JsonResponse
    {
        $ids = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:sponsor_tiers,id'],
        ])['ids'];

        foreach ($ids as $position => $id) {
            SponsorTier::whereKey($id)->update(['sort_order' => $position]);
        }

        return response()->json(null, 204);
    }

    /** The group's name in each language; English is required, the rest fall back to it. */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'array'],
            'name.en' => ['required', 'string', 'max:80'],
            'name.ms' => ['nullable', 'string', 'max:80'],
            'name.zh' => ['nullable', 'string', 'max:80'],
            'name.ta' => ['nullable', 'string', 'max:80'],
        ], [
            'name.en.required' => 'Enter the group’s name in English.',
        ]);

        return collect(['en', 'ms', 'zh', 'ta'])
            ->mapWithKeys(fn ($lang) => [$lang => trim((string) ($data['name'][$lang] ?? ''))])
            ->all();
    }

    private function row(SponsorTier $tier): array
    {
        return $tier->toPublicArray() + [
            'sponsors_count' => Sponsor::where('tier', $tier->key)->count(),
        ];
    }
}
