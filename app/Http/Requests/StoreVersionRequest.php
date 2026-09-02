<?php

namespace App\Http\Requests;

use App\Models\Version;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreVersionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Version::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:20', 'unique:versions,name'],
            'name2' => ['nullable', 'string', 'max:40'],
            'subtitle' => ['nullable', 'string', 'max:80'],
            'platform_ID' => ['required', 'integer', 'exists:platforms,ID'],
            'status_ID' => ['nullable', 'integer', 'exists:config__statuses,ID'],
            'description' => ['nullable', 'string'],
            'inherits_ID' => ['nullable', 'integer', 'exists:versions,ID'],
            'feat_in_products_pano' => ['sometimes', 'boolean'],
            'feat_in_instl_feedback' => ['sometimes', 'boolean'],
            'dev_URL' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $inheritsId = $this->filled('inherits_ID') ? $this->integer('inherits_ID') : null;
            $platformId = $this->integer('platform_ID') ?: null;

            if (! $inheritsId || ! $platformId) {
                return;
            }

            $inherits = Version::query()->find($inheritsId);

            if ($inherits instanceof Version && (int) $inherits->platform_ID !== $platformId) {
                $validator->errors()->add('inherits_ID', 'The inherited version must use the same platform.');
            }
        });
    }
}
