# Plug-in Solar Tracker (working name; set `SITE_NAME` in config/site.json)

A static Astro site that answers: *is plug-in (balcony) solar legal in my state, what are the rules, and which kits qualify?* Every legal fact is traced to an official source.

```
data/                 states, kits, electricity prices, solar yield, updates (source of truth)
config/               site settings and affiliate slots (empty by default)
src/lib/schema.ts     zod schemas; the build fails on invalid data
src/lib/compat.ts     kit x state verdicts (component-only certificates are never "compatible")
src/lib/calc.ts       savings estimate (two solar scenarios, payback range)
src/pages/            tool, states, kits, Certification watch, updates + RSS, trust pages, sitemap, OG images
scripts/              validate, staleness, pvwatts (yield), linkcheck
research/             research notes and link-check report
```

| Command | What it does |
|---|---|
| `npm install` | install |
| `npm run dev` | local preview at http://localhost:4321 |
| `npm run build` | validate data, then build to `dist/` |
| `npm test` | calculator and compatibility tests |
| `npm run staleness` | what needs re-checking |
| `NREL_API_KEY=… npm run yield` | fill missing solar-yield figures |
| `npm run linkcheck -- --external` | internal links plus every source URL |

Read next: `DEPLOY.md` (go live), `MAINTENANCE_PROMPT.md` (weekly upkeep), `REPORT.md` (status, open questions), `research/RESEARCH_NOTES.md` (method and conflicts).
