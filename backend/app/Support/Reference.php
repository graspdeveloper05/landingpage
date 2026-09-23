<?php

namespace App\Support;

use App\Models\Registration;

class Reference
{
    /**
     * Sequential, human-readable, short enough to read aloud at the door.
     * Called inside the same locked transaction as the capacity check, so two
     * simultaneous registrations cannot be handed the same reference.
     *
     * One past the highest number given so far, not "count + 1". Once a
     * registration could be deleted from the panel, the count fell below the
     * highest number in use, and the next reference was one somebody already
     * had -- the database refused it as a duplicate and the registration
     * failed. A deleted number is simply never given out again.
     */
    public static function next(int $edition, string $prefix): string
    {
        $highest = Registration::forEdition($edition)
            ->pluck('reference')
            ->map(fn (string $reference) => (int) substr((string) strrchr($reference, '-'), 1))
            ->max() ?? 0;

        return sprintf('%s-%04d', $prefix, $highest + 1);
    }
}
