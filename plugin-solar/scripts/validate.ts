/**
 * Validates every data and config file against the zod schemas in src/lib/schema.ts,
 * plus cross-file checks. Exits non-zero on any problem, which fails `npm run build`.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { ZodTypeAny } from 'zod';
import {
  statesFile, kitsFile, pricesFile, yieldFile, updatesFile, affiliatesFile, siteFile,
} from '../src/lib/schema.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (p: string) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const errors: string[] = [];

function check(path: string, schema: ZodTypeAny) {
  const res = schema.safeParse(load(path));
  if (!res.success) for (const i of res.error.issues) errors.push(`${path} ${i.path.join('.')}: ${i.message}`);
  return res.success ? res.data : null;
}

const states = check('data/states.json', statesFile);
const kits = check('data/kits.json', kitsFile);
const prices = check('data/electricity_prices.json', pricesFile);
const yields = check('data/solar_yield.json', yieldFile);
check('data/updates.json', updatesFile);
const affiliates = check('config/affiliates.json', affiliatesFile);
check('config/site.json', siteFile);

if (states) {
  const codes = new Set<string>(states.map((s: { code: string }) => s.code));
  if (codes.size !== 51) errors.push(`states: expected 51 unique codes, got ${codes.size}`);
  const slugs = new Set(states.map((s: { slug: string }) => s.slug));
  if (slugs.size !== 51) errors.push('states: slugs must be unique');
  for (const c of codes) {
    if (prices && !(c in prices.states)) errors.push(`electricity_prices: missing ${c}`);
    if (yields && !(c in yields.states)) errors.push(`solar_yield: missing ${c}`);
  }
}
if (kits && affiliates) {
  const slugs = new Set<string>();
  for (const k of kits) {
    if (slugs.has(k.slug)) errors.push(`kits: duplicate slug ${k.slug}`);
    slugs.add(k.slug);
    for (const r of k.retailers) if (!(r.affiliate_slot in affiliates)) errors.push(`kits ${k.slug}: unknown affiliate_slot ${r.affiliate_slot}`);
  }
}

if (errors.length) {
  console.error(`Data validation FAILED (${errors.length} problem${errors.length > 1 ? 's' : ''}):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`Data valid: ${states?.length} states, ${kits?.length} kits, prices and yield for all states present.`);
