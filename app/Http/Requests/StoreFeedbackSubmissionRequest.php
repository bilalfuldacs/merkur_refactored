<?php

namespace App\Http\Requests;

use App\Models\FeedbackSubmission;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFeedbackSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', FeedbackSubmission::class) === true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'department' => $this->filled('department') ? $this->input('department') : 'Other',
            'related_area' => $this->filled('related_area') ? $this->input('related_area') : 'General',
            'feedback_type' => FeedbackSubmission::storedType($this->input('feedback_type')),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'submitter_name' => ['nullable', 'string', 'max:150'],
            'submitter_email' => ['nullable', 'email', 'max:150'],
            'department' => ['required', Rule::in(FeedbackSubmission::DEPARTMENTS)],
            'feedback_type' => ['required', Rule::in(FeedbackSubmission::TYPES)],
            'related_area' => ['nullable', 'string', 'max:150'],
            'subject' => ['required', 'string', 'max:200'],
            'description' => ['required', 'string', 'max:1200'],
            'expected_impact' => ['nullable', 'string'],
            'priority' => ['nullable', Rule::in(FeedbackSubmission::PRIORITIES)],
            'screenshot' => ['nullable', 'file', 'image', 'max:2048', 'mimes:png,jpg,jpeg,webp,gif'],
        ];
    }
}
