<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Validator;

class StoreLeadRequest extends FormRequest
{
    /** Public lead-capture endpoint — no auth required to submit. */
    public function authorize(): bool
    {
        return true;
    }

    /** The frontend sends this over multipart form-data, so it arrives as the string "true"/"false". */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_decision_maker' => filter_var($this->input('is_decision_maker'), FILTER_VALIDATE_BOOLEAN),
        ]);
    }

    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'phone' => ['required', 'string', 'min:7'],
            'role' => ['nullable', 'string', 'max:80'],
            'is_decision_maker' => ['required', 'boolean'],

            'business_type' => ['required', 'string', 'min:2', 'max:255'],
            'product_type' => ['required', 'string', 'in:' . implode(',', config('leads.product_types'))],
            'track' => ['required', 'string', 'in:low_ticket,high_ticket'],

            'budget_band' => ['required', 'string', 'in:' . implode(',', config('leads.budget_bands'))],
            'need_description' => ['required', 'string', 'min:10', 'max:2000'],
            'desired_launch' => ['required', 'string', 'in:' . implode(',', config('leads.desired_launch_options'))],

            'brief_file' => ['nullable', 'file', 'max:10240', 'mimes:pdf,doc,docx,png,jpg,jpeg'],

            'attribution' => ['nullable', 'string'],
        ];
    }

    /** Cross-field check: budget must be in range for the derived track. */
    protected function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            $track = $this->input('track');
            $budgetBand = $this->input('budget_band');
            $allowed = config("leads.budget_bands_by_track.$track", []);

            if ($track && $budgetBand && ! in_array($budgetBand, $allowed, true)) {
                $validator->errors()->add('budget_band', 'Selected budget is out of range for this project type.');
            }
        });
    }

    protected function failedValidation(ValidatorContract $validator): void
    {
        throw new HttpResponseException(
            response()->json(['error' => $validator->errors()->first()], 422)
        );
    }

    /** Decoded attribution payload — empty array if missing or malformed. */
    public function attributionData(): array
    {
        $decoded = json_decode($this->input('attribution', '{}'), true);

        return is_array($decoded) ? $decoded : [];
    }
}
