<?php

namespace Database\Seeders;

use App\Models\StaticDoc;
use Illuminate\Database\Seeder;

class DummyStaticDocSeeder extends Seeder
{
    public function run(): void
    {
        $docs = [
            [50, 'Dummy Overview (2022)', 'MERKURflow', 'Overview (2022)', true, 181371],
            [100, 'Dummy The BOOK', 'The BOOK 2026', 'Complete', true, 77058473],
            [110, 'Dummy Cover & Table of Contents', 'The BOOK 2026', 'Cover', false, 17695983],
            [120, 'Dummy Appendix', 'The BOOK 2026', 'Appendix', false, 1213696],
            [201, 'Dummy Chapter 1 — Slots', 'The BOOK 2026', 'Chapter 1', false, 49867223],
            [202, 'Dummy Chapter 2 — Slots', 'The BOOK 2026', 'Chapter 2', false, 18739111],
            [203, 'Dummy Chapter 3 — Slots', 'The BOOK 2026', 'Chapter 3', false, 5889923],
            [204, 'Dummy Chapter 4 — Slots', 'The BOOK 2026', 'Chapter 4', false, 3153094],
            [205, 'Dummy Chapter 5 — ETGs', 'The BOOK 2026', 'Chapter 5', false, 15221607],
            [300, 'Dummy Installations — Process Guide', 'Processes', 'Installations - Process Guide', null, 114155],
            [301, 'Dummy Installations — Process Map', 'Processes', 'Installations - Process Map', null, 232353],
            [400, 'Dummy Requirements', 'Marketing Assets', 'Requirements for Marketing Supporting Materials', null, 1242981],
            [401, 'Dummy Promo Video Guideline', 'Marketing Assets', 'Promo Video Guideline', null, 4015515],
        ];

        foreach ($docs as [$id, $title, $subfolder, $file, $complete, $size]) {
            StaticDoc::query()->updateOrCreate(
                ['id' => $id],
                [
                    'title' => $title,
                    'subfolder' => $subfolder,
                    'file' => $file,
                    'is_complete' => $complete,
                    'file_size' => $size,
                ]
            );
        }
    }
}
