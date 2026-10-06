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
                'required', 'array', 'min:'.($this->allowsSingleTickbox() ? 1 : 2), 'max:15',
            ],
            'options.*' => ['array'],
            'options.*.en' => ['required', 'string', 'max:150'],
            'options.*.ms' => ['nullable', 'string', 'max:150'],
            'options.*.zh' => ['nullable', 'string', 'max:150'],
            'options.*.ta' => ['nullable', 'string', 'max:150'],

            'is_required' => ['sometimes', 'boolean'],
            'status' => ['sometimes', Rule::in(Survey::STATUSES)],

            // A note under the question, and a section heading that starts a
            // new page at this question.
            'help' => ['nullable', 'array'],
            'help.*' => ['nullable', 'string', 'max:300'],
            'section' => ['nullable', 'array'],
            'section.title' => ['nullable', 'array'],
            'section.title.en' => ['required_with:section', 'string', 'max:120'],
            'section.title.*' => ['nullable', 'string', 'max:120'],
            'section.intro' => ['nullable', 'array'],
            'section.intro.*' => ['nullable', 'string', 'max:300'],

            // A statement table: the statements; its options are the scale.
            'statements' => [
                Rule::excludeIf($this->input('type') !== 'grid'),
                'required', 'array', 'min:1', 'max:10',
            ],
            'statements.*' => ['array'],
            'statements.*.en' => ['required', 'string', 'max:200'],
            'statements.*.*' => ['nullable', 'string', 'max:200'],

            'layout' => ['nullable', Rule::in(SurveyQuestion::LAYOUTS)],
            'max_choices' => ['nullable', 'integer', 'min:1', 'max:10'],
            'has_other' => ['sometimes', 'boolean'],
            'max_length' => ['nullable', 'integer', 'min:10', 'max:2000'],
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
            'statements.required' => 'A statement table needs at least one statement.',
            'statements.*.en.required' => 'Each statement needs English text.',
            'section.title.en.required_with' => 'The section heading is needed in English.',
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

    /**
     * The validated fields, with each setting kept only where it means
     * something: options for choices, statements for a table, a scale for a
     * single choice, a maximum for checkboxes, a limit for written answers.
     */
    public function toQuestion(): array
    {
        $data = $this->validated();
        $type = $data['type'];
        $data['options'] = in_array($type, SurveyQuestion::WITH_OPTIONS, true)
            ? array_values($data['options'])
            : null;
        $data['statements'] = $type === 'grid' ? array_values($data['statements']) : null;
        $data['layout'] = $type === 'choice' && ($data['layout'] ?? null) === 'scale' ? 'scale' : null;
        $data['max_choices'] = $type === 'checkbox' ? ($data['max_choices'] ?? null) : null;
        $data['has_other'] = in_array($type, ['choice', 'checkbox'], true) && ($data['has_other'] ?? false);
        $data['max_length'] = $type === 'text' ? ($data['max_length'] ?? null) : null;

        foreach (['help'] as $key) {
            if (array_key_exists($key, $data) && blank(implode('', array_map(fn ($v) => (string) $v, (array) $data[$key])))) {
                $data[$key] = null;
            }
        }

        return $data;
    }

    protected function prepareForValidation(): void
    {
        // A section with no heading is no section.
        $section = $this->input('section');
        if (is_array($section) && blank($section['title']['en'] ?? null)) {
            $this->merge(['section' => null]);
        }
    }
}
