const longDateFmt = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

/** Formats a date as e.g. "January 5, 2026". Shared by the Probes pages. */
export const formatLongDate = (date: Date): string => longDateFmt.format(date);
