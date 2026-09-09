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
    date: L('8 October 2026', '8 Oktober 2026', '2026 年 10 月 8 日', '8 அக்டோபர் 2026'),
    time: L('2.30 PM onwards', '2.30 petang dan seterusnya', '下午 2.30 起', 'பிற்பகல் 2.30 முதல்'),
    venue: L(
      'Muzium Negara, Kuala Lumpur',
      'Muzium Negara, Kuala Lumpur',
      '国家博物馆，吉隆坡',
      'முசியும் நெகாரா, கோலாலம்பூர்',
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
      'The Kuala Lumpur skyline behind a Malaysian heritage building, with the national flag flying.',
      'Panorama Kuala Lumpur di belakang bangunan warisan Malaysia, dengan Jalur Gemilang berkibar.',
      '马来西亚传统建筑与吉隆坡天际线，国旗迎风飘扬。',
      'மலேசியப் பாரம்பரியக் கட்டிடத்தின் பின்னணியில் கோலாலம்பூர் நகர்க்காட்சி, தேசியக் கொடி பறக்கிறது.',
    ),
    peopleAlt: L(
      'Malaysians of different backgrounds standing together.',
      'Rakyat Malaysia daripada pelbagai latar belakang berdiri bersama.',
      '来自不同背景的马来西亚人并肩而立。',
      'வெவ்வேறு பின்னணிகளைச் சேர்ந்த மலேசியர்கள் ஒன்றாக நிற்கின்றனர்.',
    ),
  },

  pillars: {
    historyTitle: L('Our History', 'Sejarah Kita', '我们的历史', 'நமது வரலாறு'),
    historyText: L('A shared journey', 'Perjalanan bersama', '共同走过的路', 'பகிர்ந்த பயணம்'),
    peopleTitle: L('Our People', 'Rakyat Kita', '我们的人民', 'நமது மக்கள்'),
    peopleText: L('A stronger Malaysia', 'Malaysia yang lebih kukuh', '更强大的马来西亚', 'வலிமையான மலேசியா'),
    futureTitle: L('Our Future', 'Masa Depan Kita', '我们的未来', 'நமது எதிர்காலம்'),
    futureText: L('Generations to come', 'Generasi akan datang', '世代相传', 'வரவிருக்கும் தலைமுறைகள்'),
  },

  about: {
    title: L('About the Dialogue', 'Mengenai Dialog', '关于本对话', 'உரையாடல் பற்றி'),
    body: [
      L(
        'Seri Negara Dialogue is a national platform for thoughtful conversation on Malaysia’s journey — from Merdeka 70 towards Malaysia 100.',
        'Dialog Seri Negara ialah platform nasional untuk perbualan yang bermakna mengenai perjalanan Malaysia — daripada Merdeka 70 menuju Malaysia 100.',
        '斯里尼加拉对话是一个全国性平台，让我们深思马来西亚从独立 70 年迈向 100 年的旅程。',
        'சேரி நெகாரா உரையாடல், மெர்டேக்கா 70 இலிருந்து மலேசியா 100 நோக்கிய நமது பயணம் குறித்து ஆழமாக உரையாடுவதற்கான ஒரு தேசிய மேடை.',
      ),
      L(
        'It brings together leaders, thinkers and citizens to reflect on our shared history, address contemporary challenges, and explore a more united and prosperous future.',
        'Ia menghimpunkan pemimpin, pemikir dan rakyat untuk merenung sejarah bersama, menangani cabaran semasa, dan meneroka masa depan yang lebih bersatu dan makmur.',
        '它汇聚领袖、思想者与公民，共同回顾我们的历史、正视当代挑战，并探索更团结、更繁荣的未来。',
        'தலைவர்கள், சிந்தனையாளர்கள் மற்றும் குடிமக்களை ஒன்றிணைத்து, நமது பகிர்ந்த வரலாற்றைச் சிந்திக்கவும், தற்கால சவால்களை எதிர்கொள்ளவும், மேலும் ஒற்றுமையான வளமான எதிர்காலத்தை ஆராயவும் வழிவகுக்கிறது.',
      ),
    ],
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
    body: L(
      'How do we draw strength from our past, examine today’s realities, and build a stronger, more inclusive Malaysia for the next generation?',
      'Bagaimana kita menimba kekuatan daripada masa lalu, meneliti realiti hari ini, dan membina Malaysia yang lebih kukuh dan inklusif untuk generasi akan datang?',
      '我们如何从过往汲取力量、正视今日现实，并为下一代建设一个更强大、更包容的马来西亚？',
      'நமது கடந்த காலத்திலிருந்து வலிமை பெற்று, இன்றைய நிலைமைகளை ஆராய்ந்து, அடுத்த தலைமுறைக்கு வலிமையான, உள்ளடக்கிய மலேசியாவை எவ்வாறு கட்டியெழுப்புவது?',
    ),
    cta: L('Read more', 'Baca lanjut', '阅读更多', 'மேலும் படிக்க'),
    quote: L(
      'From the signing of our independence to the conversations that will shape our future, Seri Negara remains a home for the nation.',
      'Daripada pemeteraian kemerdekaan kita sehingga perbualan yang akan membentuk masa depan, Seri Negara kekal sebagai rumah untuk negara.',
      '从独立的签署，到形塑未来的每一场对话，斯里尼加拉始终是国家之家。',
      'நமது சுதந்திரம் கையெழுத்தான தருணம் முதல், நமது எதிர்காலத்தை வடிவமைக்கும் உரையாடல்கள் வரை — சேரி நெகாரா தேசத்தின் இல்லமாகவே நிலைக்கிறது.',
    ),
    questionsTitle: L('Questions before the room', 'Persoalan di hadapan kita', '摆在我们面前的提问', 'நம் முன் உள்ள வினாக்கள்'),
    questions: [
      L(
        'What does shared prosperity mean when growth and wages have moved apart?',
        'Apakah maksud kemakmuran bersama apabila pertumbuhan dan gaji semakin berjauhan?',
        '当经济增长与薪资水平渐行渐远，共享繁荣还意味着什么？',
        'வளர்ச்சியும் ஊதியமும் விலகிச் செல்லும்போது, பகிர்ந்த செழிப்பு என்பதன் பொருள் என்ன?',
      ),
      L(
        'Which institutions still earn public trust, and what restores the ones that do not?',
        'Institusi manakah yang masih mendapat kepercayaan rakyat, dan apa yang memulihkan yang selebihnya?',
        '哪些机构仍然赢得公众信任，而失去信任的又该如何重建？',
        'எந்த நிறுவனங்கள் இன்னும் மக்கள் நம்பிக்கையைப் பெறுகின்றன, இழந்தவற்றை எது மீட்கும்?',
      ),
      L(
        'How does a plural society argue well in public?',
        'Bagaimana masyarakat majmuk berhujah dengan baik di ruang awam?',
        '一个多元社会如何在公共领域好好地争论？',
        'பன்முகச் சமூகம் பொது வெளியில் எவ்வாறு நன்றாக விவாதிக்கும்?',
      ),
      L(
        'What should a Malaysian born in 2026 be able to expect?',
        'Apakah yang wajar diharapkan oleh rakyat Malaysia yang lahir pada 2026?',
        '一个在 2026 年出生的马来西亚人，应该能够期待什么？',
        '2026 இல் பிறக்கும் ஒரு மலேசியர் எதை எதிர்பார்க்க முடியும்?',
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
    cta: L('Read full message', 'Baca ucapan penuh', '阅读完整致辞', 'முழு உரையைப் படிக்க'),
  },

  speakers: {
    title: L('Speakers & Moderator', 'Pembentang & Moderator', '讲者与主持人', 'உரையாளர்களும் நெறியாளரும்'),
    sub: L(
      'Distinguished voices. A shared future.',
      'Suara terkemuka. Masa depan bersama.',
      '卓越的声音，共同的未来。',
      'சிறந்த குரல்கள். பகிர்ந்த எதிர்காலம்.',
    ),
    moderatorBadge: L('Moderator', 'Moderator', '主持人', 'நெறியாளர்'),
    viewProfile: L('View profile', 'Lihat profil', '查看简介', 'சுயவிவரம் காண்க'),
    profileOf: L('Profile of {{name}}', 'Profil {{name}}', '{{name}} 的简介', '{{name}} அவர்களின் சுயவிவரம்'),
    externalLink: L('Visit {{label}}', 'Lawati {{label}}', '前往 {{label}}', '{{label}} தளத்திற்குச் செல்க'),
    seeAll: L('See all speakers', 'Lihat semua pembentang', '查看全部讲者', 'அனைத்து உரையாளர்களையும் காண்க'),
  },

  programme: {
    title: L('Programme', 'Atur Cara', '议程', 'நிகழ்ச்சி நிரல்'),
    sub: L(
      'A timely conversation for a stronger tomorrow.',
      'Perbualan tepat pada masanya untuk hari esok yang lebih kukuh.',
      '一场适逢其时的对话，为更强大的明天。',
      'வலிமையான நாளைக்கான சரியான தருணத்தின் உரையாடல்.',
    ),
    quote: L(
      'A platform for meaningful dialogue across generations.',
      'Platform untuk dialog bermakna merentas generasi.',
      '一个跨越世代的有意义对话平台。',
      'தலைமுறைகளைக் கடந்த அர்த்தமுள்ள உரையாடலுக்கான மேடை.',
    ),
    note: L(
      'Timings may be adjusted closer to the event.',
      'Masa mungkin diselaraskan menghampiri tarikh acara.',
      '时间安排可能在活动前作出调整。',
      'நிகழ்வு நெருங்கும்போது நேரங்கள் மாறக்கூடும்.',
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
  },

  devices: {
    title: L(
      'A seamless experience across devices',
      'Pengalaman lancar merentas peranti',
      '跨装置的流畅体验',
      'அனைத்துச் சாதனங்களிலும் தடையற்ற அனுபவம்',
    ),
    mobile: L('Mobile friendly', 'Mesra mudah alih', '适配手机', 'கைபேசிக்கு ஏற்றது'),
    share: L('Easy to share', 'Mudah dikongsi', '易于分享', 'பகிர எளிது'),
    register: L('Simple registration', 'Pendaftaran mudah', '报名简便', 'எளிய பதிவு'),
    languages: L('Four languages', 'Empat bahasa', '四种语言', 'நான்கு மொழிகள்'),
    future: L('Built for the future', 'Dibina untuk masa depan', '为未来而建', 'எதிர்காலத்திற்காகக் கட்டப்பட்டது'),
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
      'Listed for reference. No partnership or sponsorship is implied.',
      'Disenaraikan sebagai rujukan. Tiada perkongsian atau penajaan tersirat.',
      '仅供参考，不代表任何合作或赞助关系。',
      'குறிப்புக்காக மட்டுமே. எந்தக் கூட்டாண்மையையோ ஆதரவையோ இது குறிக்கவில்லை.',
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
