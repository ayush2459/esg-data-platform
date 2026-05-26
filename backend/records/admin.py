from django.contrib import admin
from .models import Organization, UserProfile, DataSource, IngestionRun, RawRecord, EmissionRecord, ReviewDecision, AuditEvent
admin.site.register(Organization)
admin.site.register(UserProfile)
admin.site.register(DataSource)
admin.site.register(EmissionRecord)
admin.site.register(ReviewDecision)
admin.site.register(AuditEvent)
