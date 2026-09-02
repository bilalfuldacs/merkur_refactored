<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'word',
])]
class MerkuriosityDictionary extends Model
{
    protected $table = 'merkuriosity__dictionary';

    protected $primaryKey = 'id';

    public $timestamps = false;

    public function getRouteKeyName(): string
    {
        return 'id';
    }
}
