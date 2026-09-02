<?php

namespace Database\Seeders;

use App\Models\ConfigReport;
use Illuminate\Database\Seeder;

class DummyConfigReportSeeder extends Seeder
{
    public function run(): void
    {
        $reports = [
            [
                'ID' => 100,
                'group' => 'Top Reports',
                'name' => 'installations',
                'title' => 'Dummy Installations',
                'icon' => 'fa-solid fa-rocket',
                'color' => '#e83181',
                'short_description' => 'See feedback on Game performance and technical performance for Installations of any Version.',
                'in_launchpad' => true,
            ],
            [
                'ID' => 101,
                'group' => null,
                'name' => 'focus-groups',
                'title' => 'Dummy Focus Groups',
                'icon' => 'fa-solid fa-users-viewfinder',
                'color' => '#e83181',
                'short_description' => 'See all Player Focus Groups for all Versions.',
                'in_launchpad' => false,
            ],
            [
                'ID' => 190,
                'group' => null,
                'name' => 'latest-changes',
                'title' => 'Dummy Latest Changes',
                'icon' => 'fa-solid fa-arrows-rotate',
                'color' => '#e83181',
                'short_description' => 'See most recent modifications for most tables.',
                'in_launchpad' => true,
            ],
            [
                'ID' => 900,
                'group' => 'Issues',
                'name' => 'issues',
                'title' => 'Dummy Issues',
                'icon' => 'fa-solid fa-triangle-exclamation',
                'color' => '#e83181',
                'short_description' => 'This report lists items that might need your attention as they are incomplete or outdated.',
                'in_launchpad' => false,
            ],
        ];

        foreach ($reports as $data) {
            ConfigReport::query()->updateOrCreate(['ID' => $data['ID']], $data);
        }
    }
}
