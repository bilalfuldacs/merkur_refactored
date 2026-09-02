<?php

namespace App\Support;

final class NiceFieldName
{
    public static function label(string $rawFieldName, ?string $itemName = null): string
    {
        $label = match ($rawFieldName) {
            'mod_date' => 'Last Modified Date',
            'mod_by' => 'Last Editor',
            'ID' => $itemName ? $itemName.' #' : 'Item #',
            'location' => 'Location',
            'ID_text' => 'Code',
            'gli11' => 'GLI-11',
            'iso3166' => 'ISO-3166',
            'iso4217' => 'ISO-4217',
            'name2' => 'Name (Secondary)',
            'version_from_ID' => 'Version ≥',
            'version_removed_ID' => 'Version <',
            'rtp' => 'RTP',
            'rtps' => 'RTPs',
            'ci_product_ID' => '[CI] Product',
            'original_game_port_ID' => 'Original Game',
            'pm_owner_ID' => 'PM Owner',
            '3rd_party' => '3rd Party',
            'pry_design_target_mkt' => 'Pry Design Target Mkt',
            default => self::fromRaw($rawFieldName),
        };

        return html_entity_decode($label, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    private static function fromRaw(string $rawFieldName): string
    {
        $fieldName = ucwords(str_replace(
            ['_ID', '_', '-'],
            ['', ' ', ' & '],
            $rawFieldName
        ));

        return str_replace(
            ['# Of', ' Per ', ' To '],
            ['# of', ' per ', ' to '],
            $fieldName
        );
    }
}
