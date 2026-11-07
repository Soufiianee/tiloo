# Supplier price study: how high can prices go? (7 November 2026)

This study filled the price book in `app/catalog.js`. Each item stores three values:

- its dated history (`hist`), which gives today's price and the 12-month high;
- `max`, the highest price found in research.

These are public prices and market ranges, not Store Luxe's purchase prices. Replace them first for the two indices, then for fabrics and motors.

## 1. What drives the cost

| Cost family | Share of a quote | What moves it |
|---|---|---|
| Aluminium (structures, slats, posts, cassettes, guides) | 40–60 % of a pergola | LME price in $, regional premium, extrusion + powder coating, USD/MAD |
| Imported components (Somfy, Sauleda, Serge Ferrari, Gaviota/Llaza/Siplan) | 20–50 % of a blind | manufacturer list price (1–2 revisions a year), EUR/MAD, landed costs |
| Local supplies and labour (glass, polycarbonate, panels, concrete, installation) | 15–30 % | slow, steady increase |

## 2. Aluminium

| Reference point | LME $/t | Estimated coated profile |
|---|---:|---:|
| Today (7/11/2026) | 3,065 | ≈ 53.6 MAD/kg |
| 2026 high (early June, global deficit) | ≈ 3,750 | ≈ 57.5 MAD/kg |
| 2023–2024 average | < 2,500 | ≈ 48 MAD/kg |
| **All-time record (7 March 2022)** | **4,073** | **≈ 65.7 MAD/kg** |

Model: `MAD/kg = (LME + premium 500 $/t + extrusion & coating 1,900 $/t) × USD/MAD ÷ 1000`. The premium and conversion cost are assumptions: replace them with the real gap between your extruder's invoice and that day's LME price. You can do this with the calculator in the *Prix & sources* tab. Powder coating adds 15–20 % to bare profile.

Sources: [MetalCharts](https://metalcharts.org/aluminum-price-history), [alum.ma](https://alum.ma/prix-de-laluminium-au-m2-au-maroc/).

## 3. Exchange rates

- **EUR/MAD**: 2024 average 10.755, 2025 average 10.54. In 2026: 10.902 (27 Jan), **10.964 high (7 Apr)**, ~10.68 (late Jul). The dirham is pegged to a euro/dollar basket, which keeps annual swings to a few per cent.
- **USD/MAD**: 9.314 (31 Jul 2026), ~9.8 early November (inverted from MAD/USD 0.102).

Sources: [TradersUnion](https://tradersunion.com/currencies/price-history/eur-mad/), [ValutaFX](https://www.valutafx.com/history/eur-mad), [MoneyExchangeRate](https://moneyexchangerate.org/currencyexchange/mad/usd/50000).

## 4. Imported components (public or retail prices)

| Component | Price found | Researched maximum |
|---|---:|---:|
| Somfy Sunilus io awning motor | 202 € excl. VAT, public | 355 € (Altus 50 RTS 40 Nm) |
| Somfy Altus 40 RTS indoor motor | 138 € excl. VAT | 230 € (Altus 50 RTS) |
| Somfy Eolis 3D Wirefree wind sensor | 99 € excl. VAT, public | 116 € (io version) |
| Serge Ferrari Soltis 86 fabric | 33.90 € incl. VAT/m² | 28 € excl. VAT/m² |
| Acrylic fabric (Sauleda, Dickson) | 18–40 € incl. VAT/m² | 24 € excl. VAT/m² (trade) |
| Full-cassette motorised awning, no installation (France) | 700–3,400 € | 240 €/m (system) |
| Motorised bioclimatic pergola, Chinese factory | 180–466 $/m² | sample price |

Landed costs default to 25 % (customs, transport, transit). Distributors' trade prices are usually 20–40 % below public prices.

Sources: [Batiproduits Sunilus](https://www.batiproduits.com/amp/fiche/produits/motorisation-radio-pour-stores-bannes-sunilus-io-p68905443.html), [Batiproduits Eolis](https://www.batiproduits.com/amp/fiche/produits/capteur-de-vent-sans-fil-pour-stores-bannes-eoli-p68905428.html), [Dieffematic](https://dieffematic.com/en/products/motor-somfy-altus-40-rts-9-16-1023316-automation-automatisms-original-new), [Kaufland](https://www.kaufland.fr/product/467265193/), [Bootsshop](https://bootsshop.at/en/products/das-ideale-gewebe-zwischen-sonnenschutz-und-erforderlicher-beleuchtung), [H2R](https://www.h2r-equipements.com/tissus-pour-bateau/7986-sauleda-tissu-sea-star-lin.html), [La Prime Énergie](https://www.laprimeenergie.fr/les-travaux/store-banne/prix), [Alibaba](https://www.alibaba.com/product-detail/Brand-new-high-quality-Motorized-Louver_1601028447957.html).

## 5. Local supplies and labour (Morocco, survey of 15 June 2026)

| Item | Range |
|---|---:|
| Laminated glass 44.2 | 450–750 DH/m² |
| Clear toughened glass 6 mm / 8 mm | 280–450 / 380–650 DH/m² |
| Double glazing 4/16/4, toughened | 650–1,100 DH/m² |
| Polycarbonate roofing, installed | 350–650 DH/m² |
| Sandwich panel 40 mm PUR | 180–240 DH/m² |
| Pre-painted steel deck 0.5 / 0.7 mm | 110–160 / 140–190 DH/m² |
| B25 concrete | 950–1,100 DH/m³ |
| Labourer / electrician / mason (per day) | 150–250 / 300–550 / 280–450 DH |
| Aluminium joinery installation | 120–240 DH/m² |

Sources: lechantier.ma ([glass](https://lechantier.ma/fr/prix/verre-trempe), [steel deck](https://lechantier.ma/fr/prix/bac-acier), [labour](https://lechantier.ma/fr/prix/main-doeuvre), [concrete](https://lechantier.ma/fr/prix/beton)).

## 6. Market selling prices

| Product | Observed price |
|---|---:|
| Bioclimatic pergola, installed (Morocco) | 5,500–8,500 DH/m² |
| Perlago ATLAS 5×3 / 5×4 / 6×4, incl. VAT, no installation | 63,163 / 77,050 / 91,685 DH |
| Perlago: installation, 8 spots, 16 m LED white / RGB | 5,000 / 5,008 / 6,548 / 8,346 DH |
| Veranda alu + polycarbonate / + laminated glass | 4,500–6,500 / 6,500–9,000 DH/m² |
| Thermal-break veranda, triple glazing | 9,000–12,000 DH/m² |
| 2-rail aluminium sliding door, installed | 2,800–4,500 DH/m² |
| Somfy motorised roller shutter | 3,500–5,500 DH/m² |
| Motorised cassette awning, installed (France) | 1,500–5,000 € |

Sources: [lechantier.ma verandas](https://lechantier.ma/fr/prix/veranda), [lechantier.ma joinery](https://lechantier.ma/en/prix/menuiserie-aluminium), [Perlago](https://www.perlago.ma/4-mod%C3%A8le-atlas-), [Akena](https://www.akena.com/en/pergolas/pergolas-price?page=1).

**What it means for Store Luxe**: at the *recommended* level, the tool prices a 5 × 3 m bioclimatic pergola at about 69,000 DH incl. VAT, installation included (about 4,600 DH/m²). That matches Perlago with installation and sits below the Moroccan market range, so there is room to position higher.

## 7. Three price levels

| Level | Cost used | When to use it |
|---|---|---|
| **Floor** | latest known price | minimum that still holds the target margin if you buy today |
| **Recommended** (default) | 12-month high + 2 % | normal quotes, valid for 15 days |
| **Prudent** | all-time high (e.g. aluminium at its 2022 record) + 2 % | large jobs, delivery in several months, long-validity quotes |

For a 5 × 3 m bioclimatic pergola: floor ≈ 65,900, recommended ≈ 70,200, prudent ≈ 81,400 DH incl. VAT.

## 8. Limits

- Moroccan classified-ad sites (Avito, Jumia) block automated access, so no prices come from them.
- Some items have no published price and are estimated: ZIP motor, PVC pergola fabric, Chinese 24 V actuator, kits, LED, masts, etc. They are marked `est` in the catalogue and "Estimation de l'étude" in the app.
- Quantity rules (post spacing, days of installation…) still need to be calibrated on 5 or 6 real jobs.
