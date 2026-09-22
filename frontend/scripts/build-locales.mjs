import fs from 'node:fs'

/* ============================================================================
 * Single source for all four languages, so the files can never drift apart.
 * Every leaf is [en, ms, zh, ta]; arrays of leaves become arrays of strings.
 *
 *   node scripts/build-locales.mjs
 *
 * English and Bahasa Malaysia are authored. Chinese and Tamil are
 * machine-translated and flagged for human review in each output file.
 * ==========================================================================*/

const L = (en, ms, zh, ta) => ({ __leaf: true, en, ms, zh, ta })

const src = {
  meta: {
    name: L('English', 'Bahasa Malaysia', '中文', 'தமிழ்'),
    short: L('EN', 'BM', '中文', 'தமிழ்'),
    htmlLang: L('en', 'ms', 'zh-Hans', 'ta'),
  },

  nav: {
    home: L('Home', 'Utama', '首页', 'முகப்பு'),
    about: L('About', 'Mengenai', '关于', 'அறிமுகம்'),
    speakers: L('Speakers', 'Pembentang', '讲者', 'உரையாளர்கள்'),
    programme: L('Programme', 'Atur Cara', '议程', 'நிகழ்ச்சி நிரல்'),
    rsvp: L('RSVP', 'RSVP', '报名', 'பதிவு'),
    menu: L('Menu', 'Menu', '选单', 'பட்டி'),
    close: L('Close', 'Tutup', '关闭', 'மூடு'),
    language: L('Language', 'Bahasa', '语言', 'மொழி'),
    skip: L('Skip to content', 'Terus ke kandungan', '跳至内容', 'உள்ளடக்கத்திற்குச் செல்'),
  },

  hero: {
    line1: L('Many Histories.', 'Pelbagai Sejarah.', '众多历史。', 'பல வரலாறுகள்.'),
    line2: L('One Future.', 'Satu Masa Depan.', '一个未来。', 'ஒரே எதிர்காலம்.'),
    eventName: L(
      'Seri Negara Dialogue 2026',
      'Dialog Seri Negara 2026',
      '斯里尼加拉对话 2026',
      'சேரி நெகாரா உரையாடல் 2026',
    ),
    subtitle: L(
      "A National Conversation on Malaysia's Future",
      'Perbualan Nasional Mengenai Masa Depan Malaysia',
      '一场关于马来西亚未来的全国对话',
      'மலேசியாவின் எதிர்காலம் குறித்த ஒரு தேசிய உரையாடல்',
    ),
    date: L('8 October 2026 (Thursday)', '8 Oktober 2026 (Khamis)', '2026 年 10 月 8 日（星期四）', '8 அக்டோபர் 2026 (வியாழன்)'),
    time: L('1.30 PM onwards', '1.30 petang dan seterusnya', '下午 1.30 起', 'பிற்பகல் 1.30 முதல்'),
    venue: L(
      'Auditorium Muzium Negara',
      'Auditorium Muzium Negara',
      '国家博物馆礼堂',
      'முசியும் நெகாரா அரங்கம்',
    ),
    cta: L('Register now', 'Daftar sekarang', '立即报名', 'இப்போதே பதிவு செய்க'),
    merdeka: L(
      'From Merdeka 70 towards Malaysia 100',
      'Daripada Merdeka 70 menuju Malaysia 100',
      '从独立 70 年迈向马来西亚 100 年',
      'மெர்டேக்கா 70 இலிருந்து மலேசியா 100 நோக்கி',
    ),
    scroll: L('Scroll to explore', 'Tatal untuk meneroka', '向下浏览', 'உருட்டி அறிக'),
    imageAlt: L(
      'Visitors walking up to Muzium Negara, with the Kuala Lumpur skyline beyond.',
      'Pengunjung berjalan menuju Muzium Negara, dengan latar langit Kuala Lumpur.',
      '访客走向国家博物馆，远处是吉隆坡的天际线。',
      'கோலாலம்பூர் நகர்க்காட்சியின் பின்னணியில், முசியும் நெகாராவை நோக்கி நடந்து செல்லும் வருகையாளர்கள்.',
    ),
    peopleAlt: L(
      'Malaysians of different backgrounds standing together.',
      'Rakyat Malaysia daripada pelbagai latar belakang berdiri bersama.',
      '来自不同背景的马来西亚人并肩而立。',
      'வெவ்வேறு பின்னணிகளைச் சேர்ந்த மலேசியர்கள் ஒன்றாக நிற்கின்றனர்.',
    ),
  },

  conversation: {
    title: L('The Conversation We Must Have', 'Perbualan Yang Perlu Kita Adakan', '我们必须展开的对话', 'நாம் நடத்த வேண்டிய உரையாடல்'),
    sub: L(
      'Understanding where we came from, confronting where we are, and shaping where we go next.',
      'Memahami asal usul kita, berdepan dengan keadaan kita hari ini, dan membentuk hala tuju kita seterusnya.',
      '理解我们从何而来，正视我们身处何方，塑造我们将往何处。',
      'நாம் எங்கிருந்து வந்தோம் என்பதைப் புரிந்துகொண்டு, இன்று நாம் எங்கு நிற்கிறோம் என்பதை எதிர்கொண்டு, அடுத்து எங்கு செல்கிறோம் என்பதை வடிவமைப்போம்.',
    ),
    titles: [
      L('Our Shared Histories', 'Sejarah Bersama Kita', '我们共同的历史', 'நமது பகிர்ந்த வரலாறுகள்'),
      L('Malaysia Today', 'Malaysia Hari Ini', '今日马来西亚', 'இன்றைய மலேசியா'),
      L('Our Shared Future', 'Masa Depan Bersama Kita', '我们共同的未来', 'நமது பகிர்ந்த எதிர்காலம்'),
    ],
    questions: [
      L('What have we inherited?', 'Apakah yang telah kita warisi?', '我们继承了什么？', 'நாம் எதை மரபாகப் பெற்றுள்ளோம்?'),
      L('Where do we stand?', 'Di manakah kedudukan kita?', '我们身处何方？', 'நாம் எங்கு நிற்கிறோம்?'),
      L('What will we build together?', 'Apakah yang akan kita bina bersama?', '我们将共同建设什么？', 'நாம் இணைந்து எதைக் கட்டியெழுப்புவோம்?'),
    ],
    texts: [
      L(
        'How have Malaysia’s many histories shaped our identity, institutions and relationships today?',
        'Bagaimanakah pelbagai sejarah Malaysia membentuk identiti, institusi dan hubungan kita hari ini?',
        '马来西亚的众多历史如何塑造了我们今日的认同、体制与彼此关系？',
        'மலேசியாவின் பல வரலாறுகள் இன்று நமது அடையாளம், நிறுவனங்கள் மற்றும் உறவுகளை எவ்வாறு வடிவமைத்துள்ளன?',
      ),
      L(
        'What realities, divisions and shared aspirations define our nation at this moment?',
        'Apakah realiti, perpecahan dan aspirasi bersama yang mentakrifkan negara kita pada saat ini?',
        '此时此刻，哪些现实、分歧与共同愿景定义着我们的国家？',
        'இந்தத் தருணத்தில் நமது தேசத்தை வரையறுக்கும் யதார்த்தங்கள், பிளவுகள் மற்றும் பகிர்ந்த அபிலாஷைகள் எவை?',
      ),
      L(
        'What must we change, protect and create for the generations that follow?',
        'Apakah yang perlu kita ubah, lindungi dan cipta untuk generasi yang akan datang?',
        '为了后代，我们必须改变、守护与创造什么？',
        'வரவிருக்கும் தலைமுறைகளுக்காக நாம் எதை மாற்ற வேண்டும், எதைப் பாதுகாக்க வேண்டும், எதை உருவாக்க வேண்டும்?',
      ),
    ],
  },

  about: {
    title: L('About the Dialogue', 'Mengenai Dialog', '关于本对话', 'உரையாடல் பற்றி'),
    sub: L(
      'A National Conversation About Who We Are, and Who We Choose to Become',
      'Perbualan Nasional Tentang Siapa Kita, dan Siapa Yang Kita Pilih Untuk Menjadi',
      '一场关于我们是谁、以及我们选择成为谁的全国对话',
      'நாம் யார், நாம் யாராக மாறத் தேர்ந்தெடுக்கிறோம் என்பது பற்றிய ஒரு தேசிய உரையாடல்',
    ),
    body: [
      L(
        'As Malaysia approaches Merdeka 70 and looks towards Malaysia 100, we stand at an important moment: to reflect honestly on the nation we have inherited and decide, together, the nation we want to build.',
        'Ketika Malaysia menghampiri Merdeka 70 dan menuju Malaysia 100, kita berada pada saat yang penting: untuk merenung dengan jujur negara yang telah kita warisi dan menentukan, bersama-sama, negara yang ingin kita bina.',
        '随着马来西亚迈向独立 70 周年、展望建国 100 周年，我们正站在一个重要时刻：坦诚反思我们所继承的国家，并共同决定我们想要建设的国家。',
        'மலேசியா மெர்டேக்கா 70 ஐ நெருங்கி, மலேசியா 100 ஐ நோக்கிப் பார்க்கும் இவ்வேளையில், நாம் ஒரு முக்கியமான தருணத்தில் நிற்கிறோம்: நாம் மரபாகப் பெற்ற தேசத்தை நேர்மையாகச் சிந்தித்து, நாம் கட்டியெழுப்ப விரும்பும் தேசத்தை இணைந்து தீர்மானிக்கும் தருணம் இது.',
      ),
      L(
        'The Seri Negara Dialogue brings leaders, thinkers and citizens together to confront difficult questions, bridge our differences and find common ground for Malaysia’s future.',
        'Dialog Seri Negara menghimpunkan pemimpin, pemikir dan rakyat untuk berdepan dengan persoalan sukar, merapatkan perbezaan kita dan mencari titik persamaan untuk masa depan Malaysia.',
        '斯里尼加拉对话汇聚领袖、思想者与公民，直面艰难的问题、弥合彼此的分歧，为马来西亚的未来寻找共同点。',
        'சேரி நெகாரா உரையாடல், கடினமான கேள்விகளை எதிர்கொள்ளவும், நமது வேறுபாடுகளுக்குப் பாலம் அமைக்கவும், மலேசியாவின் எதிர்காலத்திற்கான பொதுவான தளத்தைக் கண்டறியவும் தலைவர்கள், சிந்தனையாளர்கள் மற்றும் குடிமக்களை ஒன்றிணைக்கிறது.',
      ),
    ],
    closing: L(
      'Many histories have shaped us. Our next chapter must be written together.',
      'Pelbagai sejarah telah membentuk kita. Bab seterusnya mesti ditulis bersama.',
      '众多历史塑造了我们。我们的下一章，必须共同书写。',
      'பல வரலாறுகள் நம்மை வடிவமைத்துள்ளன. நமது அடுத்த அத்தியாயம் இணைந்தே எழுதப்பட வேண்டும்.',
    ),
    invite: L(
      'Be part of the conversation. Help shape Malaysia’s next chapter.',
      'Jadilah sebahagian daripada perbualan ini. Bantu membentuk bab seterusnya Malaysia.',
      '加入这场对话，共同塑造马来西亚的下一章。',
      'இந்த உரையாடலின் ஒரு பகுதியாகுங்கள். மலேசியாவின் அடுத்த அத்தியாயத்தை வடிவமைக்க உதவுங்கள்.',
    ),
    imageAlt: L(
      'The grand hall of Muzium Negara, lit by afternoon sun through carved timber screens.',
      'Dewan utama Muzium Negara, disinari cahaya petang melalui kekisi kayu berukir.',
      '国家博物馆大厅，午后阳光透过雕花木屏洒落。',
      'செதுக்கப்பட்ட மரத் திரைகள் வழியே பிற்பகல் ஒளி பாயும் முசியும் நெகாராவின் பெருமண்டபம்.',
    ),
    cta: L('Learn more', 'Ketahui lanjut', '了解更多', 'மேலும் அறிக'),
    ambitionTitle: L('Long-term ambition', 'Hasrat jangka panjang', '长远目标', 'நீண்டகால நோக்கம்'),
    ambitionBody: L(
      'The first Dialogue is held in 2026. It is built to return each year, so the conversation accumulates rather than restarts.',
      'Dialog pertama diadakan pada 2026. Ia dibina untuk kembali setiap tahun, supaya perbualan ini terus berkembang dan bukan bermula semula.',
      '首届对话于 2026 年举行，并以每年回归为目标，让这场对话得以累积，而非每次重新开始。',
      'முதல் உரையாடல் 2026 இல் நடைபெறுகிறது. ஒவ்வொரு ஆண்டும் திரும்பும் வகையில் இது கட்டமைக்கப்பட்டுள்ளது.',
    ),
  },

  theme: {
    title: L('2026 Theme', 'Tema 2026', '2026 年主题', '2026 கருப்பொருள்'),
    name: L('Many Histories. One Future.', 'Pelbagai Sejarah. Satu Masa Depan.', '众多历史。一个未来。', 'பல வரலாறுகள். ஒரே எதிர்காலம்.'),
    tagline: L(
      'Three Conversations. One National Purpose.',
      'Tiga Perbualan. Satu Tujuan Nasional.',
      '三场对话，一个国家目标。',
      'மூன்று உரையாடல்கள். ஒரே தேசிய நோக்கம்.',
    ),
    body: L(
      'How do we understand the histories that formed us, confront the realities shaping Malaysia today, and build a future in which every Malaysian can belong and thrive?',
      'Bagaimanakah kita memahami sejarah yang membentuk kita, berdepan dengan realiti yang membentuk Malaysia hari ini, dan membina masa depan di mana setiap rakyat Malaysia berasa dimiliki dan dapat berjaya?',
      '我们如何理解塑造我们的历史、正视形塑今日马来西亚的现实，并建设一个让每一位马来西亚人都能有所归属、蓬勃发展的未来？',
      'நம்மை உருவாக்கிய வரலாறுகளை எவ்வாறு புரிந்துகொள்வது, இன்றைய மலேசியாவை வடிவமைக்கும் யதார்த்தங்களை எவ்வாறு எதிர்கொள்வது, ஒவ்வொரு மலேசியரும் சொந்தம் கொண்டாடிச் செழிக்கக்கூடிய எதிர்காலத்தை எவ்வாறு கட்டியெழுப்புவது?',
    ),
    cta: L('Read more', 'Baca lanjut', '阅读更多', 'மேலும் படிக்க'),
    quote: L(
      'A nation is not only inherited. It is renewed by every generation willing to listen, question and build together.',
      'Sebuah negara bukan sekadar diwarisi. Ia diperbaharui oleh setiap generasi yang sanggup mendengar, mempersoal dan membina bersama.',
      '一个国家不仅是被继承的。它由每一个愿意倾听、质疑并共同建设的世代不断更新。',
      'ஒரு தேசம் மரபாகப் பெறப்படுவது மட்டுமல்ல. கேட்கவும், கேள்வி எழுப்பவும், இணைந்து கட்டியெழுப்பவும் தயாராக இருக்கும் ஒவ்வொரு தலைமுறையாலும் அது புதுப்பிக்கப்படுகிறது.',
    ),
    quoteSource: L('Seri Negara Dialogue 2026', 'Dialog Seri Negara 2026', '斯里尼加拉对话 2026', 'சேரி நெகாரா உரையாடல் 2026'),
    /*
     * The three conversations as the theme section tells them. The same three
     * as the band under the hero, deliberately, but the client wrote the
     * third line of each differently here -- about belonging rather than
     * relationships -- so they are kept as two sets rather than one.
     */
    convTexts: [
      L(
        'How have Malaysia’s many histories shaped our identity, institutions and understanding of who belongs?',
        'Bagaimanakah pelbagai sejarah Malaysia membentuk identiti, institusi dan kefahaman kita tentang siapa yang menjadi sebahagian daripada negara ini?',
        '马来西亚的众多历史如何塑造了我们的认同、体制，以及我们对归属的理解？',
        'மலேசியாவின் பல வரலாறுகள் நமது அடையாளம், நிறுவனங்கள் மற்றும் யார் இங்கு சொந்தமானவர் என்ற நமது புரிதலை எவ்வாறு வடிவமைத்துள்ளன?',
      ),
      L(
        'What realities must we confront honestly to rebuild trust, strengthen our institutions and hold together a diverse nation?',
        'Apakah realiti yang perlu kita hadapi dengan jujur untuk membina semula kepercayaan, mengukuhkan institusi kita dan menyatukan sebuah negara yang pelbagai?',
        '我们必须坦诚正视哪些现实，才能重建信任、强化体制，并凝聚一个多元的国家？',
        'நம்பிக்கையை மீண்டும் கட்டியெழுப்பவும், நமது நிறுவனங்களை வலுப்படுத்தவும், பன்முகத் தேசத்தை ஒன்றாக இணைத்து வைக்கவும் நாம் எந்த யதார்த்தங்களை நேர்மையாக எதிர்கொள்ள வேண்டும்?',
      ),
      L(
        'What must we choose and create today so that the next generation inherits a Malaysia of dignity, opportunity and belonging?',
        'Apakah yang perlu kita pilih dan cipta hari ini supaya generasi akan datang mewarisi Malaysia yang bermaruah, penuh peluang dan rasa kekitaan?',
        '我们今天必须作出怎样的选择与创造，才能让下一代继承一个有尊严、有机会、有归属感的马来西亚？',
        'அடுத்த தலைமுறை கண்ணியம், வாய்ப்பு மற்றும் சொந்த உணர்வு நிறைந்த மலேசியாவை மரபாகப் பெற, இன்று நாம் எதைத் தேர்ந்தெடுத்து உருவாக்க வேண்டும்?',
      ),
    ],
  },

  chairman: {
    title: L(
      'Organising Chairman’s Welcome',
      'Ucapan Aluan Pengerusi Penganjur',
      '筹委会主席致辞',
      'ஏற்பாட்டுத் தலைவரின் வரவேற்புரை',
    ),
    cta: L('Read the full welcome', 'Baca ucapan aluan penuh', '阅读完整致辞', 'முழு வரவேற்புரையைப் படிக்க'),
  },

  speakers: {
    title: L('Voices of the Dialogue', 'Suara Dialog', '对话之声', 'உரையாடலின் குரல்கள்'),
    sub: L(
      'Distinguished perspectives. One important national conversation.',
      'Perspektif terkemuka. Satu perbualan nasional yang penting.',
      '卓越的观点，一场重要的全国对话。',
      'சிறந்த கண்ணோட்டங்கள். ஒரு முக்கியமான தேசிய உரையாடல்.',
    ),
    // One label per role, used as the ribbon on a card and as the heading
    // of its group. "speaker" is a panellist.
    roles: {
      keynote: L('Keynote Address', 'Ucaptama', '主题演讲', 'சிறப்புரை'),
      speaker: L('Panellist', 'Ahli Panel', '座谈嘉宾', 'குழு உறுப்பினர்'),
      moderator: L('Moderator', 'Moderator', '主持人', 'நெறியாளர்'),
      mc: L('Master of Ceremonies', 'Pengacara Majlis', '司仪', 'நிகழ்ச்சித் தொகுப்பாளர்'),
    },
    groups: {
      keynote: L('Keynote Address', 'Ucaptama', '主题演讲', 'சிறப்புரை'),
      speaker: L('Panellists', 'Ahli Panel', '座谈嘉宾', 'குழு உறுப்பினர்கள்'),
      moderator: L('Moderator', 'Moderator', '主持人', 'நெறியாளர்'),
      mc: L('Master of Ceremonies', 'Pengacara Majlis', '司仪', 'நிகழ்ச்சித் தொகுப்பாளர்'),
    },
    moderatorBadge: L('Moderator', 'Moderator', '主持人', 'நெறியாளர்'),
    viewProfile: L('View profile', 'Lihat profil', '查看简介', 'சுயவிவரம் காண்க'),
    profileOf: L('Profile of {{name}}', 'Profil {{name}}', '{{name}} 的简介', '{{name}} அவர்களின் சுயவிவரம்'),
    externalLink: L('Visit {{label}}', 'Lawati {{label}}', '前往 {{label}}', '{{label}} தளத்திற்குச் செல்க'),
    seeAll: L('See all speakers', 'Lihat semua pembentang', '查看全部讲者', 'அனைத்து உரையாளர்களையும் காண்க'),
  },

  programme: {
    title: L('Programme', 'Atur Cara', '议程', 'நிகழ்ச்சி நிரல்'),
    sub: L(
      'An afternoon of honest conversation and shared purpose.',
      'Petang perbualan yang jujur dan tujuan bersama.',
      '一个坦诚对话、目标一致的午后。',
      'நேர்மையான உரையாடலும் பகிர்ந்த நோக்கமும் நிறைந்த ஒரு பிற்பகல்.',
    ),
    quote: L(
      'A platform for meaningful dialogue across generations.',
      'Platform untuk dialog bermakna merentas generasi.',
      '一个跨越世代的有意义对话平台。',
      'தலைமுறைகளைக் கடந்த அர்த்தமுள்ள உரையாடலுக்கான மேடை.',
    ),
    note: L(
      'Programme concludes at 5.45 PM. Timings remain subject to final protocol arrangements.',
      'Atur cara berakhir pada 5.45 petang. Masa tertakluk kepada susunan protokol muktamad.',
      '活动于下午 5.45 结束。时间安排以最终礼宾安排为准。',
      'நிகழ்ச்சி மாலை 5.45 க்கு நிறைவடைகிறது. நேரங்கள் இறுதி நெறிமுறை ஏற்பாடுகளுக்கு உட்பட்டவை.',
    ),
    seeFull: L('See the full programme', 'Lihat atur cara penuh', '查看完整议程', 'முழு நிகழ்ச்சி நிரலைக் காண்க'),
  },

  eventInfo: {
    title: L('Event Information', 'Maklumat Acara', '活动资讯', 'நிகழ்வுத் தகவல்'),
    dateLabel: L('Date', 'Tarikh', '日期', 'தேதி'),
    timeLabel: L('Time', 'Masa', '时间', 'நேரம்'),
    venueLabel: L('Venue', 'Tempat', '地点', 'இடம்'),
    directions: L('Open in Google Maps', 'Buka dalam Google Maps', '在 Google 地图中开启', 'Google Maps இல் திறக்க'),
    mapTitle: L(
      'Map showing Muzium Negara, Kuala Lumpur',
      'Peta menunjukkan Muzium Negara, Kuala Lumpur',
      '显示吉隆坡国家博物馆的地图',
      'கோலாலம்பூர் முசியும் நெகாராவைக் காட்டும் வரைபடம்',
    ),
  },

  rsvp: {
    title: L('Attend the Dialogue', 'Sertai Dialog', '出席对话', 'உரையாடலில் கலந்துகொள்ளுங்கள்'),
    sub: L(
      'Be part of the conversation.',
      'Jadilah sebahagian daripada perbualan ini.',
      '成为这场对话的一部分。',
      'இந்த உரையாடலின் ஒரு பகுதியாகுங்கள்.',
    ),
    note: L(
      'Seats are limited. Kindly register to confirm your attendance.',
      'Tempat duduk terhad. Sila daftar untuk mengesahkan kehadiran anda.',
      '席位有限，敬请报名以确认出席。',
      'இருக்கைகள் வரையறுக்கப்பட்டவை. வருகையை உறுதிப்படுத்த பதிவு செய்யுங்கள்.',
    ),
    cta: L('Register', 'Daftar', '报名', 'பதிவு செய்க'),
    formCta: L('Register now', 'Daftar sekarang', '立即报名', 'இப்போதே பதிவு செய்க'),
    formNote: L(
      'Registration is handled through Google Forms and opens in a new tab.',
      'Pendaftaran dibuat melalui Google Forms dan dibuka dalam tab baharu.',
      '报名通过 Google 表单进行，将在新分页中开启。',
      'பதிவு Google Forms மூலம் நடைபெறுகிறது, புதிய தாவலில் திறக்கும்.',
    ),
    capacity: L(
      '{{remaining}} of {{total}} seats remaining',
      '{{remaining}} daripada {{total}} tempat masih ada',
      '尚余 {{remaining}} 个席位，共 {{total}} 个',
      '{{total}} இல் {{remaining}} இருக்கைகள் மீதம்',
    ),
    capacityLabel: L('Seats remaining', 'Tempat yang masih ada', '尚余席位', 'மீதமுள்ள இருக்கைகள்'),
    fields: {
      fullName: L('Full name', 'Nama penuh', '全名', 'முழுப் பெயர்'),
      email: L('Email address', 'Alamat e-mel', '电邮地址', 'மின்னஞ்சல் முகவரி'),
      mobile: L('Mobile number', 'Nombor telefon bimbit', '手机号码', 'கைபேசி எண்'),
      organisation: L('Organisation', 'Organisasi', '机构', 'நிறுவனம்'),
      designation: L('Designation', 'Jawatan', '职衔', 'பதவி'),
      dietary: L('Dietary requirement', 'Keperluan pemakanan', '饮食需求', 'உணவுத் தேவை'),
      dietaryHint: L('Leave blank if none.', 'Biarkan kosong jika tiada.', '如无，请留空。', 'இல்லையெனில் காலியாக விடுங்கள்.'),
      optional: L('Optional', 'Pilihan', '选填', 'விருப்பத்தேர்வு'),
      pdpa: L(
        'I have read the PDPA notice and consent to the processing of my personal data for this event.',
        'Saya telah membaca notis PDPA dan bersetuju data peribadi saya diproses untuk acara ini.',
        '我已阅读 PDPA 声明，并同意为本活动处理我的个人资料。',
        'PDPA அறிவிப்பைப் படித்தேன்; இந்நிகழ்வுக்காக எனது தனிப்பட்ட தரவு பயன்படுத்தப்படுவதற்கு ஒப்புக்கொள்கிறேன்.',
      ),
      pdpaLink: L('Read the privacy notice', 'Baca notis privasi', '阅读隐私声明', 'தனியுரிமை அறிவிப்பைப் படிக்க'),
    },
    submit: L('Submit registration', 'Hantar pendaftaran', '提交报名', 'பதிவை அனுப்புக'),
    submitting: L('Sending…', 'Menghantar…', '提交中…', 'அனுப்பப்படுகிறது…'),
    errors: {
      fullName: L('Enter your full name.', 'Masukkan nama penuh anda.', '请填写您的全名。', 'உங்கள் முழுப் பெயரை உள்ளிடுங்கள்.'),
      email: L('Enter a valid email address.', 'Masukkan alamat e-mel yang sah.', '请填写有效的电邮地址。', 'செல்லுபடியாகும் மின்னஞ்சல் முகவரியை உள்ளிடுங்கள்.'),
      mobile: L('Enter a valid mobile number.', 'Masukkan nombor telefon bimbit yang sah.', '请填写有效的手机号码。', 'செல்லுபடியாகும் கைபேசி எண்ணை உள்ளிடுங்கள்.'),
      organisation: L('Enter your organisation.', 'Masukkan organisasi anda.', '请填写您的机构。', 'உங்கள் நிறுவனத்தை உள்ளிடுங்கள்.'),
      designation: L('Enter your designation.', 'Masukkan jawatan anda.', '请填写您的职衔。', 'உங்கள் பதவியை உள்ளிடுங்கள்.'),
      pdpa: L('Tick the box to continue.', 'Tandakan kotak ini untuk meneruskan.', '请勾选此项以继续。', 'தொடர இப்பெட்டியைத் தேர்ந்தெடுக்கவும்.'),
      generic: L('The registration did not go through. Try again.', 'Pendaftaran tidak berjaya. Sila cuba lagi.', '报名未能完成，请再试一次。', 'பதிவு நிறைவடையவில்லை. மீண்டும் முயலுங்கள்.'),
    },
    success: {
      title: L('You have a seat.', 'Tempat anda telah disahkan.', '您的席位已确认。', 'உங்கள் இருக்கை உறுதி செய்யப்பட்டது.'),
      body: L(
        'We have your place at the Seri Negara Dialogue on 8 October 2026 at Muzium Negara. Keep your reference — you will be asked for it at the door.',
        'Tempat anda di Dialog Seri Negara pada 8 Oktober 2026 di Muzium Negara telah direkodkan. Simpan nombor rujukan anda — ia akan diminta di pintu masuk.',
        '您已成功报名 2026 年 10 月 8 日于国家博物馆举行的斯里尼加拉对话。请保留您的参考编号，入场时将会查询。',
        '2026 அக்டோபர் 8 அன்று முசியும் நெகாராவில் நடைபெறும் சேரி நெகாரா உரையாடலில் உங்கள் இடம் பதிவாகியுள்ளது. உங்கள் குறிப்பு எண்ணை வைத்திருங்கள்.',
      ),
      referenceLabel: L('Your reference', 'Nombor rujukan anda', '您的参考编号', 'உங்கள் குறிப்பு எண்'),
      addAnother: L('Register someone else', 'Daftar orang lain', '为他人报名', 'மற்றொருவரைப் பதிவு செய்க'),
    },
    full: {
      title: L('Registration is closed.', 'Pendaftaran telah ditutup.', '报名已截止。', 'பதிவு முடிவடைந்தது.'),
      body: L(
        'All 200 seats for the 2026 Dialogue are taken. Write to the organising team if you would like to be told about the next edition.',
        'Kesemua 200 tempat untuk Dialog 2026 telah penuh. Hubungi pihak penganjur jika anda ingin dimaklumkan mengenai edisi akan datang.',
        '2026 年对话的 200 个席位已满。如欲收到下一届的通知，请联络筹委会。',
        '2026 உரையாடலுக்கான 200 இருக்கைகளும் நிரம்பிவிட்டன. அடுத்த பதிப்பு குறித்து அறிய ஏற்பாட்டுக் குழுவைத் தொடர்புகொள்ளுங்கள்.',
      ),
    },

    /*
     * "Sold out" and "this already happened" are different news, and a
     * visitor who arrives the week after the Dialogue should not be told to
     * write in about seats that no longer matter.
     */
    closed: {
      title: L(
        'Registration has closed.',
        'Pendaftaran telah ditutup.',
        '报名已截止。',
        'பதிவு முடிவடைந்தது.',
      ),
      body: L(
        'The organising team has closed registration for this Dialogue. Write to them if you were hoping to attend.',
        'Pihak penganjur telah menutup pendaftaran bagi Dialog ini. Hubungi mereka jika anda berharap untuk hadir.',
        '筹委会已截止本届对话的报名。如您原本希望出席，请与他们联络。',
        'இந்த உரையாடலுக்கான பதிவை ஏற்பாட்டுக் குழு நிறைவு செய்துவிட்டது. கலந்துகொள்ள விரும்பியிருந்தால் அவர்களைத் தொடர்புகொள்ளுங்கள்.',
      ),
    },

    past: {
      title: L(
        'This Dialogue has taken place.',
        'Dialog ini telah berlangsung.',
        '本届对话已举行。',
        'இந்த உரையாடல் நடைபெற்று முடிந்தது.',
      ),
      body: L(
        'Thank you to everyone who joined us. Details of the next Seri Negara Dialogue will be published here.',
        'Terima kasih kepada semua yang menyertai kami. Butiran Dialog Seri Negara akan datang akan diterbitkan di sini.',
        '感谢所有出席的朋友。下一届斯里尼加拉对话的详情将在此公布。',
        'எங்களுடன் இணைந்த அனைவருக்கும் நன்றி. அடுத்த ஸ்ரீ நெகாரா உரையாடலின் விவரங்கள் இங்கே வெளியிடப்படும்.',
      ),
    },
  },

  sponsors: {
    title: L('Partners & Sponsors', 'Rakan & Penaja', '合作伙伴与赞助商', 'கூட்டாளர்களும் ஆதரவாளர்களும்'),
    foundingPatron: L('Founding Patron', 'Penaung Pengasas', '创始赞助人', 'நிறுவனப் புரவலர்'),
    convenedBy: L('Convened By', 'Dianjurkan Oleh', '主办单位', 'ஏற்பாடு செய்பவர்'),
    gold: L('Our Gold Sponsors', 'Penaja Emas Kami', '金级赞助商', 'எங்கள் தங்க ஆதரவாளர்கள்'),
    silver: L('Our Silver Sponsors', 'Penaja Perak Kami', '银级赞助商', 'எங்கள் வெள்ளி ஆதரவாளர்கள்'),
    marketing: L('Marketing Partners', 'Rakan Pemasaran', '营销合作伙伴', 'சந்தைப்படுத்தல் கூட்டாளர்கள்'),
  },

  terms: {
    title: L('Terms of Use', 'Terma Penggunaan', '使用条款', 'பயன்பாட்டு விதிமுறைகள்'),
    body: [
      L(
        'This website is published by the organising team of Seri Negara Dialogue to provide information about the event on 8 October 2026 and to accept registrations for it.',
        'Laman web ini diterbitkan oleh pihak penganjur Dialog Seri Negara untuk memberikan maklumat mengenai acara pada 8 Oktober 2026 dan menerima pendaftaran untuknya.',
        '本网站由斯里尼加拉对话筹委会发布，用于提供 2026 年 10 月 8 日活动的资讯并受理报名。',
        'இந்த இணையதளம் 2026 அக்டோபர் 8 நிகழ்வு குறித்த தகவல்களை வழங்கவும், அதற்கான பதிவுகளைப் பெறவும் சேரி நெகாரா உரையாடல் ஏற்பாட்டுக் குழுவால் வெளியிடப்படுகிறது.',
      ),
      L(
        'Programme details, speakers and timings may change before the event. Registration does not guarantee entry if capacity is reached or if the details given cannot be verified at the door.',
        'Butiran atur cara, pembentang dan masa mungkin berubah sebelum acara. Pendaftaran tidak menjamin kemasukan sekiranya kapasiti telah penuh atau maklumat yang diberikan tidak dapat disahkan di pintu masuk.',
        '议程、讲者与时间安排可能在活动前有所调整。若席位已满，或入场时无法核实所填资料，报名并不保证入场。',
        'நிகழ்ச்சி விவரங்கள், உரையாளர்கள் மற்றும் நேரங்கள் நிகழ்வுக்கு முன் மாறக்கூடும். இருக்கைகள் நிரம்பினாலோ, நுழைவாயிலில் விவரங்களைச் சரிபார்க்க இயலாவிட்டாலோ பதிவு நுழைவை உறுதி செய்யாது.',
      ),
      L(
        'Content on this site, including text and images, belongs to the organising entity unless otherwise credited. Links to other organisations are provided for reference and do not imply any partnership.',
        'Kandungan di laman ini, termasuk teks dan imej, adalah milik entiti penganjur melainkan dinyatakan sebaliknya. Pautan kepada organisasi lain disediakan sebagai rujukan dan tidak menyiratkan sebarang perkongsian.',
        '除另有注明外，本网站的文字与图像内容归筹办单位所有。指向其他机构的链接仅供参考，不代表任何合作关系。',
        'வேறுவிதமாகக் குறிப்பிடப்படாதவரை, உரை மற்றும் படங்கள் உள்ளிட்ட இத்தள உள்ளடக்கம் ஏற்பாட்டு அமைப்புக்கு உரியது. பிற அமைப்புகளுக்கான இணைப்புகள் குறிப்புக்காக மட்டுமே; எந்தக் கூட்டாண்மையையும் குறிக்கவில்லை.',
      ),
    ],
  },

  privacy: {
    title: L('Privacy notice', 'Notis privasi', '隐私声明', 'தனியுரிமை அறிவிப்பு'),
    body: [
      L(
        'The details you give when registering are collected by the organising team of Seri Negara Dialogue for one purpose: managing attendance at the event on 8 October 2026.',
        'Maklumat yang anda berikan semasa mendaftar dikumpul oleh pihak penganjur Dialog Seri Negara untuk satu tujuan sahaja: menguruskan kehadiran pada acara 8 Oktober 2026.',
        '您在报名时提供的资料，由斯里尼加拉对话筹委会收集，仅用于一个目的：管理 2026 年 10 月 8 日活动的出席事宜。',
        'பதிவின்போது நீங்கள் அளிக்கும் விவரங்களை சேரி நெகாரா உரையாடல் ஏற்பாட்டுக் குழு ஒரே ஒரு நோக்கத்திற்காகச் சேகரிக்கிறது: 2026 அக்டோபர் 8 நிகழ்வின் வருகையை நிர்வகிப்பதற்காக.',
      ),
      L(
        'They are used to confirm your place, to plan seating and catering, and to contact you about this event. They are not sold, and they are not shared with third parties beyond what the venue requires for access.',
        'Ia digunakan untuk mengesahkan tempat anda, merancang tempat duduk dan jamuan, serta menghubungi anda mengenai acara ini. Maklumat ini tidak dijual dan tidak dikongsi dengan pihak ketiga melebihi keperluan akses di lokasi acara.',
        '这些资料用于确认席位、安排座位与餐饮，以及就本活动与您联络。资料不会被出售，除场地进出所需外，亦不会与第三方共享。',
        'உங்கள் இடத்தை உறுதிப்படுத்தவும், இருக்கை மற்றும் உணவு ஏற்பாடுகளைத் திட்டமிடவும், இந்நிகழ்வு குறித்து உங்களைத் தொடர்புகொள்ளவும் இவை பயன்படுத்தப்படும். இவை விற்கப்படுவதில்லை.',
      ),
      L(
        'You may ask for your details to be corrected or removed at any time by writing to the organising team.',
        'Anda boleh meminta maklumat anda dibetulkan atau dipadam pada bila-bila masa dengan menghubungi pihak penganjur.',
        '您可随时联络筹委会，要求更正或删除您的资料。',
        'ஏற்பாட்டுக் குழுவைத் தொடர்புகொண்டு எப்போது வேண்டுமானாலும் உங்கள் விவரங்களைத் திருத்தவோ நீக்கவோ கோரலாம்.',
      ),
    ],
  },

  footer: {
    quickLinks: L('Quick Links', 'Pautan Pantas', '快速链接', 'விரைவு இணைப்புகள்'),
    followUs: L('Follow the Dialogue', 'Ikuti Dialog', '关注本对话', 'உரையாடலைப் பின்தொடரவும்'),
    socialOn: L(
      'Seri Negara Dialogue on {{network}}',
      'Dialog Seri Negara di {{network}}',
      '{{network}} 上的斯里尼加拉对话',
      '{{network}} இல் சேரி நெகாரா உரையாடல்',
    ),
    terms: L('Terms of Use', 'Terma Penggunaan', '使用条款', 'பயன்பாட்டு விதிமுறைகள்'),
    contact: L('Contact', 'Hubungi', '联络我们', 'தொடர்பு'),
    copyright: L(
      '© 2026 Seri Negara Dialogue. Convened by Chevening Alumni Malaysia.',
      '© 2026 Dialog Seri Negara. Dianjurkan oleh Chevening Alumni Malaysia.',
      '© 2026 斯里尼加拉对话。由 Chevening 马来西亚校友会主办。',
      '© 2026 சேரி நெகாரா உரையாடல். Chevening Alumni Malaysia ஏற்பாடு செய்கிறது.',
    ),
    linksNote: L(
      'Official websites, opening in a new tab.',
      'Laman web rasmi, dibuka dalam tab baharu.',
      '官方网站，将在新分页中开启。',
      'அதிகாரப்பூர்வ இணையதளங்கள், புதிய தாவலில் திறக்கும்.',
    ),
    convenedBy: L('Convened by', 'Dianjurkan oleh', '主办单位', 'ஏற்பாடு செய்பவர்'),
    tagline: L(
      'A stronger, more inclusive Malaysia',
      'Malaysia yang lebih kukuh dan inklusif',
      '更强大、更包容的马来西亚',
      'வலிமையான, மேலும் உள்ளடக்கிய மலேசியா',
    ),
    privacy: L('Privacy notice', 'Notis privasi', '隐私声明', 'தனியுரிமை அறிவிப்பு'),
    rights: L('Seri Negara Dialogue', 'Dialog Seri Negara', '斯里尼加拉对话', 'சேரி நெகாரா உரையாடல்'),
  },

  common: {
    newTab: L('opens in a new tab', 'dibuka dalam tab baharu', '在新分页中开启', 'புதிய தாவலில் திறக்கும்'),
    backToTop: L('Back to top', 'Kembali ke atas', '回到顶部', 'மேலே செல்க'),
  },
}

const LOCALES = ['en', 'ms', 'zh', 'ta']

function pick(node, locale) {
  if (Array.isArray(node)) return node.map((n) => pick(n, locale))
  if (node && node.__leaf) return node[locale]
  const out = {}
  for (const [k, v] of Object.entries(node)) out[k] = pick(v, locale)
  return out
}

for (const locale of LOCALES) {
  const status =
    locale === 'en' || locale === 'ms' ? 'authored' : 'machine-translated, pending human review'
  const json = { _status: status, ...pick(src, locale) }
  fs.writeFileSync(`src/i18n/locales/${locale}.json`, JSON.stringify(json, null, 2) + '\n')
}

const flat = (o, p = '') =>
  Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v) ? flat(v, p + k + '.') : [p + k],
  )
const base = flat(JSON.parse(fs.readFileSync('src/i18n/locales/en.json', 'utf8')))
const ok = LOCALES.every((l) => {
  const keys = flat(JSON.parse(fs.readFileSync(`src/i18n/locales/${l}.json`, 'utf8')))
  return keys.length === base.length && keys.every((k, i) => k === base[i])
})
console.log(ok ? `locales built — ${base.length} keys in all 4` : 'PARITY FAILED')
