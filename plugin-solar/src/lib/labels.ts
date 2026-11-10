/** Plain-English wording for rule keys and values. */
export const RULE_NAMES: Record<string, string> = {
  max_watts_ac: 'Maximum size (output)',
  max_watts_dc: 'Panel (DC) limit',
  battery_allowed: 'Plug-in batteries',
  utility_notification_required: 'Tell your utility?',
  utility_approval_required: 'Utility approval needed?',
  landlord_provisions: 'Renters and landlords',
  hoa_provisions: 'HOAs and condo associations',
  certification_required: 'Safety certification required',
  net_metering_excluded: 'Net metering',
};

const V: Record<string, Record<string, string>> = {
  battery_allowed: { yes: 'Covered by the law', no: 'Not allowed', not_addressed: 'Not mentioned in the law' },
  utility_notification_required: { yes: 'Yes, before installing', no: 'No', utility_may_require: 'Only if your utility asks', conditional: 'Only above a size threshold' },
  utility_approval_required: { yes: 'Yes', no: 'No' },
  landlord_provisions: { protects_tenants: 'Tenant protections', notice_rules_only: 'Notice or restoration rules only', not_addressed: 'Not mentioned in the law' },
  hoa_provisions: { protects_owners: 'Bans limited', covenants_preserved: 'HOA rules still apply', not_addressed: 'Not mentioned in the law' },
  certification_required: {
    ul_3700_or_equivalent: 'UL 3700 (or comparable)',
    plug_in_system_certification: 'Certified as a complete plug-in system',
    nrtl_certified_generic: 'Certified by UL or an equivalent lab',
    nrtl_and_ul_1741: 'UL or equivalent lab, plus UL 1741',
  },
  net_metering_excluded: { yes: 'Excluded', no: 'Allowed', not_addressed: 'Not mentioned in the law' },
};

export function ruleValue(key: string, value: unknown): string {
  if (value === 'unknown') return 'Unknown (not verified)';
  if (value === 'not_applicable') return 'No state law';
  if (value === 'not_specified') return 'No limit set';
  if (typeof value === 'number') return `${value.toLocaleString('en-US')} W`;
  return V[key]?.[String(value)] ?? String(value);
}

export const STAGE: Record<string, string> = {
  signed_into_law: 'Signed into law',
  passed_legislature_not_sent_to_governor: 'Passed the legislature; not yet sent to the governor',
  in_conference_committee: 'In conference committee',
  passed_committee: 'Passed committee',
  passed_one_chamber: 'Passed one chamber',
  in_committee: 'In committee',
  died_in_committee: 'Died in committee',
  died_on_adjournment: 'Died when the session ended',
  enacted_without_plug_in_provisions: 'Passed without its plug-in provisions',
  unknown: 'Unknown',
};

export const CERT_STATUS: Record<string, string> = {
  certified: 'Certified (certificate seen)',
  pending_or_claimed: 'Claimed by maker, not verified',
  not_certified: 'Not certified',
  unknown: 'Unknown',
};
export const SCOPE: Record<string, string> = { complete_system: 'complete system', component: 'component only', unknown: 'scope unknown' };
export const PRODUCT_TYPE: Record<string, string> = { complete_kit: 'Complete kit', inverter_only: 'Inverter only (panels sold separately)', inverter_with_battery: 'Inverter with battery' };
