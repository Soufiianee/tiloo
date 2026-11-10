import { describe, it, expect } from 'vitest';
import { verdict } from '../src/lib/compat';
import { allNeighbourPairs } from '../src/lib/geo';

const ul3700 = (status: string, scope: string) => ({ standard: 'UL 3700', status, scope });
describe('compatibility is conservative', () => {
  const vt = { enacted: true, cap: 1200, certReq: 'ul_3700_or_equivalent' as const };
  it('component-only certificate is never "compatible"', () => {
    expect(verdict(vt, { ac_output_w: 900, certifications: [ul3700('certified', 'component')] })).toBe('check_with_seller');
  });
  it('complete-system certificate is compatible', () => {
    expect(verdict(vt, { ac_output_w: 900, certifications: [ul3700('certified', 'complete_system')] })).toBe('compatible');
  });
  it('over the cap', () => {
    expect(verdict(vt, { ac_output_w: 1300, certifications: [ul3700('certified', 'complete_system')] })).toBe('over_cap');
  });
  it('claims and unknown output', () => {
    expect(verdict(vt, { ac_output_w: 400, certifications: [ul3700('pending_or_claimed', 'component')] })).toBe('unverified_claim');
    expect(verdict(vt, { ac_output_w: 'unknown', certifications: [] })).toBe('output_unknown');
  });
  it('UL 1741 does not satisfy a UL 3700 rule', () => {
    expect(verdict(vt, { ac_output_w: 400, certifications: [{ standard: 'UL 1741', status: 'certified', scope: 'component' }] })).toBe('no_evidence');
  });
  it('unverified state rules and no law', () => {
    expect(verdict({ enacted: true, cap: 'unknown', certReq: 'unknown' }, { ac_output_w: 400, certifications: [] })).toBe('rules_unknown');
    expect(verdict({ enacted: false, cap: 'not_applicable', certReq: 'not_applicable' }, { ac_output_w: 400, certifications: [] })).toBe('no_state_law');
  });
});

describe('neighbour table', () => {
  it('is symmetric and has 51 entries', () => {
    const n = allNeighbourPairs();
    expect(Object.keys(n).length).toBe(51);
    for (const [a, list] of Object.entries(n)) for (const b of list.split(' ').filter(Boolean)) expect(n[b].split(' ')).toContain(a);
  });
});
