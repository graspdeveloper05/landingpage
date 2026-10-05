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

            'status' => ['sometimes', Rule::in(Survey::STATUSES)],
        ];
    }

    public function messages(): array
    {
        return ['title.en.required' => 'The title is needed in English.'];
    }

    protected function prepareForValidation(): void
    {
        // An untouched description arrives as four empty strings.
        $description = $this->input('description');
        if (is_array($description) && blank(implode('', array_map(fn ($v) => (string) $v, $description)))) {
            $this->merge(['description' => null]);
        }
    }
}
