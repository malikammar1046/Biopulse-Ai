# Phase 3A: Real Medical Report OCR — PaddleOCR Implementation Plan

## 1. Current OCR Implementation
The current application provides a 4-step wizard UI in `apps/web/src/components/reports/ReportUploadModal.tsx` and saves physical files to the Supabase `medical-reports` storage bucket.
However, the text extraction layer in `apps/web/src/services/ocrService.ts` currently uses client-side template matching with a simulated `setTimeout(1200ms)`.

## 2. What Is Simulated
- In `apps/web/src/services/ocrService.ts`, `extractReportData(file, preferredType)` selects a canned array (`TEMPLATE_EXTRACTIONS[preferredType]`) without inspecting file pixels or text layers.
- Confidence scores and extracted biomarker values (e.g. Total Testosterone, LH, FSH) were hardcoded mocks.

## 3. Existing Report Upload Flow
1. User drops/selects a PDF or Image in `ReportHeroUpload` / `ReportUploadModal`.
2. Metadata is entered (Report Title, Category, Test Date).
3. Step 3 initiates OCR extraction.
4. Step 4 renders the interactive table where user reviews/edits extracted biomarker rows.
5. On final save, `reportService.uploadReportFile()` uploads the file to Supabase storage (`medical-reports/`), inserts a row into `public.medical_reports`, and inserts child rows into `public.report_results`.

## 4. Existing Database & Storage Structure
- `public.medical_reports`: Primary document record (`id`, `user_id`, `title`, `report_type`, `report_date`, `file_path`, `file_name`, `file_size`, `mime_type`, `status`).
- `public.report_results`: Extracted biomarker child records (`id`, `report_id`, `test_name`, `result_value`, `result_numeric`, `unit`, `reference_range`, `reference_low`, `reference_high`, `status`, `ocr_confidence`, `user_verified`, `explanation`).
- Row-Level Security: Both tables are protected by `USING (auth.uid() = user_id)` and join cascades.

## 5. Django API Structure
- Base URL: `/api/v1/health/`
- Endpoint: `POST /api/v1/health/ocr/`
- Method: `multipart/form-data` with `file` field.

## 6. Authentication Flow
- User's active Supabase session JWT (`access_token`) is sent in the `Authorization: Bearer <token>` header.
- Django `SupabaseAuthentication` verifies token signature using `SUPABASE_JWT_SECRET`.
- Patient identity is strictly bound to `request.user.id` (`sub` claim). Client cannot spoof or override user ID.

## 7. What Will Be Replaced
- The client-side simulated template extraction in `ocrService.ts` will be replaced with live API calls to Django `POST /api/v1/health/ocr/`.
- Artificial delays and canned biomarker values will be eliminated.

## 8. What Will Remain Unchanged
- All completed modules (Dashboard, Onboarding, Cycle, Symptoms, Diet, Fitness, Medications, Care Circle, Appointments, Timeline).
- Existing Supabase PostgreSQL schema and Row-Level Security policies.
- Existing ExtraTrees ML model and TreeSHAP explainability pipeline.
- UI wizard flow (Upload → Preview → OCR → Interactive Human Verification Table → Save).

## 9. PaddleOCR Integration Plan
1. **Engine**: Self-hosted local PaddleOCR PP-OCRv4 via ONNX Runtime (`rapidocr-onnxruntime`). 100% free, offline, zero cloud API dependencies, zero per-page charges.
2. **PDF Pipeline**:
   - Inspect PDF with PyMuPDF (`pymupdf`).
   - If digital text layer is present and high-quality, extract text directly with coordinate preservation.
   - If scanned / raster PDF, render pages to high-resolution (300 DPI) images and run PaddleOCR text detection + recognition.
3. **Image Pipeline**:
   - Process PNG, JPG, JPEG, WebP directly through PaddleOCR engine.
4. **Deterministic Medical Report Parser**:
   - Match extracted text blocks against canonical reproductive and metabolic health tests:
     `LH`, `FSH`, `AMH`, `Total Testosterone`, `Free Testosterone`, `TSH`, `Vitamin D`, `Fasting Glucose`, `Fasting Insulin`, `HOMA-IR`, `HbA1c`, `Prolactin`, `DHEA-S`.
   - Parse values, units, reference ranges, and evaluate clinical bounds (`within_range`, `outside_range`, `needs_review`).
   - Attach confidence metrics and page indicators.
5. **Security & Temporary File Hygiene**:
   - Validate MIME type and file size (< 10 MB).
   - Use `tempfile.NamedTemporaryFile` with explicit `finally` cleanup to delete temporary files from memory/disk immediately after processing.
   - Strip sensitive report texts from application logs.

## 10. Testing Plan
- Automated backend unit & integration tests (`backend/apps/health/tests/test_ocr.py`):
  1. Authenticated OCR request with valid image.
  2. Authenticated OCR request with valid PDF.
  3. Digital vs Scanned PDF extraction.
  4. Unauthenticated request rejection (401 Unauthorized).
  5. Invalid file type rejection (400 Bad Request).
  6. Oversized file rejection (400 Bad Request).
  7. Empty/garbage document handling with graceful fallback.
  8. Canonical test recognition and reference range extraction.
  9. Temporary file deletion verification.
  10. Zero sensitive contents in logs.
