<?php

namespace App\Support;

use App\Models\Registration;

class Reference
{
    /**
     * Sequential, human-readable, short enough to read aloud at the door.
     * Called inside the same locked transaction as the capacity check, so two
     * simultaneous registrations cannot be handed the same reference.
     */
    public static function next(int $edition, string $prefix): string
    {
        $count = Registration::forEdition($edition)->count();

        return sprintf('%s-%04d', $prefix, $count + 1);
    }
}
