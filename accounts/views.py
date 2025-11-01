from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate, get_user_model, login
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .serializers import UserSignupSerializer

User = get_user_model()


class SignupView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = UserSignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # Optional: generate token if using JWT or DRF token auth
            token = ''  # Replace with actual token logic if needed

            return Response(
                {
                    "message": "Signup successful",
                    "username": user.username,
                    "role": getattr(user, "role", ""),
                    "token": token,
                    "avatar": user.avatar.url if getattr(user, "avatar", None) else "",
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    POST /api/auth/login/
    Expected JSON body: { username: <username or email>, password: <password>, role: <optional> }
    On success this view calls django.contrib.auth.login(request, user) so a sessionid cookie is set.
    """

    def post(self, request):
        identifier = request.data.get("username")  # could be username or email
        password = request.data.get("password")
        role = request.data.get("role")

        if not identifier or not password:
            return Response(
                {"detail": "Username and password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Try to resolve username from email
        try:
            user_obj = User.objects.get(email=identifier)
            username = user_obj.username
        except User.DoesNotExist:
            username = identifier

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        # Enforce role match if provided
        user_role = getattr(user, "role", None)
        if role and user_role and str(user_role).lower() != str(role).lower():
            return Response(
                {"detail": f"Role mismatch: expected {user_role}"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # IMPORTANT: create session for session-based auth
        login(request, user)

        token = ""  # Replace with JWT token logic if needed
        return Response(
            {
                "message": "Login successful",
                "username": user.username,
                "role": user_role or "",
                "token": token,
                "avatar": user.avatar.url if getattr(user, "avatar", None) else "",
            },
            status=status.HTTP_200_OK,
        )


# --- Admin / Users endpoints for frontend -------------------------------------------------
class AdminUsersListView(APIView):
    """
    GET /api/admin/users
    Returns list of users filtered to Admin and Employee roles (exclude Clients).
    Requires authentication. Additional permission checks (is_staff/is_superuser)
    are applied so only admins can list users.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Restrict to admin callers only
        if not getattr(request.user, "is_staff", False) and not getattr(request.user, "is_superuser", False):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        # Flexible role detection: adjust this logic if you store roles differently
        # Check both is_staff/is_superuser and membership in Employee group
        qs = User.objects.filter(
            Q(is_staff=True) | Q(is_superuser=True) | Q(groups__name__iexact="Employee")
        ).distinct().order_by("-date_joined")

        results = []
        for u in qs:
            # resolve role label
            if getattr(u, "is_superuser", False) or getattr(u, "is_staff", False):
                role_label = "Admin"
            elif u.groups.filter(name__iexact="Employee").exists():
                role_label = "Employee"
            else:
                role_label = getattr(u, "role", "") or "Client"

            # skip non-Admin/Employee just in case
            if role_label not in ("Admin", "Employee"):
                continue

            results.append(
                {
                    "id": u.id,
                    "username": getattr(u, "username", ""),
                    "first_name": getattr(u, "first_name", "") or getattr(u, "firstName", ""),
                    "last_name": getattr(u, "last_name", "") or getattr(u, "lastName", ""),
                    "email": getattr(u, "email", ""),
                    "date_joined": u.date_joined.isoformat() if getattr(u, "date_joined", None) else "",
                    "avatar_url": (u.avatar.url if getattr(u, "avatar", None) else getattr(u, "avatar_url", "")) or "",
                    "role": role_label,
                }
            )

        return Response(results, status=status.HTTP_200_OK)


class AdminUserDeleteView(APIView):
    """
    DELETE /api/admin/users/<pk>
    Allows admins to delete a user by id.
    """

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        # Restrict to admin callers only
        if not getattr(request.user, "is_staff", False) and not getattr(request.user, "is_superuser", False):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        user = get_object_or_404(User, pk=pk)

        # Prevent accidental self-delete or deleting superuser if desired
        if user.pk == request.user.pk:
            return Response({"detail": "Cannot delete yourself"}, status=status.HTTP_400_BAD_REQUEST)
        if getattr(user, "is_superuser", False) and not getattr(request.user, "is_superuser", False):
            return Response({"detail": "Cannot delete a superuser"}, status=status.HTTP_403_FORBIDDEN)

        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)