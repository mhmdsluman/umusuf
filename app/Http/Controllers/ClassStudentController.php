<?php

namespace App\Http\Controllers;

use App\Models\Classes;
use App\Models\Student;
use Illuminate\Http\Request;

class ClassStudentController extends Controller
{
    public function edit(Classes $class)
    {
        $students = Student::with('user')->get();
        $enrolledStudentIds = $class->students()->pluck('students.id')->toArray();

        return view('admin.classes.students.edit', compact('class', 'students', 'enrolledStudentIds'));
    }

    public function update(Request $request, Classes $class)
    {
        $request->validate([
            'students' => ['sometimes', 'array'],
            'students.*' => ['exists:students,id'],
        ]);

        // First, remove all students from this class
        Student::where('class_id', $class->id)->update(['class_id' => null]);

        // Then, assign the selected students to this class
        if ($request->has('students')) {
            Student::whereIn('id', $request->input('students'))->update(['class_id' => $class->id]);
        }

        return redirect()->route('admin.classes.index')->with('success', 'Student enrollment updated successfully.');
    }
}
