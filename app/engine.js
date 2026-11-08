/*
 * Store Luxe — moteur de chiffrage.
 *
 * Chaque produit se décompose en postes (matière, équipement, pose) qui pointent
 * vers les articles du carnet de prix. Pour chaque article, trois coûts :
 *   now : dernier prix connu                       → prix « plancher »
 *   win : plus haut prix sur la période glissante   → prix « conseillé »
 *   max : plus haut prix jamais relevé ou recherché → prix « prudent »
 * win et max reçoivent un tampon de volatilité. Le devis se base sur le niveau
 * choisi dans les réglages (conseillé par défaut). Quand le fournisseur baisse,
 * l'écart avec le prix du jour devient de la marge en plus.
 *
 * Fonctions pures, sans DOM : utilisables dans la page et sous Node (tests).
 */
(function (root) {
  'use strict';

  var DAY = 86400000;
  var TIERS = ['now', 'win', 'max'];

  function toTime(d) { return new Date(d + 'T00:00:00Z').getTime(); }
  function daysBetween(a, b) { return Math.round((toTime(b) - toTime(a)) / DAY); }
  function addDays(d, n) { return new Date(toTime(d) + n * DAY).toISOString().slice(0, 10); }
  function roundUp(x, step) { return step > 0 ? Math.ceil(x / step - 1e-9) * step : x; }

  function sortHist(hist) {
    return (hist || []).slice().sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
  }

  /*
   * Lecture d'une série. Renvoie le dernier prix, le plus haut de la période,
   * le plus haut absolu (historique + maximum recherché éventuel) et leurs dates.
   */
  function series(hist, windowDays, today, researchedMax) {
    var h = sortHist(hist);
    if (!h.length) return { now: 0, win: 0, max: researchedMax || 0, lastDate: null, winDate: null, maxDate: null };
    var last = h[h.length - 1];
    var from = toTime(today) - (windowDays || 365) * DAY;
    var win = last, max = h[0];
    h.forEach(function (p) {
      if (toTime(p.d) >= from && p.v > win.v) win = p;
      if (p.v > max.v) max = p;
    });
    var maxV = max.v, maxDate = max.d;
    if (researchedMax != null && researchedMax > maxV) { maxV = researchedMax; maxDate = null; }
    return { now: last.v, win: win.v, max: maxV, lastDate: last.d, winDate: win.d, maxDate: maxDate };
  }

  /*
   * Coût unitaire d'un article en MAD HT, pour les trois niveaux.
   *  type 'mad' : historique en MAD
   *  type 'alu' : kg par unité × indice alu (MAD/kg) + façonnage
   *  type 'eur' : historique en € × indice EUR/MAD × (1 + frais d'approche)
   */
  function unitCost(item, book, settings, today) {
    var pol = settings.policy, w = pol.windowDays;
    var buffer = item.buffer != null ? item.buffer : pol.buffer;
    var c, lastDate;
    if (item.type === 'alu') {
      var a = series(book.alu_kg.hist, w, today, book.alu_kg.max);
      c = { now: item.kg * a.now + item.fab, win: item.kg * a.win + item.fab, max: item.kg * a.max + item.fab };
      lastDate = a.lastDate;
    } else if (item.type === 'eur') {
      /* Article importé : un relevé est en euros (prix catalogue, converti au
       * cours du niveau + frais d'approche) ou en MAD ({cur: 'MAD'}, prix du
       * distributeur marocain, déjà rendu). Les deux se mélangent dans l'historique. */
      var fx = series(book.eur_mad.hist, w, today, book.eur_mad.max);
      var landed = 1 + (item.landed != null ? item.landed : settings.landedEur);
      var conv = function (rate) {
        return (item.hist || []).map(function (p) { return { d: p.d, v: p.cur === 'MAD' ? p.v : p.v * rate * landed }; });
      };
      var sn = series(conv(fx.now), w, today);
      var sw = series(conv(fx.win), w, today);
      var sm = series(conv(fx.max), w, today, item.max != null ? item.max * fx.max * landed : null);
      c = { now: sn.now, win: sw.win, max: sm.max };
      lastDate = sn.lastDate;
    } else {
      var s = series(item.hist, w, today, item.max);
      c = { now: s.now, win: s.win, max: s.max };
      lastDate = s.lastDate;
    }
    /* Article sans aucun relevé ni maximum : prix inconnu, à renseigner (pas « périmé »). */
    var unpriced = item.type !== 'alu' && item.type !== 'index' && !(item.hist && item.hist.length) && item.max == null;
    c.win *= 1 + buffer;
    c.max *= 1 + buffer;
    var age = lastDate ? daysBetween(lastDate, today) : Infinity;
    c.lastDate = lastDate;
    c.age = age;
    c.unpriced = unpriced;
    c.stale = !unpriced && !item.noStale && age > settings.staleDays;
    return c;
  }

  var H = {
    ceil: Math.ceil, max: Math.max, min: Math.min,
    r1: function (x) { return Math.round(x * 10) / 10; },
    r2: function (x) { return Math.round(x * 100) / 100; }
  };

  function fullParams(product, params) {
    var p = {};
    product.params.forEach(function (d) { p[d.id] = params && params[d.id] != null ? params[d.id] : d.def; });
    return p;
  }

  /* Chiffre une ligne produit, sans le déplacement (compté une fois par devis). */
  function priceLine(product, params, book, settings, today, ctx) {
    ctx = ctx || {};
    var p = fullParams(product, params);
    var b = product.build(p, H, Object.assign({}, ctx, { settings: settings }));
    var accessMult = settings.access[ctx.access || 'normal'] || 1;
    var margin = settings.margins[product.id] != null ? settings.margins[product.id] : product.margin;
    var waste = product.waste != null ? product.waste : 0.05;
    var aluAdj = 1 + (b.aluSurcharge || 0);

    var cost = {}, byCat = {};
    TIERS.forEach(function (t) { cost[t] = 0; byCat[t] = { matiere: 0, equipement: 0, pose: 0 }; });
    var lines = [], stale = [], missing = [], unpriced = [];

    b.lines.forEach(function (l) {
      if (!l.qty) return;
      var item = book[l.item];
      if (!item) { missing.push(l.item); return; }
      var uc = unitCost(item, book, settings, today);
      var mult = (item.type === 'alu' ? aluAdj : 1) * (item.cat === 'pose' && !item.noAccess ? accessMult : item.cat === 'matiere' && !item.noWaste ? 1 + waste : 1);
      var line = { item: l.item, name: item.name, unit: item.unit, cat: item.cat, group: item.group || '', comp: l.comp || null, qty: l.qty, note: l.note || '', stale: uc.stale, unpriced: uc.unpriced };
      if (uc.unpriced && unpriced.indexOf(l.item) < 0) unpriced.push(l.item);
      TIERS.forEach(function (t) {
        var v = l.qty * uc[t] * mult;
        line[t] = v; line['pu_' + t] = uc[t] * mult;
        cost[t] += v; byCat[t][item.cat] += v;
      });
      if (uc.stale) stale.push(item.name);
      lines.push(line);
    });

    var sale = {};
    TIERS.forEach(function (t) { sale[t] = roundUp(cost[t] / (1 - margin), settings.rounding) || 0; });
    var base = settings.policy.base || 'win';
    return {
      productId: product.id, productName: product.name,
      params: p, summary: b.summary || '', details: b.details || [], area: b.area || 0, geo: b.geo || null, metrage: b.metrage || null,
      lines: lines, byCat: byCat,
      warnings: (b.warnings || []).concat(missing.map(function (m) { return 'Article introuvable dans le carnet : ' + m; })),
      stale: stale, unpriced: unpriced, laborDays: b.laborDays || 0,
      margin: margin, base: base,
      cost: cost, sale: sale,
      saleHT: sale[base],
      costNow: cost.now, costBase: cost[base],
      cushion: cost[base] - cost.now,
      marginIfToday: sale[base] > 0 ? 1 - cost.now / sale[base] : 0
    };
  }

  /* Agrège les lignes (chacune à son niveau choisi) : déplacement, nuitées, remise, TVA. */
  function priceQuote(entries, settings, ctx) {
    ctx = ctx || {};
    var zone = settings.zones.filter(function (z) { return z.id === ctx.zone; })[0] || settings.zones[0];
    var days = 0, ht = 0, costNow = 0;
    entries.forEach(function (e) {
      var t = e.tier || e.line.base;
      days += e.line.laborDays; ht += e.line.sale[t]; costNow += e.line.cost.now;
    });
    var nights = zone.lodging ? Math.ceil(days) : 0;
    var travel = entries.length ? roundUp(zone.cost + nights * settings.lodgingPerNight, settings.rounding) : 0;
    ht += travel; costNow += travel;
    var discount = ctx.discount ? roundUp(ht * ctx.discount, settings.rounding) : 0;
    var htNet = ht - discount;
    var tva = htNet * settings.tva;
    return {
      zone: zone, laborDays: days, nights: nights, travel: travel,
      ht: ht, discount: discount, htNet: htNet, tva: tva, ttc: htNet + tva,
      costNow: costNow, marginIfToday: htNet > 0 ? 1 - costNow / htNet : 0
    };
  }

  /* Indice alu reconstitué depuis la cote LME : (LME + prime + transformation) $/t × USD/MAD ÷ 1000. */
  function aluFromLme(lme, premium, conversion, usdMad) {
    return (lme + premium + conversion) * usdMad / 1000;
  }

  var api = { TIERS: TIERS, series: series, unitCost: unitCost, priceLine: priceLine, priceQuote: priceQuote,
    fullParams: fullParams, aluFromLme: aluFromLme, roundUp: roundUp, addDays: addDays, daysBetween: daysBetween };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SLEngine = api;
})(this);
