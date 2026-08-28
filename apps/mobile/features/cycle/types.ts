export type FlowIntensity = 'spotting' | 'light' | 'medium' | 'heavy';

export interface CycleLogEntry {
  id: string;
  date: string;
  flow?: FlowIntensity;
  basalBodyTemp?: number;
  cervicalMucus?: string;
  notes?: string;
}
