<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'year',
    'quarter',
])]
class SihRoadmapQuarter extends Model
{
    protected $table = 'sih_roadmap_quarters';

    protected $primaryKey = 'ID';

    public $timestamps = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'quarter' => 'integer',
        ];
    }
}
