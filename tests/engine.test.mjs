import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const E = require('../app/engine.js');
const C = require('../app/catalog.js');
const TODAY = '2026-11-07';
const clone = (o) => JSON.parse(JSON.stringify(o));

test('série : dernier prix, plus haut de la fenêtre, plus haut absolu', () => {
  const hist = [{ d: '2025-01-01', v: 200 }, { d: '2026-08-01', v: 120 }, { d: '2026-10-01', v: 100 }];
  const s = E.series(hist, 365, TODAY);
  assert.deepEqual([s.now, s.win, s.max], [100, 120, 200]);
  // le maximum recherché l'emporte s'il dépasse l'historique
  assert.equal(E.series(hist, 365, TODAY, 250).max, 250);
  // la fenêtre garde toujours le dernier prix, même ancien
  assert.equal(E.series([{ d: '2020-01-01', v: 50 }], 30, TODAY).win, 50);
});

test('profilé alu suit l’indice ; article en euros suit EUR/MAD', () => {
  const book = clone(C.BOOK), s = clone(C.SETTINGS);
  s.policy.buffer = 0;
  book.alu_kg.hist = [{ d: TODAY, v: 50 }]; book.alu_kg.max = 60;
  book.eur_mad.hist = [{ d: TODAY, v: 10 }]; book.eur_mad.max = 11;
  const a = E.unitCost(book.alu_poteau_150, book, s, TODAY);
  assert.equal(a.now, 4.7 * 50 + 30);
  assert.equal(a.max, 4.7 * 60 + 30);
  book.somfy_zip.hist = [{ d: TODAY, v: 100 }]; book.somfy_zip.max = 120;
  const z = E.unitCost(book.somfy_zip, book, s, TODAY);
  assert.equal(z.now, 100 * 10 * (1 + s.landedEur));
  assert.ok(Math.abs(z.max - 120 * 11 * (1 + s.landedEur)) < 1e-9);
});

test('tampon appliqué aux plafonds, pas au prix du jour', () => {
  const book = clone(C.BOOK), s = clone(C.SETTINGS);
  s.policy.buffer = 0.1;
  book.spot_led.hist = [{ d: TODAY, v: 100 }]; delete book.spot_led.max;
  const u = E.unitCost(book.spot_led, book, s, TODAY);
  assert.equal(u.now, 100);
  assert.ok(Math.abs(u.win - 110) < 1e-9);
});

test('plancher ≤ conseillé ≤ prudent, et marge réelle ≥ cible', () => {
  for (const p of C.PRODUCTS) {
    const r = E.priceLine(p, {}, C.BOOK, C.SETTINGS, TODAY, { access: 'normal' });
    assert.ok(r.sale.now <= r.sale.win && r.sale.win <= r.sale.max, p.id);
    assert.ok(r.marginIfToday >= r.margin - 1e-9, p.id);
    assert.equal(r.saleHT % C.SETTINGS.rounding, 0, p.id);
    assert.ok(!r.warnings.some((w) => w.includes('introuvable')), p.id + ': ' + r.warnings.join(' | '));
    assert.ok(r.geo && r.geo.kind, p.id + ' doit fournir un dessin');
  }
});

test('niveau conseillé calé sur Perlago ATLAS pose comprise (± 10 %)', () => {
  const p = C.PRODUCTS.find((x) => x.id === 'pergola-bioclimatique');
  const ref = [[5, 3, 63162.53 + 5000], [5, 4, 77050.27 + 5000], [6, 4, 91685.3 + 5000]];
  for (const [L, P, ttc] of ref) {
    const r = E.priceLine(p, { L, P }, C.BOOK, C.SETTINGS, TODAY, { access: 'facile' });
    const ours = r.sale.win * 1.2;
    assert.ok(Math.abs(ours / ttc - 1) < 0.10, `${L}×${P}: ${ours} vs ${ttc}`);
  }
});

test('indice alu reconstitué depuis la cote LME', () => {
  assert.equal(Math.round(E.aluFromLme(3065, 500, 1900, 9.8) * 10) / 10, 53.6);
});

test('devis : niveau par ligne, déplacement avec nuitées, remise, TVA', () => {
  const p = C.PRODUCTS.find((x) => x.id === 'store-banne');
  const line = E.priceLine(p, {}, C.BOOK, C.SETTINGS, TODAY, { access: 'normal' });
  const q = E.priceQuote([{ line, tier: 'max' }], C.SETTINGS, { zone: 'marrakech', discount: 0.05 });
  const nights = Math.ceil(line.laborDays);
  assert.equal(q.travel, E.roundUp(2500 + nights * 700, 50));
  assert.equal(q.ht, line.sale.max + q.travel);
  assert.equal(q.htNet, q.ht - q.discount);
  assert.ok(Math.abs(q.ttc - q.htNet * 1.2) < 1e-6);
});
