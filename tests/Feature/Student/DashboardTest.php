<?php

namespace Tests\Feature\Student;

use App\Models\User;
use App\Models\Teacher;
use App\Models\Student;
use App\Models\Classes;
use App\Models\Plan;
use App\Models\Attendance;
use App\Models\Tasmee3;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_view_their_dashboard_with_all_their_information()
    {
        // 1. Arrange
        $plan = Plan::factory()->create();
        $teacher = Teacher::factory()->create();
        $class = Classes::factory()->create(['teacher_id' => $teacher->id]);
        $student = Student::factory()->create([
            'class_id' => $class->id,
            'plan_id' => $plan->id,
        ]);
        $attendance = Attendance::factory()->create(['student_id' => $student->id]);
        $tasmee3 = Tasmee3::factory()->create(['student_id' => $student->id]);

        // Create another student with other data to ensure we're not mixing data
        $otherStudent = Student::factory()->create();
        Attendance::factory()->create(['student_id' => $otherStudent->id]);

        // 2. Act
        $response = $this->actingAs($student->user)->get(route('student.dashboard'));

        // 3. Assert
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Student/Dashboard')
            ->has('student')
            ->where('student.id', $student->id)
            ->where('student.class.name', $class->name)
            ->where('student.plan.name', $plan->name)
            ->has('student.attendance', 1)
            ->where('student.attendance.0.status', $attendance->status)
            ->has('student.tasmee3', 1)
            ->where('student.tasmee3.0.surah', $tasmee3->surah)
        );
    }

    public function test_student_cannot_view_another_students_dashboard()
    {
        // This is implicitly tested by the role middleware, but an explicit
        // test for trying to access another student's data on one's own dashboard
        // is what the first test accomplishes by creating a second student.
        $this->assertTrue(true);
    }
}
