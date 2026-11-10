import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { states, statusLabel, effectiveDate, fmtDate, site, STATUS } from '../../lib/data';

const require = createRequire(import.meta.url);
const font = (w: number) => readFileSync(require.resolve(`@fontsource/inter/files/inter-latin-${w}-normal.woff`));
const fonts = [
  { name: 'Inter', data: font(400), weight: 400 as const, style: 'normal' as const },
  { name: 'Inter', data: font(700), weight: 700 as const, style: 'normal' as const },
];
const COL: Record<string, [string, string]> = {
  'st-effect': ['#e3f3e8', '#1e7a46'], 'st-passed': ['#e0f1f4', '#0f6c80'], 'st-active': ['#fbefd5', '#8a5a00'],
  'st-dead': ['#f6e3e0', '#8c3b33'], 'st-none': ['#ecebe7', '#5c6168'], 'st-unknown': ['#ece8f6', '#5b4a8a'],
};

export function getStaticPaths() {
  return [{ params: { slug: 'default' } }, ...states.map((s) => ({ params: { slug: s.slug } }))];
}

const h = (type: string, style: Record<string, unknown>, children?: unknown) => ({ type, props: { style, children } });

export const GET: APIRoute = async ({ params }) => {
  const name = site.SITE_NAME === 'TBD' ? 'Plug-in Solar Tracker' : site.SITE_NAME;
  const s = states.find((x) => x.slug === params.slug);
  let title = 'Is plug-in solar legal in your state?';
  let line = 'State laws and kit certification, checked against official sources';
  let pill: [string, string, string] | null = null;
  if (s) {
    const eff = effectiveDate(s);
    const cap = s.rules.max_watts_ac.value;
    title = `Plug-in solar in ${s.name}`;
    line = [typeof cap === 'number' ? `Limit ${cap.toLocaleString('en-US')} W` : null, eff ? `Effective ${fmtDate(eff)}` : null, `Checked ${fmtDate(s.last_checked)}`].filter(Boolean).join('  ·  ');
    const [bg, fg] = COL[STATUS[s.status].cls];
    pill = [statusLabel(s), bg, fg];
  }
  const tree = h('div', { width: 1200, height: 630, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: '#fbfaf7', color: '#1c1f23', fontFamily: 'Inter', borderTop: '16px solid #1f4e79' }, [
    h('div', { fontSize: 30, color: '#4a5059', fontWeight: 700 }, name),
    h('div', { display: 'flex', flexDirection: 'column', gap: 28 }, [
      h('div', { fontSize: 76, fontWeight: 700, lineHeight: 1.1 }, title),
      pill ? h('div', { display: 'flex' }, [h('div', { fontSize: 36, fontWeight: 700, padding: '10px 26px', borderRadius: 999, background: pill[1], color: pill[2], border: `3px solid ${pill[2]}` }, pill[0])]) : h('div', { display: 'flex' }, ''),
    ]),
    h('div', { fontSize: 30, color: '#4a5059' }, line),
  ]);
  const svg = await satori(tree as never, { width: 1200, height: 630, fonts });
  const png = new Resvg(svg).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
