<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $edition = (int) config('event.edition');

        return [
            'fullName' => ['required', 'string', 'min:2', 'max:120'],

            'email' => [
                'required',
                // Shape only, not a live DNS lookup: MX checks fail offline,
                // time out under load, and reject valid but unusual domains.
                // A wrong address surfaces when the confirmation bounces.
                'email:rfc,filter',
                'max:190',
                // One seat per email per edition — the 200 places are finite.
                Rule::unique('registrations', 'email')->where('edition', $edition),
            ],

            // Malaysian mobiles run 9–11 digits; +60 and international guests
            // are both accepted, so this checks shape rather than country.
            'mobile' => ['required', 'string', 'regex:/^\+?[0-9\s\-]{8,16}$/'],

            'organisation' => ['required', 'string', 'max:150'],
            'designation' => ['required', 'string', 'max:150'],
            'dietary' => ['nullable', 'string', 'max:255'],

            // §12 — PDPA acknowledgement is not optional.
            'pdpaAccepted' => ['accepted'],

            // Honeypot: a real person never fills a hidden field. Anything
            // here is a bot, and the controller drops the request silently.
            'website' => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        return [
            'fullName.required' => 'Enter your full name.',
            'email.required' => 'Enter a valid email address.',
            'email.email' => 'Enter a valid email address.',
            'email.unique' => 'This email address is already registered.',
            'mobile.required' => 'Enter a valid mobile number.',
            'mobile.regex' => 'Enter a valid mobile number.',
            'organisation.required' => 'Enter your organisation.',
            'designation.required' => 'Enter your designation.',
            'pdpaAccepted.accepted' => 'Tick the box to continue.',
        ];
    }

    /**
     * Maps the camelCase the frontend sends onto the snake_case columns.
     */
    public function toRegistration(): array
    {
        return [
            'full_name' => trim($this->string('fullName')),
            'email' => strtolower(trim($this->string('email'))),
            'mobile' => preg_replace('/\s+/', ' ', trim($this->string('mobile'))),
            'organisation' => trim($this->string('organisation')),
            'designation' => trim($this->string('designation')),
            'dietary' => $this->filled('dietary') ? trim($this->string('dietary')) : null,
            'pdpa_accepted' => true,
            'pdpa_accepted_at' => now(),
        ];
    }
}
