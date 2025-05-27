<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Admin Account
        User::create([
            'name' => 'Kim Gela Mondido',
            'email' => 'kim@admin.com',
            'password' => Hash::make('12345678'),
            'role' => 'Admin'
        ]);

        // Create Student Account
        User::create([
            'name' => 'Kim Mondido',
            'email' => 'kim@student.com',
            'password' => Hash::make('123456789'),
            'role' => 'Student'
        ]);
    }
} 