/*
 * Store Luxe — catalogue : sources, carnet de prix fournisseurs, réglages, produits.
 *
 * Les prix de départ viennent de l'étude de marché de novembre 2026 (voir
 * docs/etude-prix.md et l'onglet « Étude »). Chaque article garde :
 *   hist : relevés datés {d, v, src}   → prix du jour et plafond 12 mois
 *   max  : plus haut prix recherché    → prix « prudent »
 * Ce sont des prix publics ou des fourchettes de marché, pas vos prix d'achat :
 * remplacez-les par les prix de vos fournisseurs dès que vous les avez.
 */
(function (root) {
  'use strict';

  var SOURCES = {
    lc_veranda: { label: 'lechantier.ma — vérandas et pergolas (relevé 15/06/2026)', url: 'https://lechantier.ma/fr/prix/veranda' },
    lc_verre: { label: 'lechantier.ma — verre trempé et feuilleté (15/06/2026)', url: 'https://lechantier.ma/fr/prix/verre-trempe' },
    lc_bac: { label: 'lechantier.ma — bac acier et panneau sandwich (15/06/2026)', url: 'https://lechantier.ma/fr/prix/bac-acier' },
    lc_mo: { label: 'lechantier.ma — main-d’œuvre (15/06/2026)', url: 'https://lechantier.ma/fr/prix/main-doeuvre' },
    lc_beton: { label: 'lechantier.ma — béton prêt à l’emploi (15/06/2026)', url: 'https://lechantier.ma/fr/prix/beton' },
    lc_alu: { label: 'lechantier.ma — menuiserie aluminium (15/06/2026)', url: 'https://lechantier.ma/en/prix/menuiserie-aluminium' },
    metalcharts: { label: 'MetalCharts — cours LME aluminium et record 2022', url: 'https://metalcharts.org/aluminum-price-history' },
    traders_eur: { label: 'TradersUnion — historique EUR/MAD', url: 'https://tradersunion.com/currencies/price-history/eur-mad/' },
    valuta_eur: { label: 'ValutaFX — historique EUR/MAD', url: 'https://www.valutafx.com/history/eur-mad' },
    valuta_usd: { label: 'ValutaFX — USD/MAD 31/07/2026', url: 'https://www.valutafx.com/history/usd-mad-2026-07-31' },
    mer_usd: { label: 'MoneyExchangeRate — MAD/USD début novembre 2026', url: 'https://moneyexchangerate.org/currencyexchange/mad/usd/50000' },
    perlago: { label: 'Perlago — configurateur pergola ATLAS (relevé 07/11/2026)', url: 'https://www.perlago.ma/4-mod%C3%A8le-atlas-' },
    somfy_sunilus: { label: 'Batiproduits — Somfy Sunilus io, prix public HT', url: 'https://www.batiproduits.com/amp/fiche/produits/motorisation-radio-pour-stores-bannes-sunilus-io-p68905443.html' },
    somfy_eolis: { label: 'Batiproduits — Somfy Eolis 3D Wirefree, prix public HT', url: 'https://www.batiproduits.com/amp/fiche/produits/capteur-de-vent-sans-fil-pour-stores-bannes-eoli-p68905428.html' },
    somfy_altus: { label: 'Kaufland — Somfy Altus 50 RTS 40/17', url: 'https://www.kaufland.fr/product/467265193/' },
    somfy_altus40: { label: 'Dieffematic — Somfy Altus 40 RTS', url: 'https://dieffematic.com/en/products/motor-somfy-altus-40-rts-9-16-1023316-automation-automatisms-original-new' },
    soltis86: { label: 'Bootsshop — Serge Ferrari Soltis 86, prix au m²', url: 'https://bootsshop.at/en/products/das-ideale-gewebe-zwischen-sonnenschutz-und-erforderlicher-beleuchtung' },
    sauleda: { label: 'H2R — toile Sauleda au mètre', url: 'https://www.h2r-equipements.com/tissus-pour-bateau/7986-sauleda-tissu-sea-star-lin.html' },
    poly_fr: { label: 'Castorama — polycarbonate alvéolaire 16 mm', url: 'https://www.castorama.fr/plaque-alveolaire-polycarbonate-transparent-300-x-100-cm-ep-16-mm-vendue-a-la-plaque/8691756900120_CAFR.prd' },
    banne_fr: { label: 'La Prime Énergie — prix des stores bannes 2026 (France)', url: 'https://www.laprimeenergie.fr/les-travaux/store-banne/prix' },
    alibaba: { label: 'Alibaba — pergola bioclimatique motorisée, prix échantillon', url: 'https://www.alibaba.com/product-detail/Brand-new-high-quality-Motorized-Louver_1601028447957.html' },
    akena: { label: 'Akena — prix pergolas bioclimatiques (Europe)', url: 'https://www.akena.com/en/pergolas/pergolas-price?page=1' },
    est: { label: 'Estimation de l’étude, à confirmer par votre fournisseur', url: '' },
    manuel: { label: 'Saisie de l’équipe', url: '' },
    facture: { label: 'Facture fournisseur lue par Claude, validée par l’équipe', url: '' }
  };

  /* Relevé daté. */
  function pt(d, v, src) { return { d: d, v: v, src: src }; }

  var BOOK = {
    /* ---------- Indices ---------- */
    alu_kg: {
      name: 'Aluminium profilé thermolaqué', unit: 'MAD/kg', cat: 'indice', type: 'index',
      hist: [
        pt('2024-06-28', 48.2, 'metalcharts'),
        pt('2025-06-30', 48.3, 'metalcharts'),
        pt('2026-06-05', 57.5, 'metalcharts'),
        pt('2026-11-07', 53.6, 'metalcharts')
      ],
      max: 65.7, maxSrc: 'metalcharts', maxNote: 'record LME 4 073 $/t (mars 2022) reconstitué',
      note: 'Reconstitué : (LME + prime 500 $/t + filage-laquage 1 900 $/t) × USD/MAD. Remplacez par le prix au kg de votre extrudeur.'
    },
    eur_mad: {
      name: 'Cours EUR → MAD', unit: 'MAD/€', cat: 'indice', type: 'index',
      hist: [
        pt('2024-12-31', 10.755, 'traders_eur'),
        pt('2025-12-31', 10.54, 'traders_eur'),
        pt('2026-01-27', 10.902, 'valuta_eur'),
        pt('2026-04-07', 10.964, 'traders_eur'),
        pt('2026-07-24', 10.68, 'valuta_eur'),
        pt('2026-11-03', 10.8, 'est')
      ],
      max: 10.964, maxSrc: 'traders_eur', maxNote: 'plus haut 2026 (7 avril)',
      note: 'Moyennes annuelles 2024-2025 puis relevés 2026. Le point de novembre est une estimation : saisissez le cours de votre banque.'
    },
    usd_mad: {
      name: 'Cours USD → MAD', unit: 'MAD/$', cat: 'indice', type: 'index', hidden: true,
      hist: [pt('2026-07-31', 9.314, 'valuta_usd'), pt('2026-11-03', 9.8, 'mer_usd')],
      note: 'Sert uniquement au calcul de l’indice alu depuis la cote LME.'
    },

    /* ---------- Profilés aluminium : kg par unité × indice + façonnage ---------- */
    alu_poutre_bioclim: { name: 'Poutre cadre bioclimatique 190×235', unit: 'ml', cat: 'matiere', type: 'alu', kg: 9.2, fab: 60, group: 'Profilés aluminium' },
    alu_poteau_150: { name: 'Poteau 150×150 (EP intégrée)', unit: 'ml', cat: 'matiere', type: 'alu', kg: 4.7, fab: 30, group: 'Profilés aluminium' },
    alu_lames_bioclim: { name: 'Lames orientables + pivots (toiture)', unit: 'm²', cat: 'matiere', type: 'alu', kg: 16, fab: 140, group: 'Profilés aluminium' },
    alu_cheneau: { name: 'Chéneau / descente eaux pluviales', unit: 'ml', cat: 'matiere', type: 'alu', kg: 1.8, fab: 25, group: 'Profilés aluminium' },
    alu_poutre_fixe: { name: 'Poutre pergola fixe / carport', unit: 'ml', cat: 'matiere', type: 'alu', kg: 4.2, fab: 35, group: 'Profilés aluminium' },
    alu_chevron: { name: 'Chevron porteur de couverture', unit: 'ml', cat: 'matiere', type: 'alu', kg: 1.9, fab: 15, group: 'Profilés aluminium' },
    alu_poteau_100: { name: 'Poteau 100×100', unit: 'ml', cat: 'matiere', type: 'alu', kg: 2.6, fab: 20, group: 'Profilés aluminium' },
    alu_rail_toile: { name: 'Rail de guidage pergola toile', unit: 'ml', cat: 'matiere', type: 'alu', kg: 2.2, fab: 40, group: 'Profilés aluminium' },
    alu_veranda_facade: { name: 'Menuiserie coulissante véranda', unit: 'm²', cat: 'matiere', type: 'alu', kg: 7.5, fab: 260, group: 'Profilés aluminium' },
    alu_veranda_toiture: { name: 'Ossature de toiture véranda', unit: 'm²', cat: 'matiere', type: 'alu', kg: 5, fab: 90, group: 'Profilés aluminium' },
    alu_zip_coffre: { name: 'Coffre + barre de charge ZIP', unit: 'ml', cat: 'matiere', type: 'alu', kg: 3.1, fab: 60, group: 'Profilés aluminium' },
    alu_zip_guides: { name: 'Coulisse ZIP', unit: 'ml', cat: 'matiere', type: 'alu', kg: 0.8, fab: 15, group: 'Profilés aluminium' },
    alu_cadre_moust: { name: 'Profil cadre moustiquaire', unit: 'ml', cat: 'matiere', type: 'alu', kg: 0.45, fab: 12, group: 'Profilés aluminium' },

    /* ---------- Couvertures et vitrages (fournitures, marché marocain) ---------- */
    poly_16: { name: 'Polycarbonate alvéolaire 16 mm', unit: 'm²', cat: 'matiere', type: 'mad', group: 'Couvertures & vitrages',
      hist: [pt('2026-06-15', 220, 'lc_veranda')], max: 300, maxSrc: 'est', note: 'Posé : 350 à 650 DH/m² au Maroc ; France 15-17 €/m² en magasin.' },
    poly_compact: { name: 'Polycarbonate compact 6 mm', unit: 'm²', cat: 'matiere', type: 'mad', group: 'Couvertures & vitrages',
      hist: [pt('2026-06-15', 380, 'est')], max: 480, maxSrc: 'est' },
    verre_442: { name: 'Verre feuilleté 44.2', unit: 'm²', cat: 'matiere', type: 'mad', group: 'Couvertures & vitrages',
      hist: [pt('2026-06-15', 560, 'lc_verre')], max: 750, maxSrc: 'lc_verre', note: 'Fourchette marché 450 à 750 DH/m².' },
    sandwich_40: { name: 'Panneau sandwich 40 mm PUR', unit: 'm²', cat: 'matiere', type: 'mad', group: 'Couvertures & vitrages',
      hist: [pt('2026-06-15', 210, 'lc_bac')], max: 240, maxSrc: 'lc_bac', note: 'Fourchette marché 180 à 240 DH/m².' },
    tole_bac: { name: 'Bac acier prélaqué 0,5 mm', unit: 'm²', cat: 'matiere', type: 'mad', group: 'Couvertures & vitrages',
      hist: [pt('2026-06-15', 135, 'lc_bac')], max: 190, maxSrc: 'lc_bac', note: '110 à 160 DH/m² ; 0,7 mm renforcé jusqu’à 190.' },
    vitre_trempe: { name: 'Verre trempé clair 6 mm', unit: 'm²', cat: 'matiere', type: 'mad', group: 'Couvertures & vitrages',
      hist: [pt('2026-06-15', 340, 'lc_verre')], max: 450, maxSrc: 'lc_verre' },
    double_vitrage: { name: 'Double vitrage 4/16/4 trempé', unit: 'm²', cat: 'matiere', type: 'mad', group: 'Couvertures & vitrages',
      hist: [pt('2026-06-15', 820, 'lc_verre')], max: 1100, maxSrc: 'lc_verre', note: 'Fourchette marché 650 à 1 100 DH/m².' },
    controle_solaire: { name: 'Double vitrage contrôle solaire', unit: 'm²', cat: 'matiere', type: 'mad', group: 'Couvertures & vitrages',
      hist: [pt('2026-06-15', 1000, 'est')], max: 1350, maxSrc: 'est', note: 'Double vitrage + 20 à 25 % pour la couche de contrôle solaire.' },
    vitrage_coulissant: { name: 'Panneaux verre coulissants (cadre + trempé 8 mm)', unit: 'm²', cat: 'equipement', type: 'mad', group: 'Couvertures & vitrages',
      hist: [pt('2026-06-15', 1600, 'lc_alu')], max: 2200, maxSrc: 'est', note: 'Baie coulissante posée : 2 800 à 4 500 DH/m² ; fourniture estimée.' },

    /* ---------- Toiles ---------- */
    toile_sauleda: { name: 'Toile acrylique Sauleda / Dickson', unit: 'm²', cat: 'matiere', type: 'eur', group: 'Toiles', supplier: 'Sauleda',
      hist: [pt('2026-06-15', 16, 'sauleda')], max: 24, maxSrc: 'sauleda', note: 'Public 18 à 40 €/m² TTC ; prix professionnel estimé.' },
    toile_ferrari: { name: 'Serge Ferrari Soltis 86 (screen)', unit: 'm²', cat: 'matiere', type: 'eur', group: 'Toiles', supplier: 'Serge Ferrari',
      hist: [pt('2026-06-15', 22, 'soltis86')], max: 28, maxSrc: 'soltis86', note: 'Public 33,90 €/m² TTC (28 € HT).' },
    toile_ferrari_occ: { name: 'Serge Ferrari occultante (Soltis B92)', unit: 'm²', cat: 'matiere', type: 'eur', group: 'Toiles', supplier: 'Serge Ferrari',
      hist: [pt('2026-06-15', 28, 'est')], max: 36, maxSrc: 'est' },
    toile_pergola: { name: 'Toile PVC pergola rétractable', unit: 'm²', cat: 'matiere', type: 'eur', group: 'Toiles',
      hist: [pt('2026-06-15', 19, 'est')], max: 26, maxSrc: 'est' },
    toile_hdpe: { name: 'Toile ombrage HDPE micro-perforée', unit: 'm²', cat: 'matiere', type: 'mad', group: 'Toiles',
      hist: [pt('2026-06-15', 85, 'est')], max: 120, maxSrc: 'est' },
    toile_pvc: { name: 'Toile PVC enduite imperméable', unit: 'm²', cat: 'matiere', type: 'mad', group: 'Toiles',
      hist: [pt('2026-06-15', 175, 'est')], max: 240, maxSrc: 'est' },
    confection_voile: { name: 'Confection voile (ourlet + ralingue)', unit: 'ml', cat: 'matiere', type: 'mad', group: 'Toiles',
      hist: [pt('2026-06-15', 45, 'est')], max: 60, maxSrc: 'est' },
    toile_tamisant: { name: 'Toile enrouleur tamisante', unit: 'm²', cat: 'matiere', type: 'mad', group: 'Toiles', hist: [pt('2026-06-15', 110, 'est')], max: 150, maxSrc: 'est' },
    toile_occultant: { name: 'Toile enrouleur occultante', unit: 'm²', cat: 'matiere', type: 'mad', group: 'Toiles', hist: [pt('2026-06-15', 150, 'est')], max: 200, maxSrc: 'est' },
    toile_screen_int: { name: 'Toile enrouleur screen', unit: 'm²', cat: 'matiere', type: 'mad', group: 'Toiles', hist: [pt('2026-06-15', 170, 'est')], max: 230, maxSrc: 'est' },
    toile_jour_nuit: { name: 'Toile double voile jour & nuit', unit: 'm²', cat: 'matiere', type: 'mad', group: 'Toiles', hist: [pt('2026-06-15', 210, 'est')], max: 280, maxSrc: 'est' },
    toile_moust: { name: 'Toile moustiquaire fibre de verre', unit: 'm²', cat: 'matiere', type: 'mad', group: 'Toiles', hist: [pt('2026-06-15', 45, 'est')], max: 65, maxSrc: 'est' },

    /* ---------- Systèmes de stores (Gaviota, Llaza, Siplan) ---------- */
    banne_monobloc: { name: 'Système store banne monobloc', unit: 'ml', cat: 'equipement', type: 'eur', group: 'Systèmes de stores', supplier: 'Gaviota / Llaza',
      hist: [pt('2026-06-15', 75, 'banne_fr')], max: 110, maxSrc: 'banne_fr', note: 'France : monobloc manuel posé 600 à 1 200 €.' },
    banne_semicoffre: { name: 'Système store banne semi-coffre', unit: 'ml', cat: 'equipement', type: 'eur', group: 'Systèmes de stores', supplier: 'Gaviota / Llaza',
      hist: [pt('2026-06-15', 110, 'banne_fr')], max: 160, maxSrc: 'banne_fr' },
    banne_coffre: { name: 'Système store banne coffre intégral', unit: 'ml', cat: 'equipement', type: 'eur', group: 'Systèmes de stores', supplier: 'Gaviota / Llaza',
      hist: [pt('2026-06-15', 165, 'banne_fr')], max: 240, maxSrc: 'banne_fr', note: 'France : coffre motorisé hors pose 700 à 3 400 €.' },
    banne_bras_renfort: { name: 'Bras renforcés grande avancée (paire)', unit: 'u', cat: 'equipement', type: 'eur', group: 'Systèmes de stores', hist: [pt('2026-06-15', 150, 'est')], max: 200, maxSrc: 'est' },
    banne_led_bras: { name: 'LED intégrées dans les bras (paire)', unit: 'u', cat: 'equipement', type: 'eur', group: 'Systèmes de stores', hist: [pt('2026-06-15', 140, 'est')], max: 190, maxSrc: 'est' },
    pergola_toile_meca: { name: 'Mécanique pergola toile (chariots, tendeurs)', unit: 'module', cat: 'equipement', type: 'eur', group: 'Systèmes de stores', hist: [pt('2026-06-15', 420, 'est')], max: 560, maxSrc: 'est' },
    manivelle: { name: 'Treuil + manivelle', unit: 'u', cat: 'equipement', type: 'mad', group: 'Systèmes de stores', hist: [pt('2026-06-15', 160, 'est')], max: 220, maxSrc: 'est' },
    treuil_zip: { name: 'Manœuvre manuelle ZIP', unit: 'u', cat: 'equipement', type: 'mad', group: 'Systèmes de stores', hist: [pt('2026-06-15', 240, 'est')], max: 320, maxSrc: 'est' },
    meca_enrouleur: { name: 'Mécanisme enrouleur (tube + chaînette)', unit: 'ml', cat: 'equipement', type: 'mad', group: 'Systèmes de stores', hist: [pt('2026-06-15', 115, 'est')], max: 160, maxSrc: 'est' },
    meca_jour_nuit: { name: 'Mécanisme jour & nuit', unit: 'ml', cat: 'equipement', type: 'mad', group: 'Systèmes de stores', hist: [pt('2026-06-15', 145, 'est')], max: 200, maxSrc: 'est' },
    coffre_enrouleur: { name: 'Coffre enrouleur', unit: 'ml', cat: 'equipement', type: 'mad', group: 'Systèmes de stores', hist: [pt('2026-06-15', 130, 'est')], max: 180, maxSrc: 'est' },
    venitien_25: { name: 'Store vénitien alu lames 25 mm', unit: 'm²', cat: 'equipement', type: 'mad', group: 'Systèmes de stores', hist: [pt('2026-06-15', 360, 'est')], max: 480, maxSrc: 'est' },
    venitien_50: { name: 'Store vénitien alu lames 50 mm', unit: 'm²', cat: 'equipement', type: 'mad', group: 'Systèmes de stores', hist: [pt('2026-06-15', 510, 'est')], max: 680, maxSrc: 'est' },
    guidage_cable: { name: 'Guidage latéral par câble', unit: 'ml', cat: 'equipement', type: 'mad', group: 'Systèmes de stores', hist: [pt('2026-06-15', 35, 'est')], max: 50, maxSrc: 'est' },
    kit_moust_fixe: { name: 'Kit moustiquaire fixe', unit: 'u', cat: 'equipement', type: 'mad', group: 'Systèmes de stores', hist: [pt('2026-06-15', 60, 'est')], max: 90, maxSrc: 'est' },
    kit_moust_coul: { name: 'Kit moustiquaire coulissante', unit: 'u', cat: 'equipement', type: 'mad', group: 'Systèmes de stores', hist: [pt('2026-06-15', 130, 'est')], max: 180, maxSrc: 'est', note: 'Marché marocain : moustiquaire coulissante posée 420 à 700 MAD/m².' },
    kit_moust_enr: { name: 'Kit moustiquaire enroulable', unit: 'u', cat: 'equipement', type: 'mad', group: 'Systèmes de stores', hist: [pt('2026-06-15', 480, 'est')], max: 650, maxSrc: 'est' },
    kit_moust_pli: { name: 'Kit moustiquaire plissée', unit: 'u', cat: 'equipement', type: 'mad', group: 'Systèmes de stores', hist: [pt('2026-06-15', 650, 'est')], max: 850, maxSrc: 'est' },

    /* ---------- Motorisation (Somfy) et électricité ---------- */
    verin_bioclim: { name: 'Vérin 24 V + télécommande (lames)', unit: 'u', cat: 'equipement', type: 'eur', group: 'Motorisation & éclairage', hist: [pt('2026-06-15', 360, 'est')], max: 450, maxSrc: 'est' },
    capteur_pluie_vent: { name: 'Capteur pluie / vent pergola', unit: 'u', cat: 'equipement', type: 'eur', group: 'Motorisation & éclairage', hist: [pt('2026-06-15', 115, 'est')], max: 150, maxSrc: 'est' },
    somfy_banne: { name: 'Moteur Somfy store banne (Sunilus io / Altus RTS)', unit: 'u', cat: 'equipement', type: 'eur', group: 'Motorisation & éclairage', supplier: 'Somfy',
      hist: [pt('2026-06-15', 202, 'somfy_sunilus')], max: 355, maxSrc: 'somfy_altus', note: 'Sunilus io : 202 € HT public ; Altus 50 RTS 40 Nm jusqu’à 355 €.' },
    somfy_zip: { name: 'Moteur Somfy ZIP (Sunea screen io)', unit: 'u', cat: 'equipement', type: 'eur', group: 'Motorisation & éclairage', supplier: 'Somfy',
      hist: [pt('2026-06-15', 230, 'est')], max: 320, maxSrc: 'est' },
    somfy_int: { name: 'Moteur Somfy store intérieur (Altus 40 RTS)', unit: 'u', cat: 'equipement', type: 'eur', group: 'Motorisation & éclairage', supplier: 'Somfy',
      hist: [pt('2026-06-15', 138, 'somfy_altus40')], max: 230, maxSrc: 'somfy_altus40', note: 'Altus 40 RTS 138 € HT ; Altus 50 RTS 230 €.' },
    somfy_telec: { name: 'Télécommande Somfy Situo', unit: 'u', cat: 'equipement', type: 'eur', group: 'Motorisation & éclairage', supplier: 'Somfy', hist: [pt('2026-06-15', 48, 'est')], max: 65, maxSrc: 'est' },
    somfy_eolis: { name: 'Capteur vent Somfy Eolis 3D Wirefree', unit: 'u', cat: 'equipement', type: 'eur', group: 'Motorisation & éclairage', supplier: 'Somfy',
      hist: [pt('2026-06-15', 99, 'somfy_eolis')], max: 116, maxSrc: 'somfy_eolis', note: '99 € HT public (RTS) ; version io ~116 €.' },
    spot_led: { name: 'Spot LED 24 V dimmable 3000 K IP54', unit: 'u', cat: 'equipement', type: 'mad', group: 'Motorisation & éclairage', hist: [pt('2026-06-15', 175, 'est')], max: 240, maxSrc: 'est', note: 'Perlago facture 8 spots +5 008 MAD TTC.' },
    led_blanc: { name: 'Ruban LED blanc', unit: 'ml', cat: 'equipement', type: 'mad', group: 'Motorisation & éclairage', hist: [pt('2026-06-15', 55, 'est')], max: 80, maxSrc: 'est' },
    led_rgb: { name: 'Ruban LED RGB', unit: 'ml', cat: 'equipement', type: 'mad', group: 'Motorisation & éclairage', hist: [pt('2026-06-15', 90, 'est')], max: 130, maxSrc: 'est' },
    alim_led: { name: 'Alimentation + variateur LED', unit: 'u', cat: 'equipement', type: 'mad', group: 'Motorisation & éclairage', hist: [pt('2026-06-15', 380, 'est')], max: 520, maxSrc: 'est' },
    chauffage_ir: { name: 'Chauffage infrarouge 2 kW', unit: 'u', cat: 'equipement', type: 'mad', group: 'Motorisation & éclairage', hist: [pt('2026-06-15', 2200, 'est')], max: 3000, maxSrc: 'est' },
    kit_melody: { name: 'Kit audio intégré poteaux', unit: 'u', cat: 'equipement', type: 'mad', group: 'Motorisation & éclairage', hist: [pt('2026-06-15', 3400, 'est')], max: 4500, maxSrc: 'est' },
    brumisateur: { name: 'Kit brumisateur', unit: 'u', cat: 'equipement', type: 'mad', group: 'Motorisation & éclairage', hist: [pt('2026-06-15', 2400, 'est')], max: 3200, maxSrc: 'est' },

    /* ---------- Fixations et gros œuvre ---------- */
    platine: { name: 'Platine de pied de poteau', unit: 'u', cat: 'matiere', type: 'mad', group: 'Fixations & gros œuvre', hist: [pt('2026-06-15', 165, 'est')], max: 220, maxSrc: 'est' },
    cheville_chim: { name: 'Cheville chimique + tige inox', unit: 'u', cat: 'matiere', type: 'mad', group: 'Fixations & gros œuvre', hist: [pt('2026-06-15', 42, 'est')], max: 60, maxSrc: 'est' },
    visserie: { name: 'Visserie, joints, silicone (lot)', unit: 'lot', cat: 'matiere', type: 'mad', group: 'Fixations & gros œuvre', hist: [pt('2026-06-15', 250, 'est')], max: 320, maxSrc: 'est' },
    console_ite: { name: 'Console déportée pour façade isolée', unit: 'u', cat: 'matiere', type: 'mad', group: 'Fixations & gros œuvre', hist: [pt('2026-06-15', 450, 'est')], max: 600, maxSrc: 'est' },
    mat_acier: { name: 'Mât acier galvanisé Ø 114', unit: 'ml', cat: 'matiere', type: 'mad', group: 'Fixations & gros œuvre', hist: [pt('2026-06-15', 520, 'est')], max: 700, maxSrc: 'est' },
    fondation: { name: 'Massif béton B25 0,2 m³ (fourniture + ferraillage)', unit: 'u', cat: 'matiere', type: 'mad', group: 'Fixations & gros œuvre',
      hist: [pt('2026-06-15', 650, 'lc_beton')], max: 800, maxSrc: 'lc_beton', note: 'Béton B25 : 950 à 1 100 DH/m³ + pompage 150 à 250.' },
    ancrage_facade: { name: 'Ancrage façade inox pour voile', unit: 'u', cat: 'matiere', type: 'mad', group: 'Fixations & gros œuvre', hist: [pt('2026-06-15', 240, 'est')], max: 320, maxSrc: 'est' },
    tendeur: { name: 'Tendeur inox + manille', unit: 'u', cat: 'matiere', type: 'mad', group: 'Fixations & gros œuvre', hist: [pt('2026-06-15', 110, 'est')], max: 150, maxSrc: 'est' },

    /* ---------- Métaux au kilo (structures acier, inox, galvanisé) ---------- */
    metal_alu_kg: { name: 'Aluminium profilé, au kilo', unit: 'kg', cat: 'matiere', type: 'alu', kg: 1, fab: 0, group: 'Métaux au kilo' },
    acier_kg: { name: 'Tube acier noir (fer)', unit: 'kg', cat: 'matiere', type: 'mad', group: 'Métaux au kilo', hist: [pt('2026-06-15', 14, 'est')], max: 18, maxSrc: 'est', note: 'Tube soudé S235, prix négoce marocain estimé.' },
    galva_kg: { name: 'Tube acier galvanisé', unit: 'kg', cat: 'matiere', type: 'mad', group: 'Métaux au kilo', hist: [pt('2026-06-15', 20, 'est')], max: 26, maxSrc: 'est' },
    inox_kg: { name: 'Tube inox 304', unit: 'kg', cat: 'matiere', type: 'mad', group: 'Métaux au kilo', hist: [pt('2026-06-15', 65, 'est')], max: 85, maxSrc: 'est', note: 'Inox 316 (bord de mer) : environ +30 %.' },
    fab_acier_kg: { name: 'Façonnage acier (découpe, soudure, perçage)', unit: 'kg', cat: 'matiere', type: 'mad', group: 'Métaux au kilo', hist: [pt('2026-06-15', 9, 'est')], max: 12, maxSrc: 'est' },
    fab_inox_kg: { name: 'Façonnage inox (soudure TIG, polissage)', unit: 'kg', cat: 'matiere', type: 'mad', group: 'Métaux au kilo', hist: [pt('2026-06-15', 24, 'est')], max: 30, maxSrc: 'est' },
    fab_alu_kg: { name: 'Façonnage aluminium (découpe, assemblage)', unit: 'kg', cat: 'matiere', type: 'mad', group: 'Métaux au kilo', hist: [pt('2026-06-15', 8, 'est')], max: 11, maxSrc: 'est' },
    peinture_acier_kg: { name: 'Antirouille + laque (acier noir)', unit: 'kg', cat: 'matiere', type: 'mad', group: 'Métaux au kilo', hist: [pt('2026-06-15', 6, 'est')], max: 8, maxSrc: 'est' },

    /* ---------- Bâches et toiles, en 1er et 2e choix ---------- */
    bache_pvc_1: { name: 'Bâche PVC 1er choix (≈ 650 g/m², traitée UV)', unit: 'm²', cat: 'matiere', type: 'mad', group: 'Toiles', hist: [pt('2026-06-15', 160, 'est')], max: 220, maxSrc: 'est' },
    bache_pvc_2: { name: 'Bâche PVC 2e choix', unit: 'm²', cat: 'matiere', type: 'mad', group: 'Toiles', hist: [pt('2026-06-15', 75, 'est')], max: 100, maxSrc: 'est' },
    toile_tissee_1: { name: 'Toile tissée 1er choix (acrylique teintée masse)', unit: 'm²', cat: 'matiere', type: 'mad', group: 'Toiles', hist: [pt('2026-06-15', 180, 'est')], max: 240, maxSrc: 'est' },
    toile_tissee_2: { name: 'Toile tissée 2e choix (polyester)', unit: 'm²', cat: 'matiere', type: 'mad', group: 'Toiles', hist: [pt('2026-06-15', 110, 'est')], max: 150, maxSrc: 'est' },
    screen_std: { name: 'Toile screen standard (polyester enduit)', unit: 'm²', cat: 'matiere', type: 'mad', group: 'Toiles', hist: [pt('2026-06-15', 110, 'est')], max: 150, maxSrc: 'est' },
    toile_banne_std: { name: 'Toile store banne standard (polyester / acrylique import)', unit: 'm²', cat: 'matiere', type: 'mad', group: 'Toiles', hist: [pt('2026-06-15', 120, 'est')], max: 160, maxSrc: 'est' },
    poly_16_2: { name: 'Polycarbonate alvéolaire 16 mm, 2e choix', unit: 'm²', cat: 'matiere', type: 'mad', group: 'Couvertures & vitrages', hist: [pt('2026-06-15', 165, 'est')], max: 220, maxSrc: 'est' },
    dalakit: { name: 'Plafond « Dalakit » (à préciser)', unit: 'm²', cat: 'matiere', type: 'mad', group: 'Couvertures & vitrages', hist: [pt('2026-06-15', 240, 'est')], max: 320, maxSrc: 'est', note: 'Produit à confirmer par Store Luxe : prix provisoire.' },

    /* ---------- Câbles et accastillage ---------- */
    cable_inox: { name: 'Câble inox 316 Ø 6 mm', unit: 'ml', cat: 'matiere', type: 'mad', group: 'Fixations & gros œuvre', hist: [pt('2026-06-15', 28, 'est')], max: 38, maxSrc: 'est' },
    cable_galva: { name: 'Câble acier galvanisé Ø 6 mm', unit: 'ml', cat: 'matiere', type: 'mad', group: 'Fixations & gros œuvre', hist: [pt('2026-06-15', 9, 'est')], max: 13, maxSrc: 'est' },
    accast_inox: { name: 'Accastillage inox par point (ridoir, manille, plaque)', unit: 'point', cat: 'matiere', type: 'mad', group: 'Fixations & gros œuvre', hist: [pt('2026-06-15', 260, 'est')], max: 340, maxSrc: 'est' },
    accast_galva: { name: 'Accastillage galvanisé par point', unit: 'point', cat: 'matiere', type: 'mad', group: 'Fixations & gros œuvre', hist: [pt('2026-06-15', 90, 'est')], max: 120, maxSrc: 'est' },

    /* ---------- Mécanismes standard (import) face aux marques ---------- */
    banne_mono_std: { name: 'Mécanisme store banne monobloc standard', unit: 'ml', cat: 'equipement', type: 'mad', group: 'Systèmes de stores', hist: [pt('2026-06-15', 420, 'est')], max: 540, maxSrc: 'est' },
    banne_coffre_std: { name: 'Mécanisme store banne coffre standard', unit: 'ml', cat: 'equipement', type: 'mad', group: 'Systèmes de stores', hist: [pt('2026-06-15', 850, 'est')], max: 1080, maxSrc: 'est' },
    moteur_std: { name: 'Moteur tubulaire standard + télécommande', unit: 'u', cat: 'equipement', type: 'mad', group: 'Motorisation & éclairage', hist: [pt('2026-06-15', 950, 'est')], max: 1250, maxSrc: 'est' },
    zip_coffre_std: { name: 'Coffre + barre ZIP standard', unit: 'ml', cat: 'equipement', type: 'mad', group: 'Systèmes de stores', hist: [pt('2026-06-15', 320, 'est')], max: 420, maxSrc: 'est' },
    zip_guides_std: { name: 'Coulisse ZIP standard', unit: 'ml', cat: 'equipement', type: 'mad', group: 'Systèmes de stores', hist: [pt('2026-06-15', 55, 'est')], max: 75, maxSrc: 'est' },
    moteur_zip_std: { name: 'Moteur ZIP standard', unit: 'u', cat: 'equipement', type: 'mad', group: 'Motorisation & éclairage', hist: [pt('2026-06-15', 850, 'est')], max: 1100, maxSrc: 'est' },
    inter_mural: { name: 'Interrupteur mural montée / descente', unit: 'u', cat: 'equipement', type: 'mad', group: 'Motorisation & éclairage', hist: [pt('2026-06-15', 180, 'est')], max: 240, maxSrc: 'est' },
    telec_std: { name: 'Télécommande standard', unit: 'u', cat: 'equipement', type: 'mad', group: 'Motorisation & éclairage', hist: [pt('2026-06-15', 150, 'est')], max: 200, maxSrc: 'est' },

    /* ---------- Véranda bois / accordéon ---------- */
    bois_facade: { name: 'Menuiserie bois traité (façade vitrée)', unit: 'm²', cat: 'matiere', type: 'mad', group: 'Couvertures & vitrages', hist: [pt('2026-06-15', 1150, 'est')], max: 1450, maxSrc: 'est' },
    bois_toiture: { name: 'Charpente bois lamellé-collé (toiture)', unit: 'm²', cat: 'matiere', type: 'mad', group: 'Couvertures & vitrages', hist: [pt('2026-06-15', 380, 'est')], max: 480, maxSrc: 'est' },
    bois_poteau: { name: 'Poteau bois lamellé-collé 140×140', unit: 'ml', cat: 'matiere', type: 'mad', group: 'Couvertures & vitrages', hist: [pt('2026-06-15', 260, 'est')], max: 330, maxSrc: 'est' },
    alu_veranda_accordeon: { name: 'Menuiserie accordéon aluminium', unit: 'm²', cat: 'matiere', type: 'alu', kg: 9, fab: 640, group: 'Profilés aluminium' },

    /* ---------- Main-d'œuvre ---------- */
    pose_jour: { name: 'Équipe de pose (chef poseur + aide)', unit: 'jour', cat: 'pose', type: 'mad', group: 'Main-d’œuvre', buffer: 0, noStale: true,
      hist: [pt('2026-06-15', 1300, 'lc_mo')], max: 1500, maxSrc: 'lc_mo', note: 'Salaires 450 + 250 DH/j, charges, véhicule et outillage.' },
    electricien: { name: 'Raccordement électrique', unit: 'forfait', cat: 'pose', type: 'mad', group: 'Main-d’œuvre', buffer: 0, noStale: true,
      hist: [pt('2026-06-15', 900, 'lc_mo')], max: 1200, maxSrc: 'lc_mo', note: 'Électricien 300 à 550 DH/j + câble et protection.' }
  };

  var SETTINGS = {
    policy: { windowDays: 365, buffer: 0.02, base: 'win' },
    landedEur: 0.25,
    tva: 0.20,
    rounding: 50,
    validityDays: 15,
    staleDays: 60,
    lodgingPerNight: 700,
    access: { facile: 1, normal: 1.15, difficile: 1.35, hauteur: 1.6 },
    zones: [
      { id: 'agadir', name: 'Agadir', cost: 0, lodging: false },
      { id: 'souss', name: 'Souss-Massa (Taghazout, Aourir, Taroudant…)', cost: 600, lodging: false },
      { id: 'sud', name: 'Essaouira, Tiznit, Guelmim', cost: 1800, lodging: true },
      { id: 'marrakech', name: 'Marrakech', cost: 2500, lodging: true },
      { id: 'casa', name: 'Casablanca, Rabat', cost: 4500, lodging: true },
      { id: 'nord', name: 'Tanger, Fès, Oujda', cost: 6500, lodging: true }
    ],
    margins: {},
    conditions: 'Acompte de 50 % à la commande, solde à la fin de la pose. Fabrication : 3 à 5 semaines après relevé et validation. Prix estimatif, confirmé après relevé sur site.'
  };

  /* ---------- Briques réutilisées ---------- */
  function zipLines(w, h, cmd, toile, n) {
    n = n || 1;
    var L = [
      { item: 'alu_zip_coffre', qty: +(w * n).toFixed(2), note: n + ' × ' + w.toFixed(2) + ' m' },
      { item: 'alu_zip_guides', qty: +(2 * h * n).toFixed(2), note: '2 coulisses × ' + h.toFixed(2) + ' m' },
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

  /* Fermetures latérales d'une pergola : ZIP ou vitrage coulissant. */
  var SIDES = {
    aucun: [], avant: ['front'], avant1: ['front', 'right'], trois: ['front', 'left', 'right'], quatre: ['front', 'back', 'left', 'right']
  };
  function closures(p, h, L, auto, W) {
    var sides = SIDES[p.cotes] || [];
    if (p.cotes === 'quatre' && !auto) { W.push('4 côtés fermés : seulement possible en autoportante.'); sides = SIDES.trois; }
    var count = 0, geo = [];
    sides.forEach(function (s) {
      var w = s === 'front' || s === 'back' ? p.L : p.P;
      geo.push({ side: s, type: p.ferm });
      if (p.ferm === 'verre') {
        L.push({ item: 'vitrage_coulissant', qty: h.r2(w * p.H), note: 'côté ' + w.toFixed(2) + ' × ' + p.H.toFixed(2) + ' m' });
        count += 1;
      } else {
        var n = h.ceil(w / 5); count += n;
        zipLines(w / n, p.H, p.zipCmd, 'screen', n).forEach(function (l) { L.push(l); });
      }
    });
    return { count: count, geo: geo };
  }

  function posts(L, P, spans, auto) {
    var out = [];
    for (var i = 0; i <= spans; i++) {
      var x = L * i / spans;
      out.push([x, P]);
      if (auto) out.push([x, 0]);
    }
    return out;
  }

  function ralSurcharge(ral) { return ral === 'sable' ? 0.06 : ral === 'special' ? 0.15 : 0; }

  var RAL = { id: 'ral', sec: 'Finitions', label: 'Coloris aluminium', type: 'ral', def: 'standard', options: [
    { v: 'standard', l: 'Standard', sub: 'RAL 9010 · 7016 · 9005', sw: ['#F1EDE1', '#383E42', '#0E0E10'] },
    { v: 'sable', l: 'Texturé sablé', sub: '+6 % sur l’alu', sw: ['#7A7B76', '#E1CC4F', '#1F4764'] },
    { v: 'special', l: 'Hors gamme / imitation bois', sub: '+15 % sur l’alu', sw: ['#8A5A36', '#6E2C27', '#5E6B3A'] }
  ] };
  var CONFIG = { id: 'config', sec: 'Structure', label: 'Pose', type: 'seg', def: 'adossee', options: [{ v: 'adossee', l: 'Adossée à la façade' }, { v: 'autoportante', l: 'Autoportante' }] };
  var COTES = { id: 'cotes', sec: 'Fermetures', label: 'Côtés fermés', type: 'select', def: 'aucun', options: [
    { v: 'aucun', l: 'Aucun' }, { v: 'avant', l: 'Face avant' }, { v: 'avant1', l: 'Face avant + 1 côté' }, { v: 'trois', l: '3 côtés' }, { v: 'quatre', l: '4 côtés (autoportante)' }] };
  var FERM = { id: 'ferm', sec: 'Fermetures', label: 'Type de fermeture', type: 'seg', def: 'zip', options: [{ v: 'zip', l: 'Stores ZIP' }, { v: 'verre', l: 'Vitrage coulissant' }],
    showIf: function (p) { return p.cotes !== 'aucun'; } };
  var ZIPCMD = { id: 'zipCmd', sec: 'Fermetures', label: 'Commande des ZIP', type: 'seg', def: 'moteur', options: [{ v: 'manuel', l: 'Manuelle' }, { v: 'moteur', l: 'Moteur Somfy' }, { v: 'capteur', l: 'Moteur + capteur vent' }],
    showIf: function (p) { return p.cotes !== 'aucun' && p.ferm === 'zip'; } };
  var CMD3 = function (def) {
    return { id: 'cmd', sec: 'Commande', label: 'Commande', type: 'seg', def: def || 'moteur', options: [{ v: 'manuel', l: 'Manuelle' }, { v: 'moteur', l: 'Moteur Somfy' }, { v: 'capteur', l: 'Moteur + capteur vent' }] };
  };

  /* ---------- Composants de structure métallique : poids réel du tube × prix au kilo ---------- */
  var RHO = { alu: 2.7, galva: 7.85, fer: 7.85, inox: 7.9 }; // densité (kg/dm³)
  var METAL_NAMES = { alu: 'aluminium', galva: 'acier galvanisé', fer: 'acier (fer) peint', inox: 'inox' };
  var METAL_RAL = { alu: 'standard', galva: 'sable', fer: 'standard', inox: 'sable' };
  /* kg par mètre d'un tube rond Ø D × épaisseur t (mm) */
  function tubeKg(D, t, mat) { return Math.PI * (D - t) * t * (RHO[mat] || 7.85) / 1000; }
  function metalLines(mat, kg, note) {
    var L = [];
    if (mat === 'alu') { L.push({ item: 'metal_alu_kg', qty: kg, note: note, comp: 'structure' }, { item: 'fab_alu_kg', qty: kg, comp: 'structure' }); }
    else {
      L.push({ item: mat === 'inox' ? 'inox_kg' : mat === 'galva' ? 'galva_kg' : 'acier_kg', qty: kg, note: note, comp: 'structure' });
      L.push({ item: mat === 'inox' ? 'fab_inox_kg' : 'fab_acier_kg', qty: kg, comp: 'structure' });
      if (mat === 'fer') L.push({ item: 'peinture_acier_kg', qty: kg, comp: 'structure' });
    }
    return L;
  }
  function METAL_P(comp, sec, def, showIf) {
    return { id: 'mat', comp: comp, sec: sec, label: 'Métal', type: 'seg', def: def, showIf: showIf, options: [
      { v: 'inox', l: 'Inox' }, { v: 'galva', l: 'Galvanisé' }, { v: 'fer', l: 'Fer (acier peint)' }, { v: 'alu', l: 'Aluminium' }] };
  }
  function DIAM_P(comp, sec, def, showIf) {
    return { id: 'd', comp: comp, sec: sec, label: 'Diamètre du tube', type: 'seg', def: def, showIf: showIf, num: true, options: [
      { v: 60, l: 'Ø 60' }, { v: 76, l: 'Ø 76' }, { v: 89, l: 'Ø 89' }, { v: 114, l: 'Ø 114' }] };
  }
  function EP_P(comp, sec, def, showIf) {
    return { id: 't', comp: comp, sec: sec, label: 'Épaisseur', type: 'seg', def: def, showIf: showIf, num: true, options: [
      { v: 2, l: '2 mm' }, { v: 3, l: '3 mm' }, { v: 4, l: '4 mm' }, { v: 5, l: '5 mm' }] };
  }
  /* Couverture souple ou rigide, avec 1er / 2e choix pour les bâches et toiles. */
  function COUV_P(comp, sec, def, rigid) {
    var o = [{ v: 'bache_pvc', l: 'Bâche plastique (PVC)' }, { v: 'toile', l: 'Toile' }, { v: 'screen', l: 'Screen (micro-aéré)' }];
    if (rigid) o.push({ v: 'poly', l: 'Polycarbonate' }, { v: 'sandwich_40', l: 'Panneau sandwich' });
    return { id: 'couv', comp: comp, sec: sec, label: 'Type', type: 'seg', def: def, options: o };
  }
  function QUAL_P(comp, sec) {
    return { id: 'q', comp: comp, sec: sec, label: 'Qualité', type: 'seg', def: '1', options: [{ v: '1', l: '1er choix' }, { v: '2', l: '2e choix' }],
      showIf: function (p) { return p.couv !== 'sandwich_40'; } };
  }
  function coverItem(p) {
    var q = p.q === '2' ? 2 : 1;
    return { bache_pvc: 'bache_pvc_' + q, toile: 'toile_tissee_' + q, screen: q === 1 ? 'toile_ferrari' : 'screen_std', poly: q === 1 ? 'poly_16' : 'poly_16_2', sandwich_40: 'sandwich_40' }[p.couv] || 'bache_pvc_1';
  }
  function coverName(p) {
    var n = { bache_pvc: 'bâche PVC', toile: 'toile', screen: 'toile screen', poly: 'polycarbonate', sandwich_40: 'panneau sandwich' }[p.couv];
    return n + (p.couv === 'sandwich_40' ? '' : p.q === '2' ? ' 2e choix' : ' 1er choix');
  }
  function coverLines(p, qty, h) { return [{ item: coverItem(p), qty: h.r2(qty), note: coverName(p), comp: 'couverture' }]; }

  var PRODUCTS = [
    {
      id: 'pergola-bioclimatique', name: 'Pergola bioclimatique', short: 'Bioclimatique', family: 'Pergolas & structures', icon: 'bioclim', margin: 0.30, waste: 0.05,
      blurb: 'Lames orientables motorisées, adossée ou autoportante.',
      market: [
        { label: 'Marché marocain, posée', unit: 'm²', low: 5500, high: 8500, src: 'lc_veranda', ma: true },
        { label: 'Perlago ATLAS, TTC hors pose', unit: 'm²', low: 3820, high: 4211, src: 'perlago' }
      ],
      params: [
        { id: 'L', sec: 'Dimensions', label: 'Longueur (côté façade)', type: 'number', unit: 'm', min: 2, max: 18, step: 0.05, def: 5 },
        { id: 'P', sec: 'Dimensions', label: 'Avancée', type: 'number', unit: 'm', min: 2, max: 6, step: 0.05, def: 3 },
        { id: 'H', sec: 'Dimensions', label: 'Hauteur sous poutre', type: 'number', unit: 'm', min: 2.2, max: 3.5, step: 0.05, def: 2.6 },
        CONFIG,
        { id: 'lames', sec: 'Structure', label: 'Lames', type: 'seg', def: 'orientables', options: [{ v: 'orientables', l: 'Orientables' }, { v: 'retractables', l: 'Orientables + rétractables (+30 %)' }] },
        RAL,
        { id: 'spots', sec: 'Éclairage & confort', label: 'Spots LED', type: 'count', unit: 'u', min: 0, max: 40, def: 0 },
        { id: 'led', sec: 'Éclairage & confort', label: 'Ruban LED périphérique', type: 'seg', def: 'non', options: [{ v: 'non', l: 'Aucun' }, { v: 'blanc', l: 'Blanc' }, { v: 'rgb', l: 'RGB' }] },
        { id: 'chauffage', sec: 'Éclairage & confort', label: 'Chauffages infrarouges', type: 'count', unit: 'u', min: 0, max: 6, def: 0 },
        { id: 'capteur', sec: 'Éclairage & confort', label: 'Capteur pluie / vent (fermeture auto)', type: 'toggle', def: false },
        { id: 'melody', sec: 'Éclairage & confort', label: 'Kit audio dans les poteaux', type: 'toggle', def: false },
        { id: 'brumi', sec: 'Éclairage & confort', label: 'Brumisateur', type: 'toggle', def: false },
        COTES, FERM, ZIPCMD
      ],
      build: function (p, h) {
        var W = [], area = p.L * p.P, auto = p.config === 'autoportante';
        var modules = h.ceil(p.L / 6);
        var np = auto ? 2 * (modules + 1) : modules + 1;
        var beams = 2 * p.L + p.P * (modules + 1);
        if (p.P > 4.5) W.push('Avancée > 4,5 m : poutre intermédiaire à valider en étude de structure.');
        if (modules > 1) W.push(modules + ' modules de lames (portée max ≈ 6 m par module).');
        var retr = p.lames === 'retractables';
        var L = [
          { item: 'alu_lames_bioclim', qty: h.r2(area * (retr ? 1.3 : 1)), note: h.r2(area) + ' m² de toiture' + (retr ? ', mécanique rétractable' : '') },
          { item: 'alu_poutre_bioclim', qty: h.r2(beams), note: auto ? 'cadre complet' : 'cadre + poutre murale' },
          { item: 'alu_poteau_150', qty: h.r2(np * (p.H + 0.25)), note: np + ' poteaux × ' + (p.H + 0.25).toFixed(2) + ' m' },
          { item: 'alu_cheneau', qty: h.r2(p.L), note: 'chéneau' },
          { item: 'verin_bioclim', qty: modules * (retr ? 2 : 1) },
          { item: 'platine', qty: np },
          { item: 'cheville_chim', qty: np * 4 + (auto ? 0 : h.ceil(p.L / 0.6) * 2), note: auto ? '4 par platine' : 'platines + fixation murale' },
          { item: 'visserie', qty: modules },
          { item: 'electricien', qty: 1 }
        ];
        if (p.spots > 0) L.push({ item: 'spot_led', qty: p.spots });
        if (p.led !== 'non') L.push({ item: p.led === 'rgb' ? 'led_rgb' : 'led_blanc', qty: h.r2(2 * (p.L + p.P)), note: 'périmètre' });
        if (p.spots > 0 || p.led !== 'non') L.push({ item: 'alim_led', qty: modules });
        if (p.chauffage > 0) L.push({ item: 'chauffage_ir', qty: p.chauffage });
        if (p.capteur) L.push({ item: 'capteur_pluie_vent', qty: 1 });
        if (p.melody) L.push({ item: 'kit_melody', qty: 1 });
        if (p.brumi) L.push({ item: 'brumisateur', qty: 1 });
        var cl = closures(p, h, L, auto, W);
        var days = h.r1(1 + area / 12 + cl.count * 0.3 + (retr ? 0.5 : 0));
        L.push({ item: 'pose_jour', qty: days, note: 'estimation ' + days + ' j' });
        var det = [];
        if (retr) det.push('lames rétractables');
        if (p.spots) det.push(p.spots + ' spots LED');
        if (p.led !== 'non') det.push('ruban LED ' + (p.led === 'rgb' ? 'RGB' : 'blanc'));
        if (p.chauffage) det.push(p.chauffage + ' chauffage(s) infrarouge');
        if (p.capteur) det.push('capteur pluie/vent');
        if (p.melody) det.push('kit audio');
        if (p.brumi) det.push('brumisateur');
        if (cl.count) det.push(cl.geo.length + ' côté(s) ' + (p.ferm === 'verre' ? 'vitrés' : 'en stores ZIP'));
        return {
          lines: L, warnings: W, laborDays: days, aluSurcharge: ralSurcharge(p.ral), area: area, details: det,
          summary: p.L + ' × ' + p.P + ' m, ' + (auto ? 'autoportante' : 'adossée'),
          geo: { kind: 'plan', L: p.L, P: p.P, H: p.H, ral: p.ral, wall: !auto, posts: posts(p.L, p.P, modules, auto), roof: 'lames', modules: modules, sides: cl.geo, spots: p.spots, led: p.led }
        };
      }
    },
    {
      id: 'pergola-toile', name: 'Pergola à toile rétractable', short: 'Toile rétractable', family: 'Pergolas & structures', icon: 'toile', margin: 0.32, waste: 0.05,
      blurb: 'Toile PVC repliable sur rails, motorisée.',
      params: [
        { id: 'L', sec: 'Dimensions', label: 'Largeur (côté façade)', type: 'number', unit: 'm', min: 2, max: 15, step: 0.05, def: 5 },
        { id: 'P', sec: 'Dimensions', label: 'Avancée', type: 'number', unit: 'm', min: 2, max: 7, step: 0.05, def: 4 },
        { id: 'H', sec: 'Dimensions', label: 'Hauteur', type: 'number', unit: 'm', min: 2.2, max: 3.5, step: 0.05, def: 2.6 },
        CONFIG, RAL,
        { id: 'capteur', sec: 'Commande', label: 'Capteur vent Eolis', type: 'toggle', def: true },
        { id: 'spots', sec: 'Éclairage & confort', label: 'Spots LED', type: 'count', unit: 'u', min: 0, max: 30, def: 0 },
        COTES, FERM, ZIPCMD
      ],
      build: function (p, h) {
        var W = [], area = p.L * p.P, auto = p.config === 'autoportante';
        var modules = h.ceil(p.L / 5);
        var np = auto ? 2 * (modules + 1) : modules + 1;
        if (p.P > 6) W.push('Avancée > 6 m : vérifier la tenue de la toile au vent.');
        var L = [
          { item: 'alu_rail_toile', qty: h.r2((modules + 1) * p.P), note: (modules + 1) + ' rails' },
          { item: 'alu_poutre_fixe', qty: h.r2(2 * p.L), note: 'poutre avant + lisse' },
          { item: 'alu_poteau_100', qty: h.r2(np * (p.H + 0.2)), note: np + ' poteaux' },
          { item: 'alu_cheneau', qty: h.r2(p.L) },
          { item: 'toile_pergola', qty: h.r2(area * 1.15), note: 'plis + ourlets' },
          { item: 'pergola_toile_meca', qty: modules },
          { item: 'somfy_banne', qty: modules },
          { item: 'somfy_telec', qty: 1 },
          { item: 'platine', qty: np },
          { item: 'cheville_chim', qty: np * 4 + (auto ? 0 : h.ceil(p.L / 0.6) * 2) },
          { item: 'visserie', qty: modules },
          { item: 'electricien', qty: 1 }
        ];
        if (p.capteur) L.push({ item: 'somfy_eolis', qty: 1 });
        if (p.spots > 0) { L.push({ item: 'spot_led', qty: p.spots }); L.push({ item: 'alim_led', qty: 1 }); }
        var cl = closures(p, h, L, auto, W);
        var days = h.r1(1 + area / 15 + cl.count * 0.3);
        L.push({ item: 'pose_jour', qty: days, note: 'estimation ' + days + ' j' });
        var det = ['toile PVC motorisée'];
        if (p.capteur) det.push('capteur vent');
        if (p.spots) det.push(p.spots + ' spots LED');
        if (cl.count) det.push(cl.geo.length + ' côté(s) ' + (p.ferm === 'verre' ? 'vitrés' : 'en stores ZIP'));
        return { lines: L, warnings: W, laborDays: days, aluSurcharge: ralSurcharge(p.ral), area: area, details: det,
          summary: p.L + ' × ' + p.P + ' m, ' + (auto ? 'autoportante' : 'adossée'),
          geo: { kind: 'plan', L: p.L, P: p.P, H: p.H, ral: p.ral, wall: !auto, posts: posts(p.L, p.P, modules, auto), roof: 'toile', modules: modules, sides: cl.geo, spots: p.spots } };
      }
    },
    {
      id: 'pergola-aluminium', name: 'Pergola aluminium fixe', short: 'Pergola fixe', family: 'Pergolas & structures', icon: 'fixe', margin: 0.32, waste: 0.07,
      blurb: 'Couverture permanente : polycarbonate, verre ou panneau.',
      params: [
        { id: 'L', sec: 'Dimensions', label: 'Longueur (côté façade)', type: 'number', unit: 'm', min: 2, max: 20, step: 0.05, def: 6 },
        { id: 'P', sec: 'Dimensions', label: 'Avancée', type: 'number', unit: 'm', min: 1.5, max: 6, step: 0.05, def: 3.5 },
        { id: 'H', sec: 'Dimensions', label: 'Hauteur sous poutre', type: 'number', unit: 'm', min: 2.2, max: 3.5, step: 0.05, def: 2.5 },
        CONFIG,
        { id: 'couv', sec: 'Structure', label: 'Couverture', type: 'select', def: 'poly_16', options: [
          { v: 'poly_16', l: 'Polycarbonate alvéolaire 16 mm' }, { v: 'poly_compact', l: 'Polycarbonate compact 6 mm' },
          { v: 'verre_442', l: 'Verre feuilleté 44.2' }, { v: 'sandwich_40', l: 'Panneau sandwich isolant (opaque)' }] },
        RAL,
        { id: 'spots', sec: 'Éclairage & confort', label: 'Spots LED', type: 'count', unit: 'u', min: 0, max: 40, def: 0 },
        COTES, FERM, ZIPCMD
      ],
      build: function (p, h) {
        var W = [], area = p.L * p.P, auto = p.config === 'autoportante';
        var spans = h.ceil(p.L / 4);
        var np = auto ? 2 * (spans + 1) : spans + 1;
        var glass = p.couv === 'verre_442';
        var pitch = glass ? 0.7 : 0.9;
        if (glass) W.push('Verre : structure renforcée, entraxe des chevrons 70 cm.');
        if (p.P > 5) W.push('Avancée > 5 m : vérifier la section des chevrons.');
        var L = [
          { item: 'alu_poutre_fixe', qty: h.r2(2 * p.L + (spans + 1) * p.P * (auto ? 1 : 0.5)), note: auto ? 'poutres périphériques' : 'poutre avant + lisse murale' },
          { item: 'alu_chevron', qty: h.r2((h.ceil(p.L / pitch) + 1) * p.P), note: 'entraxe ' + Math.round(pitch * 100) + ' cm' },
          { item: 'alu_poteau_100', qty: h.r2(np * (p.H + 0.2)), note: np + ' poteaux' },
          { item: 'alu_cheneau', qty: h.r2(p.L) },
          { item: p.couv, qty: h.r2(area * 1.05), note: 'surface + pente' },
          { item: 'platine', qty: np },
          { item: 'cheville_chim', qty: np * 4 + (auto ? 0 : h.ceil(p.L / 0.6) * 2) },
          { item: 'visserie', qty: spans }
        ];
        if (p.spots > 0) { L.push({ item: 'spot_led', qty: p.spots }); L.push({ item: 'alim_led', qty: 1 }); }
        var cl = closures(p, h, L, auto, W);
        if (p.spots > 0 || (cl.count && p.ferm === 'zip' && p.zipCmd !== 'manuel')) L.push({ item: 'electricien', qty: 1 });
        var days = h.r1(1 + area / 15 + (glass ? 0.5 : 0) + cl.count * 0.3);
        L.push({ item: 'pose_jour', qty: days, note: 'estimation ' + days + ' j' });
        var names = { poly_16: 'polycarbonate 16 mm', poly_compact: 'polycarbonate compact', verre_442: 'verre feuilleté', sandwich_40: 'panneau sandwich' };
        var det = ['couverture ' + names[p.couv]];
        if (p.spots) det.push(p.spots + ' spots LED');
        if (cl.count) det.push(cl.geo.length + ' côté(s) ' + (p.ferm === 'verre' ? 'vitrés' : 'en stores ZIP'));
        return { lines: L, warnings: W, laborDays: days, aluSurcharge: ralSurcharge(p.ral), area: area, details: det,
          summary: p.L + ' × ' + p.P + ' m, ' + (auto ? 'autoportante' : 'adossée'),
          geo: { kind: 'plan', L: p.L, P: p.P, H: p.H, ral: p.ral, wall: !auto, posts: posts(p.L, p.P, spans, auto), roof: 'chevrons', pitch: pitch, couv: p.couv, sides: cl.geo, spots: p.spots } };
      }
    },
    {
      id: 'veranda', name: 'Véranda', short: 'Véranda', family: 'Pergolas & structures', icon: 'veranda', margin: 0.30, waste: 0.06,
      blurb: 'Pièce vitrée sur terrasse, jardin ou toit-terrasse.',
      market: [
        { label: 'Alu + polycarbonate, posée', unit: 'm²', low: 4500, high: 6500, src: 'lc_veranda', ma: true },
        { label: 'Alu + verre feuilleté, posée', unit: 'm²', low: 6500, high: 9000, src: 'lc_veranda' }
      ],
      comps: [{ id: 'structure', l: 'Structure' }, { id: 'vitrage', l: 'Vitrage' }, { id: 'plafond', l: 'Plafond' }, { id: 'fixation', l: 'Fixation' }],
      params: [
        { id: 'L', sec: 'Dimensions', label: 'Largeur (côté façade)', type: 'number', unit: 'm', min: 2, max: 12, step: 0.05, def: 5 },
        { id: 'P', sec: 'Dimensions', label: 'Profondeur', type: 'number', unit: 'm', min: 1.5, max: 6, step: 0.05, def: 3.5 },
        { id: 'H', sec: 'Dimensions', label: 'Hauteur des façades', type: 'number', unit: 'm', min: 2, max: 3.5, step: 0.05, def: 2.6 },
        { id: 'mat', comp: 'structure', sec: 'Structure', label: 'Matériau', type: 'seg', def: 'alu', options: [{ v: 'alu', l: 'Aluminium' }, { v: 'bois', l: 'Bois' }] },
        { id: 'ral', comp: 'structure', sec: 'Structure', label: 'Couleur aluminium', type: 'ral', def: 'standard', options: RAL.options, showIf: function (p) { return p.mat === 'alu'; } },
        { id: 'ouv', comp: 'vitrage', sec: 'Vitrage', label: 'Ouverture', type: 'seg', def: 'coulissant', options: [{ v: 'coulissant', l: 'Coulissant' }, { v: 'accordeon', l: 'Accordéon (repliable)' }] },
        { id: 'vitrage', comp: 'vitrage', sec: 'Vitrage', label: 'Verre', type: 'select', def: 'double_vitrage', options: [
          { v: 'vitre_trempe', l: 'Simple trempé 6 mm' }, { v: 'double_vitrage', l: 'Double vitrage 4/16/4' }, { v: 'controle_solaire', l: 'Double vitrage contrôle solaire' }] },
        { id: 'faces', comp: 'vitrage', sec: 'Vitrage', label: 'Faces vitrées', type: 'seg', def: '3', options: [{ v: '1', l: '1 face' }, { v: '2', l: '2 faces' }, { v: '3', l: '3 faces' }, { v: '4', l: '4 faces' }] },
        { id: 'toit', comp: 'plafond', sec: 'Plafond', label: 'Plafond', type: 'seg', def: 'sandwich_40', options: [
          { v: 'dalakit', l: 'Dalakit' }, { v: 'sandwich_40', l: 'Panneau sandwich' }, { v: 'bache_pvc_1', l: 'Bâche PVC' }] },
        { id: 'fix', comp: 'fixation', sec: 'Fixation', label: 'Fixation', type: 'seg', def: 'murale', options: [{ v: 'murale', l: 'Murale (adossée)' }, { v: 'poteaux', l: 'Sur poteaux (autoportante)' }] },
        { id: 'np', comp: 'fixation', sec: 'Fixation', label: 'Nombre de poteaux (0 = calcul automatique)', type: 'count', unit: 'u', min: 0, max: 12, def: 0 },
        { id: 'site', sec: 'Options', label: 'Emplacement', type: 'seg', def: 'terrasse', options: [{ v: 'terrasse', l: 'Terrasse / jardin' }, { v: 'toit', l: 'Toit-terrasse' }] },
        { id: 'spots', sec: 'Options', label: 'Spots LED', type: 'count', unit: 'u', min: 0, max: 30, def: 4 }
      ],
      build: function (p, h) {
        var W = [], area = p.L * p.P, f = +p.faces, auto = p.fix === 'poteaux', bois = p.mat === 'bois';
        if (f === 4 && !auto) W.push('4 faces vitrées : seulement en véranda autoportante (sur poteaux).');
        if (f === 4 && !auto) f = 3;
        var facade = p.L * p.H + (f >= 2 ? p.P * p.H : 0) + (f >= 3 ? p.P * p.H : 0) + (f >= 4 ? p.L * p.H : 0);
        var autoPosts = (auto ? 2 : 1) * (h.ceil(p.L / 3.5) + 1);
        var np = p.np > 0 ? p.np : autoPosts;
        if (p.np > 0 && p.np < autoPosts) W.push('Moins de poteaux que le calcul (' + autoPosts + ') : portées à valider en étude.');
        if (p.site === 'toit') W.push('Toit-terrasse : vérifier dalle, étanchéité, évacuations et accès de levage.');
        if (p.vitrage === 'vitre_trempe') W.push('Simple vitrage : effet de serre l’été, proposer le contrôle solaire.');
        if (p.toit === 'dalakit') W.push('Plafond « Dalakit » : prix provisoire, à confirmer.');
        var frame = bois ? 'bois_facade' : p.ouv === 'accordeon' ? 'alu_veranda_accordeon' : 'alu_veranda_facade';
        var L = [
          { item: frame, qty: h.r2(facade), note: h.r2(facade) + ' m² de façade' + (p.ouv === 'accordeon' && !bois ? ', ouverture accordéon' : ''), comp: 'structure' },
          { item: p.vitrage, qty: h.r2(facade * 0.85), note: '85 % de la façade', comp: 'vitrage' },
          { item: bois ? 'bois_toiture' : 'alu_veranda_toiture', qty: h.r2(area), comp: 'structure' },
          { item: p.toit, qty: h.r2(area * 1.05), comp: 'plafond' },
          { item: bois ? 'bois_poteau' : 'alu_poteau_100', qty: h.r2(np * p.H), note: np + ' poteaux', comp: 'fixation' },
          { item: 'alu_cheneau', qty: h.r2(p.L + 2 * p.H), comp: 'structure' },
          { item: 'cheville_chim', qty: auto ? np * 4 : h.ceil((p.L + 2 * p.P) / 0.5), comp: 'fixation' },
          { item: 'platine', qty: auto ? np : 0, comp: 'fixation' },
          { item: 'visserie', qty: h.ceil(area / 8), comp: 'fixation' }
        ];
        if (p.ouv === 'accordeon' && bois) L.push({ item: 'kit_moust_pli', qty: h.ceil(p.L / 1.2), note: 'quincaillerie de repliage', comp: 'vitrage' });
        if (p.spots > 0) { L.push({ item: 'spot_led', qty: p.spots }); L.push({ item: 'alim_led', qty: 1 }); L.push({ item: 'electricien', qty: 1 }); }
        var days = h.r1(2 + area / 8 + (p.site === 'toit' ? 1 : 0) + (p.ouv === 'accordeon' ? 0.5 : 0));
        L.push({ item: 'pose_jour', qty: days, note: 'estimation ' + days + ' j' });
        var vn = { vitre_trempe: 'simple vitrage trempé', double_vitrage: 'double vitrage', controle_solaire: 'double vitrage contrôle solaire' };
        var tn = { dalakit: 'plafond Dalakit', sandwich_40: 'plafond panneau sandwich', bache_pvc_1: 'plafond bâche PVC' };
        var sides = [{ side: 'front', type: 'verre' }];
        if (f >= 2) sides.push({ side: 'right', type: 'verre' });
        if (f >= 3) sides.push({ side: 'left', type: 'verre' });
        if (f >= 4) sides.push({ side: 'back', type: 'verre' });
        var postsGeo = []; var per = auto ? 2 : 1, cols = Math.max(2, Math.round(np / per));
        for (var i = 0; i < cols; i++) { postsGeo.push([p.L * i / (cols - 1), p.P]); if (auto) postsGeo.push([p.L * i / (cols - 1), 0]); }
        return { lines: L, warnings: W, laborDays: days, aluSurcharge: bois ? 0 : ralSurcharge(p.ral), area: area,
          details: [bois ? 'structure bois' : 'structure aluminium', 'ouverture ' + (p.ouv === 'accordeon' ? 'accordéon' : 'coulissante'), vn[p.vitrage], tn[p.toit], auto ? np + ' poteaux' : 'fixation murale'].concat(p.spots ? [p.spots + ' spots LED'] : []),
          summary: p.L + ' × ' + p.P + ' × ' + p.H + ' m, ' + f + ' face(s) vitrée(s)',
          geo: { kind: 'plan', L: p.L, P: p.P, H: p.H, ral: bois ? 'special' : p.ral, wall: !auto, posts: postsGeo, roof: 'plein', couv: p.toit === 'bache_pvc_1' ? 'poly_16' : 'sandwich_40', sides: sides, spots: p.spots } };
      }
    },
    {
      id: 'carport', name: 'Abri de voiture', short: 'Abri voiture', family: 'Pergolas & structures', icon: 'carport', margin: 0.32, waste: 0.07,
      blurb: 'Structure métallique au choix, bâche ou couverture rigide.',
      comps: [{ id: 'structure', l: 'Structure métallique' }, { id: 'couverture', l: 'Couverture' }],
      params: [
        { id: 'places', sec: 'Dimensions', label: 'Nombre de places', type: 'seg', def: '1', options: [{ v: '1', l: 'Simple' }, { v: '2', l: 'Double' }, { v: '3', l: 'Triple' }] },
        { id: 'lp', sec: 'Dimensions', label: 'Largeur par place', type: 'number', unit: 'm', min: 2.5, max: 4, step: 0.05, def: 3 },
        { id: 'P', sec: 'Dimensions', label: 'Profondeur', type: 'number', unit: 'm', min: 4, max: 7, step: 0.05, def: 5 },
        { id: 'H', sec: 'Dimensions', label: 'Hauteur de passage', type: 'number', unit: 'm', min: 2.1, max: 3, step: 0.05, def: 2.4 },
        { id: 'config', sec: 'Dimensions', label: 'Pose', type: 'seg', def: 'autoportante', options: [{ v: 'adossee', l: 'Adossé à la façade' }, { v: 'autoportante', l: 'Autoportant' }] },
        METAL_P('structure', 'Structure métallique', 'galva'), DIAM_P('structure', 'Structure métallique', 89), EP_P('structure', 'Structure métallique', 3),
        COUV_P('couverture', 'Couverture', 'bache_pvc', true), QUAL_P('couverture', 'Couverture'),
        { id: 'sol', sec: 'Options', label: 'Sol', type: 'seg', def: 'beton', options: [{ v: 'beton', l: 'Dalle béton existante' }, { v: 'terre', l: 'Terre / pavé (massifs)' }] },
        { id: 'spots', sec: 'Options', label: 'Spots LED', type: 'count', unit: 'u', min: 0, max: 20, def: 0 }
      ],
      build: function (p, h) {
        var W = [], n = +p.places, Wd = n * p.lp, area = Wd * p.P, auto = p.config === 'autoportante';
        var spans = h.ceil(Wd / (p.mat === 'alu' ? 4 : 4.5));
        var np = auto ? 2 * (spans + 1) : spans + 1;
        if (p.H < 2.2) W.push('Hauteur < 2,20 m : vérifier le gabarit des 4×4 et utilitaires.');
        var soft = p.couv === 'bache_pvc' || p.couv === 'toile' || p.couv === 'screen';
        var mainMl = np * (p.H + 0.3) + 2 * Wd + (spans + 1) * p.P * (auto ? 1 : 0.5);
        var raf = (h.ceil(Wd / (soft ? 1.2 : 0.9)) + 1) * p.P * 1.03;
        var kg = mainMl * tubeKg(p.d, p.t, p.mat) + raf * tubeKg(soft ? 42 : 50, 2, p.mat);
        if (p.d < 76 && n > 1) W.push('Ø ' + p.d + ' mm pour ' + n + ' places : vérifier la section avec la portée.');
        if (p.mat === 'alu') W.push('Aluminium : environ 3 fois moins rigide que l’acier ; à portée égale, prévoir un Ø ou une épaisseur supérieurs.');
        var L = metalLines(p.mat, h.r1(kg), h.r1(kg) + ' kg : ' + np + ' poteaux + poutres Ø ' + p.d + '×' + p.t + ' mm, arceaux');
        coverLines(p, area * 1.05, h).forEach(function (l) { L.push(l); });
        L.push({ item: 'platine', qty: np, comp: 'fixation' }, { item: 'cheville_chim', qty: np * 4 + (auto ? 0 : h.ceil(Wd / 0.6) * 2), comp: 'fixation' }, { item: 'visserie', qty: spans });
        if (p.sol === 'terre') L.push({ item: 'fondation', qty: np, note: '1 massif par poteau', comp: 'fixation' });
        if (p.spots > 0) { L.push({ item: 'spot_led', qty: p.spots }); L.push({ item: 'alim_led', qty: 1 }); L.push({ item: 'electricien', qty: 1 }); }
        var days = h.r1(1 + area / 15 + (p.sol === 'terre' ? 0.5 : 0) + (p.mat === 'inox' ? 0.5 : 0));
        L.push({ item: 'pose_jour', qty: days, note: 'estimation ' + days + ' j' });
        return { lines: L, warnings: W, laborDays: days, aluSurcharge: 0, area: area,
          details: ['structure ' + METAL_NAMES[p.mat] + ' Ø ' + p.d + ' × ' + p.t + ' mm', coverName(p)].concat(p.sol === 'terre' ? ['massifs béton'] : []).concat(p.spots ? [p.spots + ' spots LED'] : []),
          summary: n + ' place(s), ' + h.r2(Wd) + ' × ' + p.P + ' m, ' + (auto ? 'autoportant' : 'adossé'),
          geo: { kind: 'plan', L: Wd, P: p.P, H: p.H, ral: METAL_RAL[p.mat], wall: !auto, posts: posts(Wd, p.P, spans, auto), roof: 'chevrons', pitch: soft ? 1.2 : 0.9,
            couv: soft ? 'poly_16' : p.couv === 'sandwich_40' ? 'sandwich_40' : 'poly_16', sides: [], cars: n, spots: p.spots } };
      }
    },
    {
      id: 'voile-ombrage', name: 'Voile d’ombrage', short: 'Voile d’ombrage', family: 'Pergolas & structures', icon: 'voile', margin: 0.35, waste: 0.08,
      blurb: 'Toile tendue sur mâts : métal, toile, câble et accastillage au choix.',
      comps: [{ id: 'structure', l: 'Mâts (structure métallique)' }, { id: 'couverture', l: 'Toile' }, { id: 'cable', l: 'Câble' }, { id: 'accast', l: 'Accastillage' }],
      params: [
        { id: 'forme', sec: 'Dimensions', label: 'Forme', type: 'seg', def: 'rectangle', options: [{ v: 'triangle', l: 'Triangle' }, { v: 'rectangle', l: 'Rectangle' }] },
        { id: 'A', sec: 'Dimensions', label: 'Côté A', type: 'number', unit: 'm', min: 2, max: 15, step: 0.1, def: 6 },
        { id: 'B', sec: 'Dimensions', label: 'Côté B', type: 'number', unit: 'm', min: 2, max: 15, step: 0.1, def: 4 },
        { id: 'C', sec: 'Dimensions', label: 'Côté C', type: 'number', unit: 'm', min: 2, max: 15, step: 0.1, def: 5, showIf: function (p) { return p.forme === 'triangle'; } },
        { id: 'mats', sec: 'Dimensions', label: 'Points sur mât', type: 'count', unit: 'mâts', min: 0, max: 4, def: 2 },
        { id: 'Hm', sec: 'Dimensions', label: 'Hauteur des mâts', type: 'number', unit: 'm', min: 2.5, max: 6, step: 0.1, def: 3.5, showIf: function (p) { return p.mats > 0; } },
        METAL_P('structure', 'Mâts (structure métallique)', 'galva', function (p) { return p.mats > 0; }), DIAM_P('structure', 'Mâts (structure métallique)', 114, function (p) { return p.mats > 0; }), EP_P('structure', 'Mâts (structure métallique)', 4, function (p) { return p.mats > 0; }),
        COUV_P('couverture', 'Toile', 'screen', false), QUAL_P('couverture', 'Toile'),
        { id: 'cable', comp: 'cable', sec: 'Câble', label: 'Câble de bordure', type: 'seg', def: 'galva', options: [{ v: 'inox', l: 'Inox 316' }, { v: 'galva', l: 'Galvanisé' }] },
        { id: 'accast', comp: 'accast', sec: 'Accastillage', label: 'Pièces d’accastillage', type: 'seg', def: 'galva', options: [{ v: 'inox', l: 'Inox' }, { v: 'galva', l: 'Galvanisé' }] }
      ],
      build: function (p, h) {
        var W = [], tri = p.forme === 'triangle', area, perim, pts;
        if (tri) {
          var s = (p.A + p.B + p.C) / 2;
          area = Math.sqrt(Math.max(0, s * (s - p.A) * (s - p.B) * (s - p.C)));
          perim = p.A + p.B + p.C;
          var x = (p.A * p.A + p.C * p.C - p.B * p.B) / (2 * p.A), y = Math.sqrt(Math.max(0, p.C * p.C - x * x));
          pts = [[0, 0], [p.A, 0], [x, y]];
          if (area === 0) W.push('Triangle impossible avec ces 3 côtés.');
        } else { area = p.A * p.B; perim = 2 * (p.A + p.B); pts = [[0, 0], [p.A, 0], [p.A, p.B], [0, p.B]]; }
        var points = pts.length, mats = Math.min(p.mats, points);
        if (p.couv === 'bache_pvc') W.push('Bâche PVC imperméable : pente marquée et ancrages renforcés.');
        if (area > 40) W.push('Grande voile (> 40 m²) : étude de vent, mâts Ø 114 mm minimum.');
        if (mats && p.d < 89) W.push('Mâts Ø < 89 mm : réservés aux petites voiles abritées.');
        if (mats && p.mat === 'alu') W.push('Mâts aluminium : moins rigides que l’acier sous la tension de la voile ; prévoir Ø 114 × 5 mm minimum.');
        if (p.cable === 'galva' && p.accast === 'inox') W.push('Câble galvanisé avec accastillage inox : risque de corrosion galvanique.');
        var L = [];
        if (mats) {
          var kg = mats * (p.Hm + 0.8) * tubeKg(p.d, p.t, p.mat);
          metalLines(p.mat, h.r1(kg), mats + ' mâts Ø ' + p.d + '×' + p.t + ' mm, dont 0,8 m enterré').forEach(function (l) { L.push(l); });
          L.push({ item: 'fondation', qty: mats, comp: 'fixation' });
        }
        coverLines(p, area * 1.1, h).forEach(function (l) { L.push(l); });
        L.push({ item: 'confection_voile', qty: h.r2(perim), comp: 'couverture' });
        L.push({ item: p.cable === 'inox' ? 'cable_inox' : 'cable_galva', qty: h.r2(perim * 1.15), note: 'bordure + 15 %', comp: 'cable' });
        L.push({ item: p.accast === 'inox' ? 'accast_inox' : 'accast_galva', qty: points, note: points + ' points de tension', comp: 'accast' });
        L.push({ item: 'ancrage_facade', qty: points - mats, comp: 'fixation' });
        var days = h.r1(0.5 + mats * 0.4 + area / 40);
        L.push({ item: 'pose_jour', qty: days, note: 'estimation ' + days + ' j' });
        return { lines: L, warnings: W, laborDays: days, area: area,
          details: [coverName(p), 'câble ' + (p.cable === 'inox' ? 'inox' : 'galvanisé'), 'accastillage ' + (p.accast === 'inox' ? 'inox' : 'galvanisé')].concat(mats ? [mats + ' mât(s) ' + METAL_NAMES[p.mat] + ' Ø ' + p.d + ' mm'] : []),
          summary: (tri ? 'Triangle ' + p.A + ' / ' + p.B + ' / ' + p.C : 'Rectangle ' + p.A + ' × ' + p.B) + ' m',
          geo: { kind: 'voile', pts: pts, mats: mats, Hm: p.Hm } };
      }
    },
    {
      id: 'store-banne', name: 'Store banne', short: 'Store banne', family: 'Stores extérieurs', icon: 'banne', margin: 0.33, waste: 0.03,
      blurb: 'Monobloc ou coffre, mécanisme standard ou Gaviota.',
      market: [{ label: 'France, coffre intégral motorisé posé', unit: 'u', low: 16200, high: 54000, src: 'banne_fr' }],
      comps: [{ id: 'mecanisme', l: 'Mécanisme' }, { id: 'toile', l: 'Toile' }, { id: 'commande', l: 'Commande' }],
      params: [
        { id: 'W', sec: 'Dimensions', label: 'Largeur', type: 'number', unit: 'm', min: 1.5, max: 7, step: 0.05, def: 4 },
        { id: 'A', sec: 'Dimensions', label: 'Avancée', type: 'number', unit: 'm', min: 1.5, max: 4, step: 0.25, def: 3 },
        { id: 'type', comp: 'mecanisme', sec: 'Mécanisme', label: 'Type', type: 'seg', def: 'coffre', options: [{ v: 'mono', l: 'Monobloc' }, { v: 'coffre', l: 'Coffre' }] },
        { id: 'meca', comp: 'mecanisme', sec: 'Mécanisme', label: 'Qualité du mécanisme', type: 'seg', def: 'std', options: [{ v: 'std', l: 'Standard' }, { v: 'gaviota', l: '1re qualité · Gaviota' }] },
        { id: 'toile', comp: 'toile', sec: 'Toile', label: 'Toile', type: 'seg', def: 'std', options: [{ v: 'std', l: 'Standard' }, { v: 'premium', l: 'Premium · Sauleda' }, { v: 'screen', l: 'Screen · Serge Ferrari' }] },
        { id: 'cmd', comp: 'commande', sec: 'Commande', label: 'Commande', type: 'seg', def: 'moteur', options: [{ v: 'manuel', l: 'Manivelle' }, { v: 'moteur', l: 'Moteur standard' }, { v: 'somfy', l: 'Moteur Somfy' }] },
        { id: 'capteur', comp: 'commande', sec: 'Commande', label: 'Capteur vent (repli automatique)', type: 'toggle', def: false, showIf: function (p) { return p.cmd !== 'manuel'; } },
        { id: 'support', sec: 'Options', label: 'Support', type: 'seg', def: 'beton', options: [{ v: 'beton', l: 'Béton' }, { v: 'brique', l: 'Brique / pierre' }, { v: 'ite', l: 'Façade isolée' }] },
        { id: 'ledbras', sec: 'Options', label: 'LED dans les bras', type: 'toggle', def: false }
      ],
      build: function (p, h) {
        var W = [], brackets = h.ceil(p.W / 1.5) + 1;
        if (p.A > p.W - 0.3) W.push('Avancée trop grande pour la largeur : les bras se croisent (avancée ≤ largeur − 30 cm).');
        if (p.W > 5.5 && p.cmd === 'manuel') W.push('Plus de 5,5 m en manuel : proposer la motorisation.');
        var sys = p.meca === 'gaviota' ? (p.type === 'mono' ? 'banne_monobloc' : 'banne_coffre') : (p.type === 'mono' ? 'banne_mono_std' : 'banne_coffre_std');
        var toile = { std: 'toile_banne_std', premium: 'toile_sauleda', screen: 'toile_ferrari' }[p.toile];
        var L = [
          { item: sys, qty: p.W, note: 'largeur', comp: 'mecanisme' },
          { item: toile, qty: h.r2(p.W * (p.A + 0.35)), note: 'toile + lambrequin', comp: 'toile' },
          { item: 'cheville_chim', qty: brackets * (p.support === 'brique' ? 4 : 3), note: brackets + ' supports', comp: 'fixation' },
          { item: 'visserie', qty: 1 }
        ];
        if (p.A > 3) L.push({ item: 'banne_bras_renfort', qty: 1, comp: 'mecanisme' });
        if (p.support === 'ite') L.push({ item: 'console_ite', qty: brackets, comp: 'fixation' });
        if (p.ledbras) L.push({ item: 'banne_led_bras', qty: 1 });
        if (p.cmd === 'manuel') L.push({ item: 'manivelle', qty: 1, comp: 'commande' });
        else {
          L.push({ item: p.cmd === 'somfy' ? 'somfy_banne' : 'moteur_std', qty: 1, comp: 'commande' });
          if (p.cmd === 'somfy') L.push({ item: 'somfy_telec', qty: 1, comp: 'commande' });
          L.push({ item: 'electricien', qty: 1 });
          if (p.capteur) L.push({ item: 'somfy_eolis', qty: 1, comp: 'commande' });
        }
        var days = h.r1(0.5 + p.W / 10);
        L.push({ item: 'pose_jour', qty: days, note: 'estimation ' + days + ' j' });
        var cn = { manuel: 'manivelle', moteur: 'moteur standard', somfy: 'moteur Somfy' };
        return { lines: L, warnings: W, laborDays: days, area: p.W * p.A,
          details: ['mécanisme ' + (p.meca === 'gaviota' ? 'Gaviota' : 'standard'), { std: 'toile standard', premium: 'toile acrylique Sauleda', screen: 'toile Serge Ferrari' }[p.toile], cn[p.cmd] + (p.capteur && p.cmd !== 'manuel' ? ' + capteur vent' : '')].concat(p.ledbras ? ['LED dans les bras'] : []),
          summary: p.W + ' × ' + p.A + ' m, ' + (p.type === 'mono' ? 'monobloc' : 'coffre'),
          geo: { kind: 'banne', W: p.W, A: p.A, type: p.type === 'mono' ? 'banne_monobloc' : 'banne_coffre' } };
      }
    },
    {
      id: 'store-zip', name: 'Store ZIP vertical', short: 'Store ZIP', family: 'Stores extérieurs', icon: 'zip', margin: 0.33, waste: 0.03,
      blurb: 'Toile guidée, tenue au vent, fermeture de pergola ou de baie.',
      comps: [{ id: 'mecanisme', l: 'Mécanisme' }, { id: 'automatisme', l: 'Automatisme' }, { id: 'toile', l: 'Toile' }],
      params: [
        { id: 'W', sec: 'Dimensions', label: 'Largeur', type: 'number', unit: 'm', min: 0.8, max: 6, step: 0.05, def: 3 },
        { id: 'H', sec: 'Dimensions', label: 'Hauteur', type: 'number', unit: 'm', min: 1, max: 4, step: 0.05, def: 2.5 },
        { id: 'n', sec: 'Dimensions', label: 'Stores identiques', type: 'count', unit: 'u', min: 1, max: 30, def: 1 },
        { id: 'meca', comp: 'mecanisme', sec: 'Mécanisme', label: 'Mécanisme (coffre + coulisses)', type: 'seg', def: 'std', options: [{ v: 'std', l: 'Standard' }, { v: 'premium', l: 'Premium (alu extrudé laqué)' }] },
        { id: 'auto', comp: 'automatisme', sec: 'Automatisme', label: 'Automatisme', type: 'seg', def: 'moteur_std', options: [{ v: 'manuel', l: 'Manuel' }, { v: 'moteur_std', l: 'Motorisé standard' }, { v: 'moteur_premium', l: 'Motorisé premium · Somfy' }] },
        { id: 'cmdz', comp: 'automatisme', sec: 'Automatisme', label: 'Commande', type: 'seg', def: 'telec', options: [{ v: 'inter', l: 'Interrupteur mural' }, { v: 'telec', l: 'Télécommande' }], showIf: function (p) { return p.auto !== 'manuel'; } },
        { id: 'capteur', comp: 'automatisme', sec: 'Automatisme', label: 'Capteur vent', type: 'toggle', def: false, showIf: function (p) { return p.auto === 'moteur_premium'; } },
        { id: 'toile', comp: 'toile', sec: 'Toile', label: 'Toile screen', type: 'seg', def: 'std', options: [{ v: 'std', l: 'Screen standard' }, { v: 'premium', l: 'Screen premium · Serge Ferrari' }] },
        { id: 'support', sec: 'Options', label: 'Pose', type: 'seg', def: 'facade', options: [{ v: 'facade', l: 'Façade / baie' }, { v: 'pergola', l: 'Sur pergola' }] }
      ],
      build: function (p, h) {
        var W = [];
        if (p.W > 5) W.push('Largeur > 5 m : vérifier la limite du système et la tenue au vent.');
        if (p.meca === 'std' && p.W > 4) W.push('Mécanisme standard au-delà de 4 m : préférer le premium.');
        var prem = p.meca === 'premium', n = p.n;
        var L = [
          { item: prem ? 'alu_zip_coffre' : 'zip_coffre_std', qty: h.r2(p.W * n), note: n + ' × ' + p.W + ' m', comp: 'mecanisme' },
          { item: prem ? 'alu_zip_guides' : 'zip_guides_std', qty: h.r2(2 * p.H * n), note: '2 coulisses × ' + p.H + ' m', comp: 'mecanisme' },
          { item: p.toile === 'premium' ? 'toile_ferrari' : 'screen_std', qty: h.r2(p.W * (p.H + 0.3) * n), note: 'chute + 30 cm', comp: 'toile' },
          { item: 'cheville_chim', qty: n * (p.support === 'facade' ? 8 : 4), comp: 'fixation' }
        ];
        if (p.auto === 'manuel') L.push({ item: 'treuil_zip', qty: n, comp: 'automatisme' });
        else {
          var premM = p.auto === 'moteur_premium';
          L.push({ item: premM ? 'somfy_zip' : 'moteur_zip_std', qty: n, comp: 'automatisme' });
          L.push({ item: p.cmdz === 'inter' ? 'inter_mural' : (premM ? 'somfy_telec' : 'telec_std'), qty: p.cmdz === 'inter' ? n : 1, comp: 'automatisme' });
          if (premM && p.capteur) L.push({ item: 'somfy_eolis', qty: 1, comp: 'automatisme' });
          L.push({ item: 'electricien', qty: 1 });
        }
        var days = h.r1(Math.max(0.5, n * 0.35));
        L.push({ item: 'pose_jour', qty: days, note: 'estimation ' + days + ' j' });
        var an = { manuel: 'manœuvre manuelle', moteur_std: 'moteur standard', moteur_premium: 'moteur Somfy' };
        return { lines: L, warnings: W, laborDays: days, area: p.W * p.H * n,
          details: ['mécanisme ' + (prem ? 'premium' : 'standard'), p.toile === 'premium' ? 'toile Serge Ferrari Soltis' : 'toile screen standard',
            an[p.auto] + (p.auto !== 'manuel' ? (p.cmdz === 'inter' ? ', interrupteur' : ', télécommande') : '') + (p.capteur && p.auto === 'moteur_premium' ? ', capteur vent' : '')],
          summary: n + ' × ' + p.W + ' × ' + p.H + ' m',
          geo: { kind: 'front', W: p.W, H: p.H, n: n, pattern: 'zip' } };
      }
    },
    {
      id: 'store-enrouleur', name: 'Store enrouleur', short: 'Enrouleur', family: 'Stores intérieurs', icon: 'enrouleur', margin: 0.40, waste: 0.05,
      blurb: 'Tamisant, occultant ou screen, chaînette ou moteur.',
      params: [
        { id: 'W', sec: 'Dimensions', label: 'Largeur', type: 'number', unit: 'm', min: 0.4, max: 3.5, step: 0.01, def: 1.4 },
        { id: 'H', sec: 'Dimensions', label: 'Hauteur (chute)', type: 'number', unit: 'm', min: 0.5, max: 4, step: 0.01, def: 1.6 },
        { id: 'n', sec: 'Dimensions', label: 'Stores identiques', type: 'count', unit: 'u', min: 1, max: 50, def: 1 },
        { id: 'toile', sec: 'Structure', label: 'Toile', type: 'seg', def: 'toile_tamisant', options: [{ v: 'toile_tamisant', l: 'Tamisante' }, { v: 'toile_occultant', l: 'Occultante' }, { v: 'toile_screen_int', l: 'Screen' }] },
        { id: 'coffre', sec: 'Structure', label: 'Coffre', type: 'toggle', def: false },
        { id: 'cmd', sec: 'Commande', label: 'Commande', type: 'seg', def: 'chainette', options: [{ v: 'chainette', l: 'Chaînette' }, { v: 'moteur', l: 'Moteur Somfy' }] }
      ],
      build: function (p, h) { return interiorRoll(p, h, 'meca_enrouleur', p.toile, 'roll'); }
    },
    {
      id: 'store-jour-nuit', name: 'Store jour & nuit', short: 'Jour & nuit', family: 'Stores intérieurs', icon: 'journuit', margin: 0.40, waste: 0.05,
      blurb: 'Double voile à bandes alternées.',
      params: [
        { id: 'W', sec: 'Dimensions', label: 'Largeur', type: 'number', unit: 'm', min: 0.4, max: 3, step: 0.01, def: 1.4 },
        { id: 'H', sec: 'Dimensions', label: 'Hauteur (chute)', type: 'number', unit: 'm', min: 0.5, max: 3.5, step: 0.01, def: 1.6 },
        { id: 'n', sec: 'Dimensions', label: 'Stores identiques', type: 'count', unit: 'u', min: 1, max: 50, def: 1 },
        { id: 'coffre', sec: 'Structure', label: 'Coffre', type: 'toggle', def: true },
        { id: 'cmd', sec: 'Commande', label: 'Commande', type: 'seg', def: 'chainette', options: [{ v: 'chainette', l: 'Chaînette' }, { v: 'moteur', l: 'Moteur Somfy' }] }
      ],
      build: function (p, h) { return interiorRoll(p, h, 'meca_jour_nuit', 'toile_jour_nuit', 'daynight'); }
    },
    {
      id: 'store-venitien', name: 'Store vénitien', short: 'Vénitien', family: 'Stores intérieurs', icon: 'venitien', margin: 0.40, waste: 0.03,
      blurb: 'Lames aluminium orientables, guidage en option.',
      params: [
        { id: 'W', sec: 'Dimensions', label: 'Largeur', type: 'number', unit: 'm', min: 0.4, max: 3, step: 0.01, def: 1.2 },
        { id: 'H', sec: 'Dimensions', label: 'Hauteur', type: 'number', unit: 'm', min: 0.5, max: 3.5, step: 0.01, def: 1.5 },
        { id: 'n', sec: 'Dimensions', label: 'Stores identiques', type: 'count', unit: 'u', min: 1, max: 50, def: 1 },
        { id: 'lame', sec: 'Structure', label: 'Lames', type: 'seg', def: 'venitien_25', options: [{ v: 'venitien_25', l: '25 mm' }, { v: 'venitien_50', l: '50 mm' }] },
        { id: 'guidage', sec: 'Structure', label: 'Guidage latéral', type: 'toggle', def: false },
        { id: 'cmd', sec: 'Commande', label: 'Commande', type: 'seg', def: 'manuel', options: [{ v: 'manuel', l: 'Manuelle' }, { v: 'moteur', l: 'Moteur Somfy' }] }
      ],
      build: function (p, h) {
        var a = Math.max(1, p.W * p.H);
        var L = [{ item: p.lame, qty: h.r2(a * p.n), note: p.W * p.H < 1 ? 'minimum facturé 1 m² par store' : '' }];
        if (p.guidage) L.push({ item: 'guidage_cable', qty: h.r2(2 * p.H * p.n) });
        if (p.cmd === 'moteur') { L.push({ item: 'somfy_int', qty: p.n }); L.push({ item: 'somfy_telec', qty: 1 }); L.push({ item: 'electricien', qty: 1 }); }
        L.push({ item: 'visserie', qty: h.ceil(p.n / 6) });
        var days = h.r1(Math.max(0.3, p.n * 0.12));
        L.push({ item: 'pose_jour', qty: days });
        return { lines: L, warnings: [], laborDays: days, area: p.W * p.H * p.n,
          details: ['lames ' + (p.lame === 'venitien_25' ? '25' : '50') + ' mm'].concat(p.guidage ? ['guidage latéral'] : []).concat(p.cmd === 'moteur' ? ['moteur Somfy'] : []),
          summary: p.n + ' × ' + p.W + ' × ' + p.H + ' m', geo: { kind: 'front', W: p.W, H: p.H, n: p.n, pattern: 'slats' } };
      }
    },
    {
      id: 'moustiquaire', name: 'Moustiquaire', short: 'Moustiquaire', family: 'Stores intérieurs', icon: 'moustiquaire', margin: 0.40, waste: 0.08,
      blurb: 'Fixe, coulissante, enroulable ou plissée.',
      params: [
        { id: 'W', sec: 'Dimensions', label: 'Largeur', type: 'number', unit: 'm', min: 0.4, max: 4, step: 0.01, def: 1.2 },
        { id: 'H', sec: 'Dimensions', label: 'Hauteur', type: 'number', unit: 'm', min: 0.4, max: 3, step: 0.01, def: 1.4 },
        { id: 'n', sec: 'Dimensions', label: 'Moustiquaires identiques', type: 'count', unit: 'u', min: 1, max: 50, def: 1 },
        { id: 'sys', sec: 'Structure', label: 'Système', type: 'select', def: 'kit_moust_coul', options: [
          { v: 'kit_moust_fixe', l: 'Fixe (cadre)' }, { v: 'kit_moust_coul', l: 'Coulissante' }, { v: 'kit_moust_enr', l: 'Enroulable' }, { v: 'kit_moust_pli', l: 'Plissée (baie vitrée)' }] },
        { id: 'laquage', sec: 'Finitions', label: 'Laquage', type: 'seg', def: 'standard', options: [{ v: 'standard', l: 'Blanc / gris standard' }, { v: 'ral', l: 'RAL au choix (+12 %)' }] }
      ],
      build: function (p, h) {
        var W = [];
        if (p.sys === 'kit_moust_enr' && p.W > 1.8) W.push('Enroulable > 1,80 m : préférer la plissée.');
        var L = [
          { item: 'alu_cadre_moust', qty: h.r2(2 * (p.W + p.H) * p.n) },
          { item: 'toile_moust', qty: h.r2(p.W * p.H * 1.1 * p.n) },
          { item: p.sys, qty: p.n }
        ];
        var days = h.r1(Math.max(0.15, p.n * 0.1));
        L.push({ item: 'pose_jour', qty: days, note: '≈ 0,1 j par moustiquaire' });
        var sn = { kit_moust_fixe: 'fixe', kit_moust_coul: 'coulissante', kit_moust_enr: 'enroulable', kit_moust_pli: 'plissée' };
        return { lines: L, warnings: W, laborDays: days, aluSurcharge: p.laquage === 'ral' ? 0.12 : 0, area: p.W * p.H * p.n,
          details: ['système ' + sn[p.sys]].concat(p.laquage === 'ral' ? ['laquage RAL'] : []),
          summary: p.n + ' × ' + p.W + ' × ' + p.H + ' m', geo: { kind: 'front', W: p.W, H: p.H, n: p.n, pattern: 'mesh' } };
      }
    }
  ];

  function interiorRoll(p, h, meca, toile, pattern) {
    var a = Math.max(1, p.W * p.H);
    var L = [
      { item: meca, qty: h.r2(p.W * p.n) },
      { item: toile, qty: h.r2(a * 1.1 * p.n), note: p.W * p.H < 1 ? 'minimum 1 m² par store' : '+10 % de coupe' }
    ];
    if (p.coffre) L.push({ item: 'coffre_enrouleur', qty: h.r2(p.W * p.n) });
    if (p.cmd === 'moteur') { L.push({ item: 'somfy_int', qty: p.n }); L.push({ item: 'somfy_telec', qty: 1 }); L.push({ item: 'electricien', qty: 1 }); }
    L.push({ item: 'visserie', qty: h.ceil(p.n / 6) });
    var days = h.r1(Math.max(0.2, p.n * 0.12));
    L.push({ item: 'pose_jour', qty: days });
    var tn = { toile_tamisant: 'toile tamisante', toile_occultant: 'toile occultante', toile_screen_int: 'toile screen', toile_jour_nuit: 'double voile' };
    return { lines: L, warnings: p.W > 2.5 ? ['Largeur > 2,50 m : vérifier le tube (risque de flèche).'] : [], laborDays: days, area: p.W * p.H * p.n,
      details: [tn[toile]].concat(p.coffre ? ['coffre'] : []).concat(p.cmd === 'moteur' ? ['moteur Somfy'] : ['chaînette']),
      summary: p.n + ' × ' + p.W + ' × ' + p.H + ' m', geo: { kind: 'front', W: p.W, H: p.H, n: p.n, pattern: pattern, coffre: p.coffre } };
  }

  /* Trois versions d'un même projet (mêmes dimensions) : Essentiel, Confort, Premium.
   * Chaque fonction reçoit la configuration en cours et renvoie les réglages à changer. */
  var VERSIONS = {
    'pergola-bioclimatique': function (p) {
      var sides = p.config === 'autoportante' ? 'trois' : 'avant1';
      return {
        A: { spots: 0, led: 'non', chauffage: 0, capteur: false, melody: false, brumi: false, cotes: 'aucun' },
        B: { spots: Math.max(p.spots, 8), led: 'blanc', capteur: true, cotes: 'aucun' },
        C: { spots: Math.max(p.spots, 8), led: 'rgb', capteur: true, cotes: sides, ferm: 'zip', zipCmd: 'capteur' }
      };
    },
    'pergola-toile': function (p) {
      return { A: { spots: 0, capteur: false, cotes: 'aucun' }, B: { spots: Math.max(p.spots, 6), capteur: true, cotes: 'aucun' },
        C: { spots: Math.max(p.spots, 6), capteur: true, cotes: 'avant', ferm: 'zip', zipCmd: 'capteur' } };
    },
    'pergola-aluminium': function (p) {
      return { A: { couv: 'poly_16', spots: 0, cotes: 'aucun' }, B: { couv: 'poly_compact', spots: Math.max(p.spots, 6), cotes: 'aucun' },
        C: { couv: 'verre_442', spots: Math.max(p.spots, 8), cotes: 'avant', ferm: 'zip', zipCmd: 'moteur' } };
    },
    'veranda': function (p) {
      return { A: { mat: 'alu', ouv: 'coulissant', vitrage: 'vitre_trempe', toit: 'bache_pvc_1', spots: 0 },
        B: { mat: 'alu', ouv: 'coulissant', vitrage: 'double_vitrage', toit: 'sandwich_40', spots: Math.max(p.spots, 4) },
        C: { mat: 'alu', ouv: 'accordeon', vitrage: 'controle_solaire', toit: 'sandwich_40', spots: Math.max(p.spots, 8) } };
    },
    'carport': function (p) {
      return { A: { mat: 'fer', d: 76, t: 3, couv: 'bache_pvc', q: '2', spots: 0 },
        B: { mat: 'galva', d: 89, t: 3, couv: 'bache_pvc', q: '1', spots: 0 },
        C: { mat: 'alu', d: 89, t: 4, couv: 'sandwich_40', q: '1', spots: Math.max(p.spots, 4) } };
    },
    'voile-ombrage': function () {
      return { A: { mat: 'fer', d: 89, t: 3, couv: 'screen', q: '2', cable: 'galva', accast: 'galva' },
        B: { mat: 'galva', d: 114, t: 4, couv: 'screen', q: '1', cable: 'galva', accast: 'galva' },
        C: { mat: 'inox', d: 114, t: 4, couv: 'screen', q: '1', cable: 'inox', accast: 'inox' } };
    },
    'store-banne': function () {
      return { A: { type: 'mono', meca: 'std', toile: 'std', cmd: 'manuel', capteur: false, ledbras: false },
        B: { type: 'coffre', meca: 'std', toile: 'std', cmd: 'moteur', capteur: false, ledbras: false },
        C: { type: 'coffre', meca: 'gaviota', toile: 'premium', cmd: 'somfy', capteur: true, ledbras: false } };
    },
    'store-zip': function () {
      return { A: { meca: 'std', auto: 'manuel', toile: 'std', capteur: false },
        B: { meca: 'std', auto: 'moteur_std', cmdz: 'telec', toile: 'std', capteur: false },
        C: { meca: 'premium', auto: 'moteur_premium', cmdz: 'telec', toile: 'premium', capteur: true } };
    },
    'store-enrouleur': function () { return { A: { cmd: 'chainette', coffre: false }, B: { cmd: 'chainette', coffre: true }, C: { cmd: 'moteur', coffre: true } }; },
    'store-jour-nuit': function () { return { A: { cmd: 'chainette', coffre: false }, B: { cmd: 'chainette', coffre: true }, C: { cmd: 'moteur', coffre: true } }; },
    'store-venitien': function () {
      return { A: { lame: 'venitien_25', guidage: false, cmd: 'manuel' }, B: { lame: 'venitien_50', guidage: false, cmd: 'manuel' }, C: { lame: 'venitien_50', guidage: true, cmd: 'moteur' } };
    },
    'moustiquaire': function () { return { A: { sys: 'kit_moust_fixe', laquage: 'standard' }, B: { sys: 'kit_moust_coul', laquage: 'standard' }, C: { sys: 'kit_moust_pli', laquage: 'ral' } }; }
  };
  var VERSION_NAMES = { A: 'Essentiel', B: 'Confort', C: 'Premium' };
  PRODUCTS.forEach(function (p) { p.versions = VERSIONS[p.id]; });

  var api = { SOURCES: SOURCES, BOOK: BOOK, SETTINGS: SETTINGS, PRODUCTS: PRODUCTS, VERSION_NAMES: VERSION_NAMES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SLCatalog = api;
})(this);
