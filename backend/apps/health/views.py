"""
OvaSense — Health & Medical Report OCR Views.

Endpoints:
  POST /api/v1/health/ocr/  — Authenticated medical document OCR & structured parser endpoint
"""

from __future__ import annotations

import logging
import os
import tempfile
from pathlib import Path

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.supabase_auth import SupabaseAuthentication
from apps.health.serializers import OcrResponseSerializer
from apps.health.services.medical_report_parser import medical_report_parser
from apps.health.services.paddle_ocr_engine import paddle_ocr_engine

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

NON_DIAGNOSTIC_OCR_DISCLAIMER = (
    "OvaSense OCR text extraction identifies recorded biomarker numbers for informational "
    "and consultation preparation purposes only. It does not constitute a medical diagnosis. "
    "Please verify extracted values against your original physical report."
)


class MedicalReportOcrView(APIView):
    """
    POST /api/v1/health/ocr/

    Authenticates user via Supabase JWT, validates file size/type, processes
    document using local PaddleOCR & PyMuPDF, and extracts structured laboratory tests.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        patient_uuid = str(request.user.id)
        uploaded_file = request.FILES.get("file")

        if not uploaded_file:
            return Response(
                {"error": "No document file was provided in the request."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        filename = uploaded_file.name or "report.pdf"
        file_ext = Path(filename).suffix.lower()

        if file_ext not in ALLOWED_EXTENSIONS:
            return Response(
                {
                    "error": (
                        f"Unsupported file format '{file_ext}'. Supported formats: PDF, PNG, JPG, JPEG, WebP."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if uploaded_file.size > MAX_FILE_SIZE_BYTES:
            return Response(
                {"error": "File size exceeds the 10 MB maximum limit."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        logger.info(
            "Processing OCR document for patient %s (format: %s, size: %d bytes)",
            patient_uuid[:8] + "***",
            file_ext,
            uploaded_file.size,
        )

        temp_path = None
        try:
            # Read file bytes into memory / temp file securely
            file_bytes = uploaded_file.read()

            # Execute real PaddleOCR extraction
            doc_result = paddle_ocr_engine.process_document(file_bytes, filename=filename)

            # Parse extracted text blocks with clinical parser
            extraction_method = "selectable_text" if doc_result.has_selectable_text else "paddleocr"
            parsed_results = medical_report_parser.parse_blocks(
                doc_result.text_blocks,
                default_method=extraction_method,
            )

            # Generate sanitized raw snippet for transparency (first 300 chars only, no PII)
            raw_snippet = doc_result.raw_text[:300].strip()
            if len(doc_result.raw_text) > 300:
                raw_snippet += "..."

            requires_overall_review = (
                doc_result.avg_confidence < 0.85
                or any(r.requires_review for r in parsed_results)
                or len(parsed_results) == 0
            )

            response_data = {
                "success": True,
                "document": {
                    "filename": filename,
                    "total_pages": doc_result.total_pages,
                    "has_selectable_text": doc_result.has_selectable_text,
                    "avg_confidence": doc_result.avg_confidence,
                    "engine": doc_result.engine_name,
                },
                "results": [r.to_dict() for r in parsed_results],
                "raw_text_snippet": raw_snippet,
                "requires_review": requires_overall_review,
                "disclaimer": NON_DIAGNOSTIC_OCR_DISCLAIMER,
            }

            serializer = OcrResponseSerializer(data=response_data)
            if serializer.is_valid():
                logger.info(
                    "OCR successfully extracted %d structured tests for patient %s",
                    len(parsed_results),
                    patient_uuid[:8] + "***",
                )
                return Response(serializer.validated_data, status=status.HTTP_200_OK)
            else:
                logger.error("OCR serialization error: %s", serializer.errors)
                return Response(
                    {"error": "OCR response serialization failed.", "details": serializer.errors},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        except Exception as exc:
            # Log technical error without logging sensitive document content
            logger.error("OCR processing pipeline failed: %s", type(exc).__name__, exc_info=True)
            return Response(
                {"error": "Document OCR text extraction encountered an internal processing error."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        finally:
            # Ensure temporary resources are cleaned up
            if temp_path and os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass
