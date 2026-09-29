/**
 * BioPulse AI — Doctor Type Definition
 * Represents a medical professional profile retrieved from Django REST API.
 */
export interface Doctor {
  id: number;
  name: string;
  slug: string;
  profile_image: string | null;
  specialty: string | null;
  short_bio: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  fee?: string | null;
  qualifications?: string | null;
  experience_years?: number | null;
  rating?: number | null;
  reviews_count?: number | null;
  wait_time?: string | null;
  services_offered?: string | null;
  pathway?: 'female_pcos' | 'male_hypogonadism' | 'both';
  relevance_reason?: string | null;
  is_active: boolean;
  display_order: number;
}

export interface DoctorsApiResponse {
  doctors: Doctor[];
  count?: number;
}
