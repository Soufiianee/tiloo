import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const E = require('../app/engine.js');
const C = require('../app/catalog.js');
const TODAY = '2026-11-07';
const clone = (o) => JSON.parse(JSON.stringify(o));

test('plafond = plus haut prix de la fenêtre, pas le dernier', () => {
  const hist = [{ d: '2026-01-01', v: 200 }, { d: '2026-08-01', v: 120 }, { d: '2026-10-01', v: 100 }];
  assert.deepEqual(
    [E.seriesValue(hist, { mode: 'window', windowDays: 180 }, TODAY).ceil,
      E.seriesValue(hist, { mode: 'alltime' }, TODAY).ceil,
      E.seriesValue(hist, { mode: 'latest' }, TODAY).ceil],
    [120, 200, 100]);
  // la fenêtre garde toujours le dernier prix, même très ancien
  assert.equal(E.seriesValue([{ d: '2020-01-01', v: 50 }], { mode: 'window', windowDays: 30 }, TODAY).ceil, 50);
});

test('article alu suit le cours alu ; article en euros suit le cours EUR/MAD', () => {
  const book = clone(C.BOOK), s = clone(C.SETTINGS);
  s.policy = { mode: 'latest', buffer: 0 };
  book.alu_kg.hist = [{ d: TODAY, v: 50 }];
  book.eur_mad.hist = [{ d: TODAY, v: 10 }];
  assert.equal(E.unitCost(book.alu_poteau_150, book, s, TODAY).now, 4.7 * 50 + 30);
  book.somfy_zip.hist = [{ d: TODAY, v: 100 }];
  assert.equal(E.unitCost(book.somfy_zip, book, s, TODAY).now, 100 * 10 * (1 + s.landedEur));
});

test('tampon appliqué au plafond seulement', () => {
  const book = clone(C.BOOK), s = clone(C.SETTINGS);
  s.policy = { mode: 'latest', buffer: 0.1 };
  book.spot_led.hist = [{ d: TODAY, v: 100 }];
  const u = E.unitCost(book.spot_led, book, s, TODAY);
  assert.equal(u.now, 100);
  assert.ok(Math.abs(u.ceil - 110) < 1e-9);
});

test('baisse fournisseur = marge réelle supérieure à la cible', () => {
  const p = C.PRODUCTS.find((x) => x.id === 'pergola-bioclimatique');
  const r = E.priceLine(p, {}, C.BOOK, C.SETTINGS, TODAY, { access: 'normal' });
  assert.ok(r.costCeil > r.costNow);
  assert.ok(r.marginIfToday > r.margin);
  assert.ok(r.marginAtCeil >= r.margin - 1e-9); // l'arrondi ne fait que monter
  assert.equal(r.saleHT % C.SETTINGS.rounding, 0);
});

test('tous les produits se chiffrent sans article manquant', () => {
  for (const p of C.PRODUCTS) {
    const r = E.priceLine(p, {}, C.BOOK, C.SETTINGS, TODAY, { access: 'normal' });
    assert.ok(r.saleHT > 0, p.id);
    assert.ok(!r.warnings.some((w) => w.includes('introuvable')), p.id + ': ' + r.warnings.join(' | '));
  }
});

test('ordres de grandeur calés sur le configurateur Perlago ATLAS (± 15 %)', () => {
  const p = C.PRODUCTS.find((x) => x.id === 'pergola-bioclimatique');
  // Perlago : prix TTC hors pose + 5 000 MAD de pose
  const ref = [[5, 3, 63162.53 + 5000], [5, 4, 77050.27 + 5000], [6, 4, 91685.3 + 5000]];
  for (const [L, P, ttc] of ref) {
    const r = E.priceLine(p, { L, P }, C.BOOK, C.SETTINGS, TODAY, { access: 'facile' });
    const ours = r.saleHT * 1.2;
    assert.ok(Math.abs(ours / ttc - 1) < 0.15, `${L}×${P}: ${ours} vs ${ttc}`);
  }
});

test('devis : déplacement hors zone avec nuitées, remise, TVA', () => {
  const p = C.PRODUCTS.find((x) => x.id === 'store-banne');
  const line = E.priceLine(p, {}, C.BOOK, C.SETTINGS, TODAY, { access: 'normal' });
  const q = E.priceQuote([line], C.SETTINGS, { zone: 'marrakech', discount: 0.05 });
  const nights = Math.ceil(line.laborDays);
  assert.equal(q.travel, E.roundUp(2500 + nights * 700, 50));
  assert.equal(q.htNet, q.ht - q.discount);
  assert.ok(Math.abs(q.ttc - q.htNet * 1.2) < 1e-6);
});
