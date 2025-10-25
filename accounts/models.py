# E:\Projects\Python\hr-kuber\accounts\models.py

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    class Roles(models.TextChoices):
        ADMIN = 'Admin', _('Admin')
        EMPLOYEE = 'Employee', _('Employee')
        CLIENT = 'Client', _('Client')

    role = models.CharField(
        max_length=20,
        choices=Roles.choices,
        default=Roles.EMPLOYEE,
        help_text=_("User role type"),
    )
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _("Department")
        verbose_name_plural = _("Departments")


class EmployeeProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name=_("User")
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_("Department")
    )
    position = models.CharField(max_length=100)
    hire_date = models.DateField()

    def __str__(self):
        return f"{self.user.username} - {self.position}"

    class Meta:
        verbose_name = _("Employee Profile")
        verbose_name_plural = _("Employee Profiles")
