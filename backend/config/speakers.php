<?php

/*
|--------------------------------------------------------------------------
| Speakers — §7
|--------------------------------------------------------------------------
|
| The confirmed line-up, from the client's feedback of September 2026.
| Names, titles and organisations are theirs, in English; the Bahasa
| Malaysia, Chinese and Tamil designations are drafted and pending review.
|
| Roles, in running order:
|   keynote    the Keynote Address
|   speaker    a panellist
|   moderator  the moderator
|   mc         the Master of Ceremonies
|
| PHOTOGRAPHS: the client's seven arrived as an unlabelled collage; only the
| MC's carries a printed name. The other six are matched by the order they
| were added to the client's deck -- Picture 4, 8, 10, 12, 14, 16, then the
| MC as 18 -- which is the order of the names on the slide before it, the MC
| last in both. That is evidence from how the file was built, not from
| anyone's face, and it is strong; it is still not the client saying so.
| `photo_confirmed => false` marks each until they do, and the placeholder
| audit refuses a launch while any remains. Set it to true once confirmed.
|
| BIOGRAPHIES: none were supplied, and none are invented for real people.
| An empty biography hides "View profile" rather than showing a stub.
|
*/

$none = ['en' => '', 'ms' => '', 'zh' => '', 'ta' => ''];

return [
    'list' => [
        [
            'id' => 'aaron-ago-dagang',
            'name' => 'YB Datuk Aaron Ago Dagang',
            'designation' => ['en' => 'Minister of National Unity', 'ms' => 'Menteri Perpaduan Negara', 'zh' => '国家团结部长', 'ta' => 'தேசிய ஒற்றுமை அமைச்சர்'],
            'organisation' => 'Ministry of National Unity',
            'portrait' => '/portraits/aaron-ago-dagang.jpg',
            'photo_confirmed' => false,
            'bio' => $none,
            'role' => 'keynote',
        ],
        [
            'id' => 'nazir-razak',
            'name' => 'Tan Sri Nazir Razak',
            'designation' => ['en' => 'Chairman', 'ms' => 'Pengerusi', 'zh' => '主席', 'ta' => 'தலைவர்'],
            'organisation' => 'Yayasan Tun Razak',
            'portrait' => '/portraits/nazir-razak.jpg',
            'photo_confirmed' => false,
            'bio' => $none,
            'role' => 'speaker',
        ],
        [
            'id' => 'ruzina-hasan',
            'name' => 'H.E. Ruzina Hasan',
            'designation' => ['en' => 'Acting Deputy British High Commissioner to Malaysia', 'ms' => 'Pemangku Timbalan Pesuruhjaya Tinggi British ke Malaysia', 'zh' => '英国驻马来西亚代理副高级专员', 'ta' => 'மலேசியாவுக்கான பிரிட்டிஷ் பதில் துணை உயர் ஸ்தானிகர்'],
            'organisation' => 'British High Commission Kuala Lumpur',
            'portrait' => '/portraits/ruzina-hasan.jpg',
            'photo_confirmed' => false,
            'bio' => $none,
            'role' => 'speaker',
        ],
        [
            'id' => 'syahredzan-johan',
            'name' => 'YB Syahredzan Johan',
            'designation' => ['en' => 'Member of Parliament for Bangi', 'ms' => 'Ahli Parlimen Bangi', 'zh' => '万宜国会议员', 'ta' => 'பாங்கி நாடாளுமன்ற உறுப்பினர்'],
            // The client gave the constituency only. "Parliament of Malaysia"
            // is where a Member for Bangi sits, not a claim about anything else.
            'organisation' => 'Parliament of Malaysia',
            'portrait' => '/portraits/syahredzan-johan.jpg',
            'photo_confirmed' => false,
            'bio' => $none,
            'role' => 'speaker',
        ],
        [
            'id' => 'aira-azhari',
            'name' => 'Ms Aira Azhari',
            'designation' => ['en' => 'Chief Executive Officer', 'ms' => 'Ketua Pegawai Eksekutif', 'zh' => '首席执行官', 'ta' => 'தலைமை நிர்வாக அதிகாரி'],
            'organisation' => 'IDEAS',
            'portrait' => '/portraits/aira-azhari.jpg',
            'photo_confirmed' => false,
            'bio' => $none,
            'role' => 'speaker',
        ],
        [
            'id' => 'jason-wee',
            'name' => 'Jason Wee',
            'designation' => ['en' => 'Co-Founder', 'ms' => 'Pengasas Bersama', 'zh' => '联合创办人', 'ta' => 'இணை நிறுவனர்'],
            'organisation' => 'Architects of Diversity',
            'portrait' => '/portraits/jason-wee.jpg',
            'photo_confirmed' => false,
            'bio' => $none,
            'role' => 'moderator',
        ],
        [
            'id' => 'nurfarahanim-che-mansor',
            'name' => 'Ms Nurfarahanim Che Mansor',
            // "Committee Member" is printed on the photograph the client sent.
            'designation' => ['en' => 'Committee Member', 'ms' => 'Ahli Jawatankuasa', 'zh' => '委员会成员', 'ta' => 'குழு உறுப்பினர்'],
            'organisation' => 'Chevening Alumni Malaysia',
            // Cropped from the promotional graphic, the only one with a name on it.
            'portrait' => '/portraits/nurfarahanim-che-mansor.jpg',
            'bio' => $none,
            'role' => 'mc',
        ],
    ],
];
