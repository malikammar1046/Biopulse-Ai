export type SymptomSeverity = 1 | 2 | 3 | 4 | 5;

export interface SymptomLogEntry {
  id: string;
  date: string;
  category: 'physical' | 'emotional' | 'skin' | 'energy' | 'digestive';
  symptomName: string;
  severity: SymptomSeverity;
  notes?: string;
}
