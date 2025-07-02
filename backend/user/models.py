from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager
from django.apps import apps
from django.contrib import auth
from django.contrib.auth.hashers import make_password
import uuid


class CustomUserManager(UserManager):
    """Custom User Manager Definition"""

    use_in_migrations = True

    def _create_user(self, username, password, **extra_fields):
        """
        Create and save a user with the given email, email, and password.
        """
        if not username:
            raise ValueError("The given username must be set")
        # Lookup the real model class from the global app registry so this
        # manager method can be used in migrations. This is fine because
        # managers are by definition working on the real model.
        GlobalUserModel = apps.get_model(
            self.model._meta.app_label, self.model._meta.object_name
        )
        username = GlobalUserModel.normalize_username(username)
        user = self.model(username=username, **extra_fields)
        user.password = make_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, username, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(username, password, **extra_fields)

    def create_admin_user(self, username, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(username, password, type="관리자", **extra_fields)

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(
            username, password, status=User.UserStatusChoice.admin, **extra_fields
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
        active = ("활성유저", "활성유저")  # 정상
        admin = ("관리자", "관리자")  # 관리자
        withdraw = ("탈퇴유저", "탈퇴유저")  # 탈퇴

    objects = CustomUserManager()
    USERNAME_FIELD = "username"
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
        unique=True,
        help_text="아이디",
    )
    email = models.EmailField(
        max_length=50,
        null=True,
        blank=True,
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
        default=UserStatusChoice.active,
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

    def __str__(self):
        return f"{self.username} ({self.get_status_display()})"
    
    def get_active_companies(self):
        """사용자가 속한 활성 회사들 반환"""
        return Company.objects.filter(
            user_invitations__user=self,
            user_invitations__invitation_status=UserCompanyInvitation.InvitationStatusChoice.completed
        )
    
    def get_company_permission(self, company):
        """특정 회사에서의 권한 조회"""
        try:
            invitation = UserCompanyInvitation.objects.get(
                user=self, 
                company=company,
                invitation_status=UserCompanyInvitation.InvitationStatusChoice.completed
            )
            return invitation.permission
        except UserCompanyInvitation.DoesNotExist:
            return None
    
    def is_company_member(self, company):
        """특정 회사의 활성 멤버인지 확인"""
        return UserCompanyInvitation.objects.filter(
            user=self,
            company=company,
            invitation_status=UserCompanyInvitation.InvitationStatusChoice.completed
        ).exists()
    
    def can_manage_company(self, company):
        """특정 회사 관리 권한 확인"""
        permission = self.get_company_permission(company)
        return permission == UserCompanyInvitation.PermissionChoice.system_admin
    
    def get_pending_invitations(self):
        """대기중인 초대 목록 반환"""
        return UserCompanyInvitation.objects.filter(
            user=self,
            invitation_status=UserCompanyInvitation.InvitationStatusChoice.pending
        )


class Jwt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User, related_name="login_user", on_delete=models.CASCADE, help_text="회원"
    )
    access = models.TextField(help_text="Access Token")
    refresh = models.TextField(help_text="Refresh Token")


class Company(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, help_text="회사명")
    business_registration_number = models.CharField(
        max_length=20, unique=True, help_text="사업자 등록번호"
    )
    ceo_name = models.CharField(max_length=50, help_text="대표자명")
    contact = models.CharField(max_length=100, help_text="연락망")
    business_type = models.CharField(max_length=50, help_text="업태")
    business_item = models.CharField(max_length=50, help_text="종목")
    address = models.CharField(max_length=200, help_text="회사주소지")

    def __str__(self):
        return f"{self.name} ({self.business_registration_number})"


class UserCompanyInvitation(models.Model):
    """사용자-회사 초대 테이블"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    class InvitationStatusChoice(models.TextChoices):
        pending = ("대기중", "대기중")  # 초대 이메일 발송됨, 확인 대기
        completed = ("완료", "완료")  # 사용자가 초대 확인하여 완료
        expired = ("만료", "만료")  # 초대 기간 만료

    class PermissionChoice(models.TextChoices):
        system_admin = ("시스템관리자", "시스템관리자")
        operator = ("운영자", "운영자")
        viewer = ("조회자", "조회자")

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="company_invitations",
        help_text="초대받은 사용자",
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="user_invitations",
        help_text="초대한 회사",
    )
    invitation_status = models.CharField(
        max_length=20,
        choices=InvitationStatusChoice.choices,
        default=InvitationStatusChoice.pending,
        help_text="초대 상태",
    )
    permission = models.CharField(
        max_length=20,
        choices=PermissionChoice.choices,
        default=PermissionChoice.viewer,
        help_text="부여할 권한",
    )
    invited_date = models.DateTimeField(
        auto_now_add=True, help_text="초대 날짜"
    )

    class Meta:
        unique_together = ("user", "company")
        verbose_name = "사용자-회사 초대"
        verbose_name_plural = "사용자-회사 초대"
        ordering = ["-invited_date"]

    def __str__(self):
        return f"{self.user.username} → {self.company.name} ({self.get_invitation_status_display()})"

    def is_active(self):
        """완료된 초대인지 확인"""
        return self.invitation_status == self.InvitationStatusChoice.completed

    def is_pending(self):
        """대기중인 초대인지 확인"""
        return self.invitation_status == self.InvitationStatusChoice.pending


class EmailVerification(models.Model):
    """이메일 인증 코드 관리"""
    
    class VerificationType(models.TextChoices):
        signup = ("signup", "signup")
        password_reset = ("password_reset", "password_reset")
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(help_text="인증 대상 이메일")
    code = models.CharField(max_length=6, help_text="인증 코드 (6자리)")
    verification_type = models.CharField(
        max_length=20,
        choices=VerificationType.choices,
        help_text="인증 타입"
    )
    is_verified = models.BooleanField(default=False, help_text="인증 완료 여부")
    expires_at = models.DateTimeField(help_text="만료 시간")
    created_at = models.DateTimeField(auto_now_add=True, help_text="생성 시간")
    
    class Meta:
        verbose_name = "이메일 인증"
        verbose_name_plural = "이메일 인증"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.email} - {self.code} ({self.get_verification_type_display()})"
    
    def is_expired(self):
        """인증 코드가 만료되었는지 확인"""
        from django.utils import timezone
        return timezone.now() > self.expires_at
    
    def is_valid(self):
        """인증 코드가 유효한지 확인"""
        return not self.is_expired() and not self.is_verified


