/**
 * Fills data/solar_yield.json with NREL (NLR) PVWatts v8 results for every state capital,
 * in two scenarios: "ideal" (20° tilt, south) and "vertical" (90°, south, e.g. a balcony railing).
 *
 * Usage:  NREL_API_KEY=xxxx npm run yield            (only fills values still "unknown")
 *         NREL_API_KEY=xxxx npm run yield -- --all   (re-runs everything)
 * The key is sent as an X-Api-Key header and never written to disk.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'data/solar_yield.json');
const API = 'https://developer.nlr.gov/api/pvwatts/v8.json';
const key = process.env.NREL_API_KEY;
const all = process.argv.includes('--all');
const today = new Date().toISOString().slice(0, 10);

if (!key) {
  console.error('NREL_API_KEY is not set. Get a free key at https://developer.nlr.gov/signup/');
  process.exit(1);
}

const data = JSON.parse(readFileSync(file, 'utf8'));
const defs = data.scenario_definitions as Record<string, { tilt_deg: number; azimuth_deg: number; label: string }>;
const c = data.common;
let changed = 0;

for (const [code, rec] of Object.entries<any>(data.states)) {
  for (const [name, def] of Object.entries(defs)) {
    const sc = rec.scenarios[name];
    if (!all && sc.kwh_per_kw_year !== 'unknown') continue;
    const q = new URLSearchParams({
      lat: String(rec.lat), lon: String(rec.lon), system_capacity: String(c.system_capacity_kw_dc),
      azimuth: String(def.azimuth_deg), tilt: String(def.tilt_deg), array_type: '0', module_type: '0', losses: String(c.losses_pct),
    });
    const res = await fetch(`${API}?${q}`, { headers: { 'X-Api-Key': key } });
    const body: any = await res.json().catch(() => ({}));
    if (!res.ok || body.errors?.length || !body.outputs) {
      console.error(`${code}/${name}: failed (${res.status}) ${JSON.stringify(body.errors ?? body.error ?? '')}`);
      if (res.status === 403 || res.status === 429) process.exit(2);
      continue;
    }
    sc.kwh_per_kw_year = Math.round(body.outputs.ac_annual);
    sc.source = {
      title: `NREL/NLR PVWatts v8: ${rec.location}, ${def.label}`,
      url: 'https://developer.nlr.gov/docs/solar/pvwatts/v8/',
      accessed: today,
      type: 'government_data',
      note: `API query: ${q}. Solar resource file ${body.station_info?.solar_resource_file ?? 'n/a'}; API key omitted from URL.`,
    };
    changed++;
    console.log(`${code}/${name}: ${sc.kwh_per_kw_year} kWh per kW per year`);
  }
}
data.last_checked = today;
writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
console.log(`Updated ${changed} values.`);
