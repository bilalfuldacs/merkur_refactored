<?php

namespace Database\Seeders;

use App\Models\ConfigStatus;
use App\Models\Platform;
use App\Models\User;
use App\Models\Version;
use Illuminate\Database\Seeder;

class DummyVersionSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();
        $mii = Platform::query()->where('name', 'Dummy MII')->firstOrFail();
        $online = Platform::query()->where('name', 'Dummy Online')->firstOrFail();
        $released = ConfigStatus::query()->findOrFail(600);
        $inRd = ConfigStatus::query()->findOrFail(300);
        $requested = ConfigStatus::query()->findOrFail(200);

        $v10 = $this->upsert($editor->ID, [
            'name' => 'Dummy 1.0',
            'name2' => null,
            'subtitle' => 'Dummy first MII line',
            'platform_ID' => $mii->ID,
            'status_ID' => $released->ID,
            'description' => 'Starting dummy version for the MII platform.',
            'inherits_ID' => null,
            'feat_in_products_pano' => true,
            'feat_in_instl_feedback' => true,
            'dev_URL' => 'https://dummy.test/versions/1.0',
        ]);

        $this->upsert($editor->ID, [
            'name' => 'Dummy 1.1',
            'name2' => null,
            'subtitle' => 'Dummy inherits Dummy 1.0 games',
            'platform_ID' => $mii->ID,
            'status_ID' => $inRd->ID,
            'description' => 'Follow-on dummy version that inherits Dummy 1.0.',
            'inherits_ID' => $v10->ID,
            'feat_in_products_pano' => true,
            'feat_in_instl_feedback' => false,
            'dev_URL' => null,
        ]);

        $this->upsert($editor->ID, [
            'name' => 'Dummy 2.0 UHD',
            'name2' => 'Dummy UHD',
            'subtitle' => 'Dummy UHD branch',
            'platform_ID' => $mii->ID,
            'status_ID' => $requested->ID,
            'description' => 'Dummy UHD line that does not inherit the FHD chain.',
            'inherits_ID' => null,
            'feat_in_products_pano' => false,
            'feat_in_instl_feedback' => false,
            'dev_URL' => null,
        ]);

        $this->upsert($editor->ID, [
            'name' => 'Dummy Online 1.0',
            'name2' => null,
            'subtitle' => 'Dummy online starter',
            'platform_ID' => $online->ID,
            'status_ID' => $released->ID,
            'description' => 'Dummy version on the online platform.',
            'inherits_ID' => null,
            'feat_in_products_pano' => false,
            'feat_in_instl_feedback' => false,
            'dev_URL' => null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function upsert(int $editorId, array $data): Version
    {
        $version = Version::query()->firstOrNew(['name' => $data['name']]);
        $version->fill($data);
        $version->mod_by = $editorId;
        $version->save();

        return $version;
    }
}
