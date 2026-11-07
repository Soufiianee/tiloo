/* Store Luxe — interface du chiffrage. Dépend de SLCatalog et SLEngine. */
(function () {
  'use strict';
  var C = window.SLCatalog, E = window.SLEngine;
  var KEY = 'storeluxe-chiffrage-v1';
  var TODAY = new Date().toISOString().slice(0, 10);
  var PRODUCTS = C.PRODUCTS;
  var byId = {}; PRODUCTS.forEach(function (p) { byId[p.id] = p; });

  /* ---------------- État ---------------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function freshState() {
    return {
      settings: clone(C.SETTINGS),
      book: clone(C.BOOK),
      site: { client: '', zone: 'agadir', access: 'normal', discount: 0 },
      current: { productId: PRODUCTS[0].id, params: {} },
      cart: []
    };
  }
  function load() {
    var s = freshState();
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) merge(s, JSON.parse(raw));
    } catch (e) { /* stockage indisponible : on garde les exemples */ }
    return s;
  }
  /* Fusion prudente : les articles du catalogue gardent leur définition, seul l'historique est repris. */
  function merge(s, saved) {
    if (saved.settings) {
      Object.keys(saved.settings).forEach(function (k) { s.settings[k] = saved.settings[k]; });
      s.settings.policy = Object.assign({}, C.SETTINGS.policy, saved.settings.policy || {});
      s.settings.access = Object.assign({}, C.SETTINGS.access, saved.settings.access || {});
    }
    if (saved.book) Object.keys(saved.book).forEach(function (id) {
      var it = saved.book[id];
      if (s.book[id] && it) {
        if (it.hist) s.book[id].hist = it.hist;
        ['kg', 'fab', 'buffer'].forEach(function (k) { if (it[k] != null) s.book[id][k] = it[k]; });
      }
    });
    if (saved.site) Object.assign(s.site, saved.site);
    if (saved.current && byId[saved.current.productId]) s.current = saved.current;
    if (Array.isArray(saved.cart)) s.cart = saved.cart.filter(function (l) { return byId[l.productId]; });
  }
  var S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignoré */ } }

  /* ---------------- Utilitaires ---------------- */
  var nf0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
  var nf2 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
  function mad(x) { return nf0.format(Math.round(x)) + ' MAD'; }
  function pct(x) { return (x * 100).toFixed(1).replace('.', ',') + ' %'; }
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function frDate(d) { return d ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : '—'; }
  var toastT;
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 2200); }
  function copy(text, okMsg) {
    var done = function () { toast(okMsg); };
    var fallback = function () {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      if (ok) done(); else toast('Copie refusée par le navigateur : sélectionnez le texte manuellement');
    };
    try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
  }
  function paramsOf(prod, params) {
    var p = {}; prod.params.forEach(function (d) { p[d.id] = params[d.id] != null ? params[d.id] : d.def; }); return p;
  }
  function ctx() { return { access: S.site.access, zone: S.site.zone, discount: +S.site.discount || 0 }; }
  function price(productId, params) { return E.priceLine(byId[productId], params, S.book, S.settings, TODAY, ctx()); }

  /* ---------------- Onglets ---------------- */
  var TABS = ['devis', 'prix', 'reglages', 'methode'];
  function route() {
    var t = (location.hash || '#devis').slice(1); if (TABS.indexOf(t) < 0) t = 'devis';
    TABS.forEach(function (k) { $('v-' + k).hidden = k !== t; });
    document.querySelectorAll('.tabs a').forEach(function (a) { if (a.dataset.tab === t) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    if (t === 'prix') renderBook();
    if (t === 'reglages') renderSettings();
  }
  window.addEventListener('hashchange', route);

  /* ---------------- Chantier ---------------- */
  function renderSite() {
    $('c-zone').innerHTML = S.settings.zones.map(function (z) { return '<option value="' + z.id + '">' + esc(z.name) + (z.cost ? ' · ' + nf0.format(z.cost) + ' MAD' : '') + '</option>'; }).join('');
    $('c-client').value = S.site.client; $('c-zone').value = S.site.zone; $('c-access').value = S.site.access; $('c-disc').value = String(S.site.discount || 0);
  }
  ['c-client', 'c-zone', 'c-access', 'c-disc'].forEach(function (id) {
    $(id).addEventListener('input', function () {
      S.site.client = $('c-client').value; S.site.zone = $('c-zone').value; S.site.access = $('c-access').value; S.site.discount = +$('c-disc').value;
      save(); renderResult(); renderCart();
    });
  });

  /* ---------------- Catalogue ---------------- */
  function renderCatalog() {
    var fam = null, h = '';
    PRODUCTS.forEach(function (p) {
      if (p.family !== fam) { fam = p.family; h += '<h3>' + esc(fam) + '</h3>'; }
      h += '<button type="button" data-p="' + p.id + '" aria-pressed="' + (p.id === S.current.productId) + '"><b>' + esc(p.name) + '</b><small>' + esc(p.blurb) + '</small></button>';
    });
    $('catalog').innerHTML = h;
  }
  $('catalog').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-p]'); if (!b) return;
    if (S.current.productId !== b.dataset.p) { S.current = { productId: b.dataset.p, params: {} }; save(); }
    renderCatalog(); renderForm(); renderResult();
  });

  /* ---------------- Formulaire ---------------- */
  function renderForm() {
    var prod = byId[S.current.productId], p = paramsOf(prod, S.current.params);
    var h = '<div class="form-head"><div><h2>' + esc(prod.name) + '</h2><p class="lede">' + esc(prod.blurb) + '</p></div>' +
      '<button class="btn sm ghost" type="button" id="f-reset">Valeurs par défaut</button></div><div class="grid2">';
    prod.params.forEach(function (d) {
      if (d.showIf && !d.showIf(p)) return;
      var v = p[d.id], id = 'f-' + d.id;
      if (d.type === 'number' || d.type === 'count') {
        var step = d.type === 'count' ? 1 : (d.step || 0.1);
        h += '<div class="fld"><label for="' + id + '">' + esc(d.label) + '</label><div class="numbox">' +
          '<button type="button" data-step="-' + step + '" data-f="' + d.id + '" aria-label="Diminuer">−</button>' +
          '<input id="' + id + '" data-f="' + d.id + '" type="number" inputmode="decimal" min="' + d.min + '" max="' + d.max + '" step="' + step + '" value="' + v + '">' +
          '<span class="u">' + esc(d.unit || '') + '</span>' +
          '<button type="button" data-step="' + step + '" data-f="' + d.id + '" aria-label="Augmenter">+</button></div></div>';
      } else if (d.type === 'seg') {
        h += '<div class="fld' + (d.options.length > 2 ? ' full' : '') + '"><span class="lbl">' + esc(d.label) + '</span><div class="seg" role="group" aria-label="' + esc(d.label) + '">' +
          d.options.map(function (o) { return '<button type="button" data-f="' + d.id + '" data-v="' + o.v + '" aria-pressed="' + (String(v) === String(o.v)) + '">' + esc(o.l) + '</button>'; }).join('') + '</div></div>';
      } else if (d.type === 'select') {
        h += '<div class="fld"><label for="' + id + '">' + esc(d.label) + '</label><select class="inp" id="' + id + '" data-f="' + d.id + '">' +
          d.options.map(function (o) { return '<option value="' + o.v + '"' + (o.v === v ? ' selected' : '') + '>' + esc(o.l) + '</option>'; }).join('') + '</select></div>';
      } else if (d.type === 'toggle') {
        h += '<div class="fld"><label class="tog"><input type="checkbox" id="' + id + '" data-f="' + d.id + '"' + (v ? ' checked' : '') + '> ' + esc(d.label) + '</label></div>';
      } else if (d.type === 'ral') {
        h += '<div class="fld full"><span class="lbl">' + esc(d.label) + '</span><div class="sw">' + d.options.map(function (o) {
          return '<button type="button" data-f="' + d.id + '" data-v="' + o.v + '" aria-pressed="' + (v === o.v) + '"><span class="chips">' +
            o.sw.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</span><b>' + esc(o.l) + '</b><small>' + esc(o.sub) + '</small></button>';
        }).join('') + '</div></div>';
      }
    });
    h += '</div>';
    $('form').innerHTML = h;
  }
  function setParam(f, v, rerenderForm) {
    var d = byId[S.current.productId].params.filter(function (x) { return x.id === f; })[0];
    if (!d) return;
    if (d.type === 'number' || d.type === 'count') {
      v = parseFloat(String(v).replace(',', '.')); if (isNaN(v)) return;
      v = Math.min(d.max, Math.max(d.min, v));
      if (d.type === 'count') v = Math.round(v); else v = Math.round(v * 1000) / 1000;
    }
    S.current.params[f] = v; save();
    if (rerenderForm) renderForm();
    renderResult();
  }
  $('form').addEventListener('click', function (e) {
    if (e.target.id === 'f-reset') { S.current.params = {}; save(); renderForm(); renderResult(); return; }
    var b = e.target.closest('button[data-f]'); if (!b) return;
    if (b.dataset.step) {
      var inp = $('f-' + b.dataset.f); var nv = (parseFloat(inp.value) || 0) + parseFloat(b.dataset.step);
      setParam(b.dataset.f, Math.round(nv * 1000) / 1000, false);
      inp.value = paramsOf(byId[S.current.productId], S.current.params)[b.dataset.f];
      maybeRerender(b.dataset.f);
    } else setParam(b.dataset.f, b.dataset.v, true);
  });
  $('form').addEventListener('input', function (e) {
    var el = e.target; if (!el.dataset.f) return;
    if (el.type === 'checkbox') setParam(el.dataset.f, el.checked, true);
    else if (el.tagName === 'SELECT') setParam(el.dataset.f, el.value, true);
    else { setParam(el.dataset.f, el.value, false); maybeRerender(el.dataset.f); }
  });
  $('form').addEventListener('change', function (e) {
    var el = e.target; if (el.type === 'number') el.value = paramsOf(byId[S.current.productId], S.current.params)[el.dataset.f];
  });
  /* Un compteur peut faire apparaître un champ (ex. hauteur des mâts) : on redessine sans perdre le focus. */
  function maybeRerender(f) {
    var prod = byId[S.current.productId];
    if (!prod.params.some(function (d) { return d.showIf; })) return;
    var vis = prod.params.filter(function (d) { return !d.showIf || d.showIf(paramsOf(prod, S.current.params)); }).length;
    var shown = $('form').querySelectorAll('.grid2 > .fld').length;
    if (vis !== shown) { renderForm(); var el = $('f-' + f); if (el) { el.focus(); } }
  }

  /* ---------------- Résultat ---------------- */
  var lastLine = null;
  function renderResult() {
    var r = lastLine = price(S.current.productId, S.current.params);
    var tva = S.settings.tva, sale = r.saleHT;
    var wNow = sale ? r.costNow / sale * 100 : 0, wCush = sale ? r.cushion / sale * 100 : 0;
    var h = '<div class="price"><div><h3>' + esc(r.productName) + '</h3><div class="sub">' + esc(r.summary) + '</div></div>' +
      '<div><div class="ttc">' + nf0.format(sale * (1 + tva)) + ' <small>MAD TTC</small></div><div class="sub num">' + mad(sale) + ' HT · pose comprise · hors déplacement</div></div>' +
      '<div class="bar" role="img" aria-label="Répartition du prix"><i class="b-now" style="width:' + wNow + '%"></i><i class="b-cush" style="width:' + wCush + '%"></i><i class="b-mar" style="flex:1"></i></div>' +
      '<div class="legend">' +
      '<div><span><em style="background:var(--accent)"></em>Coût au prix du jour</span><b class="num">' + mad(r.costNow) + '</b></div>' +
      '<div><span><em style="background:repeating-linear-gradient(135deg,var(--hatch) 0 3px,transparent 3px 6px);border:1px solid var(--accent)"></em>Coussin plafond</span><b class="num">+ ' + mad(r.cushion) + '</b></div>' +
      '<div><span><em style="background:var(--good-soft);border:1px solid var(--good)"></em>Marge</span><b class="num">' + mad(sale - r.costCeil) + '</b></div></div>' +
      '<div class="kpis"><div class="kpi"><span>Marge cible</span><b>' + pct(r.margin) + '</b></div>' +
      '<div class="kpi good"><span>Marge si achat aujourd’hui</span><b>' + pct(r.marginIfToday) + '</b></div></div>';
    var al = r.warnings.map(function (w) { return '<div class="alert">' + esc(w) + '</div>'; });
    if (r.stale.length) al.push('<div class="alert">' + r.stale.length + ' prix à vérifier (plus de ' + S.settings.staleDays + ' jours) : ' + esc(r.stale.slice(0, 4).join(', ')) + (r.stale.length > 4 ? '…' : '') + '</div>');
    if (al.length) h += '<div class="alerts">' + al.join('') + '</div>';
    h += '<div class="row"><button class="btn pri" type="button" id="r-add">Ajouter au devis</button><button class="btn" type="button" id="r-copy">Copier le prix</button></div></div>';
    // détail interne
    var cats = { matiere: 'Matière (avec chutes)', equipement: 'Équipements', pose: 'Pose (coef. accès)' };
    h += '<details class="det"><summary>Détail interne des coûts</summary><div class="tbl-wrap"><table><thead><tr><th>Poste</th><th class="r">Qté</th><th class="r">PU plafond</th><th class="r">Total</th></tr></thead><tbody>';
    Object.keys(cats).forEach(function (c) {
      var ls = r.lines.filter(function (l) { return l.cat === c; }); if (!ls.length) return;
      h += '<tr class="grp"><td colspan="3">' + cats[c] + '</td><td class="r num">' + nf0.format(r.byCat.ceil[c]) + '</td></tr>';
      ls.forEach(function (l) {
        h += '<tr><td>' + esc(l.name) + (l.stale ? ' <span class="flag">à vérifier</span>' : '') + (l.note ? '<small>' + esc(l.note) + '</small>' : '') + '</td><td class="r num">' + nf2.format(l.qty) + ' ' + esc(l.unit) + '</td><td class="r num">' + nf0.format(l.puCeil) + '</td><td class="r num">' + nf0.format(l.ceil) + '</td></tr>';
      });
    });
    h += '<tr class="grp"><td colspan="3">Coût plafond total</td><td class="r num">' + nf0.format(r.costCeil) + '</td></tr></tbody></table></div></details>';
    $('result').innerHTML = h;
  }
  $('result').addEventListener('click', function (e) {
    if (e.target.id === 'r-add') {
      S.cart.push({ uid: Date.now().toString(36), productId: S.current.productId, params: clone(paramsOf(byId[S.current.productId], S.current.params)) });
      save(); renderCart(); toast('Ajouté au devis');
    }
    if (e.target.id === 'r-copy' && lastLine) {
      copy(lastLine.productName + ' — ' + lastLine.summary + ' : ' + mad(lastLine.saleHT * (1 + S.settings.tva)) + ' TTC (pose comprise, à confirmer après relevé)', 'Prix copié');
    }
  });

  /* ---------------- Devis en cours ---------------- */
  function quoteData() {
    var lines = S.cart.map(function (l) { var r = price(l.productId, l.params); r.uid = l.uid; return r; });
    return { lines: lines, q: E.priceQuote(lines, S.settings, ctx()) };
  }
  function renderCart() {
    var d = quoteData(), q = d.q, tva = S.settings.tva;
    var h = '<div class="form-head"><h3>Devis en cours</h3>' + (d.lines.length ? '<button class="btn sm ghost" type="button" id="k-clear">Vider</button>' : '') + '</div>';
    if (!d.lines.length) { $('cart').innerHTML = h + '<div class="empty">Configurez un produit puis « Ajouter au devis ». Un devis peut combiner plusieurs produits, par exemple une pergola et ses stores ZIP.</div>'; return; }
    d.lines.forEach(function (r) {
      h += '<div class="cart-line"><div><b>' + esc(r.productName) + '</b><small>' + esc(r.summary) + '</small></div><span class="num">' + nf0.format(r.saleHT) + '</span>' +
        '<button class="btn sm ghost" type="button" data-del="' + r.uid + '" aria-label="Retirer">✕</button></div>';
    });
    h += '<div class="tot num">';
    if (q.travel) h += '<div><span>Déplacement ' + esc(q.zone.name.split(' (')[0]) + (q.nights ? ' · ' + q.nights + ' nuit(s)' : '') + '</span><span>' + nf0.format(q.travel) + '</span></div>';
    if (q.discount) h += '<div><span>Remise</span><span>− ' + nf0.format(q.discount) + '</span></div>';
    h += '<div><span>Total HT</span><span>' + mad(q.htNet) + '</span></div><div><span>TVA ' + Math.round(tva * 100) + ' %</span><span>' + mad(q.tva) + '</span></div>' +
      '<div class="big"><span>Total TTC</span><span>' + mad(q.ttc) + '</span></div></div>' +
      '<div class="kpis"><div class="kpi"><span>Valable jusqu’au</span><b>' + frDate(E.addDays(TODAY, S.settings.validityDays)) + '</b></div><div class="kpi good"><span>Marge si achat aujourd’hui</span><b>' + pct(q.marginIfToday) + '</b></div></div>' +
      '<div class="row"><button class="btn pri" type="button" id="k-wa">Copier pour WhatsApp</button></div>';
    $('cart').innerHTML = h;
  }
  function whatsapp() {
    var d = quoteData(), q = d.q, tva = S.settings.tva;
    var t = 'Bonjour' + (S.site.client ? ' ' + S.site.client : '') + ',\n\nVoici l’estimation Store Luxe pour votre projet :\n\n';
    d.lines.forEach(function (r) { t += '• ' + r.productName + ' — ' + r.summary + ' : ' + mad(r.saleHT * (1 + tva)) + ' TTC\n'; });
    if (q.travel) t += '• Déplacement ' + q.zone.name.split(' (')[0] + ' : ' + mad(q.travel * (1 + tva)) + ' TTC\n';
    if (q.discount) t += '• Remise : − ' + mad(q.discount * (1 + tva)) + ' TTC\n';
    t += '\nTotal : ' + mad(q.ttc) + ' TTC (' + mad(q.htNet) + ' HT + TVA ' + Math.round(tva * 100) + ' %)\n';
    t += 'Fourniture et pose comprises. Estimation valable jusqu’au ' + frDate(E.addDays(TODAY, S.settings.validityDays)) + ', à confirmer après relevé sur site.\n\nStore Luxe · Agadir · +212 6 67 62 03 60';
    return t;
  }
  $('cart').addEventListener('click', function (e) {
    var del = e.target.closest('[data-del]');
    if (del) { S.cart = S.cart.filter(function (l) { return l.uid !== del.dataset.del; }); save(); renderCart(); }
    if (e.target.id === 'k-clear') { S.cart = []; save(); renderCart(); }
    if (e.target.id === 'k-wa') copy(whatsapp(), 'Message copié : collez-le dans WhatsApp');
  });

  /* ---------------- Prix fournisseurs ---------------- */
  function spark(hist, cls, ceilV) {
    var h = hist.slice().sort(function (a, b) { return a.d < b.d ? -1 : 1; });
    if (h.length < 2) return '';
    var W = cls === 'mini' ? 90 : 300, Hh = cls === 'mini' ? 22 : 48, pad = 3;
    var t0 = Date.parse(h[0].d), t1 = Date.parse(TODAY);
    var vs = h.map(function (p) { return p.v; }); if (ceilV) vs.push(ceilV);
    var lo = Math.min.apply(null, vs), hi = Math.max.apply(null, vs); if (hi === lo) { hi += 1; lo -= 1; }
    function X(d) { return pad + (Date.parse(d) - t0) / Math.max(1, t1 - t0) * (W - 2 * pad); }
    function Y(v) { return Hh - pad - (v - lo) / (hi - lo) * (Hh - 2 * pad); }
    var pts = h.map(function (p) { return X(p.d).toFixed(1) + ',' + Y(p.v).toFixed(1); });
    pts.push(X(TODAY).toFixed(1) + ',' + Y(h[h.length - 1].v).toFixed(1)); // le prix tient jusqu'à aujourd'hui
    var area = 'M' + pts[0].split(',')[0] + ',' + Hh + ' L' + pts.join(' L') + ' L' + X(TODAY).toFixed(1) + ',' + Hh + ' Z';
    var last = pts[pts.length - 1].split(',');
    var s = '<svg class="' + (cls || 'spark') + '" viewBox="0 0 ' + W + ' ' + Hh + '" preserveAspectRatio="none" aria-hidden="true">';
    s += '<path d="' + area + '" fill="var(--accent-soft)"></path>';
    if (ceilV) s += '<line x1="0" x2="' + W + '" y1="' + Y(ceilV).toFixed(1) + '" y2="' + Y(ceilV).toFixed(1) + '" stroke="var(--warn)" stroke-dasharray="3 3" stroke-width="1" vector-effect="non-scaling-stroke"></line>';
    s += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="var(--accent)" stroke-width="1.5" vector-effect="non-scaling-stroke"></polyline>';
    s += '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="2.5" fill="var(--accent)"></circle></svg>';
    return s;
  }
  function renderIndices() {
    $('p-window').textContent = S.settings.policy.mode === 'alltime' ? 'tout l’historique' : S.settings.policy.mode === 'latest' ? '(dernier prix)' : S.settings.policy.windowDays;
    var aluCount = Object.keys(S.book).filter(function (k) { return S.book[k].type === 'alu'; }).length;
    var eurCount = Object.keys(S.book).filter(function (k) { return S.book[k].type === 'eur'; }).length;
    $('indices').innerHTML = ['alu_kg', 'eur_mad'].map(function (id) {
      var it = S.book[id], sv = E.seriesValue(it.hist, S.settings.policy, TODAY);
      var age = sv.lastDate ? E.daysBetween(sv.lastDate, TODAY) : 0;
      return '<div class="panel idx-card"><div class="idx-top"><div><h3>' + esc(it.name) + '</h3><div class="sub">Pilote ' + (id === 'alu_kg' ? aluCount + ' profilés' : eurCount + ' articles importés') + '</div></div>' +
        '<span class="flag' + (age > S.settings.staleDays ? '' : ' ok') + '">mis à jour le ' + frDate(sv.lastDate) + '</span></div>' +
        '<div class="row" style="align-items:baseline;gap:18px"><div class="idx-val">' + nf2.format(sv.now) + ' <small>' + esc(it.unit) + ' aujourd’hui</small></div>' +
        '<div class="sub num">plafond ' + nf2.format(sv.ceil) + ' (' + frDate(sv.peakDate) + ')</div></div>' + spark(it.hist, 'spark', sv.ceil) +
        '<div class="upd"><input type="number" step="0.01" id="u-' + id + '" aria-label="Nouveau cours ' + esc(it.name) + '" placeholder="' + nf2.format(sv.now) + '"><button class="btn sm pri" type="button" data-save="' + id + '">Enregistrer le cours</button></div></div>';
    }).join('');
  }
  function renderBook() {
    renderIndices();
    var q = ($('p-search').value || '').toLowerCase(), onlyStale = $('p-stale').checked;
    var ids = Object.keys(S.book).filter(function (k) { return S.book[k].type !== 'index'; });
    var groups = {}; ids.forEach(function (id) { var g = S.book[id].group || 'Divers'; (groups[g] = groups[g] || []).push(id); });
    var h = '<thead><tr><th>Article</th><th>Base</th><th class="r">Coût du jour</th><th class="r">Plafond retenu</th><th>Évolution</th><th>Mise à jour</th><th>Nouveau prix</th></tr></thead><tbody>';
    var any = false;
    Object.keys(groups).forEach(function (g) {
      var rows = '';
      groups[g].forEach(function (id) {
        var it = S.book[id];
        if (q && (it.name + ' ' + (it.supplier || '') + ' ' + g).toLowerCase().indexOf(q) < 0) return;
        var uc = E.unitCost(it, S.book, S.settings, TODAY);
        if (onlyStale && !uc.stale) return;
        var gap = uc.now ? uc.ceil / uc.now - 1 : 0;
        var base, input;
        if (it.type === 'alu') {
          base = '<span class="num">' + nf2.format(it.kg) + ' kg × alu + ' + nf0.format(it.fab) + '</span><small>suit le cours alu</small>';
          input = '<span class="sub">automatique</span>';
        } else {
          var sv = E.seriesValue(it.hist, S.settings.policy, TODAY);
          base = '<span class="num">' + nf2.format(sv.now) + ' ' + (it.type === 'eur' ? '€' : 'MAD') + ' / ' + esc(it.unit) + '</span>' + (it.supplier ? '<small>' + esc(it.supplier) + '</small>' : '');
          input = '<div class="upd"><input type="number" step="0.01" id="u-' + id + '" aria-label="Nouveau prix ' + esc(it.name) + '" placeholder="' + (it.type === 'eur' ? '€' : 'MAD') + '"><button class="btn sm" type="button" data-save="' + id + '">OK</button><button class="btn sm ghost" type="button" data-hist="' + id + '" aria-label="Historique">⋯</button></div>';
        }
        rows += '<tr><td>' + esc(it.name) + '<small>par ' + esc(it.unit) + '</small></td><td>' + base + '</td>' +
          '<td class="r num">' + nf2.format(uc.now) + '</td><td class="r num"><b>' + nf2.format(uc.ceil) + '</b><small class="' + (gap > 0.001 ? 'up' : '') + '">+' + pct(gap) + '</small></td>' +
          '<td>' + (it.type === 'alu' ? spark(S.book.alu_kg.hist, 'mini') : spark(it.hist, 'mini')) + '</td>' +
          '<td>' + (uc.stale ? '<span class="flag">' + frDate(uc.lastDate) + '</span>' : '<span class="sub num">' + frDate(uc.lastDate) + '</span>') + '</td><td>' + input + '</td></tr>';
        if (openHist[id]) rows += '<tr><td colspan="7"><div class="hist">' + it.hist.slice().sort(function (a, b) { return a.d < b.d ? -1 : 1; }).map(function (p, i) {
          return '<span>' + frDate(p.d) + ' · ' + nf2.format(p.v) + '<button type="button" data-delh="' + id + '|' + p.d + '|' + p.v + '" aria-label="Supprimer ce relevé">✕</button></span>';
        }).join('') + '</div></td></tr>';
      });
      if (rows) { any = true; h += '<tr class="grp"><td colspan="7">' + esc(g) + '</td></tr>' + rows; }
    });
    if (!any) h += '<tr><td colspan="7" class="empty">Aucun article ne correspond.</td></tr>';
    $('book').innerHTML = h + '</tbody>';
  }
  var openHist = {};
  function saveNewPrice(id) {
    var inp = $('u-' + id), v = parseFloat(String(inp.value).replace(',', '.'));
    if (!(v > 0)) { toast('Saisissez un prix supérieur à 0'); inp.focus(); return; }
    var it = S.book[id];
    it.hist = it.hist.filter(function (p) { return p.d !== TODAY; }).concat([{ d: TODAY, v: v }]);
    save(); renderBook(); renderResult(); renderCart(); toast(it.name + ' : ' + nf2.format(v) + ' enregistré');
  }
  document.getElementById('v-prix').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.save) saveNewPrice(b.dataset.save);
    if (b.dataset.hist) { openHist[b.dataset.hist] = !openHist[b.dataset.hist]; renderBook(); }
    if (b.dataset.delh) {
      var parts = b.dataset.delh.split('|'), it = S.book[parts[0]];
      if (it.hist.length <= 1) { toast('Un article doit garder au moins un prix'); return; }
      var done = false;
      it.hist = it.hist.filter(function (p) { if (!done && p.d === parts[1] && String(p.v) === parts[2]) { done = true; return false; } return true; });
      save(); renderBook(); renderResult(); renderCart();
    }
  });
  document.getElementById('v-prix').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.id && e.target.id.indexOf('u-') === 0) saveNewPrice(e.target.id.slice(2));
  });
  $('p-search').addEventListener('input', renderBook);
  $('p-stale').addEventListener('change', renderBook);

  /* ---------------- Réglages ---------------- */
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
    $('s-mode').value = S.settings.policy.mode;
    $('s-window').disabled = S.settings.policy.mode !== 'window';
    Object.keys(SF).forEach(function (id) { $(id).value = SF[id][0](); });
    $('s-margins').innerHTML = '<thead><tr><th>Produit</th><th class="r">Marge %</th></tr></thead><tbody>' + PRODUCTS.map(function (p) {
      var m = S.settings.margins[p.id] != null ? S.settings.margins[p.id] : p.margin;
      return '<tr><td>' + esc(p.name) + '</td><td class="r"><input class="inp num" style="width:84px;height:30px" type="number" step="0.5" min="0" max="80" data-margin="' + p.id + '" value="' + +(m * 100).toFixed(2) + '" aria-label="Marge ' + esc(p.name) + '"></td></tr>';
    }).join('') + '</tbody>';
    var accL = { facile: 'Facile', normal: 'Normal', difficile: 'Difficile', hauteur: 'En hauteur' };
    $('s-access').innerHTML = '<tbody>' + Object.keys(accL).map(function (k) {
      return '<tr><td>' + accL[k] + '</td><td class="r"><input class="inp num" style="width:84px;height:30px" type="number" step="0.05" min="0.5" data-access="' + k + '" value="' + S.settings.access[k] + '" aria-label="Coefficient ' + accL[k] + '"></td></tr>';
    }).join('') + '</tbody>';
    $('s-zones').innerHTML = '<thead><tr><th>Zone</th><th class="r">MAD HT</th><th>Nuitées</th></tr></thead><tbody>' + S.settings.zones.map(function (z, i) {
      return '<tr><td><input class="inp" style="height:30px" data-zone="' + i + '" data-k="name" value="' + esc(z.name) + '" aria-label="Nom de zone"></td>' +
        '<td class="r"><input class="inp num" style="width:90px;height:30px" type="number" step="100" min="0" data-zone="' + i + '" data-k="cost" value="' + z.cost + '" aria-label="Coût ' + esc(z.name) + '"></td>' +
        '<td><label class="tog"><input type="checkbox" data-zone="' + i + '" data-k="lodging"' + (z.lodging ? ' checked' : '') + ' aria-label="Hébergement ' + esc(z.name) + '"></label></td></tr>';
    }).join('') + '</tbody>';
  }
  document.getElementById('v-reglages').addEventListener('input', function (e) {
    var el = e.target, v = parseFloat(el.value);
    if (el.id === 's-mode') { S.settings.policy.mode = el.value; $('s-window').disabled = el.value !== 'window'; }
    else if (SF[el.id]) { if (isNaN(v)) return; SF[el.id][1](v); }
    else if (el.dataset.margin) { if (isNaN(v)) return; S.settings.margins[el.dataset.margin] = Math.min(0.8, Math.max(0, v / 100)); }
    else if (el.dataset.access) { if (isNaN(v)) return; S.settings.access[el.dataset.access] = v; }
    else if (el.dataset.zone) {
      var z = S.settings.zones[+el.dataset.zone];
      if (el.dataset.k === 'lodging') z.lodging = el.checked; else if (el.dataset.k === 'cost') { if (isNaN(v)) return; z.cost = v; } else z.name = el.value;
      renderSite();
    } else return;
    save(); renderResult(); renderCart();
  });
  $('x-export').addEventListener('click', function () {
    var data = JSON.stringify({ app: 'storeluxe-chiffrage', saved: TODAY, settings: S.settings, book: S.book }, null, 1);
    $('x-text').value = data; copy(data, 'Sauvegarde copiée');
  });
  $('x-file').addEventListener('change', function () {
    var f = this.files[0]; if (!f) return;
    var rd = new FileReader(); rd.onload = function () { $('x-text').value = rd.result; toast('Fichier chargé, cliquez sur Importer'); }; rd.readAsText(f);
  });
  $('x-import').addEventListener('click', function () {
    try {
      var data = JSON.parse($('x-text').value);
      if (!data.book && !data.settings) throw new Error('format');
      merge(S, { settings: data.settings, book: data.book }); save(); renderAll(); toast('Sauvegarde importée');
    } catch (e) { toast('Texte illisible : collez une sauvegarde complète (format JSON)'); }
  });
  $('x-reset').addEventListener('click', function () { $('x-confirm').hidden = false; });
  $('x-reset-no').addEventListener('click', function () { $('x-confirm').hidden = true; });
  $('x-reset-yes').addEventListener('click', function () {
    var site = S.site, cart = S.cart; S = freshState(); S.site = site; S.cart = cart; save(); $('x-confirm').hidden = true; renderAll(); toast('Prix d’exemple restaurés');
  });

  function renderAll() { renderSite(); renderCatalog(); renderForm(); renderResult(); renderCart(); route(); }
  renderAll();
})();
