<?php

namespace App\Http\Requests;

use App\Models\Survey;
use App\Models\SurveyQuestion;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreSurveyQuestionRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(SurveyQuestion::TYPES)],

            'question' => ['required', 'array'],
            'question.en' => ['required', 'string', 'max:300'],
            'question.ms' => ['nullable', 'string', 'max:300'],
            'question.zh' => ['nullable', 'string', 'max:300'],
            'question.ta' => ['nullable', 'string', 'max:300'],

            'options' => ['exclude_unless:type,choice', 'required', 'array', 'min:2', 'max:10'],
            'options.*' => ['array'],
            'options.*.en' => ['required', 'string', 'max:150'],
            'options.*.ms' => ['nullable', 'string', 'max:150'],
            'options.*.zh' => ['nullable', 'string', 'max:150'],
            'options.*.ta' => ['nullable', 'string', 'max:150'],

            'is_required' => ['sometimes', 'boolean'],
            'status' => ['sometimes', Rule::in(Survey::STATUSES)],
        ];
    }

    public function messages(): array
    {
        return [
            'question.en.required' => 'The question is needed in English.',
            'options.required' => 'A multiple-choice question needs at least two options.',
            'options.min' => 'A multiple-choice question needs at least two options.',
            'options.*.en.required' => 'Each option needs English text.',
        ];
    }

    /**
     * Once people have answered, an answer "0" means "the first option as it
     * was". Reordering, adding, removing or changing the type would make old
     * answers point at something else, so only the wording may change.
     */
    public function after(): array
    {
        return [function (Validator $validator) {
            $question = $this->route('question');
            if (! $question instanceof SurveyQuestion || ! $question->responses()->exists()) {
                return;
            }

            if ($this->input('type') !== $question->type) {
                $validator->errors()->add('type', 'People have answered this question, so its type cannot change.');
            }

            if ($question->type === 'choice') {
                $before = array_map(fn ($o) => $o['en'] ?? '', $question->options ?? []);
                $after = array_map(fn ($o) => $o['en'] ?? '', (array) $this->input('options', []));
                if (count($before) !== count($after) || $this->reordered($before, $after)) {
                    $validator->errors()->add('options', 'People have answered this question. Options can be reworded or translated, not added, removed or reordered.');
                }
            }
        }];
    }

    /** True when an English label that existed now sits at a different index. */
    private function reordered(array $before, array $after): bool
    {
        foreach ($before as $i => $label) {
            $at = array_search($label, $after, true);
            if ($at !== false && $at !== $i) {
                return true;
            }
        }

        return false;
    }

    /** The validated fields, with options cleared for non-choice types. */
    public function toQuestion(): array
    {
        $data = $this->validated();
        $data['options'] = $data['type'] === 'choice' ? array_values($data['options']) : null;

        return $data;
    }
}
