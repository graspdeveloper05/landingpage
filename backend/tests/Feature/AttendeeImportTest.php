<?php

namespace Tests\Feature;

use App\Models\Registration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer;
use Tests\TestCase;

/**
 * Bulk-adding attendees who never registered on the website, e.g. ministry
 * staff on the organisers' own list. They become registrations marked
 * 'import', outside the seat limit, and are not arrived unless the file says.
 */
class AttendeeImportTest extends TestCase
{
    use RefreshDatabase;

    private const HEADER = 'name,email,mobile,organisation,designation,arrived';

    protected function setUp(): void
    {
        parent::setUp();
        config(['event.edition' => 2026, 'event.capacity' => 2]);
    }

    private function admin()
    {
        return $this->actingAs(User::factory()->create());
    }

    private function csv(string ...$rows): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('attendees.csv', implode("\n", [self::HEADER, ...$rows])."\n");
    }

    private function import(UploadedFile $file)
    {
        return $this->admin()->post('/api/admin/attendance/import', ['file' => $file], ['Accept' => 'application/json']);
    }

    public function test_imports_people_as_import_registrations_not_arrived(): void
    {
        $this->import($this->csv(
            'Aisyah Rahman,aisyah@example.com,+60 12 345 6789,Universiti Malaya,Senior Lecturer,',
            'Raj Kumar,raj@example.com,012-987 6543,Ministry of National Unity,Assistant Secretary,no',
        ))->assertOk()
            ->assertJsonPath('added', 2)
            ->assertJsonPath('skipped', 0)
            ->assertJsonPath('errors', []);

        $r = Registration::where('email', 'aisyah@example.com')->firstOrFail();
        $this->assertSame('import', $r->source);
        $this->assertSame(2026, (int) $r->edition);
        $this->assertSame('Universiti Malaya', $r->organisation);
        $this->assertMatchesRegularExpression('/^SND26-\d{4}$/', $r->reference);
        $this->assertNull($r->checked_in_at);
    }

    public function test_arrived_yes_marks_them_arrived_by_staff(): void
    {
        $this->import($this->csv('Mei Ling,mei@example.com,0176543210,CAM,Member,yes'))->assertOk();

        $r = Registration::firstOrFail();
        $this->assertNotNull($r->checked_in_at);
        $this->assertSame('staff', $r->checked_in_via);
    }

    public function test_the_seat_limit_does_not_apply_to_imports(): void
    {
        $this->import($this->csv(
            'A,a@example.com,0123456781,O,D,',
            'B,b@example.com,0123456782,O,D,',
            'C,c@example.com,0123456783,O,D,',
        ))->assertJsonPath('added', 3);

        $this->assertSame(3, Registration::count());
    }

    public function test_an_email_already_registered_is_skipped_not_duplicated(): void
    {
        $this->import($this->csv('A,a@example.com,0123456781,O,D,'))->assertJsonPath('added', 1);

        $this->import($this->csv(
            'A again,A@Example.com,0123456781,O,D,',
            'B,b@example.com,0123456782,O,D,',
            'B twice in one file,b@example.com,0123456782,O,D,',
        ))->assertJsonPath('added', 1)->assertJsonPath('skipped', 2);

        $this->assertSame(2, Registration::count());
    }

    public function test_bad_rows_are_reported_and_the_rest_still_import(): void
    {
        $this->import($this->csv(
            'Good,good@example.com,0123456789,O,D,',
            ',noname@example.com,0123456789,O,D,',
            'Bad Email,not-an-email,0123456789,O,D,',
            'Bad Phone,phone@example.com,call me,O,D,',
        ))->assertOk()
            ->assertJsonPath('added', 1)
            ->assertJsonCount(3, 'errors')
            ->assertJsonPath('errors.0.row', 3)
            ->assertJsonPath('errors.1.row', 4)
            ->assertJsonPath('errors.2.row', 5);

        $this->assertSame(1, Registration::count());
    }

    public function test_columns_can_come_in_any_order_and_case(): void
    {
        $file = UploadedFile::fake()->createWithContent('a.csv', "Email,Designation,Name,Mobile,Organisation\nz@example.com,Role,Zed,0123456789,Org\n");

        $this->import($file)->assertJsonPath('added', 1);
        $this->assertSame('Zed', Registration::firstOrFail()->full_name);
    }

    public function test_a_file_missing_a_required_column_is_refused(): void
    {
        $file = UploadedFile::fake()->createWithContent('a.csv', "name,email\nZed,z@example.com\n");

        $this->import($file)->assertUnprocessable()->assertJsonValidationErrors('file');
        $this->assertSame(0, Registration::count());
    }

    public function test_an_excel_file_imports_the_same_way(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'att').'.xlsx';
        $writer = new Writer();
        $writer->openToFile($path);
        $writer->addRow(Row::fromValues(['name', 'email', 'mobile', 'organisation', 'designation', 'arrived']));
        $writer->addRow(Row::fromValues(['Excel Person', 'excel@example.com', '0123456789', 'Ministry', 'Officer', 'yes']));
        $writer->close();

        $file = new UploadedFile($path, 'ministry-staff.xlsx', null, null, true);
        $this->import($file)->assertOk()->assertJsonPath('added', 1);

        $r = Registration::firstOrFail();
        $this->assertSame('Excel Person', $r->full_name);
        $this->assertNotNull($r->checked_in_at);
    }

    public function test_only_csv_or_excel_files_are_taken(): void
    {
        $this->import(UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf'))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file');
    }

    public function test_import_needs_a_session(): void
    {
        $this->post('/api/admin/attendance/import', ['file' => $this->csv()], ['Accept' => 'application/json'])
            ->assertUnauthorized();
    }

    public function test_the_tracker_shows_where_each_person_came_from(): void
    {
        $this->import($this->csv('A,a@example.com,0123456781,O,D,'));

        $this->getJson('/api/admin/attendance')->assertJsonPath('data.0.source', 'import');
    }
}
