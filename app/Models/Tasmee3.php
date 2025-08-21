<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tasmee3 extends Model
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory;

    protected $fillable = [
        'student_id',
        'surah',
        'ayah_from',
        'ayah_to',
        'grade',
    ];
}
