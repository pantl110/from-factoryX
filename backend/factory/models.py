from django.db import models
from user.models import User
from common.models import BaseModel


# Create your models here.
class Factory(BaseModel):

    owner = models.ForeignKey(User, related_name="factories", on_delete=models.CASCADE)

    name = models.CharField(
        null=True,
        blank=True,
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
    billing_key = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="결제 키",
    )
    inviting = models.JSONField(
        default=list, blank=True, help_text="초대 중인 이메일 목록"
    )


class FactoryEquipment(BaseModel):
    class EquipmentStatus(models.TextChoices):
        standby = ("standby", "가동 대기")
        running = ("running", "가동 중")

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
    # class ClientType(models.TextChoices):
    #     customer = ("customer", "수주처")
    #     supplier = ("supplier", "발주처")

    factory = models.ForeignKey(
        Factory, related_name="clients", on_delete=models.CASCADE
    )
    is_customer = models.BooleanField(
        default=False,
        help_text="수주처 역할 여부",
    )
    is_supplier = models.BooleanField(
        default=False,
        help_text="발주처 역할 여부",
    )

    # type = models.CharField(
    #     max_length=10,
    #     choices=ClientType.choices,
    #     default=ClientType.customer,
    #     help_text="타입",
    # )

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
        admin = ("admin", "시스템 관리자")
        manager = ("manager", "운영자")
        viewer = ("viewer", "조회자")

    class MemberStatus(models.TextChoices):
        invited = ("invited", "초대됨")
        active = ("active", "활성")

    factory = models.ForeignKey(
        Factory, related_name="members", on_delete=models.CASCADE
    )
    user = models.ForeignKey(
        User,
        related_name="factory_members",
        on_delete=models.CASCADE,
        help_text="팩토리 멤버 유저 (가입된 경우)",
    )
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
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="invited_factory_members",
        help_text="초대한 사용자",
    )
    invited_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="초대 일시",
    )
    invitation_token = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
        help_text="초대 토큰 (초대 상태일 때만) 필요하다면 사용",
    )
    invitation_message = models.TextField(
        null=True, blank=True, help_text="초대 메시지"
    )
    # 바로빌 회원정보
    is_barobill_user = models.BooleanField(
        default=False,
        help_text="바로빌 사용자 여부",
    )
    barobill_id = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="바로빌 ID",
    )
    barobill_password = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="바로빌 비밀번호",
    )
