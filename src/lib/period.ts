/** Shared time-range filter used by class analytics. */

export type PeriodId = "7d" | "30d" | "semester" | "all";

export const periodOptions: Array<{ id: PeriodId; label: string; days: number | null }> = [
  { id: "7d", label: "Mingguan (7 hari)", days: 7 },
  { id: "30d", label: "Bulanan (30 hari)", days: 30 },
  { id: "semester", label: "Paruh semester (90 hari)", days: 90 },
  { id: "all", label: "Semua waktu", days: null },
];

export const periodLabel = (id: PeriodId) =>
  periodOptions.find((p) => p.id === id)?.label ?? "Semua waktu";

/** Inclusive lower bound (YYYY-MM-DD) for a period, or null when unbounded. */
export function periodStart(id: PeriodId, now = new Date()): string | null {
  const days = periodOptions.find((p) => p.id === id)?.days ?? null;
  if (days === null) return null;
  const d = new Date(now);
  d.setDate(d.getDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

/** Keeps only items whose date field falls inside the period. */
export function filterByPeriod<T>(items: T[], id: PeriodId, getDate: (item: T) => string): T[] {
  const from = periodStart(id);
  if (!from) return items;
  return items.filter((item) => getDate(item).slice(0, 10) >= from);
}
