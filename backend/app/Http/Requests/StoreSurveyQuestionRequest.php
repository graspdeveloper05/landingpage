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

            'options' => [
                Rule::excludeIf(! in_array($this->input('type'), SurveyQuestion::WITH_OPTIONS, true)),
                'required', 'array', 'min:'.($this->allowsSingleTickbox() ? 1 : 2), 'max:10',
            ],
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
        $tooFew = $this->allowsSingleTickbox()
            ? 'A checkbox question needs at least one option.'
            : 'This question needs at least two options.';

        return [
            'question.en.required' => 'The question is needed in English.',
            'options.required' => $tooFew,
            'options.min' => $tooFew,
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

            if ($question->hasOptions()) {
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

    /**
     * A checkbox with one option -- a single tickbox, such as consent to
     * publish a testimonial -- is for feedback forms only. Everywhere else a
     * question offers at least two options to choose between.
     */
    private function allowsSingleTickbox(): bool
    {
        $survey = $this->route('survey') ?? $this->route('question')?->survey;

        return $this->input('type') === 'checkbox' && $survey?->form_type === 'feedback';
    }

    /** The validated fields, with options cleared for non-choice types. */
    public function toQuestion(): array
    {
        $data = $this->validated();
        $data['options'] = in_array($data['type'], SurveyQuestion::WITH_OPTIONS, true)
            ? array_values($data['options'])
            : null;

        return $data;
    }
}
