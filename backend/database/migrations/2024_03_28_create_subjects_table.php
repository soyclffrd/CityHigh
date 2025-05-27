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
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->enum('status', ['Available', 'Unavailable'])->default('Available');
            $table->string('grade_level');
            $table->string('strand');
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes(); // For soft deletes
        });

        // Create a pivot table for subject-student relationships
        Schema::create('subject_student', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained()->onDelete('cascade');
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            // Prevent duplicate enrollments
            $table->unique(['subject_id', 'student_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subject_student');
        Schema::dropIfExists('subjects');
    }
}; 