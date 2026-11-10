# Report

Status as of **10 November 2026**. The site builds, validates and is ready to deploy. One input is still missing: solar-yield figures, which need a working NREL API key (see open questions).

## What was built

- **Static Astro site**, 71 pages: home with the state tool, 51 state pages, a states index, 10 kit pages and a kits index, Certification watch, updates (with RSS), About, How we verify, Disclaimer, Privacy and Affiliate disclosure. The Contact page is generated only once `CONTACT_EMAIL` is set.
- **The tool** (home page), with three ways to pick a state: a type-to-jump select, an inline SVG tile map (one keyboard-focusable square per state) and a list view. The result card is announced to screen readers and shows:
  - a status pill with a word, not just a colour;
  - a countdown to the effective date, computed in the browser;
  - the key rules, each with a source link;
  - kits with conservative verdicts, and a link to Certification watch when no kit is confirmed.
  The savings estimator shows two scenarios (20° "ideal tilt" and 90° "vertical railing") with a payback range, and a "How we calculate" disclosure. A state can be shared as `/#state-xx`.
- **Certification watch**: UL 3700 status for every kit, with scope (component vs complete system), certifier, conditions and evidence. It lists the states that require UL 3700 or complete-system certification. The email-alert embed reads `CERT_WATCH_SIGNUP_EMBED_URL`; while that is empty, the page points to the RSS feed instead.
- **SEO**: a unique title and description per page from the data, canonical URLs, sitemap.xml, robots.txt and BreadcrumbList JSON-LD on every page. FAQPage JSON-LD appears only where a visible FAQ exists; Dataset JSON-LD is on the home page. Each state has a 1200×630 Open Graph image generated at build time. State pages link to bordering states.
- **Data safety**: zod schemas, and `npm run build` runs validation first, so the build fails on invalid data. The rules are enforced in code:
  - a "certified" kit must have certificate evidence;
  - rules can only be set for enacted laws;
  - every set rule needs a source.
- **Maintenance kit**:
  - `npm run staleness`: lists records older than 7 days, dates in the next 60 days and the retry list;
  - `npm run yield`: PVWatts, both scenarios, all states;
  - `npm run linkcheck [-- --external]`;
  - `MAINTENANCE_PROMPT.md` and `DEPLOY.md`.

## Data summary

**States by status (51):**

| Status | Count | States |
|---|---|---|
| Law in effect | 6 | CO, CT, ME, MD, UT, VT |
| Law passed, not yet in effect | 4 | CA (Jan 1 2027), NH (signed, details being verified), NJ (Mar 1 2027), VA (Jan 1 2027) |
| Bill active | 6 | DC, MA, MI, NC, NY, PA |
| Bill failed or died | 14 | AK, GA, ID, IN, IA, MN, MO, NM, OK, OR, SC, WA, WV, WY |
| Status not yet confirmed | 6 | AZ, DE, HI, IL, OH, RI |
| No bill found | 15 | AL, AR, FL, KS, KY, LA, MS, MT, NE, NV, ND, SD, TN, TX, WI |

**Kits (10), by UL 3700 status:**
- **Certified: 1.** APsystems EZ1-LV, *component only*, from a CSA certificate.
- **Claimed: 2.** Hoymiles HiFlow Pro, 391 and 420 W.
- **Not certified: 2.** Bright Saver 180 W and 360 W kits.
- **Unknown: 5.** EcoFlow (3 products) and CraftStrom (2 products).

No kit is "compatible" anywhere. No complete system has a certificate, so in every enacted state the best verdict is "check with seller".

**Prices:** EIA Form 861M, residential, rolling 12 months September 2025 – August 2026, for all 51 states and DC.
**Solar yield:** 10 states have the ideal-tilt figure (demo-key runs); all vertical figures and 41 ideal figures are pending. The site shows no estimate where a figure is missing.

## Phase 2 gap fixes (owner's item 7)

- **Session-end dates from official journals**: AK May 20, GA Apr 2, ID Apr 2, IA May 2, MO May 28, OK May 14, SC May 14. NM is still unverified (no journal found online). NCSL's calendar was wrong for GA, ID, IA and SC; those were corrected from the journals.
- **Colorado**: the Secretary of State's list of 2026 ballot measures includes no referendum on HB26-1007, so August 12, 2026 stands.
- **CraftStrom**: the spec sheet gives only "Ppeak: 350W @120V" per inverter, so the kit totals (700 W and 1,050 W) are marked *estimated*.
- **Derived dates** are labelled on the site: NJ (six months after enactment), CA (constitutional January 1 default), CO (90 days after adjournment) and ME (general effective date).

## QA results

- `npm run build`: 71 pages, **0 warnings**. `npm test`: **13 tests passing**, including 6 hand-checked calculator cases.
- Internal link check: **2,005 links, 0 broken**.
- External source check: **89 URLs; 17 not 2xx from our environment** (`research/LINKCHECK.md`). None are dead pages:
  - 10 were PVWatts API URLs needing a key; those sources now point to the PVWatts docs instead;
  - 7 are sites that block automated clients or send incomplete certificate chains (gc.nh.gov, leginfo.legislature.ca.gov, leg.colorado.gov, cga.ct.gov ×2, ilga.gov, legislature.ohio.gov). They should work in a normal browser.
- **Lighthouse, mobile** (local preview):

  | Page | Performance | Accessibility | Best practices | SEO |
  |---|---|---|---|---|
  | `/` | 100 | 100 | 100 | 100 |
  | `/states/vermont/` | 100 | 100 | 100 | 100 |
  | `/kits/apsystems-ez1-lv/` | 100 | 100 | 100 | 100 |

- **JavaScript**: one 6.3 KB bundle, on the home page only, plus a tiny inline theme script.
- **Layout**: 5 pages checked at 360, 768 and 1280 px in light and dark themes. No horizontal overflow and no console errors. Tables stack into labelled rows on phones.

## Open questions

1. **NREL key**: the key saved for developer.nlr.gov is rejected (`API_KEY_INVALID`). It also overrides the public demo key, so no yield runs can happen until it is fixed. Re-enter a valid key, then run `npm run yield`.
2. **New repository**: this session cannot create repositories. Once you create an empty one, the `plugin-solar/` folder becomes its root.
3. **New Hampshire**: waiting on your check of gc.nh.gov.
4. **Signup provider**: choose one and paste its embed URL into `CERT_WATCH_SIGNUP_EMBED_URL`.
5. `SITE_NAME`, `BASE_URL` and `CONTACT_EMAIL` are still empty or placeholders.

## Known limits

- Status for OH, IL, HI, DE, AZ and RI is unconfirmed (official sites unreachable or unread). They are on the weekly retry list.
- 14 "no bill found" states rely on trackers plus our own search outcome, not each legislature's own search (Florida was searched directly).
- UL Product iQ and the CSA directory were unreachable, so certification evidence comes from manufacturer-hosted certificates.
- Yields are modelled for the state capital only; real balconies vary by orientation and shade.
- Guides (`/guides/...`) are not written yet. You allowed these to follow.
- Dates printed on pages are fixed at build time, so redeploy weekly. Countdowns update in the browser.

## Top 5 next improvements

1. Fix the NREL key and fill both yield scenarios for all 51 states.
2. Write the five guides, starting with "UL 3700 explained" and "Renters", which matter most for 1 January.
3. Confirm the 6 unconfirmed states and the 14 "no bill" states on their own legislature search pages.
4. Add a per-kit "what the certificate covers" explainer, and a state-specific checklist (forms, notice periods) to each enacted state page.
5. Add a ZIP-to-utility lookup for the notification forms (VA SCC form, MD and ME utility notices), from official utility commission pages.

## Domains fetched during research

**Worked** (official sources, government data, manufacturer pages, leads):

```
le.utah.gov  leg.colorado.gov  mgaleg.maryland.gov  legislature.vermont.gov  legislature.maine.gov
www.legislature.maine.gov  lis.virginia.gov  lis.blob.core.windows.net  www.cga.ct.gov (needs GoDaddy G2 intermediate)
www.njleg.state.nj.us  pub.njleg.state.nj.us  downloads.leginfo.legislature.ca.gov  nyassembly.gov
malegislature.gov  lims.dccouncil.gov  legislature.mi.gov  www.palegis.us  www.ncleg.gov  www.akleg.gov
www.legis.ga.gov  legislature.idaho.gov  iga.in.gov  www.legis.iowa.gov  www.revisor.mn.gov  house.mo.gov
www.senate.mo.gov  www.nmlegis.gov  www.oklegislature.gov  www.oksenate.gov  olis.oregonlegislature.gov
www.scstatehouse.gov  app.leg.wa.gov  lawfilesext.leg.wa.gov  www.wvlegislature.gov  wyoleg.gov  web.wyoleg.gov
webserver.rilegislature.gov  status.rilegislature.gov  www.flsenate.gov  www.sos.state.co.us
www.eia.gov  developer.nlr.gov  www.nlr.gov
usa.apsystems.com  apshop.apsystems.com  apsystems.filecloudonline.com  us.ecoflow.com  www.hoymiles.com
www.brightsaver.org  brightsaver.org  craftstrom.com
pluginsolarguide.com  yoursolarplug.com  exactsolar.substack.com  thirdact.org  electrek.co
bills.nhliberty.org  documents.ncsl.org  sd11.senate.ca.gov  www.gov.ca.gov  certs.godaddy.com  archive.org
```

**Tried but blocked or unreachable** (no need to allow unless you want to retry):
`gc.nh.gov`, `www.energy.nh.gov`, `www.governor.nh.gov`, `leginfo.legislature.ca.gov` (bot check), `www.capitol.hawaii.gov` (403), `legis.delaware.gov` (error page), `apps.azleg.gov`, `www.legislature.ohio.gov` and `www.ilga.gov` / `ilga.gov` (incomplete certificate chain), `www.nysenate.gov` (403), `legiscan.com` (bot check), `productiq.ulprospector.com` (403), `directories.csagroup.org` (502), `developer.nrel.gov` / `www.nrel.gov` / `pvwatts.nrel.gov` (moved to nlr.gov), `crt.sectigo.com`, `crt.sh`, `web.archive.org`.

**Package installs**: `registry.npmjs.org`.

**The deployed site** makes no third-party requests unless you turn on analytics (`plausible.io`) or a signup embed (your provider's domain).
