<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $student = Auth::user()->student()->with([
            'class.teacher.user',
            'attendance' => function ($query) {
                $query->orderBy('date', 'desc');
            },
            'tasmee3' => function ($query) {
                $query->orderBy('created_at', 'desc');
            },
            'plan'
        ])->first();

        return Inertia::render('Student/Dashboard', [
            'student' => $student,
        ]);
    }
}
