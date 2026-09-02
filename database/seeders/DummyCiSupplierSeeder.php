<?php

namespace Database\Seeders;

use App\Models\CiSupplier;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyCiSupplierSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();

        $suppliers = [
            ['short_name' => 'Dummy IGT', 'name' => 'Dummy International Game Technology PLC', 'website' => 'https://igt.com'],
            ['short_name' => 'Dummy L&W', 'name' => 'Dummy Light & Wonder, Inc.', 'website' => 'https://lnw.com'],
            ['short_name' => 'Dummy Aristocrat', 'name' => 'Dummy Aristocrat Technologies Australia PTY LTD.', 'website' => 'https://aristocratgaming.com'],
            ['short_name' => 'Dummy Konami', 'name' => 'Dummy Konami Gaming, Inc.', 'website' => 'https://konamigaming.com'],
            ['short_name' => 'Dummy Novomatic', 'name' => 'Dummy Novomatic AG', 'website' => 'https://novomatic.com'],
            ['short_name' => 'Dummy Ainsworth', 'name' => 'Dummy Ainsworth Game Technology, Ltd.', 'website' => 'https://agtslots.com'],
            ['short_name' => 'Dummy Aruze', 'name' => 'Dummy Aruze Gaming Global, Inc.', 'website' => 'https://aruzeglobal.com'],
            ['short_name' => 'Dummy Incredible Technologies', 'name' => 'Dummy Incredible Technologies, Inc.', 'website' => 'https://itsgames.com'],
            ['short_name' => 'Dummy SEGA Sammy', 'name' => 'Dummy SEGA Sammy Creation Inc.', 'website' => 'https://segasammycreation.com'],
            ['short_name' => 'Dummy Bluberi', 'name' => 'Dummy Bluberi Gaming USA, Inc.', 'website' => 'https://bluberi.com'],
            ['short_name' => 'Dummy EGT', 'name' => 'Dummy Euro Games Technology Ltd.', 'website' => 'https://egt.com'],
            ['short_name' => 'Dummy Apex', 'name' => 'Dummy APEX pro gaming s.r.o.', 'website' => 'https://apex-gaming.com'],
            ['short_name' => 'Dummy Amatic', 'name' => 'Dummy AMATIC Industries GmbH', 'website' => 'https://amatic.com'],
            ['short_name' => 'Dummy Zitro/Bryke', 'name' => 'Dummy Zitro Technologies, S.L.U.', 'website' => 'https://zitrogames.com'],
        ];

        foreach ($suppliers as $data) {
            $supplier = CiSupplier::query()->firstOrNew(['short_name' => $data['short_name']]);
            $supplier->name = $data['name'];
            $supplier->website = $data['website'];
            $supplier->mod_by = $editor->ID;
            $supplier->save();
        }
    }
}
