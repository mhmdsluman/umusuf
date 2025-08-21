<?php

namespace App\Http\Controllers;

use App\Models\Classes;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ClassController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $classes = Classes::with('teacher.user')->latest()->paginate(15);
        return Inertia::render('Admin/Class/Index', [
            'classes' => $classes
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $teachers = Teacher::with('user')->get();
        return Inertia::render('Admin/Class/Create', [
            'teachers' => $teachers
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'teacher_id' => ['nullable', 'exists:teachers,id'],
            'fee' => ['nullable', 'numeric'],
            'time' => ['nullable', 'date_format:H:i'],
            'schedule_days' => ['nullable', 'array'],
        ]);

        Classes::create($request->all());

        return redirect()->route('admin.classes.index')->with('success', 'Class created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Classes $class)
    {
        // Authorize that the teacher can view this class
        $teacher = Auth::user()->teacher;
        if (!$teacher || $class->teacher_id !== $teacher->id) {
            abort(403, 'Unauthorized action.');
        }

        $today = now()->format('Y-m-d');

        // Load students for the class and their attendance for today
        $class->load(['students.user', 'students.tasmee3', 'students.attendance' => function ($query) use ($today) {
            $query->where('date', $today);
        }]);

        return Inertia::render('Teacher/Class/Show', [
            'class' => $class,
            'today' => $today,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
