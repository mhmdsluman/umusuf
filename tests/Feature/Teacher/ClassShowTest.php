<?php

namespace Tests\Feature\Teacher;

use App\Models\User;
use App\Models\Teacher;
use App\Models\Student;
use App\Models\Classes;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ClassShowTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_can_view_their_own_class_details()
    {
        $teacher = Teacher::factory()->create();
        $class = Classes::factory()->create(['teacher_id' => $teacher->id]);
        $students = Student::factory()->count(3)->create(['class_id' => $class->id]);

        $response = $this->actingAs($teacher->user)->get(route('teacher.classes.show', $class));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Teacher/Class/Show')
            ->has('class', function (Assert $classProp) use ($class, $students) {
                $classProp
                    ->where('id', $class->id)
                    ->has('students', 3)
                    ->where('students.0.id', $students[0]->id)
                    ->etc();
            })
        );
    }

    public function test_teacher_cannot_view_another_teachers_class_details()
    {
        // Teacher 1 owns the class
        $teacher1 = Teacher::factory()->create();
        $class = Classes::factory()->create(['teacher_id' => $teacher1->id]);

        // Teacher 2 tries to view it
        $teacher2 = Teacher::factory()->create();

        $response = $this->actingAs($teacher2->user)->get(route('teacher.classes.show', $class));

        $response->assertStatus(403);
    }
}
