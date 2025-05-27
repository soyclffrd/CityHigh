<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubjectRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // You can add authorization logic here if needed
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $subjectId = $this->route('subject')?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('subjects')->ignore($subjectId),
            ],
            'status' => ['required', 'string', Rule::in(['Available', 'Unavailable'])],
            'grade_level' => ['required', 'string', Rule::in([
                'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
            ])],
            'strand' => ['required', 'string', Rule::in([
                'No Strand', 'STEM', 'ABM', 'HUMSS', 'GAS', 'TVL', 'Sports', 'Arts & Design'
            ])],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'The subject name is required.',
            'code.required' => 'The subject code is required.',
            'code.unique' => 'This subject code is already in use.',
            'status.required' => 'The subject status is required.',
            'status.in' => 'The status must be either Available or Unavailable.',
            'grade_level.required' => 'The grade level is required.',
            'grade_level.in' => 'Please select a valid grade level.',
            'strand.required' => 'The strand is required.',
            'strand.in' => 'Please select a valid strand.',
            'description.max' => 'The description cannot exceed 1000 characters.',
        ];
    }
} 