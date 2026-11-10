# Research notes — Phase 1

Checked: **10 November 2026**. Everything below describes what was checked that day and how.

## 1. Method

**State law (51 records).**

1. Collected leads from four trackers: Plug-In Solar Guide (pluginsolarguide.com, "as of November 2026"), Exact Solar's state roundup (24 July 2026), YourSolarPlug (last updated 20 May 2026) and Third Act Washington (10 July 2026). None of these is used as evidence for a published fact.
2. For each lead, opened the legislature's own bill page and, for enacted laws, the enrolled or chaptered text. Every rule value in `data/states.json` points to the section of the enacted text it comes from.
3. Effective dates come from the act's own effective-date clause. Where the act relies on a constitutional default, the note says so (California, Maine, Colorado).
4. Sites that would not load were not replaced with secondary data. The fact stays `unknown`, or the record is flagged (see section 3).
5. Fetching notes. Connecticut's server sends an incomplete certificate chain, so we added the public GoDaddy G2 intermediate certificate (verification stayed on). California's bill page is behind a bot check, so we did not try to get past it; we used the Legislature's official bulk download (`downloads.leginfo.legislature.ca.gov/pubinfo_2025.zip`) and read only the SB 868 rows and the chaptered bill XML.

**Kits (10 records).** We used manufacturer stores and spec sheets for specs and prices. Certification status follows the brief: `certified` only with a certifier directory entry or a certificate document. UL Product iQ returned 403 and the CSA directory returned 502 from our environment, so the one `certified` entry rests on CSA certificates published by the manufacturer (APsystems). Claims on product pages are `pending_or_claimed`. Where neither a claim nor evidence exists, the status is `unknown`, not `not_certified`.

**Electricity prices.** EIA *Electric Power Monthly* Table 5.6.B, residential, year-to-date January–August 2026 (cents/kWh), for all 50 states and DC. These are preliminary EIA figures.

**Solar yield.** NREL's PVWatts v8 (NREL is now the National Laboratory of the Rockies; the API lives at `developer.nlr.gov`). Settings: 1 kW DC, fixed open rack, 20° tilt, due south, 14% losses, at each state capital. The public demo key allows 10 runs per hour, so only the 10 enacted states are done. The other 41 are `unknown`, and no national figure was substituted.

## 2. Conflicts between sources and how we resolved them

| # | Topic | Secondary claim | Primary source says | Resolution |
|---|---|---|---|---|
| 1 | Oregon | YourSolarPlug: HB 4080 "Law Passed", effective July 2026 | OLIS: still in House Committee on Climate, Energy, and Environment | Dead (`bill_failed_or_dead`) |
| 2 | Colorado tiers | YourSolarPlug: 395 W anywhere; up to 1,920 W "with a licensed electrician and dedicated circuit" | Act: 1,920 W cap to the grid; 391 W exemption from rewiring-related listing rules; no electrician requirement | Act |
| 3 | Maine electrician | YourSolarPlug: "Requires a licensed electrician" | PL 2025 c.644: no electrician up to 420 W; electrician plus dedicated circuit for 420–1,200 W | Act |
| 4 | New Hampshire dates | Exact Solar: signed May 28, effective July 27, 2026 | Mirror of Chapter 262 final text: approved July 2, 2026; remainder effective January 1, 2027 | Mirror is the better copy, but it is not primary, so rules stay `unknown` |
| 5 | Maryland 391 W | Exact Solar: under 391 W "exempt from UL certification" | 7-321(f): exempt only from listing provisions that would require alterations to premises, wiring or panels | Act |
| 6 | Maryland effective date | YourSolarPlug: October 2026 | Chapter 353: Section 1 (which holds 7-321) takes effect July 1, 2026 | July 1, 2026 |
| 7 | New York bill numbers | YourSolarPlug: "SUNNY Act (S7717)"; Plug-In Solar Guide: A 9111 / S 10099; Exact Solar: S 8512 / A 9111 | Assembly page: A9111-C, "same as S08512-C", short title "Solar Up Now NY Act" | A9111-C / S8512-C |
| 8 | New York status | Third Act: NY has "joined Utah in passing" | Passed both houses 5/28/2026; no delivery to the governor recorded | `bill_active`, not law |
| 9 | California bill | Solar.com headline: "AB 868" | Legislature data: SB 868, Chapter 985 | SB 868 |
| 10 | EcoFlow STREAM Ultra output | Plug-In Solar Guide: 800 W | EcoFlow page: 800 W alone; "Max. 1200W On-Grid AC Output" with a STREAM Microinverter | Recorded 800 W standalone, with a note |
| 11 | EcoFlow sale states | EcoFlow page note: UT, MD, CT, CO | Same page footnote: sale and plug-and-play installation in Utah only | Noted on the kit; not used for compatibility |
| 12 | Hoymiles HiFlow Pro | Early coverage: "UL-certified" | No certificate or directory entry found; a search result for InsideEVs reports a correction ("not certified by UL Solutions"), which we did not open | `pending_or_claimed` |
| 13 | Illinois | YourSolarPlug: SB 3104 "Senate Floor Pending"; Plug-In Solar Guide: sponsors ended the push | ilga.gov not reachable (certificate chain) | `unknown` |
| 14 | Washington | Trackers: plug-in language stripped from HB 2296 | Introduced HB 2296 contains "portable solar" text; Chapter 136, Laws of 2026 contains none | Confirmed; `bill_failed_or_dead` |
| 15 | Maryland chapter text | (internal) The chapter PDF has two pairs of effective-date sections (Sec. 12/13 and Sec. 22/23) | Both pairs put Section 1 at July 1, 2026 | July 1, 2026; flagged as low-confidence below |

## 3. What is `unknown` and why

- **New Hampshire: all nine rules.** gc.nh.gov gave an empty reply or 502, and energy.nh.gov and governor.nh.gov returned 403. The only full text we could read is a non-official mirror. Status is kept as `enacted_not_yet_effective` with `verification: "secondary_only"`.
- **Status unknown: Ohio, Illinois** (legislature servers send certificate chains we could not verify), **Hawaii** (403), **Delaware** (site error page), **Arizona** (bill page did not load), **Rhode Island** (bill text read, but the status system needs a form search).
- **DC content.** B26-0602's status is confirmed. That it contains balcony-solar provisions comes from trackers; we have not read the committee print yet.
- **West Virginia content.** HB 5648's history is confirmed. Its plug-in content and official title are not.
- **Kits.** Plug type for 8 of 10 products; price for the two Hoymiles models (no manufacturer price); AC output for both Bright Saver kits (the HiFlow model is not stated); UL 3700 status for the EcoFlow and CraftStrom products (no claim, no evidence).
- **Solar yield for 41 states.** Waiting on a PVWatts API key.
- **No-bill states (14 of 15).** We relied on two trackers agreeing and did not run each legislature's own full-text search. Florida was checked on flsenate.gov: zero 2026 bills match "plug-in" solar or "portable solar generation". These records carry `verification: "not_checked_on_primary"`.

## 4. Re-check soon (next 90 days, to 8 February 2027)

| Date | State | What |
|---|---|---|
| 10 Nov 2026 | DC | Request filed to put B26-0602 on the Council's legislative meeting agenda |
| 15 Nov 2026 | VA | Work group report on plug-in safety standards due (enactment clause 3) |
| 30 Nov 2026 | PA | 2025–26 session ends; HB 1971 dies if not passed |
| Any day | NY | A9111-C must be delivered to the governor; she then has 10 days, or 30 days if the Legislature has adjourned |
| Any day | MA | H.5175 conference committee report |
| Nov–Dec 2026 | IL, OH, MI, NC | Fall or lame-duck sessions; confirm IL and OH bills once their sites load |
| 31 Dec 2026 | CO | PUC must revise rules for meter collar adapters |
| 31 Dec 2026 | MI | Session ends; HB 5764 dies if not passed |
| 1 Jan 2027 | CA, VA, NH | Laws take effect (NH unverified) |
| 1 Jan 2027 | CO | Renter and HOA protections and the 391 W UL-listing sales rule start |
| Jan 2027 | most states | New sessions convene; expect refiled bills in OR, WA, OK, MN, GA and others |
| 1 Mar 2027 | NJ | Garden State Balcony Solar Act takes effect (just outside the 90-day window) |

## 5. Facts we are least sure about

1. **New Hampshire (all facts).** Based on a mirror and news reports, not the state's site.
2. **Colorado effective date, August 12, 2026.** Correct only if no referendum petition was filed. We did not check with the Secretary of State.
3. **New Jersey effective date, March 1, 2027.** We computed it from "six months after the date of enactment" (approved September 1, 2026). The chapter-law PDF was not posted yet, so we used the 3rd reprint, which is the version both houses passed.
4. **California effective date, January 1, 2027.** Comes from the constitutional default for non-urgency statutes; the chaptered text has no operative-date clause.
5. **Maryland effective date, July 1, 2026.** The chapter PDF has duplicated effective-date sections (see conflict 15).
6. **North Carolina as `bill_active`.** The bills are technically alive, but the adjournment resolution may bar them from moving.
7. **Dead bills for AK, GA, ID, IA, MO, NM, OK, SC.** We rely on the bill page plus the general fact that 2026 sessions have adjourned. Adjournment dates were confirmed only for Maine and Colorado.
8. **CraftStrom AC outputs (700 W and 1,050 W).** Inferred from "2 × / 3 × 350W Smart Inverter" with "Max Input Power: 420W" on the product pages.
9. **APsystems EZ1-LV as `certified` (UL 3700).** Rests on a CSA certificate PDF hosted by APsystems, not on the CSA directory. It covers the inverter as a component only, with conditions.
10. **Virginia HOA reading (`covenants_preserved`).** Based on 15.2-2288.7(F), which says the section does not supersede HOA or condominium documents. A court could read it differently for devices on a tenant's own balcony.

## 6. Phase 2 additions (10 November 2026)

**Session ends, from official journals** (each linked on the state page):

| State | Sine die | Record |
|---|---|---|
| Alaska | 20 May 2026, 9:43 p.m. | House Journal, May 20 |
| Georgia | 2 Apr 2026 (Day 40) | House Status No. 40 |
| Idaho | 2 Apr 2026 | Senate Journal, day 81 |
| Iowa | 2 May 2026, 6:11 p.m. | House Journal, May 2 (H.C.R. 104) |
| Missouri | 28 May 2026 | Senate Journal, 70th day (bill deadline was May 15) |
| Oklahoma | 14 May 2026, 4:15 p.m. | Senate Journal, 54th legislative day |
| South Carolina | 14 May 2026, 5:00 p.m. | House Journal, May 14 |
| New Mexico | not confirmed | 2026 journals not found on nmlegis.gov |

**New conflict:** NCSL's 2026 session calendar listed GA April 6, ID April 10, IA April 21 and SC May 7. The official journals show April 2, April 2, May 2 and May 14. We use the journals.

**Colorado referendum:** the Secretary of State's "Amendments and Propositions on the 2026 Ballot" lists no referendum on HB26-1007, so the August 12, 2026 effective date stands. This removes item 2 of the least-sure list.

**CraftStrom output:** the spec table lists "Ppeak: 350W @120V" per inverter and gives no kit total. The 700 W and 1,050 W figures are marked *estimated*.

**Electricity prices:** switched to a rolling 12-month residential average (Sep 2025 – Aug 2026) from EIA Form 861M: total revenue divided by total sales.

**Solar yield:** two scenarios per state capital, 20° and 90° facing south. Runs are blocked: the API key saved for developer.nlr.gov returns `API_KEY_INVALID`, and because it is injected into every request it also overrides the public demo key.
