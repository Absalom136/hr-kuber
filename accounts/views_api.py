# accounts/views_api.py
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view

from .models import User
from .serializers import UserSerializer

@ensure_csrf_cookie
def csrf_view(request):
    """
    Ensures csrftoken cookie is set on the client.
    Frontend should call GET /api/auth/csrf/ with credentials: 'include'
    """
    return JsonResponse({"detail": "CSRF cookie set"})


@api_view(['GET'])
def whoami(request):
    """
    Lightweight endpoint to confirm session-based authentication.
    Frontend calls GET /api/auth/whoami/ with credentials: 'include' after login.
    """
    user = request.user
    if user and user.is_authenticated:
        return Response({
            "username": user.username,
            "email": getattr(user, "email", ""),
            "role": getattr(user, "role", None),
            "avatar": getattr(user, "avatar_url", "") or getattr(user, "avatar", "") or "",
        }, status=status.HTTP_200_OK)
    return Response({"username": None}, status=status.HTTP_200_OK)


class PermissionHelpers:
    @staticmethod
    def is_admin_user(user):
        if not user or not user.is_authenticated:
            return False
        role = getattr(user, "role", "") or ""
        return user.is_superuser or (isinstance(role, str) and role.lower() == "admin")


class AdminUsersListView(APIView):
    """
    GET: list users for admin UI.
    Permission: authenticated + admin-role check inside view.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if not PermissionHelpers.is_admin_user(request.user):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        qs = User.objects.filter(role__in=["Admin", "Employee"]).order_by("-date_joined")
        serializer = UserSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminUserDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, *args, **kwargs):
        if not PermissionHelpers.is_admin_user(request.user):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        user = get_object_or_404(User, pk=pk)
        if user.pk == request.user.pk:
            return Response({"detail": "Cannot delete yourself"}, status=status.HTTP_400_BAD_REQUEST)

        user.delete()
        return Response({"detail": "Deleted"}, status=status.HTTP_204_NO_CONTENT)


class EmployeeDashboardView(APIView):
    """
    Minimal placeholder for /api/dashboard/employee/ to avoid 404s.
    Replace with real logic as needed.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        payload = {
            "greeting": f"Hello {request.user.get_full_name() or request.user.username}",
            "stats": {"notifications": 0, "tasks": 0},
        }
        return Response(payload, status=status.HTTP_200_OK)