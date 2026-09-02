<?php

namespace App\Services;

use App\Support\SimpleXlsx;
use Dompdf\Dompdf;
use Dompdf\Options;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TableExportService
{
    /**
     * @param  array{
     *     table: string,
     *     title: string,
     *     infobox: string,
     *     generated_for: string,
     *     columns: list<array{key: string, label: string, kind: string, relation_key: ?string}>,
     *     rows: list<list<string>>
     * }  $dataset
     */
    public function download(array $dataset, string $format, bool $inline = false): Response
    {
        $filename = $this->filename($dataset['title'], $format === 'html' ? 'pdf' : $format);

        return match ($format) {
            'xlsx' => $this->xlsxResponse($dataset, $filename),
            'pdf', 'html' => $this->pdfResponse($dataset, $filename, $inline || $format === 'html'),
            default => $this->csvResponse($dataset, $filename),
        };
    }

    /**
     * @param  array{title: string, columns: list<array{label: string}>, rows: list<list<string>>}  $dataset
     */
    private function csvResponse(array $dataset, string $filename): StreamedResponse
    {
        return response()->streamDownload(function () use ($dataset): void {
            $handle = fopen('php://output', 'w');
            if ($handle === false) {
                return;
            }

            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, array_column($dataset['columns'], 'label'), ';');
            foreach ($dataset['rows'] as $row) {
                fputcsv($handle, $row, ';');
            }
            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * @param  array{title: string, columns: list<array{label: string}>, rows: list<list<string>>}  $dataset
     */
    private function xlsxResponse(array $dataset, string $filename): Response
    {
        $binary = SimpleXlsx::build(
            $dataset['title'],
            array_column($dataset['columns'], 'label'),
            $dataset['rows'],
        );

        return response($binary, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    /**
     * @param  array{title: string, infobox: string, generated_for: string, columns: list<array{label: string}>, rows: list<list<string>>}  $dataset
     */
    private function pdfResponse(array $dataset, string $filename, bool $inline): Response
    {
        ini_set('memory_limit', '512M');
        set_time_limit(120);

        $options = new Options;
        $options->set('isRemoteEnabled', false);
        $options->set('isHtml5ParserEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');
        $options->set('dpi', 72);

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($this->pdfHtml($dataset));
        $dompdf->setPaper('a4', 'landscape');
        $dompdf->render();

        $disposition = $inline ? 'inline' : 'attachment';

        return response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => $disposition.'; filename="'.$filename.'"',
            'Cache-Control' => 'private, max-age=0, must-revalidate',
        ]);
    }

    /**
     * @param  array{title: string, infobox: string, generated_for: string, columns: list<array{label: string}>, rows: list<list<string>>}  $dataset
     */
    private function pdfHtml(array $dataset): string
    {
        $columns = array_slice($dataset['columns'], 0, 12);
        $title = $this->e($dataset['title']);
        $infobox = $this->e(mb_substr($dataset['infobox'], 0, 400));
        $generatedFor = $this->e($dataset['generated_for']);
        $count = number_format(count($dataset['rows']));
        $generatedAt = $this->e(now()->format('d M Y H:i'));
        $colCount = max(count($columns), 1);

        $headings = '';
        foreach ($columns as $column) {
            $headings .= '<th>'.$this->e($column['label']).'</th>';
        }

        $body = '';
        foreach ($dataset['rows'] as $row) {
            $body .= '<tr>';
            foreach (array_slice($row, 0, $colCount) as $value) {
                $body .= '<td>'.$this->pdfCell((string) $value).'</td>';
            }
            $body .= '</tr>';
        }

        if ($dataset['rows'] === []) {
            $body = '<tr><td colspan="'.$colCount.'">No records.</td></tr>';
        }

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{$title} | MERKURflow</title>
  <style>
    body { font-family: DejaVu Sans, sans-serif; color: #022052; font-size: 9px; }
    h1 { font-size: 16px; margin: 0 0 6px; }
    .meta { color: #555555; font-size: 8px; margin: 0 0 10px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 0.5px solid #898B8E; padding: 3px 4px; vertical-align: top; }
    th { background-color: #EDEDED; text-align: left; font-weight: bold; }
  </style>
</head>
<body>
  <h1>{$title}</h1>
  <p class="meta">{$infobox}</p>
  <table>
    <thead><tr>{$headings}</tr></thead>
    <tbody>{$body}</tbody>
  </table>
  <p class="meta"><strong>{$count} records</strong>, generated on {$generatedAt} for {$generatedFor}</p>
</body>
</html>
HTML;
    }

    private function pdfCell(string $value): string
    {
        $flat = trim(preg_replace('/\s+/u', ' ', $value) ?? $value);
        if (mb_strlen($flat) > 160) {
            $flat = mb_substr($flat, 0, 157).'...';
        }

        return $this->e($flat);
    }

    private function filename(string $title, string $format): string
    {
        $safe = preg_replace('/[^\pL\pN\-_ ]+/u', '', $title) ?: 'table';
        $safe = trim(preg_replace('/\s+/', ' ', $safe) ?? $safe);
        $stamp = now()->format('Y-m-d H.i.s');
        $extension = match ($format) {
            'xlsx' => 'xlsx',
            'pdf' => 'pdf',
            default => 'csv',
        };

        return $safe.' '.$stamp.' (from MERKURflow).'.$extension;
    }

    private function e(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}
