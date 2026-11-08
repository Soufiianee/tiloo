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
  book.test_eur = { type: 'eur', cat: 'equipement', hist: [{ d: TODAY, v: 100 }], max: 120 };
  const z = E.unitCost(book.test_eur, book, s, TODAY);
  assert.equal(z.now, 100 * 10 * (1 + s.landedEur));
  assert.ok(Math.abs(z.max - 120 * 11 * (1 + s.landedEur)) < 1e-9);
});

test('article importé saisi en MAD : pris tel quel, sans change ni frais d’approche', () => {
  const book = clone(C.BOOK), s = clone(C.SETTINGS);
  s.policy.buffer = 0;
  book.eur_mad.hist = [{ d: TODAY, v: 10 }]; book.eur_mad.max = 11;
  book.test_eur = { type: 'eur', cat: 'equipement', hist: [{ d: '2026-06-15', v: 200 }, { d: TODAY, v: 2600, cur: 'MAD' }], max: 300 };
  const u = E.unitCost(book.test_eur, book, s, TODAY);
  assert.equal(u.now, 2600);
  assert.equal(u.win, Math.max(2600, 200 * 10 * 1.25)); // plus haut 12 mois, tous relevés en MAD
  assert.ok(Math.abs(u.max - 300 * 11 * 1.25) < 1e-9);
});

test('tampon appliqué aux plafonds, pas au prix du jour', () => {
  const book = clone(C.BOOK), s = clone(C.SETTINGS);
  s.policy.buffer = 0.1;
  book.spot_led.hist = [{ d: TODAY, v: 100 }]; delete book.spot_led.max;
  const u = E.unitCost(book.spot_led, book, s, TODAY);
  assert.equal(u.now, 100);
  assert.ok(Math.abs(u.win - 110) < 1e-9);
});

/* Carnet où les articles sans prix ont reçu un prix saisi à la main (comme dans l'onglet Prix). */
function filledBook() {
  const book = clone(C.BOOK);
  Object.values(book).forEach((it) => { if (it.type === 'mad' && !it.hist.length && it.max == null) it.hist = [{ d: '2026-11-01', v: 100 }, { d: TODAY, v: 90 }]; });
  return book;
}

test('plancher ≤ conseillé ≤ prudent, et marge réelle ≥ cible', () => {
  const book = filledBook();
  for (const p of C.PRODUCTS) {
    const r = E.priceLine(p, {}, book, C.SETTINGS, TODAY, { access: 'normal' });
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

const SL3D = require('../app/view3d.js').SL3D;

test('photo : la caméra reconstruite depuis 4 coins reprojette la structure au pixel près', () => {
  const W = 1600, H = 1200, cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const yaw = 0.3, pitch = 0.25, C = [2.2, 1.6, 7], f = 1400;
  const fwd = [-Math.sin(yaw)*Math.cos(pitch), -Math.sin(pitch), -Math.cos(yaw)*Math.cos(pitch)], right = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const R = [right, cross(fwd, right), fwd], t = [0, 1, 2].map(i => -(R[i][0]*C[0]+R[i][1]*C[1]+R[i][2]*C[2]));
  const truth = { f, R, t }, g = { kind: 'plan', L: 5, P: 3 };
  const img = SL3D.footCorners(g).map(c => SL3D.project(truth, [c[0], 0, c[1]], W, H));
  const pose = SL3D.solvePose(img, SL3D.footCorners(g), W, H);
  assert.ok(Math.abs(pose.f - f) < 1);
  for (const p of [[2.5, 2.6, 1.5], [-2.5, 2.6, -1.5]]) {
    const a = SL3D.project(truth, p, W, H), b = SL3D.project(pose, p, W, H);
    assert.ok(Math.hypot(a[0]-b[0], a[1]-b[1]) < 0.5);
  }
});

test('soleil : Agadir, été l’après-midi à l’ouest, hiver à midi au sud et plus bas', () => {
  const ete = SL3D.sunPosition(7, 15, 16, 30.42, -9.6), hiver = SL3D.sunPosition(12, 21, 12.5, 30.42, -9.6);
  assert.ok(ete.az > 240 && ete.az < 290 && ete.alt > 45, JSON.stringify(ete));
  assert.ok(hiver.az > 150 && hiver.az < 210 && hiver.alt < 40, JSON.stringify(hiver));
});

test('trois versions : Essentiel ≤ Confort ≤ Premium pour chaque produit', () => {
  for (const p of C.PRODUCTS) {
    const base = E.fullParams(p, {}), v = p.versions(base);
    const ttc = ['A', 'B', 'C'].map(k => E.priceLine(p, Object.assign({}, base, v[k]), C.BOOK, C.SETTINGS, TODAY, {}).sale.win);
    assert.ok(ttc[0] <= ttc[1] && ttc[1] <= ttc[2], p.id + ' ' + ttc.join(' / '));
  }
});

test('carport en configuration : articles sans prix signalés, prix nul tant qu’ils ne sont pas saisis', () => {
  const p = C.PRODUCTS.find((x) => x.id === 'abri-voiture');
  assert.ok(!p.archived);
  assert.ok(C.PRODUCTS.filter((x) => x.id !== 'abri-voiture').every((x) => x.archived));
  const r = E.priceLine(p, {}, C.BOOK, C.SETTINGS, TODAY, {});
  assert.ok(r.unpriced.length > 0);
  assert.equal(r.sale.win, 0);
  assert.equal(r.stale.length, 0, 'un article sans prix n’est pas « périmé »');
  const f = E.priceLine(p, {}, filledBook(), C.SETTINGS, TODAY, {});
  assert.equal(f.unpriced.length, 0);
  assert.ok(f.sale.win > 0);
});

test('carport : toutes les options produisent des lignes valides', () => {
  const p = C.PRODUCTS.find((x) => x.id === 'abri-voiture'), book = filledBook();
  const opts = (id) => p.params.find((d) => d.id === id).options.map((o) => o.v);
  for (const mat of opts('mat')) for (const profP of opts('profP')) for (const couv of opts('couv')) for (const sol of opts('sol'))
    for (const config of opts('config')) for (const forme of opts('forme')) for (const poutre of opts('poutre')) {
      const params = { mat, profP, poutre, profB: profP === 'rond' ? 'carre' : 'rond', dP: 150, cP: 150, tP: 4, dB: 90, cB: 80, tB: 1.5, cPan: 60, tPan: 2,
        couv, sol, config, forme, mur: 'creux', cotes: 'trois', gout: true, lamb: true, spots: 2, expo: 'mer' };
      const r = E.priceLine(p, params, book, C.SETTINGS, TODAY, {});
      const label = JSON.stringify(params);
      assert.ok(!r.warnings.some((w) => w.includes('introuvable')), label + ' ' + r.warnings.join(' | '));
      assert.ok(r.lines.every((l) => l.qty > 0 && Number.isFinite(l.qty)), label);
      assert.ok(r.sale.win > 0, label);
    }
});

test('carport : plus de places = plus de poteaux ; adossé sur mur creux = chevilles chimiques', () => {
  const p = C.PRODUCTS.find((x) => x.id === 'abri-voiture');
  const one = E.priceLine(p, { places: 1 }, C.BOOK, C.SETTINGS, TODAY, {}), three = E.priceLine(p, { places: 3 }, C.BOOK, C.SETTINGS, TODAY, {});
  const q = (r, id) => r.lines.filter((l) => l.item === id).reduce((a, l) => a + l.qty, 0);
  assert.ok(q(three, 'cp_platine') > q(one, 'cp_platine'));
  const wall = E.priceLine(p, { config: 'adossee', mur: 'creux' }, C.BOOK, C.SETTINGS, TODAY, {});
  assert.ok(q(wall, 'cp_chimique') > 0);
  const paves = E.priceLine(p, { sol: 'paves' }, C.BOOK, C.SETTINGS, TODAY, {});
  assert.equal(q(paves, 'cp_plot'), q(paves, 'cp_paves'));
});

test('carport au mètre : un prix par dimension de tube, métrages corrigeables', () => {
  const p = C.PRODUCTS.find((x) => x.id === 'abri-voiture'), book = filledBook();
  const r = E.priceLine(p, { mat: 'acier', profP: 'rond', dP: 120, tP: 2.5, poutre: 'autre', profB: 'carre', cB: 100, tB: 2 }, book, C.SETTINGS, TODAY, {});
  const ids = r.lines.map((l) => l.item);
  assert.ok(ids.includes('cp_t_acier_r120_25') && ids.includes('cp_t_acier_c100_20') && ids.includes('cp_t_acier_c40_15'), ids.join(' '));
  assert.ok(r.lines.filter((l) => l.item.startsWith('cp_t_')).every((l) => l.unit === 'm'));
  const auto = r.metrage, hand = E.priceLine(p, { mlEdit: true, mlP: auto.mlP + 10, mlB: auto.mlB, mlPan: auto.mlPan }, book, C.SETTINGS, TODAY, {});
  const base = E.priceLine(p, {}, book, C.SETTINGS, TODAY, {});
  const q = (x, pre) => x.lines.filter((l) => l.item.startsWith(pre)).reduce((a, l) => a + l.qty, 0);
  assert.ok(Math.abs(q(hand, 'cp_t_') - q(base, 'cp_t_') - 10) < 0.2);
});
