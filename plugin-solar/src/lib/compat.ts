/**
 * Kit × state compatibility. Conservative by design:
 *  - only a certificate for the COMPLETE system can make a kit "compatible";
 *  - a component-only certificate is "check with seller", never "compatible";
 *  - a manufacturer claim without a certificate is "unverified claim".
 */
export type CertReq =
  | 'ul_3700_or_equivalent' | 'plug_in_system_certification' | 'nrtl_certified_generic' | 'nrtl_and_ul_1741'
  | 'unknown' | 'not_applicable';

export interface CompatState {
  enacted: boolean;
  cap: number | 'unknown' | 'not_specified' | 'not_applicable';
  certReq: CertReq;
}
export interface CompatCert { standard: string; status: string; scope: string }
export interface CompatKit { ac_output_w: number | 'unknown'; certifications: CompatCert[] }

export type Verdict =
  | 'compatible' // fits the cap and has complete-system certification evidence
  | 'check_with_seller' // fits the cap, only a component certificate exists
  | 'unverified_claim' // fits the cap, only a manufacturer claim
  | 'no_evidence' // fits the cap, no certification evidence at all
  | 'over_cap'
  | 'output_unknown'
  | 'rules_unknown' // state law exists but rules not verified (e.g. NH)
  | 'no_state_law';

export const verdictLabel: Record<Verdict, string> = {
  compatible: 'Compatible',
  check_with_seller: 'Check with seller',
  unverified_claim: 'Certification claimed, not verified',
  no_evidence: 'No certification evidence found',
  over_cap: 'Over this state’s size limit',
  output_unknown: 'Output not stated by seller',
  rules_unknown: 'State rules not yet verified',
  no_state_law: 'No state plug-in law',
};

/** Which certificate counts for this state's rule. */
function relevant(c: CompatCert, req: CertReq): boolean {
  if (req === 'ul_3700_or_equivalent' || req === 'plug_in_system_certification') return c.standard === 'UL 3700';
  return true; // generic NRTL rules: any listed safety standard is relevant
}

export function verdict(state: CompatState, kit: CompatKit): Verdict {
  if (!state.enacted) return 'no_state_law';
  if (state.cap === 'unknown' || state.certReq === 'unknown') return 'rules_unknown';
  if (kit.ac_output_w === 'unknown') return 'output_unknown';
  if (typeof state.cap === 'number' && kit.ac_output_w > state.cap) return 'over_cap';
  const certs = kit.certifications.filter((c) => relevant(c, state.certReq));
  if (certs.some((c) => c.status === 'certified' && c.scope === 'complete_system')) return 'compatible';
  if (certs.some((c) => c.status === 'certified')) return 'check_with_seller';
  if (certs.some((c) => c.status === 'pending_or_claimed')) return 'unverified_claim';
  return 'no_evidence';
}

/** True when the state's law demands UL 3700 or whole-system certification. */
export const needsSystemCert = (req: CertReq) => req === 'ul_3700_or_equivalent' || req === 'plug_in_system_certification';
