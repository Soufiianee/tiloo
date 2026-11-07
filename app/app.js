/* Store Luxe — interface du chiffrage. Dépend de SLCatalog et SLEngine. */
(function () {
  'use strict';
  var C = window.SLCatalog, E = window.SLEngine;
  var KEY = 'storeluxe-chiffrage-v2';
  var TODAY = new Date().toISOString().slice(0, 10);
  var PRODUCTS = C.PRODUCTS, SOURCES = C.SOURCES;
  var byId = {}; PRODUCTS.forEach(function (p) { byId[p.id] = p; });
  var TIER = {
    now: { l: 'Plancher', s: 'au prix du jour' },
    win: { l: 'Conseillé', s: 'plus haut des 12 derniers mois' },
    max: { l: 'Prudent', s: 'plus haut jamais relevé' }
  };

  /* ================= État ================= */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function freshState() {
    return {
      settings: clone(C.SETTINGS), book: clone(C.BOOK),
      site: { client: '', zone: 'agadir', access: 'normal', discount: 0 },
      current: { productId: PRODUCTS[0].id, params: {}, tier: null },
      cart: [], quoteNo: null, editing: null,
      aluCalc: { lme: 3065, premium: 500, conversion: 1900 }
    };
  }
  function merge(s, saved) {
    if (saved.settings) {
      Object.keys(saved.settings).forEach(function (k) { if (k !== 'policy' && k !== 'access') s.settings[k] = saved.settings[k]; });
      s.settings.policy = Object.assign({}, C.SETTINGS.policy, saved.settings.policy || {});
      s.settings.access = Object.assign({}, C.SETTINGS.access, saved.settings.access || {});
    }
    if (saved.book) Object.keys(saved.book).forEach(function (id) {
      var it = saved.book[id], cur = s.book[id];
      if (!cur || !it) return;
      if (Array.isArray(it.hist) && it.hist.length) cur.hist = it.hist;
      ['kg', 'fab', 'buffer', 'max'].forEach(function (k) { if (it[k] != null) cur[k] = it[k]; });
    });
    ['site', 'aluCalc'].forEach(function (k) { if (saved[k]) Object.assign(s[k], saved[k]); });
    if (saved.current && byId[saved.current.productId]) s.current = Object.assign({ params: {}, tier: null }, saved.current);
    if (Array.isArray(saved.cart)) s.cart = saved.cart.filter(function (l) { return byId[l.productId]; });
    if (saved.quoteNo) s.quoteNo = saved.quoteNo;
  }
  function load() {
    var s = freshState();
    try { var raw = localStorage.getItem(KEY); if (raw) merge(s, JSON.parse(raw)); } catch (e) { /* stockage indisponible */ }
    s.editing = null;
    return s;
  }
  var S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignoré */ } }

  /* ================= Utilitaires ================= */
  var nf0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
  var nf2 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
  function mad(x) { return nf0.format(Math.round(x)) + ' MAD'; }
  function m2(x) { return nf2.format(Math.round(x * 100) / 100); }
  function pct(x) { return (x * 100).toFixed(1).replace('.', ',') + ' %'; }
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function frDate(d) { return d ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : '—'; }
  function tva() { return 1 + S.settings.tva; }
  var toastT;
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 2400); }
  function copy(text, okMsg) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      toast(ok ? okMsg : 'Copie refusée par le navigateur : sélectionnez le texte à la main');
    }
    try { navigator.clipboard.writeText(text).then(function () { toast(okMsg); }, fallback); } catch (e) { fallback(); }
  }
  function ctx() { return { access: S.site.access, zone: S.site.zone, discount: +S.site.discount || 0 }; }
  function price(productId, params) { return E.priceLine(byId[productId], params, S.book, S.settings, TODAY, ctx()); }
  function curTier() { return S.current.tier || S.settings.policy.base; }
  function srcLink(key, short) {
    var s = SOURCES[key]; if (!s) return '';
    var label = short ? s.label.split(' — ')[0] : s.label;
    return s.url ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(label) + '</a>' : esc(label);
  }

  /* ================= Icônes produits ================= */
  var IC = {
    bioclim: '<rect x="3" y="6" width="18" height="4" rx=".5"/><path d="M5 6v4M8 6v4M11 6v4M14 6v4M17 6v4M20 6v4"/><path d="M5 10v10M19 10v10M3 20h18"/>',
    toile: '<path d="M3 7h18"/><path d="M3 7c2 2 4 2 6 0s4-2 6 0 4 2 6 0"/><path d="M5 7v13M19 7v13M3 20h18"/>',
    fixe: '<path d="M2 8l10-3 10 3"/><path d="M4 7.5v12.5M20 7.5v12.5M2 20h20"/><path d="M8 6.5v1.5M12 5v2M16 6.5v1.5"/>',
    veranda: '<path d="M3 9l9-5 9 5"/><rect x="4" y="9" width="16" height="11"/><path d="M9.3 9v11M14.7 9v11M4 14h16"/>',
    carport: '<path d="M2 7h20"/><path d="M4 7v13M20 7v13"/><path d="M7 17v-2.5l1.5-2.5h7l1.5 2.5V17z"/><circle cx="9" cy="17.5" r="1"/><circle cx="15" cy="17.5" r="1"/>',
    voile: '<path d="M4 5l16 3-9 9z"/><path d="M4 5v15M20 8v12"/><path d="M2 20h20"/>',
    banne: '<path d="M4 3v18"/><rect x="4" y="5" width="4" height="3"/><path d="M8 6.5l12 4.5v2l-2 1"/><path d="M8 6.5l12 4.5" stroke-dasharray="2 2"/><path d="M2 21h20"/>',
    zip: '<rect x="4" y="3" width="16" height="3"/><path d="M5 6v15M19 6v15"/><path d="M6 6h12v12H6z" fill="currentColor" fill-opacity=".18"/><path d="M6 18h12"/>',
    enrouleur: '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M5 5h14"/><path d="M6 5v9h12V5" fill="currentColor" fill-opacity=".18"/><path d="M12 14v3"/>',
    journuit: '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M6 6h12v3H6zM6 12h12v3H6z" fill="currentColor" fill-opacity=".35"/><path d="M6 9h12M6 15h12M6 18h12"/>',
    venitien: '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M6 7h12M6 10h12M6 13h12M6 16h12"/><path d="M17 5v14"/>',
    moustiquaire: '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M7 3v18M11 3v18M15 3v18M3 7h18M3 11h18M3 15h18" stroke-width=".8"/>'
  };
  function icon(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }

  /* ================= Dessins cotés ================= */
  function dimH(x1, x2, y, label) {
    return '<path class="sv-dim" d="M' + x1 + ' ' + y + 'H' + x2 + 'M' + x1 + ' ' + (y - 5) + 'v10M' + x2 + ' ' + (y - 5) + 'v10"/>' +
      '<text class="sv-txt" x="' + ((x1 + x2) / 2) + '" y="' + (y + 17) + '" text-anchor="middle">' + label + '</text>';
  }
  function dimV(x, y1, y2, label) {
    return '<path class="sv-dim" d="M' + x + ' ' + y1 + 'V' + y2 + 'M' + (x - 5) + ' ' + y1 + 'h10M' + (x - 5) + ' ' + y2 + 'h10"/>' +
      '<text class="sv-txt" x="' + (x + 9) + '" y="' + ((y1 + y2) / 2 + 4) + '">' + label + '</text>';
  }
  var nfDim = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function m(x) { return nfDim.format(x) + ' m'; }
  function f1(x) { return Math.round(x * 10) / 10; }

  function drawPlan(g) {
    var s = Math.min(520 / g.L, 210 / g.P), w = g.L * s, h = g.P * s;
    var x0 = 30, y0 = g.wall ? 46 : 22, W = w + 120, Hh = y0 + h + 52;
    var o = '<svg viewBox="0 0 ' + f1(W) + ' ' + f1(Hh) + '" role="img" aria-label="Vue de dessus cotée">';
    if (g.wall) {
      o += '<rect class="sv-wall" x="' + (x0 - 12) + '" y="' + (y0 - 16) + '" width="' + f1(w + 24) + '" height="12"/>';
      o += '<text class="sv-lab" x="' + f1(x0 + w / 2) + '" y="' + (y0 - 24) + '" text-anchor="middle">Façade</text>';
    }
    o += '<rect class="' + (g.roof === 'plein' ? 'sv-roof-glass' : 'sv-roof') + '" x="' + x0 + '" y="' + y0 + '" width="' + f1(w) + '" height="' + f1(h) + '"/>';
    var i, x, y;
    if (g.roof === 'lames') {
      var step = Math.max(4, 0.2 * s);
      for (y = y0 + step; y < y0 + h - 1; y += step) o += '<path class="sv-thin" d="M' + x0 + ' ' + f1(y) + 'h' + f1(w) + '"/>';
      for (i = 1; i < g.modules; i++) { x = x0 + w * i / g.modules; o += '<path class="sv-beam" d="M' + f1(x) + ' ' + y0 + 'v' + f1(h) + '"/>'; }
    } else if (g.roof === 'toile') {
      var st = Math.max(8, 0.5 * s), k = 0;
      for (y = y0; y < y0 + h - 1; y += st, k++) if (k % 2) o += '<rect class="sv-fabric-2" x="' + x0 + '" y="' + f1(y) + '" width="' + f1(w) + '" height="' + f1(Math.min(st, y0 + h - y)) + '"/>';
      for (i = 0; i <= g.modules; i++) { x = x0 + w * i / g.modules; o += '<path class="sv-beam" d="M' + f1(x) + ' ' + y0 + 'v' + f1(h) + '"/>'; }
    } else if (g.roof === 'chevrons') {
      var pc = Math.max(5, (g.pitch || 0.9) * s);
      for (x = x0 + pc; x < x0 + w - 1; x += pc) o += '<path class="sv-thin" d="M' + f1(x) + ' ' + y0 + 'v' + f1(h) + '"/>';
    } else if (g.roof === 'plein') {
      for (i = 1; i < 4; i++) o += '<path class="sv-thin" d="M' + f1(x0 + w * i / 4 - 12) + ' ' + f1(y0 + h - 6) + 'l24 ' + f1(-h + 12) + '"/>';
    }
    if (g.cars) {
      var lp = w / g.cars;
      for (i = 0; i < g.cars; i++) o += '<rect class="sv-car" x="' + f1(x0 + lp * i + lp * 0.17) + '" y="' + f1(y0 + h * 0.08) + '" width="' + f1(lp * 0.66) + '" height="' + f1(h * 0.84) + '" rx="10"/>';
    }
    (g.sides || []).forEach(function (sd) {
      var cls = sd.type === 'verre' ? 'sv-verre' : 'sv-zip', d;
      if (sd.side === 'front') d = 'M' + x0 + ' ' + f1(y0 + h + 5) + 'h' + f1(w);
      else if (sd.side === 'back') d = 'M' + x0 + ' ' + (y0 - 5) + 'h' + f1(w);
      else if (sd.side === 'left') d = 'M' + (x0 - 5) + ' ' + y0 + 'v' + f1(h);
      else d = 'M' + f1(x0 + w + 5) + ' ' + y0 + 'v' + f1(h);
      o += '<path class="' + cls + '" d="' + d + '"/>';
    });
    var ps = Math.max(7, 0.15 * s);
    (g.posts || []).forEach(function (p) {
      o += '<rect class="sv-post" x="' + f1(x0 + p[0] * s - ps / 2) + '" y="' + f1(y0 + p[1] * s - ps / 2) + '" width="' + f1(ps) + '" height="' + f1(ps) + '" rx="1"/>';
    });
    o += dimH(x0, f1(x0 + w), f1(y0 + h + 20), m(g.L));
    o += dimV(f1(x0 + w + 22), y0, f1(y0 + h), m(g.P));
    return o + '</svg>';
  }

  function drawBanne(g) {
    var s = 66, A = g.A * s, drop = Math.tan(14 * Math.PI / 180) * A;
    var wx = 40, top = 34, ground = 250;
    var o = '<svg viewBox="0 0 ' + f1(wx + A + 150) + ' 290" role="img" aria-label="Vue de profil cotée">';
    o += '<rect class="sv-wall" x="' + (wx - 16) + '" y="14" width="16" height="' + (ground - 14) + '"/>';
    o += '<path class="sv-ground" d="M10 ' + ground + 'H' + f1(wx + A + 130) + '"/>';
    var bx = wx, by = top;
    if (g.type === 'banne_coffre') o += '<rect class="sv-roof" x="' + bx + '" y="' + by + '" width="30" height="24" rx="4"/>';
    else if (g.type === 'banne_semicoffre') o += '<path class="sv-roof" d="M' + bx + ' ' + by + 'h26q4 0 4 10v6h-30z"/>';
    else o += '<rect class="sv-roof" x="' + bx + '" y="' + (by + 6) + '" width="16" height="12"/>';
    var sx = wx + 26, sy = by + 12, ex = f1(sx + A), ey = f1(sy + drop);
    // toile (plan incliné) + lambrequin au bout
    o += '<path class="sv-fabric" d="M' + sx + ' ' + (sy - 3) + 'L' + ex + ' ' + f1(ey - 3) + 'L' + ex + ' ' + f1(ey + 3) + 'L' + sx + ' ' + (sy + 3) + 'Z"/>';
    o += '<path class="sv-fabric" d="M' + f1(ex - 3) + ' ' + f1(ey - 3) + 'h5v24h-5z"/>';
    // bras articulés sous la toile
    o += '<path class="sv-beam" d="M' + (wx + 6) + ' ' + (sy + 26) + 'L' + f1(sx + A * 0.45) + ' ' + f1(sy + drop * 0.45 + 22) + 'L' + f1(ex - 2) + ' ' + f1(ey + 3) + '"/>';
    o += '<circle class="sv-anchor" cx="' + (wx + 6) + '" cy="' + (sy + 26) + '" r="3"/>';
    o += dimH(wx, ex, ground + 16, 'avancée ' + m(g.A));
    o += '<text class="sv-lab" x="' + (wx + 44) + '" y="24">largeur ' + m(g.W) + '</text>';
    return o + '</svg>';
  }

  function drawFront(g) {
    var s = Math.min(300 / g.W, 220 / g.H), w = g.W * s, h = g.H * s, x0 = 40, y0 = 26, box = (g.pattern === 'zip' || g.coffre) ? 14 : 0;
    var W = w + 130, Hh = y0 + box + h + 50;
    var o = '<svg viewBox="0 0 ' + f1(W) + ' ' + f1(Hh) + '" role="img" aria-label="Vue de face cotée">';
    var fy = y0 + box;
    if (box) o += '<rect class="sv-roof" x="' + (x0 - 4) + '" y="' + y0 + '" width="' + f1(w + 8) + '" height="' + box + '" rx="2"/>';
    if (g.pattern === 'mesh') o += '<rect x="' + x0 + '" y="' + fy + '" width="' + f1(w) + '" height="' + f1(h) + '" style="fill:url(#mesh);stroke:var(--ink);stroke-width:3"/>';
    else if (g.pattern === 'slats') {
      o += '<rect class="sv-roof" x="' + x0 + '" y="' + fy + '" width="' + f1(w) + '" height="' + f1(h) + '"/>';
      for (var y = fy + 6; y < fy + h; y += 7) o += '<path class="sv-beam" d="M' + (x0 + 2) + ' ' + f1(y) + 'h' + f1(w - 4) + '"/>';
    } else if (g.pattern === 'daynight') {
      o += '<rect class="sv-fabric" x="' + x0 + '" y="' + fy + '" width="' + f1(w) + '" height="' + f1(h) + '"/>';
      for (var yy = fy, k = 0; yy < fy + h; yy += 12, k++) if (k % 2) o += '<rect class="sv-fabric-2" x="' + x0 + '" y="' + f1(yy) + '" width="' + f1(w) + '" height="' + f1(Math.min(12, fy + h - yy)) + '"/>';
    } else {
      o += '<rect class="sv-fabric" x="' + x0 + '" y="' + fy + '" width="' + f1(w) + '" height="' + f1(h) + '"/>';
      o += '<rect class="sv-post" x="' + (x0 - 2) + '" y="' + f1(fy + h - 5) + '" width="' + f1(w + 4) + '" height="5"/>';
      if (g.pattern === 'zip') o += '<path class="sv-zip" style="stroke-width:4" d="M' + (x0 - 3) + ' ' + fy + 'v' + f1(h) + 'M' + f1(x0 + w + 3) + ' ' + fy + 'v' + f1(h) + '"/>';
    }
    o += dimH(x0, f1(x0 + w), f1(fy + h + 18), m(g.W));
    o += dimV(f1(x0 + w + 20), fy, f1(fy + h), m(g.H));
    if (g.n > 1) o += '<text class="sv-lab" x="' + f1(x0 + w + 20) + '" y="16" style="font-size:13px;fill:var(--accent)">× ' + g.n + '</text>';
    return o + '</svg>';
  }

  function drawVoile(g) {
    var xs = g.pts.map(function (p) { return p[0]; }), ys = g.pts.map(function (p) { return p[1]; });
    var minx = Math.min.apply(null, xs), maxx = Math.max.apply(null, xs), miny = Math.min.apply(null, ys), maxy = Math.max.apply(null, ys);
    var s = Math.min(460 / Math.max(0.1, maxx - minx), 210 / Math.max(0.1, maxy - miny)), x0 = 50, y0 = 30;
    var P = g.pts.map(function (p) { return [x0 + (p[0] - minx) * s, y0 + (p[1] - miny) * s]; });
    var cx = P.reduce(function (a, p) { return a + p[0]; }, 0) / P.length, cy = P.reduce(function (a, p) { return a + p[1]; }, 0) / P.length;
    var W = (maxx - minx) * s + 120, Hh = (maxy - miny) * s + 70;
    var o = '<svg viewBox="0 0 ' + f1(W) + ' ' + f1(Hh) + '" role="img" aria-label="Forme de la voile cotée">';
    var d = 'M' + f1(P[0][0]) + ' ' + f1(P[0][1]);
    for (var i = 0; i < P.length; i++) {
      var a = P[i], b = P[(i + 1) % P.length], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      d += 'Q' + f1(mx + (cx - mx) * 0.12) + ' ' + f1(my + (cy - my) * 0.12) + ' ' + f1(b[0]) + ' ' + f1(b[1]);
    }
    o += '<path class="sv-fabric" d="' + d + 'Z"/>';
    for (i = 0; i < P.length; i++) {
      var p = P[i], q = P[(i + 1) % P.length];
      var len = Math.hypot(g.pts[i][0] - g.pts[(i + 1) % P.length][0], g.pts[i][1] - g.pts[(i + 1) % P.length][1]);
      var lx = (p[0] + q[0]) / 2 + ((p[0] + q[0]) / 2 - cx) * 0.18, ly = (p[1] + q[1]) / 2 + ((p[1] + q[1]) / 2 - cy) * 0.18;
      o += '<text class="sv-txt" x="' + f1(lx) + '" y="' + f1(ly + 4) + '" text-anchor="middle">' + m(len) + '</text>';
    }
    P.forEach(function (p, j) {
      if (j < g.mats) o += '<circle class="sv-mast" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="8"/><circle class="sv-anchor" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="3"/>';
      else o += '<rect class="sv-anchor" x="' + f1(p[0] - 5) + '" y="' + f1(p[1] - 5) + '" width="10" height="10"/>';
    });
    return o + '</svg>';
  }
  function draw(g) {
    if (!g) return '';
    return g.kind === 'plan' ? drawPlan(g) : g.kind === 'banne' ? drawBanne(g) : g.kind === 'front' ? drawFront(g) : g.kind === 'voile' ? drawVoile(g) : '';
  }
  function legendFor(g) {
    var out = [];
    if (!g) return out;
    if (g.kind === 'plan') {
      out.push('<span class="pill"><svg width="10" height="10"><rect width="10" height="10" style="fill:var(--ink)"/></svg>' + (g.posts || []).length + ' poteaux</span>');
      if (g.modules > 1) out.push('<span class="pill">' + g.modules + ' modules</span>');
      if ((g.sides || []).some(function (x) { return x.type === 'zip'; })) out.push('<span class="pill acc">Stores ZIP</span>');
      if ((g.sides || []).some(function (x) { return x.type === 'verre'; })) out.push('<span class="pill" style="color:var(--glass)">Vitrage</span>');
      if (g.wall) out.push('<span class="pill">Adossée</span>');
    }
    if (g.kind === 'voile') out.push('<span class="pill">● mât</span><span class="pill">■ ancrage façade</span>');
    return out;
  }

  /* ================= Onglets ================= */
  var TABS = ['configurer', 'devis', 'prix', 'etude', 'reglages'];
  function route() {
    var h = (location.hash || '#configurer').slice(1), t = h;
    if (h.indexOf('e-') === 0) t = 'etude';
    if (TABS.indexOf(t) < 0) t = 'configurer';
    TABS.forEach(function (k) { $('v-' + k).hidden = k !== t; });
    document.querySelectorAll('.tabs a').forEach(function (a) { if (a.dataset.tab === t) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    $('mbar').hidden = t !== 'configurer';
    if (t === 'devis') renderDoc();
    if (t === 'prix') renderBook();
    if (t === 'reglages') renderSettings();
    if (h.indexOf('e-') === 0) { var el = $(h); if (el) el.scrollIntoView(); } else window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  function go(tab) { if (location.hash === '#' + tab) route(); else location.hash = tab; }

  /* ================= Chantier ================= */
  function renderSite() {
    $('c-zone').innerHTML = S.settings.zones.map(function (z) { return '<option value="' + esc(z.id) + '">' + esc(z.name) + (z.cost ? ' · ' + nf0.format(z.cost) + ' MAD' : '') + '</option>'; }).join('');
    $('c-client').value = S.site.client; $('c-zone').value = S.site.zone; $('c-access').value = S.site.access; $('c-disc').value = String(S.site.discount || 0);
  }
  ['c-client', 'c-zone', 'c-access', 'c-disc'].forEach(function (id) {
    $(id).addEventListener('input', function () {
      S.site.client = $('c-client').value; S.site.zone = $('c-zone').value; S.site.access = $('c-access').value; S.site.discount = +$('c-disc').value;
      save(); renderResult();
    });
  });

  /* ================= Catalogue ================= */
  function renderCatalog() {
    var fam = null, h = '';
    PRODUCTS.forEach(function (p) {
      if (p.family !== fam) { fam = p.family; h += '<h3>' + esc(fam) + '</h3>'; }
      h += '<button type="button" data-p="' + p.id + '" aria-pressed="' + (p.id === S.current.productId) + '">' + icon(p.icon) + '<span><b>' + esc(p.short) + '</b><small>' + esc(p.blurb) + '</small></span></button>';
    });
    $('catalog').innerHTML = h;
  }
  $('catalog').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-p]'); if (!b) return;
    if (S.current.productId !== b.dataset.p) { S.current = { productId: b.dataset.p, params: {}, tier: null }; S.editing = null; save(); }
    renderCatalog(); renderForm(); renderResult();
  });

  /* ================= Formulaire ================= */
  function field(d, v) {
    var id = 'f-' + d.id;
    if (d.type === 'number' || d.type === 'count') {
      var step = d.type === 'count' ? 1 : (d.step || 0.1);
      return '<div class="fld"><label for="' + id + '">' + esc(d.label) + '</label><div class="numbox">' +
        '<button type="button" data-step="-' + step + '" data-f="' + d.id + '" aria-label="Diminuer ' + esc(d.label) + '">−</button>' +
        '<input id="' + id + '" data-f="' + d.id + '" type="number" inputmode="decimal" min="' + d.min + '" max="' + d.max + '" step="' + step + '" value="' + v + '">' +
        '<span class="u">' + esc(d.unit || '') + '</span>' +
        '<button type="button" data-step="' + step + '" data-f="' + d.id + '" aria-label="Augmenter ' + esc(d.label) + '">+</button></div></div>';
    }
    if (d.type === 'seg') {
      return '<div class="fld full"><span class="lbl">' + esc(d.label) + '</span><div class="seg" role="group" aria-label="' + esc(d.label) + '">' +
        d.options.map(function (o) { return '<button type="button" data-f="' + d.id + '" data-v="' + esc(o.v) + '" aria-pressed="' + (String(v) === String(o.v)) + '">' + esc(o.l) + '</button>'; }).join('') + '</div></div>';
    }
    if (d.type === 'select') {
      return '<div class="fld"><label for="' + id + '">' + esc(d.label) + '</label><select class="inp" id="' + id + '" data-f="' + d.id + '">' +
        d.options.map(function (o) { return '<option value="' + esc(o.v) + '"' + (o.v === v ? ' selected' : '') + '>' + esc(o.l) + '</option>'; }).join('') + '</select></div>';
    }
    if (d.type === 'toggle') return '<div class="fld"><label class="tog"><input type="checkbox" id="' + id + '" data-f="' + d.id + '"' + (v ? ' checked' : '') + '> ' + esc(d.label) + '</label></div>';
    if (d.type === 'ral') {
      return '<div class="fld full"><span class="lbl">' + esc(d.label) + '</span><div class="sw">' + d.options.map(function (o) {
        return '<button type="button" data-f="' + d.id + '" data-v="' + o.v + '" aria-pressed="' + (v === o.v) + '"><span class="chips">' +
          o.sw.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</span><b>' + esc(o.l) + '</b><small>' + esc(o.sub) + '</small></button>';
      }).join('') + '</div></div>';
    }
    return '';
  }
  function renderForm() {
    var prod = byId[S.current.productId], p = E.fullParams(prod, S.current.params);
    var h = '<div class="cfg-head"><div><h2>' + esc(prod.name) + '</h2><p class="lede">' + esc(prod.blurb) + '</p></div>' +
      '<div class="row">' + (S.editing ? '<span class="pill warn">Modification d’une ligne du devis</span>' : '') +
      '<button class="btn sm ghost" type="button" id="f-reset">Valeurs par défaut</button></div></div>';
    h += '<div class="plan" id="plan"></div>';
    var secs = [], bySec = {};
    prod.params.forEach(function (d) {
      if (d.showIf && !d.showIf(p)) return;
      var s = d.sec || 'Options';
      if (!bySec[s]) { bySec[s] = []; secs.push(s); }
      bySec[s].push(field(d, p[d.id]));
    });
    secs.forEach(function (s) { h += '<div class="sec"><h3>' + esc(s) + '</h3><div class="grid">' + bySec[s].join('') + '</div></div>'; });
    $('form').innerHTML = h;
  }
  function visibleCount() {
    var prod = byId[S.current.productId], p = E.fullParams(prod, S.current.params);
    return prod.params.filter(function (d) { return !d.showIf || d.showIf(p); }).length;
  }
  function setParam(f, v) {
    var d = byId[S.current.productId].params.filter(function (x) { return x.id === f; })[0];
    if (!d) return;
    if (d.type === 'number' || d.type === 'count') {
      v = parseFloat(String(v).replace(',', '.')); if (isNaN(v)) return false;
      v = Math.min(d.max, Math.max(d.min, v));
      v = d.type === 'count' ? Math.round(v) : Math.round(v * 1000) / 1000;
    }
    var before = visibleCount();
    S.current.params[f] = v; save();
    return before !== visibleCount();
  }
  $('form').addEventListener('click', function (e) {
    if (e.target.id === 'f-reset') { S.current.params = {}; save(); renderForm(); renderResult(); return; }
    var b = e.target.closest('button[data-f]'); if (!b) return;
    if (b.dataset.step) {
      var inp = $('f-' + b.dataset.f);
      var changed = setParam(b.dataset.f, (parseFloat(inp.value) || 0) + parseFloat(b.dataset.step));
      if (changed) renderForm(); else inp.value = E.fullParams(byId[S.current.productId], S.current.params)[b.dataset.f];
    } else { setParam(b.dataset.f, b.dataset.v); renderForm(); }
    renderResult();
  });
  $('form').addEventListener('input', function (e) {
    var el = e.target; if (!el.dataset || !el.dataset.f) return;
    var changed;
    if (el.type === 'checkbox') changed = setParam(el.dataset.f, el.checked);
    else if (el.tagName === 'SELECT') { setParam(el.dataset.f, el.value); changed = true; }
    else changed = setParam(el.dataset.f, el.value);
    if (changed) { renderForm(); var again = $('f-' + el.dataset.f); if (again && el.type === 'number') again.focus(); }
    renderResult();
  });
  $('form').addEventListener('change', function (e) {
    var el = e.target; if (el.type === 'number') el.value = E.fullParams(byId[S.current.productId], S.current.params)[el.dataset.f];
  });

  /* ================= Prix ================= */
  var last = null;
  function marketBlock(prod, r, t) {
    if (!prod.market || !prod.market.length) return '';
    var ttc = r.sale[t] * tva();
    var h = '<div class="mkt"><h3>Repère marché</h3>';
    prod.market.forEach(function (mk) {
      var ours = mk.unit === 'm²' ? (r.area ? ttc / r.area : 0) : ttc;
      if (!ours) return;
      var lo = Math.min(mk.low, ours) * 0.85, hi = Math.max(mk.high, ours) * 1.08;
      function pos(v) { return ((v - lo) / (hi - lo) * 100).toFixed(1); }
      var where = ours < mk.low ? 'sous la fourchette' : ours > mk.high ? 'au-dessus' : 'dans la fourchette';
      h += '<div class="mkt-row"><div class="sub"><span>' + esc(mk.label) + '</span><span class="num">' + nf0.format(mk.low) + '–' + nf0.format(mk.high) + (mk.unit === 'm²' ? '/m²' : '') + '</span></div>' +
        '<div class="mkt-track" title="Votre prix : ' + nf0.format(ours) + (mk.unit === 'm²' ? ' MAD/m²' : ' MAD') + '"><span class="rail-line"></span><span class="band" style="left:' + pos(mk.low) + '%;width:' + (pos(mk.high) - pos(mk.low)).toFixed(1) + '%"></span><span class="dot" style="left:' + pos(ours) + '%"></span></div>' +
        '<div class="sub"><span>Vous : <b class="num" style="color:var(--ink)">' + nf0.format(ours) + (mk.unit === 'm²' ? ' MAD/m²' : ' MAD') + '</b>, ' + where + '</span><span class="src">' + srcLink(mk.src, true) + '</span></div></div>';
    });
    return h + '</div>';
  }
  function renderResult() {
    var prod = byId[S.current.productId];
    var r = last = price(S.current.productId, S.current.params), t = curTier();
    var sale = r.sale[t], cost = r.cost[t];
    var cushion = cost - r.cost.now, marginAmt = sale - cost;
    // plan
    var plan = $('plan');
    if (plan) plan.innerHTML = draw(r.geo) + '<div class="plan-facts">' + legendFor(r.geo).join('') + (r.area ? '<span class="pill">' + m2(r.area) + ' m²</span>' : '') + '<span class="pill">' + nf2.format(r.laborDays) + ' j de pose</span></div>';
    var h = '<div class="price">';
    h += '<div><h3>' + esc(r.productName) + '</h3><div class="sub">' + esc(r.summary) + '</div></div>';
    h += '<div><div class="ttc">' + nf0.format(sale * tva()) + ' <small>MAD TTC</small></div><div class="sub num">' + mad(sale) + ' HT · fourniture et pose · hors déplacement</div></div>';
    h += '<div class="tiers" role="group" aria-label="Niveau de prix">' + E.TIERS.map(function (k) {
      return '<button type="button" class="tier" data-tier="' + k + '" aria-pressed="' + (k === t) + '"><i></i><span><b>' + TIER[k].l + (k === S.settings.policy.base ? ' <span class="pill">par défaut</span>' : '') + '</b><small>' + TIER[k].s + '</small></span><span class="num">' + nf0.format(r.sale[k] * tva()) + '</span></button>';
    }).join('') + '</div>';
    h += '<div class="bar" role="img" aria-label="Coût du jour, coussin et marge"><i class="b-now" style="width:' + (r.cost.now / sale * 100).toFixed(1) + '%"></i><i class="b-cush" style="width:' + (Math.max(0, cushion) / sale * 100).toFixed(1) + '%"></i><i class="b-mar" style="flex:1"></i></div>';
    h += '<div class="legend">' +
      '<div><span><em style="background:var(--accent)"></em>Coût au prix du jour</span><b class="num">' + mad(r.cost.now) + '</b></div>' +
      '<div><span><em style="background:repeating-linear-gradient(135deg,var(--hatch) 0 3px,transparent 3px 6px);border:1px solid var(--accent)"></em>Coussin contre les hausses</span><b class="num">+ ' + mad(Math.max(0, cushion)) + '</b></div>' +
      '<div><span><em style="background:var(--good-soft);border:1px solid var(--good)"></em>Marge cible ' + pct(r.margin) + '</span><b class="num">' + mad(marginAmt) + '</b></div></div>';
    h += '<div class="kpis"><div class="kpi good"><span>Marge si achat aujourd’hui</span><b>' + pct(sale > 0 ? 1 - r.cost.now / sale : 0) + '</b></div><div class="kpi"><span>Prix au m²</span><b>' + (r.area ? nf0.format(sale * tva() / r.area) : '—') + '</b></div></div>';
    h += marketBlock(prod, r, t);
    var al = r.warnings.map(function (w) { return '<div class="alert">' + esc(w) + '</div>'; });
    if (r.stale.length) al.push('<div class="alert info">' + r.stale.length + ' prix de l’étude à confirmer auprès de vos fournisseurs (onglet Prix &amp; sources).</div>');
    if (al.length) h += '<div class="alerts">' + al.join('') + '</div>';
    if (S.editing) h += '<div class="row"><button class="btn pri" type="button" id="r-update" style="flex:1">Mettre à jour la ligne</button><button class="btn" type="button" id="r-cancel">Annuler</button></div>';
    else h += '<div class="row"><button class="btn pri" type="button" id="r-add" style="flex:1">Ajouter au devis</button><button class="btn" type="button" id="r-copy">Copier le prix</button></div>';
    h += '</div>';
    // détail interne
    var cats = { matiere: 'Matière (avec chutes)', equipement: 'Équipements', pose: 'Pose (coef. accès)' };
    h += '<details class="det"><summary>Détail des coûts · ' + TIER[t].l.toLowerCase() + '</summary><div class="tbl-wrap"><table><thead><tr><th>Poste</th><th class="r">Qté</th><th class="r">PU</th><th class="r">Total</th></tr></thead><tbody>';
    Object.keys(cats).forEach(function (c) {
      var ls = r.lines.filter(function (l) { return l.cat === c; }); if (!ls.length) return;
      h += '<tr class="grp"><td colspan="3">' + cats[c] + '</td><td class="r num">' + nf0.format(r.byCat[t][c]) + '</td></tr>';
      ls.forEach(function (l) {
        h += '<tr><td>' + esc(l.name) + (l.note ? '<small>' + esc(l.note) + '</small>' : '') + '</td><td class="r num">' + nf2.format(l.qty) + ' ' + esc(l.unit) + '</td><td class="r num">' + nf0.format(l['pu_' + t]) + '</td><td class="r num">' + nf0.format(l[t]) + '</td></tr>';
      });
    });
    h += '<tr class="grp"><td colspan="3">Coût total</td><td class="r num">' + nf0.format(cost) + '</td></tr></tbody></table></div></details>';
    $('result').innerHTML = h;
    $('mbar-l').textContent = 'Prix ' + TIER[t].l.toLowerCase() + ' TTC';
    $('mbar-p').textContent = nf0.format(sale * tva()) + ' MAD';
    $('mbar-add').textContent = S.editing ? 'Mettre à jour' : 'Ajouter au devis';
  }
  function addOrUpdate() {
    var entry = { productId: S.current.productId, params: clone(E.fullParams(byId[S.current.productId], S.current.params)), tier: curTier() };
    if (S.editing) {
      S.cart = S.cart.map(function (l) { return l.uid === S.editing ? Object.assign({ uid: l.uid }, entry) : l; });
      S.editing = null; save(); renderForm(); renderResult(); renderCount(); toast('Ligne mise à jour'); go('devis'); return;
    }
    if (!S.cart.length || !S.quoteNo) S.quoteNo = 'SL-' + TODAY.replace(/-/g, '').slice(2) + '-' + Math.random().toString(36).slice(2, 5).toUpperCase();
    entry.uid = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    S.cart.push(entry); save(); renderCount();
    toast('Ajouté au devis (' + S.cart.length + ' ligne' + (S.cart.length > 1 ? 's' : '') + ')');
  }
  $('result').addEventListener('click', function (e) {
    var tb = e.target.closest('[data-tier]');
    if (tb) { S.current.tier = tb.dataset.tier; save(); renderResult(); return; }
    if (e.target.id === 'r-add' || e.target.id === 'r-update') addOrUpdate();
    if (e.target.id === 'r-cancel') { S.editing = null; renderForm(); renderResult(); go('devis'); }
    if (e.target.id === 'r-copy' && last) {
      var t = curTier();
      copy(last.productName + ' — ' + last.summary + (last.details.length ? ' (' + last.details.join(', ') + ')' : '') + ' : ' + mad(last.sale[t] * tva()) + ' TTC, fourniture et pose, à confirmer après relevé.', 'Prix copié');
    }
  });
  $('mbar-add').addEventListener('click', addOrUpdate);

  /* ================= Devis ================= */
  function renderCount() { var c = $('cart-count'); c.textContent = S.cart.length; c.hidden = !S.cart.length; }
  function quote() {
    var entries = S.cart.map(function (l) { return { uid: l.uid, tier: l.tier, line: price(l.productId, l.params) }; });
    return { entries: entries, q: E.priceQuote(entries, S.settings, ctx()) };
  }
  function renderDoc() {
    var d = quote(), q = d.q, T = tva();
    var zone = q.zone.name.split(' (')[0];
    if (!d.entries.length) {
      $('doc').innerHTML = '<div class="empty-state">' + icon('bioclim') + '<h2>Aucun produit dans le devis</h2><p>Configurez un produit, puis « Ajouter au devis ». Un devis peut réunir plusieurs produits, par exemple une pergola et ses stores ZIP.</p><button class="btn pri" type="button" data-go="configurer">Configurer un produit</button></div>';
      $('doc-side').innerHTML = '';
      return;
    }
    var h = '<div class="doc-head"><div class="brand">' + document.querySelector('.brand svg').outerHTML + '<div><b>Store Luxe</b><span class="sub">Pergolas, vérandas et stores sur mesure · depuis 1999</span></div></div>' +
      '<div class="doc-meta"><b>Devis estimatif</b><span class="num">' + esc(S.quoteNo || '') + '</span><span>Le ' + frDate(TODAY) + '</span><span>Valable jusqu’au ' + frDate(E.addDays(TODAY, S.settings.validityDays)) + '</span></div></div>';
    h += '<div class="doc-to"><div><span>Client</span><b>' + esc(S.site.client || 'À préciser') + '</b></div><div><span>Chantier</span><b>' + esc(zone) + '</b></div><div><span>Prestation</span><b>Fourniture et pose</b></div></div>';
    h += '<div>';
    d.entries.forEach(function (e, i) {
      var r = e.line, t = e.tier || r.base;
      h += '<div class="qline"><span class="n">' + String(i + 1).padStart(2, '0') + '</span><div><b>' + esc(r.productName) + '</b><div class="sub">' + esc(r.summary) + '</div>' +
        (r.details.length ? '<ul>' + r.details.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') + '</div>' +
        '<div><div class="amt">' + nf0.format(r.sale[t]) + ' HT</div><div class="tools">' +
        '<select data-tierline="' + e.uid + '" aria-label="Niveau de prix de la ligne ' + (i + 1) + '">' + E.TIERS.map(function (k) { return '<option value="' + k + '"' + (k === t ? ' selected' : '') + '>' + TIER[k].l + '</option>'; }).join('') + '</select>' +
        '<button class="btn sm ghost" type="button" data-edit="' + e.uid + '">Modifier</button><button class="btn sm ghost danger" type="button" data-del="' + e.uid + '" aria-label="Retirer la ligne ' + (i + 1) + '">Retirer</button></div></div></div>';
    });
    h += '</div><div class="totals num">';
    h += '<div><span>Sous-total</span><span>' + mad(q.ht - q.travel) + '</span></div>';
    if (q.travel) h += '<div><span>Déplacement ' + esc(zone) + (q.nights ? ' (' + q.nights + ' nuit' + (q.nights > 1 ? 's' : '') + ')' : '') + '</span><span>' + mad(q.travel) + '</span></div>';
    if (q.discount) h += '<div><span>Remise</span><span>− ' + mad(q.discount) + '</span></div>';
    h += '<div><span>Total HT</span><span>' + mad(q.htNet) + '</span></div><div><span>TVA ' + Math.round(S.settings.tva * 100) + ' %</span><span>' + mad(q.tva) + '</span></div>';
    h += '<div class="big"><span>Total TTC</span><span>' + mad(q.ttc) + '</span></div></div>';
    h += '<div class="cond"><b style="color:var(--ink)">Conditions</b><span>' + esc(S.settings.conditions) + '</span><span>Store Luxe · Entrée 6, Av. 2 Mars, Souk Elhad, Agadir · +212 6 67 62 03 60 · contact@storeluxe.ma</span></div>';
    $('doc').innerHTML = h;

    var side = '<div class="card pad stack"><h3>Envoyer au client</h3>' +
      '<button class="btn pri wide" type="button" id="k-wa">Copier le message WhatsApp</button>' +
      '<button class="btn wide" type="button" id="k-txt">Copier le devis en texte</button>' +
      '<p class="sub" style="margin:0">Le message reprend chaque ligne TTC, le total et la date de validité.</p></div>';
    side += '<div class="card pad stack"><h3>Lecture interne</h3><div class="kpis">' +
      '<div class="kpi"><span>Coût au prix du jour</span><b>' + nf0.format(q.costNow) + '</b></div>' +
      '<div class="kpi good"><span>Marge si achat aujourd’hui</span><b>' + pct(q.marginIfToday) + '</b></div>' +
      '<div class="kpi"><span>Jours de pose</span><b>' + nf2.format(q.laborDays) + '</b></div>' +
      '<div class="kpi"><span>Lignes</span><b>' + d.entries.length + '</b></div></div>' +
      '<div class="row"><button class="btn sm" type="button" data-go="configurer">Ajouter un produit</button><button class="btn sm ghost danger" type="button" id="k-clear">Nouveau devis</button></div>' +
      '<div id="k-confirm" hidden class="alert">Vider ce devis ?<div class="row" style="margin-top:8px"><button class="btn sm danger" type="button" id="k-clear-yes">Oui, vider</button><button class="btn sm" type="button" id="k-clear-no">Annuler</button></div></div></div>';
    $('doc-side').innerHTML = side;
  }
  function quoteText(whatsapp) {
    var d = quote(), q = d.q, T = tva(), zone = q.zone.name.split(' (')[0];
    var t = whatsapp ? 'Bonjour' + (S.site.client ? ' ' + S.site.client : '') + ',\n\nVoici l’estimation Store Luxe pour votre projet à ' + zone + ' :\n\n'
      : 'STORE LUXE — Devis estimatif ' + (S.quoteNo || '') + '\nDate : ' + frDate(TODAY) + ' · Client : ' + (S.site.client || 'à préciser') + ' · Chantier : ' + zone + '\n\n';
    d.entries.forEach(function (e, i) {
      var r = e.line, k = e.tier || r.base;
      t += (whatsapp ? '• ' : (i + 1) + '. ') + r.productName + ' — ' + r.summary + (r.details.length ? ' (' + r.details.join(', ') + ')' : '') + ' : ' +
        (whatsapp ? mad(r.sale[k] * T) + ' TTC' : mad(r.sale[k]) + ' HT') + '\n';
    });
    if (q.travel) t += (whatsapp ? '• ' : '') + 'Déplacement ' + zone + ' : ' + (whatsapp ? mad(q.travel * T) + ' TTC' : mad(q.travel) + ' HT') + '\n';
    if (q.discount) t += (whatsapp ? '• ' : '') + 'Remise : − ' + (whatsapp ? mad(q.discount * T) + ' TTC' : mad(q.discount) + ' HT') + '\n';
    t += '\nTotal : ' + mad(q.ttc) + ' TTC (' + mad(q.htNet) + ' HT + TVA ' + Math.round(S.settings.tva * 100) + ' %)\n';
    t += 'Fourniture et pose comprises. Valable jusqu’au ' + frDate(E.addDays(TODAY, S.settings.validityDays)) + '.\n' + S.settings.conditions + '\n\nStore Luxe · Agadir · +212 6 67 62 03 60';
    return t;
  }
  document.getElementById('v-devis').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.go) go(b.dataset.go);
    if (b.dataset.del) { S.cart = S.cart.filter(function (l) { return l.uid !== b.dataset.del; }); save(); renderCount(); renderDoc(); }
    if (b.dataset.edit) {
      var l = S.cart.filter(function (x) { return x.uid === b.dataset.edit; })[0]; if (!l) return;
      S.current = { productId: l.productId, params: clone(l.params), tier: l.tier }; S.editing = l.uid; save();
      renderCatalog(); renderForm(); renderResult(); go('configurer');
    }
    if (b.id === 'k-wa') copy(quoteText(true), 'Message copié : collez-le dans WhatsApp');
    if (b.id === 'k-txt') copy(quoteText(false), 'Devis copié');
    if (b.id === 'k-clear') $('k-confirm').hidden = false;
    if (b.id === 'k-clear-no') $('k-confirm').hidden = true;
    if (b.id === 'k-clear-yes') { S.cart = []; S.quoteNo = null; save(); renderCount(); renderDoc(); toast('Devis vidé'); }
  });
  document.getElementById('v-devis').addEventListener('change', function (e) {
    var uid = e.target.dataset && e.target.dataset.tierline; if (!uid) return;
    S.cart.forEach(function (l) { if (l.uid === uid) l.tier = e.target.value; }); save(); renderDoc();
  });
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-go]'); if (b && !b.closest('#v-devis')) go(b.dataset.go); });

  /* ================= Prix & sources ================= */
  function spark(hist, cls, lines) {
    var h = hist.slice().sort(function (a, b) { return a.d < b.d ? -1 : 1; });
    var W = cls === 'mini' ? 84 : 320, Hh = cls === 'mini' ? 22 : 56, pad = 4;
    if (!h.length) return '';
    var t0 = Date.parse(h[0].d), t1 = Math.max(Date.parse(TODAY), t0 + 86400000);
    var vs = h.map(function (p) { return p.v; }).concat(lines || []);
    var lo = Math.min.apply(null, vs), hi = Math.max.apply(null, vs); if (hi === lo) { hi += 1; lo -= 1; }
    function X(d) { return pad + (Date.parse(d) - t0) / (t1 - t0) * (W - 2 * pad); }
    function Y(v) { return Hh - pad - (v - lo) / (hi - lo) * (Hh - 2 * pad); }
    var pts = h.map(function (p) { return X(p.d).toFixed(1) + ',' + Y(p.v).toFixed(1); });
    pts.push(X(TODAY).toFixed(1) + ',' + Y(h[h.length - 1].v).toFixed(1));
    var s = '<svg class="' + (cls || 'spark') + '" viewBox="0 0 ' + W + ' ' + Hh + '" preserveAspectRatio="none" aria-hidden="true">';
    s += '<path d="M' + pts[0].split(',')[0] + ',' + Hh + ' L' + pts.join(' L') + ' L' + X(TODAY).toFixed(1) + ',' + Hh + ' Z" style="fill:var(--accent-soft)"></path>';
    (lines || []).forEach(function (v, i) { s += '<line x1="0" x2="' + W + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" style="stroke:' + (i ? 'var(--bad)' : 'var(--warn)') + ';stroke-dasharray:3 3;stroke-width:1" vector-effect="non-scaling-stroke"></line>'; });
    s += '<polyline points="' + pts.join(' ') + '" style="fill:none;stroke:var(--accent);stroke-width:1.6" vector-effect="non-scaling-stroke"></polyline>';
    var lp = pts[pts.length - 1].split(',');
    return s + '<circle cx="' + lp[0] + '" cy="' + lp[1] + '" r="2.6" style="fill:var(--accent)"></circle></svg>';
  }
  function renderIndices() {
    var aluCount = 0, eurCount = 0;
    Object.keys(S.book).forEach(function (k) { if (S.book[k].type === 'alu') aluCount++; if (S.book[k].type === 'eur') eurCount++; });
    $('indices').innerHTML = ['alu_kg', 'eur_mad'].map(function (id) {
      var it = S.book[id], sv = E.series(it.hist, S.settings.policy.windowDays, TODAY, it.max);
      var age = sv.lastDate ? E.daysBetween(sv.lastDate, TODAY) : 999;
      var h = '<div class="card idx-card"><div class="idx-top"><div><h3>' + esc(it.name) + '</h3><div class="sub">Pilote ' + (id === 'alu_kg' ? aluCount + ' profilés aluminium' : eurCount + ' articles importés') + '</div></div>' +
        '<span class="pill ' + (age > S.settings.staleDays ? 'warn' : 'good') + '">relevé du ' + frDate(sv.lastDate) + '</span></div>' +
        '<div class="idx-vals"><div><span>Aujourd’hui</span><b>' + nf2.format(sv.now) + '</b><small>' + esc(it.unit) + '</small></div>' +
        '<div><span>Plus haut 12 mois</span><b>' + nf2.format(sv.win) + '</b><small>' + frDate(sv.winDate) + '</small></div>' +
        '<div><span>Plus haut connu</span><b>' + nf2.format(sv.max) + '</b><small>' + (sv.maxDate ? frDate(sv.maxDate) : esc(it.maxNote || 'recherché')) + '</small></div></div>' +
        spark(it.hist, 'spark', [sv.win, sv.max]) +
        '<p class="sub" style="margin:0">' + esc(it.note || '') + '</p>' +
        '<div class="upd"><input type="number" step="0.01" id="u-' + id + '" aria-label="Nouveau cours ' + esc(it.name) + '" placeholder="' + nf2.format(sv.now) + '"><button class="btn sm pri" type="button" data-save="' + id + '">Enregistrer le cours du jour</button></div>';
      if (id === 'alu_kg') {
        var usd = E.series(S.book.usd_mad.hist, 365, TODAY).now, ac = S.aluCalc;
        h += '<details><summary class="sub" style="cursor:pointer;font-weight:600">Calculer depuis la cote LME</summary><div class="calc" style="margin-top:8px">' +
          '<div class="fld"><label for="lc-lme">LME $/t</label><input class="inp" id="lc-lme" type="number" step="1" value="' + ac.lme + '"></div>' +
          '<div class="fld"><label for="lc-prem">Prime $/t</label><input class="inp" id="lc-prem" type="number" step="10" value="' + ac.premium + '"></div>' +
          '<div class="fld"><label for="lc-conv">Filage + laquage $/t</label><input class="inp" id="lc-conv" type="number" step="10" value="' + ac.conversion + '"></div>' +
          '<div class="fld"><label for="lc-usd">USD/MAD</label><input class="inp" id="lc-usd" type="number" step="0.01" value="' + usd + '"></div>' +
          '<div class="res"><span>Résultat : <b class="num" id="lc-out">' + nf2.format(E.aluFromLme(ac.lme, ac.premium, ac.conversion, usd)) + '</b> MAD/kg</span><button class="btn sm" type="button" id="lc-save">Enregistrer comme cours du jour</button></div></div></details>';
      }
      return h + '</div>';
    }).join('');
  }
  function calcVals() { return { lme: +$('lc-lme').value || 0, premium: +$('lc-prem').value || 0, conversion: +$('lc-conv').value || 0, usd: +$('lc-usd').value || 0 }; }
  function renderBook() {
    renderIndices();
    var groups = [];
    Object.keys(S.book).forEach(function (k) { var g = S.book[k].group; if (g && groups.indexOf(g) < 0) groups.push(g); });
    var gsel = $('p-group'), gv = gsel.value;
    gsel.innerHTML = '<option value="">Toutes les familles</option>' + groups.map(function (g) { return '<option' + (g === gv ? ' selected' : '') + '>' + esc(g) + '</option>'; }).join('');
    var q = ($('p-search').value || '').toLowerCase(), onlyStale = $('p-stale').checked;
    var h = '<thead><tr><th>Article</th><th class="r">Aujourd’hui</th><th class="r">Conseillé</th><th class="r">Prudent</th><th>Évolution</th><th>Source</th><th>Relevé</th><th>Nouveau prix</th></tr></thead><tbody>';
    var shown = 0, staleN = 0;
    groups.forEach(function (g) {
      if (gv && g !== gv) return;
      var rows = '';
      Object.keys(S.book).forEach(function (id) {
        var it = S.book[id]; if (it.group !== g) return;
        var uc = E.unitCost(it, S.book, S.settings, TODAY);
        if (uc.stale) staleN++;
        if (q && (it.name + ' ' + (it.supplier || '') + ' ' + g).toLowerCase().indexOf(q) < 0) return;
        if (onlyStale && !uc.stale) return;
        shown++;
        var gap = uc.now ? uc.max / uc.now - 1 : 0, src, input, sp;
        if (it.type === 'alu') {
          src = '<span class="src">' + nf2.format(it.kg) + ' kg × indice alu + ' + nf0.format(it.fab) + ' MAD</span>';
          input = '<span class="sub">suit l’indice alu</span>';
          sp = spark(S.book.alu_kg.hist, 'mini');
        } else {
          var lastP = it.hist.slice().sort(function (a, b) { return a.d < b.d ? -1 : 1; }).pop();
          src = '<span class="src">' + (it.type === 'eur' ? nf2.format(lastP.v) + ' € · ' : '') + srcLink(lastP.src, true) + (it.note ? '<br>' + esc(it.note) : '') + '</span>';
          input = '<div class="upd"><input type="number" step="0.01" id="u-' + id + '" aria-label="Nouveau prix ' + esc(it.name) + '" placeholder="' + (it.type === 'eur' ? '€' : 'MAD') + '"><button class="btn sm" type="button" data-save="' + id + '">OK</button><button class="btn sm ghost" type="button" data-hist="' + id + '" aria-label="Historique de ' + esc(it.name) + '">⋯</button></div>';
          sp = spark(it.hist, 'mini');
        }
        rows += '<tr><td><b style="font-weight:600">' + esc(it.name) + '</b><small>par ' + esc(it.unit) + (it.supplier ? ' · ' + esc(it.supplier) : '') + '</small></td>' +
          '<td class="r num">' + nf2.format(uc.now) + '</td><td class="r num">' + nf2.format(uc.win) + '</td><td class="r num"><b>' + nf2.format(uc.max) + '</b><small class="up">+' + pct(gap) + '</small></td>' +
          '<td>' + sp + '</td><td style="max-width:280px">' + src + '</td>' +
          '<td>' + (uc.stale ? '<span class="pill warn">' + frDate(uc.lastDate) + '</span>' : '<span class="sub num">' + frDate(uc.lastDate) + '</span>') + '</td><td>' + input + '</td></tr>';
        if (openHist[id]) rows += '<tr><td colspan="8"><div class="hist">' + it.hist.slice().sort(function (a, b) { return a.d < b.d ? -1 : 1; }).map(function (p) {
          return '<span title="' + esc((SOURCES[p.src] || {}).label || 'saisie manuelle') + '">' + frDate(p.d) + ' · ' + nf2.format(p.v) + '<button type="button" data-delh="' + id + '|' + p.d + '|' + p.v + '" aria-label="Supprimer ce relevé">✕</button></span>';
        }).join('') + (it.max != null ? '<span>plus haut recherché · ' + nf2.format(it.max) + '</span>' : '') + '</div></td></tr>';
      });
      if (rows) h += '<tr class="grp"><td colspan="8">' + esc(g) + '</td></tr>' + rows;
    });
    if (!shown) h += '<tr><td colspan="8" class="sub" style="padding:18px">Aucun article ne correspond.</td></tr>';
    $('book').innerHTML = h + '</tbody>';
    $('p-count').textContent = shown + ' articles · ' + staleN + ' à confirmer';
  }
  var openHist = {};
  function addPrice(id, v, src) {
    var it = S.book[id];
    it.hist = it.hist.filter(function (p) { return p.d !== TODAY; }).concat([{ d: TODAY, v: v, src: src || 'manuel' }]);
  }
  function saveNewPrice(id) {
    var inp = $('u-' + id), v = parseFloat(String(inp.value).replace(',', '.'));
    if (!(v > 0)) { toast('Saisissez un prix supérieur à 0'); inp.focus(); return; }
    addPrice(id, v);
    save(); renderBook(); renderResult(); toast(S.book[id].name + ' : ' + nf2.format(v) + ' enregistré');
  }
  var vp = document.getElementById('v-prix');
  vp.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.save) saveNewPrice(b.dataset.save);
    if (b.dataset.hist) { openHist[b.dataset.hist] = !openHist[b.dataset.hist]; renderBook(); }
    if (b.dataset.delh) {
      var parts = b.dataset.delh.split('|'), it = S.book[parts[0]];
      if (it.hist.length <= 1) { toast('Un article garde au moins un prix'); return; }
      var done = false;
      it.hist = it.hist.filter(function (p) { if (!done && p.d === parts[1] && String(p.v) === parts[2]) { done = true; return false; } return true; });
      save(); renderBook(); renderResult();
    }
    if (b.id === 'lc-save') {
      var c = calcVals(); if (!(c.lme > 0 && c.usd > 0)) { toast('Renseignez la cote LME et le cours USD/MAD'); return; }
      S.aluCalc = { lme: c.lme, premium: c.premium, conversion: c.conversion };
      addPrice('usd_mad', c.usd); addPrice('alu_kg', Math.round(E.aluFromLme(c.lme, c.premium, c.conversion, c.usd) * 100) / 100, 'manuel');
      save(); renderBook(); renderResult(); toast('Indice alu mis à jour depuis la cote LME');
    }
  });
  vp.addEventListener('input', function (e) {
    if (e.target.id && e.target.id.indexOf('lc-') === 0) { var c = calcVals(); $('lc-out').textContent = nf2.format(E.aluFromLme(c.lme, c.premium, c.conversion, c.usd)); }
  });
  vp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.id && e.target.id.indexOf('u-') === 0) saveNewPrice(e.target.id.slice(2)); });
  $('p-search').addEventListener('input', renderBook);
  $('p-stale').addEventListener('change', renderBook);
  $('p-group').addEventListener('change', renderBook);

  /* ================= Réglages ================= */
  var SF = {
    's-window': [function () { return S.settings.policy.windowDays; }, function (v) { S.settings.policy.windowDays = Math.max(7, Math.round(v)); }],
    's-buffer': [function () { return +(S.settings.policy.buffer * 100).toFixed(2); }, function (v) { S.settings.policy.buffer = v / 100; }],
    's-landed': [function () { return +(S.settings.landedEur * 100).toFixed(2); }, function (v) { S.settings.landedEur = v / 100; }],
    's-valid': [function () { return S.settings.validityDays; }, function (v) { S.settings.validityDays = Math.max(1, Math.round(v)); }],
    's-stale': [function () { return S.settings.staleDays; }, function (v) { S.settings.staleDays = Math.max(1, Math.round(v)); }],
    's-round': [function () { return S.settings.rounding; }, function (v) { S.settings.rounding = Math.max(0, v); }],
    's-tva': [function () { return +(S.settings.tva * 100).toFixed(2); }, function (v) { S.settings.tva = v / 100; }],
    's-lodge': [function () { return S.settings.lodgingPerNight; }, function (v) { S.settings.lodgingPerNight = Math.max(0, v); }]
  };
  function renderSettings() {
    document.querySelectorAll('#s-base button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === S.settings.policy.base)); });
    Object.keys(SF).forEach(function (id) { $(id).value = SF[id][0](); });
    $('s-cond').value = S.settings.conditions;
    $('s-margins').innerHTML = '<thead><tr><th>Produit</th><th class="r">Marge %</th></tr></thead><tbody>' + PRODUCTS.map(function (p) {
      var mg = S.settings.margins[p.id] != null ? S.settings.margins[p.id] : p.margin;
      return '<tr><td>' + esc(p.name) + '</td><td class="r"><input class="inp num" style="width:84px;height:32px" type="number" step="0.5" min="0" max="80" data-margin="' + p.id + '" value="' + +(mg * 100).toFixed(2) + '" aria-label="Marge ' + esc(p.name) + '"></td></tr>';
    }).join('') + '</tbody>';
    var accL = { facile: 'Facile', normal: 'Normal', difficile: 'Difficile', hauteur: 'En hauteur' };
    $('s-access').innerHTML = '<tbody>' + Object.keys(accL).map(function (k) {
      return '<tr><td>' + accL[k] + '</td><td class="r"><input class="inp num" style="width:84px;height:32px" type="number" step="0.05" min="0.5" data-access="' + k + '" value="' + S.settings.access[k] + '" aria-label="Coefficient ' + accL[k] + '"></td></tr>';
    }).join('') + '</tbody>';
    $('s-zones').innerHTML = '<thead><tr><th>Zone</th><th class="r">MAD HT</th><th>Nuitées</th></tr></thead><tbody>' + S.settings.zones.map(function (z, i) {
      return '<tr><td><input class="inp" style="height:32px" data-zone="' + i + '" data-k="name" value="' + esc(z.name) + '" aria-label="Nom de zone"></td>' +
        '<td class="r"><input class="inp num" style="width:90px;height:32px" type="number" step="100" min="0" data-zone="' + i + '" data-k="cost" value="' + z.cost + '" aria-label="Coût ' + esc(z.name) + '"></td>' +
        '<td><label class="tog plain"><input type="checkbox" data-zone="' + i + '" data-k="lodging"' + (z.lodging ? ' checked' : '') + ' aria-label="Hébergement ' + esc(z.name) + '"></label></td></tr>';
    }).join('') + '</tbody>';
  }
  var vr = document.getElementById('v-reglages');
  vr.addEventListener('click', function (e) {
    var b = e.target.closest('#s-base button'); if (!b) return;
    S.settings.policy.base = b.dataset.v; S.current.tier = null; save(); renderSettings(); renderResult();
  });
  vr.addEventListener('input', function (e) {
    var el = e.target, v = parseFloat(el.value);
    if (SF[el.id]) { if (isNaN(v)) return; SF[el.id][1](v); }
    else if (el.id === 's-cond') S.settings.conditions = el.value;
    else if (el.dataset.margin) { if (isNaN(v)) return; S.settings.margins[el.dataset.margin] = Math.min(0.8, Math.max(0, v / 100)); }
    else if (el.dataset.access) { if (isNaN(v)) return; S.settings.access[el.dataset.access] = v; }
    else if (el.dataset.zone) {
      var z = S.settings.zones[+el.dataset.zone];
      if (el.dataset.k === 'lodging') z.lodging = el.checked; else if (el.dataset.k === 'cost') { if (isNaN(v)) return; z.cost = v; } else z.name = el.value;
      renderSite();
    } else return;
    save(); renderResult();
  });
  $('x-export').addEventListener('click', function () {
    var data = JSON.stringify({ app: 'storeluxe-chiffrage', version: 2, saved: TODAY, settings: S.settings, book: S.book, aluCalc: S.aluCalc }, null, 1);
    $('x-text').value = data; copy(data, 'Sauvegarde copiée');
  });
  $('x-file').addEventListener('change', function () {
    var f = this.files[0]; if (!f) return;
    var rd = new FileReader(); rd.onload = function () { $('x-text').value = rd.result; toast('Fichier chargé : cliquez sur Importer'); }; rd.readAsText(f);
  });
  $('x-import').addEventListener('click', function () {
    try {
      var data = JSON.parse($('x-text').value);
      if (!data.book && !data.settings) throw new Error('format');
      merge(S, { settings: data.settings, book: data.book, aluCalc: data.aluCalc }); save(); renderAll(); toast('Sauvegarde importée');
    } catch (e) { toast('Texte illisible : collez une sauvegarde complète (JSON)'); }
  });
  $('x-reset').addEventListener('click', function () { $('x-confirm').hidden = false; });
  $('x-reset-no').addEventListener('click', function () { $('x-confirm').hidden = true; });
  $('x-reset-yes').addEventListener('click', function () {
    var keep = { site: S.site, cart: S.cart, quoteNo: S.quoteNo, current: S.current };
    S = freshState(); Object.assign(S, keep); save(); $('x-confirm').hidden = true; renderAll(); toast('Prix de l’étude restaurés');
  });

  function renderAll() { renderSite(); renderCatalog(); renderForm(); renderResult(); renderCount(); route(); }
  renderAll();
})();
