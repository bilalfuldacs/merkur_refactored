<?php

namespace App\Http\Requests;

use App\Models\BuildMilestone;
use Illuminate\Foundation\Http\FormRequest;

class UpdateBuildMilestoneRequest extends FormRequest
{
    public function authorize(): bool
    {
        $buildMilestone = $this->route('buildMilestone');

        return $buildMilestone instanceof BuildMilestone
            && $this->user()?->can('update', $buildMilestone) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'build_ID' => ['sometimes', 'integer', 'exists:builds,ID'],
            'expected_status_ID' => ['sometimes', 'integer', 'exists:config__statuses,ID'],
            'expected_date' => ['sometimes', 'date'],
            'actual_date' => ['nullable', 'date'],
            'comment' => ['nullable', 'string', 'max:140'],
        ];
    }
}
