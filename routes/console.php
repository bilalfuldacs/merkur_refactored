<?php

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
