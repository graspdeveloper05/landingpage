<?php

namespace Database\Seeders;

use App\Models\Survey;
use Illuminate\Database\Seeder;

/**
 * The organising team's three forms for the 2026 dialogue, from their mock
 * forms, in English and Bahasa Melayu:
 *
 * - pre-event questionnaire  /survey/pre-event        (open)
 * - participant feedback     /feedback/dialogue-2026  (inactive until the day)
 * - questions from the floor /survey/ask              (inactive until the day)
 *
 * Safe to run again: a form is found by its short link. One that nobody has
 * answered yet is brought back to the wording below; one with answers is
 * left exactly as it is, so the team's own edits and the answers survive.
 * A form's status is set only when it is first created.
 *
 *     php artisan db:seed --class=EventFormsSeeder --force
 */
class EventFormsSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([$this->preEvent(), $this->feedback(), $this->ask()] as $form) {
            $this->install($form);
        }
    }

    private function install(array $form): void
    {
        $questions = $form['questions'];
        $status = $form['status'];
        unset($form['questions'], $form['status']);

        $survey = Survey::where('slug', $form['slug'])->first();

        if ($survey && $survey->responses()->exists()) {
            return;
        }

        if ($survey) {
            $survey->update($form);
            $survey->questions()->delete();
        } else {
            $survey = Survey::create($form + ['status' => $status]);
        }

        foreach (array_values($questions) as $order => $q) {
            $survey->questions()->create($q + [
                'status' => 'open',
                'display_order' => $order,
                'is_required' => false,
            ]);
        }
    }

    /** Each option as English and Malay. */
    private function options(array $pairs): array
    {
        return array_map(fn ($p) => ['en' => $p[0], 'ms' => $p[1]], $pairs);
    }

    private function preEvent(): array
    {
        return [
            'slug' => 'pre-event',
            'form_type' => 'survey',
            'status' => 'open',
            'title' => ['en' => 'Before the Dialogue', 'ms' => 'Sebelum Dialog'],
            'description' => [
                // Two lines: the first is shown as a heading over the second.
                'en' => "Your views on Malaysia’s shared future\nHelp shape the conversation on belonging and nationhood. There are no right or wrong answers. Please share your honest views.",
                'ms' => "Pandangan anda tentang masa depan bersama Malaysia\nBantu membentuk perbincangan tentang rasa kekitaan dan kebangsaan. Tiada jawapan betul atau salah. Sila kongsikan pandangan jujur anda.",
            ],
            'fields' => ['name' => 'required', 'email' => 'required', 'mobile' => 'off', 'organisation' => 'optional'],
            'details_note' => [
                // The client's own wording (7 Oct).
                'en' => 'Responses will be linked to your name for the organising team’s review. Findings will be presented collectively. Your name will not be attached to a published quotation without your permission.',
                'ms' => 'Jawapan akan dikaitkan dengan nama anda untuk semakan pasukan penganjur. Dapatan akan dibentangkan secara kolektif. Nama anda tidak akan dilampirkan pada petikan yang diterbitkan tanpa kebenaran anda.',
            ],
            'questions' => [
                [
                    'section' => [
                        'title' => ['en' => 'Your perspective matters', 'ms' => 'Pandangan anda penting'],
                        'intro' => ['en' => 'Two questions on belonging and nationhood.', 'ms' => 'Dua soalan tentang rasa kekitaan dan kebangsaan.'],
                    ],
                    'type' => 'choice',
                    'layout' => 'scale',
                    'is_required' => true,
                    'question' => [
                        'en' => 'How strong is your sense of belonging to Malaysia?',
                        'ms' => 'Sejauh manakah kuatnya rasa kekitaan anda terhadap Malaysia?',
                    ],
                    'options' => $this->options([
                        ['Very weak', 'Sangat lemah'], ['Weak', 'Lemah'], ['Moderate', 'Sederhana'],
                        ['Strong', 'Kuat'], ['Very strong', 'Sangat kuat'], ['Not sure', 'Tidak pasti'],
                    ]),
                ],
                [
                    'type' => 'choice',
                    'layout' => 'scale',
                    'is_required' => true,
                    'question' => [
                        'en' => 'To what extent do you feel Malaysians share a common sense of nationhood, while respecting their different identities?',
                        'ms' => 'Sejauh manakah anda merasakan rakyat Malaysia berkongsi rasa kebangsaan yang sama, sambil menghormati identiti masing-masing yang berbeza?',
                    ],
                    'help' => [
                        'en' => 'Nationhood means belonging to one nation and sharing responsibility for its future.',
                        'ms' => 'Kebangsaan bermaksud menjadi sebahagian daripada satu negara dan berkongsi tanggungjawab terhadap masa depannya.',
                    ],
                    'options' => $this->options([
                        ['Not at all', 'Langsung tidak'], ['To a small extent', 'Pada tahap kecil'],
                        ['To a moderate extent', 'Pada tahap sederhana'], ['To a large extent', 'Pada tahap besar'],
                        ['To a great extent', 'Pada tahap sangat besar'], ['Not sure', 'Tidak pasti'],
                    ]),
                ],
                [
                    'section' => [
                        'title' => ['en' => 'Shaping the conversation', 'ms' => 'Membentuk perbincangan'],
                        'intro' => ['en' => 'What the dialogue should take on.', 'ms' => 'Perkara yang perlu diketengahkan dalam dialog.'],
                    ],
                    'type' => 'checkbox',
                    'max_choices' => 3,
                    'has_other' => true,
                    'is_required' => true,
                    'question' => [
                        'en' => 'Which areas most need attention to strengthen Malaysia’s shared future?',
                        'ms' => 'Bidang manakah yang paling memerlukan perhatian untuk mengukuhkan masa depan bersama Malaysia?',
                    ],
                    'options' => $this->options([
                        ['Education', 'Pendidikan'],
                        ['Economic opportunity and inequality', 'Peluang ekonomi dan ketidaksamaan'],
                        ['Public service and institutions', 'Perkhidmatan awam dan institusi'],
                        ['Political leadership and accountability', 'Kepimpinan politik dan akauntabiliti'],
                        ['Relations across ethnic and religious communities', 'Hubungan antara komuniti etnik dan agama'],
                        ['Shared history and national identity', 'Sejarah bersama dan identiti nasional'],
                        ['Youth participation', 'Penglibatan belia'],
                    ]),
                ],
                [
                    'type' => 'choice',
                    'layout' => 'scale',
                    'is_required' => true,
                    'question' => [
                        'en' => 'How comfortable do you feel discussing ethnic, religious or national identity issues with people whose views differ from yours?',
                        'ms' => 'Sejauh manakah anda berasa selesa membincangkan isu identiti etnik, agama atau nasional dengan orang yang pandangannya berbeza daripada anda?',
                    ],
                    'options' => $this->options([
                        ['Very uncomfortable', 'Sangat tidak selesa'], ['Somewhat uncomfortable', 'Agak tidak selesa'],
                        ['Neither comfortable nor uncomfortable', 'Antara selesa dan tidak selesa'],
                        ['Somewhat comfortable', 'Agak selesa'], ['Very comfortable', 'Sangat selesa'],
                        ['Not sure', 'Tidak pasti'],
                    ]),
                ],
                [
                    'type' => 'text',
                    'max_length' => 300,
                    'question' => [
                        'en' => 'What is the ONE question you would most like the panel to address?',
                        'ms' => 'Apakah SATU soalan yang paling anda ingin panel jawab?',
                    ],
                    'help' => [
                        'en' => 'Similar questions may be grouped. We may not be able to address every question.',
                        'ms' => 'Soalan yang serupa mungkin digabungkan. Kami mungkin tidak dapat menjawab setiap soalan.',
                    ],
                ],
            ],
        ];
    }

    private function feedback(): array
    {
        $agree = $this->options([
            ['Strongly agree', 'Sangat setuju'], ['Agree', 'Setuju'],
            ['Neither agree nor disagree', 'Tidak setuju dan tidak juga tidak setuju'],
            ['Disagree', 'Tidak setuju'], ['Strongly disagree', 'Sangat tidak setuju'],
        ]);

        return [
            'slug' => 'dialogue-2026',
            'form_type' => 'feedback',
            'status' => 'draft',
            'title' => ['en' => 'Participant Feedback', 'ms' => 'Maklum Balas Peserta'],
            'description' => [
                'en' => 'Seri Negara Dialogue 2026. Positive feedback and constructive criticism are equally welcome. Written comments are optional.',
                'ms' => 'Dialog Seri Negara 2026. Maklum balas positif dan kritikan membina sama-sama dialu-alukan. Komen bertulis adalah pilihan.',
            ],
            'fields' => ['name' => 'required', 'email' => 'required', 'mobile' => 'off', 'organisation' => 'optional'],
            'details_note' => [
                'en' => 'Your name and email help us compare pre-event and post-event responses; please use the same email as your registration and pre-event survey. Individual responses are accessible only to authorised organisers; findings will be reported collectively. Named publication requires separate testimonial permission.',
                'ms' => 'Nama dan e-mel anda membantu kami membandingkan jawapan sebelum dan selepas acara; sila gunakan e-mel yang sama seperti pendaftaran dan tinjauan pra-acara anda. Jawapan individu hanya boleh diakses oleh penganjur yang diberi kuasa; dapatan akan dilaporkan secara kolektif. Penerbitan bernama memerlukan kebenaran testimoni yang berasingan.',
            ],
            'questions' => [
                [
                    'section' => [
                        'title' => ['en' => 'Your voice. Our shared future.', 'ms' => 'Suara anda. Masa depan bersama kita.'],
                        'intro' => ['en' => 'How the dialogue went for you.', 'ms' => 'Pengalaman anda dalam dialog ini.'],
                    ],
                    'type' => 'choice',
                    'is_required' => true,
                    'question' => ['en' => 'Overall, how would you rate the dialogue?', 'ms' => 'Secara keseluruhan, bagaimanakah anda menilai dialog ini?'],
                    'options' => $this->options([
                        ['Excellent', 'Cemerlang'], ['Good', 'Baik'], ['Fair', 'Sederhana'],
                        ['Poor', 'Lemah'], ['Very poor', 'Sangat lemah'],
                    ]),
                ],
                [
                    'type' => 'grid',
                    'is_required' => true,
                    'question' => ['en' => 'To what extent do you agree with these statements?', 'ms' => 'Sejauh manakah anda bersetuju dengan kenyataan berikut?'],
                    'help' => ['en' => 'Choose one response for each statement.', 'ms' => 'Pilih satu jawapan bagi setiap kenyataan.'],
                    'statements' => $this->options([
                        ['The discussion addressed issues relevant to Malaysia’s shared future.', 'Perbincangan menyentuh isu yang berkaitan dengan masa depan bersama Malaysia.'],
                        ['The dialogue brought together a useful range of perspectives.', 'Dialog ini menghimpunkan pelbagai perspektif yang bermanfaat.'],
                        ['Different viewpoints were treated respectfully.', 'Pandangan yang berbeza dilayan dengan hormat.'],
                        ['The dialogue deepened my understanding of what it means to build a nation together.', 'Dialog ini mendalamkan pemahaman saya tentang makna membina negara bersama-sama.'],
                    ]),
                    'options' => $agree,
                ],
                [
                    'section' => [
                        'title' => ['en' => 'Make the next dialogue better.', 'ms' => 'Jadikan dialog seterusnya lebih baik.'],
                        'intro' => ['en' => 'What resonated, what could improve, and what should follow?', 'ms' => 'Apa yang memberi kesan, apa yang boleh diperbaiki, dan apa yang patut menyusul?'],
                    ],
                    'type' => 'choice',
                    'is_required' => true,
                    'question' => ['en' => 'Was there sufficient opportunity for audience questions and participation?', 'ms' => 'Adakah terdapat peluang yang mencukupi untuk soalan dan penyertaan hadirin?'],
                    'options' => $this->options([
                        ['Yes', 'Ya'], ['To some extent', 'Sedikit sebanyak'], ['No', 'Tidak'], ['Not sure / N/A', 'Tidak pasti / Tidak berkaitan'],
                    ]),
                ],
                [
                    'type' => 'text',
                    'max_length' => 1000,
                    'question' => ['en' => 'What is one idea, insight or moment from the dialogue that stayed with you?', 'ms' => 'Apakah satu idea, pandangan atau detik daripada dialog ini yang paling diingati?'],
                ],
                [
                    'type' => 'text',
                    'max_length' => 1000,
                    'question' => ['en' => 'What is one thing we could improve?', 'ms' => 'Apakah satu perkara yang boleh kami perbaiki?'],
                    'help' => ['en' => 'You may comment on the discussion, format or event arrangements.', 'ms' => 'Anda boleh mengulas tentang perbincangan, format atau susunan acara.'],
                ],
                [
                    'type' => 'text',
                    'max_length' => 1000,
                    'question' => ['en' => 'What is one issue or proposal from today that Chevening Alumni Malaysia should take forward?', 'ms' => 'Apakah satu isu atau cadangan daripada hari ini yang patut diteruskan oleh Chevening Alumni Malaysia?'],
                ],
                [
                    'section' => [
                        'title' => ['en' => 'A future worth shaping.', 'ms' => 'Masa depan yang wajar dibentuk.'],
                        'intro' => ['en' => 'Future priorities for the dialogue series.', 'ms' => 'Keutamaan masa depan bagi siri dialog ini.'],
                    ],
                    'type' => 'checkbox',
                    'max_choices' => 4,
                    'has_other' => true,
                    'question' => ['en' => 'Which topics would you most like future Seri Negara Dialogues to explore?', 'ms' => 'Topik manakah yang paling anda ingin diterokai dalam Dialog Seri Negara akan datang?'],
                    'options' => $this->options([
                        ['A shared Malaysian identity and sense of belonging', 'Identiti Malaysia bersama dan rasa kekitaan'],
                        ['Building trust across communities', 'Membina kepercayaan antara komuniti'],
                        ['Education, history and how we understand Malaysia', 'Pendidikan, sejarah dan cara kita memahami Malaysia'],
                        ['Youth voices and participation in nation-building', 'Suara belia dan penyertaan dalam pembinaan negara'],
                        ['Economic opportunity, inequality and social cohesion', 'Peluang ekonomi, ketidaksamaan dan perpaduan sosial'],
                        ['Public service delivery and responsiveness to citizens', 'Penyampaian perkhidmatan awam dan kepekaan kepada rakyat'],
                        ['Politics, democratic participation and political leadership', 'Politik, penyertaan demokratik dan kepimpinan politik'],
                        ['Governance, accountability and trust in institutions', 'Tadbir urus, akauntabiliti dan kepercayaan terhadap institusi'],
                        ['Federal–state relations and the place of Sabah and Sarawak', 'Hubungan persekutuan–negeri dan kedudukan Sabah dan Sarawak'],
                        ['Social media, misinformation and relationships between communities', 'Media sosial, maklumat salah dan hubungan antara komuniti'],
                        ['Practical examples of communities working together', 'Contoh praktikal komuniti yang bekerjasama'],
                    ]),
                ],
                [
                    'type' => 'choice',
                    'is_required' => true,
                    'question' => ['en' => 'Would you attend another Seri Negara Dialogue?', 'ms' => 'Adakah anda akan menghadiri Dialog Seri Negara yang lain?'],
                    'options' => $this->options([['Yes', 'Ya'], ['Maybe', 'Mungkin'], ['No', 'Tidak']]),
                ],
                [
                    'section' => [
                        'title' => ['en' => 'A moment to reflect.', 'ms' => 'Saat untuk merenung.'],
                        'intro' => ['en' => 'Answer based on how you feel now. These questions repeat the pre-event survey.', 'ms' => 'Jawab berdasarkan perasaan anda sekarang. Soalan-soalan ini mengulangi tinjauan pra-acara.'],
                    ],
                    'type' => 'choice',
                    'layout' => 'scale',
                    'is_required' => true,
                    'question' => ['en' => 'How strong is your sense of belonging to Malaysia?', 'ms' => 'Sejauh manakah kuatnya rasa kekitaan anda terhadap Malaysia?'],
                    'options' => $this->options([
                        ['Very weak', 'Sangat lemah'], ['Weak', 'Lemah'], ['Moderate', 'Sederhana'],
                        ['Strong', 'Kuat'], ['Very strong', 'Sangat kuat'],
                    ]),
                ],
                [
                    'type' => 'choice',
                    'layout' => 'scale',
                    'is_required' => true,
                    'question' => [
                        'en' => 'To what extent do you feel Malaysians share a common sense of nationhood, while respecting their different identities?',
                        'ms' => 'Sejauh manakah anda merasakan rakyat Malaysia berkongsi rasa kebangsaan yang sama, sambil menghormati identiti masing-masing yang berbeza?',
                    ],
                    'options' => $this->options([
                        ['Not at all', 'Langsung tidak'], ['To a small extent', 'Pada tahap kecil'],
                        ['To some extent', 'Pada tahap tertentu'], ['To a considerable extent', 'Pada tahap yang agak besar'],
                        ['To a great extent', 'Pada tahap sangat besar'], ['Not sure', 'Tidak pasti'],
                    ]),
                ],
                [
                    'type' => 'choice',
                    'layout' => 'scale',
                    'is_required' => true,
                    'question' => [
                        'en' => 'How comfortable do you feel discussing ethnic, religious or national identity issues with people whose views differ from yours?',
                        'ms' => 'Sejauh manakah anda berasa selesa membincangkan isu identiti etnik, agama atau nasional dengan orang yang pandangannya berbeza daripada anda?',
                    ],
                    'options' => $this->options([
                        ['Very uncomfortable', 'Sangat tidak selesa'], ['Uncomfortable', 'Tidak selesa'],
                        ['Neither comfortable nor uncomfortable', 'Antara selesa dan tidak selesa'],
                        ['Comfortable', 'Selesa'], ['Very comfortable', 'Sangat selesa'],
                    ]),
                ],
            ],
        ];
    }

    private function ask(): array
    {
        return [
            'slug' => 'ask',
            'form_type' => 'survey',
            'status' => 'draft',
            'title' => ['en' => 'Questions from the Floor', 'ms' => 'Soalan daripada Hadirin'],
            'description' => [
                'en' => 'Put a question to the panel. Short, clear questions are easiest for the moderator to bring in.',
                'ms' => 'Ajukan soalan kepada panel. Soalan yang ringkas dan jelas lebih mudah dibawa oleh moderator.',
            ],
            'fields' => ['name' => 'optional', 'email' => 'off', 'mobile' => 'off', 'organisation' => 'optional'],
            'details_note' => [
                'en' => 'Your name is optional. The moderator may read your question aloud, with your name if you give one.',
                'ms' => 'Nama anda adalah pilihan. Moderator mungkin membacakan soalan anda, bersama nama anda jika diberikan.',
            ],
            'questions' => [
                [
                    'type' => 'text',
                    'max_length' => 300,
                    'is_required' => true,
                    'question' => ['en' => 'Your question for the panel', 'ms' => 'Soalan anda kepada panel'],
                    'help' => [
                        'en' => 'Similar questions may be grouped. We may not be able to address every question.',
                        'ms' => 'Soalan yang serupa mungkin digabungkan. Kami mungkin tidak dapat menjawab setiap soalan.',
                    ],
                ],
            ],
        ];
    }
}
