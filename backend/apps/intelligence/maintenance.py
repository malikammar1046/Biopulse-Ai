"""
backend/apps/intelligence/maintenance.py
Controlled maintenance mode enforcement for screening assessments.

When BIOPULSE_ASSESSMENT_MAINTENANCE is active:
- Assessment-generating and assessment-replacing endpoints return HTTP 503
- Auto-reassessment on active assessment retrieval is suppressed
- Historical reads and non-assessment operations remain fully available
"""

import os
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response

ASSESSMENT_MAINTENANCE_PAYLOAD = {
    "code": "assessment_maintenance",
    "detail": "Screening assessment updates are temporarily unavailable.",
}


def is_assessment_maintenance_active() -> bool:
    """
    Returns True if assessment maintenance mode is currently enabled
    via Django settings or environment variable.
    """
    if getattr(settings, "BIOPULSE_ASSESSMENT_MAINTENANCE", False):
        return True
    return os.environ.get("BIOPULSE_ASSESSMENT_MAINTENANCE", "false").lower() in ("true", "1", "yes")


def assessment_maintenance_response() -> Response:
    """
    Returns the approved HTTP 503 Service Unavailable maintenance response.
    """
    return Response(
        ASSESSMENT_MAINTENANCE_PAYLOAD,
        status=status.HTTP_503_SERVICE_UNAVAILABLE,
    )
