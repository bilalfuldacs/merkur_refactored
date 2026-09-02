<?php

namespace Database\Seeders;

use App\Models\FeedbackSubmission;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyFeedbackSubmissionSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();
        $sales = User::query()->where('username', 'sales@dummy.test')->firstOrFail();

        $items = [
            [
                'mod_by' => $sales->ID,
                'submitter_name' => 'Sam Sales',
                'submitter_email' => 'sales@dummy.test',
                'department' => 'Sales',
                'feedback_type' => 'Improvement Suggestion',
                'related_area' => 'People & Markets',
                'subject' => 'Dummy: show key customers on market list',
                'description' => 'It would help to see key-customer partners without opening each market report.',
                'priority' => 'medium',
                'status' => 'new',
            ],
            [
                'mod_by' => $editor->ID,
                'submitter_name' => 'Eddy Editor',
                'submitter_email' => 'editor@dummy.test',
                'department' => 'Product Management',
                'feedback_type' => 'Bug Report / Issue',
                'related_area' => 'Tables',
                'subject' => 'Dummy: history empty after first save',
                'description' => 'Saving a new cabinet does not create the first history revision in dummy testing.',
                'priority' => 'high',
                'status' => 'under_review',
            ],
        ];

        foreach ($items as $data) {
            $feedback = FeedbackSubmission::query()->firstOrNew(['subject' => $data['subject']]);
            $feedback->fill($data);
            $feedback->mod_by = $data['mod_by'];
            $feedback->save();
        }
    }
}
