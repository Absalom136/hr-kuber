from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Q

from .models import User
from .serializers import UserSerializer, AdminUserUpdateSerializer, EmployeeSelfProfileSerializer


@ensure_csrf_cookie
def csrf_view(request):
    """Ensures csrftoken cookie is set on the client."""
    return JsonResponse({"detail": "CSRF cookie set"})


@api_view(['GET'])
def whoami(request):
    """Lightweight endpoint to confirm session-based authentication."""
    user = request.user
    if user and user.is_authenticated:
        return Response(
            {
                "username": user.username,
                "email": getattr(user, "email", ""),
                "role": getattr(user, "role", None),
                "avatar": getattr(user, "avatar_url", "") or getattr(user, "avatar", "") or "",
            },
            status=status.HTTP_200_OK,
        )
    return Response({"username": None}, status=status.HTTP_200_OK)


class PermissionHelpers:
    @staticmethod
    def is_admin_user(user):
        if not user or not user.is_authenticated:
            return False
        role = getattr(user, "role", "") or ""
        return user.is_superuser or (isinstance(role, str) and role.lower() == "admin")

    @staticmethod
    def is_employee_user(user):
        if not user or not user.is_authenticated:
            return False
        role = getattr(user, "role", "") or ""
        if isinstance(role, str) and role.lower() == "employee":
            return True
        return PermissionHelpers.is_admin_user(user)


class AdminUsersListView(APIView):
    """GET: list users for admin UI."""
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if not PermissionHelpers.is_admin_user(request.user):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        qs = (
            User.objects.filter(role__in=["Admin", "Employee"])
            .select_related("profile", "profile__department")
            .order_by("-date_joined")
        )
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


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def AdminUserUpdateView(request, pk):
    if not PermissionHelpers.is_admin_user(request.user):
        return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    user = get_object_or_404(User, pk=pk)
    serializer = AdminUserUpdateSerializer(user, data=request.data, partial=True, context={"request": request})
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    updated_user = serializer.save()

    # Use the unified serializer so the response mirrors list data
    serialized = UserSerializer(updated_user, context={"request": request}).data
    return Response(serialized, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def AdminUsersBulkDeleteView(request):
    if not PermissionHelpers.is_admin_user(request.user):
        return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    ids = request.data.get("ids", [])
    if not isinstance(ids, list):
        return Response({"detail": "Provide a list of user IDs"}, status=status.HTTP_400_BAD_REQUEST)

    users = User.objects.filter(id__in=ids)
    deleted_count = users.count()
    users.delete()
    return Response({"deleted": deleted_count}, status=status.HTTP_200_OK)


class EmployeeSelfProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, *args, **kwargs):
        if not PermissionHelpers.is_employee_user(request.user):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        data = UserSerializer(request.user, context={"request": request}).data
        return Response(data, status=status.HTTP_200_OK)

    def patch(self, request, *args, **kwargs):
        if not PermissionHelpers.is_employee_user(request.user):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        serializer = EmployeeSelfProfileSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        updated_user = serializer.save()
        data = UserSerializer(updated_user, context={"request": request}).data
        return Response(data, status=status.HTTP_200_OK)


class EmployeeDashboardView(APIView):
    """Minimal placeholder for /api/dashboard/employee/."""
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        payload = {
            "greeting": f"Hello {request.user.get_full_name() or request.user.username}",
            "stats": {"notifications": 0, "tasks": 0},
        }
        return Response(payload, status=status.HTTP_200_OK)