/**
 * Small, pure formatting helpers shared by the UI and the calculation layer.
 * Kept dependency-free so they can run under Node for tests.
 */

/** Round to the nearest integer, guarding against NaN. */
export function roundInt(n: number): number {
  return Number.isFinite(n) ? Math.round(n) : 0;
}

/** Round to a fixed number of decimals and return a number. */
export function roundTo(n: number, decimals: number): number {
  if (!Number.isFinite(n)) return 0;
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

/** Format a kilogram value with one decimal, e.g. 97.4. */
export function formatKg(kg: number): string {
  return `${roundTo(kg, 1).toFixed(1)} kg`;
}

/** Format an integer gram value, e.g. "196 g". */
export function formatGrams(g: number): string {
  return `${roundInt(g)} g`;
}

/** Format kilocalories with a thousands separator, e.g. "2,277 kcal". */
export function formatKcal(kcal: number): string {
  return `${roundInt(kcal).toLocaleString('en-US')} kcal`;
}

/** Convert kilograms to pounds for imperial display. */
export function kgToLb(kg: number): number {
  return kg * 2.2046226218;
}

/** Convert centimetres to a feet/inches label, e.g. `5 ft 5 in`. */
export function cmToFtIn(cm: number): string {
  const totalInches = cm / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inch = Math.round(totalInches - ft * 12);
  return `${ft} ft ${inch} in`;
}

/** Clamp a number into an inclusive range. */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

type Units = 'metric' | 'imperial';

/**
 * Format a weight stored in kilograms for the chosen unit system. Works for
 * both absolute weights and deltas (the kg->lb conversion is linear).
 */
export function formatWeight(kg: number, units: Units): string {
  return units === 'imperial'
    ? `${roundTo(kgToLb(kg), 1).toFixed(1)} lb`
    : `${roundTo(kg, 1).toFixed(1)} kg`;
}

/** Numeric-only weight (no unit suffix), for compact chart axis labels. */
export function formatWeightValue(kg: number, units: Units): string {
  return String(Math.round(units === 'imperial' ? kgToLb(kg) : kg));
}

/** Format a height stored in centimetres for the chosen unit system. */
export function formatHeight(cm: number, units: Units): string {
  return units === 'imperial' ? cmToFtIn(cm) : `${Math.round(cm)} cm`;
}
