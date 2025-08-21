<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory;

    protected $fillable = [
        'user_id',
        'class_id',
        'plan_id',
        'gender',
        'date_of_birth',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function class()
    {
        return $this->belongsTo(Classes::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function guardians()
    {
        return $this->belongsToMany(Guardian::class, 'guardian_student');
    }

    public function attendance()
    {
        return $this->hasMany(Attendance::class);
    }

    public function tasmee3()
    {
        return $this->hasMany(Tasmee3::class);
    }
}
