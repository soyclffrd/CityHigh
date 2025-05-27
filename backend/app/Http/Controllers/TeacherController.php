<?php

namespace App\Http\Controllers;

use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Database\Eloquent\Collection;

class TeacherController extends Controller
{
    public function index(Request $request)
    {
        try {
            Log::info('Fetching teachers with params:', [
                'page' => $request->input('page'),
                'limit' => $request->input('limit'),
                'search' => $request->input('search')
            ]);

            $query = Teacher::query();
            
            // Search functionality
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('subject', 'like', "%{$search}%");
                });
            }

            // Pagination
            $perPage = $request->input('limit', 10);
            $teachers = $query->paginate($perPage);

            // Convert teachers to array with image_url
            $teachersData = $teachers->through(function ($teacher) {
                $data = $teacher->toArray();
                $data['image_url'] = $teacher->image_url;
                return $data;
            })->items();

            Log::info('Found ' . count($teachersData) . ' teachers');

            // Log each teacher's data for debugging
            foreach ($teachersData as $teacher) {
                Log::info('Teacher data:', [
                    'id' => $teacher['id'],
                    'name' => $teacher['name'],
                    'image' => $teacher['image'],
                    'image_url' => $teacher['image_url']
                ]);
            }

            return response()->json([
                'success' => true,
                'teachers' => $teachersData,
                'pagination' => [
                    'total' => $teachers->total(),
                    'per_page' => $teachers->perPage(),
                    'current_page' => $teachers->currentPage(),
                    'last_page' => $teachers->lastPage(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error in TeacherController@index: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching teachers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:teachers,email',
                'phone' => 'required|string|max:20',
                'subject' => 'required|string|max:255',
                'gender' => 'required|in:Male,Female',
                'image' => 'nullable|image|max:2048' // max 2MB
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->except('image');
            
            // Handle image upload
            if ($request->hasFile('image')) {
                try {
                    $path = $request->file('image')->store('teachers/images', 'public');
                    $data['image'] = $path;
                } catch (\Exception $e) {
                    \Log::error('Error uploading image: ' . $e->getMessage());
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to upload image',
                        'error' => $e->getMessage()
                    ], 500);
                }
            }

            $teacher = Teacher::create($data);
            
            // Add image_url to the response
            $teacherData = $teacher->toArray();
            try {
                $teacherData['image_url'] = $teacher->image ? Storage::disk('public')->url($teacher->image) : null;
            } catch (\Exception $e) {
                \Log::error('Error getting image URL for new teacher: ' . $e->getMessage());
                $teacherData['image_url'] = null;
            }

            return response()->json([
                'success' => true,
                'message' => 'Teacher created successfully',
                'teacher' => $teacherData
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Error in TeacherController@store: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating the teacher',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Teacher $teacher)
    {
        try {
            Log::info('Updating teacher:', [
                'teacher_id' => $teacher->id,
                'request_data' => $request->all(),
                'has_image' => $request->hasFile('image'),
                'image_details' => $request->hasFile('image') ? [
                    'original_name' => $request->file('image')->getClientOriginalName(),
                    'mime_type' => $request->file('image')->getMimeType(),
                    'size' => $request->file('image')->getSize(),
                ] : null
            ]);

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:teachers,email,' . $teacher->id,
                'phone' => 'required|string|max:20',
                'subject' => 'required|string|max:255',
                'gender' => 'required|in:Male,Female',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048' // max 2MB
            ]);

            if ($validator->fails()) {
                Log::error('Validation failed:', [
                    'errors' => $validator->errors()->toArray(),
                    'request_data' => $request->except('image')
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get all validated data except image
            $data = $validator->validated();
            unset($data['image']);
            
            // Handle image upload
            if ($request->hasFile('image')) {
                try {
                    $file = $request->file('image');
                    
                    // Validate file
                    if (!$file->isValid()) {
                        Log::error('Invalid file upload:', [
                            'error' => $file->getError(),
                            'original_name' => $file->getClientOriginalName()
                        ]);
                        throw new \Exception('Invalid file upload: ' . $file->getErrorMessage());
                    }

                    // Delete old image if exists
                    if ($teacher->image) {
                        Storage::disk('public')->delete($teacher->image);
                        Log::info('Deleted old image:', ['path' => $teacher->image]);
                    }

                    // Store new image
                    $path = $file->store('teachers/images', 'public');
                    if (!$path) {
                        throw new \Exception('Failed to store image');
                    }

                    Log::info('Image uploaded successfully:', [
                        'path' => $path,
                        'original_name' => $file->getClientOriginalName(),
                        'mime_type' => $file->getMimeType(),
                        'size' => $file->getSize()
                    ]);

                    $data['image'] = $path;
                } catch (\Exception $e) {
                    Log::error('Error updating image: ' . $e->getMessage(), [
                        'trace' => $e->getTraceAsString(),
                        'teacher_id' => $teacher->id
                    ]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to upload image',
                        'error' => $e->getMessage()
                    ], 500);
                }
            }

            // Update the teacher
            $updated = $teacher->update($data);
            
            if (!$updated) {
                Log::error('Failed to update teacher:', [
                    'teacher_id' => $teacher->id,
                    'data' => $data
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update teacher'
                ], 500);
            }

            // Refresh the teacher model to get updated data
            $teacher->refresh();
            
            // Add image_url to the response
            $teacherData = $teacher->toArray();
            try {
                $teacherData['image_url'] = $teacher->image_url;
                Log::info('Teacher updated successfully:', [
                    'teacher_id' => $teacher->id,
                    'image_url' => $teacherData['image_url']
                ]);
            } catch (\Exception $e) {
                Log::error('Error getting image URL for updated teacher: ' . $e->getMessage());
                $teacherData['image_url'] = null;
            }

            return response()->json([
                'success' => true,
                'message' => 'Teacher updated successfully',
                'teacher' => $teacherData
            ]);
        } catch (\Exception $e) {
            Log::error('Error in TeacherController@update: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'teacher_id' => $teacher->id
            ]);
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating the teacher',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Teacher $teacher)
    {
        // Delete image if exists
        if ($teacher->image) {
            Storage::disk('public')->delete($teacher->image);
        }

        $teacher->delete();

        return response()->json([
            'success' => true,
            'message' => 'Teacher deleted successfully'
        ]);
    }
} 