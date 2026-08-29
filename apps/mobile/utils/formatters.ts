/**
 * OVASense Date and string utility formatters.
 */

export function formatDateToISO(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function formatReadableDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}
