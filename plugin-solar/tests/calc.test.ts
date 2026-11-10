import { describe, it, expect } from 'vitest';
import { scenario, estimate } from '../src/lib/calc';

// Expected numbers below were worked out by hand:
//   kWh = W/1000 × yield;  $ = kWh × share × ¢/100;  payback = cost / $
describe('savings calculator (hand-checked cases)', () => {
  it('1. 800 W, Utah ideal yield 1493, 13.26¢, 100%, $1,099', () => {
    // 0.8 × 1493 = 1194.4 kWh → 1194.4 × 0.1326 = $158.38 → 1099 / 158.38 = 6.94 → 6.9 yrs
    const r = scenario(800, 1493, 13.26, 100, 1099);
    expect(r.kwh).toBe(1194);
    expect(r.dollars).toBe(158.38);
    expect(r.paybackYears).toBe(6.9);
  });
  it('2. 400 W, yield 1627, 32.34¢, 100%, $369', () => {
    // 0.4 × 1627 = 650.8 kWh → × 0.3234 = $210.47 → 369 / 210.47 = 1.75 → 1.8 yrs
    const r = scenario(400, 1627, 32.34, 100, 369);
    expect(r.kwh).toBe(651);
    expect(r.dollars).toBe(210.47);
    expect(r.paybackYears).toBe(1.8);
  });
  it('3. share used at home scales savings: 1000 W, 1200, 20¢, 50%', () => {
    // 1 × 1200 = 1200 kWh → × 0.5 × 0.20 = $120.00; no cost → no payback
    const r = scenario(1000, 1200, 20, 50, null);
    expect(r.kwh).toBe(1200);
    expect(r.dollars).toBe(120);
    expect(r.paybackYears).toBeNull();
  });
  it('4. two scenarios give a payback range: 360 W, ideal 1263 / vertical 900, 27.47¢, $432', () => {
    // ideal: 0.36×1263 = 454.68 kWh → $124.90 → 432/124.90 = 3.46 → 3.5
    // vertical: 0.36×900 = 324 kWh → $89.00 (89.0028) → 432/89.00 = 4.85 → 4.9
    const r = estimate({ panelWatts: 360, priceCentsPerKwh: 27.47, sharePct: 100, kitCostUsd: 432, yields: { ideal: 1263, vertical: 900 } });
    expect(r.ideal?.dollars).toBe(124.9);
    expect(r.vertical?.dollars).toBe(89);
    expect(r.paybackRange).toEqual([3.5, 4.9]);
  });
  it('5. unknown yield gives no number for that scenario (never a guess)', () => {
    const r = estimate({ panelWatts: 800, priceCentsPerKwh: 15, sharePct: 100, kitCostUsd: 1000, yields: { ideal: 1500, vertical: 'unknown' } });
    // ideal: 0.8×1500 = 1200 kWh → $180 → 1000/180 = 5.56 → 5.6
    expect(r.vertical).toBeNull();
    expect(r.ideal?.dollars).toBe(180);
    expect(r.paybackRange).toEqual([5.6, 5.6]);
  });
  it('6. rejects nonsense input', () => {
    expect(estimate({ panelWatts: 0, priceCentsPerKwh: 15, sharePct: 100, yields: { ideal: 1500, vertical: 1000 } }).error).toBeTruthy();
    expect(estimate({ panelWatts: 800, priceCentsPerKwh: 15, sharePct: 120, yields: { ideal: 1500, vertical: 1000 } }).error).toBeTruthy();
  });
});
