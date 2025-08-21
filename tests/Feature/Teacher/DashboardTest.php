<?php

namespace Tests\Feature\Teacher;

use App\Models\User;
use App\Models\Teacher;
use App\Models\Classes;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_can_view_their_dashboard_with_their_classes()
    {
        // Create teacher 1 and their classes
        $teacher1 = Teacher::factory()->create();
        $user1 = $teacher1->user;
        $class1 = Classes::factory()->create(['teacher_id' => $teacher1->id]);
        $class2 = Classes::factory()->create(['teacher_id' => $teacher1->id]);

        // Create teacher 2 and their class
        $teacher2 = Teacher::factory()->create();
        $class3 = Classes::factory()->create(['teacher_id' => $teacher2->id]);

        $response = $this->actingAs($user1)->get(route('teacher.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Teacher/Dashboard')
            ->has('classes', 2)
            ->where('classes.0.id', $class1->id)
            ->where('classes.1.id', $class2->id)
            ->missing('classes.2') // Ensure class from other teacher is not present
        );
    }

    public function test_teacher_without_classes_sees_an_empty_list()
    {
        $teacher = Teacher::factory()->create();
        $user = $teacher->user;

        $response = $this->actingAs($user)->get(route('teacher.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Teacher/Dashboard')
            ->has('classes', 0)
        );
    }
}
