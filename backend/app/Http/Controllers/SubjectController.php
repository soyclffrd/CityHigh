<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use App\Http\Requests\SubjectRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SubjectController extends Controller
{
    /**
     * Display a paginated list of subjects.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Subject::query();

            // Apply search if provided
            if ($search = $request->input('search')) {
                $query->search($search);
            }

            // Apply filters if provided
            if ($gradeLevel = $request->input('grade_level')) {
                $query->gradeLevel($gradeLevel);
            }

            if ($strand = $request->input('strand')) {
                $query->strand($strand);
            }

            if ($status = $request->input('status')) {
                $query->where('status', $status);
            }

            // Get paginated results
            $subjects = $query->withCount('students')
                            ->orderBy('created_at', 'desc')
                            ->paginate($request->input('limit', 10));

            return response()->json([
                'success' => true,
                'subjects' => $subjects->items(),
                'pagination' => [
                    'total' => $subjects->total(),
                    'per_page' => $subjects->perPage(),
                    'current_page' => $subjects->currentPage(),
                    'last_page' => $subjects->lastPage(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching subjects: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch subjects',
            ], 500);
        }
    }

    /**
     * Store a newly created subject.
     */
    public function store(SubjectRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $subject = Subject::create($request->validated());

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Subject created successfully',
                'subject' => $subject->loadCount('students'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating subject: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create subject',
            ], 500);
        }
    }

    /**
     * Display the specified subject.
     */
    public function show(Subject $subject): JsonResponse
    {
        try {
            $subject->load(['students' => function ($query) {
                $query->select('students.id', 'name', 'grade_level', 'strand')
                      ->withPivot('created_at');
            }]);

            return response()->json([
                'success' => true,
                'subject' => $subject->loadCount('students'),
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching subject: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch subject details',
            ], 500);
        }
    }

    /**
     * Update the specified subject.
     */
    public function update(SubjectRequest $request, Subject $subject): JsonResponse
    {
        try {
            DB::beginTransaction();

            $subject->update($request->validated());

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Subject updated successfully',
                'subject' => $subject->loadCount('students'),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating subject: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update subject',
            ], 500);
        }
    }

    /**
     * Remove the specified subject.
     */
    public function destroy(Subject $subject): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Check if subject has enrolled students
            if ($subject->students()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete subject with enrolled students',
                ], 422);
            }

            $subject->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Subject deleted successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting subject: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete subject',
            ], 500);
        }
    }

    /**
     * Get available grade levels.
     */
    public function getGradeLevels(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'grade_levels' => [
                'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
            ],
        ]);
    }

    /**
     * Get available strands.
     */
    public function getStrands(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'strands' => [
                'No Strand', 'STEM', 'ABM', 'HUMSS', 'GAS', 'TVL', 'Sports', 'Arts & Design'
            ],
        ]);
    }

    /**
     * Enroll students in a subject.
     */
    public function enrollStudents(Request $request, Subject $subject): JsonResponse
    {
        try {
            $request->validate([
                'student_ids' => 'required|array',
                'student_ids.*' => 'exists:students,id',
            ]);

            DB::beginTransaction();

            // Attach students to subject
            $subject->students()->attach($request->student_ids, [
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Students enrolled successfully',
                'subject' => $subject->loadCount('students'),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error enrolling students: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to enroll students',
            ], 500);
        }
    }

    /**
     * Unenroll students from a subject.
     */
    public function unenrollStudents(Request $request, Subject $subject): JsonResponse
    {
        try {
            $request->validate([
                'student_ids' => 'required|array',
                'student_ids.*' => 'exists:students,id',
            ]);

            DB::beginTransaction();

            // Detach students from subject
            $subject->students()->detach($request->student_ids);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Students unenrolled successfully',
                'subject' => $subject->loadCount('students'),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error unenrolling students: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to unenroll students',
            ], 500);
        }
    }
} 