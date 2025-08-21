<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AttendanceController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'student_id' => ['required', 'exists:students,id'],
            'status' => ['required', 'string', 'in:present,absent,late'],
            'date' => ['required', 'date_format:Y-m-d'],
        ]);

        // Authorization: Ensure the logged-in teacher is assigned to the student's class.
        $student = Student::with('class.teacher')->findOrFail($request->student_id);
        $teacher = Auth::user()->teacher;

        if (!$teacher || $student->class->teacher_id !== $teacher->id) {
            abort(403, 'Unauthorized action.');
        }

        // Update or create the attendance record for the given student and date.
        Attendance::updateOrCreate(
            [
                'student_id' => $request->student_id,
                'date' => $request->date,
            ],
            [
                'status' => $request->status,
            ]
        );

        return back()->with('success', 'Attendance marked successfully.');
    }
}
