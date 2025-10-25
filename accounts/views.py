from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import authenticate, get_user_model
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

            return Response({
                'message': 'Signup successful',
                'username': user.username,
                'role': user.role,
                'token': token,
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    def post(self, request):
        identifier = request.data.get('username')  # could be username or email
        password = request.data.get('password')
        role = request.data.get('role')

        if not identifier or not password:
            return Response({'detail': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Try to resolve username from email
        try:
            user_obj = User.objects.get(email=identifier)
            username = user_obj.username
        except User.DoesNotExist:
            username = identifier

        user = authenticate(username=username, password=password)
        if user is None:
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        # Enforce role match
        if role and user.role.lower() != role.lower():
            return Response({'detail': f'Role mismatch: expected {user.role}'}, status=status.HTTP_403_FORBIDDEN)

        token = ''  # Replace with JWT token logic if needed
        return Response({
            'message': 'Login successful',
            'username': user.username,
            'role': user.role,
            'token': token,
        }, status=status.HTTP_200_OK)