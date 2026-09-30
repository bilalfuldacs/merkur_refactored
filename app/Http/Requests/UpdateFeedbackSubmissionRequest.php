<?php

namespace App\Http\Requests;

use App\Models\FeedbackSubmission;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFeedbackSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $feedbackSubmission = $this->route('feedbackSubmission');

        return $feedbackSubmission instanceof FeedbackSubmission
            && $this->user()?->can('update', $feedbackSubmission) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['sometimes', Rule::in(FeedbackSubmission::STATUSES)],
            'reviewed_by' => ['nullable', 'integer', 'exists:dynamic__users,ID'],
            'admin_notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
