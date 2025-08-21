<?php

namespace Database\Factories;

use App\Models\Tasmee3;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

class Tasmee3Factory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Tasmee3::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'student_id' => Student::factory(),
            'surah' => $this->faker->word,
            'ayah_from' => 1,
            'ayah_to' => $this->faker->numberBetween(2, 20),
            'grade' => $this->faker->randomElement(['excellent', 'good', 'average', 'poor']),
        ];
    }
}
