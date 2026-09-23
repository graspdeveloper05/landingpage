<?php

namespace Tests\Feature;

use App\Models\Registration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/** The Chevening questions on the site's registration form. */
class RegistrationAnswersTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        config(['event.edition' => 2026, 'event.capacity' => 200]);
    }

    private function register(array $overrides = [])
    {
        return $this->postJson('/api/registrations', [
            'fullName' => 'Aisyah Rahman',
            'email' => 'aisyah@example.com',
            'mobile' => '+60 12 345 6789',
            'organisation' => 'Universiti Malaya',
            'designation' => 'Lecturer',
            'dietary' => '',
            'cheveningScholar' => 'yes',
            'cheveningCohort' => '2019/20',
            'cheveningUniversity' => 'University of Edinburgh',
            'camMember' => 'no',
            'pdpaAccepted' => true,
            ...$overrides,
        ]);
    }

    public function test_a_scholar_is_saved_with_their_alumni_details(): void
    {
        $this->register()->assertCreated();

        $this->assertSame([
            'chevening_scholar' => 'Yes',
            'chevening_cohort' => '2019/20',
            'chevening_university' => 'University of Edinburgh',
            'cam_member' => 'No',
        ], Registration::firstOrFail()->answers);
    }

    public function test_a_non_scholar_is_not_asked_for_alumni_details(): void
    {
        // Leftover values from toggling Yes then No are dropped, not stored.
        $this->register(['cheveningScholar' => 'no', 'cheveningCohort' => '2019/20'])->assertCreated();

        $this->assertSame(['chevening_scholar' => 'No'], Registration::firstOrFail()->answers);
    }

    public function test_the_questions_are_required(): void
    {
        $this->register(['cheveningScholar' => null])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['cheveningScholar']);

        $this->register(['cheveningCohort' => '', 'cheveningUniversity' => '', 'camMember' => null])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['cheveningCohort', 'cheveningUniversity', 'camMember']);
    }

    public function test_the_csv_carries_the_answers(): void
    {
        $this->register()->assertCreated();
        config(['event.admin_token' => 'tok']);

        $csv = $this->get('/api/admin/registrations', ['Authorization' => 'Bearer tok'])->streamedContent();
        $lines = array_map('str_getcsv', preg_split('/\r?\n/', trim(substr($csv, 3))));
        $row = array_combine($lines[0], $lines[1]);

        $this->assertSame('Yes', $row['Chevening scholar']);
        $this->assertSame('2019/20', $row['Chevening cohort']);
        $this->assertSame('No', $row['CAM member']);
    }

    public function test_a_deleted_registration_does_not_make_the_next_reference_collide(): void
    {
        foreach (['a', 'b', 'c'] as $who) {
            $this->register(['email' => "{$who}@example.com"])->assertCreated();
        }
        // References SND26-0001..0003. Deleting the first leaves two rows, so
        // "count + 1" would hand out SND26-0003 again.
        Registration::where('reference', 'SND26-0001')->delete();

        $this->register(['email' => 'd@example.com'])
            ->assertCreated()
            ->assertJson(['reference' => 'SND26-0004']);
    }
}
