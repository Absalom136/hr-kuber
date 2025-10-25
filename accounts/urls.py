# accounts/urls.py

from django.urls import path
from .views import SignupView

app_name = 'accounts'

urlpatterns = [
    path('register/', SignupView.as_view(), name='register'),
]