<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\Teacher;
use App\Models\Classes;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ClassManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_class_management_page()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Classes::factory()->count(5)->create();

        $response = $this->actingAs($admin)->get('/admin/classes');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Class/Index')
            ->has('classes.data', 5)
        );
    }

    public function test_admin_can_view_create_class_page()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Teacher::factory()->count(3)->create();

        $response = $this->actingAs($admin)->get('/admin/classes/create');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Class/Create')
            ->has('teachers', 3)
        );
    }

    public function test_non_admin_cannot_access_class_management()
    {
        $user = User::factory()->create(['role' => 'teacher']);

        $response = $this->actingAs($user)->get('/admin/classes');

        $response->assertStatus(403);
    }
}
