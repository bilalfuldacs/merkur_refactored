<?php

namespace App\Http\Requests;

use App\Models\Version;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateVersionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $version = $this->route('version');

        return $version instanceof Version
            && $this->user()?->can('update', $version) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $version = $this->route('version');
        $versionId = $version instanceof Version ? $version->ID : null;

        return [
            'name' => ['sometimes', 'string', 'max:20', Rule::unique('versions', 'name')->ignore($versionId, 'ID')],
            'name2' => ['nullable', 'string', 'max:40'],
            'subtitle' => ['nullable', 'string', 'max:80'],
            'platform_ID' => ['sometimes', 'integer', 'exists:platforms,ID'],
            'status_ID' => ['nullable', 'integer', 'exists:config__statuses,ID'],
            'description' => ['nullable', 'string'],
            'inherits_ID' => [
                'nullable',
                'integer',
                'exists:versions,ID',
                Rule::notIn([$versionId]),
            ],
            'feat_in_products_pano' => ['sometimes', 'boolean'],
            'feat_in_instl_feedback' => ['sometimes', 'boolean'],
            'dev_URL' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $version = $this->route('version');
            $inheritsId = $this->exists('inherits_ID')
                ? $this->input('inherits_ID')
                : ($version instanceof Version ? $version->inherits_ID : null);
            $platformId = $this->input('platform_ID', $version instanceof Version ? $version->platform_ID : null);

            if (! $inheritsId || ! $platformId) {
                return;
            }

            $inherits = Version::query()->find($inheritsId);

            if ($inherits instanceof Version && (int) $inherits->platform_ID !== (int) $platformId) {
                $validator->errors()->add('inherits_ID', 'The inherited version must use the same platform.');
            }
        });
    }
}
