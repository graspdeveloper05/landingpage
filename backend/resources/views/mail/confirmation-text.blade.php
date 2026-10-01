{{-- Plain-text version, for mail apps that show no HTML and for spam filters,
     which trust a message more when it has one. --}}
You have a seat.

Dear {{ $name }},

Thank you for registering. Your place at the Seri Negara Dialogue {{ $edition }} is confirmed.

YOUR REFERENCE: {{ $reference }}
Please keep this - you will be asked for it at the door.

Date:  {{ $date }}
Time:  {{ $time }}
Venue: {{ $venue }}
       {{ $address }}

Directions: {{ $mapsUrl }}

Please arrive a little early to register at the door.
@if ($dietary)
We have noted your dietary requirement: {{ $dietary }}.
@endif

If you can no longer attend, simply reply to this email so your seat can be offered to someone else.

Seri Negara Dialogue
Convened by Chevening Alumni Malaysia
{{ $siteUrl }}
