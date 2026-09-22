<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * §7 — a speaker needs a photograph, name, designation, organisation, short
 * biography and a relevant official external link.
 *
 * Every one of the four languages is required on designation and bio. The
 * site offers a language switcher (§3); a speaker saved with English only
 * shows an empty designation to a visitor reading in Tamil, and nothing in
 * the panel would have warned the person who saved it.
 */
class StoreSpeakerRequest extends FormRequest
{
    public function rules(): array
    {
        $id = $this->route('speaker')?->id;

        return [
            'id' => [
                $id ? 'sometimes' : 'required',
                'string',
                'max:40',
                // Used in URLs and as a React key.
                'regex:/^[a-z0-9-]+$/',
                Rule::unique('speakers', 'id')->ignore($id, 'id'),
            ],
            'name' => ['required', 'string', 'max:150'],
            'organisation' => ['required', 'string', 'max:150'],
            // Optional: a speaker can be entered before their photograph has
            // been supplied, and the panel can clear one. The site falls back
            // to a placeholder -- see frontend/src/lib/portrait.ts.
            'portrait' => ['present', 'nullable', 'string', 'max:255'],
            // In running order: the keynote, the panellists, the moderator
            // and the Master of Ceremonies. "speaker" is a panellist; the name
            // is kept so rows saved before the other roles existed still pass.
            'role' => ['required', Rule::in(['keynote', 'speaker', 'moderator', 'mc'])],
            'placeholder' => ['boolean'],
            'sort_order' => ['integer', 'min:0', 'max:999'],

            'designation' => ['required', 'array'],
            'designation.en' => ['required', 'string', 'max:150'],
            'designation.ms' => ['required', 'string', 'max:150'],
            'designation.zh' => ['required', 'string', 'max:150'],
            'designation.ta' => ['required', 'string', 'max:150'],

            /*
             * Optional. The confirmed line-up arrived with names and titles
             * and no biographies, and inventing one for a real Minister is
             * not a gap worth filling. Empty in every language hides "View
             * profile"; a biography in some languages and not others is
             * still refused, so no reader is shown a blank one.
             */
            'bio' => ['present', 'array'],
            'bio.en' => ['nullable', 'string', 'max:2000'],
            'bio.ms' => ['nullable', 'string', 'max:2000', 'required_with:bio.en'],
            'bio.zh' => ['nullable', 'string', 'max:2000', 'required_with:bio.en'],
            'bio.ta' => ['nullable', 'string', 'max:2000', 'required_with:bio.en'],

            // Optional as a whole, but a link with no address is not a link.
            'link' => ['nullable', 'array'],
            'link.label' => ['required_with:link', 'nullable', 'string', 'max:80'],
            'link.url' => ['required_with:link', 'nullable', 'url', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'id.regex' => 'Use lowercase letters, numbers and hyphens only.',
            'id.unique' => 'Another speaker already uses that id.',
            'designation.*.required' => 'The designation is needed in all four languages.',
            // Optional, but not in one language only: a Tamil reader shown a
            // blank profile beside an English one is worse than none at all.
            'bio.*.required_with' => 'Once the biography is written in one language, it is needed in all four.',
            'link.url.url' => 'Enter a full address, including https://',
        ];
    }

    protected function prepareForValidation(): void
    {
        // An empty link arrives from the form as {label: "", url: ""}. Stored
        // as-is it would render an anchor pointing at the current page.
        $link = $this->input('link');
        if (is_array($link) && blank($link['url'] ?? null) && blank($link['label'] ?? null)) {
            $this->merge(['link' => null]);
        }

        // A removed photograph reaches us as "" from the panel, but null from
        // anything hand-rolled. The column is NOT NULL, so null would pass
        // validation and then fail at the database -- a 500, not a message.
        if ($this->exists('portrait') && blank($this->input('portrait'))) {
            $this->merge(['portrait' => '']);
        }
    }
}
