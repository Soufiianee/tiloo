/**
 * Link check.
 *  1. Internal: every href/src in dist/*.html must resolve to a built file (run after `astro build`).
 *  2. External (--external): every source URL in data/*.json is requested once; dead links are REPORTED,
 *     never deleted. Output: research/LINKCHECK.md
 */
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));

const broken: string[] = [];
let checked = 0;
for (const file of walk(dist).filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const u = m[1];
    if (!u.startsWith('/') || u.startsWith('//')) continue;
    const path = u.split('#')[0].split('?')[0];
    if (!path) continue;
    checked++;
    const target = join(dist, path);
    const ok = existsSync(target) && (statSync(target).isFile() || existsSync(join(target, 'index.html')));
    if (!ok) broken.push(`${file.replace(dist, '')} -> ${u}`);
  }
}
console.log(`Internal links checked: ${checked}; broken: ${broken.length}`);
broken.forEach((b) => console.log('  BROKEN ' + b));

if (process.argv.includes('--external')) {
  const urls = new Set<string>();
  const collect = (o: unknown) => {
    if (Array.isArray(o)) o.forEach(collect);
    else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) {
      if ((k === 'url' || k === 'evidence_url') && typeof v === 'string' && v.startsWith('http')) urls.add(v);
      else collect(v);
    }
  };
  for (const f of ['states', 'kits', 'electricity_prices', 'solar_yield', 'updates']) collect(JSON.parse(readFileSync(join(root, `data/${f}.json`), 'utf8')));
  const rows: string[] = [];
  const list = [...urls].sort();
  const UA = 'Mozilla/5.0 (link checker for a public-interest data site)';
  for (const u of list) {
    let status = 'error';
    try {
      const r = await fetch(u, { method: 'GET', redirect: 'follow', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
      status = String(r.status);
    } catch (e) { status = 'error: ' + ((e as Error).cause as Error | undefined)?.message?.slice(0, 80) || (e as Error).message; }
    rows.push(`| ${status} | ${u} |`);
  }
  const bad = rows.filter((r) => !/^\| 2\d\d /.test(r));
  const md = `# External link check\n\nRun: ${new Date().toISOString().slice(0, 10)}. ${list.length} unique source URLs; ${bad.length} not returning 2xx.\nDead or blocked links are reported here, not deleted from the data.\n\n| Status | URL |\n|---|---|\n${bad.join('\n')}\n\n<details><summary>All results</summary>\n\n| Status | URL |\n|---|---|\n${rows.join('\n')}\n\n</details>\n`;
  writeFileSync(join(root, 'research/LINKCHECK.md'), md);
  console.log(`External URLs checked: ${list.length}; not 2xx: ${bad.length} (see research/LINKCHECK.md)`);
}
if (broken.length) process.exit(1);
