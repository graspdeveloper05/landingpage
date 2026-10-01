{{--
  The confirmation an attendee receives after registering on the website.

  Built for email clients, not browsers: tables for layout, every style
  inline, web-safe fonts (Georgia stands in for the site's Playfair Display),
  and images by absolute address, since an email cannot load them relative
  to anything. Colours are the site's: navy #0B2140, gold #C9A227, cream
  #F3F1EC.
--}}
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>Your place at Seri Negara Dialogue {{ $edition }}</title>
</head>
<body style="margin:0;padding:0;background:#F3F1EC;">
{{-- Preview line shown beside the subject in the inbox. --}}
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your reference is {{ $reference }}. {{ $date }}, {{ $venue }}.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F3F1EC;">
<tr><td align="center" style="padding:32px 12px;">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#FFFFFF;border:1px solid #E3DED3;">

  {{-- Header: the emblem and the name, on the site's navy. --}}
  <tr>
    <td align="center" style="background:#0B2140;padding:32px 24px 26px;">
      <img src="{{ $assets }}/brand/emblem-gold.png" width="88" height="66" alt="" style="display:block;border:0;width:88px;height:66px;">
      <div style="margin-top:14px;font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:5px;color:#FCFBF9;text-transform:uppercase;">Seri Negara</div>
      <div style="margin-top:6px;font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:6px;color:#C9A227;text-transform:uppercase;">&mdash;&nbsp; Dialogue {{ $edition }} &nbsp;&mdash;</div>
    </td>
  </tr>
  <tr><td style="height:4px;background:#C9A227;line-height:4px;font-size:0;">&nbsp;</td></tr>

  {{-- Greeting --}}
  <tr>
    <td style="padding:36px 40px 8px;font-family:Georgia,'Times New Roman',serif;">
      <div style="font-size:30px;line-height:1.2;color:#0B2140;">You have a seat.</div>
      <div style="margin-top:18px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#33445C;">
        Dear <strong style="color:#0B2140;">{{ $name }}</strong>,<br><br>
        Thank you for registering. Your place at the <strong style="color:#0B2140;">Seri Negara Dialogue {{ $edition }}</strong> is confirmed &mdash; a national conversation on Malaysia&rsquo;s future.
      </div>
    </td>
  </tr>

  {{-- The reference, the thing they will be asked for. --}}
  <tr>
    <td style="padding:22px 40px 6px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0B2140;">
        <tr>
          <td align="center" style="padding:22px 16px;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:3px;color:#C9D2DE;text-transform:uppercase;">Your reference</div>
            <div style="margin-top:8px;font-family:Georgia,'Times New Roman',serif;font-size:32px;letter-spacing:2px;color:#E2C46A;">{{ $reference }}</div>
            <div style="margin-top:8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#C9D2DE;">Please keep this &mdash; you will be asked for it at the door.</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  {{-- When and where --}}
  <tr>
    <td style="padding:24px 40px 4px;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:3px;color:#8A6912;text-transform:uppercase;">Event details</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#0B2140;">
        <tr>
          <td width="96" valign="top" style="padding:11px 0;border-top:1px solid #E3DED3;color:#33445C;font-weight:bold;">Date</td>
          <td valign="top" style="padding:11px 0;border-top:1px solid #E3DED3;font-weight:600;">{{ $date }}</td>
        </tr>
        <tr>
          <td width="96" valign="top" style="padding:11px 0;border-top:1px solid #E3DED3;color:#33445C;font-weight:bold;">Time</td>
          <td valign="top" style="padding:11px 0;border-top:1px solid #E3DED3;font-weight:600;">{{ $time }}</td>
        </tr>
        <tr>
          <td width="96" valign="top" style="padding:11px 0;border-top:1px solid #E3DED3;border-bottom:1px solid #E3DED3;color:#33445C;font-weight:bold;">Venue</td>
          <td valign="top" style="padding:11px 0;border-top:1px solid #E3DED3;border-bottom:1px solid #E3DED3;font-weight:600;">
            {{ $venue }}<br>
            <span style="font-size:13px;font-weight:normal;color:#6A7587;">{{ $address }}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  {{-- Directions --}}
  <tr>
    <td align="center" style="padding:24px 40px 8px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="background:#C9A227;">
            <a href="{{ $mapsUrl }}" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:800;letter-spacing:2px;color:#0B2140;text-decoration:none;text-transform:uppercase;">Get directions</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:20px 40px 32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#33445C;">
      Please arrive a little early to register at the door.
      @if ($dietary)
        <br>We have noted your dietary requirement: <strong style="color:#0B2140;">{{ $dietary }}</strong>.
      @endif
      <br><br>
      If you can no longer attend, simply reply to this email so your seat can be offered to someone else.
    </td>
  </tr>

  {{-- Footer: who convenes it, centred under the letter. --}}
  <tr>
    <td align="center" style="background:#F3F1EC;border-top:1px solid #E3DED3;padding:26px 40px 28px;">
      <img src="{{ $assets }}/partners/chevening-alumni-malaysia.png" width="48" height="70" alt="Chevening Alumni Malaysia" style="display:block;margin:0 auto;border:0;width:48px;height:70px;">
      <div style="margin-top:12px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8A6912;">Convened by</div>
      <div style="margin-top:4px;font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#0B2140;">Chevening Alumni Malaysia</div>
      <div style="margin-top:6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;"><a href="{{ $siteUrl }}" style="color:#33445C;font-weight:bold;">serinegaradialogue.org</a></div>
    </td>
  </tr>
</table>

<div style="max-width:600px;margin:14px auto 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#8D97A6;text-align:center;">
  You are receiving this because you registered for the Seri Negara Dialogue {{ $edition }}.
</div>

</td></tr>
</table>
</body>
</html>
