from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

# Prefer importing API views from accounts.views_api (lighter deps, intended for API endpoints).
# Ensure accounts/views_api.py exists and exports: csrf_view, whoami,
# AdminUsersListView, AdminUserDeleteView, AdminUserUpdateView, AdminUsersBulkDeleteView, EmployeeDashboardView (optional).
try:
    from accounts.views_api import (
        csrf_view,
        whoami,
        AdminUsersListView,
        AdminUserDeleteView,
        AdminUserUpdateView,
        AdminUsersBulkDeleteView,
        EmployeeDashboardView,
        EmployeeSelfProfileView,
    )
except Exception:
    # Fallback to importing from accounts.views if you placed views there.
    from accounts.views import (
        csrf_view,
        whoami,
        AdminUsersListView,
        AdminUserDeleteView,
        AdminUserUpdateView,
        AdminUsersBulkDeleteView,
        EmployeeDashboardView,
    )  # noqa: E402

def health_check(request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path("", health_check, name="health"),
    path("admin/", admin.site.urls),

    # Auth endpoints (register/login etc.)
    path("api/auth/", include("accounts.urls", namespace="accounts")),

    # Small API helpers used by the frontend
    path("api/auth/csrf/", csrf_view, name="csrf"),
    path("api/auth/whoami/", whoami, name="whoami"),

    # Admin user management endpoints
    path("api/admin/users/", AdminUsersListView.as_view(), name="api_admin_users"),
    path("api/admin/users/<int:pk>/", AdminUserUpdateView, name="api_admin_user_update"),  # function-based
    path("api/admin/users/<int:pk>/delete/", AdminUserDeleteView.as_view(), name="api_admin_user_delete"),
    path("api/admin/users/bulk-delete/", AdminUsersBulkDeleteView, name="api_admin_users_bulk_delete"),  # function-based

    # Employee self-service profile management
    path("api/employee/profile/", EmployeeSelfProfileView.as_view(), name="api_employee_profile"),

    # Optional: employee dashboard placeholder
    path("api/dashboard/employee/", EmployeeDashboardView.as_view(), name="api_dashboard_employee"),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)