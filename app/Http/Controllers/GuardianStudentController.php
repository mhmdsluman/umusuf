<?php

namespace App\Http\Controllers;

use App\Models\Guardian;
use App\Models\Student;
use Illuminate\Http\Request;

class GuardianStudentController extends Controller
{
    public function edit(Guardian $guardian)
    {
        $students = Student::all();
        $linkedStudentIds = $guardian->students()->pluck('students.id')->toArray();

        return view('admin.guardians.students.edit', compact('guardian', 'students', 'linkedStudentIds'));
    }

    public function update(Request $request, Guardian $guardian)
    {
        $request->validate([
            'students' => ['array'],
            'students.*' => ['exists:students,id'],
        ]);

        $guardian->students()->sync($request->input('students', []));

        return redirect()->route('admin.users.index')->with('success', 'Guardian-student links updated successfully.');
    }
}
