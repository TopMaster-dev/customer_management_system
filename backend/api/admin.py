from django.contrib import admin

from .models import (
    AdvanceRequest,
    CmsUser,
    Customer,
    CustomerDetail,
    CustomerPreference,
    CustomerProfile,
    DailyReport,
    DailySummary,
    HostSalarySetting,
    PersonalLedgerEntry,
    PerformanceTarget,
    StaffMember,
    Store,
    StoreTarget,
    VisitRecord,
)

admin.site.register(AdvanceRequest)
admin.site.register(CmsUser)
admin.site.register(Customer)
admin.site.register(CustomerDetail)
admin.site.register(CustomerPreference)
admin.site.register(CustomerProfile)
admin.site.register(DailyReport)
admin.site.register(DailySummary)
admin.site.register(HostSalarySetting)
admin.site.register(PersonalLedgerEntry)
admin.site.register(PerformanceTarget)
admin.site.register(StaffMember)
admin.site.register(Store)
admin.site.register(StoreTarget)
admin.site.register(VisitRecord)
