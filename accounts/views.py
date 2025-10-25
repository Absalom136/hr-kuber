from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSignupSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class SignupView(APIView):
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