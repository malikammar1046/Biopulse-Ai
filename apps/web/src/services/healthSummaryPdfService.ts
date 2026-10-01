/**
 * apps/web/src/services/healthSummaryPdfService.ts
 *
 * BioPulse AI — Personal Health Summary PDF Download Service.
 * Securely retrieves and triggers the download of the authenticated user's
 * clinical multi-page PDF health report.
 */

import { supabase } from '../lib/supabase';

const BACKEND_API_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_BACKEND_API_URL) ||
  'http://127.0.0.1:8000/api';

export const HEALTH_SUMMARY_PDF_ENDPOINT = `${BACKEND_API_URL}/v1/health/summary/pdf/`;

export interface DownloadHealthSummaryPdfResult {
  success: boolean;
  filename: string;
  sizeBytes: number;
}

/**
 * Downloads the authenticated user's Personal Health Summary PDF.
 * Uses the active Supabase JWT session to ensure strict user data scoping.
 */
export async function downloadHealthSummaryPdf(): Promise<DownloadHealthSummaryPdfResult> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error('Your session has expired. Please sign in again to download your health summary.');
  }

  const response = await fetch(HEALTH_SUMMARY_PDF_ENDPOINT, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    let errorMessage = `Failed to generate PDF summary (Status ${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson.error) {
        errorMessage = errJson.error;
      }
    } catch {
      // Non-JSON response
    }
    throw new Error(errorMessage);
  }

  const blob = await response.blob();

  // Extract filename from Content-Disposition header if available
  const todayStr = new Date().toISOString().split('T')[0];
  let filename = `BioPulse_Health_Summary_${todayStr}.pdf`;

  const disposition = response.headers.get('Content-Disposition');
  if (disposition) {
    const filenameMatch = disposition.match(/filename=["']?([^"';]+)["']?/i);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].trim();
    }
  }

  // Trigger browser download via object URL
  const blobUrl = window.URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = blobUrl;
  downloadAnchor.download = filename;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  // Clean up object URL after a brief delay
  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 1000);

  return {
    success: true,
    filename,
    sizeBytes: blob.size,
  };
}
