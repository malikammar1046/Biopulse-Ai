export interface ContactSubmissionPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  reason?: 'General' | 'Research' | 'Partnership' | 'Feedback' | string;
}

export interface ContactSubmissionResponse {
  success: boolean;
  message: string;
  referenceId?: string;
}

/**
 * Service boundary for submitting contact inquiries.
 * Designed to easily switch from simulated local dispatch to Django API endpoint:
 * e.g., POST /api/v1/contact/inquiry/
 */
export async function submitContactInquiry(
  payload: ContactSubmissionPayload
): Promise<ContactSubmissionResponse> {
  // Simulate network latency (800ms) for realistic UX transition
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Future Django integration:
  // const response = await fetch('/api/v1/contact/inquiry/', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(payload),
  // });
  // return await response.json();

  if (!payload.name || !payload.email || !payload.subject || !payload.message) {
    throw new Error('All required fields must be populated before dispatching inquiry.');
  }

  return {
    success: true,
    message: 'Message received. Thank you for reaching out to BioPulse AI.',
    referenceId: `BP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
  };
}
