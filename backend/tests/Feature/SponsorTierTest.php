<?php

namespace Tests\Feature;

use App\Models\Sponsor;
use App\Models\SponsorTier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** The groups the sponsors band is arranged in, added and named in the panel. */
class SponsorTierTest extends TestCase
{
    use RefreshDatabase;

    private function admin()
    {
        return $this->actingAs(User::factory()->create());
    }

    private function sponsor(string $tier, string $name = 'Intramiles'): Sponsor
    {
        return Sponsor::create([
            'name' => $name, 'tier' => $tier, 'logo' => '/partners/intramiles.png', 'sort_order' => 0,
        ]);
    }

    public function test_the_five_existing_groups_are_there_with_their_names(): void
    {
        $this->getJson('/api/sponsor-tiers')
            ->assertOk()
            ->assertJsonCount(5)
            ->assertJsonPath('0.key', 'foundingPatron')
            ->assertJsonPath('2.key', 'gold')
            ->assertJsonPath('2.name.en', 'Our Gold Sponsors')
            ->assertJsonPath('4.name.ms', 'Rakan Sokongan');
    }

    public function test_an_admin_adds_a_group_and_puts_a_sponsor_in_it(): void
    {
        $key = $this->admin()->postJson('/api/admin/sponsor-tiers', [
            'name' => ['en' => 'Media Partners', 'ms' => 'Rakan Media'],
        ])->assertCreated()
            ->assertJsonPath('name.en', 'Media Partners')
            ->assertJsonPath('sponsors_count', 0)
            ->json('key');

        $this->assertSame('mediaPartners', $key);
        // A new group goes last.
        $this->getJson('/api/sponsor-tiers')->assertJsonPath('5.key', 'mediaPartners');

        $this->postJson('/api/admin/sponsors', [
            'name' => 'The Star', 'tier' => $key, 'logo' => '/partners/intramiles.png',
        ])->assertCreated()->assertJsonPath('tier', 'mediaPartners');
    }

    public function test_two_groups_with_the_same_name_get_different_keys(): void
    {
        $this->admin()->postJson('/api/admin/sponsor-tiers', ['name' => ['en' => 'Gold']])
            ->assertCreated()->assertJsonPath('key', 'gold2');
    }

    public function test_a_sponsor_needs_a_group_that_exists(): void
    {
        $this->admin()->postJson('/api/admin/sponsors', [
            'name' => 'X', 'tier' => 'platinum', 'logo' => '/partners/intramiles.png',
        ])->assertUnprocessable()->assertJsonValidationErrors('tier');
    }

    public function test_renaming_keeps_the_key_and_the_sponsors_in_it(): void
    {
        $sponsor = $this->sponsor('gold');
        $gold = SponsorTier::where('key', 'gold')->firstOrFail();

        $this->admin()->putJson("/api/admin/sponsor-tiers/{$gold->id}", [
            'name' => ['en' => 'Gold Partners'],
        ])->assertOk()->assertJsonPath('key', 'gold')->assertJsonPath('name.en', 'Gold Partners');

        $this->assertSame('gold', $sponsor->fresh()->tier);
    }

    public function test_a_group_needs_an_english_name(): void
    {
        $this->admin()->postJson('/api/admin/sponsor-tiers', ['name' => ['ms' => 'Rakan']])
            ->assertUnprocessable()->assertJsonValidationErrors('name.en');
    }

    public function test_a_group_with_sponsors_in_it_is_not_deleted(): void
    {
        $this->sponsor('gold');
        $gold = SponsorTier::where('key', 'gold')->firstOrFail();

        $this->admin()->deleteJson("/api/admin/sponsor-tiers/{$gold->id}")
            ->assertUnprocessable()->assertJsonValidationErrors('tier');
        $this->assertModelExists($gold);
    }

    public function test_an_empty_group_is_deleted(): void
    {
        $silver = SponsorTier::where('key', 'silver')->firstOrFail();

        $this->admin()->deleteJson("/api/admin/sponsor-tiers/{$silver->id}")->assertNoContent();
        $this->assertModelMissing($silver);
    }

    public function test_groups_are_reordered(): void
    {
        $ids = SponsorTier::orderBy('sort_order')->pluck('id')->reverse()->values()->all();

        $this->admin()->postJson('/api/admin/sponsor-tiers/reorder', ['ids' => $ids])->assertNoContent();

        $this->getJson('/api/sponsor-tiers')
            ->assertJsonPath('0.key', 'marketing')
            ->assertJsonPath('4.key', 'foundingPatron');
    }

    public function test_the_admin_list_counts_the_sponsors_in_each_group(): void
    {
        // The site's own sponsors are already in the table; count from there.
        $before = Sponsor::where('tier', 'gold')->count();
        $this->sponsor('gold');
        $this->sponsor('gold', 'Perintis Akal');

        $list = collect($this->admin()->getJson('/api/admin/sponsor-tiers')->assertOk()->json())
            ->keyBy('key');
        $this->assertSame($before + 2, $list['gold']['sponsors_count']);
        $this->assertSame(Sponsor::where('tier', 'silver')->count(), $list['silver']['sponsors_count']);
    }

    public function test_group_endpoints_need_a_session(): void
    {
        $this->postJson('/api/admin/sponsor-tiers', ['name' => ['en' => 'X']])->assertUnauthorized();
    }
}
