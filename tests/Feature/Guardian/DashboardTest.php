<?php

namespace Tests\Feature\Guardian;

use App\Models\User;
use App\Models\Guardian;
use App\Models\Student;
use App\Models\Classes;
use App\Models\Attendance;
use App\Models\Tasmee3;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guardian_can_view_their_dashboard_with_their_childrens_information()
    {
        // 1. Arrange
        $guardian = Guardian::factory()->create();
        $child1 = Student::factory()->create();
        $child2 = Student::factory()->create();
        $unlinkedStudent = Student::factory()->create();

        $guardian->students()->attach([$child1->id, $child2->id]);

        Attendance::factory()->create(['student_id' => $child1->id]);
        Tasmee3::factory()->create(['student_id' => $child2->id]);

        // 2. Act
        $response = $this->actingAs($guardian->user)->get(route('guardian.dashboard'));

        // 3. Assert
        $response->assertOk();
        $response->assertInertia(function (Assert $page) use ($guardian, $child1, $child2, $unlinkedStudent) {
            $page->component('Guardian/Dashboard')
                ->has('guardian')
                ->where('guardian.id', $guardian->id)
                ->has('guardian.students', 2)
                ->where('guardian.students.0.id', $child1->id)
                ->where('guardian.students.1.id', $child2->id)
                ->has('guardian.students.0.attendance', 1)
                ->has('guardian.students.1.tasmee3', 1)
                ->whereNot('guardian.students.0.id', $unlinkedStudent->id)
                ->whereNot('guardian.students.1.id', $unlinkedStudent->id);
        });
    }
}
