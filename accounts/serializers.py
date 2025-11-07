from django.contrib.auth import get_user_model
from rest_framework import serializers
from django.utils import timezone
from django.core.exceptions import ValidationError as DjangoValidationError

from .models import EmployeeProfile, Department

User = get_user_model()


class UserSignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password', 'role', 'avatar']
        extra_kwargs = {
            'email': {'required': True},
            'role': {'required': True},
            'username': {'required': True},
        }

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with that email already exists.')
        return value

    def validate(self, data):
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        avatar = validated_data.pop('avatar', None)

        user = User.objects.create_user(
            username=validated_data.get('username'),
            email=validated_data.get('email'),
            password=validated_data.get('password'),
            role=validated_data.get('role'),
        )

        if avatar:
            setattr(user, 'avatar', avatar)
            user.save()

        return user


class EmployeeProfileSerializer(serializers.ModelSerializer):
    department_name = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeProfile
        fields = [
            'id_number',
            'date_of_birth',
            'gender',
            'phone',
            'physical_address',
            'payroll_number',
            'department',
            'department_name',
            'position',
            'hire_date',
            'updated_on',
        ]
        read_only_fields = ['updated_on']

    def get_department_name(self, obj):
        return obj.department.name if obj.department else ''


class UserSerializer(serializers.ModelSerializer):
    """Serializer for admin/user listing used by the frontend."""

    avatar_url = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    date_joined = serializers.DateTimeField(format=None)

    # EmployeeProfile data surfaced at both top-level (for legacy frontend fields)
    # and nested under ``profile`` for richer consumers.
    profile = EmployeeProfileSerializer(read_only=True)
    id_number = serializers.SerializerMethodField()
    date_of_birth = serializers.SerializerMethodField()
    gender = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    physical_address = serializers.SerializerMethodField()
    payroll_number = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    position = serializers.SerializerMethodField()
    hire_date = serializers.SerializerMethodField()
    updated_on = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'date_joined',
            'avatar_url',
            'role',
            # Flattened EmployeeProfile fields expected by the frontend
            'id_number',
            'date_of_birth',
            'gender',
            'phone',
            'physical_address',
            'payroll_number',
            'department',
            'department_name',
            'position',
            'hire_date',
            'updated_on',
            # Nested profile data for new consumers
            'profile',
        )
        read_only_fields = fields

    def _get_profile(self, obj):
        if not hasattr(obj, 'profile'):
            return None
        return getattr(obj, 'profile')

    def _get_profile_attr(self, obj, attr, default=None):
        profile = self._get_profile(obj)
        if profile is None:
            return default
        return getattr(profile, attr, default)

    def get_avatar_url(self, obj):
        avatar = getattr(obj, 'avatar', None)
        if avatar:
            try:
                url = avatar.url
            except Exception:
                url = str(avatar)
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(url)
            return url or ''
        return getattr(obj, 'avatar_url', '') or ''

    def get_role(self, obj):
        role_field = getattr(obj, 'role', None)
        if role_field:
            return str(role_field)
        if getattr(obj, 'is_superuser', False) or getattr(obj, 'is_staff', False):
            return 'Admin'
        groups = getattr(obj, 'groups', None)
        if groups is not None:
            if groups.filter(name__iexact='Employee').exists():
                return 'Employee'
            if groups.filter(name__iexact='Admin').exists():
                return 'Admin'
        return 'Client'

    def get_id_number(self, obj):
        return self._get_profile_attr(obj, 'id_number')

    def get_date_of_birth(self, obj):
        return self._get_profile_attr(obj, 'date_of_birth')

    def get_gender(self, obj):
        return self._get_profile_attr(obj, 'gender')

    def get_phone(self, obj):
        return self._get_profile_attr(obj, 'phone')

    def get_physical_address(self, obj):
        return self._get_profile_attr(obj, 'physical_address')

    def get_payroll_number(self, obj):
        return self._get_profile_attr(obj, 'payroll_number')

    def get_department(self, obj):
        department = self._get_profile_attr(obj, 'department')
        if department is None:
            return None
        return department.pk

    def get_department_name(self, obj):
        department = self._get_profile_attr(obj, 'department')
        if department is None:
            return ''
        return department.name

    def get_position(self, obj):
        return self._get_profile_attr(obj, 'position')

    def get_hire_date(self, obj):
        return self._get_profile_attr(obj, 'hire_date')

    def get_updated_on(self, obj):
        return self._get_profile_attr(obj, 'updated_on')


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    # Flattened employee profile fields accepted at top level
    id_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    gender = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    physical_address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    payroll_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), required=False, allow_null=True)
    position = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    hire_date = serializers.DateField(required=False, allow_null=True)
    updated_on = serializers.DateTimeField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            'username',
            'first_name',
            'last_name',
            'email',
            'role',
            # EmployeeProfile fields
            'id_number',
            'date_of_birth',
            'gender',
            'phone',
            'physical_address',
            'payroll_number',
            'department',
            'position',
            'hire_date',
            'updated_on',
        ]
        extra_kwargs = {
            'email': {'required': False},
            'username': {'required': True},
        }

    def _pop_profile_fields(self, validated_data):
        """
        Extract only profile fields present in validated_data.
        This ensures we don't overwrite DB fields with None on partial updates.
        """
        profile_keys = {
            'id_number', 'date_of_birth', 'gender', 'phone', 'physical_address',
            'payroll_number', 'department', 'position', 'hire_date', 'updated_on'
        }
        profile_data = {}
        for k in list(validated_data.keys()):
            if k in profile_keys:
                profile_data[k] = validated_data.pop(k)
        return profile_data

    def update(self, instance, validated_data):
        # Update User fields only when provided
        user_fields = ['username', 'first_name', 'last_name', 'email', 'role']
        for field in user_fields:
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        instance.save()

        # Extract only explicitly provided profile fields and update/create profile
        profile_data = self._pop_profile_fields(validated_data)

        if profile_data:
            profile, _ = EmployeeProfile.objects.get_or_create(user=instance)

            # Handle department assignment if department provided as PK or instance
            if 'department' in profile_data:
                dept_val = profile_data.pop('department')
                if dept_val is None:
                    profile.department = None
                else:
                    # dept_val is already a Department instance thanks to PrimaryKeyRelatedField
                    profile.department = dept_val

            # Only set attributes that were explicitly present in the request
            for key, val in profile_data.items():
                # Avoid overwriting with None unless explicitly sent as null
                setattr(profile, key, val)

            # Ensure updated_on is present; if not provided, keep auto-managed timestamp
            if not getattr(profile, 'updated_on', None):
                profile.updated_on = timezone.now()

            # Validate model (convert Django ValidationError to serializer ValidationError)
            try:
                profile.full_clean()
            except DjangoValidationError as e:
                raise serializers.ValidationError({'profile': e.message_dict})

            profile.save()

        return instance


class EmployeeSelfProfileSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(required=False, allow_null=True)
    remove_avatar = serializers.BooleanField(required=False, write_only=True, default=False)
    remove_department = serializers.BooleanField(required=False, write_only=True, default=False)

    id_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    gender = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    physical_address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    payroll_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), required=False, allow_null=True)
    position = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    hire_date = serializers.DateField(required=False, allow_null=True)
    updated_on = serializers.DateTimeField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'email',
            'avatar',
            'remove_avatar',
            'remove_department',
            'id_number',
            'date_of_birth',
            'gender',
            'phone',
            'physical_address',
            'payroll_number',
            'department',
            'position',
            'hire_date',
            'updated_on',
        ]
        extra_kwargs = {
            'email': {'required': False},
            'remove_avatar': {'write_only': True},
            'remove_department': {'write_only': True},
        }

    def _pop_profile_fields(self, validated_data):
        profile_keys = {
            'id_number', 'date_of_birth', 'gender', 'phone', 'physical_address',
            'payroll_number', 'department', 'position', 'hire_date', 'updated_on'
        }
        profile_data = {}
        for key in list(validated_data.keys()):
            if key in profile_keys:
                profile_data[key] = validated_data.pop(key)
        return profile_data

    def update(self, instance, validated_data):
        remove_avatar = validated_data.pop('remove_avatar', False)
        remove_department = validated_data.pop('remove_department', False)
        avatar = validated_data.pop('avatar', None) if 'avatar' in validated_data else None

        for field in ['first_name', 'last_name', 'email']:
            if field in validated_data:
                setattr(instance, field, validated_data[field])

        if avatar is not None:
            instance.avatar = avatar
        elif remove_avatar:
            if getattr(instance, 'avatar', None):
                instance.avatar.delete(save=False)
            instance.avatar = None

        instance.save()

        profile_data = self._pop_profile_fields(validated_data)

        if profile_data:
            profile, _ = EmployeeProfile.objects.get_or_create(user=instance)

            if remove_department:
                profile.department = None
            elif 'department' in profile_data:
                dept_val = profile_data.pop('department')
                if not dept_val:
                    profile.department = None
                else:
                    profile.department = dept_val

            for date_field in ['date_of_birth', 'hire_date']:
                if date_field in profile_data and not profile_data[date_field]:
                    profile_data[date_field] = None

            for key, val in profile_data.items():
                setattr(profile, key, val)

            if not getattr(profile, 'updated_on', None):
                profile.updated_on = timezone.now()

            try:
                profile.full_clean()
            except DjangoValidationError as e:
                raise serializers.ValidationError({'profile': e.message_dict})

            profile.save()

        return instance