<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $firstname = fake()->firstName();
        $lastname = fake()->lastName();

        return [
            'initials' => strtoupper(fake()->unique()->lexify('???')),
            'active' => true,
            'lastname' => $lastname,
            'firstname' => $firstname,
            'prefix' => null,
            'username' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('password'),
            'bcolor' => null,
            'color' => null,
            'role_ID' => 1,
            'beta' => false,
            'jobtitle' => fake()->jobTitle(),
            'birthday' => null,
            'decolorize_avatars' => false,
            'appearance' => 'auto',
            'notifications' => 'off',
            'last_ads_mail_timestamp' => null,
        ];
    }
}
