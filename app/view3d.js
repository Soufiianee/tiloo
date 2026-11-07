/*
 * Store Luxe — vue 3D paramétrique (three.js r128, chargé à la demande).
 * Reconstruit le modèle à partir du même objet `geo` que le plan 2D :
 * pergolas, carports et vérandas (kind 'plan'), store banne, voile d'ombrage.
 * Glisser pour tourner, molette ou pincement pour zoomer.
 */
(function (root) {
  'use strict';
  var URL3 = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  var V = null, loading = null;
  var RAL = { standard: 0x383E42, sable: 0x6E716C, special: 0x7E5233 };

  function load() {
    if (root.THREE) return Promise.resolve(root.THREE);
    if (loading) return loading;
    loading = new Promise(function (ok, ko) {
      var s = document.createElement('script'); s.src = URL3; s.async = true;
      s.onload = function () { root.THREE ? ok(root.THREE) : ko(new Error('three')); };
      s.onerror = function () { loading = null; ko(new Error('three')); };
      document.head.appendChild(s);
    });
    return loading;
  }

  function init() {
    var T = root.THREE;
    var host = document.createElement('div'); host.className = 'v3d-host';
    var renderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(2, root.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputEncoding = T.sRGBEncoding;
    host.appendChild(renderer.domElement);
    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(38, 1, 0.1, 300);
    scene.add(new T.HemisphereLight(0xffffff, 0x8f887b, 0.62));
    var sun = new T.DirectionalLight(0xfff4e6, 0.85);
    sun.position.set(-7, 14, 9); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var sc = sun.shadow.camera; sc.left = -16; sc.right = 16; sc.top = 16; sc.bottom = -16; sc.far = 60; sun.shadow.bias = -0.0005;
    scene.add(sun);
    V = { T: T, host: host, renderer: renderer, scene: scene, camera: camera, yaw: -0.65, pitch: 0.42, dist: 12, target: new T.Vector3(0, 1.3, 0),
      group: null, slats: [], open: 0.55, geo: null };
    var drag = null, pinch = null, pts = {};
    host.addEventListener('pointerdown', function (e) {
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pts);
      if (ids.length === 2) { var a = pts[ids[0]], b = pts[ids[1]]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: V.dist }; drag = null; }
      else drag = { x: e.clientX, y: e.clientY, yaw: V.yaw, pitch: V.pitch };
      try { host.setPointerCapture(e.pointerId); } catch (err) { /* ignoré */ }
    });
    host.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return;
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pts);
      if (pinch && ids.length === 2) { var a = pts[ids[0]], b = pts[ids[1]]; V.dist = clamp(pinch.dist * pinch.d / Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), 3, 45); frame(); return; }
      if (!drag) return;
      V.yaw = drag.yaw - (e.clientX - drag.x) * 0.008;
      V.pitch = clamp(drag.pitch + (e.clientY - drag.y) * 0.006, 0.06, 1.4);
      frame();
    });
    function up(e) { delete pts[e.pointerId]; if (Object.keys(pts).length < 2) pinch = null; if (!Object.keys(pts).length) drag = null; }
    host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);
    host.addEventListener('wheel', function (e) { e.preventDefault(); V.dist = clamp(V.dist * (e.deltaY > 0 ? 1.08 : 0.93), 3, 45); frame(); }, { passive: false });
    if (root.ResizeObserver) new ResizeObserver(function () { frame(); }).observe(host);
    return V;
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  var raf = 0;
  function frame() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; render(); }); }
  function render() {
    if (!V) return;
    var w = V.host.clientWidth || 600, h = V.host.clientHeight || 300;
    V.renderer.setSize(w, h, false); V.renderer.domElement.style.width = '100%'; V.renderer.domElement.style.height = '100%';
    V.camera.aspect = w / h; V.camera.updateProjectionMatrix();
    var t = V.target, c = Math.cos(V.pitch);
    V.camera.position.set(t.x + V.dist * c * Math.sin(V.yaw), t.y + V.dist * Math.sin(V.pitch), t.z + V.dist * c * Math.cos(V.yaw));
    V.camera.lookAt(t);
    V.renderer.render(V.scene, V.camera);
  }

  /* ---------- Matériaux ---------- */
  function mats(g) {
    var T = V.T;
    function std(color, o) { return new T.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.6, metalness: 0.1 }, o || {})); }
    return {
      alu: std(RAL[g.ral] || RAL.standard, { metalness: 0.35, roughness: 0.45 }),
      ground: std(0xBDB5A6, { roughness: 0.95 }),
      slab: std(0xDCD5C8, { roughness: 0.9 }),
      wall: std(0xF1ECE3, { roughness: 0.95 }),
      glass: std(0xA9D2E6, { transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.1, depthWrite: false }),
      zip: std(0x3B434B, { transparent: true, opacity: 0.72, side: T.DoubleSide }),
      toile: std(0xEDE7DA, { side: T.DoubleSide, roughness: 0.85 }),
      poly: std(0xE3EEF3, { transparent: true, opacity: 0.55, side: T.DoubleSide, depthWrite: false }),
      sandwich: std(0xE7E3DC, { side: T.DoubleSide }),
      tole: std(0xBFC4C9, { side: T.DoubleSide, metalness: 0.5, roughness: 0.4 }),
      sail: std(0xF2EEE6, { side: T.DoubleSide, roughness: 0.8 }),
      awning: std(0xC9B59A, { side: T.DoubleSide, roughness: 0.8 }),
      car: std(0x8F99A3, { roughness: 0.4, metalness: 0.4 }),
      steel: std(0x9EA4AA, { metalness: 0.6, roughness: 0.35 }),
      light: new T.MeshBasicMaterial({ color: 0xFFE3A3 })
    };
  }
  function box(w, h, d, m, x, y, z, cast) {
    var T = V.T, mesh = new T.Mesh(new T.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z); mesh.castShadow = cast !== false; mesh.receiveShadow = true; return mesh;
  }

  /* ---------- Constructions ---------- */
  function ground(G, M, w, d) {
    var T = V.T;
    var gr = new T.Mesh(new T.PlaneGeometry(60, 60), M.ground); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; G.add(gr);
    G.add(box(w, 0.04, d, M.slab, 0, 0.02, 0, false));
  }
  function buildPlan(G, g, M) {
    var L = g.L, P = g.P, H = g.H || 2.5, x0 = -L / 2, z0 = -P / 2, beamH = g.roof === 'lames' ? 0.24 : 0.16;
    ground(G, M, L + 2.4, P + 2.4);
    if (g.wall) G.add(box(L + 3, H + 1.4, 0.3, M.wall, 0, (H + 1.4) / 2, z0 - 0.15));
    (g.posts || []).forEach(function (p) {
      var s = g.roof === 'lames' ? 0.15 : 0.1;
      G.add(box(s, H, s, M.alu, x0 + clamp(p[0], s / 2, L - s / 2), H / 2, z0 + clamp(p[1], s / 2, P - s / 2)));
    });
    var yb = H + beamH / 2;
    G.add(box(L, beamH, 0.1, M.alu, 0, yb, z0 + P - 0.05));
    G.add(box(L, beamH, 0.1, M.alu, 0, yb, z0 + 0.05));
    G.add(box(0.1, beamH, P, M.alu, x0 + 0.05, yb, 0));
    G.add(box(0.1, beamH, P, M.alu, x0 + L - 0.05, yb, 0));
    V.slats = [];
    var i, n;
    if (g.roof === 'lames') {
      var mods = g.modules || 1, mw = L / mods;
      for (i = 1; i < mods; i++) G.add(box(0.12, beamH, P, M.alu, x0 + mw * i, yb, 0));
      n = Math.max(2, Math.floor((P - 0.1) / 0.2));
      for (var mIdx = 0; mIdx < mods; mIdx++) for (i = 0; i < n; i++) {
        var sl = box(mw - 0.14, 0.03, 0.2, M.alu, x0 + mw * (mIdx + 0.5), yb + 0.02, z0 + 0.12 + (P - 0.24) * (i + 0.5) / n);
        sl.rotation.x = V.open * 1.35; G.add(sl); V.slats.push(sl);
      }
    } else if (g.roof === 'toile') {
      var mods2 = g.modules || 1;
      for (i = 0; i <= mods2; i++) G.add(box(0.08, 0.08, P, M.alu, x0 + Math.min(L - 0.04, Math.max(0.04, L * i / mods2)), H + 0.18, 0));
      n = Math.max(3, Math.round(P / 0.5));
      for (i = 0; i < n; i++) {
        var f = box(L - 0.1, 0.012, P / n * 1.04, M.toile, 0, H + 0.25 - (i % 2) * 0.05, z0 + P * (i + 0.5) / n);
        f.rotation.x = (i % 2 ? -1 : 1) * 0.12; G.add(f);
      }
    } else {
      var slope = 0.06, pitch = g.pitch || 0.9, roofY = H + beamH + 0.06;
      n = Math.max(2, Math.ceil(L / pitch));
      for (i = 0; i <= n; i++) {
        var ch = box(0.05, 0.07, P, M.alu, x0 + Math.min(L - 0.03, Math.max(0.03, L * i / n)), roofY, 0);
        ch.rotation.x = slope; G.add(ch);
      }
      var cm = g.couv === 'verre_442' ? M.glass : g.couv === 'sandwich_40' ? M.sandwich : g.couv === 'tole_bac' ? M.tole : M.poly;
      var sheet = box(L + 0.1, 0.02, P + 0.1, cm, 0, roofY + 0.05, 0, cm !== M.glass && cm !== M.poly);
      sheet.rotation.x = slope; G.add(sheet);
    }
    (g.sides || []).forEach(function (sd) {
      var front = sd.side === 'front' || sd.side === 'back', len = front ? L : P;
      var z = sd.side === 'front' ? z0 + P : sd.side === 'back' ? z0 : 0, x = sd.side === 'left' ? x0 : sd.side === 'right' ? x0 + L : 0;
      var m = sd.type === 'verre' ? M.glass : M.zip;
      var pane = box(front ? len - 0.12 : 0.02, H - 0.05, front ? 0.02 : len - 0.12, m, x, H / 2, z, sd.type !== 'verre');
      G.add(pane);
      if (sd.type === 'verre') {
        var k = Math.max(2, Math.round(len / 1.2));
        for (i = 1; i < k; i++) {
          var off = -len / 2 + len * i / k;
          G.add(box(front ? 0.04 : 0.05, H, front ? 0.05 : 0.04, M.alu, front ? off : x, H / 2, front ? z : off));
        }
      } else G.add(box(front ? len : 0.14, 0.14, front ? 0.14 : len, M.alu, x, H - 0.07, z));
    });
    if (g.cars) {
      var lp = L / g.cars;
      for (i = 0; i < g.cars; i++) {
        var cx = x0 + lp * (i + 0.5);
        G.add(box(1.8, 0.75, Math.min(4.3, P - 0.6), M.car, cx, 0.6, 0.1));
        G.add(box(1.55, 0.55, Math.min(2.3, P - 1.5), M.car, cx, 1.22, 0));
      }
    }
    if (g.spots) {
      var sn = Math.min(g.spots, 40);
      for (i = 0; i < sn; i++) {
        var t = (i + 0.5) / sn, per = 2 * (L + P), dpos = t * per, sx, sz;
        if (dpos < L) { sx = x0 + dpos; sz = z0 + P - 0.12; } else if (dpos < L + P) { sx = x0 + L - 0.12; sz = z0 + P - (dpos - L); }
        else if (dpos < 2 * L + P) { sx = x0 + L - (dpos - L - P); sz = z0 + 0.12; } else { sx = x0 + 0.12; sz = z0 + (dpos - 2 * L - P); }
        G.add(box(0.07, 0.015, 0.07, M.light, sx, H - 0.005, sz, false));
      }
    }
    V.target.set(0, H * 0.55, 0);
    return Math.max(L, P * 1.3, H * 1.6);
  }
  function buildBanne(G, g, M) {
    var W = g.W, A = g.A, y0 = 2.6, drop = Math.tan(14 * Math.PI / 180) * A, T = V.T;
    ground(G, M, W + 2, A + 2);
    G.add(box(W + 3, 3.6, 0.3, M.wall, 0, 1.8, -0.15));
    var cas = g.type === 'banne_monobloc' ? box(W, 0.08, 0.08, M.alu, 0, y0, 0.08) : box(W + 0.1, 0.26, 0.26, M.alu, 0, y0, 0.15);
    G.add(cas);
    var fab = new T.Mesh(new T.PlaneGeometry(W - 0.04, Math.hypot(A, drop)), M.awning);
    fab.position.set(0, y0 - drop / 2 - 0.05, 0.2 + A / 2); fab.rotation.x = -Math.PI / 2 + Math.atan2(drop, A); fab.castShadow = true; G.add(fab);
    G.add(box(W, 0.05, 0.06, M.alu, 0, y0 - drop - 0.06, 0.2 + A));
    G.add(box(W - 0.04, 0.2, 0.01, M.awning, 0, y0 - drop - 0.17, 0.23 + A));
    [-1, 1].forEach(function (s) {
      var arm = box(0.05, 0.05, Math.hypot(A * 0.98, drop * 0.7), M.alu, s * (W / 2 - 0.25), y0 - 0.25 - drop * 0.4, 0.2 + A / 2);
      arm.rotation.x = Math.atan2(drop * 0.7, A); G.add(arm);
    });
    V.target.set(0, 1.6, A / 2); V.slats = [];
    return Math.max(W, A * 1.6, 4);
  }
  function buildVoile(G, g, M) {
    var T = V.T, pts = g.pts, cx = 0, cz = 0;
    pts.forEach(function (p) { cx += p[0]; cz += p[1]; }); cx /= pts.length; cz /= pts.length;
    var span = Math.max.apply(null, pts.map(function (p) { return Math.hypot(p[0] - cx, p[1] - cz); }));
    ground(G, M, span * 2 + 2, span * 2 + 2);
    var Hm = g.Hm || 3.5;
    var P3 = pts.map(function (p, i) { return new T.Vector3(p[0] - cx, i < g.mats ? Hm - (i % 2) * 0.7 : 2.9 - (i % 2) * 0.4, p[1] - cz); });
    P3.forEach(function (v, i) {
      if (i < g.mats) {
        var m = new T.Mesh(new T.CylinderGeometry(0.06, 0.07, v.y + 0.1, 16), M.steel); m.position.set(v.x, v.y / 2, v.z); m.castShadow = true; G.add(m);
      } else G.add(box(0.5, v.y + 0.4, 0.25, M.wall, v.x, (v.y + 0.4) / 2, v.z));
    });
    var c = new T.Vector3(); P3.forEach(function (v) { c.add(v); }); c.divideScalar(P3.length); c.y -= 0.25;
    var pos = [], seg = 8;
    for (var i = 0; i < P3.length; i++) {
      var a = P3[i], b = P3[(i + 1) % P3.length];
      for (var k = 0; k < seg; k++) {
        var t1 = k / seg, t2 = (k + 1) / seg;
        var e1 = a.clone().lerp(b, t1), e2 = a.clone().lerp(b, t2);
        var s1 = Math.sin(Math.PI * t1) * 0.12, s2 = Math.sin(Math.PI * t2) * 0.12;
        e1.lerp(c, s1); e2.lerp(c, s2);
        pos.push(c.x, c.y, c.z, e1.x, e1.y, e1.z, e2.x, e2.y, e2.z);
      }
    }
    var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals();
    var sail = new T.Mesh(geo, M.sail); sail.castShadow = true; G.add(sail);
    V.target.set(0, 1.6, 0); V.slats = [];
    return span * 2.2;
  }

  function update(g) {
    if (!V || !g) return;
    var T = V.T;
    V.geo = g;
    if (V.group) { V.scene.remove(V.group); V.group.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); }
    var G = new T.Group(), M = mats(g), size;
    size = g.kind === 'plan' ? buildPlan(G, g, M) : g.kind === 'banne' ? buildBanne(G, g, M) : buildVoile(G, g, M);
    V.scene.add(G); V.group = G;
    var kind = g.kind + (g.roof || '');
    if (V.kind !== kind) { V.dist = clamp(size * 1.55 + 3, 5, 45); V.kind = kind; }
    frame();
  }

  root.SL3D = {
    supports: function (g) { return !!g && (g.kind === 'plan' || g.kind === 'banne' || g.kind === 'voile'); },
    hasSlats: function () { return !!(V && V.slats.length); },
    /* Monte la vue dans `slot` et dessine `g`. Résout false si la 3D est indisponible. */
    show: function (slot, g) {
      return load().then(function () {
        if (!V && !init()) return false;
        if (V.host.parentNode !== slot) slot.appendChild(V.host);
        update(g); return true;
      }, function () { return false; });
    },
    update: function (g) { if (V && V.host.isConnected) update(g); },
    setOpen: function (v) { if (!V) return; V.open = v; V.slats.forEach(function (s) { s.rotation.x = v * 1.35; }); frame(); },
    reset: function () { if (!V) return; V.yaw = -0.65; V.pitch = 0.42; V.kind = null; if (V.geo) update(V.geo); frame(); }
  };
})(this);
