<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'ID',
    'group',
    'name',
    'title',
    'icon',
    'color',
    'short_description',
    'in_launchpad',
])]
class ConfigReport extends Model
{
    protected $table = 'config__reports';

    protected $primaryKey = 'ID';

    public $incrementing = false;

    public $timestamps = false;

    public function getRouteKeyName(): string
    {
        return 'ID';
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'in_launchpad' => 'boolean',
        ];
    }
}
