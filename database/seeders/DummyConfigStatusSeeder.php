<?php

namespace Database\Seeders;

use App\Models\ConfigStatus;
use Illuminate\Database\Seeder;

class DummyConfigStatusSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            [100, 'non-tracked', '#b2b2b2', '#022052'],
            [110, 'non-requested', '#b2b2b2', '#022052'],
            [200, 'requested', '#ffcc00', '#022052'],
            [210, 'assigned (RM)', '#ffcc00', '#022052'],
            [300, 'in R&D', '#022052', '#ffffff'],
            [301, 'in QA', '#022052', '#ffffff'],
            [303, 'in pre-field trial', '#009fe3', '#ffffff'],
            [305, 'in certification', '#000000', '#ffffff'],
            [306, 'in local homologation', '#000000', '#ffffff'],
            [310, 'in technical trial', '#009fe3', '#ffffff'],
            [400, 'in performance trial', '#009fe3', '#ffffff'],
            [599, 'releasable', '#d0ec5f', '#022052'],
            [600, 'released', '#a2c617', '#022052'],
            [650, 'sales suspended', '#4A412A', '#ffffff'],
            [690, 'approaching EOL', '#f07e26', '#ffffff'],
            [700, 'EOL', '#eb0000', '#ffffff'],
            [710, 'EOS', '#eb0000', '#ffffff'],
            [999, 'canceled', '#eb0000', '#ffffff'],
        ];

        foreach ($statuses as [$id, $name, $color, $textColor]) {
            ConfigStatus::query()->updateOrCreate(
                ['ID' => $id],
                ['name' => $name, 'color' => $color, 'text_color' => $textColor]
            );
        }
    }
}
