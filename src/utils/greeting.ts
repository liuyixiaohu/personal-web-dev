// ============================================
// Time Period Utility
// Pure function to determine greeting period
// ============================================

export type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'lateNight';

export function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 0 && hour < 4) return 'lateNight';
  if (hour >= 4 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 18) return 'afternoon';
  return 'evening';
}
