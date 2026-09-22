<?php

/*
|--------------------------------------------------------------------------
| Organising Chairman — §6 item 03
|--------------------------------------------------------------------------
|
| From the client's feedback of September 2026. The English is the
| chairman's own; Bahasa Malaysia, Chinese and Tamil are drafted and pending
| native review before launch.
|
| `message` is the short welcome on the home page. `letter` is the full
| welcome, shown on the About page -- paragraphs separated by a blank line.
|
| No photograph was supplied, so the portrait stays empty and the site draws
| its stand-in until one is uploaded from the Chairman screen.
|
*/

return [
    'name' => 'Dr. Vighneswaran N. Vithiatharan',
    'organisation' => 'Chevening Alumni Malaysia',

    'designation' => [
        'en' => 'Organising Chairman, Seri Negara Dialogue 2026',
        'ms' => 'Pengerusi Penganjur, Dialog Seri Negara 2026',
        'zh' => '2026 年斯里尼加拉对话筹委会主席',
        'ta' => 'ஏற்பாட்டுத் தலைவர், சேரி நெகாரா உரையாடல் 2026',
    ],

    'message' => [
        'en' => 'Welcome to the Seri Negara Dialogue 2026. Malaysia’s future will not be shaped by silence, or by agreement on everything. It will be shaped by our courage to listen, question honestly and find common purpose across our differences.',
        'ms' => 'Selamat datang ke Dialog Seri Negara 2026. Masa depan Malaysia tidak akan dibentuk oleh kebisuan, atau oleh persetujuan dalam segala hal. Ia akan dibentuk oleh keberanian kita untuk mendengar, mempersoal dengan jujur dan menemui tujuan bersama di sebalik perbezaan kita.',
        'zh' => '欢迎莅临 2026 年斯里尼加拉对话。马来西亚的未来不会由沉默塑造，也不会由凡事一致塑造，而是由我们倾听的勇气、坦诚质疑的勇气，以及跨越分歧寻找共同目标的勇气所塑造。',
        'ta' => 'சேரி நெகாரா உரையாடல் 2026 க்கு வரவேற்கிறோம். மலேசியாவின் எதிர்காலம் மௌனத்தாலோ, எல்லாவற்றிலும் உடன்பாட்டாலோ வடிவமைக்கப்படாது. கேட்கவும், நேர்மையாகக் கேள்வி எழுப்பவும், நமது வேறுபாடுகளைக் கடந்து பொதுவான நோக்கத்தைக் கண்டறியவும் நாம் கொள்ளும் துணிவால்தான் அது வடிவமைக்கப்படும்.',
    ],

    'quote' => [
        'en' => 'Many histories have brought us here. The next chapter is ours to write — together.',
        'ms' => 'Pelbagai sejarah telah membawa kita ke sini. Bab seterusnya milik kita untuk ditulis — bersama-sama.',
        'zh' => '众多历史带领我们来到这里。下一章，由我们共同书写。',
        'ta' => 'பல வரலாறுகள் நம்மை இங்கு கொண்டு வந்துள்ளன. அடுத்த அத்தியாயத்தை நாம் எழுத வேண்டும் — இணைந்து.',
    ],

    'letter' => [
        'en' => implode("\n\n", [
            'Welcome to the Seri Negara Dialogue 2026.',
            'Malaysia’s story has never been a single story. It has been shaped by different histories, communities, struggles and hopes. These differences need not divide us; understood honestly, they can become a source of strength.',
            'As Malaysia approaches Merdeka 70 and looks towards Malaysia 100, we have an opportunity to reflect on the nation we have inherited and ask what kind of nation we wish to leave behind. This requires more than comfortable conversations. It calls for the courage to listen, question long-held assumptions and confront the realities shaping our society.',
            'The Seri Negara Dialogue brings together leaders, thinkers and citizens not to seek agreement on everything, but to find common purpose across our differences. It is a space to rebuild trust, strengthen our shared sense of belonging and consider how each of us can contribute to Malaysia’s next chapter.',
            'I warmly invite you to be part of this important conversation. Come with your experiences, your questions and your hopes for our country.',
            'Many histories have brought us here. The future is ours to shape, together.',
        ]),
        'ms' => implode("\n\n", [
            'Selamat datang ke Dialog Seri Negara 2026.',
            'Kisah Malaysia tidak pernah menjadi satu kisah tunggal. Ia dibentuk oleh pelbagai sejarah, komuniti, perjuangan dan harapan. Perbezaan ini tidak semestinya memecahbelahkan kita; jika difahami dengan jujur, ia boleh menjadi sumber kekuatan.',
            'Ketika Malaysia menghampiri Merdeka 70 dan menuju Malaysia 100, kita berpeluang untuk merenung negara yang telah kita warisi dan bertanya negara bagaimanakah yang ingin kita tinggalkan. Ini memerlukan lebih daripada perbualan yang selesa. Ia menuntut keberanian untuk mendengar, mempersoalkan andaian yang lama dipegang dan berdepan dengan realiti yang membentuk masyarakat kita.',
            'Dialog Seri Negara menghimpunkan pemimpin, pemikir dan rakyat bukan untuk mencari persetujuan dalam segala hal, tetapi untuk menemui tujuan bersama di sebalik perbezaan kita. Ia merupakan ruang untuk membina semula kepercayaan, mengukuhkan rasa kekitaan bersama dan menimbang bagaimana setiap daripada kita dapat menyumbang kepada bab seterusnya Malaysia.',
            'Dengan sukacitanya saya menjemput anda untuk menjadi sebahagian daripada perbualan penting ini. Datanglah dengan pengalaman, persoalan dan harapan anda untuk negara kita.',
            'Pelbagai sejarah telah membawa kita ke sini. Masa depan milik kita untuk dibentuk, bersama-sama.',
        ]),
        'zh' => implode("\n\n", [
            '欢迎莅临 2026 年斯里尼加拉对话。',
            '马来西亚的故事从来不是单一的故事。它由不同的历史、社群、奋斗与希望所塑造。这些差异不必使我们分裂；若能坦诚理解，它们可以成为力量的源泉。',
            '随着马来西亚迈向独立 70 周年、展望建国 100 周年，我们有机会反思我们所继承的国家，并思考我们希望留下一个怎样的国家。这需要的不只是轻松的对话，更需要倾听的勇气、质疑固有观念的勇气，以及正视形塑我们社会之现实的勇气。',
            '斯里尼加拉对话汇聚领袖、思想者与公民，目的不在于凡事达成共识，而在于跨越分歧、寻找共同目标。这是一个重建信任、强化共同归属感，并思考我们每个人如何为马来西亚下一章作出贡献的空间。',
            '我诚挚邀请您参与这场重要的对话。请带着您的经历、您的问题，以及您对我们国家的期望而来。',
            '众多历史带领我们来到这里。未来由我们共同塑造。',
        ]),
        'ta' => implode("\n\n", [
            'சேரி நெகாரா உரையாடல் 2026 க்கு உங்களை வரவேற்கிறோம்.',
            'மலேசியாவின் கதை ஒருபோதும் ஒற்றைக் கதையாக இருந்ததில்லை. அது பல்வேறு வரலாறுகள், சமூகங்கள், போராட்டங்கள் மற்றும் நம்பிக்கைகளால் வடிவமைக்கப்பட்டுள்ளது. இந்த வேறுபாடுகள் நம்மைப் பிரிக்க வேண்டியதில்லை; நேர்மையாகப் புரிந்துகொள்ளப்பட்டால், அவை வலிமையின் ஆதாரமாக மாறலாம்.',
            'மலேசியா மெர்டேக்கா 70 ஐ நெருங்கி, மலேசியா 100 ஐ நோக்கிப் பார்க்கும் இவ்வேளையில், நாம் மரபாகப் பெற்ற தேசத்தைச் சிந்தித்து, எத்தகைய தேசத்தை விட்டுச் செல்ல விரும்புகிறோம் என்று கேட்கும் வாய்ப்பு நமக்கு உள்ளது. இதற்கு வசதியான உரையாடல்களைவிட மேலானது தேவை. கேட்கவும், நீண்டகால அனுமானங்களைக் கேள்விக்குட்படுத்தவும், நமது சமூகத்தை வடிவமைக்கும் யதார்த்தங்களை எதிர்கொள்ளவும் துணிவு தேவை.',
            'சேரி நெகாரா உரையாடல், எல்லாவற்றிலும் உடன்பாட்டைத் தேடுவதற்காக அல்ல, மாறாக நமது வேறுபாடுகளைக் கடந்து பொதுவான நோக்கத்தைக் கண்டறிவதற்காகத் தலைவர்கள், சிந்தனையாளர்கள் மற்றும் குடிமக்களை ஒன்றிணைக்கிறது. நம்பிக்கையை மீண்டும் கட்டியெழுப்பவும், நமது பகிர்ந்த சொந்த உணர்வை வலுப்படுத்தவும், மலேசியாவின் அடுத்த அத்தியாயத்திற்கு நாம் ஒவ்வொருவரும் எவ்வாறு பங்களிக்கலாம் என்று சிந்திக்கவும் இது ஒரு களம்.',
            'இந்த முக்கியமான உரையாடலின் ஒரு பகுதியாக இருக்க உங்களை அன்புடன் அழைக்கிறேன். உங்கள் அனுபவங்களோடும், கேள்விகளோடும், நமது நாட்டுக்கான நம்பிக்கைகளோடும் வாருங்கள்.',
            'பல வரலாறுகள் நம்மை இங்கு கொண்டு வந்துள்ளன. எதிர்காலம் நாம் இணைந்து வடிவமைக்க வேண்டியது.',
        ]),
    ],
];
