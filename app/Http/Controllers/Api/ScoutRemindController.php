<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScoutEvent;
use App\Services\Ice2027Service;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ScoutRemindController extends Controller
{
    public function __construct(private Ice2027Service $ice) {}

    public function __invoke(Request $request): Response
    {
        $expected = (string) env('SCOUT_REMIND_TOKEN', '');
        $token = (string) $request->query('token', '');
        if ($expected === '' || $token === '' || ! hash_equals($expected, $token)) {
            return response("Forbidden.\n", 403)->header('Content-Type', 'text/plain; charset=UTF-8');
        }

        $dryRun = $request->has('dry');
        $onlySlug = trim((string) $request->query('e', ''));

        $events = ScoutEvent::query()
            ->when($onlySlug !== '', fn ($query) => $query->where('slug', $onlySlug))
            ->when($onlySlug === '', fn ($query) => $query->where('active', true))
            ->orderBy('sort_order')
            ->orderBy('ID')
            ->get();

        if ($events->isEmpty()) {
            $body = $dryRun ? "Dry run: no events.\n" : "No events.\n";

            return response($body, 200)->header('Content-Type', 'text/plain; charset=UTF-8');
        }

        $lines = [];
        $totalSent = 0;
        $totalRecipients = 0;
        foreach ($events as $event) {
            $result = $this->ice->forEvent((int) $event->ID)->sendScoutReminders($dryRun);
            $totalSent += (int) $result['sent'];
            $totalRecipients += (int) $result['recipients'];
            $label = $dryRun ? 'would email' : 'emailed';
            $lines[] = $result['event'].': '.$result['sent'].'/'.$result['recipients'].' '.$label
                .($result['failed'] !== [] ? ' · skipped/failed: '.implode(', ', $result['failed']) : '');
        }

        $prefix = $dryRun ? 'Dry run. ' : '';
        $body = $prefix.implode("\n", $lines)."\n".'Total: '.$totalSent.'/'.$totalRecipients."\n";

        return response($body, 200)->header('Content-Type', 'text/plain; charset=UTF-8');
    }
}
