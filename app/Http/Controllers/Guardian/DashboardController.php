<?php

namespace App\Http\Controllers\Guardian;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $guardian = Auth::user()->guardian()->with([
            'students.user',
            'students.class.teacher.user',
            'students.attendance' => function ($query) {
                $query->orderBy('date', 'desc')->limit(5); // Get last 5 for brevity
            },
            'students.tasmee3' => function ($query) {
                $query->orderBy('created_at', 'desc')->limit(5); // Get last 5
            },
            'students.plan'
        ])->first();

        return Inertia::render('Guardian/Dashboard', [
            'guardian' => $guardian,
        ]);
    }
}
