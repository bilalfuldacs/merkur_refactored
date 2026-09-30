<?php

use App\Models\ScoutEvent;
use App\Services\Ice2027Service;
use App\Services\TableHistoryService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('merkur:enable-table-history', function (TableHistoryService $history) {
    $enabled = $history->enableForCatalog();
    $this->info("Edit history is enabled for {$enabled} tables.");
})->purpose('Create history tables and triggers for every catalog table');

Artisan::command('scout:remind {--dry-run : Count recipients without sending mail} {--e= : Limit to one event slug}', function (Ice2027Service $ice) {
    $dryRun = (bool) $this->option('dry-run');
    $onlySlug = trim((string) $this->option('e'));

    $events = ScoutEvent::query()
        ->when($onlySlug !== '', fn ($query) => $query->where('slug', $onlySlug))
        ->when($onlySlug === '', fn ($query) => $query->where('active', true))
        ->orderBy('sort_order')
        ->orderBy('ID')
        ->get();

    if ($events->isEmpty()) {
        $this->line($dryRun ? 'Dry run: no events.' : 'No events.');

        return 0;
    }

    $lines = [];
    $totalSent = 0;
    $totalRecipients = 0;
    foreach ($events as $event) {
        $result = $ice->forEvent((int) $event->ID)->sendScoutReminders($dryRun);
        $totalSent += (int) $result['sent'];
        $totalRecipients += (int) $result['recipients'];
        $label = $dryRun ? 'would email' : 'emailed';
        $lines[] = $result['event'].': '.$result['sent'].'/'.$result['recipients'].' '.$label
            .($result['failed'] !== [] ? ' · skipped/failed: '.implode(', ', $result['failed']) : '');
    }

    if ($dryRun) {
        $this->line('Dry run. '.implode("\n", $lines));
    } else {
        $this->line(implode("\n", $lines));
    }
    $this->line('Total: '.$totalSent.'/'.$totalRecipients);

    return 0;
})->purpose('Send daily scouting reminder emails');
