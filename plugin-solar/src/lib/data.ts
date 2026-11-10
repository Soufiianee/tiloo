/**
 * Single entry point for all site data. Parses every file through the zod schemas at build time,
 * so a page can never render invalid data.
 */
import statesRaw from '../../data/states.json';
import kitsRaw from '../../data/kits.json';
import pricesRaw from '../../data/electricity_prices.json';
import yieldRaw from '../../data/solar_yield.json';
import updatesRaw from '../../data/updates.json';
import affiliatesRaw from '../../config/affiliates.json';
import siteRaw from '../../config/site.json';
import { statesFile, kitsFile, pricesFile, yieldFile, updatesFile, affiliatesFile, siteFile, type State, type Kit } from './schema';
import { verdict, type CompatState, type Verdict } from './compat';

export const states = statesFile.parse(statesRaw);
export const kits = kitsFile.parse(kitsRaw);
export const prices = pricesFile.parse(pricesRaw);
export const yields = yieldFile.parse(yieldRaw);
export const updates = updatesFile.parse(updatesRaw).sort((a, b) => b.date.localeCompare(a.date));
export const affiliates = affiliatesFile.parse(affiliatesRaw);
export const site = siteFile.parse(siteRaw);

export const byCode = Object.fromEntries(states.map((s) => [s.code, s])) as Record<string, State>;
export const bySlug = Object.fromEntries(states.map((s) => [s.slug, s])) as Record<string, State>;

export const isEnacted = (s: State) => s.status === 'enacted_in_effect' || s.status === 'enacted_not_yet_effective';

export const STATUS: Record<State['status'], { label: string; short: string; cls: string; order: number }> = {
  enacted_in_effect: { label: 'Law in effect', short: 'In effect', cls: 'st-effect', order: 1 },
  enacted_not_yet_effective: { label: 'Law passed, not yet in effect', short: 'Passed', cls: 'st-passed', order: 2 },
  bill_active: { label: 'Bill active', short: 'Bill active', cls: 'st-active', order: 3 },
  bill_failed_or_dead: { label: 'Bill failed or died', short: 'Bill died', cls: 'st-dead', order: 4 },
  no_bill_found: { label: 'No bill found', short: 'No bill', cls: 'st-none', order: 5 },
  unknown: { label: 'Status not yet confirmed', short: 'Unconfirmed', cls: 'st-unknown', order: 6 },
};
export const statusLabel = (s: State) => s.status_label ?? STATUS[s.status].label;

export const mainBill = (s: State) => s.bills.find((b) => b.stage === 'signed_into_law') ?? s.bills[0] ?? null;
export const effectiveDate = (s: State): string | null => {
  const b = s.bills.find((x) => x.stage === 'signed_into_law');
  return b && /^\d{4}-\d{2}-\d{2}$/.test(b.effective_date) ? b.effective_date : null;
};

export function compatState(s: State): CompatState {
  return {
    enacted: isEnacted(s),
    cap: s.rules.max_watts_ac.value as CompatState['cap'],
    certReq: s.rules.certification_required.value,
  };
}
export const kitVerdict = (s: State, k: Kit): Verdict => verdict(compatState(s), k);

export const ul3700 = (k: Kit) => k.certifications.find((c) => c.standard === 'UL 3700');

export function retailerLink(r: Kit['retailers'][number]) {
  const a = affiliates[r.affiliate_slot];
  if (a && a.affiliate_id && a.link_template) {
    return { href: a.link_template.replace('{url}', encodeURIComponent(r.url)).replace('{raw_url}', r.url).replace('{id}', encodeURIComponent(a.affiliate_id)), rel: 'sponsored nofollow noopener', sponsored: true };
  }
  return { href: r.url, rel: 'noopener', sponsored: false };
}

export const priceFor = (code: string) => prices.states[code];
export const yieldFor = (code: string) => {
  const y = yields.states[code];
  return { ideal: y.scenarios.ideal.kwh_per_kw_year, vertical: y.scenarios.vertical.kwh_per_kw_year };
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export function fmtDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso === 'unknown' ? 'Unknown' : iso;
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}
export const lastCheckedAll = () => states.map((s) => s.last_checked).sort()[0];

/** Build date of the site, fixed per build (used for "days until" text rendered on the server). */
export const BUILD_DATE = new Date().toISOString().slice(0, 10);
export function daysBetween(fromIso: string, toIso: string) {
  return Math.round((Date.parse(toIso + 'T00:00:00Z') - Date.parse(fromIso + 'T00:00:00Z')) / 86400000);
}

export const absUrl = (path: string) => new URL(path, site.BASE_URL).toString();
