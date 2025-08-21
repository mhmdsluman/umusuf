<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\Guardian;
use App\Models\Student;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class GuardianStudentTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_link_guardian_student_page()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Guardian::factory()->count(2)->create();
        Student::factory()->count(5)->create();

        $response = $this->actingAs($admin)->get('/admin/guardian-student/create');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/GuardianStudent/Create')
            ->has('guardians', 2)
            ->has('students', 5)
        );
    }

    public function test_admin_can_link_students_to_guardian()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $guardian = Guardian::factory()->create();
        $students = Student::factory()->count(3)->create();

        $studentIds = $students->pluck('id')->toArray();

        $response = $this->actingAs($admin)->post('/admin/guardian-student', [
            'guardian_id' => $guardian->id,
            'student_ids' => $studentIds,
        ]);

        $response->assertRedirect('/admin/users');
        $this->assertDatabaseHas('guardian_student', [
            'guardian_id' => $guardian->id,
            'student_id' => $students[0]->id,
        ]);
        $this->assertDatabaseHas('guardian_student', [
            'guardian_id' => $guardian->id,
            'student_id' => $students[1]->id,
        ]);
        $this->assertDatabaseHas('guardian_student', [
            'guardian_id' => $guardian->id,
            'student_id' => $students[2]->id,
        ]);
    }

    public function test_non_admin_cannot_access_link_page()
    {
        $user = User::factory()->create(['role' => 'guardian']);

        $response = $this->actingAs($user)->get('/admin/guardian-student/create');

        $response->assertStatus(403);
    }
}
