/**
 * Savings estimate. Pure functions, shared by the server-rendered pages and the browser tool.
 *
 *   yearly kWh      = panel watts / 1000 × yield (kWh per kW per year, PVWatts)
 *   yearly savings  = yearly kWh × share used at home × price (¢/kWh) / 100
 *   payback (years) = kit cost / yearly savings
 *
 * Two yield scenarios ("ideal" 20° tilt and "vertical" railing) give a range.
 * Exported power is assumed to earn nothing, which matches several state laws (e.g. Vermont).
 */
export type Yields = { ideal: number | 'unknown'; vertical: number | 'unknown' };

export interface CalcInput {
  panelWatts: number; // DC panel watts of the kit
  priceCentsPerKwh: number; // electricity price
  sharePct: number; // share of production used at home, 0-100
  kitCostUsd?: number | null; // optional
  yields: Yields;
}

export interface ScenarioResult {
  kwh: number;
  dollars: number;
  paybackYears: number | null;
}

export interface CalcResult {
  ideal: ScenarioResult | null;
  vertical: ScenarioResult | null;
  /** payback range in years [shortest, longest], or null if not computable */
  paybackRange: [number, number] | null;
  error?: string;
}

const round = (n: number, d = 0) => Math.round(n * 10 ** d) / 10 ** d;

export function scenario(panelWatts: number, yieldKwhPerKw: number, price: number, sharePct: number, cost?: number | null): ScenarioResult {
  const kwh = (panelWatts / 1000) * yieldKwhPerKw;
  const dollars = (kwh * (sharePct / 100) * price) / 100;
  const paybackYears = cost && cost > 0 && dollars > 0 ? cost / dollars : null;
  return { kwh: round(kwh), dollars: round(dollars, 2), paybackYears: paybackYears === null ? null : round(paybackYears, 1) };
}

export function estimate(i: CalcInput): CalcResult {
  if (!(i.panelWatts > 0) || i.panelWatts > 5000) return { ideal: null, vertical: null, paybackRange: null, error: 'Enter a panel size between 1 and 5,000 watts.' };
  if (!(i.priceCentsPerKwh > 0) || i.priceCentsPerKwh > 200) return { ideal: null, vertical: null, paybackRange: null, error: 'Enter an electricity price between 1 and 200 cents per kWh.' };
  if (!(i.sharePct >= 0 && i.sharePct <= 100)) return { ideal: null, vertical: null, paybackRange: null, error: 'Share used at home must be between 0 and 100%.' };
  const run = (y: number | 'unknown') => (typeof y === 'number' ? scenario(i.panelWatts, y, i.priceCentsPerKwh, i.sharePct, i.kitCostUsd) : null);
  const ideal = run(i.yields.ideal);
  const vertical = run(i.yields.vertical);
  const pb = [ideal?.paybackYears, vertical?.paybackYears].filter((x): x is number => typeof x === 'number');
  return { ideal, vertical, paybackRange: pb.length ? [Math.min(...pb), Math.max(...pb)] : null };
}

export const fmtUsd = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
export const fmtKwh = (n: number) => n.toLocaleString('en-US') + ' kWh';
