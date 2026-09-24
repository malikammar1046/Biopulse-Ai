/**
 * BioPulse AI — Doctor API Service & Hook.
 * Fetches dynamic medical professional profiles from Django REST API.
 */
import { useState, useEffect, useCallback } from 'react';
import type { Doctor } from '../types/doctor';

const BACKEND_API_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_BACKEND_API_URL) ||
  'http://127.0.0.1:8000/api';

export const DOCTORS_ENDPOINT = `${BACKEND_API_URL}/v1/doctors/`;

/**
 * Public API client to fetch active doctors ordered by display_order.
 */
export async function getDoctors(): Promise<Doctor[]> {
  try {
    const res = await fetch(DOCTORS_ENDPOINT, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch doctors (HTTP ${res.status})`);
    }

    const data = await res.json();

    // DRF may return array directly (unpaginated) or { results: Doctor[] } (paginated)
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.results)) {
      return data.results;
    }

    return [];
  } catch (err: any) {
    console.warn('BioPulse Doctor API request error:', err);
    throw new Error('Unable to connect to the medical directory service.');
  }
}

export interface UseDoctorsResult {
  doctors: Doctor[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * React hook for consuming dynamic doctors data with loading, empty, and error states.
 */
export function useDoctors(): UseDoctorsResult {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDoctors();
      setDoctors(data);
    } catch (err: any) {
      setError('Unable to load doctors at this moment. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  return { doctors, loading, error, refetch: loadDoctors };
}
