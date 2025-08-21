<?php

namespace App\Http\Controllers;

use App\Models\Guardian;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GuardianStudentController extends Controller
{
    public function create()
    {
        $guardians = Guardian::with('user')->get();
        $students = Student::with('user')->get();

        return Inertia::render('Admin/GuardianStudent/Create', [
            'guardians' => $guardians,
            'students' => $students,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'guardian_id' => ['required', 'exists:guardians,id'],
            'student_ids' => ['required', 'array'],
            'student_ids.*' => ['exists:students,id'],
        ]);

        $guardian = Guardian::find($request->guardian_id);
        $guardian->students()->sync($request->input('student_ids', []));

        return redirect()->route('admin.users.index')->with('success', 'Guardian-student links updated successfully.');
    }
}
