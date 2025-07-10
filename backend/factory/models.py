from django.db import models
from user.models import User
from common.models import BaseModel


# Create your models here.
class Factory(BaseModel):

    owner = models.ForeignKey(User, related_name="factories", on_delete=models.CASCADE)

    name = models.CharField(
        max_length=100,
        help_text="팩토리 이름",
    )
    business_registration_number = models.CharField(
        max_length=12,
        null=True,
        blank=True,
        help_text="사업자등록번호 (예: 123-45-67890)",
    )
    representative_name = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="대표자명",
    )
    manager_email = models.EmailField(
        max_length=100,
        null=True,
        blank=True,
        help_text="담당자 이메일",
    )
    manager_phone = models.CharField(
        max_length=15,
        null=True,
        blank=True,
        help_text="담당자 연락처",
    )
    manager_fax = models.CharField(
        max_length=15,
        null=True,
        blank=True,
        help_text="담당자 팩스번호",
    )
    business_type = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="업태",
    )
    business_category = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="종목",
    )
    business_address = models.TextField(
        null=True,
        blank=True,
        help_text="사업장 주소",
    )
    is_trial = models.BooleanField(
        default=False,
        help_text="트라이얼 여부",
    )
    billing_key = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="결제 키",
    )


class FactoryEquipment(BaseModel):
    class EquipmentStatus(models.TextChoices):
        standby = ("가동 대기", "standby")
        running = ("가동 중", "running")

    factory = models.ForeignKey(
        Factory, related_name="equipments", on_delete=models.CASCADE
    )
    name = models.CharField(
        max_length=100,
        help_text="설비명",
    )
    status = models.CharField(
        max_length=10,
        choices=EquipmentStatus.choices,
        default=EquipmentStatus.standby,
    )
    priority = models.IntegerField(
        help_text="자동 배정 순위",
    )
    location = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="설비 위치",
    )
    note = models.TextField(
        null=True,
        blank=True,
        help_text="특이사항",
    )


class FactoryClient(BaseModel):
    class ClientType(models.TextChoices):
        customer = ("수주처", "customer")
        supplier = ("발주처", "supplier")

    factory = models.ForeignKey(
        Factory, related_name="clients", on_delete=models.CASCADE
    )
    name = models.CharField(
        max_length=100,
        help_text="회사명",
    )
    business_registration_number = models.CharField(
        max_length=12,
        null=True,
        blank=True,
        help_text="사업자등록번호 (예: 123-45-67890)",
    )
    representative_name = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="대표자명",
    )
    email = models.EmailField(
        max_length=100,
        null=True,
        blank=True,
        help_text="이메일",
    )
    phone = models.CharField(
        max_length=15,
        null=True,
        blank=True,
        help_text="전화번호",
    )
    fax = models.CharField(
        max_length=15,
        null=True,
        blank=True,
        help_text="팩스번호",
    )
    business_type = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="업태",
    )
    business_category = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="종목",
    )
    address = models.TextField(
        null=True,
        blank=True,
        help_text="주소",
    )
    manager = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="담당자",
    )
    note = models.TextField(
        null=True,
        blank=True,
        help_text="비고",
    )


class FactoryMember(BaseModel):
    """팩토리 멤버 및 초대 관리 (통합)"""

    class FactoryMemberType(models.TextChoices):
        admin = ("시스템 관리자", "admin")
        manager = ("운영자", "manager")
        viewer = ("조회자", "viewer")

    class MemberStatus(models.TextChoices):
        invited = ("초대됨", "invited")
        active = ("활성", "active")

    factory = models.ForeignKey(
        Factory, related_name="members", on_delete=models.CASCADE
    )
    user = models.ForeignKey(
        User,
        related_name="factory_members",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="팩토리 멤버 유저 (가입된 경우)",
    )
    email = models.EmailField(max_length=100, help_text="멤버/초대 이메일 주소")
    role = models.CharField(
        max_length=10,
        choices=FactoryMemberType.choices,
        default=FactoryMemberType.viewer,
        help_text="멤버 권한",
    )
    status = models.CharField(
        max_length=10,
        choices=MemberStatus.choices,
        default=MemberStatus.invited,
        help_text="멤버 상태",
    )
    invited_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="invited_factory_members",
        help_text="초대한 사용자",
    )
    invitation_token = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
        help_text="초대 토큰 (초대 상태일 때만)",
    )
    invitation_message = models.TextField(
        null=True, blank=True, help_text="초대 메시지"
    )
