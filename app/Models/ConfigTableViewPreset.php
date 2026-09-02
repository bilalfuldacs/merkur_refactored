<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'table_ID',
    'name',
    'parameters',
])]
class ConfigTableViewPreset extends Model
{
    protected $table = 'config__table-view-presets';

    protected $primaryKey = 'ID';

    public $timestamps = false;

    public function getRouteKeyName(): string
    {
        return 'ID';
    }

    /**
     * @return BelongsTo<ConfigTable, $this>
     */
    public function configTable(): BelongsTo
    {
        return $this->belongsTo(ConfigTable::class, 'table_ID', 'ID');
    }
}
