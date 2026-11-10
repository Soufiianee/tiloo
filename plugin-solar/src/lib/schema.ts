/**
 * Data contracts for every file in /data and /config.
 * `npm run validate` (and therefore `npm run build`) fails if any record breaks these rules.
 *
 * House rules encoded here:
 *  - every record carries sources[] and last_checked (ISO date)
 *  - unverifiable facts are the literal string "unknown" (never a guess)
 *  - every rule value carries its own rule_sources[]
 */
import { z } from 'zod';

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be an ISO date (YYYY-MM-DD)');
const UNKNOWN = z.literal('unknown');

export const sourceType = z.enum([
  'legislature_bill_page', // official legislature bill status / history page
  'enrolled_text', // enrolled bill, chaptered law, public act, session law
  'governor_record', // governor signing record
  'utility_commission', // state PUC / commission page
  'legislature_data', // official bulk data published by a legislature
  'legislature_other', // other official legislature publication (digest, calendar, homepage notice)
  'government_data', // federal or state statistical source (EIA, NREL/NLR)
  'certifier_directory', // certifier's public directory entry
  'manufacturer_certificate', // certificate document published by the manufacturer
  'manufacturer_page', // manufacturer's product or spec page (specs and claims only)
  'secondary_mirror', // non-official copy of an official document (flagged; never sole basis of a fact)
  'secondary_lead', // tracker or news used only to find leads
]);

export const source = z.object({
  title: z.string().min(3),
  url: z.string().url(),
  accessed: isoDate,
  type: sourceType,
  note: z.string().optional(),
});
export type Source = z.infer<typeof source>;

const ruleBase = { detail: z.string().min(3), rule_sources: z.array(source) };

/** A rule whose value is one of a fixed set of words. */
const enumRule = <T extends [string, ...string[]]>(values: T) =>
  z.object({ value: z.enum(values), ...ruleBase });

const NA = 'not_applicable' as const; // no enacted state law, so the rule does not exist

export const wattRule = z.object({
  value: z.union([z.number().int().positive(), UNKNOWN, z.literal('not_specified'), z.literal(NA)]),
  ...ruleBase,
});

export const rules = z.object({
  max_watts_ac: wattRule,
  max_watts_dc: wattRule,
  battery_allowed: enumRule(['yes', 'no', 'not_addressed', 'unknown', NA]),
  utility_notification_required: enumRule(['yes', 'no', 'utility_may_require', 'conditional', 'unknown', NA]),
  utility_approval_required: enumRule(['yes', 'no', 'unknown', NA]),
  landlord_provisions: enumRule(['protects_tenants', 'notice_rules_only', 'not_addressed', 'unknown', NA]),
  hoa_provisions: enumRule(['protects_owners', 'covenants_preserved', 'not_addressed', 'unknown', NA]),
  certification_required: z.object({
    value: z.enum([
      'ul_3700_or_equivalent', // law names UL 3700 (or a comparable NRTL standard)
      'plug_in_system_certification', // law requires certification "as a plug-in PV system" without naming UL 3700
      'nrtl_certified_generic', // law says "certified by UL or an equivalent NRTL" without naming a standard
      'nrtl_and_ul_1741', // generic NRTL certification plus UL 1741 named
      'unknown',
      NA,
    ]),
    ...ruleBase,
  }),
  net_metering_excluded: enumRule(['yes', 'no', 'not_addressed', 'unknown', NA]),
});

export const billStage = z.enum([
  'signed_into_law',
  'passed_legislature_not_sent_to_governor',
  'in_conference_committee',
  'passed_committee',
  'passed_one_chamber',
  'in_committee',
  'died_in_committee',
  'died_on_adjournment',
  'enacted_without_plug_in_provisions',
  'unknown',
]);

export const bill = z.object({
  id: z.string().min(2),
  session: z.string().min(4),
  title: z.string().min(3),
  url: z.string().url(),
  stage: billStage,
  last_action: z.string().min(3),
  last_action_date: z.union([isoDate, UNKNOWN]),
  signed_date: z.union([isoDate, UNKNOWN, z.literal(NA)]),
  effective_date: z.union([isoDate, UNKNOWN, z.literal(NA)]),
  /** how the effective date was obtained: printed in the law, or derived from its clause / a constitutional default */
  effective_date_basis: z.enum(['stated_in_law', 'derived', NA, 'unknown']),
  effective_date_note: z.string().optional(),
  chapter: z.string().optional(),
  /** for dead bills: the official end of the session in which the bill died */
  session_end: z
    .object({ date: z.union([isoDate, UNKNOWN]), detail: z.string(), source: z.union([source, z.null()]) })
    .optional(),
});

export const stateStatus = z.enum([
  'enacted_in_effect',
  'enacted_not_yet_effective',
  'bill_active',
  'bill_failed_or_dead',
  'no_bill_found',
  'unknown',
]);

export const verification = z.enum([
  'primary', // every published fact traced to a primary source
  'partial', // some facts primary, others unknown
  'secondary_only', // primary site unreachable; facts held back or flagged
  'not_checked_on_primary', // status based on our search outcome only (see notes)
]);

export const state = z
  .object({
    code: z.string().regex(/^[A-Z]{2}$/),
    name: z.string().min(4),
    slug: z.string().regex(/^[a-z-]+$/),
    status: stateStatus,
    /** optional human label that overrides the default status wording (e.g. NH) */
    status_label: z.string().optional(),
    verification,
    bills: z.array(bill),
    rules,
    summary_plain: z.string().min(40),
    watch_notes: z.string().min(10),
    notes: z.string().optional(),
    next_key_date: z.union([isoDate, z.null()]),
    sources: z.array(source).min(1),
    last_checked: isoDate,
  })
  .superRefine((s, ctx) => {
    const enacted = s.status.startsWith('enacted');
    if (enacted && !s.bills.some((b) => b.stage === 'signed_into_law'))
      ctx.addIssue({ code: 'custom', message: `${s.code}: enacted status needs a signed bill` });
    if (!enacted) {
      for (const [k, r] of Object.entries(s.rules))
        if ((r as { value: unknown }).value !== NA && (r as { value: unknown }).value !== 'unknown')
          ctx.addIssue({ code: 'custom', message: `${s.code}: rule ${k} must be not_applicable/unknown without an enacted law` });
    }
    if (enacted) {
      for (const [k, r] of Object.entries(s.rules)) {
        const rr = r as { value: unknown; rule_sources: unknown[] };
        if (rr.value !== 'unknown' && rr.rule_sources.length === 0)
          ctx.addIssue({ code: 'custom', message: `${s.code}: rule ${k} has a value but no rule_sources` });
      }
    }
    if (s.status === 'no_bill_found' && s.bills.length > 0)
      ctx.addIssue({ code: 'custom', message: `${s.code}: no_bill_found but bills listed` });
  });
export type State = z.infer<typeof state>;
export const statesFile = z.array(state).length(51);

// ---------- kits ----------
export const certStatus = z.enum(['certified', 'pending_or_claimed', 'not_certified', 'unknown']);
export const certification = z.object({
  standard: z.enum(['UL 3700', 'UL 1741', 'UL 1741 SB', 'IEEE 1547']),
  status: certStatus,
  scope: z.enum(['complete_system', 'component', 'unknown']),
  certifier: z.union([z.string().min(2), UNKNOWN]),
  evidence_url: z.union([z.string().url(), UNKNOWN]),
  evidence_type: z.union([sourceType, UNKNOWN]),
  conditions: z.string().optional(),
  checked_on: isoDate,
});

export const kit = z
  .object({
    brand: z.string().min(2),
    model: z.string().min(2),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    product_type: z.enum(['complete_kit', 'inverter_only', 'inverter_with_battery']),
    ac_output_w: z.union([z.number().int().positive(), UNKNOWN]),
    ac_output_basis: z.enum(['manufacturer_stated', 'estimated', 'unknown']),
    panel_w_total: z.union([z.number().int().nonnegative(), UNKNOWN, z.literal('not_included')]),
    inverter: z.string().min(2),
    battery_included: z.union([z.boolean(), UNKNOWN]),
    plug_type: z.union([z.string().min(2), UNKNOWN]),
    certifications: z.array(certification).min(1),
    price_usd: z.union([z.number().positive(), UNKNOWN]),
    price_checked_on: z.union([isoDate, z.null()]),
    retailers: z.array(z.object({ name: z.string(), url: z.string().url(), affiliate_slot: z.string() })),
    notes: z.string().optional(),
    sources: z.array(source).min(1),
    last_checked: isoDate,
  })
  .superRefine((k, ctx) => {
    if (typeof k.price_usd === 'number' && !k.price_checked_on)
      ctx.addIssue({ code: 'custom', message: `${k.slug}: price needs price_checked_on` });
    for (const c of k.certifications)
      if (c.status === 'certified' && !['certifier_directory', 'manufacturer_certificate'].includes(String(c.evidence_type)))
        ctx.addIssue({ code: 'custom', message: `${k.slug}: "certified" needs a directory entry or certificate document` });
  });
export type Kit = z.infer<typeof kit>;
export const kitsFile = z.array(kit).min(1);

// ---------- electricity prices ----------
export const pricesFile = z.object({
  dataset: z.string(),
  period: z.string(),
  period_start: z.string().regex(/^\d{4}-\d{2}$/),
  period_end: z.string().regex(/^\d{4}-\d{2}$/),
  method: z.string(),
  unit: z.literal('cents_per_kwh'),
  source: source,
  states: z.record(z.string().regex(/^[A-Z]{2}$/), z.union([z.number().positive(), UNKNOWN])),
  last_checked: isoDate,
});

// ---------- solar yield ----------
export const yieldScenario = z.object({
  kwh_per_kw_year: z.union([z.number().positive(), UNKNOWN]),
  source: z.union([source, z.null()]),
});
export const yieldRecord = z.object({
  location: z.string(),
  lat: z.number(),
  lon: z.number(),
  scenarios: z.object({ ideal: yieldScenario, vertical: yieldScenario }),
});
export const yieldFile = z.object({
  model: z.string(),
  scenario_definitions: z.object({
    ideal: z.object({ label: z.string(), tilt_deg: z.number(), azimuth_deg: z.number() }),
    vertical: z.object({ label: z.string(), tilt_deg: z.number(), azimuth_deg: z.number() }),
  }),
  common: z.object({ system_capacity_kw_dc: z.number(), array_type: z.string(), module_type: z.string(), losses_pct: z.number() }),
  fallback_note: z.string(),
  states: z.record(z.string().regex(/^[A-Z]{2}$/), yieldRecord),
  last_checked: isoDate,
});

// ---------- updates / changelog ----------
export const update = z.object({
  date: isoDate,
  state: z.union([z.string().regex(/^[A-Z]{2}$/), z.null()]),
  kind: z.enum(['law_signed', 'law_effective', 'bill_progress', 'bill_died', 'data_correction', 'kit_update', 'site']),
  title: z.string().min(5),
  body: z.string().min(10),
  source: source,
});
export const updatesFile = z.array(update);

// ---------- config ----------
export const affiliatesFile = z.record(
  z.string(),
  z.object({
    label: z.string(),
    program: z.string(),
    affiliate_id: z.string(),
    /** e.g. "{raw_url}?ref={id}"; links stay plain until BOTH affiliate_id and link_template are set */
    link_template: z.string(),
    notes: z.string().optional(),
  }),
);
export const siteFile = z.object({
  SITE_NAME: z.string(),
  BASE_URL: z.string().url(),
  CONTACT_EMAIL: z.string(),
  EMAIL_SIGNUP_EMBED_URL: z.string(),
  CERT_WATCH_SIGNUP_EMBED_URL: z.string(),
  ANALYTICS: z.object({ provider: z.string(), key: z.string() }),
});
