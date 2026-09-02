<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TableViewRecord extends Model
{
    public $timestamps = false;

    public $incrementing = true;

    protected $primaryKey = 'ID';

    protected $guarded = [];

    protected $keyType = 'int';

    public function newInstance($attributes = [], $exists = false): static
    {
        $model = parent::newInstance($attributes, $exists);
        $model->setTable($this->getTable());

        return $model;
    }
}
