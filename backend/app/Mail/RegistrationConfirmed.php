<?php

namespace App\Mail;

use App\Models\Registration;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/** §9 — "The system should provide automated confirmation." */
class RegistrationConfirmed extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Registration $registration) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: sprintf(
                'Your place at Seri Negara Dialogue %d — %s',
                $this->registration->edition,
                $this->registration->reference,
            ),
            replyTo: [new Address(config('event.contact_email'), 'Seri Negara Dialogue')],
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.registration-confirmed',
            with: [
                'reference' => $this->registration->reference,
                'name' => $this->registration->full_name,
                'dietary' => $this->registration->dietary,
            ],
        );
    }
}
