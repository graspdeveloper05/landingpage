<?php

/*
|--------------------------------------------------------------------------
| Speakers and moderator — §7
|--------------------------------------------------------------------------
|
| PLACEHOLDER: every person below is invented. Replace with the confirmed
| line-up before this API serves anything public. `designation` and `bio` are
| keyed by locale to match the four languages the site offers (§3).
|
| `link` is §7's "relevant official external link" — the frontend opens it in
| a new tab, and §10 asks that speakers' organisations be reachable this way.
|
*/

$tbc = [
    'en' => 'Biography to be confirmed by the organising team.',
    'ms' => 'Biografi akan disahkan oleh pihak penganjur.',
    'zh' => '简介待筹委会确认。',
    'ta' => 'வாழ்க்கைக் குறிப்பு ஏற்பாட்டுக் குழுவால் உறுதி செய்யப்படும்.',
];

return [
    'list' => [
        [
            'id' => 'sp-01',
            'name' => 'Tan Sri Dr. Zulkifli bin Mahmud',
            'designation' => ['en' => 'Former President', 'ms' => 'Bekas Presiden', 'zh' => '前任主席', 'ta' => 'முன்னாள் தலைவர்'],
            'organisation' => 'Institute of Public Administration Malaysia',
            'portrait' => '/portraits/placeholder-01.svg',
            'bio' => $tbc,
            'link' => null,
            'role' => 'speaker',
            'placeholder' => true,
        ],
        [
            'id' => 'sp-02',
            'name' => 'Datin Sri Cheah Su Lin',
            'designation' => ['en' => 'Chief Executive Officer', 'ms' => 'Ketua Pegawai Eksekutif', 'zh' => '首席执行官', 'ta' => 'தலைமை நிர்வாக அதிகாரி'],
            'organisation' => 'Nusantara Capital Group',
            'portrait' => '/portraits/placeholder-02.svg',
            'bio' => $tbc,
            'link' => null,
            'role' => 'speaker',
            'placeholder' => true,
        ],
        [
            'id' => 'sp-03',
            'name' => 'Professor Dr. Meena Ramakrishnan',
            'designation' => ['en' => 'Academic and Author', 'ms' => 'Ahli Akademik dan Penulis', 'zh' => '学者兼作家', 'ta' => 'கல்வியாளர் மற்றும் எழுத்தாளர்'],
            'organisation' => 'Faculty of Social Sciences, Universiti Malaya',
            'portrait' => '/portraits/placeholder-03.svg',
            'bio' => $tbc,
            'link' => null,
            'role' => 'speaker',
            'placeholder' => true,
        ],
        [
            'id' => 'sp-04',
            'name' => 'Puan Sharifah Aminah binti Yusof',
            'designation' => ['en' => 'Social Leader', 'ms' => 'Pemimpin Sosial', 'zh' => '社会领袖', 'ta' => 'சமூகத் தலைவர்'],
            'organisation' => 'Yayasan Harmoni Malaysia',
            'portrait' => '/portraits/placeholder-04.svg',
            'bio' => $tbc,
            'link' => null,
            'role' => 'speaker',
            'placeholder' => true,
        ],
        [
            'id' => 'sp-05',
            'name' => 'Encik Daniel Tan Chee Meng',
            'designation' => ['en' => 'Policy Expert', 'ms' => 'Pakar Dasar', 'zh' => '政策专家', 'ta' => 'கொள்கை நிபுணர்'],
            'organisation' => 'Institute of Strategic and International Studies',
            'portrait' => '/portraits/placeholder-05.svg',
            'bio' => $tbc,
            'link' => null,
            'role' => 'speaker',
            'placeholder' => true,
        ],
        [
            'id' => 'sp-06',
            'name' => 'Cik Nur Aisyah binti Roslan',
            'designation' => ['en' => 'Youth Leader', 'ms' => 'Pemimpin Belia', 'zh' => '青年领袖', 'ta' => 'இளையோர் தலைவர்'],
            'organisation' => 'Suara Belia Malaysia',
            'portrait' => '/portraits/placeholder-06.svg',
            'bio' => $tbc,
            'link' => null,
            'role' => 'speaker',
            'placeholder' => true,
        ],
        [
            'id' => 'sp-07',
            'name' => 'Dato’ Vijay Kumar Selvarajah',
            'designation' => ['en' => 'Business Leader', 'ms' => 'Pemimpin Perniagaan', 'zh' => '商界领袖', 'ta' => 'வணிகத் தலைவர்'],
            'organisation' => 'Selvarajah Group Holdings',
            'portrait' => '/portraits/placeholder-07.svg',
            'bio' => $tbc,
            'link' => null,
            'role' => 'speaker',
            'placeholder' => true,
        ],
        [
            'id' => 'mod-01',
            'name' => 'Ms. Melissa Chong Wai Yee',
            'designation' => ['en' => 'Moderator', 'ms' => 'Moderator', 'zh' => '主持人', 'ta' => 'நெறியாளர்'],
            'organisation' => 'Independent Broadcast Journalist',
            'portrait' => '/portraits/placeholder-08.svg',
            'bio' => $tbc,
            'link' => null,
            'role' => 'moderator',
            'placeholder' => true,
        ],
    ],
];
