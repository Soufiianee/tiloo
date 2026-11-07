/*
 * Store Luxe — catalogue par défaut : carnet de prix fournisseurs, réglages, produits.
 *
 * ATTENTION : tous les prix ci-dessous sont des EXEMPLES de démarrage (ordres de
 * grandeur du marché marocain, MAD HT). Ils doivent être remplacés par vos vrais
 * prix d'achat dans l'onglet « Prix fournisseurs ».
 */
(function (root) {
  'use strict';

  /* Historique d'exemple : un pic récent puis une détente, pour illustrer le plafond. */
  function ex(v, last) {
    last = last || '2026-10-24';
    return [
      { d: '2026-05-18', v: +(v * 0.96).toFixed(2) },
      { d: '2026-08-04', v: +(v * 1.05).toFixed(2) },
      { d: last, v: v }
    ];
  }

  var BOOK = {
    /* --- Indices : un seul chiffre à mettre à jour, des dizaines d'articles suivent --- */
    alu_kg: { name: 'Aluminium profilé thermolaqué', unit: 'MAD/kg', cat: 'indice', type: 'index', supplier: 'Profilés (extrudeur local)',
      hist: [{ d: '2026-05-12', v: 47.5 }, { d: '2026-06-16', v: 49 }, { d: '2026-07-21', v: 52.5 }, { d: '2026-08-25', v: 51 },
        { d: '2026-09-29', v: 49.5 }, { d: '2026-10-30', v: 50.5 }] },
    eur_mad: { name: 'Cours EUR → MAD', unit: 'MAD/€', cat: 'indice', type: 'index', supplier: 'Bank Al-Maghrib / banque',
      hist: [{ d: '2026-05-04', v: 10.72 }, { d: '2026-06-15', v: 10.85 }, { d: '2026-07-15', v: 10.97 }, { d: '2026-08-14', v: 10.88 },
        { d: '2026-09-15', v: 10.8 }, { d: '2026-10-15', v: 10.86 }, { d: '2026-11-03', v: 10.83 }] },

    /* --- Profilés aluminium : kg par unité × cours alu + façonnage --- */
    alu_poutre_bioclim: { name: 'Poutre cadre bioclimatique 190×235', unit: 'ml', cat: 'matiere', type: 'alu', kg: 9.2, fab: 60, group: 'Profilés aluminium' },
    alu_poteau_150: { name: 'Poteau 150×150 (EP intégrée)', unit: 'ml', cat: 'matiere', type: 'alu', kg: 4.7, fab: 30, group: 'Profilés aluminium' },
    alu_lames_bioclim: { name: 'Lames orientables + pivots (toiture)', unit: 'm²', cat: 'matiere', type: 'alu', kg: 16, fab: 140, group: 'Profilés aluminium' },
    alu_cheneau: { name: 'Chéneau / descente eaux pluviales', unit: 'ml', cat: 'matiere', type: 'alu', kg: 1.8, fab: 25, group: 'Profilés aluminium' },
    alu_poutre_fixe: { name: 'Poutre pergola fixe / carport', unit: 'ml', cat: 'matiere', type: 'alu', kg: 4.2, fab: 35, group: 'Profilés aluminium' },
    alu_chevron: { name: 'Chevron porteur de couverture', unit: 'ml', cat: 'matiere', type: 'alu', kg: 1.9, fab: 15, group: 'Profilés aluminium' },
    alu_poteau_100: { name: 'Poteau 100×100', unit: 'ml', cat: 'matiere', type: 'alu', kg: 2.6, fab: 20, group: 'Profilés aluminium' },
    alu_veranda_facade: { name: 'Menuiserie coulissante véranda', unit: 'm²', cat: 'matiere', type: 'alu', kg: 7.5, fab: 260, group: 'Profilés aluminium' },
    alu_veranda_toiture: { name: 'Ossature de toiture véranda', unit: 'm²', cat: 'matiere', type: 'alu', kg: 5, fab: 90, group: 'Profilés aluminium' },
    alu_zip_coffre: { name: 'Coffre + barre de charge ZIP', unit: 'ml', cat: 'matiere', type: 'alu', kg: 3.1, fab: 60, group: 'Profilés aluminium' },
    alu_zip_guides: { name: 'Coulisse ZIP', unit: 'ml', cat: 'matiere', type: 'alu', kg: 0.8, fab: 15, group: 'Profilés aluminium' },
    alu_cadre_moust: { name: 'Profil cadre moustiquaire', unit: 'ml', cat: 'matiere', type: 'alu', kg: 0.45, fab: 12, group: 'Profilés aluminium' },

    /* --- Couvertures et vitrages --- */
    poly_16: { name: 'Polycarbonate alvéolaire 16 mm', unit: 'm²', cat: 'matiere', type: 'mad', hist: ex(175), group: 'Couvertures & vitrages' },
    poly_compact: { name: 'Polycarbonate compact 6 mm', unit: 'm²', cat: 'matiere', type: 'mad', hist: ex(340), group: 'Couvertures & vitrages' },
    verre_442: { name: 'Verre feuilleté 44.2', unit: 'm²', cat: 'matiere', type: 'mad', hist: ex(460), group: 'Couvertures & vitrages' },
    sandwich_40: { name: 'Panneau sandwich 40 mm', unit: 'm²', cat: 'matiere', type: 'mad', hist: ex(255), group: 'Couvertures & vitrages' },
    tole_bac: { name: 'Tôle bac acier laqué', unit: 'm²', cat: 'matiere', type: 'mad', hist: ex(120, '2026-08-28'), group: 'Couvertures & vitrages' },
    vitre_6: { name: 'Vitrage simple 6 mm clair', unit: 'm²', cat: 'matiere', type: 'mad', hist: ex(210), group: 'Couvertures & vitrages' },
    double_vitrage: { name: 'Double vitrage 4/16/4', unit: 'm²', cat: 'matiere', type: 'mad', hist: ex(470), group: 'Couvertures & vitrages' },
    controle_solaire: { name: 'Double vitrage contrôle solaire', unit: 'm²', cat: 'matiere', type: 'mad', hist: ex(640), group: 'Couvertures & vitrages' },

    /* --- Toiles --- */
    toile_sauleda: { name: 'Toile acrylique Sauleda', unit: 'm²', cat: 'matiere', type: 'eur', hist: ex(14), group: 'Toiles', supplier: 'Sauleda' },
    toile_ferrari: { name: 'Toile Serge Ferrari Soltis (screen)', unit: 'm²', cat: 'matiere', type: 'eur', hist: ex(18), group: 'Toiles', supplier: 'Serge Ferrari' },
    toile_ferrari_occ: { name: 'Toile Serge Ferrari occultante', unit: 'm²', cat: 'matiere', type: 'eur', hist: ex(24), group: 'Toiles', supplier: 'Serge Ferrari' },
    toile_hdpe: { name: 'Toile ombrage HDPE micro-perforée', unit: 'm²', cat: 'matiere', type: 'mad', hist: ex(85), group: 'Toiles' },
    toile_pvc: { name: 'Toile PVC enduite imperméable', unit: 'm²', cat: 'matiere', type: 'mad', hist: ex(175), group: 'Toiles' },
    confection_voile: { name: 'Confection voile (ourlet + ralingue)', unit: 'ml', cat: 'matiere', type: 'mad', hist: ex(45), group: 'Toiles' },
    toile_tamisant: { name: 'Toile enrouleur tamisante', unit: 'm²', cat: 'matiere', type: 'mad', hist: ex(105), group: 'Toiles' },
    toile_occultant: { name: 'Toile enrouleur occultante', unit: 'm²', cat: 'matiere', type: 'mad', hist: ex(145), group: 'Toiles' },
    toile_screen_int: { name: 'Toile enrouleur screen', unit: 'm²', cat: 'matiere', type: 'mad', hist: ex(165), group: 'Toiles' },
    toile_jour_nuit: { name: 'Toile double voile jour & nuit', unit: 'm²', cat: 'matiere', type: 'mad', hist: ex(205), group: 'Toiles' },
    toile_moust: { name: 'Toile moustiquaire fibre de verre', unit: 'm²', cat: 'matiere', type: 'mad', hist: ex(45), group: 'Toiles' },

    /* --- Mécanismes et systèmes (Gaviota, Llaza, Siplan) --- */
    banne_monobloc: { name: 'Système store banne monobloc', unit: 'ml', cat: 'equipement', type: 'eur', hist: ex(70), group: 'Systèmes de stores', supplier: 'Gaviota / Llaza' },
    banne_semicoffre: { name: 'Système store banne semi-coffre', unit: 'ml', cat: 'equipement', type: 'eur', hist: ex(105), group: 'Systèmes de stores', supplier: 'Gaviota / Llaza' },
    banne_coffre: { name: 'Système store banne coffre intégral', unit: 'ml', cat: 'equipement', type: 'eur', hist: ex(150), group: 'Systèmes de stores', supplier: 'Gaviota / Llaza' },
    banne_bras_renfort: { name: 'Bras renforcés grande avancée (paire)', unit: 'u', cat: 'equipement', type: 'eur', hist: ex(150), group: 'Systèmes de stores', supplier: 'Gaviota / Llaza' },
    manivelle: { name: 'Treuil + manivelle', unit: 'u', cat: 'equipement', type: 'mad', hist: ex(160), group: 'Systèmes de stores' },
    treuil_zip: { name: 'Manœuvre manuelle ZIP', unit: 'u', cat: 'equipement', type: 'mad', hist: ex(240), group: 'Systèmes de stores' },
    meca_enrouleur: { name: 'Mécanisme enrouleur (tube + chaînette)', unit: 'ml', cat: 'equipement', type: 'mad', hist: ex(115), group: 'Systèmes de stores' },
    meca_jour_nuit: { name: 'Mécanisme jour & nuit', unit: 'ml', cat: 'equipement', type: 'mad', hist: ex(145), group: 'Systèmes de stores' },
    coffre_enrouleur: { name: 'Coffre enrouleur', unit: 'ml', cat: 'equipement', type: 'mad', hist: ex(130), group: 'Systèmes de stores' },
    venitien_25: { name: 'Store vénitien alu lames 25 mm', unit: 'm²', cat: 'equipement', type: 'mad', hist: ex(360), group: 'Systèmes de stores' },
    venitien_50: { name: 'Store vénitien alu lames 50 mm', unit: 'm²', cat: 'equipement', type: 'mad', hist: ex(510), group: 'Systèmes de stores' },
    guidage_cable: { name: 'Guidage latéral par câble', unit: 'ml', cat: 'equipement', type: 'mad', hist: ex(35), group: 'Systèmes de stores' },
    kit_moust_fixe: { name: 'Kit moustiquaire fixe (angles, clips)', unit: 'u', cat: 'equipement', type: 'mad', hist: ex(60), group: 'Systèmes de stores' },
    kit_moust_coul: { name: 'Kit moustiquaire coulissante (rails, galets)', unit: 'u', cat: 'equipement', type: 'mad', hist: ex(190), group: 'Systèmes de stores' },
    kit_moust_enr: { name: 'Kit moustiquaire enroulable (caisson, ressort)', unit: 'u', cat: 'equipement', type: 'mad', hist: ex(480), group: 'Systèmes de stores' },
    kit_moust_pli: { name: 'Kit moustiquaire plissée', unit: 'u', cat: 'equipement', type: 'mad', hist: ex(650), group: 'Systèmes de stores' },

    /* --- Motorisation (Somfy) et électricité --- */
    verin_bioclim: { name: 'Vérin 24 V + télécommande (lames)', unit: 'u', cat: 'equipement', type: 'eur', hist: ex(360), group: 'Motorisation & éclairage' },
    capteur_pluie_vent: { name: 'Capteur pluie / vent pergola', unit: 'u', cat: 'equipement', type: 'eur', hist: ex(115), group: 'Motorisation & éclairage' },
    somfy_banne: { name: 'Moteur Somfy store banne RTS', unit: 'u', cat: 'equipement', type: 'eur', hist: ex(235), group: 'Motorisation & éclairage', supplier: 'Somfy' },
    somfy_zip: { name: 'Moteur Somfy store ZIP', unit: 'u', cat: 'equipement', type: 'eur', hist: ex(150), group: 'Motorisation & éclairage', supplier: 'Somfy' },
    somfy_int: { name: 'Moteur Somfy store intérieur', unit: 'u', cat: 'equipement', type: 'eur', hist: ex(145), group: 'Motorisation & éclairage', supplier: 'Somfy' },
    somfy_telec: { name: 'Télécommande Somfy Situo', unit: 'u', cat: 'equipement', type: 'eur', hist: ex(42), group: 'Motorisation & éclairage', supplier: 'Somfy' },
    somfy_eolis: { name: 'Capteur vent Somfy Eolis', unit: 'u', cat: 'equipement', type: 'eur', hist: ex(92), group: 'Motorisation & éclairage', supplier: 'Somfy' },
    spot_led: { name: 'Spot LED 24 V dimmable 3000 K', unit: 'u', cat: 'equipement', type: 'mad', hist: ex(175), group: 'Motorisation & éclairage' },
    led_blanc: { name: 'Ruban LED blanc', unit: 'ml', cat: 'equipement', type: 'mad', hist: ex(55), group: 'Motorisation & éclairage' },
    led_rgb: { name: 'Ruban LED RGB', unit: 'ml', cat: 'equipement', type: 'mad', hist: ex(90), group: 'Motorisation & éclairage' },
    alim_led: { name: 'Alimentation + variateur LED', unit: 'u', cat: 'equipement', type: 'mad', hist: ex(380), group: 'Motorisation & éclairage' },
    kit_melody: { name: 'Kit audio intégré poteaux', unit: 'u', cat: 'equipement', type: 'mad', hist: ex(3400, '2026-08-12'), group: 'Motorisation & éclairage' },
    brumisateur: { name: 'Kit brumisateur', unit: 'u', cat: 'equipement', type: 'mad', hist: ex(2400, '2026-08-12'), group: 'Motorisation & éclairage' },

    /* --- Fixations et quincaillerie --- */
    platine: { name: 'Platine de pied de poteau', unit: 'u', cat: 'matiere', type: 'mad', hist: ex(165), group: 'Fixations' },
    cheville_chim: { name: 'Cheville chimique + tige inox', unit: 'u', cat: 'matiere', type: 'mad', hist: ex(42), group: 'Fixations' },
    visserie: { name: 'Visserie, joints, silicone (lot)', unit: 'lot', cat: 'matiere', type: 'mad', hist: ex(250), group: 'Fixations' },
    console_ite: { name: 'Console déportée pour façade isolée', unit: 'u', cat: 'matiere', type: 'mad', hist: ex(450), group: 'Fixations' },
    mat_acier: { name: 'Mât acier galvanisé Ø 114', unit: 'ml', cat: 'matiere', type: 'mad', hist: ex(520), group: 'Fixations' },
    fondation: { name: 'Massif béton (matériaux)', unit: 'u', cat: 'matiere', type: 'mad', hist: ex(650), group: 'Fixations' },
    ancrage_facade: { name: 'Ancrage façade inox pour voile', unit: 'u', cat: 'matiere', type: 'mad', hist: ex(240), group: 'Fixations' },
    tendeur: { name: 'Tendeur inox + manille', unit: 'u', cat: 'matiere', type: 'mad', hist: ex(110), group: 'Fixations' },

    /* --- Main-d'œuvre --- */
    pose_jour: { name: 'Équipe de pose (2 personnes)', unit: 'jour', cat: 'pose', type: 'mad', hist: [{ d: '2026-01-05', v: 1200 }, { d: '2026-07-01', v: 1300 }], group: 'Main-d’œuvre', buffer: 0, noStale: true },
    electricien: { name: 'Raccordement électrique', unit: 'forfait', cat: 'pose', type: 'mad', hist: [{ d: '2026-07-01', v: 900 }], group: 'Main-d’œuvre', buffer: 0, noStale: true }
  };

  var SETTINGS = {
    policy: { mode: 'window', windowDays: 180, buffer: 0.02 },
    landedEur: 0.25,          // douane + transport + transit sur les achats en euros
    tva: 0.20,
    rounding: 50,             // arrondi supérieur des prix de vente HT
    validityDays: 15,         // validité du devis : borne le risque de hausse
    staleDays: 30,            // au-delà, le prix est signalé « à vérifier »
    lodgingPerNight: 700,     // hébergement + repas de l'équipe, par nuit
    access: { facile: 1, normal: 1.15, difficile: 1.35, hauteur: 1.6 },
    zones: [
      { id: 'agadir', name: 'Agadir', cost: 0, lodging: false },
      { id: 'souss', name: 'Souss-Massa (Taghazout, Aourir, Taroudant…)', cost: 600, lodging: false },
      { id: 'sud', name: 'Essaouira, Tiznit, Guelmim', cost: 1800, lodging: true },
      { id: 'marrakech', name: 'Marrakech', cost: 2500, lodging: true },
      { id: 'casa', name: 'Casablanca, Rabat', cost: 4500, lodging: true },
      { id: 'nord', name: 'Tanger, Fès, Oujda', cost: 6500, lodging: true }
    ],
    margins: {}
  };

  /* --- Briques réutilisées --- */
  function zipLines(w, h, cmd, toile, n) {
    n = n || 1;
    var L = [
      { item: 'alu_zip_coffre', qty: w * n, note: n + ' × ' + w.toFixed(2) + ' m' },
      { item: 'alu_zip_guides', qty: 2 * h * n, note: '2 coulisses × ' + h.toFixed(2) + ' m' },
      { item: toile === 'occultant' ? 'toile_ferrari_occ' : 'toile_ferrari', qty: +(w * (h + 0.3) * n).toFixed(2), note: 'chute + 30 cm d’enroulement' }
    ];
    if (cmd === 'manuel') L.push({ item: 'treuil_zip', qty: n });
    else {
      L.push({ item: 'somfy_zip', qty: n });
      L.push({ item: 'somfy_telec', qty: n });
      if (cmd === 'capteur') L.push({ item: 'somfy_eolis', qty: 1 });
    }
    return L;
  }

  function ralSurcharge(ral) { return ral === 'sable' ? 0.06 : ral === 'special' ? 0.15 : 0; }

  var RAL = { id: 'ral', label: 'Coloris aluminium', type: 'ral', def: 'standard', options: [
    { v: 'standard', l: 'Standard', sub: 'RAL 9010 · 7016 · 9005', sw: ['#F1EDE1', '#383E42', '#0E0E10'] },
    { v: 'sable', l: 'Texturé sablé', sub: '+6 % sur l’alu', sw: ['#7A7B76', '#E1CC4F', '#1F4764'] },
    { v: 'special', l: 'Hors gamme / bois', sub: '+15 % sur l’alu', sw: ['#8A5A36', '#6E2C27', '#5E6B3A'] }
  ] };

  var PRODUCTS = [
    {
      id: 'pergola-bioclimatique', name: 'Pergola bioclimatique', family: 'Structures extérieures', margin: 0.30, waste: 0.05,
      blurb: 'Lames orientables motorisées, adossée ou autoportante.',
      params: [
        { id: 'L', label: 'Longueur (côté façade)', type: 'number', unit: 'm', min: 2, max: 18, step: 0.05, def: 5 },
        { id: 'P', label: 'Avancée / profondeur', type: 'number', unit: 'm', min: 2, max: 6, step: 0.05, def: 3 },
        { id: 'H', label: 'Hauteur sous poutre', type: 'number', unit: 'm', min: 2.2, max: 3.5, step: 0.05, def: 2.6 },
        { id: 'config', label: 'Configuration', type: 'seg', def: 'adossee', options: [{ v: 'adossee', l: 'Adossée' }, { v: 'autoportante', l: 'Autoportante' }] },
        RAL,
        { id: 'spots', label: 'Spots LED', type: 'count', unit: 'u', min: 0, max: 40, def: 0 },
        { id: 'led', label: 'Ruban LED périphérique', type: 'seg', def: 'non', options: [{ v: 'non', l: 'Aucun' }, { v: 'blanc', l: 'Blanc' }, { v: 'rgb', l: 'RGB' }] },
        { id: 'zip', label: 'Stores ZIP latéraux', type: 'select', def: 'aucun', options: [
          { v: 'aucun', l: 'Aucun' }, { v: 'avant', l: 'Face avant' }, { v: 'avant1', l: 'Face avant + 1 côté' },
          { v: 'trois', l: '3 côtés' }, { v: 'quatre', l: '4 côtés (autoportante)' }] },
        { id: 'zipCmd', label: 'Commande des ZIP', type: 'seg', def: 'moteur', options: [{ v: 'manuel', l: 'Manuelle' }, { v: 'moteur', l: 'Moteur Somfy' }, { v: 'capteur', l: 'Moteur + capteur vent' }], showIf: function (p) { return p.zip !== 'aucun'; } },
        { id: 'capteur', label: 'Capteur pluie / vent (fermeture auto)', type: 'toggle', def: false },
        { id: 'melody', label: 'Kit audio dans les poteaux', type: 'toggle', def: false },
        { id: 'brumi', label: 'Brumisateur', type: 'toggle', def: false }
      ],
      build: function (p, h) {
        var W = [], area = p.L * p.P;
        var modules = h.ceil(p.L / 6);
        var auto = p.config === 'autoportante';
        var posts = auto ? 2 * (modules + 1) : modules + 1;
        var beams = 2 * p.L + p.P * (modules + 1); // adossée : la poutre murale remplace la poutre arrière
        if (p.P > 4.5) W.push('Avancée > 4,5 m : prévoir une poutre intermédiaire, à valider en étude de structure.');
        if (modules > 1) W.push(modules + ' modules de lames (portée max ≈ 6 m par module).');
        var L = [
          { item: 'alu_lames_bioclim', qty: h.r2(area), note: h.r2(area) + ' m² de toiture' },
          { item: 'alu_poutre_bioclim', qty: h.r2(beams), note: auto ? 'cadre complet' : 'cadre + poutre murale' },
          { item: 'alu_poteau_150', qty: h.r2(posts * (p.H + 0.25)), note: posts + ' poteaux × ' + (p.H + 0.25).toFixed(2) + ' m' },
          { item: 'alu_cheneau', qty: h.r2(p.L), note: 'chéneau façade' },
          { item: 'verin_bioclim', qty: modules },
          { item: 'platine', qty: posts },
          { item: 'cheville_chim', qty: posts * 4 + (auto ? 0 : h.ceil(p.L / 0.6) * 2), note: auto ? '4 par platine' : 'platines + fixation murale' },
          { item: 'visserie', qty: modules },
          { item: 'electricien', qty: 1 }
        ];
        if (p.spots > 0) L.push({ item: 'spot_led', qty: p.spots });
        if (p.led !== 'non') L.push({ item: p.led === 'rgb' ? 'led_rgb' : 'led_blanc', qty: h.r2(2 * (p.L + p.P)), note: 'périmètre' });
        if (p.spots > 0 || p.led !== 'non') L.push({ item: 'alim_led', qty: modules });
        if (p.capteur) L.push({ item: 'capteur_pluie_vent', qty: 1 });
        if (p.melody) L.push({ item: 'kit_melody', qty: 1 });
        if (p.brumi) L.push({ item: 'brumisateur', qty: 1 });
        var sides = { aucun: [], avant: [p.L], avant1: [p.L, p.P], trois: [p.L, p.P, p.P], quatre: [p.L, p.L, p.P, p.P] }[p.zip] || [];
        if (p.zip === 'quatre' && !auto) W.push('4 côtés de ZIP : seulement possible en autoportante.');
        var zipCount = 0;
        sides.forEach(function (w) {
          var n = h.ceil(w / 5); zipCount += n;
          zipLines(w / n, p.H, p.zipCmd, 'screen', n).forEach(function (l) { L.push(l); });
        });
        var days = h.r1(1 + area / 12 + zipCount * 0.3);
        L.push({ item: 'pose_jour', qty: days, note: 'estimation ' + days + ' j' });
        return {
          lines: L, warnings: W, laborDays: days, aluSurcharge: ralSurcharge(p.ral),
          summary: p.L + ' × ' + p.P + ' m, ' + (auto ? 'autoportante' : 'adossée') + (p.spots ? ', ' + p.spots + ' spots' : '') +
            (p.led !== 'non' ? ', LED ' + p.led : '') + (zipCount ? ', ' + zipCount + ' ZIP' : '')
        };
      }
    },
    {
      id: 'pergola-aluminium', name: 'Pergola aluminium fixe', family: 'Structures extérieures', margin: 0.32, waste: 0.07,
      blurb: 'Couverture permanente : polycarbonate, verre ou panneau.',
      params: [
        { id: 'L', label: 'Longueur (côté façade)', type: 'number', unit: 'm', min: 2, max: 20, step: 0.05, def: 6 },
        { id: 'P', label: 'Avancée / profondeur', type: 'number', unit: 'm', min: 1.5, max: 6, step: 0.05, def: 3.5 },
        { id: 'H', label: 'Hauteur sous poutre', type: 'number', unit: 'm', min: 2.2, max: 3.5, step: 0.05, def: 2.5 },
        { id: 'config', label: 'Configuration', type: 'seg', def: 'adossee', options: [{ v: 'adossee', l: 'Adossée' }, { v: 'autoportante', l: 'Autoportante' }] },
        { id: 'couv', label: 'Couverture', type: 'select', def: 'poly_16', options: [
          { v: 'poly_16', l: 'Polycarbonate alvéolaire 16 mm' }, { v: 'poly_compact', l: 'Polycarbonate compact 6 mm' },
          { v: 'verre_442', l: 'Verre feuilleté 44.2' }, { v: 'sandwich_40', l: 'Panneau sandwich (opaque)' }] },
        RAL,
        { id: 'spots', label: 'Spots LED', type: 'count', unit: 'u', min: 0, max: 40, def: 0 },
        { id: 'zip', label: 'Stores ZIP', type: 'select', def: 'aucun', options: [
          { v: 'aucun', l: 'Aucun' }, { v: 'avant', l: 'Face avant' }, { v: 'avant1', l: 'Face avant + 1 côté' }, { v: 'trois', l: '3 côtés' }] },
        { id: 'zipCmd', label: 'Commande des ZIP', type: 'seg', def: 'moteur', options: [{ v: 'manuel', l: 'Manuelle' }, { v: 'moteur', l: 'Moteur Somfy' }, { v: 'capteur', l: 'Moteur + capteur vent' }], showIf: function (p) { return p.zip !== 'aucun'; } }
      ],
      build: function (p, h) {
        var W = [], area = p.L * p.P, auto = p.config === 'autoportante';
        var spans = h.ceil(p.L / 4);
        var posts = auto ? 2 * (spans + 1) : spans + 1;
        var glass = p.couv === 'verre_442';
        var pitch = glass ? 0.7 : 0.9;
        var chevrons = (h.ceil(p.L / pitch) + 1) * p.P;
        if (glass) W.push('Verre : structure renforcée, entraxe chevrons 70 cm.');
        if (p.P > 5) W.push('Avancée > 5 m : vérifier la section des chevrons.');
        var L = [
          { item: 'alu_poutre_fixe', qty: h.r2(2 * p.L + (spans + 1) * p.P * (auto ? 1 : 0.5)), note: auto ? 'poutres périphériques' : 'poutre avant + lisse murale' },
          { item: 'alu_chevron', qty: h.r2(chevrons), note: 'entraxe ' + pitch * 100 + ' cm' },
          { item: 'alu_poteau_100', qty: h.r2(posts * (p.H + 0.2)), note: posts + ' poteaux' },
          { item: 'alu_cheneau', qty: h.r2(p.L) },
          { item: p.couv, qty: h.r2(area * 1.05), note: 'surface + pente' },
          { item: 'platine', qty: posts },
          { item: 'cheville_chim', qty: posts * 4 + (auto ? 0 : h.ceil(p.L / 0.6) * 2) },
          { item: 'visserie', qty: spans }
        ];
        if (p.spots > 0) { L.push({ item: 'spot_led', qty: p.spots }); L.push({ item: 'alim_led', qty: 1 }); L.push({ item: 'electricien', qty: 1 }); }
        var sides = { aucun: [], avant: [p.L], avant1: [p.L, p.P], trois: [p.L, p.P, p.P] }[p.zip] || [];
        var zipCount = 0;
        sides.forEach(function (w) { var n = h.ceil(w / 5); zipCount += n; zipLines(w / n, p.H, p.zipCmd, 'screen', n).forEach(function (l) { L.push(l); }); });
        if (zipCount && p.zipCmd !== 'manuel' && !p.spots) L.push({ item: 'electricien', qty: 1 });
        var days = h.r1(1 + area / 15 + (glass ? 0.5 : 0) + zipCount * 0.3);
        L.push({ item: 'pose_jour', qty: days, note: 'estimation ' + days + ' j' });
        return { lines: L, warnings: W, laborDays: days, aluSurcharge: ralSurcharge(p.ral),
          summary: p.L + ' × ' + p.P + ' m, ' + (auto ? 'autoportante' : 'adossée') + ', ' + ({ poly_16: 'polycarbonate 16', poly_compact: 'polycarbonate compact', verre_442: 'verre', sandwich_40: 'panneau sandwich' })[p.couv] };
      }
    },
    {
      id: 'veranda', name: 'Véranda aluminium', family: 'Structures extérieures', margin: 0.30, waste: 0.06,
      blurb: 'Pièce vitrée sur terrasse, jardin ou toit-terrasse.',
      params: [
        { id: 'L', label: 'Largeur (côté façade)', type: 'number', unit: 'm', min: 2, max: 12, step: 0.05, def: 5 },
        { id: 'P', label: 'Profondeur', type: 'number', unit: 'm', min: 1.5, max: 6, step: 0.05, def: 3.5 },
        { id: 'H', label: 'Hauteur des façades', type: 'number', unit: 'm', min: 2, max: 3.5, step: 0.05, def: 2.6 },
        { id: 'faces', label: 'Faces vitrées', type: 'seg', def: '3', options: [{ v: '1', l: '1 face' }, { v: '2', l: '2 faces' }, { v: '3', l: '3 faces' }] },
        { id: 'vitrage', label: 'Vitrage des façades', type: 'select', def: 'double_vitrage', options: [
          { v: 'vitre_6', l: 'Simple 6 mm clair' }, { v: 'double_vitrage', l: 'Double vitrage 4/16/4' }, { v: 'controle_solaire', l: 'Double vitrage contrôle solaire' }] },
        { id: 'toit', label: 'Toiture', type: 'select', def: 'sandwich_40', options: [
          { v: 'sandwich_40', l: 'Panneau sandwich (isolant)' }, { v: 'poly_16', l: 'Polycarbonate 16 mm' }, { v: 'verre_442', l: 'Verre feuilleté' }] },
        { id: 'site', label: 'Emplacement', type: 'seg', def: 'terrasse', options: [{ v: 'terrasse', l: 'Terrasse / jardin' }, { v: 'toit', l: 'Toit-terrasse' }] },
        RAL,
        { id: 'spots', label: 'Spots LED', type: 'count', unit: 'u', min: 0, max: 30, def: 4 }
      ],
      build: function (p, h) {
        var W = [], area = p.L * p.P;
        var facade = p.L * p.H + (p.faces >= 2 ? p.P * p.H : 0) + (p.faces >= 3 ? p.P * p.H : 0);
        if (p.site === 'toit') W.push('Toit-terrasse : vérifier dalle, étanchéité, évacuations et accès de levage.');
        if (p.vitrage === 'vitre_6') W.push('Simple vitrage : risque d’effet de serre l’été au Maroc, proposer contrôle solaire.');
        var L = [
          { item: 'alu_veranda_facade', qty: h.r2(facade), note: h.r2(facade) + ' m² de façade' },
          { item: p.vitrage, qty: h.r2(facade * 0.85), note: '85 % de la façade' },
          { item: 'alu_veranda_toiture', qty: h.r2(area) },
          { item: p.toit, qty: h.r2(area * 1.05) },
          { item: 'alu_poteau_100', qty: h.r2(2 * p.H), note: '2 poteaux d’angle' },
          { item: 'alu_cheneau', qty: h.r2(p.L + 2 * p.H) },
          { item: 'cheville_chim', qty: h.ceil((p.L + 2 * p.P) / 0.5) },
          { item: 'visserie', qty: h.ceil(area / 8) }
        ];
        if (p.spots > 0) { L.push({ item: 'spot_led', qty: p.spots }); L.push({ item: 'alim_led', qty: 1 }); L.push({ item: 'electricien', qty: 1 }); }
        var days = h.r1(2 + area / 8 + (p.site === 'toit' ? 1 : 0));
        L.push({ item: 'pose_jour', qty: days, note: 'estimation ' + days + ' j' });
        return { lines: L, warnings: W, laborDays: days, aluSurcharge: ralSurcharge(p.ral),
          summary: p.L + ' × ' + p.P + ' × ' + p.H + ' m, ' + p.faces + ' face(s) vitrée(s)' };
      }
    },
    {
      id: 'voile-ombrage', name: 'Voile d’ombrage', family: 'Structures extérieures', margin: 0.35, waste: 0.08,
      blurb: 'Toile tendue triangle ou rectangle, sur mâts ou façade.',
      params: [
        { id: 'forme', label: 'Forme', type: 'seg', def: 'rectangle', options: [{ v: 'triangle', l: 'Triangle' }, { v: 'rectangle', l: 'Rectangle' }] },
        { id: 'A', label: 'Côté A', type: 'number', unit: 'm', min: 2, max: 15, step: 0.1, def: 6 },
        { id: 'B', label: 'Côté B', type: 'number', unit: 'm', min: 2, max: 15, step: 0.1, def: 4 },
        { id: 'C', label: 'Côté C', type: 'number', unit: 'm', min: 2, max: 15, step: 0.1, def: 5, showIf: function (p) { return p.forme === 'triangle'; } },
        { id: 'toile', label: 'Toile', type: 'select', def: 'toile_hdpe', options: [
          { v: 'toile_hdpe', l: 'HDPE micro-perforée (respirante)' }, { v: 'toile_pvc', l: 'PVC enduite (imperméable)' }, { v: 'toile_ferrari', l: 'Serge Ferrari Soltis' }] },
        { id: 'mats', label: 'Points sur mât', type: 'count', unit: 'mâts', min: 0, max: 4, def: 2 },
        { id: 'Hm', label: 'Hauteur des mâts', type: 'number', unit: 'm', min: 2.5, max: 6, step: 0.1, def: 3.5, showIf: function (p) { return p.mats > 0; } }
      ],
      build: function (p, h) {
        var W = [], tri = p.forme === 'triangle', area, perim;
        if (tri) {
          var s = (p.A + p.B + p.C) / 2;
          area = Math.sqrt(Math.max(0, s * (s - p.A) * (s - p.B) * (s - p.C)));
          perim = p.A + p.B + p.C;
          if (area === 0) W.push('Triangle impossible avec ces 3 côtés.');
        } else { area = p.A * p.B; perim = 2 * (p.A + p.B); }
        var points = tri ? 3 : 4;
        var mats = Math.min(p.mats, points);
        if (p.toile === 'toile_pvc') W.push('Toile imperméable : prévoir une pente marquée et des ancrages renforcés.');
        if (area > 40) W.push('Grande voile (> 40 m²) : étude de vent et mâts renforcés.');
        var L = [
          { item: p.toile, qty: h.r2(area * 1.1), note: h.r2(area) + ' m² + 10 % de coupe' },
          { item: 'confection_voile', qty: h.r2(perim) },
          { item: 'tendeur', qty: points },
          { item: 'ancrage_facade', qty: points - mats }
        ];
        if (mats) {
          L.push({ item: 'mat_acier', qty: h.r2(mats * (p.Hm + 0.8)), note: mats + ' mâts dont 0,8 m enterré' });
          L.push({ item: 'fondation', qty: mats });
        }
        var days = h.r1(0.5 + mats * 0.4 + area / 40);
        L.push({ item: 'pose_jour', qty: days, note: 'estimation ' + days + ' j' });
        return { lines: L, warnings: W, laborDays: days, summary: (tri ? 'Triangle ' + p.A + '/' + p.B + '/' + p.C : 'Rectangle ' + p.A + ' × ' + p.B) + ' m, ' + mats + ' mât(s)' };
      }
    },
    {
      id: 'carport', name: 'Carport aluminium', family: 'Structures extérieures', margin: 0.32, waste: 0.07,
      blurb: 'Abri voiture simple ou double, adossé ou autoportant.',
      params: [
        { id: 'places', label: 'Nombre de places', type: 'seg', def: '1', options: [{ v: '1', l: 'Simple' }, { v: '2', l: 'Double' }, { v: '3', l: 'Triple' }] },
        { id: 'lp', label: 'Largeur par place', type: 'number', unit: 'm', min: 2.5, max: 4, step: 0.05, def: 3 },
        { id: 'P', label: 'Profondeur', type: 'number', unit: 'm', min: 4, max: 7, step: 0.05, def: 5 },
        { id: 'H', label: 'Hauteur de passage', type: 'number', unit: 'm', min: 2.1, max: 3, step: 0.05, def: 2.4 },
        { id: 'config', label: 'Configuration', type: 'seg', def: 'autoportante', options: [{ v: 'adossee', l: 'Adossé' }, { v: 'autoportante', l: 'Autoportant' }] },
        { id: 'couv', label: 'Couverture', type: 'select', def: 'poly_16', options: [
          { v: 'poly_16', l: 'Polycarbonate 16 mm' }, { v: 'sandwich_40', l: 'Panneau sandwich' }, { v: 'tole_bac', l: 'Tôle bac acier' }] },
        { id: 'sol', label: 'Sol', type: 'seg', def: 'beton', options: [{ v: 'beton', l: 'Dalle béton existante' }, { v: 'terre', l: 'Terre / pavé (massifs)' }] },
        RAL,
        { id: 'spots', label: 'Spots LED', type: 'count', unit: 'u', min: 0, max: 20, def: 0 }
      ],
      build: function (p, h) {
        var W = [], n = +p.places, Wd = n * p.lp, area = Wd * p.P, auto = p.config === 'autoportante';
        var spans = h.ceil(Wd / 4);
        var posts = auto ? 2 * (spans + 1) : spans + 1;
        if (p.H < 2.2) W.push('Hauteur < 2,20 m : vérifier le gabarit des véhicules (4×4, utilitaires).');
        var L = [
          { item: 'alu_poutre_fixe', qty: h.r2(2 * Wd + (spans + 1) * p.P * (auto ? 1 : 0.5)) },
          { item: 'alu_chevron', qty: h.r2((h.ceil(Wd / 0.9) + 1) * p.P) },
          { item: 'alu_poteau_100', qty: h.r2(posts * (p.H + 0.3)), note: posts + ' poteaux' },
          { item: 'alu_cheneau', qty: h.r2(Wd) },
          { item: p.couv, qty: h.r2(area * 1.05) },
          { item: 'platine', qty: posts },
          { item: 'cheville_chim', qty: posts * 4 + (auto ? 0 : h.ceil(Wd / 0.6) * 2) },
          { item: 'visserie', qty: spans }
        ];
        if (p.sol === 'terre') L.push({ item: 'fondation', qty: posts, note: '1 massif par poteau' });
        if (p.spots > 0) { L.push({ item: 'spot_led', qty: p.spots }); L.push({ item: 'alim_led', qty: 1 }); L.push({ item: 'electricien', qty: 1 }); }
        var days = h.r1(1 + area / 15 + (p.sol === 'terre' ? 0.5 : 0));
        L.push({ item: 'pose_jour', qty: days, note: 'estimation ' + days + ' j' });
        return { lines: L, warnings: W, laborDays: days, aluSurcharge: ralSurcharge(p.ral),
          summary: n + ' place(s), ' + h.r2(Wd) + ' × ' + p.P + ' m, ' + (auto ? 'autoportant' : 'adossé') };
      }
    },
    {
      id: 'store-banne', name: 'Store banne', family: 'Stores extérieurs', margin: 0.33, waste: 0.03,
      blurb: 'Projection sur terrasse : monobloc, semi-coffre ou coffre.',
      params: [
        { id: 'W', label: 'Largeur', type: 'number', unit: 'm', min: 1.5, max: 7, step: 0.05, def: 4 },
        { id: 'A', label: 'Avancée', type: 'number', unit: 'm', min: 1.5, max: 4, step: 0.25, def: 3 },
        { id: 'type', label: 'Type', type: 'seg', def: 'banne_coffre', options: [
          { v: 'banne_monobloc', l: 'Monobloc' }, { v: 'banne_semicoffre', l: 'Semi-coffre' }, { v: 'banne_coffre', l: 'Coffre intégral' }] },
        { id: 'toile', label: 'Toile', type: 'seg', def: 'toile_sauleda', options: [{ v: 'toile_sauleda', l: 'Sauleda acrylique' }, { v: 'toile_ferrari', l: 'Serge Ferrari' }] },
        { id: 'cmd', label: 'Commande', type: 'seg', def: 'moteur', options: [{ v: 'manuel', l: 'Manivelle' }, { v: 'moteur', l: 'Moteur Somfy' }, { v: 'capteur', l: 'Moteur + Eolis' }] },
        { id: 'support', label: 'Support', type: 'seg', def: 'beton', options: [{ v: 'beton', l: 'Béton' }, { v: 'brique', l: 'Brique / pierre' }, { v: 'ite', l: 'Façade isolée' }] }
      ],
      build: function (p, h) {
        var W = [];
        var brackets = h.ceil(p.W / 1.5) + 1;
        if (p.A > p.W - 0.3) W.push('Avancée trop grande pour la largeur : les bras se croisent (avancée ≤ largeur − 30 cm).');
        if (p.W > 5.5 && p.cmd === 'manuel') W.push('Plus de 5,5 m en manuel : proposer la motorisation.');
        var L = [
          { item: p.type, qty: p.W, note: 'largeur' },
          { item: p.toile, qty: h.r2(p.W * (p.A + 0.35)), note: 'toile + lambrequin' },
          { item: 'cheville_chim', qty: brackets * (p.support === 'brique' ? 4 : 3), note: brackets + ' supports' },
          { item: 'visserie', qty: 1 }
        ];
        if (p.A > 3) L.push({ item: 'banne_bras_renfort', qty: 1 });
        if (p.support === 'ite') L.push({ item: 'console_ite', qty: brackets });
        if (p.cmd === 'manuel') L.push({ item: 'manivelle', qty: 1 });
        else {
          L.push({ item: 'somfy_banne', qty: 1 }); L.push({ item: 'somfy_telec', qty: 1 }); L.push({ item: 'electricien', qty: 1 });
          if (p.cmd === 'capteur') L.push({ item: 'somfy_eolis', qty: 1 });
        }
        var days = h.r1(0.5 + p.W / 10);
        L.push({ item: 'pose_jour', qty: days, note: 'estimation ' + days + ' j' });
        return { lines: L, warnings: W, laborDays: days,
          summary: p.W + ' × ' + p.A + ' m, ' + ({ banne_monobloc: 'monobloc', banne_semicoffre: 'semi-coffre', banne_coffre: 'coffre intégral' })[p.type] + ', ' + (p.cmd === 'manuel' ? 'manuel' : 'motorisé') };
      }
    },
    {
      id: 'store-zip', name: 'Store ZIP vertical', family: 'Stores extérieurs', margin: 0.33, waste: 0.03,
      blurb: 'Toile guidée, tenue au vent, fermeture de pergola ou baie.',
      params: [
        { id: 'W', label: 'Largeur', type: 'number', unit: 'm', min: 0.8, max: 6, step: 0.05, def: 3 },
        { id: 'H', label: 'Hauteur', type: 'number', unit: 'm', min: 1, max: 4, step: 0.05, def: 2.5 },
        { id: 'n', label: 'Nombre de stores identiques', type: 'count', unit: 'u', min: 1, max: 30, def: 1 },
        { id: 'toile', label: 'Toile', type: 'seg', def: 'screen', options: [{ v: 'screen', l: 'Screen (garde la vue)' }, { v: 'occultant', l: 'Occultante' }] },
        { id: 'cmd', label: 'Commande', type: 'seg', def: 'moteur', options: [{ v: 'manuel', l: 'Manuelle' }, { v: 'moteur', l: 'Moteur Somfy' }, { v: 'capteur', l: 'Moteur + capteur vent' }] },
        { id: 'support', label: 'Pose', type: 'seg', def: 'facade', options: [{ v: 'facade', l: 'Façade / baie' }, { v: 'pergola', l: 'Sur pergola' }] }
      ],
      build: function (p, h) {
        var W = [];
        if (p.W > 5) W.push('Largeur > 5 m : vérifier la limite du système et la tenue au vent.');
        var L = zipLines(p.W, p.H, p.cmd, p.toile, p.n);
        L.push({ item: 'cheville_chim', qty: p.n * (p.support === 'facade' ? 8 : 4) });
        if (p.cmd !== 'manuel') L.push({ item: 'electricien', qty: 1 });
        var days = h.r1(Math.max(0.5, p.n * 0.35));
        L.push({ item: 'pose_jour', qty: days, note: 'estimation ' + days + ' j' });
        return { lines: L, warnings: W, laborDays: days, summary: p.n + ' × ' + p.W + ' × ' + p.H + ' m, ' + p.toile + ', ' + (p.cmd === 'manuel' ? 'manuel' : 'motorisé') };
      }
    },
    {
      id: 'store-enrouleur', name: 'Store enrouleur', family: 'Stores intérieurs', margin: 0.40, waste: 0.05,
      blurb: 'Tamisant, occultant ou screen, chaînette ou moteur.',
      params: [
        { id: 'W', label: 'Largeur', type: 'number', unit: 'm', min: 0.4, max: 3.5, step: 0.01, def: 1.4 },
        { id: 'H', label: 'Hauteur (chute)', type: 'number', unit: 'm', min: 0.5, max: 4, step: 0.01, def: 1.6 },
        { id: 'n', label: 'Nombre de stores identiques', type: 'count', unit: 'u', min: 1, max: 50, def: 1 },
        { id: 'toile', label: 'Toile', type: 'seg', def: 'toile_tamisant', options: [{ v: 'toile_tamisant', l: 'Tamisante' }, { v: 'toile_occultant', l: 'Occultante' }, { v: 'toile_screen_int', l: 'Screen' }] },
        { id: 'coffre', label: 'Coffre', type: 'toggle', def: false },
        { id: 'cmd', label: 'Commande', type: 'seg', def: 'chainette', options: [{ v: 'chainette', l: 'Chaînette' }, { v: 'moteur', l: 'Moteur Somfy' }] }
      ],
      build: function (p, h) { return interiorRoll(p, h, 'meca_enrouleur', p.toile, 'Enrouleur'); }
    },
    {
      id: 'store-jour-nuit', name: 'Store jour & nuit', family: 'Stores intérieurs', margin: 0.40, waste: 0.05,
      blurb: 'Double voile à bandes alternées.',
      params: [
        { id: 'W', label: 'Largeur', type: 'number', unit: 'm', min: 0.4, max: 3, step: 0.01, def: 1.4 },
        { id: 'H', label: 'Hauteur (chute)', type: 'number', unit: 'm', min: 0.5, max: 3.5, step: 0.01, def: 1.6 },
        { id: 'n', label: 'Nombre de stores identiques', type: 'count', unit: 'u', min: 1, max: 50, def: 1 },
        { id: 'coffre', label: 'Coffre', type: 'toggle', def: true },
        { id: 'cmd', label: 'Commande', type: 'seg', def: 'chainette', options: [{ v: 'chainette', l: 'Chaînette' }, { v: 'moteur', l: 'Moteur Somfy' }] }
      ],
      build: function (p, h) { return interiorRoll(p, h, 'meca_jour_nuit', 'toile_jour_nuit', 'Jour & nuit'); }
    },
    {
      id: 'store-venitien', name: 'Store vénitien', family: 'Stores intérieurs', margin: 0.40, waste: 0.03,
      blurb: 'Lames aluminium orientables, guidage en option.',
      params: [
        { id: 'W', label: 'Largeur', type: 'number', unit: 'm', min: 0.4, max: 3, step: 0.01, def: 1.2 },
        { id: 'H', label: 'Hauteur', type: 'number', unit: 'm', min: 0.5, max: 3.5, step: 0.01, def: 1.5 },
        { id: 'n', label: 'Nombre de stores identiques', type: 'count', unit: 'u', min: 1, max: 50, def: 1 },
        { id: 'lame', label: 'Lames', type: 'seg', def: 'venitien_25', options: [{ v: 'venitien_25', l: '25 mm' }, { v: 'venitien_50', l: '50 mm' }] },
        { id: 'guidage', label: 'Guidage latéral', type: 'toggle', def: false },
        { id: 'cmd', label: 'Commande', type: 'seg', def: 'manuel', options: [{ v: 'manuel', l: 'Manuelle' }, { v: 'moteur', l: 'Moteur Somfy' }] }
      ],
      build: function (p, h) {
        var a = Math.max(1, p.W * p.H);
        var L = [{ item: p.lame, qty: h.r2(a * p.n), note: p.W * p.H < 1 ? 'minimum facturé 1 m² / store' : '' }];
        if (p.guidage) L.push({ item: 'guidage_cable', qty: h.r2(2 * p.H * p.n) });
        if (p.cmd === 'moteur') { L.push({ item: 'somfy_int', qty: p.n }); L.push({ item: 'somfy_telec', qty: 1 }); L.push({ item: 'electricien', qty: 1 }); }
        L.push({ item: 'visserie', qty: h.ceil(p.n / 6) });
        var days = h.r1(Math.max(0.3, p.n * 0.12));
        L.push({ item: 'pose_jour', qty: days });
        return { lines: L, warnings: [], laborDays: days, summary: p.n + ' × ' + p.W + ' × ' + p.H + ' m, lames ' + (p.lame === 'venitien_25' ? '25' : '50') + ' mm' };
      }
    },
    {
      id: 'moustiquaire', name: 'Moustiquaire', family: 'Stores intérieurs', margin: 0.40, waste: 0.08,
      blurb: 'Fixe, coulissante, enroulable ou plissée.',
      params: [
        { id: 'W', label: 'Largeur', type: 'number', unit: 'm', min: 0.4, max: 4, step: 0.01, def: 1.2 },
        { id: 'H', label: 'Hauteur', type: 'number', unit: 'm', min: 0.4, max: 3, step: 0.01, def: 1.4 },
        { id: 'n', label: 'Nombre identiques', type: 'count', unit: 'u', min: 1, max: 50, def: 1 },
        { id: 'sys', label: 'Système', type: 'select', def: 'kit_moust_coul', options: [
          { v: 'kit_moust_fixe', l: 'Fixe (cadre)' }, { v: 'kit_moust_coul', l: 'Coulissante' }, { v: 'kit_moust_enr', l: 'Enroulable' }, { v: 'kit_moust_pli', l: 'Plissée (baie vitrée)' }] },
        { id: 'laquage', label: 'Laquage', type: 'seg', def: 'standard', options: [{ v: 'standard', l: 'Blanc / gris standard' }, { v: 'ral', l: 'RAL au choix (+12 %)' }] }
      ],
      build: function (p, h) {
        var W = [];
        if (p.sys === 'kit_moust_enr' && p.W > 1.8) W.push('Enroulable > 1,80 m : préférer la plissée.');
        var L = [
          { item: 'alu_cadre_moust', qty: h.r2(2 * (p.W + p.H) * p.n) },
          { item: 'toile_moust', qty: h.r2(p.W * p.H * 1.1 * p.n) },
          { item: p.sys, qty: p.n }
        ];
        var days = h.r1(Math.max(0.3, p.n * 0.12));
        L.push({ item: 'pose_jour', qty: days });
        return { lines: L, warnings: W, laborDays: days, aluSurcharge: p.laquage === 'ral' ? 0.12 : 0,
          summary: p.n + ' × ' + p.W + ' × ' + p.H + ' m' };
      }
    }
  ];

  function interiorRoll(p, h, meca, toile, label) {
    var a = Math.max(1, p.W * p.H);
    var L = [
      { item: meca, qty: h.r2(p.W * p.n) },
      { item: toile, qty: h.r2(a * 1.1 * p.n), note: p.W * p.H < 1 ? 'minimum 1 m² / store' : '+10 % de coupe' }
    ];
    if (p.coffre) L.push({ item: 'coffre_enrouleur', qty: h.r2(p.W * p.n) });
    if (p.cmd === 'moteur') { L.push({ item: 'somfy_int', qty: p.n }); L.push({ item: 'somfy_telec', qty: 1 }); L.push({ item: 'electricien', qty: 1 }); }
    L.push({ item: 'visserie', qty: h.ceil(p.n / 6) });
    var days = h.r1(Math.max(0.3, p.n * 0.12));
    L.push({ item: 'pose_jour', qty: days });
    return { lines: L, warnings: p.W > 2.5 ? ['Largeur > 2,50 m : vérifier le tube (risque de flèche).'] : [], laborDays: days,
      summary: label + ' ' + p.n + ' × ' + p.W + ' × ' + p.H + ' m' + (p.cmd === 'moteur' ? ', motorisé' : '') };
  }

  var api = { BOOK: BOOK, SETTINGS: SETTINGS, PRODUCTS: PRODUCTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SLCatalog = api;
})(this);
