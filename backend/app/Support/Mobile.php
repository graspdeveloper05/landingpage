<?php

namespace App\Support;

/**
 * One spelling of a phone number, for comparing what someone types today
 * with what they typed when they registered. Malaysian numbers are written
 * as +60 12…, 60 12… or 012…; all three become 012….
 */
class Mobile
{
    public static function canonical(string $mobile): string
    {
        $digits = preg_replace('/\D+/', '', $mobile) ?? '';

        return str_starts_with($digits, '60') ? '0'.substr($digits, 2) : $digits;
    }
}
