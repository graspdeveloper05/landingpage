import type { Chairman, Speaker } from '@/data/types'

/* ============================================================================
 * PLACEHOLDER CONTENT — THESE PEOPLE DO NOT EXIST
 * ----------------------------------------------------------------------------
 * Every name, organisation and biography below is invented. They are written to
 * look realistic so the layout can be judged at true proportions — which also
 * means they can be mistaken for a confirmed line-up. Do not put this in front
 * of the client, a deck, or anything public until it is replaced.
 *
 * The roles (Former President, Chief Executive Officer, Academic and Author,
 * Social Leader, Policy Expert, Youth Leader, Business Leader, Moderator) come
 * from the approved UI/UX concept and are the part worth keeping.
 *
 * Replace each entry with confirmed details and drop `placeholder: true` as
 * each one is verified. `npm run check:placeholders` counts what is left.
 *
 * Portraits are neutral 5:6 SVGs in /public/portraits — swap for professional
 * photographs at the same ratio.
 * ==========================================================================*/

export const speakers: Speaker[] = [
  {
    id: 'sp-01',
    name: 'Tan Sri Dr. Zulkifli bin Mahmud',
    designation: {
      en: 'Former President',
      ms: 'Bekas Presiden',
      zh: '前任主席',
      ta: 'முன்னாள் தலைவர்',
    },
    organisation: 'Institute of Public Administration Malaysia',
    portrait: '/portraits/placeholder-01.svg',
    bio: {
      en: 'Spent three decades in the public service, latterly leading reform of federal–state coordination. Now writes and lectures on the design of Malaysian institutions.',
      ms: 'Berkhidmat tiga dekad dalam perkhidmatan awam, terkini memimpin reformasi penyelarasan persekutuan–negeri. Kini menulis dan memberi kuliah mengenai reka bentuk institusi Malaysia.',
      zh: '在公共服务领域任职三十年，近年主导联邦与州政府协调机制的改革，现从事马来西亚制度设计的写作与教学。',
      ta: 'மூன்று தசாப்தங்கள் பொதுப் பணியில் இருந்தார்; சமீபத்தில் மத்திய–மாநில ஒருங்கிணைப்புச் சீர்திருத்தத்தை வழிநடத்தினார். தற்போது மலேசிய நிறுவனங்களின் வடிவமைப்பு குறித்து எழுதுகிறார், விரிவுரை ஆற்றுகிறார்.',
    },
    role: 'speaker',
    placeholder: true,
  },
  {
    id: 'sp-02',
    name: 'Datin Sri Cheah Su Lin',
    designation: {
      en: 'Chief Executive Officer',
      ms: 'Ketua Pegawai Eksekutif',
      zh: '首席执行官',
      ta: 'தலைமை நிர்வாக அதிகாரி',
    },
    organisation: 'Nusantara Capital Group',
    portrait: '/portraits/placeholder-02.svg',
    bio: {
      en: 'Leads a regional investment group with a focus on productivity and higher-value industry. A frequent voice on wages and the shape of Malaysian growth.',
      ms: 'Mengetuai kumpulan pelaburan serantau yang menumpukan produktiviti dan industri bernilai tinggi. Kerap memberi pandangan mengenai gaji dan corak pertumbuhan Malaysia.',
      zh: '领导一家专注于生产力与高附加值产业的区域投资集团，长期就薪资水平与马来西亚增长格局发声。',
      ta: 'உற்பத்தித்திறன் மற்றும் உயர் மதிப்புத் தொழில்துறையில் கவனம் செலுத்தும் ஒரு பிராந்திய முதலீட்டுக் குழுவை வழிநடத்துகிறார். ஊதியம் மற்றும் மலேசிய வளர்ச்சியின் தன்மை குறித்து அடிக்கடி கருத்து தெரிவிப்பவர்.',
    },
    role: 'speaker',
    placeholder: true,
  },
  {
    id: 'sp-03',
    name: 'Professor Dr. Meena Ramakrishnan',
    designation: {
      en: 'Academic and Author',
      ms: 'Ahli Akademik dan Penulis',
      zh: '学者兼作家',
      ta: 'கல்வியாளர் மற்றும் எழுத்தாளர்',
    },
    organisation: 'Faculty of Social Sciences, Universiti Malaya',
    portrait: '/portraits/placeholder-03.svg',
    bio: {
      en: 'Teaches and publishes on constitutional history and how plural societies argue in public. Author of three books on Malaysian civic life.',
      ms: 'Mengajar dan menerbitkan kajian mengenai sejarah perlembagaan dan cara masyarakat majmuk berhujah di ruang awam. Penulis tiga buah buku mengenai kehidupan sivik Malaysia.',
      zh: '教学与研究领域涵盖宪政史，以及多元社会如何在公共领域展开辩论，著有三部关于马来西亚公民生活的作品。',
      ta: 'அரசியலமைப்பு வரலாறு மற்றும் பன்முகச் சமூகங்கள் பொது வெளியில் விவாதிக்கும் முறை குறித்து கற்பிக்கிறார், நூல்கள் வெளியிடுகிறார். மலேசியக் குடிமை வாழ்வு குறித்த மூன்று நூல்களின் ஆசிரியர்.',
    },
    role: 'speaker',
    placeholder: true,
  },
  {
    id: 'sp-04',
    name: 'Puan Sharifah Aminah binti Yusof',
    designation: {
      en: 'Social Leader',
      ms: 'Pemimpin Sosial',
      zh: '社会领袖',
      ta: 'சமூகத் தலைவர்',
    },
    organisation: 'Yayasan Harmoni Malaysia',
    portrait: '/portraits/placeholder-04.svg',
    bio: {
      en: 'Builds community programmes across Peninsular Malaysia, working on cohesion between neighbourhoods that rarely meet. Twenty years in the non-profit sector.',
      ms: 'Membina program komuniti di seluruh Semenanjung Malaysia, memberi tumpuan kepada perpaduan antara kejiranan yang jarang bertemu. Dua puluh tahun dalam sektor bukan untung.',
      zh: '在马来西亚半岛推动社区计划，致力于促进平日鲜少往来的社区之间的融合，投身非营利领域二十年。',
      ta: 'மலாய் தீபகற்பம் முழுவதும் சமூகத் திட்டங்களை உருவாக்குகிறார்; அரிதாகவே சந்திக்கும் அக்கம்பக்கங்களுக்கிடையேயான ஒற்றுமையில் பணியாற்றுகிறார். இலாப நோக்கற்ற துறையில் இருபது ஆண்டுகள்.',
    },
    role: 'speaker',
    placeholder: true,
  },
  {
    id: 'sp-05',
    name: 'Encik Daniel Tan Chee Meng',
    designation: {
      en: 'Policy Expert',
      ms: 'Pakar Dasar',
      zh: '政策专家',
      ta: 'கொள்கை நிபுணர்',
    },
    organisation: 'Institute of Strategic and International Studies',
    portrait: '/portraits/placeholder-05.svg',
    bio: {
      en: 'Researches public trust in institutions and what it takes to rebuild it. Advises on national development planning.',
      ms: 'Menyelidik kepercayaan rakyat terhadap institusi dan apa yang diperlukan untuk memulihkannya. Menasihati perancangan pembangunan negara.',
      zh: '研究公众对制度的信任及其重建路径，并参与国家发展规划的咨询工作。',
      ta: 'நிறுவனங்கள் மீதான மக்கள் நம்பிக்கையையும், அதை மீளக் கட்டியெழுப்பத் தேவையானவற்றையும் ஆய்வு செய்கிறார். தேசிய வளர்ச்சித் திட்டமிடலில் ஆலோசனை வழங்குகிறார்.',
    },
    role: 'speaker',
    placeholder: true,
  },
  {
    id: 'sp-06',
    name: 'Cik Nur Aisyah binti Roslan',
    designation: {
      en: 'Youth Leader',
      ms: 'Pemimpin Belia',
      zh: '青年领袖',
      ta: 'இளையோர் தலைவர்',
    },
    organisation: 'Suara Belia Malaysia',
    portrait: '/portraits/placeholder-06.svg',
    bio: {
      en: 'Works on civic participation among first-time voters and rural youth enterprise in Sabah and Sarawak. Chevening alumna.',
      ms: 'Bergiat dalam penyertaan sivik pengundi kali pertama serta keusahawanan belia luar bandar di Sabah dan Sarawak. Alumni Chevening.',
      zh: '致力于提升首投族的公民参与，以及沙巴与砂拉越乡区青年的创业发展，Chevening 校友。',
      ta: 'முதல் முறை வாக்காளர்களின் குடிமைப் பங்கேற்பு மற்றும் சபா, சரவாக்கின் கிராமப்புற இளையோர் தொழில்முனைவில் பணியாற்றுகிறார். Chevening முன்னாள் மாணவி.',
    },
    role: 'speaker',
    placeholder: true,
  },
  {
    id: 'sp-07',
    name: 'Dato’ Vijay Kumar Selvarajah',
    designation: {
      en: 'Business Leader',
      ms: 'Pemimpin Perniagaan',
      zh: '商界领袖',
      ta: 'வணிகத் தலைவர்',
    },
    organisation: 'Selvarajah Group Holdings',
    portrait: '/portraits/placeholder-07.svg',
    bio: {
      en: 'Built a family manufacturing business into a regional group employing four thousand people. Speaks on skills, wages and industrial transition.',
      ms: 'Membangunkan perniagaan pembuatan keluarga menjadi kumpulan serantau yang menggaji empat ribu pekerja. Berucap mengenai kemahiran, gaji dan peralihan industri.',
      zh: '将家族制造业发展为雇用四千人的区域集团，常就技能培训、薪资与产业转型发表见解。',
      ta: 'குடும்ப உற்பத்தி நிறுவனத்தை நான்காயிரம் பேருக்கு வேலை வழங்கும் பிராந்தியக் குழுமமாக வளர்த்தவர். திறன்கள், ஊதியம் மற்றும் தொழில்துறை மாற்றம் குறித்து உரையாற்றுகிறார்.',
    },
    role: 'speaker',
    placeholder: true,
  },
  {
    id: 'mod-01',
    name: 'Ms. Melissa Chong Wai Yee',
    designation: {
      en: 'Moderator',
      ms: 'Moderator',
      zh: '主持人',
      ta: 'நெறியாளர்',
    },
    organisation: 'Independent Broadcast Journalist',
    portrait: '/portraits/placeholder-08.svg',
    bio: {
      en: 'Two decades interviewing Malaysian public figures across radio and television. Moderates both afternoon panels.',
      ms: 'Dua dekad menemu bual tokoh awam Malaysia menerusi radio dan televisyen. Mengendalikan kedua-dua sesi panel petang.',
      zh: '二十年来在广播与电视上访问马来西亚公众人物，主持下午的两场对谈。',
      ta: 'இரண்டு தசாப்தங்களாக வானொலி மற்றும் தொலைக்காட்சியில் மலேசியப் பொதுநபர்களை நேர்காணல் செய்துள்ளார். மதிய அமர்வுகள் இரண்டையும் நெறிப்படுத்துகிறார்.',
    },
    role: 'moderator',
    placeholder: true,
  },
]

/** PLACEHOLDER — invented. Replace with the confirmed chairman's message. */
export const chairman: Chairman = {
  name: 'Dato’ Rahman bin Abdullah',
  designation: {
    en: 'Organising Chairman, Seri Negara Dialogue 2026',
    ms: 'Pengerusi Penganjur, Dialog Seri Negara 2026',
    zh: '2026 年斯里尼加拉对话筹委会主席',
    ta: 'ஏற்பாட்டுத் தலைவர், சேரி நெகாரா உரையாடல் 2026',
  },
  organisation: 'Chevening Alumni Malaysia',
  portrait: '/portraits/placeholder-chair.svg',
  message: {
    en: 'This Dialogue is an invitation — for all of us — to reflect, to listen, and to shape a stronger Malaysia together.',
    ms: 'Dialog ini adalah jemputan — untuk kita semua — agar merenung, mendengar, dan membina Malaysia yang lebih kukuh bersama-sama.',
    zh: '这场对话是一份邀请——邀请我们每一个人一同反思、聆听，携手塑造更强大的马来西亚。',
    ta: 'இந்த உரையாடல் நம் அனைவருக்குமான ஓர் அழைப்பு — சிந்திக்கவும், கேட்கவும், வலிமையான மலேசியாவை இணைந்து உருவாக்கவும்.',
  },
  quote: {
    en: 'A more united and progressive Malaysia is a future we can build together.',
    ms: 'Malaysia yang lebih bersatu dan progresif ialah masa depan yang boleh kita bina bersama.',
    zh: '一个更团结、更进步的马来西亚，是我们能够共同建构的未来。',
    ta: 'மேலும் ஒற்றுமையான, முன்னேற்றமான மலேசியா — நாம் இணைந்து கட்டியெழுப்பக்கூடிய எதிர்காலம்.',
  },
  placeholder: true,
}
