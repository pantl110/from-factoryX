from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager
from django.apps import apps
from django.contrib import auth
from django.contrib.auth.hashers import make_password
import uuid
from common.models import BaseModel


class CustomUserManager(UserManager):
    """Custom User Manager Definition"""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        """
        Create and save a user with the given email, email, and password.
        """
        if not email:
            raise ValueError("The given email must be set")
        # Lookup the real model class from the global app registry so this
        # manager method can be used in migrations. This is fine because
        # managers are by definition working on the real model.
        GlobalUserModel = apps.get_model(
            self.model._meta.app_label, self.model._meta.object_name
        )
        email = GlobalUserModel.normalize_username(email)
        user = self.model(email=email, **extra_fields)
        user.password = make_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_admin_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, type="관리자", **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(
            email, password, status=User.UserStatusChoice.admin, **extra_fields
        )

    def with_perm(
        self, perm, is_active=True, include_superusers=True, backend=None, obj=None
    ):
        if backend is None:
            backends = auth._get_backends(return_tuples=True)
            if len(backends) == 1:
                backend, _ = backends[0]
            else:
                raise ValueError(
                    "You have multiple authentication backends configured and "
                    "therefore must provide the `backend` argument."
                )
        elif not isinstance(backend, str):
            raise TypeError(
                "backend must be a dotted import path string (got %r)." % backend
            )
        else:
            backend = auth.load_backend(backend)
        if hasattr(backend, "with_perm"):
            return backend.with_perm(
                perm,
                is_active=is_active,
                include_superusers=include_superusers,
                obj=obj,
            )
        return self.none()


class User(AbstractUser):
    """Custom User Model Definition"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class UserStatusChoice(models.TextChoices):
        inactive = ("비활성유저", "비활성유저")  # 비활성
        active = ("활성유저", "활성유저")  # 정상
        admin = ("관리자", "관리자")  # 관리자
        withdraw = ("탈퇴유저", "탈퇴유저")  # 탈퇴

    objects = CustomUserManager()
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    first_name = models.CharField(
        max_length=150,
        editable=False,
    )
    last_name = models.CharField(
        max_length=150,
        editable=False,
    )
    username = models.CharField(
        max_length=150,
        editable=False,
    )
    email = models.EmailField(
        max_length=50,
        unique=True,
        help_text="이메일",
    )
    groups = models.ManyToManyField(
        "auth.Group",
        related_name="custom_user_set",  # change this related_name
        blank=True,
        help_text="The groups this user belongs to.",
        verbose_name="groups",
    )
    user_permissions = models.ManyToManyField(
        "auth.Permission",
        related_name="custom_user_permissions_set",  # change this related_name
        blank=True,
        help_text="Specific permissions for this user.",
        verbose_name="user permissions",
    )
    status = models.CharField(
        max_length=10,
        choices=UserStatusChoice.choices,
        default=UserStatusChoice.inactive,
        help_text="회원 유형",
    )
    phone_number = models.CharField(
        max_length=15,
        null=True,
        blank=True,
        help_text="전화번호",
    )
    profile_image = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="프로필 이미지",
    )
    terms_of_service = models.BooleanField(
        default=False,
        help_text="서비스 이용 약관 동의 여부",
    )
    privacy_policy_agreement = models.BooleanField(
        default=False,
        help_text="개인정보 처리 방침 동의 여부",
    )
    marketing_agreement = models.BooleanField(
        default=False,
        help_text="마케팅 정보 수신 동의 여부",
    )


class Jwt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User, related_name="login_user", on_delete=models.CASCADE, help_text="회원"
    )
    access = models.TextField(help_text="Access Token")
    refresh = models.TextField(help_text="Refresh Token")


class EmailVerification(BaseModel):
    class TypeChoice(models.TextChoices):
        SIGNUP = "signup", "회원가입"
        PASSWORD_RESET = "password_reset", "비밀번호 재설정"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(max_length=100, help_text="이메일")
    code = models.CharField(max_length=6, help_text="인증 코드")
    is_verified = models.BooleanField(default=False, help_text="인증 여부")
    verification_type = models.CharField(
        max_length=20,
        choices=TypeChoice.choices,
        default=TypeChoice.SIGNUP,
        help_text="인증 타입",
    )
