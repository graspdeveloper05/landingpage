<?php

namespace App\Http\Requests;

use App\Models\Survey;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** A survey's heading. English is required; other languages fall back to it. */
class StoreSurveyRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'array'],
            'title.en' => ['required', 'string', 'max:150'],
            'title.ms' => ['nullable', 'string', 'max:150'],
            'title.zh' => ['nullable', 'string', 'max:150'],
            'title.ta' => ['nullable', 'string', 'max:150'],

            'description' => ['nullable', 'array'],
            'description.*' => ['nullable', 'string', 'max:500'],

            'form_type' => ['sometimes', Rule::in(Survey::FORM_TYPES)],
            'status' => ['sometimes', Rule::in(Survey::STATUSES)],

            // A fixed short link ("pre-event") for a QR code printed early.
            'slug' => [
                'nullable', 'string', 'max:60', 'regex:/^[a-z0-9]+(-[a-z0-9]+)*$/',
                Rule::unique('surveys', 'slug')->ignore($this->route('survey')),
            ],

            // The details asked before the questions, each required,
            // optional or not asked; and a note shown beside them.
            'fields' => ['sometimes', 'nullable', 'array'],
            'fields.*' => [Rule::in(Survey::DETAIL_MODES)],
            'details_note' => ['nullable', 'array'],
            'details_note.*' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.en.required' => 'The title is needed in English.',
            'slug.regex' => 'Use lowercase letters, numbers and dashes, like pre-event.',
            'slug.unique' => 'Another form already uses this short link.',
        ];
    }

    protected function prepareForValidation(): void
    {
        // An untouched description or note arrives as four empty strings.
        foreach (['description', 'details_note'] as $key) {
            $value = $this->input($key);
            if (is_array($value) && blank(implode('', array_map(fn ($v) => (string) $v, $value)))) {
                $this->merge([$key => null]);
            }
        }

        if ($this->has('slug')) {
            $slug = strtolower(trim((string) $this->input('slug')));
            $this->merge(['slug' => $slug === '' ? null : $slug]);
        }

        // Only the details there are, in a fixed order.
        if (is_array($this->input('fields'))) {
            $this->merge(['fields' => array_intersect_key($this->input('fields'), array_flip(Survey::DETAILS))]);
        }
    }
}
