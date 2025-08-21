<?php

namespace Tests\Feature\Teacher;

use App\Models\User;
use App\Models\Teacher;
use App\Models\Student;
use App\Models\Classes;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Tasmee3Test extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_can_record_tasmee3_for_their_student()
    {
        $teacher = Teacher::factory()->create();
        $class = Classes::factory()->create(['teacher_id' => $teacher->id]);
        $student = Student::factory()->create(['class_id' => $class->id]);

        $response = $this->actingAs($teacher->user)->post(route('teacher.tasmee3.store'), [
            'student_id' => $student->id,
            'surah' => 'Al-Fatiha',
            'ayah_from' => 1,
            'ayah_to' => 7,
            'grade' => 'excellent',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('tasmee3s', [
            'student_id' => $student->id,
            'surah' => 'Al-Fatiha',
            'ayah_from' => 1,
            'ayah_to' => 7,
            'grade' => 'excellent',
        ]);
    }

    public function test_teacher_cannot_record_tasmee3_for_another_teachers_student()
    {
        $teacher1 = Teacher::factory()->create();
        $class1 = Classes::factory()->create(['teacher_id' => $teacher1->id]);
        $student1 = Student::factory()->create(['class_id' => $class1->id]);

        $teacher2 = Teacher::factory()->create();

        $response = $this->actingAs($teacher2->user)->post(route('teacher.tasmee3.store'), [
            'student_id' => $student1->id,
            'surah' => 'Al-Fatiha',
            'ayah_from' => 1,
            'ayah_to' => 7,
            'grade' => 'excellent',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('tasmee3s', [
            'student_id' => $student1->id,
        ]);
    }
}
