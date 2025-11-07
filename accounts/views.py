from django.contrib.auth import authenticate, get_user_model, login
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated

from .serializers import (
    UserSignupSerializer,
    UserSerializer,
    AdminUserUpdateSerializer,
)
from .models import EmployeeProfile

User = get_user_model()


class SignupView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = UserSignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token = ""  # placeholder for token logic if you implement tokens
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
    def post(self, request):
        identifier = request.data.get("username")
        password = request.data.get("password")
        role = request.data.get("role")

        if not identifier or not password:
            return Response(
                {"detail": "Username and password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_obj = User.objects.get(email=identifier)
            username = user_obj.username
        except User.DoesNotExist:
            username = identifier

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        user_role = getattr(user, "role", None)
        if role and user_role and str(user_role).lower() != str(role).lower():
            return Response(
                {"detail": f"Role mismatch: expected {user_role}"},
                status=status.HTTP_403_FORBIDDEN,
            )

        login(request, user)
        token = ""
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


class AdminUsersListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only staff/superuser may access admin user listing
        if not request.user.is_staff and not request.user.is_superuser:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        qs = User.objects.filter(
            Q(is_staff=True) | Q(is_superuser=True) | Q(groups__name__iexact="Employee")
        ).distinct().order_by("-date_joined")

        results = []
        for u in qs:
            role_label = (
                "Admin" if u.is_superuser or u.is_staff
                else "Employee" if u.groups.filter(name__iexact="Employee").exists()
                else getattr(u, "role", "") or "Client"
            )
            if role_label not in ("Admin", "Employee"):
                continue

            results.append(UserSerializer(u, context={"request": request}).data)

        return Response(results, status=status.HTTP_200_OK)


class AdminUserDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        if not request.user.is_staff and not request.user.is_superuser:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        user = get_object_or_404(User, pk=pk)
        if user.pk == request.user.pk:
            return Response({"detail": "Cannot delete yourself"}, status=status.HTTP_400_BAD_REQUEST)
        if user.is_superuser and not request.user.is_superuser:
            return Response({"detail": "Cannot delete a superuser"}, status=status.HTTP_403_FORBIDDEN)

        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminUserUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if not request.user.is_staff and not request.user.is_superuser:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        user = get_object_or_404(User, pk=pk)
        serializer = AdminUserUpdateSerializer(user, data=request.data, partial=True, context={"request": request})
        if not serializer.is_valid():
            # Return full validation errors to help frontend show precise messages
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        updated_user = serializer.save()

        # Ensure profile exists and include its fields in the response
        try:
            profile, _ = EmployeeProfile.objects.get_or_create(user=updated_user)
            # ensure updated_on is present
            if not getattr(profile, "updated_on", None):
                profile.updated_on = timezone.now()
                profile.save()
        except Exception:
            profile = None

        out = UserSerializer(updated_user, context={"request": request}).data
        if profile is not None:
            out_profile = {
                "id_number": getattr(profile, "id_number", None),
                "date_of_birth": getattr(profile, "date_of_birth", None),
                "gender": getattr(profile, "gender", None),
                "phone": getattr(profile, "phone", None),
                "physical_address": getattr(profile, "physical_address", None),
                "payroll_number": getattr(profile, "payroll_number", None),
                "department": profile.department.id if getattr(profile, "department", None) else None,
                "position": getattr(profile, "position", ""),
                "hire_date": getattr(profile, "hire_date", None),
                "updated_on": getattr(profile, "updated_on", None),
            }
            out.update({"profile": out_profile})

        return Response(out, status=status.HTTP_200_OK)


class AdminUsersBulkDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.is_staff and not request.user.is_superuser:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        ids = request.data.get("ids", [])
        if not isinstance(ids, list):
            return Response({"detail": "Provide a list of user IDs"}, status=status.HTTP_400_BAD_REQUEST)

        users = User.objects.filter(id__in=ids)
        deleted_count = users.count()
        users.delete()
        return Response({"deleted": deleted_count}, status=status.HTTP_200_OK)