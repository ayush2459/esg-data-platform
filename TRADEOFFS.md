# TRADEOFFS.md — Deliberate Non-Builds

Three things I chose not to build, why, and what it would take to add them.

---

## 1. Emission Factor Storage and tCO₂e Calculation

### What I did not build
The system stores activity data (kWh consumed, liters of fuel, km flown) but does not store
emission factors, does not compute tCO₂e figures, and does not display carbon totals in the UI.

### Why

**Emission factors are a versioned, contested dataset — not a constant.**

The UK DEFRA conversion factors are updated annually (usually April). The IPCC AR5 vs AR6
GWP values for methane differ. Market-based Scope 2 factors depend on the client's energy
contract, not just the grid. If we bake factors into the ingestion pipeline and store computed
tCO₂e values:

- Every factor update requires re-computing and overwriting stored figures.
- The stored figure at time of audit may differ from the figure at time of approval, with no
  clear record of which factor version produced which number.
- Clients operating across jurisdictions (UK DEFRA, US EPA, EU EEA) need different factors
  applied to different records — this becomes a routing problem on top of a data problem.

The clean architecture is: store activity data permanently, store factors in a versioned
factor table, compute tCO₂e at reporting time by joining activity data with the factor version
valid for that reporting period. This is how production ESG platforms (Persefoni, Greenly,
Watershed) actually work.

### What it would take to add
A `EmissionFactor` model with `category`, `unit`, `kgco2e_per_unit`, `source` (DEFRA/EPA/IPCC),
`valid_from`, `valid_to`. A reporting endpoint that joins `EmissionRecord` → `EmissionFactor`
on category and date range and sums. Approximately 2 days of additional work with tests.

---

## 2. Role-Based Access Control (RBAC)

### What I did not build
All authenticated users within an organization have the same permissions. There is no distinction
between an analyst who can flag and approve records and an admin who can lock records for audit,
configure data sources, or manage users.

### Why

**The brief asks for an analyst review dashboard, not an access control system.**

RBAC adds significant complexity: a roles table, a permissions table, middleware on every view,
UI that conditionally renders controls based on role, and test coverage for each role-permission
combination. Done properly, it takes 2–3 days. Done hastily, it becomes a false sense of
security — permission checks that only exist in the UI but not in the API layer, or a role
hierarchy that doesn't match how the client actually operates.

More importantly, I don't know enough about the client to design the right role hierarchy.
Does the sustainability lead approve records or does a finance director? Can any analyst lock
for audit or only a "reporting manager"? These are organizational design questions, not
engineering questions. Getting them wrong and building them in creates a worse system than
starting without RBAC and adding it once we understand the workflow.

The current system is safe: all access is org-scoped (a user cannot see another org's data),
all actions are logged in `AuditEvent` with the actor's user ID, and the lock workflow requires
an explicit confirmation. This is sufficient for a prototype used by a small, trusted team.

### What it would take to add
Django's built-in `Permission` and `Group` system covers most of the model-layer needs.
The main work is: defining the role hierarchy with the PM, adding `@permission_required`
decorators to API views, and updating the React UI to conditionally render actions based on
the current user's roles. Approximately 1.5–2 days once the role hierarchy is defined.

---

## 3. Live API Ingestion (SAP OData, Concur API, Green Button)

### What I did not build
All three ingestion modes are file-upload based (CSV/flat file). I did not build live API
connectors that pull data directly from SAP's OData service, the Concur v4 API, or utility
smart meter APIs.

### Why

**Live API integration is an infrastructure and security project, not a data modelling project.**

Each live integration requires:

- **SAP OData**: SAP NetWeaver Gateway must be configured and exposed by the client's IT team.
  RFC connections require firewall rules and network peering. Credentials are privileged — SAP
  basis teams treat them seriously. Timeline: weeks to months.

- **Concur API**: Requires registration with SAP Concur's developer program, OAuth2 app
  approval, and a partner agreement for production access. Concur's API rate limits (currently
  ~10 req/min per endpoint) make bulk historical ingestion slow and complex. Timeline: weeks,
  plus ongoing rate limit management.

- **Utility APIs (Green Button / DCC)**: In the US, Green Button Connect My Data requires
  utility-by-utility integration agreements. In the UK, DCC access requires joining the DCC
  enrollment process. Each utility has different OAuth flows and data schemas. Timeline:
  months per utility.

The file-upload approach is not a shortcut — it is the realistic present-day workflow for the
vast majority of enterprise clients. The sustainability lead exports a CSV; they upload it here.
Adding live APIs does not change the data model, the normalization logic, the review workflow,
or the audit trail. It changes only the ingestion trigger from "user uploads file" to
"scheduler pulls from API." The core system is designed to accommodate both — `IngestionRun`
has a `triggered_by` field that can be null for system-triggered runs.

### What it would take to add
A Celery task per data source type. For Concur: OAuth2 token storage (encrypted), a scheduled
task that calls `/api/v4/expense/reports`, maps the JSON response to the same normalization
pipeline the CSV parser uses. The normalization and review logic would not change at all.
Approximately 2–3 days per integration once API credentials and access are arranged.

---

## Honourable Mentions (things I also did not build, briefly)

**Automated re-ingestion on source update**: If a client re-exports their SAP data with
corrections, the system has no automatic deduplication. An analyst would need to manually
reject the old records. A production system would use document numbers or transaction IDs
as natural deduplication keys — the data model supports this via `RawRecord.source_row_ref`,
but the logic to act on duplicates is not implemented.

**Email notifications**: No emails are sent when records are flagged, when a batch completes,
or when records are ready for review. This is a Django signals + email backend problem, not
complex, but out of scope for a prototype.

**Reporting export (PDF/Excel)**: Analysts can review records in the UI but cannot export a
summary report for auditors. A production system would generate a signed PDF of approved
records grouped by scope and category. Not built; the data model fully supports it.
