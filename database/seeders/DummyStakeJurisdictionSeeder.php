<?php

namespace Database\Seeders;

use App\Models\Jurisdiction;
use App\Models\StakeJurisdiction;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyStakeJurisdictionSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();

        $people = User::query()->whereIn('username', [
            'admin@dummy.test',
            'editor@dummy.test',
            'sales@dummy.test',
            'viewer@dummy.test',
        ])->get()->keyBy('username');

        $jurisdictions = Jurisdiction::query()
            ->whereIn('name_english', [
                'Dummy Universal',
                'Dummy Netherlands Casino',
                'Dummy Germany',
                'Dummy Germany Online',
                'Dummy Colombia',
                'Dummy Austria',
                'Dummy France',
                'Dummy Spain Arcade',
            ])
            ->get()
            ->keyBy('name_english');

        $stakes = [
            ['person' => 'admin@dummy.test', 'jurisdiction' => 'Dummy Universal', 'as_deputy' => false],
            ['person' => 'sales@dummy.test', 'jurisdiction' => 'Dummy Netherlands Casino', 'as_deputy' => false],
            ['person' => 'sales@dummy.test', 'jurisdiction' => 'Dummy Germany', 'as_deputy' => false],
            ['person' => 'sales@dummy.test', 'jurisdiction' => 'Dummy Colombia', 'as_deputy' => false],
            ['person' => 'sales@dummy.test', 'jurisdiction' => 'Dummy France', 'as_deputy' => false],
            ['person' => 'sales@dummy.test', 'jurisdiction' => 'Dummy Spain Arcade', 'as_deputy' => false],
            ['person' => 'editor@dummy.test', 'jurisdiction' => 'Dummy Germany', 'as_deputy' => false],
            ['person' => 'editor@dummy.test', 'jurisdiction' => 'Dummy Austria', 'as_deputy' => false],
            ['person' => 'editor@dummy.test', 'jurisdiction' => 'Dummy Germany Online', 'as_deputy' => false],
            ['person' => 'viewer@dummy.test', 'jurisdiction' => 'Dummy Germany', 'as_deputy' => true],
        ];

        foreach ($stakes as $data) {
            $stake = StakeJurisdiction::query()->firstOrNew([
                'person_ID' => $people[$data['person']]->ID,
                'jurisdiction_ID' => $jurisdictions[$data['jurisdiction']]->ID,
            ]);
            $stake->as_deputy = $data['as_deputy'];
            $stake->mod_by = $editor->ID;
            $stake->save();
        }
    }
}
