<?php

namespace App\Http\Controllers;

use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        try {
            Log::info('Fetching students with params:', [
                'page' => $request->input('page'),
                'limit' => $request->input('limit'),
                'search' => $request->input('search')
            ]);

            $query = Student::query();
            
            // Search functionality
            if ($request->has('search')) {
                $query->search($request->search);
            }

            // Pagination
            $perPage = $request->input('limit', 10);
            $students = $query->paginate($perPage);

            // Get the students data and convert to array with avatar_url
            $studentsArray = $students->items();
            $studentsData = collect($studentsArray)->map(function ($student) {
                $data = $student->toArray();
                $data['avatar_url'] = $student->avatar_url;
                return $data;
            })->all();

            Log::info('Found ' . count($studentsData) . ' students');

            return response()->json([
                'success' => true,
                'students' => $studentsData,
                'pagination' => [
                    'total' => $students->total(),
                    'per_page' => $students->perPage(),
                    'current_page' => $students->currentPage(),
                    'last_page' => $students->lastPage(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error in StudentController@index: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching students',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'gender' => 'required|in:Male,Female',
                'grade_level' => 'required|string|max:255',
                'strand' => 'required|string|max:255',
                'section' => 'required|string|max:255',
                'subject' => 'required|string|max:255',
                'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048', // max 2MB
                'email' => 'nullable|email|unique:students,email',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:255',
                'birth_date' => 'nullable|date',
                'guardian_name' => 'nullable|string|max:255',
                'guardian_phone' => 'nullable|string|max:20',
                'guardian_relationship' => 'nullable|string|max:255',
                'notes' => 'nullable|string',
                'is_active' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->except('avatar');
            
            // Handle avatar upload
            if ($request->hasFile('avatar')) {
                try {
                    $path = $request->file('avatar')->store('students/avatars', 'public');
                    $data['avatar'] = $path;
                } catch (\Exception $e) {
                    Log::error('Error uploading avatar: ' . $e->getMessage());
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to upload avatar',
                        'error' => $e->getMessage()
                    ], 500);
                }
            }

            $student = Student::create($data);
            
            // Add avatar_url to the response
            $studentData = $student->toArray();
            $studentData['avatar_url'] = $student->avatar_url;

            return response()->json([
                'success' => true,
                'message' => 'Student created successfully',
                'student' => $studentData
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error in StudentController@store: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating the student',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Student $student)
    {
        try {
            Log::info('Updating student:', [
                'student_id' => $student->id,
                'request_data' => $request->all(),
                'has_avatar' => $request->hasFile('avatar')
            ]);

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'gender' => 'required|in:Male,Female',
                'grade_level' => 'required|string|max:255',
                'strand' => 'required|string|max:255',
                'section' => 'required|string|max:255',
                'subject' => 'required|string|max:255',
                'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'email' => 'nullable|email|unique:students,email,' . $student->id,
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:255',
                'birth_date' => 'nullable|date',
                'guardian_name' => 'nullable|string|max:255',
                'guardian_phone' => 'nullable|string|max:20',
                'guardian_relationship' => 'nullable|string|max:255',
                'notes' => 'nullable|string',
                'is_active' => 'boolean'
            ]);

            if ($validator->fails()) {
                Log::error('Validation failed:', [
                    'errors' => $validator->errors()->toArray(),
                    'request_data' => $request->except('avatar')
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get all validated data except avatar
            $data = $validator->validated();
            unset($data['avatar']);
            
            // Handle avatar upload
            if ($request->hasFile('avatar')) {
                try {
                    $file = $request->file('avatar');
                    
                    // Validate file
                    if (!$file->isValid()) {
                        Log::error('Invalid file upload:', [
                            'error' => $file->getError(),
                            'original_name' => $file->getClientOriginalName()
                        ]);
                        throw new \Exception('Invalid file upload: ' . $file->getErrorMessage());
                    }

                    // Delete old avatar if exists
                    if ($student->avatar) {
                        Storage::disk('public')->delete($student->avatar);
                        Log::info('Deleted old avatar:', ['path' => $student->avatar]);
                    }

                    // Store new avatar
                    $path = $file->store('students/avatars', 'public');
                    if (!$path) {
                        throw new \Exception('Failed to store avatar');
                    }

                    Log::info('Avatar uploaded successfully:', [
                        'path' => $path,
                        'original_name' => $file->getClientOriginalName(),
                        'mime_type' => $file->getMimeType(),
                        'size' => $file->getSize()
                    ]);

                    $data['avatar'] = $path;
                } catch (\Exception $e) {
                    Log::error('Error updating avatar: ' . $e->getMessage(), [
                        'trace' => $e->getTraceAsString(),
                        'student_id' => $student->id
                    ]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to upload avatar',
                        'error' => $e->getMessage()
                    ], 500);
                }
            }

            // Update the student
            $updated = $student->update($data);
            
            if (!$updated) {
                Log::error('Failed to update student:', [
                    'student_id' => $student->id,
                    'data' => $data
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update student'
                ], 500);
            }

            // Refresh the student model to get updated data
            $student->refresh();
            
            // Add avatar_url to the response
            $studentData = $student->toArray();
            $studentData['avatar_url'] = $student->avatar_url;

            Log::info('Student updated successfully:', [
                'student_id' => $student->id,
                'avatar_url' => $studentData['avatar_url']
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Student updated successfully',
                'student' => $studentData
            ]);
        } catch (\Exception $e) {
            Log::error('Error in StudentController@update: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'student_id' => $student->id
            ]);
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating the student',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Student $student)
    {
        try {
            // Delete avatar if exists
            if ($student->avatar) {
                Storage::disk('public')->delete($student->avatar);
            }

            $student->delete();

            return response()->json([
                'success' => true,
                'message' => 'Student deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error in StudentController@destroy: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'student_id' => $student->id
            ]);
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting the student',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 