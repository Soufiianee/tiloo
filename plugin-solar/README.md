# Plug-in Solar Tracker (working name; SITE_NAME is "TBD")

A static Astro site that answers: *is plug-in (balcony) solar legal in my state, what are the rules, and which kits fit?*

Status: **Phase 1 (research) complete, waiting for review.** No pages yet.

```
data/states.json             51 records (50 states + DC), every rule tied to the enacted text
data/kits.json               10 products sold for US plug-in use, with certification evidence
data/electricity_prices.json EIA residential price per state, Jan-Aug 2026
data/solar_yield.json        PVWatts kWh per kW per year (10 states so far)
data/updates.json            changelog seed (law signings)
config/                      affiliate slots (empty) and site settings (empty)
src/lib/schema.ts            zod schemas; the build fails on invalid data
research/RESEARCH_NOTES.md   method, conflicts, unknowns, re-check dates
```

`npm install`, then `npm run validate`.

The project lives in this subfolder so the existing Store Luxe files elsewhere in the repo are untouched. On Cloudflare Pages, set the root directory to `plugin-solar`.
