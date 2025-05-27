<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('gender', ['Male', 'Female']);
            $table->string('grade_level'); // Grade 7 to Grade 12
            $table->string('strand'); // STEM, ABM, HUMSS, GAS, TVL, Sports, Arts & Design
            $table->string('section'); // Sun Flower, Rose, Tulip, Daisy, Orchid
            $table->string('subject'); // Mathematics, Science, English, etc.
            $table->string('avatar')->nullable(); // For storing the image path
            $table->string('email')->unique()->nullable();
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->date('birth_date')->nullable();
            $table->timestamps();
            $table->softDeletes(); // For soft deletes
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
