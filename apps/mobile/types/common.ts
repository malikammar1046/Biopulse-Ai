/**
 * Common shared mobile TypeScript types and utility interfaces.
 */

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export interface Identifiable {
  id: string;
}

export interface Timestamped {
  createdAt: string;
  updatedAt?: string;
}
