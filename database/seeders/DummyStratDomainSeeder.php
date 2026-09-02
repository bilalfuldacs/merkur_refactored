<?php

namespace Database\Seeders;

use App\Models\StratDomain;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyStratDomainSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();

        $domains = [
            ['name' => 'Dummy Gameplay Mechanics', 'color' => '#ffcc00', 'purpose' => 'Core game experience'],
            ['name' => 'Dummy Progression & Retention', 'color' => '#e83181', 'purpose' => 'Increased time-on-device'],
            ['name' => 'Dummy Jackpot Systems', 'color' => '#022052', 'purpose' => 'Prize Structures'],
            ['name' => 'Dummy Win Amplification', 'color' => '#eb0000', 'purpose' => 'Increased player excitement'],
            ['name' => 'Dummy Feature Triggers', 'color' => '#a2c617', 'purpose' => 'How features are activated'],
            ['name' => 'Dummy Mathematical Design', 'color' => '#009fe3', 'purpose' => 'Volatility & Frequency'],
            ['name' => 'Dummy Behavioral Design', 'color' => '#ae962c', 'purpose' => 'Player psychology'],
            ['name' => 'Dummy Audiovisual Engagement', 'color' => '#d7af19', 'purpose' => 'Emotional stimulation'],
            ['name' => 'Dummy Cabinet & Hardware', 'color' => '#898b8e', 'purpose' => 'Physical experience'],
            ['name' => 'Dummy Social Features', 'color' => '#f07e26', 'purpose' => 'Shared gameplay'],
        ];

        foreach ($domains as $data) {
            $domain = StratDomain::query()->firstOrNew(['name' => $data['name']]);
            $domain->color = $data['color'];
            $domain->purpose = $data['purpose'];
            $domain->mod_by = $editor->ID;
            $domain->save();
        }
    }
}
