/*
 * Store Luxe — moteur de chiffrage.
 *
 * Principe : chaque produit se décompose en postes (matière, équipement, pose).
 * Chaque poste pointe vers un article du carnet de prix fournisseurs.
 * Le coût retenu pour un article n'est PAS son dernier prix, mais son
 * « prix plafond » : le plus haut relevé sur une fenêtre glissante (ou de tout
 * l'historique), majoré d'un petit tampon de volatilité. Quand le fournisseur
 * baisse, l'écart plafond − prix du jour devient de la marge en plus.
 *
 * Fonctions pures, sans DOM : utilisables dans la page et sous Node (tests).
 */
(function (root) {
  'use strict';

  var DAY = 86400000;

  function toTime(d) { return new Date(d + 'T00:00:00Z').getTime(); }

  function sortHist(hist) {
    return (hist || []).slice().sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
  }

  /* Valeur d'une série selon la politique. Renvoie {now, ceil, lastDate, peakDate}. */
  function seriesValue(hist, policy, today) {
    var h = sortHist(hist);
    if (!h.length) return { now: 0, ceil: 0, lastDate: null, peakDate: null, empty: true };
    var last = h[h.length - 1];
    var pool;
    if (policy.mode === 'latest') pool = [last];
    else if (policy.mode === 'alltime') pool = h;
    else {
      var from = toTime(today) - (policy.windowDays || 180) * DAY;
      pool = h.filter(function (p) { return toTime(p.d) >= from; });
      if (!pool.length) pool = [last];
    }
    var peak = pool[0];
    pool.forEach(function (p) { if (p.v > peak.v) peak = p; });
    return { now: last.v, ceil: peak.v, lastDate: last.d, peakDate: peak.d };
  }

  function daysBetween(a, b) { return Math.round((toTime(b) - toTime(a)) / DAY); }

  /*
   * Coût unitaire d'un article, en MAD HT.
   *  type 'mad' : historique en MAD
   *  type 'alu' : kg/unité × cours alu (MAD/kg) + façonnage (MAD/unité)
   *  type 'eur' : historique en EUR × cours EUR/MAD × (1 + frais d'approche)
   * Le tampon (buffer) ne s'applique qu'au plafond.
   */
  function unitCost(item, book, settings, today) {
    var pol = settings.policy;
    var buffer = item.buffer != null ? item.buffer : pol.buffer;
    var r, now, ceil, lastDate;
    if (item.type === 'alu') {
      var alu = seriesValue(book.alu_kg.hist, pol, today);
      now = item.kg * alu.now + item.fab;
      ceil = item.kg * alu.ceil + item.fab;
      lastDate = alu.lastDate;
    } else if (item.type === 'eur') {
      var fx = seriesValue(book.eur_mad.hist, pol, today);
      r = seriesValue(item.hist, pol, today);
      var landed = 1 + (item.landed != null ? item.landed : settings.landedEur);
      now = r.now * fx.now * landed;
      ceil = r.ceil * fx.ceil * landed;
      lastDate = r.lastDate;
    } else {
      r = seriesValue(item.hist, pol, today);
      now = r.now; ceil = r.ceil; lastDate = r.lastDate;
    }
    ceil = ceil * (1 + buffer);
    var age = lastDate ? daysBetween(lastDate, today) : Infinity;
    return { now: now, ceil: ceil, lastDate: lastDate, age: age, stale: !item.noStale && age > settings.staleDays };
  }

  function roundUp(x, step) { return step > 0 ? Math.ceil(x / step - 1e-9) * step : x; }

  /* Petits utilitaires offerts aux fonctions build() des produits. */
  var H = {
    ceil: Math.ceil,
    max: Math.max,
    min: Math.min,
    r1: function (x) { return Math.round(x * 10) / 10; },
    r2: function (x) { return Math.round(x * 100) / 100; }
  };

  /*
   * Chiffre une ligne produit (sans déplacement, qui se compte une fois par devis).
   */
  function priceLine(product, params, book, settings, today, ctx) {
    var p = {};
    product.params.forEach(function (d) { p[d.id] = params[d.id] != null ? params[d.id] : d.def; });
    var b = product.build(p, H, ctx || {});
    var accessMult = settings.access[(ctx && ctx.access) || 'normal'] || 1;
    var margin = settings.margins[product.id] != null ? settings.margins[product.id] : product.margin;
    var waste = product.waste != null ? product.waste : 0.05;
    var aluAdj = 1 + (b.aluSurcharge || 0);

    var tot = { now: { matiere: 0, equipement: 0, pose: 0 }, ceil: { matiere: 0, equipement: 0, pose: 0 } };
    var lines = [], stale = [], missing = [];

    b.lines.forEach(function (l) {
      if (!l.qty) return;
      var item = book[l.item];
      if (!item) { missing.push(l.item); return; }
      var uc = unitCost(item, book, settings, today);
      var mult = item.type === 'alu' ? aluAdj : 1;
      var cat = item.cat;
      var catMult = cat === 'pose' ? accessMult : cat === 'matiere' ? 1 + waste : 1;
      var lineNow = l.qty * uc.now * mult * catMult;
      var lineCeil = l.qty * uc.ceil * mult * catMult;
      tot.now[cat] += lineNow;
      tot.ceil[cat] += lineCeil;
      if (uc.stale) stale.push(item.name);
      lines.push({ item: l.item, name: item.name, unit: item.unit, cat: cat, qty: l.qty, note: l.note || '',
        puNow: uc.now * mult, puCeil: uc.ceil * mult, now: lineNow, ceil: lineCeil, stale: uc.stale, age: uc.age });
    });

    function sum(o) { return o.matiere + o.equipement + o.pose; }
    var costNow = sum(tot.now), costCeil = sum(tot.ceil);
    var saleHT = roundUp(costCeil / (1 - margin), settings.rounding);
    return {
      productId: product.id,
      productName: product.name,
      summary: b.summary || '',
      lines: lines,
      warnings: (b.warnings || []).concat(missing.map(function (m) { return 'Article introuvable dans le carnet : ' + m; })),
      stale: stale,
      laborDays: b.laborDays || 0,
      costNow: costNow,
      costCeil: costCeil,
      byCat: tot,
      margin: margin,
      saleHT: saleHT,
      // marge réellement obtenue si l'on achète au prix du jour
      marginIfToday: saleHT > 0 ? 1 - costNow / saleHT : 0,
      marginAtCeil: saleHT > 0 ? 1 - costCeil / saleHT : 0,
      cushion: costCeil - costNow
    };
  }

  /* Agrège plusieurs lignes en un devis : déplacement, hébergement, TVA. */
  function priceQuote(lineResults, settings, ctx) {
    var zone = settings.zones.filter(function (z) { return z.id === ctx.zone; })[0] || settings.zones[0];
    var days = lineResults.reduce(function (s, l) { return s + l.laborDays; }, 0);
    // une nuit d'hébergement par journée de chantier hors zone
    var nights = zone.lodging ? Math.ceil(days) : 0;
    var travel = lineResults.length ? zone.cost + nights * settings.lodgingPerNight : 0;
    travel = roundUp(travel, settings.rounding);
    var ht = lineResults.reduce(function (s, l) { return s + l.saleHT; }, 0) + travel;
    var discount = ctx.discount ? roundUp(ht * ctx.discount, settings.rounding) : 0;
    var htNet = ht - discount;
    var tva = htNet * settings.tva;
    var costNow = lineResults.reduce(function (s, l) { return s + l.costNow; }, 0) + travel;
    var costCeil = lineResults.reduce(function (s, l) { return s + l.costCeil; }, 0) + travel;
    return {
      zone: zone, laborDays: days, nights: nights, travel: travel,
      ht: ht, discount: discount, htNet: htNet, tva: tva, ttc: htNet + tva,
      costNow: costNow, costCeil: costCeil,
      marginIfToday: htNet > 0 ? 1 - costNow / htNet : 0,
      marginAtCeil: htNet > 0 ? 1 - costCeil / htNet : 0
    };
  }

  function addDays(d, n) {
    return new Date(toTime(d) + n * DAY).toISOString().slice(0, 10);
  }

  var api = { seriesValue: seriesValue, unitCost: unitCost, priceLine: priceLine, priceQuote: priceQuote,
    roundUp: roundUp, addDays: addDays, daysBetween: daysBetween };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SLEngine = api;
})(this);
