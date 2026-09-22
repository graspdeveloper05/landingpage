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
| PHOTOGRAPHS: only the MC's is set. The client supplied seven photographs
| with no names attached, and only hers carries a printed name. The other six
| are left on the stand-in until the organising team confirms which photo is
| whom -- a Minister shown with someone else's face is not a mistake worth
| risking to save a day. Upload each one from the Speakers screen.
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
            'portrait' => '',
            'bio' => $none,
            'role' => 'keynote',
        ],
        [
            'id' => 'nazir-razak',
            'name' => 'Tan Sri Nazir Razak',
            'designation' => ['en' => 'Chairman', 'ms' => 'Pengerusi', 'zh' => '主席', 'ta' => 'தலைவர்'],
            'organisation' => 'Yayasan Tun Razak',
            'portrait' => '',
            'bio' => $none,
            'role' => 'speaker',
        ],
        [
            'id' => 'ruzina-hasan',
            'name' => 'H.E. Ruzina Hasan',
            'designation' => ['en' => 'Acting Deputy British High Commissioner to Malaysia', 'ms' => 'Pemangku Timbalan Pesuruhjaya Tinggi British ke Malaysia', 'zh' => '英国驻马来西亚代理副高级专员', 'ta' => 'மலேசியாவுக்கான பிரிட்டிஷ் பதில் துணை உயர் ஸ்தானிகர்'],
            'organisation' => 'British High Commission Kuala Lumpur',
            'portrait' => '',
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
            'portrait' => '',
            'bio' => $none,
            'role' => 'speaker',
        ],
        [
            'id' => 'aira-azhari',
            'name' => 'Ms Aira Azhari',
            'designation' => ['en' => 'Chief Executive Officer', 'ms' => 'Ketua Pegawai Eksekutif', 'zh' => '首席执行官', 'ta' => 'தலைமை நிர்வாக அதிகாரி'],
            'organisation' => 'IDEAS',
            'portrait' => '',
            'bio' => $none,
            'role' => 'speaker',
        ],
        [
            'id' => 'jason-wee',
            'name' => 'Jason Wee',
            'designation' => ['en' => 'Co-Founder', 'ms' => 'Pengasas Bersama', 'zh' => '联合创办人', 'ta' => 'இணை நிறுவனர்'],
            'organisation' => 'Architects of Diversity',
            'portrait' => '',
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
