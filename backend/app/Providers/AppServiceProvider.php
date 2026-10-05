<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        /*
         * The survey's own limits, each on its own counter.
         *
         * A plain throttle:N,1 keys on the IP alone, so every route that uses
         * one shares a single per-IP count. A hall of phones on one Wi-Fi
         * address polling the survey every ten seconds would use up that
         * count in a minute and lock out signing in to answer, registering
         * at the door and the organisers' own login. Named limiters with a
         * prefix keep the survey's traffic apart, sized for a few hundred
         * phones behind one address.
         */
        $limit = fn (string $name, int $perMinute) => RateLimiter::for(
            $name,
            fn (Request $request) => Limit::perMinute($perMinute)->by($name.'|'.$request->ip()),
        );
        $limit('survey-read', 3000);
        $limit('survey-identify', 300);
        $limit('survey-answer', 1500);
    }
}
