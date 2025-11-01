from django.urls import path
from .views_api import csrf_view

urlpatterns = [
    path('', csrf_view, name='csrf'),
]