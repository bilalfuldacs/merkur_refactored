<?php

namespace App\Http\Requests;

use App\Models\BuildMilestone;
use Illuminate\Foundation\Http\FormRequest;

class StoreBuildMilestoneRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', BuildMilestone::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'build_ID' => ['required', 'integer', 'exists:builds,ID'],
            'expected_status_ID' => ['required', 'integer', 'exists:config__statuses,ID'],
            'expected_date' => ['required', 'date'],
            'actual_date' => ['nullable', 'date'],
            'comment' => ['nullable', 'string', 'max:140'],
        ];
    }
}
