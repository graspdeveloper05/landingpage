<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** §8 — one timeline row, editable by the organising team. */
class StoreProgrammeItemRequest extends FormRequest
{
    public function rules(): array
    {
        $id = $this->route('programme_item')?->id;

        return [
            'id' => [
                $id ? 'sometimes' : 'required',
                'string',
                'max:40',
                'regex:/^[a-z0-9-]+$/',
                Rule::unique('programme_items', 'id')->ignore($id, 'id'),
            ],
            // 24-hour HH:MM. The client formats it for the visitor's locale,
            // so anything else here reaches the page as raw text.
            'time' => ['required', 'string', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
            'placeholder' => ['boolean'],
            'sort_order' => ['integer', 'min:0', 'max:999'],

            'title' => ['required', 'array'],
            'title.en' => ['required', 'string', 'max:150'],
            'title.ms' => ['required', 'string', 'max:150'],
            'title.zh' => ['required', 'string', 'max:150'],
            'title.ta' => ['required', 'string', 'max:150'],

            // The subtitle is optional, but partial translations are not: a
            // session with an English subtitle and no Tamil one shows a gap
            // to a Tamil reader.
            'detail' => ['nullable', 'array'],
            'detail.en' => ['required_with:detail', 'nullable', 'string', 'max:300'],
            'detail.ms' => ['required_with:detail', 'nullable', 'string', 'max:300'],
            'detail.zh' => ['required_with:detail', 'nullable', 'string', 'max:300'],
            'detail.ta' => ['required_with:detail', 'nullable', 'string', 'max:300'],
        ];
    }

    public function messages(): array
    {
        return [
            'time.regex' => 'Use 24-hour time, for example 14:30.',
            'id.regex' => 'Use lowercase letters, numbers and hyphens only.',
            'title.*.required' => 'The session title is needed in all four languages.',
            'detail.*.required_with' => 'Fill the subtitle in all four languages, or clear it entirely.',
        ];
    }

    protected function prepareForValidation(): void
    {
        // An untouched subtitle arrives as four empty strings; stored that way
        // the timeline renders an empty line under the title.
        $detail = $this->input('detail');
        if (is_array($detail) && blank(implode('', array_map(fn ($v) => (string) $v, $detail)))) {
            $this->merge(['detail' => null]);
        }
    }
}
