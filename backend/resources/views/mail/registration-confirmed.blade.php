@component('mail::message')
# You have a seat

Dear {{ $name }},

Your place at the **Seri Negara Dialogue {{ config('event.edition') }}** is confirmed.

@component('mail::panel')
**Your reference: {{ $reference }}**

Please keep this — you will be asked for it at the door.
@endcomponent

@component('mail::table')
|             |                                            |
| :---------- | :----------------------------------------- |
| **Date**    | {{ \Carbon\Carbon::parse(config('event.date'))->format('j F Y') }} |
| **Time**    | {{ \Carbon\Carbon::parse(config('event.start_time'))->format('g.i A') }} onwards |
| **Venue**   | {{ config('event.venue') }} |
| **Address** | {{ config('event.venue_address') }} |
@endcomponent

@component('mail::button', ['url' => config('event.maps_url')])
Open in Google Maps
@endcomponent

@if ($dietary)
We have noted your dietary requirement: **{{ $dietary }}**.
@endif

If you can no longer attend, please reply to this email so the seat can be
offered to someone else.

Seri Negara Dialogue
Convened by Chevening Alumni Malaysia
@endcomponent
