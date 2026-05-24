# DECISIONS.md — Ambiguity Log & Design Choices

Every non-obvious decision made during this build, why I made it, and what I would ask
the PM if I had the chance. Organized by area.

---

## 1. SAP — Format Choice

### Decision: FAGLL03 flat file export (tab-delimited text)

SAP exposes data through several mechanisms: IDocs (XML/EDI format for inter-system messaging),
OData services (REST-like, requires SAP Gateway activation), BAPIs (function modules called via
RFC), and flat file exports from transaction codes like FAGLL03 (G/L account line items) or
ME2M (purchase orders).

**I chose the FAGLL03 flat file** for the following reasons:

- It is the path of least resistance for a facilities or sustainability team. They don't need an
  RFC connection or Gateway license — they run the report in SAP GUI and hit "Export to local
  file." This is how most non-IT SAP users actually get data out.
- IDoc is designed for machine-to-machine EDI integration, not ad-hoc data extraction. A
  sustainability team is extremely unlikely to produce IDocs.
- OData requires SAP NetWeaver Gateway to be configured and exposed, which is an IT project,
  not something a PM would describe as "fuel and procurement data sitting in SAP."
- BAPI requires a live RFC connection from our servers to the client's SAP instance — a network
  and security conversation that takes weeks, not days.

**What I handled:** FAGLL03 exports covering G/L account line items for fuel-related cost centers
and procurement-related accounts. Specifically: posting date, document number, G/L account,
plant code, quantity, unit of measure, amount, currency, and text description.

**What I ignored:** MM60 (inventory movements), CO-PA profitability segments, asset accounting
(AA), and any IDoc or RFC-based integration. These are real SAP data sources but require either
different tooling or live system access.

**What I would ask the PM:**
- Which SAP modules does the client actually have active? (FI, MM, CO — not all clients have all.)
- Do they run SAP S/4HANA or legacy ECC? (S/4HANA has a different G/L structure — extension
  ledger, universal journal ACDOCA instead of BKPF/BSEG.)
- Is there an SAP Basis team we can involve, or is this self-service by the sustainability lead?
- What cost centers or G/L accounts correspond to fuel vs. procurement? (Without a lookup table
  we're guessing from text descriptions.)

---

## 2. SAP — Column Header Language

### Decision: Support both German and English headers via configurable mapping

SAP's default language depends on the system's language setting. A client running SAP in a
German-speaking region (Germany, Austria, Switzerland) or using a German system locale will see
column headers like `Buchungsdatum` (posting date), `Betrag in Hauswährung` (amount in local
currency), `Menge` (quantity), `Einheit` (unit).

Rather than hardcoding English headers and breaking on German exports, the `DataSource.config`
JSON field stores a column mapping:

```json
{
  "column_map": {
    "Buchungsdatum": "posting_date",
    "Belegdatum": "document_date",
    "Menge": "quantity",
    "Einheit": "unit",
    "Betrag in Hauswährung": "amount_local",
    "Buchungskreis": "company_code",
    "Werk": "plant_code"
  },
  "date_format": "%d.%m.%Y",
  "decimal_separator": ","
}
```

The ingestion parser reads this mapping before processing any rows. A client with English headers
gets a different mapping in their `DataSource.config`. This avoids hardcoding and makes the
system configurable without code changes.

**What I would ask the PM:**
- Can we get a sample export before onboarding? Even five rows would let us confirm the column
  structure before writing the mapping.

---

## 3. SAP — Plant Code Resolution

### Decision: Store plant codes as-is; resolve via a lookup table in DataSource.config

SAP plant codes are 4-character identifiers (`DE01`, `UK03`, `IN02`) that mean nothing without
a lookup table. The client's SAP admin has this mapping. We store it in `DataSource.config`:

```json
{
  "plant_lookup": {
    "DE01": {"name": "Berlin Manufacturing", "country": "DEU"},
    "UK03": {"name": "Leeds Warehouse", "country": "GBR"}
  }
}
```

At normalization time, the plant code is resolved to a human-readable facility name and ISO
country code, stored in `EmissionRecord.facility` and `EmissionRecord.country_code`.
Unresolvable plant codes produce a flagged record, not a failed one — the activity data is still
captured, it just needs analyst review.

---

## 4. Utility Data — Ingestion Mode

### Decision: CSV export from utility portal

Utility data reaches facilities teams in three common ways:
1. PDF bills (scanned or digital)
2. Portal CSV exports (most large utilities offer this: National Grid, EDF, E.ON, etc.)
3. Utility API (Green Button in the US, half-hourly smart meter data in the UK)

**I chose portal CSV** because:
- PDF parsing is fragile and layout-dependent. A tariff restructure changes the PDF layout and
  breaks the parser. Not appropriate for a prototype that needs to demonstrate reliability.
- Utility APIs (Green Button, smart meter AMI APIs) require OAuth setup with each utility
  individually. In the UK, the DCC (Data Communications Company) smart meter network has its own
  access process. This is a months-long integration, not a 4-day prototype.
- CSV exports are what a facilities team actually does today. They log into the portal, select
  a date range, click export. This is the realistic shape of the data.

**What I handled:** Monthly billing period CSVs with columns for meter ID, billing period start,
billing period end, consumption (kWh), peak demand (kW), tariff name, and total cost.

**What I ignored:** Half-hourly interval data (AMI/smart meter feeds), reactive power charges,
distribution use of system (DUoS) charges, and PDF bill parsing.

**What I would ask the PM:**
- Which utility providers does the client use? (Portal formats differ — National Grid's export
  looks different from EDF's.)
- Do they have multiple meters across sites? (Meter ID → facility mapping will be needed.)
- Is their electricity 100% grid, or do they have on-site solar/generation? (Self-generated
  electricity has a different Scope 2 treatment — potentially Scope 1 if combustion is involved.)

---

## 5. Utility Data — Billing Period Alignment

### Decision: Store period_start and period_end, never aggregate to calendar month at ingest

Utility billing periods almost never align with calendar months. A typical bill might cover
March 17 to April 19. If we store only a single "billing month," we lose the ability to:
- Correctly prorate consumption across reporting periods
- Identify overlapping or gap periods (missed bills)
- Reconcile against meter readings at period boundaries

The `EmissionRecord` stores `period_start` and `period_end` as DateFields. Aggregation to
calendar months or reporting years happens at query time, using date range intersection logic.
This is more complex at query time but correct. Forcing alignment at ingest time is simpler
but wrong.

---

## 6. Corporate Travel — Platform and API

### Decision: Concur Travel (SAP Concur) expense/trip report export via CSV

Concur is the dominant corporate travel platform for enterprise clients (Navan/TripActions is
growing but more common in mid-market). Concur exposes data via:
1. Expense Report exports (CSV from the Concur UI)
2. Concur Expense API v4 (OAuth2, REST/JSON)
3. Concur Extract files (batch flat files delivered to SFTP)

**I chose CSV export** (equivalent to Concur's "Expense Report List" export) because:
- The API requires OAuth2 app registration with Concur's developer program, which involves
  client approval and takes time beyond a prototype timeline.
- SFTP extract setup requires IT coordination on both sides.
- A sustainability team member with Concur admin access can export a date-range CSV today.

**What I handled:** Flight segments (origin airport code, destination airport code, booking class,
travel date), hotel stays (city, check-in, check-out, nightly rate), and ground transport
(distance or city pair, transport type: taxi/rail/rental car).

**What I ignored:** Meal expenses, conference registrations, per-diem, and any non-travel
expense categories. Also ignored: approval workflow data, policy violation flags, and
reimbursement status — not relevant to emissions.

---

## 7. Corporate Travel — Distance Calculation

### Decision: Derive flight distance from IATA airport codes using great-circle calculation

Concur export often gives airport codes (LHR, JFK) rather than distances. To get activity
data in km (required for emission factor application), we calculate great-circle distance
from airport coordinates using the Haversine formula.

Airport coordinate data is bundled as a static JSON lookup (sourced from OurAirports public
dataset, ~8,000 airports). This avoids a runtime API dependency.

For radiative forcing: long-haul flights have a climate impact beyond CO₂ alone (NOₓ, contrails).
The RFI (Radiative Forcing Index) multiplier is commonly applied to flight distances for Scope 3
Category 6 reporting. We store raw km and note in `EmissionRecord`'s metadata whether RFI
was applied, so analysts can see this is a choice, not a hidden assumption.

**What I would ask the PM:**
- Does the client want RFI applied? (It's debated — DEFRA guidance includes it, some frameworks
  don't. This should be a client-level configuration, not a hardcoded assumption.)
- Does their travel policy distinguish business vs. economy class? (Emission factors differ by
  cabin class — business class has a higher per-passenger factor due to seat footprint.)

---

## 8. Review Workflow — Approval Semantics

### Decision: APPROVED ≠ LOCKED. Locking is a separate, explicit action.

An analyst approving a record means "I have reviewed this and it looks correct." Locking means
"this is now submitted to auditors and cannot be changed." These are two different states with
different consequences.

Conflating them (approve = lock) would mean an analyst can't approve records incrementally
as they come in without triggering audit lock prematurely. In practice, a sustainability team
reviews records throughout the year and submits to auditors at year-end or at a specific
reporting deadline.

The lock action is a separate button, requires an explicit confirmation, and produces an
`AuditEvent` of type `RECORD_LOCKED`. Locked records render as read-only in the UI with a
lock icon and the name/timestamp of who locked them.

---

## 9. Anomaly / Suspicious Record Detection

### Decision: Flag records that deviate >3 standard deviations from the rolling 90-day mean
for that organization, category, and facility combination.

"What looks suspicious" is called out in the brief. Rather than leaving this entirely to
analyst judgment, the ingestion pipeline runs a simple statistical check on each new
`EmissionRecord`:

- Compute mean and std dev of `activity_value` for records with the same `organization`,
  `category`, and `facility` in the past 90 days.
- If the new record is more than 3σ from the mean, set `status = FLAGGED` and populate
  `flag_reason` with a human-readable explanation: "Value (45,000 kWh) is 4.2σ above the
  90-day mean (8,200 kWh) for this meter. Verify against bill."

**What I would ask the PM:**
- What threshold should trigger a flag? (3σ is a reasonable default but sustainability data
  can have legitimate spikes — seasonal heating loads, a site expansion.)
- Should flags block approval, or just be advisory? (Currently advisory — analysts can approve
  a flagged record if they add a note explaining why.)

---

## 10. Authentication

### Decision: Django's built-in auth with token-based API authentication (DRF TokenAuth)

This is a prototype. A production system would use SSO (SAML/OIDC via the client's identity
provider — Azure AD, Okta, Google Workspace). For now, username/password with DRF
`TokenAuthentication` is sufficient to demonstrate multi-user, organization-scoped access
without adding an OAuth2 provider dependency.

Passwords are hashed with Django's default PBKDF2-SHA256. Tokens are per-user and
per-session. No refresh token logic — tokens are valid until explicitly deleted.

**What I would ask the PM:**
- Does the client require SSO? (Enterprise clients almost always do — employees won't want
  another username/password.)
- Who provisions analyst accounts? (A self-service invite flow vs. admin-only provisioning
  has UX implications.)

---

## Summary of Questions for the PM

| # | Question | Why It Matters |
|---|----------|----------------|
| 1 | Which SAP modules are active (FI, MM, CO)? | Determines which export transactions are available |
| 2 | SAP ECC or S/4HANA? | Different G/L table structure |
| 3 | Can we get a sample export before onboarding? | Column mapping needs real data to validate |
| 4 | Which G/L accounts map to fuel vs. procurement? | Without this, category assignment is guesswork |
| 5 | Which utility providers does the client use? | Portal CSV formats vary by provider |
| 6 | Do they have on-site generation (solar, CHP)? | Changes Scope 2 treatment |
| 7 | Is RFI multiplier required for flight emissions? | Client-level policy choice, not a default |
| 8 | Does the client require SSO for authentication? | Blocks enterprise deployment otherwise |
| 9 | What's the reporting deadline / audit lock date? | Determines when lock workflow needs to trigger |
| 10 | Who is the primary analyst — sustainability lead or finance? | Shapes UI decisions, level of explanation needed |
