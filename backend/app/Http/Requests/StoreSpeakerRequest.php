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
            'portrait' => ['required', 'string', 'max:255'],
            'role' => ['required', Rule::in(['speaker', 'moderator'])],
            'placeholder' => ['boolean'],
            'sort_order' => ['integer', 'min:0', 'max:999'],

            'designation' => ['required', 'array'],
            'designation.en' => ['required', 'string', 'max:150'],
            'designation.ms' => ['required', 'string', 'max:150'],
            'designation.zh' => ['required', 'string', 'max:150'],
            'designation.ta' => ['required', 'string', 'max:150'],

            'bio' => ['required', 'array'],
            'bio.en' => ['required', 'string', 'max:2000'],
            'bio.ms' => ['required', 'string', 'max:2000'],
            'bio.zh' => ['required', 'string', 'max:2000'],
            'bio.ta' => ['required', 'string', 'max:2000'],

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
            'bio.*.required' => 'The biography is needed in all four languages.',
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
    }
}
