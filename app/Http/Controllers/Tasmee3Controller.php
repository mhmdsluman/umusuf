<?php

namespace App\Http\Controllers;

use App\Models\Tasmee3;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class Tasmee3Controller extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'student_id' => ['required', 'exists:students,id'],
            'surah' => ['required', 'string', 'max:255'],
            'ayah_from' => ['required', 'integer', 'min:1'],
            'ayah_to' => ['required', 'integer', 'min:1', 'gte:ayah_from'],
            'grade' => ['required', 'string', 'in:excellent,good,average,poor'],
        ]);

        // Authorization: Ensure the logged-in teacher is assigned to the student's class.
        $student = Student::with('class.teacher')->findOrFail($request->student_id);
        $teacher = Auth::user()->teacher;

        if (!$teacher || $student->class->teacher_id !== $teacher->id) {
            abort(403, 'Unauthorized action.');
        }

        Tasmee3::create([
            'student_id' => $request->student_id,
            'surah' => $request->surah,
            'ayah_from' => $request->ayah_from,
            'ayah_to' => $request->ayah_to,
            'grade' => $request->grade,
        ]);

        return back()->with('success', 'Tasmee3 record saved successfully.');
    }
}
