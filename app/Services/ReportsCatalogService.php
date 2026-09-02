<?php

namespace App\Services;

use App\Models\ConfigReport;

class ReportsCatalogService
{
    /**
     * @return array{groups: list<array{title: string, reports: list<array<string, mixed>>}>}
     */
    public function payload(): array
    {
        $rows = ConfigReport::query()->orderBy('ID')->get();
        $groups = [];
        $currentTitle = '';
        $currentReports = [];
        $index = 0;

        foreach ($rows as $config) {
            $groupName = trim((string) $config->group);
            if ($groupName !== '') {
                if ($currentReports !== []) {
                    $groups[] = [
                        'title' => $currentTitle,
                        'reports' => $currentReports,
                    ];
                }
                $index++;
                $currentTitle = $index.' '.$groupName;
                $currentReports = [];
            }

            $currentReports[] = [
                'id' => $config->ID,
                'name' => $config->name,
                'title' => $config->title ?: $config->name,
                'description' => html_entity_decode(strip_tags((string) $config->short_description), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
                'color' => $config->color ?: '#E83181',
                'icon' => $config->icon,
                'in_launchpad' => (bool) $config->in_launchpad,
            ];
        }

        if ($currentReports !== []) {
            $groups[] = [
                'title' => $currentTitle !== '' ? $currentTitle : 'Reports',
                'reports' => $currentReports,
            ];
        }

        return ['groups' => $groups];
    }
}
