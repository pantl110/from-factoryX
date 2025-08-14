from ninja.errors import HttpError
from factory.models import Factory, FactoryEquipment
from factory.models import Factory, FactoryClient, FactoryMember
from datetime import datetime
from django.conf import settings


async def is_factory_member(factory_id: int, user=None):
    """공장 ID와 사용자로 공장 멤버 여부를 확인합니다."""
    try:
        member = await FactoryMember.objects.aget(factory_id=factory_id, user=user)
        return member
    except FactoryMember.DoesNotExist:
        raise HttpError(404, "해당 공장에 멤버가 아닙니다.")


async def require_factory_admin(factory_id: int, user=None):
    """공장 관리자 권한이 필요합니다."""
    try:
        member = await FactoryMember.objects.aget(factory_id=factory_id, user=user)
        if member.role != "admin":
            raise HttpError(403, "관리자 권한이 필요합니다.")
        return member
    except FactoryMember.DoesNotExist:
        raise HttpError(404, "해당 공장에 멤버가 아닙니다.")


async def require_factory_manager(factory_id: int, user=None):
    """공장 매니저 이상 권한이 필요합니다."""
    try:
        member = await FactoryMember.objects.aget(factory_id=factory_id, user=user)
        if member.role not in ["admin", "manager"]:
            raise HttpError(403, "매니저 이상 권한이 필요합니다.")
        return member
    except FactoryMember.DoesNotExist:
        raise HttpError(404, "해당 공장에 멤버가 아닙니다.")


async def require_factory_viewer(factory_id: int, user=None):
    """공장 조회자 이상 권한이 필요합니다."""
    try:
        member = await FactoryMember.objects.aget(factory_id=factory_id, user=user)
        if member.role not in ["admin", "manager", "viewer"]:
            raise HttpError(403, "조회자 이상 권한이 필요합니다.")
        return member
    except FactoryMember.DoesNotExist:
        raise HttpError(404, "해당 공장에 멤버가 아닙니다.")


def get_factory_permission_level(role: str) -> int:
    """권한 레벨을 숫자로 반환합니다."""
    permission_levels = {"viewer": 1, "manager": 2, "admin": 3}
    return permission_levels.get(role, 0)


async def has_factory_permission(
    factory_id: int, user=None, required_role: str = "viewer"
) -> bool:
    """사용자가 해당 공장에서 필요한 권한을 가지고 있는지 확인합니다."""
    try:
        member = await FactoryMember.objects.aget(factory_id=factory_id, user=user)
        user_level = get_factory_permission_level(member.role)
        required_level = get_factory_permission_level(required_role)
        return user_level >= required_level
    except FactoryMember.DoesNotExist:
        return False


async def get_factory_by_id(factory_id: int, user=None):
    """공장 ID로 공장을 조회하고 소유권을 검증합니다."""
    try:
        if user is None:
            factory = await Factory.objects.aget(id=factory_id)
        else:
            factory = await Factory.objects.aget(id=factory_id, owner=user)
        return factory
    except Factory.DoesNotExist:
        raise HttpError(404, "해당 공장이 존재하지 않습니다.")


async def verify_factory_ownership(factory_id: int, user=None):
    """공장 소유권을 검증합니다."""
    try:
        await Factory.objects.aget(id=factory_id, owner=user)
        return True
    except Factory.DoesNotExist:
        raise HttpError(404, "해당 공장이 존재하지 않거나 접근 권한이 없습니다.")


async def get_factory_eq_by_id(equipment_id: int, user=None):
    try:
        # Get equipment and ensure it belongs to a factory owned by the user
        equipment = await FactoryEquipment.objects.select_related("factory").aget(
            id=equipment_id, factory__owner=user
        )
        return equipment
    except FactoryEquipment.DoesNotExist:
        raise HttpError(404, "해당 설비가 존재하지 않습니다.")


# 거래처 관련 유틸리티 함수
async def get_factory_client_by_id(client_id: int, factory_id: int, user=None):
    """거래처 ID로 거래처를 조회하고 공장 소유권을 검증합니다."""
    try:
        if user is None:
            client = await FactoryClient.objects.aget(
                id=client_id, factory_id=factory_id
            )
        else:
            client = await FactoryClient.objects.aget(
                id=client_id, factory_id=factory_id, factory__owner=user
            )
        return client
    except FactoryClient.DoesNotExist:
        raise HttpError(404, "해당 거래처가 존재하지 않습니다.")


# 거래처 관련 유틸리티 함수
async def get_factory_clients_by_factory(factory_id: int, user=None):
    """공장의 모든 거래처를 조회합니다."""
    # 공장 소유권 검증
    await verify_factory_ownership(factory_id, user)

    clients = FactoryClient.objects.filter(
        factory_id=factory_id, factory__owner=user
    ).order_by("-created_at")
    return clients


async def search_factory_clients_by_factory(
    factory_id: int, user=None, search_query: str = ""
):
    """공장의 거래처를 검색합니다."""
    # 공장 소유권 검증
    await verify_factory_ownership(factory_id, user)

    from factory.schemas.inbound import FactoryClientFilter

    # FilterSchema를 사용하여 검색
    filter_schema = FactoryClientFilter()
    if search_query:
        # 검색어가 있으면 name, business_registration_number, representative_name에 대해 검색
        filter_schema.name = search_query
        filter_schema.business_registration_number = search_query
        filter_schema.representative_name = search_query

    queryset = FactoryClient.objects.filter(factory_id=factory_id, factory__owner=user)
    queryset = filter_schema.filter(queryset)

    return queryset.order_by("-created_at")


def get_user_id(user):
    """사용자 ID 추출"""
    try:
        if hasattr(user, "id"):
            return int(user.id)
        elif hasattr(user, "pk"):
            return int(user.pk)
        else:
            return 0
    except Exception:
        return 0


def create_invite_email_templates(factory, role, invited_by_user, invite_url):
    """초대 이메일 템플릿 생성"""
    html_message = _create_html_email(factory, role, invited_by_user, invite_url)
    text_message = _create_text_email(factory, role, invited_by_user, invite_url)
    return html_message, text_message


def _create_html_email(factory, role, invited_by_user, invite_url):
    """HTML 이메일 템플릿 생성"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Factory X 팩토리 초대</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50;">Factory X 팩토리 초대</h2>
            <p>안녕하세요! Factory X입니다.</p>
            <p><strong>{invited_by_user.email}</strong>님이 <strong>{factory.name}</strong> 팩토리에 초대했습니다.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #007bff; margin-top: 0;">초대 정보</h3>
                <ul style="list-style: none; padding: 0;">
                    <li style="margin-bottom: 10px;"><strong>팩토리명:</strong> {factory.name}</li>
                    <li style="margin-bottom: 10px;"><strong>역할:</strong> {role}</li>
                    <li style="margin-bottom: 10px;"><strong>초대자:</strong> {invited_by_user.email}</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{invite_url}" 
                   style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    가입하기
                </a>
            </div>
            
            <p style="color: #6c757d; font-size: 14px;">
                위 버튼을 클릭하거나 아래 링크를 복사하여 브라우저에 붙여넣어주세요:<br>
                <a href="{invite_url}" style="color: #007bff;">{invite_url}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            <p style="color: #6c757d; font-size: 12px;">
                Factory X 팀<br>
                이 이메일은 자동으로 발송된 메일입니다.
            </p>
        </div>
    </body>
    </html>
    """


def _create_text_email(factory, role, invited_by_user, invite_url):
    """텍스트 이메일 템플릿 생성"""
    return f"""
안녕하세요! Factory X입니다.

{invited_by_user.email}님이 {factory.name} 팩토리에 초대했습니다.

초대 정보:
- 팩토리명: {factory.name}
- 역할: {role}
- 초대자: {invited_by_user.email}

아래 링크를 클릭하여 가입을 완료해주세요:
{invite_url}

감사합니다.
Factory X 팀
    """


def send_invite_email(email, factory, role, invited_by_user):
    """팩토리 멤버 초대 이메일 발송"""
    subject = f"[Factory X] {factory.name} 팩토리 초대"
    invite_url = f"{settings.FRONTEND_URL}/invite?factory_id={factory.id}&email={email}&role={role}"

    html_message, text_message = create_invite_email_templates(
        factory, role, invited_by_user, invite_url
    )

    try:
        if getattr(settings, "USE_SES", False):
            return _send_email_via_ses(
                email, subject, html_message, text_message, factory
            )
        else:
            return _send_email_via_django(
                email, subject, html_message, text_message, factory
            )
    except Exception as e:
        print(f"초대 이메일 발송 실패: {email} -> {factory.name}, 오류: {e}")
        return False


def _send_email_via_ses(email, subject, html_message, text_message, factory):
    """AWS SES를 통한 이메일 발송"""
    from user.backends import SESEmailService

    ses_service = SESEmailService()
    success = ses_service.ses_client.send_email(
        Source=settings.DEFAULT_FROM_EMAIL,
        Destination={"ToAddresses": [email]},
        Message={
            "Subject": {"Data": subject, "Charset": "UTF-8"},
            "Body": {
                "Html": {"Data": html_message, "Charset": "UTF-8"},
                "Text": {"Data": text_message, "Charset": "UTF-8"},
            },
        },
    )
    print(f"초대 이메일 발송 완료 (SES): {email} -> {factory.name}")
    return True


def _send_email_via_django(email, subject, html_message, text_message, factory):
    """Django 기본 이메일 백엔드를 통한 이메일 발송"""
    from django.core.mail import send_mail

    send_mail(
        subject,
        text_message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False,
        html_message=html_message,
    )
    print(f"초대 이메일 발송 완료 (Console): {email} -> {factory.name}")
    return True


def create_inviting_data(email, role, invited_by):
    """초대 데이터 생성"""
    return {
        "email": email,
        "role": role,
        "invited_by": get_user_id(invited_by),
        "invited_at": datetime.now().isoformat(),
    }
