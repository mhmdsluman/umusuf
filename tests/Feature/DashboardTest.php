<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @dataProvider roleDashboardProvider
     */
    public function test_user_is_redirected_to_correct_dashboard_on_login(string $role, string $expectedRoute)
    {
        $user = User::factory()->create(['role' => $role]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertRedirect($expectedRoute);
    }

    /**
     * @dataProvider roleDashboardProvider
     */
    public function test_user_can_access_their_own_dashboard(string $role, string $dashboardUrl, string $componentName)
    {
        $user = User::factory()->create(['role' => $role]);

        $response = $this->actingAs($user)->get($dashboardUrl);

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page->component($componentName));
    }

    public function test_user_cannot_access_other_dashboards()
    {
        $student = User::factory()->create(['role' => 'student']);

        $this->actingAs($student)->get('/admin/dashboard')->assertStatus(403);
        $this->actingAs($student)->get('/teacher/dashboard')->assertStatus(403);
        $this->actingAs($student)->get('/guardian/dashboard')->assertStatus(403);
    }

    public static function roleDashboardProvider(): array
    {
        return [
            'admin' => ['admin', '/admin/dashboard', 'Admin/Dashboard'],
            'teacher' => ['teacher', '/teacher/dashboard', 'Teacher/Dashboard'],
            'student' => ['student', '/student/dashboard', 'Student/Dashboard'],
            'guardian' => ['guardian', '/guardian/dashboard', 'Guardian/Dashboard'],
        ];
    }
}
