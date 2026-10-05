<?php

namespace App\Support;

use App\Models\Registration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use OpenSpout\Reader\CSV\Reader as CsvReader;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;

/**
 * Adds attendees from the organisers' own list (CSV or Excel): people who
 * never registered on the website, such as ministry staff. Each becomes a
 * registration marked 'import', outside the seat limit, and arrived only if
 * the file says so.
 */
class AttendeeImport
{
    /** Columns the file must have; 'arrived' is optional. */
    public const REQUIRED = ['name', 'email', 'mobile', 'organisation', 'designation'];

    /** @var list<array{row:int, message:string}> */
    private array $errors = [];

    private int $added = 0;

    private int $skipped = 0;

    /**
     * @return array{added:int, skipped:int, errors:list<array{row:int, message:string}>}
     *
     * @throws \InvalidArgumentException when a required column is missing.
     */
    public function run(string $path, string $extension): array
    {
        $rows = $this->rows($path, $extension);
        $header = array_map(fn ($h) => strtolower(trim((string) $h)), array_shift($rows) ?? []);

        $missing = array_diff(self::REQUIRED, $header);
        if ($missing !== []) {
            throw new \InvalidArgumentException('The file needs these columns: '.implode(', ', $missing).'.');
        }

        $edition = (int) config('event.edition');
        $prefix = (string) config('event.reference_prefix');
        $seen = [];

        foreach ($rows as $i => $cells) {
            $line = $i + 2; // the header is line 1
            $person = $this->person($header, $cells);
            if ($this->blank($person)) {
                continue;
            }

            $check = Validator::make($person, [
                'name' => ['required', 'string', 'max:120'],
                'email' => ['required', 'email:rfc,filter', 'max:190'],
                'mobile' => ['required', 'string', 'regex:/^\+?[0-9\s\-]{8,16}$/'],
                'organisation' => ['required', 'string', 'max:150'],
                'designation' => ['required', 'string', 'max:150'],
            ]);
            if ($check->fails()) {
                $this->errors[] = ['row' => $line, 'message' => $check->errors()->first()];

                continue;
            }

            $email = strtolower($person['email']);

            // Already registered, on the site or earlier in this file.
            if (isset($seen[$email]) || Registration::forEdition($edition)->where('email', $email)->exists()) {
                $this->skipped++;

                continue;
            }
            $seen[$email] = true;

            $arrived = in_array(strtolower($person['arrived']), ['yes', 'y', 'true', '1'], true);

            DB::transaction(fn () => Registration::create([
                'reference' => Reference::next($edition, $prefix),
                'full_name' => $person['name'],
                'email' => $email,
                'mobile' => preg_replace('/\s+/', ' ', $person['mobile']),
                'organisation' => $person['organisation'],
                'designation' => $person['designation'],
                'edition' => $edition,
                'source' => 'import',
                'checked_in_at' => $arrived ? now() : null,
                'checked_in_via' => $arrived ? 'staff' : null,
            ]));
            $this->added++;
        }

        return ['added' => $this->added, 'skipped' => $this->skipped, 'errors' => $this->errors];
    }

    /** Every row as plain strings, from either kind of file. */
    private function rows(string $path, string $extension): array
    {
        $reader = $extension === 'xlsx' ? new XlsxReader() : new CsvReader();
        $reader->open($path);

        $rows = [];
        foreach ($reader->getSheetIterator() as $sheet) {
            foreach ($sheet->getRowIterator() as $row) {
                $rows[] = array_map(fn ($v) => $v instanceof \DateTimeInterface ? $v->format('Y-m-d') : trim((string) $v), $row->toArray());
            }
            break; // the first sheet only
        }
        $reader->close();

        return $rows;
    }

    private function person(array $header, array $cells): array
    {
        $value = fn (string $key) => ($at = array_search($key, $header, true)) === false ? '' : (string) ($cells[$at] ?? '');

        return [
            'name' => $value('name'),
            'email' => $value('email'),
            'mobile' => $value('mobile'),
            'organisation' => $value('organisation'),
            'designation' => $value('designation'),
            'arrived' => $value('arrived'),
        ];
    }

    private function blank(array $person): bool
    {
        return implode('', array_map('trim', $person)) === '';
    }
}
