from ninja.errors import HttpError
from factory.models import Factory, FactoryEquipment
from factory.models import Factory, FactoryClient, FactoryMember
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.db.models import F
from django.db.models.functions import TruncDate


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
            factory = (
                await Factory.objects.prefetch_related(
                    "members", "subscription_histories__subscription"
                )
                .annotate(
                    trial_end_date=TruncDate(
                        F("created_at") + timedelta(days=settings.TRIAL_PERIOD_DAYS)
                    )
                )
                .aget(id=factory_id)
            )
        else:
            factory = (
                await Factory.objects.prefetch_related(
                    "members", "subscription_histories__subscription"
                )
                .annotate(
                    trial_end_date=TruncDate(
                        F("created_at") + timedelta(days=settings.TRIAL_PERIOD_DAYS)
                    )
                )
                .aget(id=factory_id, owner=user)
            )
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


#


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


def send_email_with_attachments(
    to_emails,
    subject,
    html_message=None,
    text_message=None,
    attachments=None,
    cc_emails=None,
    bcc_emails=None,
    from_email=None,
):
    """
    첨부파일을 포함한 이메일 발송 함수

    Args:
        to_emails (list): 수신자 이메일 주소 목록
        subject (str): 메일 제목
        html_message (str, optional): HTML 메시지 내용
        text_message (str, optional): 텍스트 메시지 내용
        attachments (list, optional): 첨부파일 리스트
            - dict 형태: {'filename': '파일명', 'content': bytes데이터, 'mimetype': 'MIME타입'}
            - 또는 파일 경로 문자열
        cc_emails (list, optional): 참조 이메일 주소 목록
        bcc_emails (list, optional): 숨은 참조 이메일 주소 목록
        from_email (str, optional): 발신자 이메일 (기본값: settings.DEFAULT_FROM_EMAIL)

    Returns:
        bool: 발송 성공 여부
    """
    from django.core.mail import EmailMultiAlternatives
    import os
    import mimetypes

    if not to_emails:
        print("수신자 이메일 주소가 없습니다.")
        return False

    if not isinstance(to_emails, list):
        to_emails = [to_emails]

    if not from_email:
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@factory-x.com")

    try:
        # AWS SES 사용 여부 확인
        if getattr(settings, "USE_SES", False):
            return _send_email_with_attachments_via_ses(
                to_emails,
                subject,
                html_message,
                text_message,
                attachments,
                cc_emails,
                bcc_emails,
                from_email,
            )
        else:
            return _send_email_with_attachments_via_django(
                to_emails,
                subject,
                html_message,
                text_message,
                attachments,
                cc_emails,
                bcc_emails,
                from_email,
            )
    except Exception as e:
        print(f"첨부파일 이메일 발송 실패: {to_emails}, 오류: {e}")
        return False


def _send_email_with_attachments_via_django(
    to_emails,
    subject,
    html_message,
    text_message,
    attachments,
    cc_emails,
    bcc_emails,
    from_email,
):
    """Django 기본 이메일 백엔드를 통한 첨부파일 포함 이메일 발송"""
    from django.core.mail import EmailMultiAlternatives
    import os
    import mimetypes

    # HTML만 있고 텍스트가 없는 경우 빈 텍스트 사용 (중복 방지)
    if html_message and not text_message:
        text_message = ""  # 빈 문자열로 설정하여 중복 방지
    elif not text_message and html_message:
        # HTML에서 텍스트 생성이 필요한 경우에만 생성
        import re

        text_message = re.sub("<[^<]+?>", "", html_message)
        text_message = re.sub(r"\n\s*\n", "\n\n", text_message).strip()

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_message or "",
        from_email=from_email,
        to=to_emails,
        cc=cc_emails or [],
        bcc=bcc_emails or [],
    )

    # HTML 메시지 추가
    if html_message:
        email.attach_alternative(html_message, "text/html")

    # 첨부파일 처리
    if attachments:
        for attachment in attachments:
            if isinstance(attachment, dict):
                # dict 형태: {'filename': '파일명', 'content': bytes, 'mimetype': 'MIME타입'}
                filename = attachment.get("filename")
                content = attachment.get("content")
                mimetype = attachment.get("mimetype")

                if not all([filename, content]):
                    print(f"첨부파일 정보 부족: {attachment}")
                    continue

                if not mimetype:
                    mimetype, _ = mimetypes.guess_type(filename)
                    if not mimetype:
                        mimetype = "application/octet-stream"

                email.attach(filename, content, mimetype)

            elif isinstance(attachment, str):
                # 파일 경로 문자열
                if os.path.exists(attachment):
                    with open(attachment, "rb") as f:
                        content = f.read()
                    filename = os.path.basename(attachment)
                    mimetype, _ = mimetypes.guess_type(attachment)
                    if not mimetype:
                        mimetype = "application/octet-stream"

                    email.attach(filename, content, mimetype)
                else:
                    print(f"첨부파일을 찾을 수 없습니다: {attachment}")

    email.send()
    print(f"첨부파일 포함 이메일 발송 완료 (Django): {to_emails}")
    return True


def _send_email_with_attachments_via_ses(
    to_emails,
    subject,
    html_message,
    text_message,
    attachments,
    cc_emails,
    bcc_emails,
    from_email,
):
    """AWS SES를 통한 첨부파일 포함 이메일 발송"""
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    from email.mime.application import MIMEApplication
    from email.mime.base import MIMEBase
    from email import encoders
    from user.backends import SESEmailService
    import os
    import mimetypes

    # 기본 텍스트 메시지가 없으면 HTML에서 생성
    if not text_message and html_message:
        import re

        text_message = re.sub("<[^<]+?>", "", html_message)
        text_message = re.sub(r"\n\s*\n", "\n\n", text_message).strip()

    # MIME 메시지 생성
    msg = MIMEMultipart()
    msg["From"] = from_email
    msg["To"] = ", ".join(to_emails)
    msg["Subject"] = subject

    if cc_emails:
        msg["Cc"] = ", ".join(cc_emails)

    # 텍스트 내용 추가
    # if text_message:
    #     msg.attach(MIMEText(text_message, "plain", "utf-8"))

    # HTML 내용 추가
    if html_message:
        msg.attach(MIMEText(html_message, "html", "utf-8"))

    # 첨부파일 처리
    if attachments:
        for attachment in attachments:
            if isinstance(attachment, dict):
                # dict 형태: {'filename': '파일명', 'content': bytes, 'mimetype': 'MIME타입'}
                filename = attachment.get("filename")
                content = attachment.get("content")
                mimetype = attachment.get("mimetype")

                if not all([filename, content]):
                    print(f"첨부파일 정보 부족: {attachment}")
                    continue

                if not mimetype:
                    mimetype, _ = mimetypes.guess_type(filename)
                    if not mimetype:
                        mimetype = "application/octet-stream"

                # MIME 타입에 따라 적절한 첨부파일 생성
                maintype, subtype = mimetype.split("/", 1)

                if maintype == "text":
                    part = MIMEText(content.decode("utf-8"), subtype)
                elif maintype == "application":
                    part = MIMEApplication(content, subtype)
                else:
                    part = MIMEBase(maintype, subtype)
                    part.set_payload(content)
                    encoders.encode_base64(part)

                part.add_header(
                    "Content-Disposition", f'attachment; filename="{filename}"'
                )
                msg.attach(part)

            elif isinstance(attachment, str):
                # 파일 경로 문자열
                if os.path.exists(attachment):
                    with open(attachment, "rb") as f:
                        content = f.read()
                    filename = os.path.basename(attachment)
                    mimetype, _ = mimetypes.guess_type(attachment)
                    if not mimetype:
                        mimetype = "application/octet-stream"

                    maintype, subtype = mimetype.split("/", 1)

                    if maintype == "text":
                        part = MIMEText(content.decode("utf-8"), subtype)
                    elif maintype == "application":
                        part = MIMEApplication(content, subtype)
                    else:
                        part = MIMEBase(maintype, subtype)
                        part.set_payload(content)
                        encoders.encode_base64(part)

                    part.add_header(
                        "Content-Disposition", f'attachment; filename="{filename}"'
                    )
                    msg.attach(part)
                else:
                    print(f"첨부파일을 찾을 수 없습니다: {attachment}")

    # SES를 통해 원시 이메일 발송
    ses_service = SESEmailService()

    destinations = to_emails.copy()
    if cc_emails:
        destinations.extend(cc_emails)
    if bcc_emails:
        destinations.extend(bcc_emails)

    response = ses_service.ses_client.send_raw_email(
        Source=from_email,
        Destinations=destinations,
        RawMessage={"Data": msg.as_string()},
    )

    print(f"첨부파일 포함 이메일 발송 완료 (SES): {to_emails}")
    return True


def create_inviting_data(email, role, invited_by):
    """초대 데이터 생성"""
    return {
        "email": email,
        "role": role,
        "invited_by": get_user_id(invited_by),
        "invited_at": timezone.now().isoformat(),
    }


# 사용 예제 함수들
def send_report_email_example(factory, report_data, recipients):
    """보고서 이메일 발송 예제"""
    import json
    from io import BytesIO
    import csv

    # CSV 보고서 생성 예제
    csv_buffer = BytesIO()
    writer = csv.writer(csv_buffer.getvalue().decode("utf-8").splitlines())
    writer.writerow(["항목", "값", "날짜"])
    for item in report_data:
        writer.writerow([item.get("name"), item.get("value"), item.get("date")])

    csv_content = csv_buffer.getvalue()

    # HTML 메시지 생성
    html_message = f"""
    <html>
    <body>
        <h2>{factory.name} 월간 보고서</h2>
        <p>안녕하세요,</p>
        <p>첨부된 파일에서 {factory.name}의 월간 보고서를 확인하실 수 있습니다.</p>
        <p>문의사항이 있으시면 언제든지 연락 주시기 바랍니다.</p>
        <br>
        <p>감사합니다.</p>
        <p>Factory X 팀</p>
    </body>
    </html>
    """

    # 첨부파일 리스트
    attachments = [
        {
            "filename": f"{factory.name}_monthly_report.csv",
            "content": csv_content,
            "mimetype": "text/csv",
        }
    ]

    return send_email_with_attachments(
        to_emails=recipients,
        subject=f"[Factory X] {factory.name} 월간 보고서",
        html_message=html_message,
        attachments=attachments,
    )


def send_document_email_example(to_email, document_path, message):
    """문서 첨부 이메일 발송 예제"""
    html_message = f"""
    <html>
    <body>
        <h2>문서 전송</h2>
        <p>{message}</p>
        <p>첨부된 문서를 확인해 주세요.</p>
        <br>
        <p>감사합니다.</p>
        <p>Factory X 팀</p>
    </body>
    </html>
    """

    return send_email_with_attachments(
        to_emails=[to_email],
        subject="[Factory X] 문서 전송",
        html_message=html_message,
        attachments=[document_path],  # 파일 경로 직접 전달
    )


def send_multi_attachment_email_example(recipients, files_data):
    """여러 첨부파일 이메일 발송 예제"""
    html_message = """
    <html>
    <body>
        <h2>여러 문서 전송</h2>
        <p>안녕하세요,</p>
        <p>요청하신 여러 문서들을 첨부하여 보내드립니다.</p>
        <ul>
    """

    attachments = []
    for file_data in files_data:
        filename = file_data.get("filename")
        html_message += f"<li>{filename}</li>"
        attachments.append(file_data)

    html_message += """
        </ul>
        <p>검토 후 피드백 부탁드립니다.</p>
        <br>
        <p>감사합니다.</p>
        <p>Factory X 팀</p>
    </body>
    </html>
    """

    return send_email_with_attachments(
        to_emails=recipients,
        subject="[Factory X] 문서 패키지 전송",
        html_message=html_message,
        attachments=attachments,
        cc_emails=["manager@factory-x.com"],  # 매니저에게 참조
    )
