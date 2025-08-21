<?php

namespace Tests\Feature\Teacher;

use App\Models\User;
use App\Models\Teacher;
use App\Models\Student;
use App\Models\Classes;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_can_mark_attendance_for_their_student()
    {
        $teacher = Teacher::factory()->create();
        $class = Classes::factory()->create(['teacher_id' => $teacher->id]);
        $student = Student::factory()->create(['class_id' => $class->id]);
        $today = now()->format('Y-m-d');

        $response = $this->actingAs($teacher->user)->post(route('teacher.attendance.store'), [
            'student_id' => $student->id,
            'status' => 'present',
            'date' => $today,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('attendances', [
            'student_id' => $student->id,
            'date' => $today,
            'status' => 'present',
        ]);
    }

    public function test_teacher_can_update_existing_attendance()
    {
        $teacher = Teacher::factory()->create();
        $class = Classes::factory()->create(['teacher_id' => $teacher->id]);
        $student = Student::factory()->create(['class_id' => $class->id]);
        $today = now()->format('Y-m-d');

        // First, mark as present
        $this->actingAs($teacher->user)->post(route('teacher.attendance.store'), [
            'student_id' => $student->id,
            'status' => 'present',
            'date' => $today,
        ]);

        // Then, update to absent
        $response = $this->actingAs($teacher->user)->post(route('teacher.attendance.store'), [
            'student_id' => $student->id,
            'status' => 'absent',
            'date' => $today,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('attendances', [
            'student_id' => $student->id,
            'date' => $today,
            'status' => 'absent',
        ]);
        $this->assertDatabaseCount('attendances', 1);
    }

    public function test_teacher_cannot_mark_attendance_for_another_teachers_student()
    {
        $teacher1 = Teacher::factory()->create();
        $class1 = Classes::factory()->create(['teacher_id' => $teacher1->id]);
        $student1 = Student::factory()->create(['class_id' => $class1->id]);

        $teacher2 = Teacher::factory()->create();
        $today = now()->format('Y-m-d');

        $response = $this->actingAs($teacher2->user)->post(route('teacher.attendance.store'), [
            'student_id' => $student1->id,
            'status' => 'present',
            'date' => $today,
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('attendances', [
            'student_id' => $student1->id,
            'date' => $today,
        ]);
    }
}
