/**
 * Returns a Date object representing the beginning (00:00:00.000) of the current day.
 * Used for comparing loan due dates to determine if they are overdue.
 */
export function getStartOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}
