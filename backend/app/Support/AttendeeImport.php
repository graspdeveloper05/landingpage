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
            $answers = self::answers($person);
            if ($answers === false) {
                $this->errors[] = ['row' => $line, 'message' => 'Chevening scholar and CAM member take Yes or No.'];

                continue;
            }

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
                'answers' => $answers,
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
            'mobile' => self::mobile($value('mobile')),
            'organisation' => $value('organisation'),
            'designation' => $value('designation'),
            'arrived' => $value('arrived'),
            'chevening_scholar' => $value('chevening_scholar'),
            'chevening_cohort' => $value('chevening_cohort'),
            'chevening_university' => $value('chevening_university'),
            'cam_member' => $value('cam_member'),
        ];
    }

    /**
     * Excel keeps 0123456789 as the number 123456789. A Malaysian mobile that
     * arrives as bare digits starting 1 has lost its 0; put it back.
     */
    private static function mobile(string $typed): string
    {
        return preg_match('/^1\d{8,9}$/', $typed) ? '0'.$typed : $typed;
    }

    /**
     * The Chevening answers, worded as the website form stores them ("Yes" /
     * "No"). Null when the file leaves them out; false when a yes/no column
     * holds something else.
     */
    private static function answers(array $person): array|null|false
    {
        $yesNo = function (string $typed): string|null|false {
            $v = strtolower(trim($typed));

            return match (true) {
                $v === '' => null,
                in_array($v, ['yes', 'y', 'true', '1'], true) => 'Yes',
                in_array($v, ['no', 'n', 'false', '0'], true) => 'No',
                default => false,
            };
        };

        $scholar = $yesNo($person['chevening_scholar']);
        $cam = $yesNo($person['cam_member']);
        if ($scholar === false || $cam === false) {
            return false;
        }

        $answers = array_filter([
            'chevening_scholar' => $scholar,
            'chevening_cohort' => $person['chevening_cohort'],
            'chevening_university' => $person['chevening_university'],
            'cam_member' => $cam,
        ], fn ($v) => $v !== null && $v !== '');

        return $answers === [] ? null : $answers;
    }

    private function blank(array $person): bool
    {
        return implode('', array_map('trim', $person)) === '';
    }
}
