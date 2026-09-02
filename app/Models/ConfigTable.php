<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'ID',
    'group',
    'table',
    'title',
    'item_name',
    'icon',
    'color',
    'short_description',
    'infobox',
    'table_type',
    'system_table',
    'has_history',
    'has_section_metadata',
    'in_global_search',
    'in_launchpad',
    'change_report',
    'link_column',
    'info_column',
    'view',
    'default_view_columns',
    'default_view_order',
    'default_view_name',
    'edit_extras',
    'collapse_item',
    'has_backlink',
    'search_preview_columns',
    'search_preview_format',
])]
class ConfigTable extends Model
{
    protected $table = 'config__tables';

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
            'has_history' => 'boolean',
            'has_section_metadata' => 'boolean',
            'in_global_search' => 'boolean',
            'in_launchpad' => 'boolean',
            'change_report' => 'boolean',
            'system_table' => 'boolean',
        ];
    }

    /**
     * @return HasMany<ConfigTableViewPreset, $this>
     */
    public function viewPresets(): HasMany
    {
        return $this->hasMany(ConfigTableViewPreset::class, 'table_ID', 'ID');
    }
}
