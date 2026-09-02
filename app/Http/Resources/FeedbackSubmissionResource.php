<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FeedbackSubmissionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'mod_by' => $this->mod_by,
            'submitter_name' => $this->submitter_name,
            'submitter_email' => $this->submitter_email,
            'department' => $this->department,
            'feedback_type' => $this->feedback_type,
            'type' => $this->typeKey(),
            'type_label' => $this->typeLabel(),
            'related_area' => $this->related_area,
            'subject' => $this->subject,
            'description' => $this->description,
            'expected_impact' => $this->expected_impact,
            'priority' => $this->priority,
            'attachment_path' => $this->attachment_path,
            'has_screenshot' => filled($this->attachment_path),
            'reference' => $this->reference(),
            'status' => $this->status,
            'submitted_at' => $this->submitted_at,
            'reviewed_at' => $this->reviewed_at,
            'reviewed_by' => $this->reviewed_by,
            'submitter' => $this->whenLoaded('submitter', fn () => $this->submitter === null ? null : [
                'ID' => $this->submitter->ID,
                'username' => $this->submitter->username,
                'firstname' => $this->submitter->firstname,
                'lastname' => $this->submitter->lastname,
            ]),
            'reviewer' => $this->whenLoaded('reviewer', fn () => $this->reviewer === null ? null : [
                'ID' => $this->reviewer->ID,
                'username' => $this->reviewer->username,
                'firstname' => $this->reviewer->firstname,
                'lastname' => $this->reviewer->lastname,
            ]),
        ];
    }
}
