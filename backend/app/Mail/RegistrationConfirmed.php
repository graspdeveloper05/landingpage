<?php

namespace App\Mail;

use App\Models\EventSetting;
use App\Models\Registration;
use Carbon\Carbon;
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
        /*
         * The details as the team keeps them in the panel, not as the code
         * shipped them: a venue or start time edited in Admin → Event must be
         * what the attendee is told, or the email and the website disagree.
         * config/event.php answers only if the settings row is missing.
         */
        $event = EventSetting::find($this->registration->edition);
        $date = Carbon::parse($event?->date ?? config('event.date'));
        $time = Carbon::parse($event?->start_time ?? config('event.start_time'));

        return new Content(
            markdown: 'mail.registration-confirmed',
            with: [
                'reference' => $this->registration->reference,
                'name' => $this->registration->full_name,
                'dietary' => $this->registration->dietary,
                'edition' => $this->registration->edition,
                'date' => $event?->date_label['en'] ?? $date->format('j F Y (l)'),
                'time' => $event?->time_label['en'] ?? $time->format('g.i A').' onwards',
                'venue' => $event?->venue ?? config('event.venue'),
                'address' => $event?->venue_address ?? config('event.venue_address'),
                'mapsUrl' => $event?->maps_url ?? config('event.maps_url'),
            ],
        );
    }
}
