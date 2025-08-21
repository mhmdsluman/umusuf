<?php

namespace Database\Factories;

use App\Models\Classes;
use App\Models\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

class ClassesFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Classes::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'name' => $this->faker->word . ' Class',
            'teacher_id' => Teacher::factory(),
            'fee' => $this->faker->numberBetween(50, 200),
            'time' => $this->faker->time('H:i'),
        ];
    }
}
