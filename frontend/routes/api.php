// Grade Levels Routes
Route::prefix('grade-levels')->group(function () {
    Route::get('/', [GradeLevelController::class, 'index']);
    Route::post('/', [GradeLevelController::class, 'store']);
    Route::put('/{gradeLevel}', [GradeLevelController::class, 'update']);
    Route::delete('/{gradeLevel}', [GradeLevelController::class, 'destroy']);
}); 