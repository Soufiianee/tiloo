# Weekly maintenance prompt

Paste everything below the line into a new Claude Code session opened in this repository. It takes about an hour of agent time.

---

You maintain a US plug-in (balcony) solar tracker. The data lives in `data/*.json` and is validated by `src/lib/schema.ts`. Your job this week is to re-verify stale or changed records from **primary sources**, update the data, log every change, and rebuild. Accuracy beats completeness.

## Rules (do not break these)

1. A legal fact (status, bill number, dates, size limit, battery, utility notice or approval, landlord, HOA, certification, net metering) may come only from a legislature bill page, enrolled or chaptered text, a governor's signing record, or a state utility commission page. Trackers and news (Plug-In Solar Guide, Bright Saver, YourSolarPlug, Exact Solar, pv magazine, Canary Media and similar) are **leads only**.
2. Never guess. If you can't confirm a fact, set it to `"unknown"` and explain why in `notes`. Never invent dates, wattages, certifications, prices or URLs.
3. Kit certification: `certified` only with a certifier directory entry (UL Product iQ, CSA, Intertek, TÜV) or a certificate document. Record the `scope`: `component` or `complete_system`. Product-page claims are `pending_or_claimed`.
4. Don't get around bot checks or login walls. If a site blocks you, record that and move on.
5. Every change gets an entry in `data/updates.json`: date, state, kind, title, body, source. Update `last_checked` on every record you re-verify, even if nothing changed.
6. Mark derived dates with `effective_date_basis: "derived"` and explain them in `effective_date_note`.

## Steps

1. `npm install`, then `npm run staleness`. Work the list it prints, in this order:
   a. States with effective dates or key dates in the next 60 days.
   b. The **weekly retry list**: states that are `unknown` or not fully verified. Always retry these:
      - **Ohio** (HB 755, SB 383): legislature.ohio.gov. Its certificate chain was incomplete; try a browser fetch.
      - **Illinois** (SB 3104, HB 4371): ilga.gov. Same certificate issue. The fall veto session can move bills.
      - **Hawaii** (SB 2902, HB 2486): capitol.hawaii.gov. It returned 403.
      - **Delaware** (SB 270): legis.delaware.gov. It returned an error page.
      - **Arizona** (HB 2843): azleg.gov. The bill overview did not load.
      - **New Hampshire** (SB 540, Chapter 262): gc.nh.gov. It was unreachable. If the owner pasted text from it, verify that text against anything you can reach. Then set the rule values, change `verification` to `primary`, and remove `status_label`.
      - **Rhode Island** (H 7269, S 2359): status lookup on status.rilegislature.gov.
      - **DC** (B26-0602 GRID Act): read the committee print on lims.dccouncil.gov and confirm the plug-in provisions. Track the first and final Council votes.
      - **West Virginia** (HB 5648): confirm the official title and that it contains plug-in rules.
      - **New Mexico**: find the 2026 session-end record on nmlegis.gov.
      - **No-bill states** (AL, AR, KS, KY, LA, MS, MT, NE, NV, ND, SD, TN, TX, WI): run each legislature's own bill search for "plug-in solar", "portable solar", "balcony solar" and "portable solar generation device". Record the search URL and date in the source. Then set `verification` to `primary`.
   c. All other records older than 7 days.
2. **Active bills**: NY A9111-C (delivery to the governor and her action), MA H.5175 (conference report), PA HB 1971 (session ends Nov 30, 2026), MI HB 5764 (session ends Dec 31, 2026), NC H1129 and S957. When a bill is signed:
   - set `status` and `stage`;
   - fill all nine rules from the enacted text, with section pinpoints and `rule_sources`;
   - write `summary_plain` (2–3 sentences, specific numbers) and `watch_notes`;
   - add a `law_signed` update.
3. **New sessions** (January): look for new or refiled bills in every state, starting with OR, WA, OK, MN, GA, IL, HI, MD (amendments) and the states above.
4. **Certification watch**: for every kit in `data/kits.json`, check UL Product iQ (productiq.ulprospector.com), the CSA directory (directories.csagroup.org), Intertek's directory, and the maker's certificate downloads (for example, APsystems' certificate folder). Add new US plug-in kits from major brands. Re-check prices and set `price_checked_on`. If a **complete system** gets UL 3700, add a `kit_update` entry: it changes compatibility in VT, ME, NJ and CA.
5. **Electricity prices**: download `https://www.eia.gov/electricity/data/eia861m/xls/sales_revenue.xlsx`. Recompute the 12-month residential average (total revenue / total sales) for the newest 12 months, and update `data/electricity_prices.json` (period, period_start, period_end, states, last_checked).
6. **Solar yield**: if any value is `"unknown"`, run `NREL_API_KEY=… npm run yield`. The key may instead be injected by the network proxy as an `X-Api-Key` header; then set `NREL_API_KEY=proxy-injected` and `NODE_USE_ENV_PROXY=1`.
7. Run `npm run validate`, `npm test`, `npm run build` and `npm run linkcheck -- --external`. Fix every validation error. Report dead source links in `research/LINKCHECK.md`; don't delete data silently.
8. Commit with a message that lists every state and kit changed, then push.
9. Print a short summary: what changed, what is still unknown and why, and the dates to watch next week.

## Fetching notes from the first research run

- Connecticut (cga.ct.gov) sends an incomplete chain. Add the public GoDaddy G2 intermediate certificate (`https://certs.godaddy.com/repository/gdig2.crt`, DER → PEM) to the CA bundle. Never disable verification.
- California's bill pages are behind a bot check. Use the official bulk data, `https://downloads.leginfo.legislature.ca.gov/pubinfo_2025.zip`. Read BILL_TBL / BILL_VERSION_TBL and the chaptered `.lob` with HTTP range requests; don't download the whole 1.2 GB file.
- Utah, Colorado, New Jersey, Virginia and Wyoming pages need JavaScript. Use a headless browser. Wyoming also has a JSON API: `web.wyoleg.gov/LsoService/api/BillInformation/{year}/{bill}`.
- NCSL's session calendar disagreed with the official journals for GA, ID, IA and SC. Always use the legislature's own journal for session-end dates.
