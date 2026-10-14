const GYM_TIMEZONE = "America/Mexico_City";

/**
 * "Today" as YYYY-MM-DD in the gym's local timezone, regardless of the
 * server's timezone (Vercel functions run in UTC, which can be a day ahead
 * late in the evening).
 */
export function todayLocal(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: GYM_TIMEZONE }).format(new Date());
}

/** Suma (o resta) días a una fecha YYYY-MM-DD. */
export function addDays(date: string, days: number): string {
  const [y, m, day] = date.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, day + days));
  return d.toISOString().slice(0, 10);
}
