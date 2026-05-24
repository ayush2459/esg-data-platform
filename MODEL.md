# MODEL.md — Data Model & Design Rationale

## Overview

The data model is organized around a core principle: **raw data is never mutated**. Every record
that enters the system from any source is preserved exactly as received. Normalization, unit
conversion, and Scope classification happen in a separate layer. Analysts review normalized records
and approve them. Once approved, records are locked and cannot be changed without an explicit
audit event being recorded.

---

## Entity Map

```
Organization
    └── DataSource (SAP / Utility / Travel)
            └── IngestionRun
                    └── RawRecord
                            └── EmissionRecord  ←── AuditEvent
                                    └── ReviewDecision
```

---

## Models

### 1. `Organization`
Represents a client company. All data is scoped to an organization. No cross-tenant data leakage
is possible because every query filters by `organization`.

```python
class Organization(models.Model):
    id          = UUIDField(primary_key=True, default=uuid4)
    name        = CharField(max_length=255)
    slug        = SlugField(unique=True)          # used in URLs, never PK
    created_at  = DateTimeField(auto_now_add=True)
    timezone    = CharField(max_length=64, default="UTC")
    # reporting_year boundaries can vary per org (fiscal vs calendar)
    fiscal_year_start_month = PositiveSmallIntegerField(default=1)
```

**Why UUID PK?** Sequential integer PKs leak record counts across tenants and are a common IDOR
vector. UUIDs cost nothing at this scale.

**Why `slug`?** URLs should be readable (`/org/acme-corp/records`) but slugs must not be PKs
because they can change (company rename). The UUID is the true identity.

---

### 2. `DataSource`
A configured source belonging to an organization. One organization may have multiple SAP exports
(e.g., one per plant region), multiple utility providers, and one travel platform.

```python
class DataSource(models.Model):
    SOURCE_TYPES = [
        ("SAP_FLAT_FILE", "SAP Flat File (FAGLL03 export)"),
        ("UTILITY_CSV",   "Utility Portal CSV"),
        ("TRAVEL_API",    "Corporate Travel Platform (Concur/Navan)"),
    ]

    id           = UUIDField(primary_key=True, default=uuid4)
    organization = ForeignKey(Organization, on_delete=PROTECT)
    source_type  = CharField(max_length=32, choices=SOURCE_TYPES)
    name         = CharField(max_length=255)   # "UK Electricity - National Grid Portal"
    config       = JSONField(default=dict)      # source-specific config (column mappings, etc.)
    created_at   = DateTimeField(auto_now_add=True)
    is_active    = BooleanField(default=True)
```

**Why `config` as JSON?** Each source type has radically different configuration needs. SAP needs
column name mappings (German headers → internal field names), plant-code lookup tables, and date
format strings. Utility needs meter ID mappings and unit hints. Travel needs category mappings.
Putting this in JSON avoids a combinatorial explosion of nullable columns while keeping
configuration inspectable and editable without schema changes.

---

### 3. `IngestionRun`
A single execution of ingestion — one file upload, one API pull, one paste. This is the
source-of-truth anchor for a batch of records.

```python
class IngestionRun(models.Model):
    STATUS = [
        ("PENDING",    "Pending"),
        ("PROCESSING", "Processing"),
        ("DONE",       "Done"),
        ("FAILED",     "Failed"),
    ]

    id          = UUIDField(primary_key=True, default=uuid4)
    data_source = ForeignKey(DataSource, on_delete=PROTECT)
    started_at  = DateTimeField(auto_now_add=True)
    finished_at = DateTimeField(null=True, blank=True)
    status      = CharField(max_length=16, choices=STATUS, default="PENDING")
    triggered_by = ForeignKey(settings.AUTH_USER_MODEL, on_delete=PROTECT, null=True)
    raw_file    = FileField(upload_to="raw_uploads/", null=True, blank=True)
    row_count   = IntegerField(default=0)
    error_count = IntegerField(default=0)
    notes       = TextField(blank=True)
```

**Why keep the raw file?** If a normalization bug is discovered later, the original file can be
re-processed. This is essential for audit defensibility. "We had the data, we just processed it
wrong and then fixed it" is a very different position than "we don't have the original."

---

### 4. `RawRecord`
The original row, stored verbatim. Never updated after creation.

```python
class RawRecord(models.Model):
    id             = UUIDField(primary_key=True, default=uuid4)
    ingestion_run  = ForeignKey(IngestionRun, on_delete=PROTECT)
    source_row_ref = CharField(max_length=255, blank=True)
    # ^ e.g. "row 42", "document_number 4900001234", "trip_id ABC123"
    raw_data       = JSONField()
    # ^ the entire original row, keys and values exactly as received
    ingested_at    = DateTimeField(auto_now_add=True)
    parse_error    = TextField(blank=True)
    # ^ if we couldn't even parse this row, record why here

    class Meta:
        indexes = [
            models.Index(fields=["ingestion_run"]),
        ]
```

**Why store the raw row as JSON?** Column names, units, and structures vary per source and even
per export configuration. Forcing them into typed columns at ingest time loses information and
creates schema migration hell. The raw store is a log, not a queryable table — it exists for
traceability, not for SELECT queries.

---

### 5. `EmissionRecord`
The normalized, queryable record. One `RawRecord` produces zero or one `EmissionRecord`.
Zero if parsing failed. Occasionally one raw record maps to multiple emission records (e.g., a
combined fuel+procurement line), handled by a nullable `split_index` field.

```python
class EmissionRecord(models.Model):
    SCOPE_CHOICES = [
        (1, "Scope 1 — Direct emissions"),
        (2, "Scope 2 — Purchased electricity/heat"),
        (3, "Scope 3 — Value chain"),
    ]

    STATUS_CHOICES = [
        ("PENDING",   "Pending Review"),
        ("APPROVED",  "Approved"),
        ("REJECTED",  "Rejected"),
        ("FLAGGED",   "Flagged for Investigation"),
        ("LOCKED",    "Locked for Audit"),
    ]

    CATEGORY_CHOICES = [
        # Scope 1
        ("FUEL_STATIONARY",  "Fuel — Stationary Combustion"),
        ("FUEL_MOBILE",      "Fuel — Mobile Combustion"),
        # Scope 2
        ("ELECTRICITY",      "Purchased Electricity"),
        ("HEAT_STEAM",       "Purchased Heat/Steam"),
        # Scope 3
        ("BUSINESS_TRAVEL",  "Business Travel"),
        ("PROCUREMENT",      "Purchased Goods & Services"),
        ("FREIGHT",          "Upstream Transportation"),
    ]

    id             = UUIDField(primary_key=True, default=uuid4)
    organization   = ForeignKey(Organization, on_delete=PROTECT)
    raw_record     = ForeignKey(RawRecord, on_delete=PROTECT, null=True)
    split_index    = PositiveSmallIntegerField(null=True, blank=True)

    # --- Classification ---
    scope          = PositiveSmallIntegerField(choices=SCOPE_CHOICES)
    category       = CharField(max_length=32, choices=CATEGORY_CHOICES)

    # --- Activity Data (normalized) ---
    activity_value  = DecimalField(max_digits=18, decimal_places=6)
    activity_unit   = CharField(max_length=32)
    # ^ always normalized: kWh, liters, kg, km — never original unit
    original_value  = DecimalField(max_digits=18, decimal_places=6)
    original_unit   = CharField(max_length=32)
    # ^ preserved from source for audit trail

    # --- Time ---
    period_start   = DateField()
    period_end     = DateField()

    # --- Source metadata ---
    facility        = CharField(max_length=255, blank=True)
    # ^ plant code (SAP), meter ID (utility), cost center (travel)
    country_code    = CharField(max_length=3, blank=True)  # ISO 3166-1 alpha-3
    currency        = CharField(max_length=3, blank=True)  # ISO 4217
    supplier        = CharField(max_length=255, blank=True)

    # --- Review state ---
    status          = CharField(max_length=16, choices=STATUS_CHOICES, default="PENDING")
    flag_reason     = TextField(blank=True)
    # ^ auto-populated by anomaly detection (e.g. "value 400% above 90-day mean")

    # --- Edit tracking ---
    is_manually_edited  = BooleanField(default=False)
    edited_by           = ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                                     on_delete=SET_NULL, related_name="edited_records")
    edited_at           = DateTimeField(null=True, blank=True)
    edit_note           = TextField(blank=True)

    created_at     = DateTimeField(auto_now_add=True)
    updated_at     = DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["organization", "status"]),
            models.Index(fields=["organization", "scope", "period_start"]),
            models.Index(fields=["organization", "category"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["raw_record", "split_index"],
                name="unique_emission_per_raw_split"
            )
        ]
```

**Why separate `activity_value`/`activity_unit` from `original_value`/`original_unit`?**
The normalized value is what gets summed for carbon calculations. The original value is what
an auditor can trace back to the source document. Conflating them is a common mistake that
makes re-auditing painful.

**Why `period_start`/`period_end` instead of a single date?**
Billing periods don't align with calendar months. A utility bill might cover 17 March to 19 April.
A single date field loses this and forces arbitrary choices ("use billing date? end of period?").
Two date fields represent reality.

**Why DecimalField and not FloatField?**
Carbon accounting requires exact arithmetic. Float rounding errors accumulate across thousands of
records and produce figures that don't reconcile. Decimal is mandatory here.

---

### 6. `ReviewDecision`
Immutable log of every analyst action on a record. The current `status` on `EmissionRecord` is
always derivable from the latest `ReviewDecision`, but the full history is preserved.

```python
class ReviewDecision(models.Model):
    ACTION_CHOICES = [
        ("APPROVE",  "Approved"),
        ("REJECT",   "Rejected"),
        ("FLAG",     "Flagged"),
        ("UNFLAG",   "Unflagged"),
        ("LOCK",     "Locked for Audit"),
        ("COMMENT",  "Comment Added"),
    ]

    id              = UUIDField(primary_key=True, default=uuid4)
    emission_record = ForeignKey(EmissionRecord, on_delete=PROTECT,
                                  related_name="review_decisions")
    analyst         = ForeignKey(settings.AUTH_USER_MODEL, on_delete=PROTECT)
    action          = CharField(max_length=16, choices=ACTION_CHOICES)
    note            = TextField(blank=True)
    decided_at      = DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-decided_at"]
```

**Why a separate table instead of just a status field?**
A status field answers "what is the state now." The review table answers "who touched this, when,
and why" — which is what auditors actually ask. The GHG Protocol requires demonstrable chain of
custody for reported figures. A single status field cannot provide that.

---

### 7. `AuditEvent`
System-level immutable log. Captures both user actions and system events (ingestion runs,
automated flag triggers). Written only, never updated or deleted.

```python
class AuditEvent(models.Model):
    EVENT_TYPES = [
        ("RECORD_CREATED",   "Record Created"),
        ("RECORD_EDITED",    "Record Edited"),
        ("RECORD_APPROVED",  "Record Approved"),
        ("RECORD_LOCKED",    "Record Locked"),
        ("INGESTION_STARTED","Ingestion Started"),
        ("INGESTION_DONE",   "Ingestion Completed"),
        ("FLAG_AUTO",        "Automatic Flag Raised"),
    ]

    id              = UUIDField(primary_key=True, default=uuid4)
    organization    = ForeignKey(Organization, on_delete=PROTECT)
    event_type      = CharField(max_length=32, choices=EVENT_TYPES)
    actor           = ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=SET_NULL)
    target_id       = UUIDField(null=True, blank=True)
    # ^ UUID of whatever entity this event is about (EmissionRecord, IngestionRun, etc.)
    target_type     = CharField(max_length=64, blank=True)
    # ^ "EmissionRecord", "IngestionRun" etc. — poor-man's GenericForeignKey without the magic
    payload         = JSONField(default=dict)
    # ^ before/after snapshot for edits, error details for failures, etc.
    created_at      = DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["organization", "created_at"]),
            models.Index(fields=["target_id"]),
        ]
```

**Why not use Django's built-in `LogEntry`?**
Django's admin `LogEntry` is tied to the admin interface and doesn't capture system events
(automated flags, ingestion runs). A custom table gives full control and is source-agnostic.

**Why not a proper GenericForeignKey?**
Django's `GenericForeignKey` adds ORM complexity and makes queries across content types awkward.
Storing `target_id` (UUID) and `target_type` (string) achieves the same result with a simple
`filter(target_id=some_uuid)` lookup and no extra framework magic.

---

## Multi-Tenancy Design

Every data-bearing model has a direct or indirect `ForeignKey` to `Organization`. The Django
queryset layer enforces this:

```python
# base manager used in all views
class OrgScopedManager(models.Manager):
    def for_org(self, org):
        return self.get_queryset().filter(organization=org)
```

API views extract `organization` from the authenticated user's profile and inject it into every
queryset. There is no URL parameter that selects the org — the org is derived from the
authenticated session, preventing horizontal privilege escalation.

---

## Scope 1/2/3 Assignment Logic

Scope is not a free-text field entered by analysts — it is derived from `category` at
normalization time. The mapping is fixed:

| Category             | Scope |
|----------------------|-------|
| FUEL_STATIONARY      | 1     |
| FUEL_MOBILE          | 1     |
| ELECTRICITY          | 2     |
| HEAT_STEAM           | 2     |
| BUSINESS_TRAVEL      | 3     |
| PROCUREMENT          | 3     |
| FREIGHT              | 3     |

This ensures Scope classification is consistent and auditable, not dependent on human input.

---

## Unit Normalization

All `activity_value` fields are normalized on ingest to a canonical unit per category:

| Category        | Canonical Unit | Reason                                      |
|-----------------|---------------|---------------------------------------------|
| FUEL_*          | liters        | Most fuel emission factors are per-liter    |
| ELECTRICITY     | kWh           | Universal for electricity billing           |
| BUSINESS_TRAVEL | km            | ICAO/IATA emission factors are per-km       |
| PROCUREMENT     | GBP (or USD)  | Spend-based factors; currency normalized    |

Conversion logic lives in a single `normalizers/` module, not scattered through ingestion code.
Every conversion records what formula was applied in `AuditEvent.payload`.

---

## What This Model Does Not Include

- **Emission factors**: Not stored here. Factors (kgCO₂e per unit) are versioned separately and
  applied at reporting time, not at ingest time. This allows factor updates without re-ingesting
  data.
- **Computed tCO₂e totals**: Not stored as a column. Totals are computed at query time from
  activity values × current factors. Storing them creates a cache-invalidation problem as factors
  are updated.
- **User roles beyond organization membership**: Access control is out of scope for this
  prototype. All users within an org are treated as analysts.

These omissions are deliberate — see TRADEOFFS.md.
