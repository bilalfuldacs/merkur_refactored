<?php

namespace Database\Seeders;

use App\Models\MatrixTemplate;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyMatrixTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();

        $templates = [
            [
                'table' => 'matrix_templates',
                'column' => 'template',
                'description' => 'Master template for new matrix templates.',
                'row_headers' => ['Row #1', 'Row #2', 'Row #3'],
                'col_headers' => ['Column #1', 'Column #2', 'Column #3'],
            ],
            [
                'table' => 'markets_landbased',
                'column' => 'SWOT_competitors',
                'description' => 'Template for SWOT analysis with 4 columns (strengths, weaknesses, opportunities, threats).',
                'row_headers' => ['Competitor #1', 'Competitor #2', 'Competitor #3', 'Competitor #4', 'Competitor #5', 'Competitor #6', 'Competitor #7', 'Competitor #8', 'Competitor #9', 'Competitor #10'],
                'col_headers' => ['Strengths', 'Weaknesses', 'Opportunies', 'Threats'],
            ],
            [
                'table' => 'markets_landbased',
                'column' => 'top_competitors',
                'description' => 'Template for top competitors. Market share is calculated automatically for the remaining columns.',
                'row_headers' => ['#1', '#2', '#3', '#4', '#5', '#6', '#7', '#8', '#9', '#10'],
                'col_headers' => ['Manufacturer', 'Main Products', 'Estimated Slots', 'Trend', 'Operating Spotlights'],
            ],
            [
                'table' => 'markets_landbased',
                'column' => 'top_games',
                'description' => 'Template for top games, based on performance index.',
                'row_headers' => ['#1', '#2', '#3', '#4', '#5', '#6', '#7', '#8', '#9', '#10', '#11', '#12', '#13', '#14', '#15', '#16', '#17', '#18', '#19', '#20'],
                'col_headers' => ['Game', 'Manufacturer', 'Performance Index', '95% CI', 'Casinos/Arcades', 'Estimated Slots'],
            ],
            [
                'table' => 'markets_landbased',
                'column' => 'game_types',
                'description' => 'Template for game type analysis.',
                'row_headers' => [
                    'LP SG (Linked Progressive Single Game)',
                    'LP MG (Linked Progressive Multigame)',
                    'SAP SG (Stand-Alone Progressive Single Game)',
                    'SAP MG (Stand-Alone Progressive Multigame)',
                    'MG (Multigame)',
                    'SG (Single Game)',
                ],
                'col_headers' => ['% Market', '% of MERKUR', 'Performance Index', 'Trend'],
            ],
            [
                'table' => 'markets_landbased',
                'column' => 'top_cabinets',
                'description' => 'Template for top cabinets, based on performance index.',
                'row_headers' => ['#1', '#2', '#3', '#4', '#5', '#6', '#7', '#8', '#9', '#10'],
                'col_headers' => ['Cabinet Model', 'Manufacturer', 'Performance Index', 'Units Estimated', 'Game Type', 'Comments'],
            ],
            [
                'table' => 'markets_landbased',
                'column' => 'key_perf_metrics',
                'description' => 'Template for key performance metrics.',
                'row_headers' => ['Time on Device', 'Revenue per Unit/Day', 'Average Days in Flat', 'Coin in (per day)', 'Coin out (per day)', 'Ship share', 'Occupancy'],
                'col_headers' => ['Avg Value', 'Benchmark Superior', 'Comments'],
            ],
            [
                'table' => 'markets_landbased',
                'column' => 'metadata',
                'description' => 'Template for land-based markets metadata.',
                'row_headers' => ['BMI', 'TCMS', 'SWOT', 'TGPI', 'AGT', 'GMM', 'TCP', 'CM', 'KPM', 'PS', 'KLI', 'RL', 'SR', 'N'],
                'col_headers' => ['Source(s)', 'Reliability', 'Reporting Period', 'Comment'],
            ],
        ];

        foreach ($templates as $data) {
            $template = MatrixTemplate::query()->firstOrNew([
                'table' => $data['table'],
                'column' => $data['column'],
            ]);
            $template->description = $data['description'];
            $template->active = true;
            $template->template = $this->emptyMatrix($data['row_headers'], $data['col_headers']);
            $template->mod_by = $editor->ID;
            $template->save();
        }
    }

    /**
     * @param  list<string>  $rowHeaders
     * @param  list<string>  $colHeaders
     * @return array{row_headers: list<string>, col_headers: list<string>, data: list<list<string>>}
     */
    private function emptyMatrix(array $rowHeaders, array $colHeaders): array
    {
        $emptyRow = array_fill(0, count($colHeaders), '');

        return [
            'row_headers' => $rowHeaders,
            'col_headers' => $colHeaders,
            'data' => array_map(fn () => $emptyRow, $rowHeaders),
        ];
    }
}
