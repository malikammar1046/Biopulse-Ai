export type TimelineEventType = 'cycle' | 'symptom' | 'report' | 'lifestyle' | 'assessment';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: TimelineEventType;
  title: string;
  summary: string;
}
