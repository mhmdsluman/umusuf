<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $teacher = Auth::user()->teacher()->with('classes')->first();

        return Inertia::render('Teacher/Dashboard', [
            'classes' => $teacher ? $teacher->classes : [],
        ]);
    }
}
