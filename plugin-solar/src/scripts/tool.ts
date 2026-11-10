import { estimate, fmtUsd, fmtKwh } from '../lib/calc';

type Rule = [string, string, string | null];
interface SD {
  n: string; slug: string; st: string; cls: string; enacted: boolean; eff: string | null; effDerived: boolean;
  bill: string | null; summary: string; checked: string; strict: boolean; rules: Rule[];
  price: number | 'unknown'; y: { ideal: number | 'unknown'; vertical: number | 'unknown' }; kits: string[];
}
interface KD { slug: string; name: string; ac: number | 'unknown'; est: boolean; panel: number | null; price: number | null }
const D = JSON.parse(document.getElementById('tool-data')!.textContent!) as {
  pricePeriod: string; states: Record<string, SD>; kits: KD[]; verdictLabel: Record<string, string>;
};

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const sel = $<HTMLSelectElement>('state-select');
const out = $<HTMLDivElement>('result');
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const fmtDate = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; };
let current: string | null = null;

function countdown(eff: string) {
  const today = new Date(); const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((Date.parse(eff + 'T00:00:00Z') - t) / 86400000);
  if (days > 1) return `Takes effect in <strong>${days} days</strong> (${fmtDate(eff)}).`;
  if (days === 1) return `Takes effect <strong>tomorrow</strong> (${fmtDate(eff)}).`;
  if (days === 0) return `Takes effect <strong>today</strong>.`;
  return `In effect since ${fmtDate(eff)}.`;
}

function render(code: string, focus: boolean) {
  const s = D.states[code];
  if (!s) return;
  current = code;
  sel.value = code;
  document.querySelectorAll('.tilemap rect').forEach((r) => r.setAttribute('stroke-width', '1.5'));
  document.querySelector(`.tilemap a[data-state="${code}"] rect`)?.setAttribute('stroke-width', '4');

  const fits = s.kits.map((v, i) => ({ v, k: D.kits[i] }));
  const compatible = fits.filter((f) => f.v === 'compatible');
  const near = fits.filter((f) => f.v === 'check_with_seller' || f.v === 'unverified_claim');
  let kitsHtml = '';
  if (s.enacted) {
    kitsHtml = compatible.length
      ? `<p><strong>Compatible kits:</strong></p><ul>${compatible.map((f) => `<li><a href="/kits/${f.k.slug}/">${esc(f.k.name)}</a></li>`).join('')}</ul>`
      : `<div class="note"><strong>No kit is confirmed compatible here yet.</strong> ${s.strict ? 'This state requires UL 3700 or complete-system certification, and no complete kit has shown us that certificate.' : 'We have not seen a certificate for any complete kit.'} <a href="/certification-watch/">Get Certification watch alerts</a>.</div>`;
    if (near.length)
      kitsHtml += `<p class="small">Within the size limit but not confirmed:</p><ul class="small">${near.map((f) => `<li><a href="/kits/${f.k.slug}/">${esc(f.k.name)}</a>: ${esc(D.verdictLabel[f.v])}</li>`).join('')}</ul>`;
  }
  const rules = s.rules.length
    ? `<div class="table-wrap"><table><tbody>${s.rules.map(([k, v, u]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td><td class="src">${u ? `<a href="${esc(u)}" rel="noopener">source</a>` : ''}</td></tr>`).join('')}</tbody></table></div>`
    : '';
  out.innerHTML = `
    <h3 style="margin-top:0">${esc(s.n)} <span class="pill ${s.cls}">${esc(s.st)}</span></h3>
    ${s.eff ? `<p>${countdown(s.eff)}${s.effDerived ? ' <span class="small muted">(date derived from the law\'s effective-date clause)</span>' : ''}</p>` : ''}
    <p>${esc(s.summary)}</p>
    ${s.bill ? `<p class="small muted">${esc(s.bill)}</p>` : ''}
    ${rules}
    ${kitsHtml}
    <p><a href="/states/${s.slug}/">Full ${esc(s.n)} page, sources and FAQ</a> · <span class="small muted">Checked ${fmtDate(s.checked)}</span></p>
    <p class="small muted" style="margin:0">Information, not legal advice. Check the official sources before you buy.</p>`;
  if (focus) out.focus({ preventScroll: false });
  const price = $<HTMLInputElement>('c-price');
  if (typeof s.price === 'number') { price.value = String(s.price); $('c-price-hint').textContent = `${s.n} average residential price, ${D.pricePeriod} (EIA). Change it to match your bill.`; }
  calc();
}

function calc() {
  const box = $('calc-out');
  if (!current) return;
  const s = D.states[current];
  const num = (id: string) => { const v = $<HTMLInputElement>(id).value; return v === '' ? NaN : Number(v); };
  const cost = num('c-cost');
  const r = estimate({ panelWatts: num('c-watts'), priceCentsPerKwh: num('c-price'), sharePct: num('c-share'), kitCostUsd: Number.isFinite(cost) ? cost : null, yields: s.y });
  if (r.error) { box.innerHTML = `<p role="alert">${esc(r.error)}</p>`; return; }
  const row = (label: string, x: typeof r.ideal) => x
    ? `<tr><th scope="row">${label}</th><td class="num">${fmtKwh(x.kwh)}</td><td class="num">${fmtUsd(x.dollars)}</td><td class="num">${x.paybackYears === null ? '—' : x.paybackYears + ' yrs'}</td></tr>`
    : `<tr><th scope="row">${label}</th><td colspan="3" class="muted">No solar data for ${esc(s.n)} yet; no estimate.</td></tr>`;
  const pb = r.paybackRange ? `<p>Payback: <strong>${r.paybackRange[0] === r.paybackRange[1] ? r.paybackRange[0] : r.paybackRange[0] + ' to ' + r.paybackRange[1]} years</strong>.</p>` : '';
  box.innerHTML = `<div class="table-wrap"><table><thead><tr><th scope="col">${esc(s.n)}</th><th scope="col">Per year</th><th scope="col">Savings / yr</th><th scope="col">Payback</th></tr></thead><tbody>
    ${row('Ideal tilt (20°)', r.ideal)}${row('Vertical railing (90°)', r.vertical)}</tbody></table></div>${pb}`;
}

function fromHash(focus: boolean) {
  const m = location.hash.match(/^#state-([a-z]{2})$/i);
  if (m) render(m[1].toUpperCase(), focus);
}

sel.addEventListener('change', () => { if (sel.value) { history.replaceState(null, '', `#state-${sel.value.toLowerCase()}`); render(sel.value, false); } });
window.addEventListener('hashchange', () => fromHash(true));
['c-watts', 'c-price', 'c-share', 'c-cost'].forEach((id) => $(id).addEventListener('input', calc));
$<HTMLSelectElement>('c-kit').addEventListener('change', (e) => {
  const k = D.kits.find((x) => x.slug === (e.target as HTMLSelectElement).value);
  if (k) { if (k.panel) $<HTMLInputElement>('c-watts').value = String(k.panel); $<HTMLInputElement>('c-cost').value = k.price ? String(k.price) : ''; }
  calc();
});
fromHash(false);

// sortable state table
const table = document.getElementById('state-table');
if (table) {
  table.querySelectorAll<HTMLButtonElement>('button.sort').forEach((btn) => btn.addEventListener('click', () => {
    const th = btn.parentElement!; const k = Number(btn.dataset.k);
    const asc = th.getAttribute('aria-sort') !== 'ascending';
    table.querySelectorAll('thead th').forEach((h) => h.removeAttribute('aria-sort'));
    th.setAttribute('aria-sort', asc ? 'ascending' : 'descending');
    const body = table.querySelector('tbody')!;
    const rows = [...body.rows];
    const val = (r: HTMLTableRowElement) => (r.cells[k] as HTMLElement).dataset.v ?? '';
    rows.sort((a, b) => { const x = val(a), y = val(b); const nx = Number(x), ny = Number(y); const c = !isNaN(nx) && !isNaN(ny) ? nx - ny : x.localeCompare(y); return asc ? c : -c; });
    rows.forEach((r) => body.appendChild(r));
  }));
}
