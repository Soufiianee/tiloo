/**
 * Staleness report.
 *  - every state, kit, price and yield record whose last_checked is older than 7 days
 *  - every state with an effective date or key date (vote, deadline) in the next 60 days
 *  - every state whose status is still "unknown" or whose verification is not "primary" (weekly retry list)
 *
 * Usage: npm run staleness            (today)
 *        npm run staleness -- 2026-12-01   (as of a given date)
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (f: string) => JSON.parse(readFileSync(join(root, f), 'utf8'));
const arg = process.argv.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
const today = arg ?? new Date().toISOString().slice(0, 10);
const day = (iso: string) => Date.parse(iso + 'T00:00:00Z') / 86400000;
const age = (iso: string) => day(today) - day(iso);

const states = load('data/states.json');
const kits = load('data/kits.json');
const prices = load('data/electricity_prices.json');
const yields = load('data/solar_yield.json');

console.log(`Staleness report as of ${today}\n`);

const stale = [
  ...states.filter((s: any) => age(s.last_checked) > 7).map((s: any) => `state ${s.code} (${s.name}): last checked ${s.last_checked}`),
  ...kits.filter((k: any) => age(k.last_checked) > 7).map((k: any) => `kit ${k.slug}: last checked ${k.last_checked}`),
  ...kits.filter((k: any) => k.price_checked_on && age(k.price_checked_on) > 7).map((k: any) => `kit ${k.slug}: price checked ${k.price_checked_on}`),
  ...(age(prices.last_checked) > 7 ? [`electricity_prices: last checked ${prices.last_checked} (period ${prices.period})`] : []),
  ...(age(yields.last_checked) > 7 ? [`solar_yield: last checked ${yields.last_checked}`] : []),
];
console.log(`## Older than 7 days (${stale.length})`);
stale.forEach((x) => console.log('  - ' + x));

const soon: string[] = [];
for (const s of states) {
  const dates = new Set<string>();
  for (const b of s.bills) if (/^\d{4}-\d{2}-\d{2}$/.test(b.effective_date)) dates.add(`effective ${b.effective_date}`);
  if (s.next_key_date && !dates.has(`effective ${s.next_key_date}`)) dates.add(`key date ${s.next_key_date}`);
  for (const d of dates) {
    const iso = d.split(' ').pop()!;
    const delta = day(iso) - day(today);
    if (delta >= 0 && delta <= 60) soon.push(`${s.code} (${s.name}): ${d} (in ${delta} days) - ${s.watch_notes}`);
  }
}
console.log(`\n## Effective dates or key dates in the next 60 days (${soon.length})`);
soon.forEach((x) => console.log('  - ' + x));

const retry = states.filter((s: any) => s.status === 'unknown' || s.verification !== 'primary');
console.log(`\n## Not fully verified - retry weekly (${retry.length})`);
retry.forEach((s: any) => console.log(`  - ${s.code} (${s.name}): status ${s.status}, verification ${s.verification}`));

const missingYield = Object.entries<any>(yields.states).filter(([, r]) => r.scenarios.ideal.kwh_per_kw_year === 'unknown' || r.scenarios.vertical.kwh_per_kw_year === 'unknown').map(([c]) => c);
console.log(`\n## Solar yield values still unknown: ${missingYield.length} states${missingYield.length ? ' (run: NREL_API_KEY=... npm run yield)' : ''}`);
