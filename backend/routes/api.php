<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\SubjectController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Public routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Health check endpoint
Route::get('/up', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now(),
        'message' => 'Server is running'
    ]);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Admin only routes
    Route::middleware('role:Admin')->group(function () {
        Route::get('/admin/dashboard', function () {
            return response()->json(['message' => 'Admin dashboard data']);
        });

        // Subject routes (Admin only)
        Route::prefix('subjects')->group(function () {
            Route::get('/', [SubjectController::class, 'index']);
            Route::post('/', [SubjectController::class, 'store']);
            Route::get('/{subject}', [SubjectController::class, 'show']);
            Route::put('/{subject}', [SubjectController::class, 'update']);
            Route::delete('/{subject}', [SubjectController::class, 'destroy']);
            Route::get('/grade-levels', [SubjectController::class, 'getGradeLevels']);
            Route::get('/strands', [SubjectController::class, 'getStrands']);
            Route::post('/{subject}/enroll', [SubjectController::class, 'enrollStudents']);
            Route::post('/{subject}/unenroll', [SubjectController::class, 'unenrollStudents']);
        });
    });

    // Student only routes
    Route::middleware('role:Student')->group(function () {
        Route::get('/student/dashboard', function () {
            return response()->json(['message' => 'Student dashboard data']);
        });
    });

    // Teacher routes
    Route::get('/teachers', [TeacherController::class, 'index']);
    Route::post('/teachers', [TeacherController::class, 'store']);
    Route::put('/teachers/{teacher}', [TeacherController::class, 'update']);
    Route::delete('/teachers/{teacher}', [TeacherController::class, 'destroy']);

    // Student routes
    Route::apiResource('students', StudentController::class);
}); 