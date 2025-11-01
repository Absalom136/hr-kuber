from django.contrib.auth import get_user_model
from rest_framework import serializers

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


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for admin/user listing used by the frontend.
    Fields: id, username, first_name, last_name, email, date_joined, avatar_url, role
    """
    avatar_url = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    date_joined = serializers.DateTimeField(format=None)

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email', 'date_joined', 'avatar_url', 'role')
        read_only_fields = fields

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