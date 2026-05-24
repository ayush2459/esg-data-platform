# SOURCES.md — Source Research & Sample Data Rationale

For each of the three sources: what I researched, what I learned, what my sample data looks
like and why, and what would break in a real deployment.

---

## 1. SAP — Fuel and Procurement Data

### What I researched

SAP's Financial Accounting (FI) module stores all financial postings in two core tables: BKPF
(accounting document header) and BSEG (accounting document line items). The G/L Account Line
Item report, accessible via transaction FAGLL03, exports a flat file that reflects these tables.

Key findings from SAP documentation and practitioner resources:

- **Export format**: Tab-delimited text or ALV grid export to .XLSX. The tab-delimited export
  is more reliable for machine parsing (Excel exports can have merged cells and headers
  spanning multiple rows).
- **Date formats**: SAP stores dates internally as YYYYMMDD (8-digit integer). The display
  format in exports depends on the user's date format setting: `DD.MM.YYYY` for German/European
  locales, `MM/DD/YYYY` for US locales. This is a per-user setting, not a system setting —
  meaning two exports from the same system can have different date formats.
- **Amounts**: European SAP systems use `.` as thousands separator and `,` as decimal separator
  (`1.234,56`). This is the opposite of US convention and breaks `float()` parsing silently
  (it parses as 1.234, not 1234.56).
- **Units**: SAP uses its own unit of measure codes: `L` (liters), `KG` (kilograms), `M3`
  (cubic meters), `KWH` (kilowatt hours), `ST` (Stück = pieces). The German abbreviation
  `ST` for pieces is a common source of confusion.
- **Plant codes**: 4-character alphanumeric, e.g. `DE01`, `1000`, `UKLD`. Meaning is
  entirely client-specific. SAP stores the plant master in table T001W.
- **G/L account structure**: Fuel purchases might post to G/L account `4100000` (energy costs)
  or `5200010` (vehicle fuel) depending on the client's chart of accounts. Without a mapping
  from the client's finance team, G/L account numbers alone don't tell us the emission category.

### What my sample data looks like and why

```
Buchungsdatum	Belegdatum	Belegnummer	Buchungskreis	Werk	Sachkonto	Menge	Einheit	Betrag in Hauswährung	Währung	Belegkopftext
15.01.2024	12.01.2024	4900012301	DE01	DE01	4100000	25.000,00	L	18.750,00	EUR	Diesel Jan Wk2
22.01.2024	18.01.2024	4900012445	DE01	UK03	4100000	8.500,00	L	7.225,00	EUR	Unleaded petrol
31.01.2024	31.01.2024	4900013102	DE01	DE01	5200010	1.200,00	KG	840,00	EUR	LPG forklift fuel
```

I used:
- **German column headers** — the client is a European enterprise running SAP in a German
  locale, which is common for any company with German parent operations.
- **European decimal format** (`25.000,00` = 25000.00 liters) — this is the realistic format
  and the most common parsing trap.
- **Realistic G/L accounts** — 4100000 (energy/fuel costs) and 5200010 (vehicle operating costs)
  are in the range of standard SAP chart of accounts for these categories.
- **Plant codes that look like real SAP codes** — `DE01` for a German plant, `UK03` for a UK
  facility, matching a company with multi-country operations.
- **Both volume and weight units** — diesel in liters, LPG in kg, because SAP records in
  procurement units, not emission-calculation units.
- **Text field (Belegkopftext)** — the document header text is free-form and inconsistent,
  as it would be in a real system.

### What would break in a real deployment

1. **Chart of accounts mismatch**: Every company has a different chart of accounts. G/L account
   `4100000` means fuel costs for this client; for another it might be rent. The category
   mapping must be configured per client, not hardcoded.

2. **Decimal/thousands separator ambiguity**: If a client's export comes in US format
   (`25,000.00`), a parser configured for European format will misread it as 25 (truncating
   at the comma). Silent data corruption.

3. **Multi-currency plants**: A UK plant posting in GBP to a EUR-currency company code produces
   records with both local currency (GBP) and company code currency (EUR) columns. The current
   model captures one currency; a real system needs both.

4. **Split postings**: One SAP document can post to multiple cost centers and G/L accounts in
   one transaction. The FAGLL03 export produces one row per line item, so a single fuel
   purchase might appear as three rows if it's split across cost centers. Summing without
   awareness of this produces overcounting.

5. **Reversal documents**: SAP corrections are posted as reversal documents (negative amounts
   with a reversal indicator). A naive ingestion that sums all positive amounts will overcount
   if reversals are present. The current parser flags negative-quantity rows for analyst review
   rather than ignoring them.

---

## 2. Utility Data — Electricity

### What I researched

UK electricity billing and data export formats, focusing on what a facilities manager actually
receives and can export. Key sources: National Grid ESO portal, EDF Business portal, OFGEM
guidance on metering data, and the Energy Networks Association's half-hourly data format specs.

Key findings:

- **Large commercial meters** (above 100kVA) are settled on half-hourly (HH) data — 48 readings
  per day per meter. This is the level at which Automatic Meter Reading (AMR) systems operate.
  Most portal exports let you select "monthly billing summary" (what I use) or "half-hourly
  interval data" (much more granular, much more data).
- **Billing period ≠ calendar month**: Commercial electricity contracts typically have a fixed
  billing cycle that was set when the contract started. It does not reset to calendar months.
  This is not a quirk — it is the standard.
- **Multiple meters per site**: A single building can have multiple MPANs (Meter Point
  Administration Numbers) — separate meters for different floors, different tenancies, or
  different tariff categories (peak vs. off-peak).
- **Units**: Consumption in kWh is standard. Some exports include kVArh (reactive energy) and
  kVA (demand). Peak demand in kW is a separate column.
- **Tariffs**: Commercial tariffs typically have at minimum a day rate and a night rate, plus
  a standing charge. The total bill amount is not useful for emissions purposes — only the
  consumed kWh is.

### What my sample data looks like and why

```
MPAN,Site Name,Period Start,Period End,Consumption (kWh),Peak Demand (kW),Tariff,Total Cost (GBP),VAT (GBP)
1012345678900,London HQ - Floor 3,2024-01-17,2024-02-15,47250,185.3,Business Day/Night,8905.00,1781.00
1012345678901,London HQ - Floor 4,2024-01-17,2024-02-15,31800,142.1,Business Day/Night,5998.50,1199.70
1098765432100,Leeds Warehouse,2024-01-22,2024-02-20,112400,420.8,Industrial,18644.00,3728.80
```

I used:
- **MPAN identifiers** — the real UK meter identifier format (13 digits, starting with 10 for
  most domestic/commercial supplies).
- **Non-calendar billing periods** — London HQ bills from the 17th to 15th of the following
  month. Leeds bills from the 22nd. This reflects real contracted billing cycles.
- **Multiple meters per client** — two meters at London HQ (different floors), one at Leeds.
  This is realistic for any company with more than one building.
- **kWh as the activity unit** — not cost, not kVA. The emissions calculation needs kWh.
- **Including cost columns** — they're in the export, but we don't use them for emissions.
  They're preserved in `RawRecord.raw_data` and ignored in `EmissionRecord`.

### What would break in a real deployment

1. **MPAN → facility mapping is manual**: MPANs are not self-describing. "1012345678900" means
   nothing without a lookup table mapping it to "London HQ - Floor 3." This mapping must be
   maintained by the facilities team and updated when meters change.

2. **Half-hourly data volume**: A client with 50 meters and 2 years of history has
   50 × 365 × 2 × 48 = 1,752,000 rows. The current ingestion pipeline processes rows
   synchronously. HH data would require async ingestion with progress tracking.

3. **Renewable energy certificates (REGOs)**: If the client buys REGOs or has a green tariff,
   the Scope 2 market-based emission factor may be zero or near-zero, but the location-based
   factor (based on the grid mix) is not. The GHG Protocol requires reporting both. The current
   model stores one `activity_value` per record — supporting dual accounting requires either
   two records per meter-period or additional columns.

4. **Multi-site voltage levels**: Some industrial sites take supply at high voltage (HV) rather
   than low voltage (LV). The distribution losses (and therefore the emission factor adjustment)
   differ. The current model doesn't capture supply voltage.

5. **Estimated reads**: Utility bills sometimes contain estimated consumption (when the meter
   couldn't be read). These are marked in the portal export with an "E" flag. Estimated reads
   should be flagged for analyst review when actuals arrive.

---

## 3. Corporate Travel — Flights, Hotels, Ground Transport

### What I researched

SAP Concur (dominant enterprise travel platform), Navan (formerly TripActions, common in
tech-sector mid-market), and GBTA (Global Business Travel Association) data standards.

Key findings from Concur documentation and DEFRA travel guidance:

- **Concur expense report exports** contain one row per expense line item. A trip involving a
  flight, hotel, and taxi produces three separate rows linked by a `Report ID` (the trip).
- **Flight data**: Concur stores origin and destination as airport codes (IATA 3-letter: LHR,
  JFK). Distance is not in the standard export — it must be calculated. Booking class (economy,
  business, first) is captured from the booking system if Concur Travel (not just Expense) is
  used. If only Expense is used, class is absent and must be inferred from ticket price.
- **Hotel data**: City and country are captured. The specific hotel is stored as merchant name.
  No coordinates, no distance. Hotel emissions are calculated per-room-night by city/country
  using accommodation emission factors.
- **Ground transport**: The most variable category. Rail and taxi may have a distance (if
  entered), a city pair (London–Manchester), or just a cost. Mode of transport is captured in
  the expense category (Air, Hotel, Car, Rail, Taxi/Rideshare).
- **DEFRA emission factors for aviation**: Factors are provided per passenger-km, broken down
  by cabin class (economy, premium economy, business, first) and haul (domestic, short-haul,
  long-haul). Radiative forcing index (RFI) is provided as a separate multiplier.
- **Airport coordinates**: OurAirports (ourairports.com) provides a freely available CSV of
  ~74,000 airports with IATA codes and lat/lon coordinates, under a public domain license.
  Suitable for great-circle distance calculation.

### What my sample data looks like and why

```
Report ID,Employee ID,Expense Type,Travel Date,Origin,Destination,Cabin Class,Distance (km),Merchant,City,Check-in,Check-out,Amount (GBP),Currency
RPT-2024-0891,EMP-1042,Air Travel,2024-01-08,LHR,JFK,Economy,,British Airways,,,1842.00,GBP
RPT-2024-0891,EMP-1042,Hotel,,,,,, Marriott Times Square,New York,2024-01-08,2024-01-11,1260.00,GBP
RPT-2024-0891,EMP-1042,Taxi/Rideshare,2024-01-08,,,,,Uber,New York,,, 45.00,GBP
RPT-2024-0914,EMP-0231,Rail,2024-01-15,MAN,EUS,,,Avanti West Coast,,,86.50,GBP
RPT-2024-0914,EMP-0231,Air Travel,2024-01-22,LHR,CDG,Economy,,Air France,,,312.00,GBP
```

I used:
- **Report IDs linking trip legs** — `RPT-2024-0891` groups the LHR-JFK flight, hotel, and
  taxi for one trip. This is how Concur structures expense reports.
- **Missing distance on flights** — real Concur exports don't include distance. Our ingestion
  pipeline calculates it from IATA codes using Haversine. The `Distance (km)` column is blank
  in the source.
- **Rail with station codes** — `MAN` (Manchester Piccadilly) and `EUS` (London Euston) are
  UK National Rail station codes, not IATA airport codes. The ingestion pipeline handles these
  differently from airport codes (UK rail has its own distance lookup via National Rail data).
- **Hotel with no distance** — hotel rows have city but no distance, because hotel emissions
  are per-room-night, not per-km.
- **Mixed currencies** — all GBP here, but a multi-national client would have USD, EUR, CHF.
  The currency column is preserved and normalized.
- **Intentional ambiguity in ground transport** — the taxi row has no distance. The emission
  factor is applied per cost using an average spend-per-km estimate (a recognized fallback
  per DEFRA guidance when distance is unknown).

### What would break in a real deployment

1. **IATA code coverage**: The OurAirports dataset covers ~74,000 airports. Obscure regional
   airports or private airstrips may not be in it. An unrecognized IATA code produces a flagged
   record. A production system would need a fallback (e.g., a paid aviation data API).

2. **Non-Concur platforms**: Navan, Egencia, CTM, and booking direct through airlines all
   produce different export formats. The column names, expense category labels, and data
   structures differ. Each platform would need its own parser.

3. **Personal vehicle mileage claims**: Some companies reimburse employees for business use
   of personal cars via mileage claims (pence per mile). These are Scope 3 Category 6 emissions
   but appear in expense systems as "Mileage" with a GBP amount, not a distance. Spend-based
   factors can be used but are less accurate than distance-based. The current model handles
   this via the fallback described above, but flags it for analyst review.

4. **Hotel emission factors by city**: DEFRA provides accommodation factors at country level.
   More granular city-level factors exist (e.g., from the Hotel Carbon Measurement Initiative,
   HCMI) but require a separate dataset. Current implementation uses country-level factors as
   a conservative approximation.

5. **Employee privacy**: Travel data contains individual employee journeys. In GDPR jurisdictions,
   this is personal data. A production system would need a data retention policy, anonymization
   for older records, and a legal basis for processing (legitimate interest under Article 6(1)(f)
   is the typical basis for corporate ESG reporting). The current prototype stores `Employee ID`
   but not employee names — a partial mitigation, not a complete solution.
