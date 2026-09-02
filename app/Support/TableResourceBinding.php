<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Http\FormRequest;

final class TableResourceBinding
{
    /**
     * @param  class-string<Model>  $model
     * @param  class-string<FormRequest>  $storeRequest
     * @param  class-string<FormRequest>  $updateRequest
     */
    public function __construct(
        public readonly string $model,
        public readonly string $parameter,
        public readonly string $storeRequest,
        public readonly string $updateRequest,
    ) {}
}
