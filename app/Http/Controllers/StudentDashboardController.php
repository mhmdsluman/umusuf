<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StudentDashboardController extends Controller
{
    public function index()
    {
        $student = Auth::user()->student;
        $class = $student->class;
        $attendance = $student->attendance()->latest()->get();
        $tasmee3 = $student->tasmee3()->latest()->get();

        return view('student.dashboard', compact('student', 'class', 'attendance', 'tasmee3'));
    }
}
